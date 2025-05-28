import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useStories';

interface StoryWithIllustrationsProps {
  characterId: string;
  storyTitle: string;
}

export const StoryWithIllustrations: React.FC<StoryWithIllustrationsProps> = ({
  characterId,
  storyTitle,
}) => {
  const { toast } = useToast();
  const { generateStory, isLoading } = useStories();

  const [chapters, setChapters] = useState<string[]>([]);
  const [illustrations, setIllustrations] = useState<string[]>([]);

  const handleGenerate = async () => {
    try {
      // Chama a mutation para gerar capítulos e ilustrações
      const { chapters, illustrations } = await generateStory.mutateAsync({
        characterId,
        storyTitle,
      });

      // Atualiza estados para renderizar resultados
      setChapters(chapters);
      setIllustrations(illustrations);

      // Persiste registros em story_illustrations
      const records = chapters.map((_, idx) => ({
        character_id:   characterId,
        chapter_number: idx + 1,
        text:           chapters[idx],
        image_url:      illustrations[idx],
      }));
      const { error } = await supabase.from('story_illustrations').insert(records);
      if (error) {
        throw error;
      }
      toast({ title: 'Sucesso', description: 'História e ilustrações salvas!' });
    } catch (err: any) {
      console.error('Erro ao gerar história e ilustrações:', err);
      toast({ title: 'Erro', description: err.message });
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
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
