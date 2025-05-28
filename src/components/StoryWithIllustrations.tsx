import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useStories';

interface StoryProps {
  characterId: string;
  storyTitle: string;
}

export const StoryWithIllustrations: React.FC<StoryProps> = ({ characterId, storyTitle }) => {
  const { generateStory, isLoading } = useStories();
  const { toast } = useToast();

  const [chapters, setChapters] = useState<string[]>([]);
  const [illustrations, setIllustrations] = useState<string[]>([]);

  const handleGenerate = async () => {
    try {
      // 1️⃣ Gera capítulos e ilustrações
      const { chapters, illustrations } = await generateStory.mutateAsync({
        characterId,
        storyTitle,
      });
      setChapters(chapters);
      setIllustrations(illustrations);

      // 2️⃣ Salva cada ilustração no Supabase
      const records = chapters.map((_, idx) => ({
        character_id:   characterId,
        chapter_number: idx + 1,
        text:           chapters[idx],
        image_url:      illustrations[idx],
      }));
      const { error } = await supabase.from('story_illustrations').insert(records);
      if (error) {
        console.error('Erro ao salvar ilustrações:', error);
        toast({ title: 'Erro', description: 'Não foi possível salvar as ilustrações.' });
      } else {
        toast({ title: 'Sucesso', description: 'História e ilustrações salvas com sucesso!' });
      }
    } catch (err: any) {
      console.error('Erro na geração:', err);
      toast({ title: 'Erro', description: err.message });
    }
  };

  return (
    <div className="p-4">
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? 'Gerando...' : 'Gerar História e Ilustrações'}
      </button>

      {chapters.length > 0 && (
        <div className="mt-6 space-y-8">
          {chapters.map((text, idx) => (
            <div key={idx} className="border rounded-lg p-4 shadow">
              <img
                src={illustrations[idx]}
                alt={`Ilustração capítulo ${idx + 1}`}
                className="w-full h-auto rounded"
              />
              <p className="mt-2">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
