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
    // Parse and extract all required fields (including characterImageUrl)
    const { storyTitle, character, characterId, characterImageUrl } = await req.json()

    // Validate presence of all required parameters
    if (!storyTitle || !character || !characterId || !characterImageUrl) {
      console.log('Missing required parameters:', { storyTitle, character, characterId, characterImageUrl })
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: storyTitle, character, characterId, characterImageUrl',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    // Criar cliente Supabase (service role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Gerando capítulos para: ${storyTitle}`)

    // Monta prompt incluindo a URL de referência do personagem
    const prompt = `Crie uma história infantil completa dividida em exatamente 10 capítulos curtos baseada no título: "${storyTitle}"

Personagem principal:
- Nome: ${character.nome}
- Idade: ${character.idade} anos
- Sexo: ${character.sexo}
- Aparência: Pele ${character.corPele}, cabelo ${character.corCabelo}, olhos ${character.corOlhos}
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
    "Texto completo do capítulo 2...",
    // ... até o capítulo 10
  ]
}`

    // Chama a API de chat do OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um contador de histórias especializado em literatura infantil educativa e envolvente.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    console.log('Capítulos gerados:', content)

    // Parse da resposta JSON
    let chapters: string[]
    try {
      const parsed = JSON.parse(content)
      chapters = parsed.chapters
      if (!Array.isArray(chapters) || chapters.length !== 10) {
        throw new Error('Formato de chapters inválido')
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse dos capítulos:', parseError)
      throw new Error('Formato de resposta inválido da IA')
    }

    // Obter token de autorização e usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Token de autorização não fornecido no cabeçalho')
      throw new Error('Token de autorização não fornecido')
    }
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('Erro de autenticação ou usuário não encontrado:', userError)
      throw new Error('Usuário não autenticado')
    }

    console.log('Usuário autenticado:', user.id)

    // Salvar a história e capítulos no banco
    const { data: storyData, error: storyError } = await supabase
      .from('generated_stories')
      .insert({
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
      })
      .select()
      .single()

    if (storyError) {
      console.error('Erro ao salvar história:', storyError)
      throw new Error('Erro ao salvar história no banco de dados')
    }

    console.log('História salva com sucesso:', storyData.id)

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
    console.error('Erro ao gerar capítulos:', error)
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
