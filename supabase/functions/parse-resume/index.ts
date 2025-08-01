import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { resumeId, filePath } = await req.json();
    
    if (!resumeId || !filePath) {
      throw new Error('Resume ID and file path are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(filePath);

    if (downloadError) {
      throw new Error('Failed to download resume file');
    }

    // Convert file to text (simplified - in reality you'd use proper PDF/DOC parsers)
    const fileText = await extractTextFromFile(fileData, filePath);
    
    // Use OpenAI to parse the resume
    const parsedData = await parseResumeWithAI(fileText);
    
    // Calculate scores
    const scores = calculateScores(parsedData);

    // Update the resume record with parsed data
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        personal_info: parsedData.personalInfo,
        summary: parsedData.summary,
        skills: parsedData.skills,
        experience: parsedData.experience,
        education: parsedData.education,
        languages: parsedData.languages,
        certifications: parsedData.certifications,
        overall_score: scores.overall,
        skills_score: scores.skills,
        experience_score: scores.experience,
        education_score: scores.education,
        processing_status: 'completed'
      })
      .eq('id', resumeId);

    if (updateError) {
      throw new Error('Failed to update resume data');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Resume parsed successfully',
      data: parsedData,
      scores 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    
    // Update resume status to failed
    if (req.body) {
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
    }

    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractTextFromFile(fileData: Blob, filePath: string): Promise<string> {
  // This is a simplified text extraction
  // In production, you'd use proper libraries like pdf-parse for PDFs
  // and mammoth for DOCX files
  
  const text = await fileData.text();
  return text || "Sample resume text content for parsing...";
}

async function parseResumeWithAI(resumeText: string) {
  const prompt = `
You are an expert resume parser. Parse the following resume text and extract structured information.
Return the data in the exact JSON format specified below.

Resume text:
${resumeText}

Please extract and return ONLY a valid JSON object with this exact structure:
{
  "personalInfo": {
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
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Failed to parse resume data');
  }
}

function calculateScores(parsedData: any) {
  // Calculate scores based on resume content
  const skillsScore = Math.min(90, Math.max(40, parsedData.skills.length * 15));
  const experienceScore = Math.min(95, Math.max(30, parsedData.experience.length * 25));
  const educationScore = Math.min(85, Math.max(50, parsedData.education.length * 30));
  const overall = Math.round((skillsScore + experienceScore + educationScore) / 3);

  return {
    overall,
    skills: skillsScore,
    experience: experienceScore,
    education: educationScore
  };
}