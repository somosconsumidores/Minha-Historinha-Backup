// src/components/StoryWithIllustrations.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
// import { useStories } from '@/hooks/useStories'; // 2. Comment out useStories usage
// import { useSimpleMutationTest } from '@/hooks/useSimpleMutationTest';
import { Character } from '@/types/Character'; // Assuming Character type includes needed fields
import { useMutation, useQueryClient } from '@tanstack/react-query'; // 1. Ensure useMutation is imported

interface StoryWithIllustrationsProps {
  characterId: string;
  storyTitle: string;
}

type CharacterDetails = Character & {
  image_url: string;
};

export const StoryWithIllustrations: React.FC<StoryWithIllustrationsProps> = ({
  characterId,
  storyTitle,
}) => {
  const { toast } = useToast();
  // const { generateStory } = useStories(); // 2. Comment out useStories usage

  const queryClientFromHook = useQueryClient();
  console.log("StoryWithIllustrations: queryClient from useQueryClient():", queryClientFromHook);

  console.log("StoryWithIllustrations: Attempting to define testMutationDirect...");
  const testMutationDirect = useMutation<string, Error, string>({
    mutationFn: async (variable: string) => {
      console.log("StoryWithIllustrations_DirectTest: mutationFn CALLED with:", variable);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async work
      return `Direct Test Success with ${variable}`;
    },
    onSuccess: (data) => {
      console.log("StoryWithIllustrations_DirectTest: onSuccess:", data);
      alert(`StoryWithIllustrations Direct Test Success: ${data}`);
    },
    onError: (error) => {
      console.error("StoryWithIllustrations_DirectTest: onError:", error);
      alert(`StoryWithIllustrations Direct Test Error: ${error.message}`);
    },
  });
  console.log("StoryWithIllustrations: testMutationDirect object:", testMutationDirect);
  if (!testMutationDirect) {
      console.error("StoryWithIllustrations: testMutationDirect is undefined after useMutation call!");
  } else {
      console.log("StoryWithIllustrations: typeof testMutationDirect.mutateAsync:", typeof testMutationDirect.mutateAsync);
  }

  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterIllustrations, setChapterIllustrations] = useState<Record<number, string>>({});
  const [storyId, setStoryId] = useState<string | null>(null);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  // Commented out isLoadingStory as its tied to the original generateStory hook
  // const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isLoadingIllustrations, setIsLoadingIllustrations] = useState(false);

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
          setCharacterDetails(data as CharacterDetails);
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

  // Original handleGenerateStory logic is mostly commented out or adapted for this test
  const handleGenerateStory = async () => {
    if (!characterDetails) {
      toast({ title: 'Atenção', description: 'Detalhes do personagem ainda não carregados (for main button).' });
      return;
    }
    console.log("Original handleGenerateStory called, but its main logic is inactive for this direct test.");
    // Original logic using generateStory from useStories is disabled.
  };

  // Original handleGenerateAllChapterIllustrations - can remain as is, but won't be called by the direct test.
  const handleGenerateAllChapterIllustrations = async (
    storyIdParam: string,
    chaptersParam: string[],
    charDetailsParam: CharacterDetails
  ) => {
    // ... (implementation remains the same as before)
    if (!storyIdParam || !chaptersParam.length || !charDetailsParam) {
      console.error('Missing data for illustration generation:', { storyIdParam, chaptersParam, charDetailsParam });
      toast({ title: 'Erro Interno', description: 'Dados insuficientes para gerar ilustrações.' });
      return;
    }
    setIsLoadingIllustrations(true);
    toast({ title: '🎨 Iniciando Geração de Ilustrações', description: `Preparando para ilustrar ${chaptersParam.length} capítulos.` });
    const appearanceParts = [];
    // @ts-ignore
    if (charDetailsParam.cor_pele) appearanceParts.push(`Pele ${charDetailsParam.cor_pele}`);
    // @ts-ignore
    if (charDetailsParam.cor_cabelo) appearanceParts.push(`cabelo ${charDetailsParam.cor_cabelo}`);
    // @ts-ignore
    if (charDetailsParam.estilo_cabelo) appearanceParts.push(charDetailsParam.estilo_cabelo);
    // @ts-ignore
    if (charDetailsParam.cor_olhos) appearanceParts.push(`olhos ${charDetailsParam.cor_olhos}`);
    if (charDetailsParam.sexo) appearanceParts.push(charDetailsParam.sexo);
    if (charDetailsParam.idade) appearanceParts.push(`${charDetailsParam.idade} anos`);
    const characterAppearance = appearanceParts.filter(Boolean).join(', ') || 'Aparência não especificada';
    try {
      for (let i = 0; i < chaptersParam.length; i++) {
        const chapterText = chaptersParam[i];
        const chapterIndex = i;
        if (chapterIllustrations[chapterIndex]) continue;
        toast({ title: `🖼️ Ilustrando Capítulo ${chapterIndex + 1}/${chaptersParam.length}`, description: 'Aguarde um momento...' });
        const { data, error } = await supabase.functions.invoke('generate-chapter-illustration', {
          body: { chapterText, characterImageUrl: charDetailsParam.image_url, characterName: charDetailsParam.nome, characterAppearance, storyId: storyIdParam, chapterIndex },
        });
        if (error) {
          console.error(`Failed to generate illustration for chapter ${chapterIndex}:`, error);
          toast({ title: `❌ Erro ao Ilustrar Cap. ${chapterIndex + 1}`, description: error.message || 'Tente novamente.', variant: 'destructive' });
        } else if (data && data.illustrationUrl) {
          setChapterIllustrations(prev => ({ ...prev, [chapterIndex]: data.illustrationUrl }));
          toast({ title: `✅ Ilustração Cap. ${chapterIndex + 1} Pronta!`, description: 'Veja abaixo!' });
        } else {
          console.error(`No illustrationUrl returned for chapter ${chapterIndex}:`, data);
          toast({ title: `⚠️ Ilustração Cap. ${chapterIndex + 1} Incompleta`, description: 'Não foi possível obter a URL.' });
        }
      }
    } catch (e: any) {
      console.error('Error during illustration generation loop:', e);
      toast({ title: '💥 Erro Geral nas Ilustrações', description: e.message || 'Ocorreu um problema.', variant: 'destructive' });
    } finally {
      setIsLoadingIllustrations(false);
      toast({ title: '✨ Processo de Ilustração Finalizado', description: 'Todas as ilustrações solicitadas foram processadas.' });
    }
  };

  // Adapted button states for the current test scenario
  const mainButtonDisabled = isLoadingCharacter || !characterDetails; // Simplified as original story generation is out
  let buttonText = '✨ Gerar História e Ilustrações (Currently Inactive)';
  if (isLoadingCharacter) buttonText = '🔍 Carregando Personagem...';

  return (
    <div className="p-4">
      <button
        onClick={handleGenerateStory} // This button is now effectively inactive for story generation
        disabled={mainButtonDisabled}
        className="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50 mb-4"
      >
        {buttonText}
      </button>

      <button
        onClick={() => {
          console.log("StoryWithIllustrations_DirectTest: Button clicked.");
          if (testMutationDirect && typeof testMutationDirect.mutateAsync === 'function') {
            testMutationDirect.mutateAsync("DirectTestData")
              .then(res => console.log("StoryWithIllustrations_DirectTest: mutateAsync resolved:", res))
              .catch(err => console.error("StoryWithIllustrations_DirectTest: mutateAsync rejected:", err));
          } else {
            console.error("StoryWithIllustrations_DirectTest: mutateAsync is not available.");
            alert("Error: Direct test mutateAsync is not available.");
          }
        }}
        disabled={testMutationDirect?.isPending}
        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 my-2"
      >
        {testMutationDirect?.isPending ? 'Direct Mutating...' : 'Run Direct Test Mutation'}
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

      {/* Illustration display logic can remain, though it won't be populated by this direct test */}
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