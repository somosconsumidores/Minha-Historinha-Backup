import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts"; // Assuming CORS headers are shared

// Helper to truncate text (simple version)
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      chapterText,
      characterImageUrl, // For prompt reference
      characterName,
      characterAppearance, // Detailed text description
      storyId,
      chapterIndex, // 0-based index
    } = await req.json();

    // Validate required inputs
    if (!chapterText || !characterImageUrl || !characterName || !characterAppearance || !storyId || chapterIndex === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Internal server configuration error." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Construct the prompt for DALL-E
    const truncatedChapterText = truncateText(chapterText, 400); // Max length for prompt segment
    const prompt = `Create a vibrant and child-friendly illustration in a Pixar/Disney 3D style for a children's story chapter. The scene should primarily depict the events or mood from the following text: "${truncatedChapterText}" The main character, ${characterName}, who looks like this: "${characterAppearance}", should be featured prominently in the scene, reacting appropriately to the chapter's events. Maintain the character's described appearance. For artistic style and character rendering inspiration, consider this reference: ${characterImageUrl} The illustration should be suitable for a storybook page. Do not include any text or words in the image itself. Focus on a clear, engaging visual narrative.`;

    console.log(`Generating illustration for story ${storyId}, chapter ${chapterIndex} with prompt: ${prompt}`);

    // 2. Call OpenAI DALL-E API
    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard", // Or "hd" if preferred and budget allows
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate image via OpenAI.", details: errorData }),
        { status: openaiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const temporaryImageUrl = openaiData.data[0].url;

    if (!temporaryImageUrl) {
      console.error("No image URL returned from OpenAI");
      return new Response(
        JSON.stringify({ error: "No image URL returned from OpenAI." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch the image data from OpenAI's temporary URL
    const imageResponse = await fetch(temporaryImageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to fetch image from OpenAI temporary URL:", imageResponse.statusText);
      return new Response(
        JSON.stringify({ error: "Failed to download generated image." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const imageBlob = await imageResponse.blob();

    // 4. Upload the image to Supabase Storage
    const storagePath = `${storyId}/chapter_${chapterIndex}.png`;
    const { data: uploadData, error: uploadError } = await supabaseAdminClient.storage
      .from("story-illustrations") // New bucket
      .upload(storagePath, imageBlob, {
        contentType: "image/png",
        upsert: true, // Overwrite if it already exists for some reason
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image to storage.", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Get the public URL
    const { data: publicUrlData } = supabaseAdminClient.storage
      .from("story-illustrations")
      .getPublicUrl(storagePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error("Failed to get public URL for stored image");
      return new Response(
        JSON.stringify({ error: "Failed to get public URL for image." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const finalIllustrationUrl = publicUrlData.publicUrl;

    // 6. Insert record into chapter_illustrations table
    const { error: dbError } = await supabaseAdminClient
      .from("chapter_illustrations")
      .insert({
        story_id: storyId,
        chapter_index: chapterIndex,
        image_url: finalIllustrationUrl,
        storage_path: storagePath,
      });

    if (dbError) {
      console.error("Database insert error:", dbError);
      // If DB insert fails, should we delete the uploaded image? For now, let's not, but consider for robustness.
      return new Response(
        JSON.stringify({ error: "Failed to save illustration metadata to database.", details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Return the public URL and storage path
    return new Response(
      JSON.stringify({
        illustrationUrl: finalIllustrationUrl,
        storagePath: storagePath,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (e) {
    console.error("Unexpected error in generate-chapter-illustration:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred.", details: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
