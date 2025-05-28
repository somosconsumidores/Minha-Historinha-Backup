
import { CharacterCreator } from '@/components/CharacterCreator';
import { Header } from '@/components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <CharacterCreator />
      </div>
    </div>
  );
};

export default Index;
