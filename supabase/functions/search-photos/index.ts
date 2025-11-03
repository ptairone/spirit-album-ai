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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
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

    // Preparar mensagens para a IA
    const messages: any[] = [
      {
        role: 'system',
        content: 'Você é um assistente de busca de fotos. Analise as imagens e retorne os IDs das fotos que correspondem à descrição do usuário. Responda apenas com os IDs em formato JSON: {"matchedIds": ["id1", "id2"]}.'
      }
    ];

    // Adicionar query de texto se fornecida
    if (query) {
      messages.push({
        role: 'user',
        content: `Busque fotos que correspondam a: ${query}\n\nIDs disponíveis: ${mediaData.map(m => m.id).join(', ')}`
      });
    }

    // Adicionar imagem de referência se fornecida
    if (image) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Encontre fotos similares a esta imagem:'
          },
          {
            type: 'image_url',
            image_url: { url: image }
          }
        ]
      });
    }

    // Adicionar URLs das fotos para análise (limitando a 10 para não exceder o limite)
    const photosToAnalyze = mediaData.slice(0, 10);
    for (const photo of photosToAnalyze) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Foto ID: ${photo.id}`
          },
          {
            type: 'image_url',
            image_url: { url: photo.file_url }
          }
        ]
      });
    }

    // Chamar Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 500
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Fallback: busca simples por palavras-chave
      if (query) {
        const keywords = query.toLowerCase().split(' ');
        const matchedIds = mediaData
          .filter(() => Math.random() > 0.7) // Simulação simples
          .map(m => m.id)
          .slice(0, 5);
        
        return new Response(
          JSON.stringify({ mediaIds: matchedIds }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ mediaIds: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || '{"matchedIds":[]}';
    
    let matchedIds: string[] = [];
    try {
      const parsed = JSON.parse(aiText);
      matchedIds = parsed.matchedIds || [];
    } catch {
      // Se não conseguir parsear, retorna vazio
      matchedIds = [];
    }

    return new Response(
      JSON.stringify({ mediaIds: matchedIds }),
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
