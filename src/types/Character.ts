
export interface Character {
  id?: string;
  user_id?: string;
  nome: string;
  idade: number;
  sexo: 'Masculino' | 'Feminino' | 'Outro';
  corPele: string;
  corCabelo: string;
  corOlhos: string;
  estiloCabelo: string;
  image_url?: string;
  storyTitle?: string;
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
