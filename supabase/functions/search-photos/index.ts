import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, query, image } = await req.json();
    
    if (!eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as mídias do evento
    const { data: mediaData, error: mediaError } = await supabase
      .from('media')
      .select('id, file_url, file_type')
      .eq('event_id', eventId)
      .eq('file_type', 'photo');

    if (mediaError) throw mediaError;
    if (!mediaData || mediaData.length === 0) {
      return new Response(
        JSON.stringify({ mediaIds: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${mediaData.length} photos for event ${eventId}`);

    // Processar fotos em batches de 15 (GPT-5 tem melhor capacidade de contexto)
    const batchSize = 15;
    const allMatchedIds: Set<string> = new Set();

    for (let i = 0; i < mediaData.length; i += batchSize) {
      const batch = mediaData.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, photos: ${i + 1}-${Math.min(i + batchSize, mediaData.length)}`);

      // Preparar mensagens para análise facial
      const messages: any[] = [
        {
          role: 'system',
          content: image 
            ? `Você é um especialista em análise e reconhecimento facial. Analise cuidadosamente os rostos nas imagens e identifique fotos que contenham a MESMA PESSOA mostrada na foto de referência.

INSTRUÇÕES:
- Compare características faciais como formato do rosto, olhos, nariz, boca, estrutura óssea
- Considere ângulos diferentes e expressões faciais
- Ignore roupas, acessórios e fundo - foque apenas nos rostos
- Se a pessoa aparecer em múltiplas fotos, retorne TODOS os IDs
- Seja preciso: só retorne IDs onde você tem alta confiança de que é a mesma pessoa

Responda APENAS em formato JSON: {"matchedIds": ["id1", "id2"], "confidence": "high/medium"}` 
            : `Você é um assistente de busca de fotos que analisa imagens e identifica aquelas que correspondem à descrição fornecida.

INSTRUÇÕES:
- Analise cada foto cuidadosamente
- Compare com a descrição do usuário
- Identifique elementos visuais como pessoas, objetos, cores, ações, cenários
- Retorne os IDs das fotos que melhor correspondem à descrição

Responda APENAS em formato JSON: {"matchedIds": ["id1", "id2"]}`
        }
      ];

      // Adicionar foto de referência se fornecida (para busca por rosto)
      if (image) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'FOTO DE REFERÊNCIA - Identifique esta pessoa nas fotos abaixo:'
            },
            {
              type: 'image_url',
              image_url: { url: image }
            }
          ]
        });
      } else if (query) {
        // Adicionar query de texto se não houver imagem
        messages.push({
          role: 'user',
          content: `Busque fotos que correspondam a: "${query}"`
        });
      }

      // Adicionar fotos do batch para análise
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analise as ${batch.length} fotos abaixo. IDs disponíveis: ${batch.map(p => p.id).join(', ')}`
          }
        ]
      });

      for (const photo of batch) {
        messages[messages.length - 1].content.push({
          type: 'image_url',
          image_url: { 
            url: photo.file_url,
            detail: 'high' // Alta resolução para melhor análise facial
          }
        });
        messages[messages.length - 1].content.push({
          type: 'text',
          text: `[ID: ${photo.id}]`
        });
      }

      // Chamar OpenAI API
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07', // Modelo mais poderoso para análise visual
          messages: messages,
          max_completion_tokens: 1000,
          temperature: 0.3 // Baixa temperatura para mais consistência
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('OpenAI API error:', aiResponse.status, errorText);
        continue; // Pula para o próximo batch se houver erro
      }

      const aiData = await aiResponse.json();
      const aiText = aiData.choices?.[0]?.message?.content || '{"matchedIds":[]}';
      
      console.log(`AI Response for batch: ${aiText}`);

      try {
        const parsed = JSON.parse(aiText);
        const batchMatches = parsed.matchedIds || [];
        batchMatches.forEach((id: string) => allMatchedIds.add(id));
        console.log(`Found ${batchMatches.length} matches in this batch`);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    }

    const finalMatchedIds = Array.from(allMatchedIds);
    console.log(`Total matches found: ${finalMatchedIds.length}`);

    return new Response(
      JSON.stringify({ mediaIds: finalMatchedIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-photos function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
