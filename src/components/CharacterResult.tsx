
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Character } from '../types/Character';

interface CharacterResultProps {
  character: Character;
  onRestart: () => void;
  onGenerateImage: () => void;
  onCreateStory: () => void;
  isGenerating: boolean;
  generatedImageUrl?: string;
  hasStory?: boolean;
}

export const CharacterResult = ({ 
  character, 
  onRestart, 
  onGenerateImage, 
  onCreateStory,
  isGenerating,
  generatedImageUrl,
  hasStory = false
}: CharacterResultProps) => {

  console.log('📖 CharacterResult renderizado para:', character.nome);

  return (
    <div className="story-card rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-fredoka font-bold text-slate-700 mb-4 animate-bounce-gentle">
          🎉 Personagem Criado!
        </h2>
        <div className="text-6xl mb-4 animate-sparkle">🎭</div>
      </div>

      {/* Generated Image Section */}
      {generatedImageUrl && (
        <div className="mb-8 text-center">
          <div className="bg-gradient-to-br from-fairy-pink/10 to-fairy-blue/10 border-2 border-fairy-purple/20 rounded-2xl p-6">
            <h3 className="font-fredoka font-semibold text-slate-700 mb-4 text-xl">
              ✨ Seu Personagem Pixar 3D
            </h3>
            <div className="relative inline-block">
              <img 
                src={generatedImageUrl} 
                alt={`Personagem ${character.nome} no estilo Pixar`}
                className="max-w-full h-auto rounded-xl shadow-lg border-4 border-white"
                style={{ maxHeight: '400px' }}
              />
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce-gentle">🌟</div>
              <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>✨</div>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6 mb-8 bg-gradient-to-br from-fairy-pink/10 to-fairy-blue/10 border-2 border-fairy-purple/20 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="font-fredoka font-semibold text-slate-700">Nome:</span>
              <span className="font-comic text-slate-600">{character.nome}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎂</span>
              <span className="font-fredoka font-semibold text-slate-700">Idade:</span>
              <span className="font-comic text-slate-600">{character.idade} anos</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <span className="font-fredoka font-semibold text-slate-700">Sexo:</span>
              <span className="font-comic text-slate-600">{character.sexo}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              <span className="font-fredoka font-semibold text-slate-700">Pele:</span>
              <span className="font-comic text-slate-600">{character.corPele}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💇</span>
              <span className="font-fredoka font-semibold text-slate-700">Cabelo:</span>
              <span className="font-comic text-slate-600">{character.corCabelo}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">👁️</span>
              <span className="font-fredoka font-semibold text-slate-700">Olhos:</span>
              <span className="font-comic text-slate-600">{character.corOlhos}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-2xl">💫</span>
              <span className="font-fredoka font-semibold text-slate-700">Estilo:</span>
              <span className="font-comic text-slate-600">{character.estiloCabelo}</span>
            </div>

            {hasStory && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <span className="font-fredoka font-semibold text-slate-700">História:</span>
                <span className="font-comic text-slate-600">{character.storyTitle}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {/* First row - Restart and Generate Image */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onRestart}
            variant="outline"
            className="flex-1 py-3 rounded-2xl font-fredoka font-medium border-2 border-fairy-blue/30 hover:bg-fairy-blue/10"
          >
            🔄 Criar Novo Personagem
          </Button>
          
          <Button
            onClick={onGenerateImage}
            disabled={isGenerating}
            className="flex-1 py-3 rounded-2xl font-fredoka font-medium bg-gradient-to-r from-fairy-purple to-fairy-pink hover:from-fairy-pink hover:to-fairy-purple text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin mr-2">🎨</div>
                Gerando Imagem...
              </>
            ) : generatedImageUrl ? (
              <>
                🎨 Gerar Nova Imagem
              </>
            ) : (
              <>
                🎨 Gerar Imagem 3D
              </>
            )}
          </Button>
        </div>

        {/* Second row - Create Story (only show after image is generated) */}
        {generatedImageUrl && (
          <Button
            onClick={onCreateStory}
            className="w-full py-3 rounded-2xl font-fredoka font-medium bg-gradient-to-r from-fairy-blue to-fairy-green hover:from-fairy-green hover:to-fairy-blue text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {hasStory ? (
              <>
                📚 Criar Nova História
              </>
            ) : (
              <>
                📚 Criar História Mágica
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info cards */}
      {!generatedImageUrl && (
        <div className="mt-6 p-4 bg-fairy-yellow/10 rounded-2xl border-2 border-fairy-yellow/30">
          <p className="text-sm font-comic text-slate-600 text-center">
            💡 <strong>Próximo passo:</strong> Clique em "Gerar Imagem 3D" para ver seu personagem no estilo Pixar!
          </p>
        </div>
      )}

      {generatedImageUrl && !hasStory && (
        <div className="mt-6 p-4 bg-fairy-pink/10 rounded-2xl border-2 border-fairy-pink/30">
          <p className="text-sm font-comic text-slate-600 text-center">
            📚 <strong>Que tal uma história?</strong> Clique em "Criar História Mágica" para gerar uma aventura para {character.nome}!
          </p>
        </div>
      )}
    </div>
  );
};
