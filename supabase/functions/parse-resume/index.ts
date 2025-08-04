import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('OpenAI API Key exists:', !!openAIApiKey);
    console.log('API Key length:', openAIApiKey?.length || 0);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a PDF, DOC, or DOCX file.');
    }

    // Extract text from file (simplified)
    const fileText = await extractTextFromFile(file);
    
    // Try parsing with OpenAI first, fallback to basic parsing
    let parsedData;
    if (openAIApiKey) {
      try {
        parsedData = await parseResumeWithAI(fileText);
      } catch (error) {
        console.log('OpenAI parsing failed, using fallback parser:', error.message);
        parsedData = parseResumeBasic(fileText);
      }
    } else {
      console.log('No OpenAI key, using basic parser');
      parsedData = parseResumeBasic(fileText);
    }
    
    // Calculate scores
    const scores = calculateScores(parsedData);

    return new Response(JSON.stringify({ 
      ...parsedData,
      overall_score: scores.overall,
      skills_score: scores.skills,
      experience_score: scores.experience,
      education_score: scores.education
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-resume function:', error);

    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractTextFromFile(file: File): Promise<string> {
  console.log('Extracting text from file:', file.name, 'Type:', file.type, 'Size:', file.size);
  
  try {
    if (file.type === 'application/pdf') {
      // For PDF files, try to extract text as plain text
      // Note: This is a basic approach. For production, use pdf-parse library
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      
      // Extract readable text between common PDF markers
      let extractedText = '';
      const lines = text.split('\n');
      
      for (const line of lines) {
        // Skip binary data and extract readable text
        if (line.trim() && 
            !line.includes('%PDF') && 
            !line.includes('obj') && 
            !line.includes('stream') && 
            !line.includes('endstream') &&
            /[a-zA-Z]/.test(line)) {
          extractedText += line + '\n';
        }
      }
      
      if (extractedText.trim().length > 50) {
        console.log('PDF text extracted successfully, length:', extractedText.length);
        return extractedText.trim();
      }
    } else if (file.type.includes('word') || file.type.includes('document')) {
      // For DOC/DOCX files, attempt basic text extraction
      const text = await file.text();
      if (text && text.length > 50) {
        console.log('Document text extracted successfully, length:', text.length);
        return text;
      }
    } else {
      // For other text-based files
      const text = await file.text();
      if (text && text.length > 10) {
        console.log('Text file extracted successfully, length:', text.length);
        return text;
      }
    }
    
    // If extraction fails, throw an error
    throw new Error('Unable to extract readable text from the uploaded file');
    
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Failed to extract text from resume file: ${error.message}`);
  }
}

async function parseResumeWithAI(resumeText: string) {
  const MAX_RETRIES = 3;
  const INITIAL_DELAY = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Parsing attempt ${attempt}/${MAX_RETRIES}`);
      
      const prompt = `
You are an expert resume parser. Parse the following resume text and extract structured information.
Return the data in the exact JSON format specified below.

Resume text:
${resumeText}

Please extract and return ONLY a valid JSON object with this exact structure:
{
  "personal_info": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "website": ""
  },
  "summary": "",
  "skills": [
    {
      "name": "",
      "level": 85,
      "category": "Technical"
    }
  ],
  "experience": [
    {
      "company": "",
      "position": "",
      "startDate": "",
      "endDate": "",
      "description": "",
      "achievements": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "year": "",
      "gpa": ""
    }
  ],
  "languages": [
    {
      "name": "",
      "proficiency": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ]
}

Ensure all fields are filled with relevant data from the resume. If information is not available, use empty strings or empty arrays.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional resume parser. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', response.status, errorData);
        
        if (response.status === 429) {
          if (attempt === MAX_RETRIES) {
            throw new Error('Rate limit exceeded after multiple attempts. Please check your OpenAI billing and usage limits, or try again later.');
          }
          
          const delay = INITIAL_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Rate limit hit, waiting ${delay}ms before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        } else if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
        } else if (response.status === 403) {
          throw new Error('OpenAI API access forbidden. Please check your API key permissions and billing status.');
        } else {
          throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Failed to parse resume data');
      }
      
    } catch (error) {
      if (attempt === MAX_RETRIES || !error.message.includes('Rate limit')) {
        throw error;
      }
      
      // Wait before retry for non-rate-limit errors
      console.log(`Attempt ${attempt} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}

function parseResumeBasic(resumeText: string) {
  console.log('Using basic parser for resume text');
  console.log('Resume text length:', resumeText.length);
  
  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Helper functions for pattern matching
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const linkedinRegex = /linkedin\.com\/in\/[^\s]+/gi;
  const websiteRegex = /https?:\/\/[^\s]+/gi;
  
  // Extract personal info
  const emails = resumeText.match(emailRegex) || [];
  const phones = resumeText.match(phoneRegex) || [];
  const linkedins = resumeText.match(linkedinRegex) || [];
  const websites = resumeText.match(websiteRegex) || [];
  
  console.log('Found emails:', emails);
  console.log('Found phones:', phones);
  
  // Find name (usually first meaningful line that looks like a name)
  let name = '';
  for (const line of lines) {
    // Look for lines that could be names - typically at the start
    if (line.length > 2 && line.length < 50 && 
        !emailRegex.test(line) && !phoneRegex.test(line) && 
        !line.toLowerCase().includes('resume') &&
        !line.toLowerCase().includes('cv') &&
        !/^\d/.test(line) && // doesn't start with number
        /^[A-Za-z\s\-\.]+$/.test(line) && // only letters, spaces, hyphens, dots
        line.split(' ').length >= 2 && line.split(' ').length <= 4) {
      name = line;
      break;
    }
  }
  
  // Extract skills with broader matching
  const skills = [];
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node', 'html', 'css', 'sql', 'aws', 'docker', 'git',
    'typescript', 'angular', 'vue', 'mongodb', 'postgresql', 'mysql', 'express', 'spring',
    'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'flutter', 'xamarin',
    'photoshop', 'illustrator', 'figma', 'sketch', 'autocad', 'excel', 'powerpoint', 'word',
    'azure', 'gcp', 'kubernetes', 'jenkins', 'terraform', 'ansible', 'linux', 'windows'
  ];
  
  const skillsSection = resumeText.toLowerCase();
  const foundSkills = new Set();
  
  for (const skill of skillKeywords) {
    if (skillsSection.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }
  
  Array.from(foundSkills).forEach(skill => {
    skills.push({
      name: skill.charAt(0).toUpperCase() + skill.slice(1),
      level: Math.floor(Math.random() * 30) + 70,
      category: determineSkillCategory(skill)
    });
  });
  
  // Extract experience with better pattern matching
  const experience = [];
  const yearRegex = /20\d{2}/g;
  const years = resumeText.match(yearRegex) || [];
  
  // Look for experience section
  const experienceKeywords = ['experience', 'employment', 'work history', 'career', 'professional'];
  const lines_lower = lines.map(l => l.toLowerCase());
  
  let experienceStartIndex = -1;
  for (let i = 0; i < lines_lower.length; i++) {
    if (experienceKeywords.some(keyword => lines_lower[i].includes(keyword))) {
      experienceStartIndex = i;
      break;
    }
  }
  
  if (experienceStartIndex !== -1) {
    // Extract experience entries
    const experienceLines = lines.slice(experienceStartIndex + 1, experienceStartIndex + 20);
    
    let currentJob = null;
    for (const line of experienceLines) {
      // Look for company/position patterns
      if (line.length > 10 && line.length < 100 && 
          !emailRegex.test(line) && !phoneRegex.test(line)) {
        
        // Check if line contains year pattern (likely a job entry)
        const hasYear = /20\d{2}/.test(line);
        if (hasYear || (line.includes('•') || line.includes('-'))) {
          if (currentJob) {
            experience.push(currentJob);
          }
          
          currentJob = {
            company: extractCompanyName(line),
            position: extractPosition(line),
            startDate: extractStartDate(line, years),
            endDate: extractEndDate(line, years),
            description: line,
            achievements: []
          };
        } else if (currentJob && (line.startsWith('•') || line.startsWith('-'))) {
          currentJob.achievements.push(line.replace(/^[•\-]\s*/, ''));
        }
      }
    }
    
    if (currentJob) {
      experience.push(currentJob);
    }
  }
  
  // Extract education
  const education = [];
  const educationKeywords = ['education', 'qualification', 'academic', 'degree', 'university', 'college', 'school'];
  
  let educationStartIndex = -1;
  for (let i = 0; i < lines_lower.length; i++) {
    if (educationKeywords.some(keyword => lines_lower[i].includes(keyword))) {
      educationStartIndex = i;
      break;
    }
  }
  
  if (educationStartIndex !== -1) {
    const educationLines = lines.slice(educationStartIndex + 1, educationStartIndex + 10);
    
    for (const line of educationLines) {
      if (line.length > 10 && (
          line.toLowerCase().includes('bachelor') ||
          line.toLowerCase().includes('master') ||
          line.toLowerCase().includes('phd') ||
          line.toLowerCase().includes('degree') ||
          line.toLowerCase().includes('university') ||
          line.toLowerCase().includes('college')
        )) {
        
        education.push({
          institution: extractInstitution(line),
          degree: extractDegree(line),
          field: extractField(line),
          year: extractYear(line, years),
          gpa: ''
        });
        break;
      }
    }
  }
  
  // Extract certifications
  const certifications = [];
  const certKeywords = ['certification', 'certificate', 'certified', 'license'];
  
  for (const line of lines) {
    if (certKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
      certifications.push({
        name: line,
        issuer: '',
        date: extractYear(line, years) || ''
      });
    }
  }
  
  // Extract languages
  const languages = [{ name: 'English', proficiency: 'Native' }];
  const languageKeywords = ['spanish', 'french', 'german', 'chinese', 'japanese', 'hindi', 'arabic'];
  
  for (const keyword of languageKeywords) {
    if (resumeText.toLowerCase().includes(keyword)) {
      languages.push({
        name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        proficiency: 'Conversational'
      });
    }
  }
  
  // Generate summary from available text
  let summary = 'Professional with experience in various domains.';
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  
  for (let i = 0; i < lines_lower.length; i++) {
    if (summaryKeywords.some(keyword => lines_lower[i].includes(keyword))) {
      const summaryLine = lines[i + 1];
      if (summaryLine && summaryLine.length > 20) {
        summary = summaryLine;
        break;
      }
    }
  }
  
  console.log('Parsed data:', {
    name,
    emails: emails.length,
    phones: phones.length,
    skills: skills.length,
    experience: experience.length,
    education: education.length
  });
  
  return {
    personal_info: {
      name: name || 'Name not found',
      email: emails[0] || '',
      phone: phones[0] || '',
      location: extractLocation(resumeText),
      linkedin: linkedins[0] || '',
      website: websites.find(url => !url.includes('linkedin')) || ''
    },
    summary,
    skills,
    experience,
    education,
    languages,
    certifications
  };
}

function determineSkillCategory(skill: string): string {
  const technical = ['javascript', 'python', 'java', 'react', 'node', 'html', 'css', 'sql', 'typescript', 'angular', 'vue'];
  const design = ['photoshop', 'illustrator', 'figma', 'sketch'];
  const cloud = ['aws', 'azure', 'gcp'];
  
  if (technical.includes(skill.toLowerCase())) return 'Technical';
  if (design.includes(skill.toLowerCase())) return 'Design';
  if (cloud.includes(skill.toLowerCase())) return 'Cloud';
  return 'Other';
}

function extractCompanyName(line: string): string {
  // Simple extraction - take first part before common separators
  const parts = line.split(/[|•\-]/);
  return parts[0].trim() || 'Company Name';
}

function extractPosition(line: string): string {
  // Look for position after company name
  const parts = line.split(/[|•\-]/);
  return parts[1]?.trim() || 'Position';
}

function extractStartDate(line: string, years: string[]): string {
  const matches = line.match(/20\d{2}/g);
  return matches ? matches[0] : years[0] || '2020';
}

function extractEndDate(line: string, years: string[]): string {
  const matches = line.match(/20\d{2}/g);
  if (matches && matches.length > 1) {
    return matches[matches.length - 1];
  }
  return line.toLowerCase().includes('present') ? 'Present' : years[years.length - 1] || '2024';
}

function extractInstitution(line: string): string {
  // Extract university/college name
  const parts = line.split(/[,\-|]/);
  for (const part of parts) {
    if (part.toLowerCase().includes('university') || 
        part.toLowerCase().includes('college') ||
        part.toLowerCase().includes('institute')) {
      return part.trim();
    }
  }
  return parts[0].trim() || 'Educational Institution';
}

function extractDegree(line: string): string {
  const degreePatterns = ['bachelor', 'master', 'phd', 'doctorate', 'diploma', 'certificate'];
  for (const pattern of degreePatterns) {
    if (line.toLowerCase().includes(pattern)) {
      return pattern.charAt(0).toUpperCase() + pattern.slice(1);
    }
  }
  return 'Degree';
}

function extractField(line: string): string {
  const fields = ['computer science', 'engineering', 'business', 'science', 'arts', 'medicine'];
  for (const field of fields) {
    if (line.toLowerCase().includes(field)) {
      return field.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  }
  return 'Field of Study';
}

function extractYear(line: string, years: string[]): string {
  const matches = line.match(/20\d{2}/g);
  return matches ? matches[0] : years[0] || '';
}

function extractLocation(text: string): string {
  // Simple location extraction
  const locationKeywords = ['address', 'location', 'city', 'state'];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (locationKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
      return line.trim();
    }
  }
  
  // Look for patterns like "City, State" or "City, Country"
  const locationPattern = /[A-Z][a-z]+,\s*[A-Z][a-z]+/g;
  const matches = text.match(locationPattern);
  return matches ? matches[0] : '';
}

function calculateScores(parsedData: any) {
  // Calculate scores based on resume content
  const skillsScore = Math.min(90, Math.max(40, parsedData.skills?.length * 15 || 0));
  const experienceScore = Math.min(95, Math.max(30, parsedData.experience?.length * 25 || 0));
  const educationScore = Math.min(85, Math.max(50, parsedData.education?.length * 30 || 0));
  const overall = Math.round((skillsScore + experienceScore + educationScore) / 3);

  return {
    overall,
    skills: skillsScore,
    experience: experienceScore,
    education: educationScore
  };
}