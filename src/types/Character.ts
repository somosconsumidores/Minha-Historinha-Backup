export interface Character {
  id?: string;
  user_id?: string;
  nome: string;
  idade: number;
  sexo: 'Masculino' | 'Feminino' | 'Outro';
  cor_pele: string;
  cor_cabelo: string;
  cor_olhos: string;
  estilo_cabelo: string; // Corrected to 'estilo_cabelo'
  image_url?: string;
  storyTitle?: string;   // Client-side field
  created_at?: string;
  updated_at?: string;
}

export interface QuizStep {
  id: number;
  title: string;
  field: keyof Character;
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