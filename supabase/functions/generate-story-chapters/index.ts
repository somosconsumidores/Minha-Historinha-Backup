// supabase/functions/generate-story-chapters/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const reqJson = await req.json(); // Renamed rawBody to reqJson for clarity with instructions
    console.log('--- generate-story-chapters ---');
    console.log('Received request body:', JSON.stringify(reqJson, null, 2));
    
    const { storyTitle, character, characterId } = reqJson;
    console.log('Extracted storyTitle:', storyTitle);
    console.log('Extracted characterId:', characterId);
    console.log('Extracted character:', JSON.stringify(character, null, 2));

    if (!storyTitle || !character || !characterId) {
      console.log('Missing required parameters:', { storyTitle, character, characterId })
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: storyTitle, character, characterId',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    // Validate character object properties (ensure you adjust these to your actual needs)
    if (!character.nome || !character.idade || !character.sexo || !character.cor_pele || !character.cor_cabelo || !character.cor_olhos || !character.estilo_cabelo) {
        console.log('Missing required fields within character object:', character);
        return new Response( JSON.stringify({ error: 'Missing required fields within character object for prompt generation.'}), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: urlData, error: urlError } = supabase
      .storage
      .from('character-images')
      .getPublicUrl(`${characterId}.png`)
    if (urlError) {
      console.error('Erro ao obter URL de imagem:', urlError)
      throw new Error('Não foi possível obter a URL da imagem do personagem')
    }
    const characterImageUrl = urlData.publicUrl
    console.log(`Image URL: ${characterImageUrl}`)

    // Using character.cor_pele, character.cor_cabelo, character.cor_olhos, character.estilo_cabelo as per your provided character object structure
    const prompt = `Crie uma história infantil completa dividida em exatamente 10 capítulos curtos baseada no título: "${storyTitle}"

Personagem principal:
- Nome: ${character.nome}
- Idade: ${character.idade} anos
- Sexo: ${character.sexo}
- Aparência: Pele ${character.cor_pele}, cabelo ${character.cor_cabelo}, olhos ${character.cor_olhos}, estilo ${character.estilo_cabelo}
- Referência de imagem do personagem: ${characterImageUrl}

Cada capítulo deve:
- Ter entre 100-150 palavras
- Ser adequado para crianças de 3-8 anos
- Ter uma lição educativa sutil
- Ser conectado com o próximo capítulo
- Incluir elementos mágicos e divertidos

Retorne APENAS um JSON válido no formato:
{
  "chapters": [
    "Texto completo do capítulo 1...",
    // ... até o capítulo 10
  ]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4', // Consider making this configurable or using a newer model if available
        messages: [
          {
            role: 'system',
            content: 'Você é um contador de histórias especializado em literatura infantil educativa e envolvente.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 3000, // Ensure this is adequate for 10 chapters
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text(); // Read the error body for more details
      console.error("OpenAI API error response:", errorBody);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }
    const data = await response.json()
    const content = data.choices[0].message.content

    let chapters: string[]
    try {
      const parsed = JSON.parse(content)
      chapters = parsed.chapters
      if (!Array.isArray(chapters) || chapters.length !== 10) {
        console.error('Parsed chapters format error. Expected array of 10 strings. Received:', chapters);
        throw new Error('Formato de chapters inválido ou não contém 10 capítulos.');
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse dos capítulos JSON da OpenAI:', parseError, "Content received:", content);
      throw new Error('Formato de resposta inválido da IA para os capítulos.');
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Token de autorização não fornecido')
      throw new Error('Usuário não autenticado, não é possível salvar a história.')
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      console.error('Erro de autenticação ou usuário não encontrado:', userError)
      throw new Error('Usuário não autenticado ou token inválido, não é possível salvar a história.')
    }

    const storyToInsert = {
      title: storyTitle,
      character_id: characterId,
      user_id: user.id,
      chapter_1: chapters[0],
      chapter_2: chapters[1],
      chapter_3: chapters[2],
      chapter_4: chapters[3],
      chapter_5: chapters[4],
      chapter_6: chapters[5],
      chapter_7: chapters[6],
      chapter_8: chapters[7],
      chapter_9: chapters[8],
      chapter_10: chapters[9],
    };
    console.log('Data to be inserted into generated_stories:', JSON.stringify(storyToInsert, null, 2));

    const { data: storyData, error: storyError } = await supabase
      .from('generated_stories')
      .insert(storyToInsert) // Corrected this line
      .select('id') // Select the ID of the newly inserted row
      .single()

    if (storyError) {
      console.error('Erro ao salvar história:', storyError)
      throw new Error('Erro ao salvar história no banco de dados. Detalhes: ' + storyError.message)
    }
     if (!storyData) {
      console.error('No data returned after insert, storyError was null. This should not happen if insert was successful and select().single() was used.');
      throw new Error('Falha ao salvar a história, nenhum dado retornado após a inserção.');
    }


    return new Response(
      JSON.stringify({
        chapters,
        storyId: storyData.id,
        message: 'História gerada e salva com sucesso!',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Erro fatal em generate-story-chapters:', error.message, error.stack ? error.stack : 'No stack available');
    return new Response(
      JSON.stringify({
        error: 'Erro ao gerar capítulos da história',
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})