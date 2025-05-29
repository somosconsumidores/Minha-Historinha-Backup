import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      chapterText,
      characterImageUrl,
      characterName,
      characterAppearance,
      storyId,
      chapterIndex,
    } = await req.json();

    if (!chapterText || !characterImageUrl || !characterName || !characterAppearance || !storyId || chapterIndex === undefined) {
      return new Response(JSON.stringify({ error: "Missing required parameters." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ error: "Internal server configuration error." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const truncatedChapterText = truncateText(chapterText, 400);
    const prompt = `Create a vibrant and child-friendly illustration in a Pixar/Disney 3D style for a children's story chapter. The scene should primarily depict the events or mood from the following text: "${truncatedChapterText}" The main character, ${characterName}, who looks like this: "${characterAppearance}", should be featured prominently in the scene, reacting appropriately to the chapter's events. Maintain the character's described appearance. For artistic style and character rendering inspiration, consider this reference: ${characterImageUrl} The illustration should be suitable for a storybook page. Do not include any text or words in the image itself. Focus on a clear, engaging visual narrative.`;

    console.log(`Generating illustration for story ${storyId}, chapter ${chapterIndex} with prompt: ${prompt}`);

    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openAIApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", quality: "standard" }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(JSON.stringify({ error: "Failed to generate image via OpenAI.", details: errorData }), { status: openaiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const openaiData = await openaiResponse.json();
    const temporaryImageUrl = openaiData.data[0].url;
    if (!temporaryImageUrl) throw new Error("No image URL from OpenAI");

    const imageResponse = await fetch(temporaryImageUrl);
    if (!imageResponse.ok) throw new Error("Failed to download generated image");
    const imageBlob = await imageResponse.blob();

    const storagePath = `${storyId}/chapter_${chapterIndex}.png`;
    const { error: uploadError } = await supabaseAdminClient.storage.from("story-illustrations").upload(storagePath, imageBlob, { contentType: "image/png", upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdminClient.storage.from("story-illustrations").getPublicUrl(storagePath);
    if (!publicUrlData || !publicUrlData.publicUrl) throw new Error("Failed to get public URL");

    const { error: dbError } = await supabaseAdminClient.from("chapter_illustrations").insert({ story_id: storyId, chapter_index: chapterIndex, image_url: publicUrlData.publicUrl, storage_path: storagePath });
    if (dbError) throw dbError;

    return new Response(JSON.stringify({ illustrationUrl: publicUrlData.publicUrl, storagePath }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred.", details: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});