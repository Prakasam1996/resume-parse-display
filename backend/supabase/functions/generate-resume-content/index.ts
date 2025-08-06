import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Gemini API Key exists:', !!geminiApiKey);
    
    if (!geminiApiKey) {
      // Return a fallback response without AI enhancement
      return new Response(JSON.stringify({ 
        enhancedSummary: "Professional summary enhancement requires Gemini API key configuration.",
        improvedExperiences: [],
        skillSuggestions: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Generating resume content with Gemini 2.0 Flash for prompt length:', prompt.length);

    const enhancedPrompt = `You are an elite resume writer and career strategist with 95% success rate. Enhance the provided resume data to create compelling, professional, and ATS-optimized content.

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown, no explanations
- Achieve 90%+ accuracy in content enhancement
- Create compelling, quantified achievements
- Use powerful action verbs and industry keywords
- Ensure ATS compatibility

INPUT DATA:
${prompt}

REQUIRED OUTPUT FORMAT:
{
  "enhancedSummary": "Compelling 3-4 sentence professional summary with quantified achievements and industry keywords",
  "improvedExperiences": [
    {
      "description": "Enhanced job description with quantified achievements, strong action verbs, and impact metrics"
    }
  ],
  "skillSuggestions": ["Relevant technical skill", "Important soft skill", "Industry certification", "Trending technology"]
}

ENHANCEMENT GUIDELINES:
1. Add realistic metrics and percentages where missing
2. Transform responsibilities into achievements
3. Include industry-relevant keywords
4. Use powerful action verbs (achieved, optimized, spearheaded, etc.)
5. Focus on business impact and results
6. Ensure descriptions are 50-100 words each
7. Make content compelling yet truthful

Generate enhanced content that significantly improves the resume's impact:`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 2048,
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
      console.error('Gemini API Error:', response.status, errorData);
      
      // Return fallback content
      return new Response(JSON.stringify({
        enhancedSummary: "Enhanced professional summary (AI enhancement temporarily unavailable)",
        improvedExperiences: [],
        skillSuggestions: ["Consider adding relevant technical skills", "Include soft skills", "Add industry certifications"]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    const generatedContent = data.candidates[0].content.parts[0].text;
    
    console.log('Generated content:', generatedContent);

    let parsedContent;
    try {
      // Clean the response in case there's any markdown formatting
      const cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      // Return fallback if parsing fails
      parsedContent = {
        enhancedSummary: generatedContent.includes('summary') ? generatedContent : "Enhanced professional summary",
        improvedExperiences: [],
        skillSuggestions: []
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-resume-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      enhancedSummary: "Error occurred during enhancement",
      improvedExperiences: [],
      skillSuggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});