import React, { useState } from 'react';
import { CharacterCreator } from '@/components/CharacterCreator';
import { StoryWithIllustrations } from '@/components/StoryWithIllustrations';
import { Header } from '@/components/Header';

interface CharacterData {
  id: string;
  name: string;
}

const Index: React.FC = () => {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);

  // Callback para receber o characterId e o nome do personagem
  const handleCharacterCreated = (id: string, name: string) => {
    setCharacterData({ id, name });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Passa o callback para CharacterCreator */}
        <CharacterCreator onCharacterCreated={handleCharacterCreated} />

        {/* Assim que o personagem for criado, renderiza o StoryWithIllustrations */}
        {characterData && (
          <StoryWithIllustrations
  characterId={character.id}
  storyTitle={seuTitulo}
/>
        )}
      </div>
    </div>
  );
};

export default Index;
