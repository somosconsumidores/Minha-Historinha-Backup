// src/components/StoryWithIllustrations.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useStories';
import { Character } from '@/types/Character'; // Assuming Character type includes needed fields

interface StoryWithIllustrationsProps {
  characterId: string;
  storyTitle: string;
}

// Define a more specific type for character details if possible
// For now, using 'any', but should match Character and include image_url and appearance fields
type CharacterDetails = Character & { 
  image_url: string; 
  // Ensure all appearance fields like corPele, corCabelo etc. are part of Character type
};


export const StoryWithIllustrations: React.FC<StoryWithIllustrationsProps> = ({
  characterId,
  storyTitle,
}) => {
  const { toast } = useToast();
  const { generateStory, isLoading: isGeneratingStoryHookLoading } = useStories();

  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterIllustrations, setChapterIllustrations] = useState<Record<number, string>>({});
  const [storyId, setStoryId] = useState<string | null>(null);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isLoadingIllustrations, setIsLoadingIllustrations] = useState(false); // Placeholder for now

  useEffect(() => {
    if (!characterId) return;

    const fetchCharacterDetails = async () => {
      setIsLoadingCharacter(true);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('id, nome, image_url, idade, sexo, cor_pele, cor_cabelo, cor_olhos, estilo_cabelo')
          .eq('id', characterId)
          .single();

        if (error) throw error;
        if (data) {
          setCharacterDetails(data as CharacterDetails); // Cast to ensure type compatibility
        }
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do personagem:', err);
        toast({ title: 'Erro', description: 'Não foi possível carregar os detalhes do personagem.' });
        setCharacterDetails(null);
      } finally {
        setIsLoadingCharacter(false);
      }
    };

    fetchCharacterDetails();
  }, [characterId, toast]);

  const handleGenerateAllChapterIllustrations = async (
    storyIdParam: string,
    chaptersParam: string[],
    charDetailsParam: CharacterDetails
  ) => {
    if (!storyIdParam || !chaptersParam.length || !charDetailsParam) {
      console.error('Missing data for illustration generation:', { storyIdParam, chaptersParam, charDetailsParam });
      toast({ title: 'Erro Interno', description: 'Dados insuficientes para gerar ilustrações.' });
      return;
    }

    setIsLoadingIllustrations(true);
    toast({ title: '🎨 Iniciando Geração de Ilustrações', description: `Preparando para ilustrar ${chaptersParam.length} capítulos.` });

    // Construct characterAppearance string
    const appearanceParts = [];
    // Accessing fields with snake_case as per Supabase query
    // Need to ensure CharacterDetails type or casting allows this.
    // For this example, we'll assume characterDetails has these fields directly,
    // or casting `as any` or a more specific type might be needed if TypeScript complains.
    // @ts-ignore
    if (charDetailsParam.cor_pele) appearanceParts.push(`Pele ${charDetailsParam.cor_pele}`);
    // @ts-ignore
    if (charDetailsParam.cor_cabelo) appearanceParts.push(`cabelo ${charDetailsParam.cor_cabelo}`);
    // @ts-ignore (this might become unnecessary if Character type is fully aligned with snake_case: estilo_cabelo)
    if (charDetailsParam.estilo_cabelo) appearanceParts.push(charDetailsParam.estilo_cabelo);
    // @ts-ignore
    if (charDetailsParam.cor_olhos) appearanceParts.push(`olhos ${charDetailsParam.cor_olhos}`);
    if (charDetailsParam.sexo) appearanceParts.push(charDetailsParam.sexo);
    if (charDetailsParam.idade) appearanceParts.push(`${charDetailsParam.idade} anos`);


    const characterAppearance = appearanceParts.filter(Boolean).join(', ') || 'Aparência não especificada';
    console.log("Constructed characterAppearance:", characterAppearance);


    try {
      for (let i = 0; i < chaptersParam.length; i++) {
        const chapterText = chaptersParam[i];
        const chapterIndex = i;

        // Skip if illustration already exists (e.g., if process was interrupted and restarted)
        if (chapterIllustrations[chapterIndex]) {
          console.log(`Illustration for chapter ${chapterIndex} already exists. Skipping.`);
          continue;
        }
        
        console.log(`Attempting to generate illustration for chapter ${chapterIndex} of story ${storyIdParam}`);
        toast({ title: `🖼️ Ilustrando Capítulo ${chapterIndex + 1}/${chaptersParam.length}`, description: 'Aguarde um momento...' });

        const { data, error } = await supabase.functions.invoke('generate-chapter-illustration', {
          body: {
            chapterText,
            characterImageUrl: charDetailsParam.image_url, // Ensure this is the public URL
            characterName: charDetailsParam.nome,
            characterAppearance,
            storyId: storyIdParam,
            chapterIndex,
          },
        });

        if (error) {
          console.error(`Failed to generate illustration for chapter ${chapterIndex}:`, error);
          toast({
            title: `❌ Erro ao Ilustrar Cap. ${chapterIndex + 1}`,
            description: error.message || 'Tente novamente mais tarde.',
            variant: 'destructive',
          });
          // Optionally, decide if you want to stop or continue with other chapters
        } else if (data && data.illustrationUrl) {
          setChapterIllustrations(prev => ({ ...prev, [chapterIndex]: data.illustrationUrl }));
          toast({ title: `✅ Ilustração Cap. ${chapterIndex + 1} Pronta!`, description: 'Veja abaixo!' });
        } else {
          console.error(`No illustrationUrl returned for chapter ${chapterIndex}:`, data);
          toast({
            title: `⚠️ Ilustração Cap. ${chapterIndex + 1} Incompleta`,
            description: 'Não foi possível obter a URL da ilustração.',
          });
        }
      }
    } catch (e: any) {
      console.error('Error during illustration generation loop:', e);
      toast({ title: '💥 Erro Geral nas Ilustrações', description: e.message || 'Ocorreu um problema inesperado.', variant: 'destructive' });
    } finally {
      setIsLoadingIllustrations(false);
      toast({ title: '✨ Processo de Ilustração Finalizado', description: 'Todas as ilustrações solicitadas foram processadas.' });
    }
  };

  const handleGenerateStory = async () => {
    if (!characterDetails) {
      toast({ title: 'Atenção', description: 'Detalhes do personagem ainda não carregados.' });
      return;
    }
    setIsLoadingStory(true);
    try {
      // Assuming generateStory.mutateAsync now returns { chapters: string[], storyId: string }
      // This might require changes in useStories.ts
      const result = await generateStory.mutateAsync({
        characterId, // Kept for consistency with hook, though charDetails has id
        storyTitle,
      });
      
      // Mocking result for now if useStories is not yet updated
      // const result = { chapters: ["Cap 1", "Cap 2"], storyId: "mock-story-id" };


      if (result && result.chapters && result.storyId) {
        setChapters(result.chapters);
        setStoryId(result.storyId);
        toast({ title: 'Sucesso', description: 'História gerada! Próximo passo: ilustrações.' });
        
        // Call illustration generation
        if (result.chapters.length > 0 && result.storyId && characterDetails) {
           await handleGenerateAllChapterIllustrations(result.storyId, result.chapters, characterDetails); 
        } else if (!characterDetails) {
          toast({ title: 'Atenção', description: 'Detalhes do personagem não carregados, não foi possível iniciar ilustrações.' });
        }


      } else {
        // This case handles if generateStory.mutateAsync doesn't return the expected structure
        // or if the actual implementation in useStories is not yet updated.
        console.error('generateStory did not return expected { chapters, storyId } structure:', result);
        toast({ title: 'Erro Inesperado', description: 'A geração da história não retornou os dados esperados.' });
        // Fallback or mock data for development if needed:
        // setChapters(["Mock Chapter 1: The Adventure Begins", "Mock Chapter 2: The Friendly Dragon"]);
        // setStoryId("mock-story-id-123");
        // handleGenerateAllChapterIllustrations(); // Call with mock data if needed
      }

    } catch (err: any) {
      console.error('Erro ao gerar história:', err);
      toast({ title: 'Erro ao Gerar História', description: err.message || 'Falha ao gerar capítulos da história.' });
    } finally {
      setIsLoadingStory(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleGenerateStory}
        disabled={isLoadingCharacter || isLoadingStory || isLoadingIllustrations || !characterDetails || chapters.length > 0}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 mb-4"
      >
        {isLoadingCharacter ? 'Carregando Personagem...' 
          : isLoadingStory ? 'Gerando História...' 
          : isLoadingIllustrations ? 'Gerando Ilustrações...' 
          : 'Gerar História e Ilustrações'}
      </button>

      {isLoadingCharacter && <p className="text-center my-4">Carregando detalhes do personagem...</p>}
      {!isLoadingCharacter && !characterDetails && characterId && <p className="text-center my-4 text-red-500">Não foi possível carregar os detalhes do personagem.</p>}
      
      {characterDetails && !isLoadingCharacter && (
        <div className="mb-4 p-4 border rounded-lg bg-slate-50">
          <h3 className="text-xl font-semibold">{characterDetails.nome}</h3>
          {characterDetails.image_url && <img src={characterDetails.image_url} alt={characterDetails.nome} className="w-32 h-32 rounded-md my-2 object-cover" />}
          <p className="text-sm text-gray-600">ID: {characterDetails.id}</p>
        </div>
      )}

      {isLoadingIllustrations && chapters.length > 0 && <p className="text-center my-4 font-semibold">🎨 Gerando ilustrações, por favor aguarde...</p>}

      {chapters.length > 0 && (
        <div className="mt-6 space-y-8">
          <h2 className="text-2xl font-bold text-center">História Gerada (ID: {storyId})</h2>
          {chapters.map((text, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-lg bg-white">
              <h4 className="text-lg font-semibold mb-2 font-fredoka">Capítulo {idx + 1}</h4>
              {chapterIllustrations[idx] ? (
                <img
                  src={chapterIllustrations[idx]}
                  alt={`Ilustração para o capítulo ${idx + 1}`}
                  className="w-full h-auto rounded-md my-2 shadow"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center my-2">
                  {isLoadingIllustrations ? 
                    <p className="text-gray-500">Aguardando ilustração...</p> : 
                    <p className="text-gray-500">Ilustração para capítulo {idx + 1} pendente.</p>
                  }
                </div>
              )}
              <p className="mt-2 text-lg font-comic text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
