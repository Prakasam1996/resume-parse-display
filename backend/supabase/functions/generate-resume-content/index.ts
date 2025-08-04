import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    console.log('OpenAI API Key exists:', !!openAIApiKey);
    
    if (!openAIApiKey) {
      // Return a fallback response without AI enhancement
      return new Response(JSON.stringify({ 
        enhancedSummary: "Professional summary enhancement requires OpenAI API key configuration.",
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

    console.log('Generating resume content with AI for prompt length:', prompt.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a professional resume writer and career advisor. Help enhance resume content to be more compelling, professional, and ATS-friendly. 

Always respond in valid JSON format with these exact keys:
- enhancedSummary: string
- improvedExperiences: array of objects with "description" field
- skillSuggestions: array of strings

Make the content:
1. Professional and compelling
2. Quantified where possible (use realistic numbers if none provided)
3. Action-oriented with strong verbs
4. Industry-relevant keywords
5. ATS-friendly formatting

Focus on achievements and impact rather than just responsibilities.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      
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
    const generatedContent = data.choices[0].message.content;
    
    console.log('Generated content:', generatedContent);

    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
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