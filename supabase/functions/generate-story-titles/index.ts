
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { characterName, characterGender } = await req.json()

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    console.log(`Gerando títulos para personagem: ${characterName}, sexo: ${characterGender}`)

    // Criar prompts diferentes baseados no gênero
    const genderSpecificPrompt = characterGender === 'Feminino' 
      ? 'histórias infantis para meninas, com temas como amizade, aventuras mágicas, princesas modernas, descobertas científicas, arte e criatividade'
      : characterGender === 'Masculino'
      ? 'histórias infantis para meninos, com temas como aventuras, heróis, exploração, esportes, ciência e descobertas'
      : 'histórias infantis universais, com temas como amizade, aventuras, descobertas e diversão'

    const prompt = `Crie exatamente 5 títulos de ${genderSpecificPrompt} protagonizadas por um personagem chamado ${characterName}. 

    Cada título deve ser:
    - Adequado para crianças de 3-8 anos
    - Educativo e divertido
    - Único e criativo
    - Máximo de 8 palavras

    Retorne APENAS um JSON válido no formato:
    {
      "titles": [
        {
          "id": "1",
          "title": "Título da História 1",
          "description": "Breve descrição da aventura"
        },
        {
          "id": "2", 
          "title": "Título da História 2",
          "description": "Breve descrição da aventura"
        },
        // ... mais 3 títulos
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
            content: 'Você é um especialista em literatura infantil que cria títulos envolventes e educativos para crianças.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    console.log('Resposta da OpenAI:', content)

    // Parse da resposta JSON
    let titles
    try {
      const parsedContent = JSON.parse(content)
      titles = parsedContent.titles
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', parseError)
      throw new Error('Formato de resposta inválido da IA')
    }

    return new Response(
      JSON.stringify({ titles }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao gerar títulos:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar títulos de histórias',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
