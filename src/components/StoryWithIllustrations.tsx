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

type CharacterDetails = Character & {
  image_url: string;
};

export const StoryWithIllustrations: React.FC<StoryWithIllustrationsProps> = ({ characterId, storyTitle }) => {
  const { toast } = useToast();
  const { generateStory } = useStories();

  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterIllustrations, setChapterIllustrations] = useState<Record<number, string>>({});
  const [storyId, setStoryId] = useState<string | null>(null);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isLoadingIllustrations, setIsLoadingIllustrations] = useState(false);

  useEffect(() => {
    if (!characterId) return;
    const fetchCharacterDetails = async () => {
      setIsLoadingCharacter(true);
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('id, nome, image_url, idade, sexo, corPele, corCabelo, corOlhos, estiloCabelo, tomPele, formatoRosto, detalhesRosto, tipoCorpo, estiloVestimenta, paletaCores, elementosChave, inspiracoesVisuais')
          .eq('id', characterId)
          .single();
        if (error) throw error;
        if (data) setCharacterDetails(data as CharacterDetails);
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do personagem:', err);
        toast({ title: 'Erro Personagem', description: 'Não foi possível carregar os detalhes do personagem.' });
        setCharacterDetails(null);
      } finally {
        setIsLoadingCharacter(false);
      }
    };
    fetchCharacterDetails();
  }, [characterId, toast]);

  const handleGenerateAllChapterIllustrations = async (currentStoryId: string, currentChapters: string[], currentCharacterDetails: CharacterDetails) => {
    if (!currentStoryId || !currentChapters.length || !currentCharacterDetails) {
      toast({ title: 'Erro Interno', description: 'Dados insuficientes para ilustrações.' });
      return;
    }
    setIsLoadingIllustrations(true);
    toast({ title: '🎨 Ilustrando Capítulos...', description: `Preparando ${currentChapters.length} ilustrações.` });

    const appearanceParts = [
      currentCharacterDetails.corPele ? `Pele ${currentCharacterDetails.corPele}` : '',
      currentCharacterDetails.corCabelo ? `cabelo ${currentCharacterDetails.corCabelo}` : '',
      currentCharacterDetails.estiloCabelo,
      currentCharacterDetails.corOlhos ? `olhos ${currentCharacterDetails.corOlhos}` : '',
      // Add other fields as needed, ensuring they are not null/undefined before adding
    ].filter(Boolean).join(', ') || 'Aparência padrão';
    const characterAppearance = appearanceParts;

    try {
      for (let i = 0; i < currentChapters.length; i++) {
        if (chapterIllustrations[i]) continue;
        const chapterText = currentChapters[i];
        toast({ title: `🖼️ Ilustrando Cap. ${i + 1}/${currentChapters.length}` });
        const { data: illusData, error: illusError } = await supabase.functions.invoke('generate-chapter-illustration', {
          body: { chapterText, characterImageUrl: currentCharacterDetails.image_url, characterName: currentCharacterDetails.nome, characterAppearance, storyId: currentStoryId, chapterIndex: i },
        });
        if (illusError) throw illusError;
        if (illusData && illusData.illustrationUrl) {
          setChapterIllustrations(prev => ({ ...prev, [i]: illusData.illustrationUrl }));
        }
      }
    } catch (e: any) {
      console.error('Erro ao gerar ilustrações:', e);
      toast({ title: '💥 Erro Ilustrações', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoadingIllustrations(false);
      toast({ title: '✨ Ilustrações Finalizadas' });
    }
  };

  const handleGenerateStory = async () => {
    if (!characterDetails) {
      toast({ title: 'Aguarde', description: 'Detalhes do personagem carregando.' });
      return;
    }
    setIsLoadingStory(true);
    setChapterIllustrations({}); // Reset previous illustrations
    try {
      const result = await generateStory.mutateAsync({ characterId, storyTitle });
      if (result && result.chapters && result.storyId) {
        setChapters(result.chapters);
        setStoryId(result.storyId);
        toast({ title: '✅ História Gerada!', description: 'Iniciando ilustrações...' });
        await handleGenerateAllChapterIllustrations(result.storyId, result.chapters, characterDetails);
      } else {
        throw new Error('Estrutura de dados inesperada da geração da história.');
      }
    } catch (err: any) {
      console.error('Erro ao gerar história:', err);
      toast({ title: '❌ Erro História', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoadingStory(false);
    }
  };

  const mainButtonDisabled = isLoadingCharacter || isLoadingStory || isLoadingIllustrations || !characterDetails;
  let buttonText = '✨ Gerar História e Ilustrações';
  if (isLoadingCharacter) buttonText = '🔍 Carregando Personagem...';
  else if (isLoadingStory) buttonText = '📖 Gerando História...';
  else if (isLoadingIllustrations) buttonText = '🎨 Gerando Ilustrações...';

  return (
    <div className="p-4">
      <button onClick={handleGenerateStory} disabled={mainButtonDisabled} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 mb-4">
        {buttonText}
      </button>
      {chapters.length > 0 && (
        <div className="mt-6 space-y-8">
          <h2 className="text-2xl font-bold text-center">História Gerada (ID: {storyId})</h2>
          {chapters.map((text, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow-lg bg-white">
              <h4 className="text-lg font-semibold mb-2 font-fredoka">Capítulo {idx + 1}</h4>
              {chapterIllustrations[idx] ? (
                <img src={chapterIllustrations[idx]} alt={`Ilustração para o capítulo ${idx + 1}`} className="w-full h-auto rounded-md my-2 shadow" />
              ) : isLoadingIllustrations ? (
                 <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center my-2"><p className="text-gray-500">🎨 Ilustrando...</p></div>
              ) : (
                 <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center my-2"><p className="text-gray-500">Aguardando ilustração...</p></div>
              )}
              <p className="mt-2 text-lg font-comic text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};