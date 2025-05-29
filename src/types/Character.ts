export interface Character {
  id?: string; // Primary key, selected
  user_id?: string; // Exists in your DB, good to have if you use it elsewhere
  nome: string; // Selected
  idade: number; // Selected
  sexo: 'Masculino' | 'Feminino' | 'Outro'; // Selected
  cor_pele: string;     // Changed from corPele, selected
  cor_cabelo: string;   // Changed from corCabelo, selected
  cor_olhos: string;    // Changed from corOlhos, selected
  estlio_cabelo: string; // Changed from estiloCabelo to match your DB 'estlio_cabelo', selected
  image_url?: string;   // Selected
  storyTitle?: string;  // This is a client-side field you add to the character object, not directly from 'characters' table select in StoryWithIllustrations
  created_at?: string;  // Exists in your DB
  updated_at?: string;  // Exists in your DB
}

export interface QuizStep {
  id: number;
  title: string;
  field: keyof Character; // This will now correctly reference the updated Character fields
  type: 'text' | 'number' | 'select' | 'color' | 'story-selection';
  options?: string[];
  placeholder?: string;
}

export interface StoryTitle {
  id: string;
  title: string;
  description: string;
}

export interface GeneratedStory {
  id: string;
  title: string;
  character_id: string;
  user_id: string;
  chapters: string[];
  created_at: string;
}