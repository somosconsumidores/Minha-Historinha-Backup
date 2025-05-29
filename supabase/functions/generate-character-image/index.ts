import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Translation mapping (remains the same)
const translateToEnglish = {
  'Masculino': 'Male',
  'Feminino': 'Female',
  'Outro': 'Non-binary',
  'pele clara': 'light skin',
  'pele escura': 'dark skin',
  'pele morena': 'brown skin',
  'pele negra': 'black skin',
  'pele branca': 'white skin',
  'pele amarela': 'asian skin',
  'castanho': 'brown',
  'castanho escuro': 'dark brown',
  'castanho claro': 'light brown',
  'preto': 'black',
  'loiro': 'blonde',
  'ruivo': 'red',
  'grisalho': 'gray',
  'branco': 'white',
  'cacheado': 'curly',
  'liso': 'straight',
  'ondulado': 'wavy',
  'curto': 'short',
  'longo': 'long',
  'médio': 'medium length',
  'cacheado e curto': 'short curly',
  'liso e longo': 'long straight',
  'castanhos': 'brown',
  'azuis': 'blue',
  'verdes': 'green',
  'pretos': 'black',
  'cinzas': 'gray',
  'amendoados': 'hazel'
};

const translateText = (text: string): string => {
  if (!text) return text;
  const lowerText = text.toLowerCase();
  if (translateToEnglish[lowerText]) {
    return translateToEnglish[lowerText];
  }
  for (const [portuguese, english] of Object.entries(translateToEnglish)) {
    if (lowerText.includes(portuguese.toLowerCase())) {
      return english;
    }
  }
  return text;
};

const validateCharacter = (character: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!character.nome || character.nome.trim() === '') {
    errors.push('Character name is required');
  }
  if (!character.idade || character.idade < 1 || character.idade > 100) {
    errors.push('Valid age is required (1-100)');
  }
  if (!character.sexo) {
    errors.push('Gender is required');
  }
  if (!character.cor_pele || character.cor_pele.trim() === '') {
    errors.push('Skin color is required');
  }
  if (!character.cor_cabelo || character.cor_cabelo.trim() === '') {
    errors.push('Hair color is required');
  }
  if (!character.cor_olhos || character.cor_olhos.trim() === '') {
    errors.push('Eye color is required');
  }
  if (!character.estilo_cabelo || character.estilo_cabelo.trim() === '') {
    errors.push('Hair style is required');
  }
  return { isValid: errors.length === 0, errors };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    console.log('Raw request body for generate-character-image:', JSON.stringify(rawBody, null, 2));
    const { character } = rawBody;

    if (!character) {
      return new Response(JSON.stringify({ error: 'Character data is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Character object after destructuring for image generation:', JSON.stringify(character, null, 2));

    const validation = validateCharacter(character);
    if (!validation.isValid) {
      console.error('Character validation failed:', validation.errors);
      return new Response(JSON.stringify({ error: 'Invalid character data', details: validation.errors }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const translatedGender = translateText(character.sexo);
    const translatedSkinColor = translateText(character.cor_pele);
    const translatedHairColor = translateText(character.cor_cabelo);
    const translatedEyeColor = translateText(character.cor_olhos);
    const translatedHairStyle = translateText(character.estilo_cabelo);

    const prompt = `Create a character in the style Pixar/Disney 3D based EXACTLY on this physical description : name ${character.nome}, ${character.idade} years old, ${translatedGender}, with ${translatedSkinColor}, ${translatedHairColor} hair in ${translatedHairStyle} style, and ${translatedEyeColor} eyes, front view only.Never ask feedback about the choice of the image.`;
    console.log('Generated English prompt:', prompt);

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'hd', style: 'vivid' }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse OpenAI error response.'}}));
      console.error('OpenAI API error details:', JSON.stringify(errorData, null, 2));
      let errorMessage = errorData.error?.message || 'Failed to generate image';
      if (errorData.error?.type === 'image_generation_user_error') {
        errorMessage = 'The image prompt contains content that violates OpenAI policies. Please try with different character attributes.';
      }
      return new Response(JSON.stringify({ error: errorMessage, details: errorData }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error('Invalid response from OpenAI:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response format from OpenAI');
    }
    
    const imageUrl = data.data[0].url;
    console.log('Image generated successfully:', imageUrl);

    return new Response(JSON.stringify({ imageUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in generate-character-image function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});