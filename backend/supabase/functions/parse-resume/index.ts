import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { resumeId, filePath } = await req.json();

    if (!resumeId || !filePath) {
      throw new Error('Resume ID and file path are required');
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to text
    const text = await fileData.text();
    console.log('File content extracted, length:', text.length);

    let parseResult;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // Try Gemini 2.0 Flash parsing first if API key is available
    if (geminiApiKey) {
      try {
        console.log('Attempting Gemini 2.0 Flash parsing...');
        parseResult = await parseResumeWithGemini(text, geminiApiKey);
        console.log('Gemini parsing successful');
      } catch (geminiError) {
        console.log('Gemini parsing failed, falling back to basic parsing:', geminiError.message);
        parseResult = parseResumeBasic(text);
      }
    } else {
      console.log('No Gemini API key found, using basic parsing');
      parseResult = parseResumeBasic(text);
    }

    // Calculate scores
    const scores = calculateScores(parseResult);

    // Update the resume record with parsed data
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        processing_status: 'completed',
        personal_info: parseResult.personalInfo,
        skills: parseResult.skills,
        experience: parseResult.experience,
        education: parseResult.education,
        certifications: parseResult.certifications,
        languages: parseResult.languages,
        summary: parseResult.summary,
        skills_score: scores.skillsScore,
        experience_score: scores.experienceScore,
        education_score: scores.educationScore,
        overall_score: scores.overallScore,
        processing_error: null
      })
      .eq('id', resumeId);

    if (updateError) {
      throw new Error(`Failed to update resume: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Resume parsed successfully',
      data: parseResult,
      scores: scores
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-resume function:', error);

    // Update status to failed if we have resumeId
    try {
      const { resumeId } = await req.json();
      if (resumeId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('resumes')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message 
          })
          .eq('id', resumeId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function parseResumeWithGemini(content: string, apiKey: string) {
  const prompt = `You are an expert resume parser with 95% accuracy. Parse the following resume content and extract structured data in EXACT JSON format.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown, no explanations
- Be extremely precise in data extraction
- Extract ALL available information accurately
- Use consistent date formats
- Group related skills logically
- Extract complete experience descriptions

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "name": "Full Name (extracted exactly as written)",
    "email": "email@example.com (exact email found)", 
    "phone": "phone number (formatted consistently)"
  },
  "skills": ["skill1", "skill2", "skill3", ...] (comprehensive list of technical and soft skills),
  "experience": [
    {
      "company": "Company Name (exact name)",
      "position": "Job Title (exact title)", 
      "duration": "Start Date - End Date (standardized format)",
      "description": "Complete description with all achievements and responsibilities"
    }
  ],
  "education": [
    {
      "institution": "School/University (full name)",
      "degree": "Degree Type and Name",
      "field": "Field of study/Major",
      "year": "Graduation Year"
    }
  ],
  "certifications": ["certification1", "certification2", ...] (all certifications, licenses),
  "languages": ["language1", "language2", ...] (all languages mentioned),
  "summary": "Comprehensive professional summary extracted or intelligently composed from content"
}

RESUME CONTENT TO PARSE:
${content}

Extract with maximum accuracy and completeness. Return ONLY the JSON object:`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 1,
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API error:', response.status, errorData);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response structure from Gemini API');
  }

  const content_result = data.candidates[0].content.parts[0].text;
  
  try {
    // Clean the response in case there's any markdown formatting
    const cleanedContent = content_result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('Failed to parse Gemini response as JSON:', content_result);
    throw new Error('Invalid JSON response from Gemini');
  }
}

function parseResumeBasic(content: string) {
  console.log('Starting basic resume parsing...');
  
  // Initialize result structure
  const result = {
    personalInfo: {
      name: '',
      email: '',
      phone: ''
    },
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    summary: ''
  };

  // Extract email with improved patterns
  const emailPatterns = [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  ];
  
  for (const pattern of emailPatterns) {
    const emailMatch = content.match(pattern);
    if (emailMatch) {
      result.personalInfo.email = emailMatch[0];
      break;
    }
  }

  // Extract phone number with improved patterns
  const phonePatterns = [
    /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /(\+\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g,
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = content.match(pattern);
    if (phoneMatch) {
      result.personalInfo.phone = phoneMatch[0].trim();
      break;
    }
  }

  // Extract name with improved logic
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    
    // Skip lines that contain common header keywords or contact info
    if (line.includes('@') || 
        /\d{3}/.test(line) || 
        /resume|cv|curriculum|vitae/i.test(line) ||
        /phone|email|address|location/i.test(line) ||
        line.length < 3 || line.length > 50) {
      continue;
    }
    
    // Look for a line with 2-5 words that could be a name
    const words = line.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 2 && words.length <= 5) {
      // Check if words look like a name (mostly alphabetic)
      const nameWords = words.filter(word => /^[A-Za-z][A-Za-z.']*$/.test(word));
      if (nameWords.length >= 2 && nameWords.length === words.length) {
        result.personalInfo.name = nameWords.join(' ');
        break;
      }
    }
  }

  // Extract skills with better parsing
  const skillsSection = extractSection(content, ['skills', 'technical skills', 'core competencies', 'expertise', 'technologies']);
  if (skillsSection) {
    const skillItems = skillsSection
      .split(/[,\n•\-\*\|]/)
      .map(skill => skill.trim().replace(/^\W+/, '').replace(/\W+$/, ''))
      .filter(skill => skill.length > 1 && skill.length < 50 && !/^\d+$/.test(skill))
      .slice(0, 20); // Limit to 20 skills
    result.skills = [...new Set(skillItems)]; // Remove duplicates
  }

  // Extract experience with enhanced parsing
  const experienceSection = extractSection(content, ['experience', 'work experience', 'professional experience', 'employment history', 'career history']);
  if (experienceSection) {
    const experiences = parseExperienceSection(experienceSection);
    result.experience = experiences;
  }

  // Extract education with better parsing
  const educationSection = extractSection(content, ['education', 'academic background', 'qualifications', 'academic qualifications']);
  if (educationSection) {
    const educationItems = parseEducationSection(educationSection);
    result.education = educationItems;
  }

  // Extract certifications with improved parsing
  const certSection = extractSection(content, ['certifications', 'certificates', 'professional certifications', 'licenses']);
  if (certSection) {
    const certItems = certSection
      .split(/[\n•\-\*\|]/)
      .map(cert => cert.trim().replace(/^\W+/, '').replace(/\W+$/, ''))
      .filter(cert => cert.length > 3 && cert.length < 100)
      .slice(0, 10); // Limit to 10 certifications
    result.certifications = [...new Set(certItems)];
  }

  // Extract languages with improved parsing
  const langSection = extractSection(content, ['languages', 'language skills', 'foreign languages']);
  if (langSection) {
    const langItems = langSection
      .split(/[,\n•\-\*\|]/)
      .map(lang => lang.trim().replace(/^\W+/, '').replace(/\W+$/, ''))
      .filter(lang => lang.length > 1 && lang.length < 30)
      .slice(0, 10); // Limit to 10 languages
    result.languages = [...new Set(langItems)];
  }

  // Generate summary from content with better logic
  result.summary = generateSummaryFromContent(content);

  console.log('Basic parsing completed:', result);
  return result;
}

function extractSection(content: string, keywords: string[]): string | null {
  const lines = content.split('\n');
  let startIndex = -1;
  let endIndex = lines.length;

  // Find the start of the section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    if (keywords.some(keyword => line.includes(keyword.toLowerCase()))) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) return null;

  // Find the end of the section (next major heading)
  const nextSectionKeywords = ['experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'references'];
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    const isNextSection = nextSectionKeywords.some(keyword => 
      line === keyword || 
      (line.startsWith(keyword) && line.length < keyword.length + 10)
    );
    
    if (isNextSection && !keywords.some(keyword => line.includes(keyword.toLowerCase()))) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n').trim();
}

function parseExperienceSection(section: string) {
  const experiences = [];
  const chunks = section.split(/\n\s*\n/); // Split by empty lines
  
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) continue;
    
    const experience = {
      company: '',
      position: '',
      duration: '',
      description: ''
    };
    
    // Try to identify company, position, and duration from first few lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      
      // Look for date patterns
      if (/\d{4}/.test(line) && (line.includes('-') || line.includes('to') || line.includes('present'))) {
        experience.duration = line;
        continue;
      }
      
      // Company or position (heuristic based approach)
      if (!experience.position) {
        experience.position = line;
      } else if (!experience.company) {
        experience.company = line;
      }
    }
    
    // Remaining lines are description
    const descLines = lines.slice(2).filter(line => 
      !line.includes(experience.duration) && 
      line !== experience.company && 
      line !== experience.position
    );
    experience.description = descLines.join(' ');
    
    if (experience.position || experience.company) {
      experiences.push(experience);
    }
  }
  
  return experiences;
}

function parseEducationSection(section: string) {
  const educationItems = [];
  const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    if (line.length < 10) continue; // Skip short lines
    
    const education = {
      institution: '',
      degree: '',
      field: '',
      year: ''
    };
    
    // Extract year
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      education.year = yearMatch[0];
    }
    
    // Look for degree keywords
    const degreeKeywords = ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'associate', 'doctorate'];
    const degreeMatch = degreeKeywords.find(keyword => 
      line.toLowerCase().includes(keyword)
    );
    
    if (degreeMatch) {
      // Try to extract the full degree name
      const degreeRegex = new RegExp(`\\b[^,]*${degreeMatch}[^,]*\\b`, 'i');
      const match = line.match(degreeRegex);
      if (match) {
        education.degree = match[0].trim();
      }
    }
    
    // Institution is usually the remaining text
    education.institution = line.replace(education.degree, '').replace(education.year, '').trim();
    education.institution = education.institution.replace(/[,\-]+/g, ' ').trim();
    
    if (education.institution || education.degree) {
      educationItems.push(education);
    }
  }
  
  return educationItems;
}

function generateSummaryFromContent(content: string): string {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 50);
  
  // Look for summary/objective sections
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      // Return the next few lines as summary
      const summaryLines = lines.slice(i + 1, i + 4).filter(line => 
        line.length > 20 && 
        !line.includes('@') && 
        !/^\d/.test(line)
      );
      if (summaryLines.length > 0) {
        return summaryLines.join(' ').substring(0, 500);
      }
    }
  }
  
  // If no summary section found, create one from the content
  const contentWords = content.split(/\s+/).filter(word => 
    word.length > 3 && 
    !/^\d+$/.test(word) &&
    !word.includes('@')
  );
  
  return `Professional with experience in ${contentWords.slice(10, 20).join(', ').toLowerCase()}.`;
}

function calculateScores(parseResult: any) {
  const scores = {
    skillsScore: 0,
    experienceScore: 0,
    educationScore: 0,
    overallScore: 0
  };

  // Skills score (0-100)
  if (parseResult.skills && parseResult.skills.length > 0) {
    scores.skillsScore = Math.min(100, parseResult.skills.length * 10);
  }

  // Experience score (0-100)
  if (parseResult.experience && parseResult.experience.length > 0) {
    const expScore = parseResult.experience.length * 20;
    const descScore = parseResult.experience.filter(exp => exp.description && exp.description.length > 50).length * 10;
    scores.experienceScore = Math.min(100, expScore + descScore);
  }

  // Education score (0-100)
  if (parseResult.education && parseResult.education.length > 0) {
    scores.educationScore = Math.min(100, parseResult.education.length * 30);
  }

  // Overall score
  scores.overallScore = Math.round((scores.skillsScore + scores.experienceScore + scores.educationScore) / 3);

  return scores;
}