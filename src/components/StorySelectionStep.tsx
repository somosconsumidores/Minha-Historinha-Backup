
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Character, StoryTitle } from '../types/Character';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StorySelectionStepProps {
  character: Character;
  onSelectStory: (title: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export const StorySelectionStep = ({ character, onSelectStory, onBack, isLoading = false }: StorySelectionStepProps) => {
  const [storyTitles, setStoryTitles] = useState<StoryTitle[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const { toast } = useToast();

  const generateStoryTitles = async () => {
    setIsGeneratingTitles(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-story-titles', {
        body: {
          characterName: character.nome,
          characterGender: character.sexo
        }
      });

      if (error) {
        throw error;
      }

      if (data.titles) {
        setStoryTitles(data.titles);
        setSelectedTitle(''); // Reset selection
      }
    } catch (error) {
      console.error('Erro ao gerar títulos:', error);
      toast({
        title: "❌ Erro ao gerar títulos",
        description: "Tente novamente em alguns instantes.",
        className: "text-black",
      });
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const handleSelectStory = async () => {
    if (!selectedTitle) {
      toast({
        title: "⚠️ Selecione uma história",
        description: "Escolha um título antes de continuar.",
        className: "text-black",
      });
      return;
    }

    setIsGeneratingStory(true);
    toast({
      title: "📖 Criando sua história...",
      description: "Gerando 10 capítulos mágicos!",
      className: "text-black",
    });

    try {
      // Obter a sessão atual para garantir que temos o token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não está logado');
      }

      console.log('Enviando requisição com token de autenticação');

      const { data, error } = await supabase.functions.invoke('generate-story-chapters', {
        body: {
          storyTitle: selectedTitle,
          character: character,
          characterId: character.id
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw error;
      }

      toast({
        title: "✨ História criada com sucesso!",
        description: "Sua história de 10 capítulos está pronta!",
        className: "text-black",
      });

      onSelectStory(selectedTitle);
    } catch (error) {
      console.error('Erro ao gerar história:', error);
      toast({
        title: "❌ Erro ao gerar história",
        description: "Tente novamente em alguns instantes.",
        className: "text-black",
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Gerar títulos automaticamente quando o componente carrega
  useEffect(() => {
    if (character.nome && character.sexo) {
      generateStoryTitles();
    }
  }, [character.nome, character.sexo]);

  return (
    <div className="story-card rounded-3xl p-8 shadow-2xl max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-fredoka font-bold text-slate-700 mb-4">
          📚 Escolha uma História para {character.nome}
        </h2>
        <div className="text-6xl mb-4 animate-bounce-gentle">📖</div>
        <p className="text-lg font-comic text-slate-600">
          Selecione uma das histórias mágicas abaixo:
        </p>
      </div>

      {isGeneratingTitles ? (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">📚</div>
          <p className="font-comic text-slate-600">Gerando histórias mágicas...</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {storyTitles.map((story) => (
              <Card 
                key={story.id}
                className={`p-4 cursor-pointer transition-all duration-300 border-2 ${
                  selectedTitle === story.title
                    ? 'border-fairy-purple bg-fairy-purple/10 shadow-lg'
                    : 'border-fairy-purple/30 hover:border-fairy-purple/60 hover:bg-fairy-purple/5'
                }`}
                onClick={() => setSelectedTitle(story.title)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {selectedTitle === story.title ? '✨' : '📘'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-fredoka font-semibold text-slate-700 mb-2">
                      {story.title}
                    </h3>
                    <p className="text-sm font-comic text-slate-600">
                      {story.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="flex-1 py-3 rounded-2xl font-fredoka font-medium border-2 border-fairy-blue/30 hover:bg-fairy-blue/10"
                >
                  ← Voltar
                </Button>
              )}

              <Button
                onClick={generateStoryTitles}
                disabled={isGeneratingTitles || isGeneratingStory}
                variant="outline"
                className="flex-1 py-3 rounded-2xl font-fredoka font-medium border-2 border-fairy-blue/30 hover:bg-fairy-blue/10"
              >
                {isGeneratingTitles ? (
                  <>
                    <div className="animate-spin mr-2">🔄</div>
                    Gerando...
                  </>
                ) : (
                  <>
                    🔄 Gerar Mais Opções
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={handleSelectStory}
              disabled={!selectedTitle || isGeneratingStory || isLoading}
              className="w-full py-3 rounded-2xl font-fredoka font-medium bg-gradient-to-r from-fairy-purple to-fairy-pink hover:from-fairy-pink hover:to-fairy-purple text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isGeneratingStory ? (
                <>
                  <div className="animate-spin mr-2">📖</div>
                  Criando História...
                </>
              ) : (
                <>
                  ✨ Escolher Esta História
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
