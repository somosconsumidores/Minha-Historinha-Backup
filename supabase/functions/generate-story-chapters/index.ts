
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
    const { storyTitle, character, characterId } = await req.json()

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Gerando capítulos para: ${storyTitle}`)

    const prompt = `Crie uma história infantil completa dividida em exatamente 10 capítulos curtos baseada no título: "${storyTitle}"

    Personagem principal:
    - Nome: ${character.nome}
    - Idade: ${character.idade} anos
    - Sexo: ${character.sexo}
    - Aparência: Pele ${character.corPele}, cabelo ${character.corCabelo}, olhos ${character.corOlhos}

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
        // ... 8 capítulos restantes
      ]
    }`

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
            content: 'Você é um contador de histórias especializado em literatura infantil educativa e envolvente.'
          },
          {
            role: 'user',
            content: prompt
          }
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
    let chapters
    try {
      const parsedContent = JSON.parse(content)
      chapters = parsedContent.chapters
    } catch (parseError) {
      console.error('Erro ao fazer parse dos capítulos:', parseError)
      throw new Error('Formato de resposta inválido da IA')
    }

    // Obter o token de autorização do cabeçalho
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Token de autorização não fornecido no cabeçalho')
      throw new Error('Token de autorização não fornecido')
    }

    console.log('Token de autorização recebido:', authHeader.substring(0, 20) + '...')

    // Obter o usuário autenticado usando o token do cabeçalho
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError)
      throw new Error(`Erro de autenticação: ${userError.message}`)
    }
    
    if (!user) {
      console.error('Usuário não encontrado')
      throw new Error('Usuário não autenticado')
    }

    console.log('Usuário autenticado:', user.id)

    // Salvar a história na tabela generated_stories
    const { data: storyData, error: storyError } = await supabase
      .from('generated_stories')
      .insert({
        title: storyTitle,
        character_id: characterId,
        user_id: user.id,
        chapter_1: chapters[0] || '',
        chapter_2: chapters[1] || '',
        chapter_3: chapters[2] || '',
        chapter_4: chapters[3] || '',
        chapter_5: chapters[4] || '',
        chapter_6: chapters[5] || '',
        chapter_7: chapters[6] || '',
        chapter_8: chapters[7] || '',
        chapter_9: chapters[8] || '',
        chapter_10: chapters[9] || '',
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
        message: 'História gerada e salva com sucesso!' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao gerar capítulos:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar capítulos da história',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
