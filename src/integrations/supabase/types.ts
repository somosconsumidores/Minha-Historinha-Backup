export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      characters: {
        Row: {
          cor_cabelo: string
          cor_olhos: string
          cor_pele: string
          created_at: string
          estilo_cabelo: string
          id: string
          idade: number
          image_url: string | null
          nome: string
          sexo: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cor_cabelo: string
          cor_olhos: string
          cor_pele: string
          created_at?: string
          estilo_cabelo: string
          id?: string
          idade: number
          image_url?: string | null
          nome: string
          sexo: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cor_cabelo?: string
          cor_olhos?: string
          cor_pele?: string
          created_at?: string
          estilo_cabelo?: string
          id?: string
          idade?: number
          image_url?: string | null
          nome?: string
          sexo?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      generated_stories: {
        Row: {
          chapter_1: string | null
          chapter_10: string | null
          chapter_2: string | null
          chapter_3: string | null
          chapter_4: string | null
          chapter_5: string | null
          chapter_6: string | null
          chapter_7: string | null
          chapter_8: string | null
          chapter_9: string | null
          chapters_data: Json | null
          character_id: string | null
          character_image_url: string | null
          created_at: string | null
          id: string
          theme_id: string | null
          theme_title: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chapter_1?: string | null
          chapter_10?: string | null
          chapter_2?: string | null
          chapter_3?: string | null
          chapter_4?: string | null
          chapter_5?: string | null
          chapter_6?: string | null
          chapter_7?: string | null
          chapter_8?: string | null
          chapter_9?: string | null
          chapters_data?: Json | null
          character_id?: string | null
          character_image_url?: string | null
          created_at?: string | null
          id?: string
          theme_id?: string | null
          theme_title?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chapter_1?: string | null
          chapter_10?: string | null
          chapter_2?: string | null
          chapter_3?: string | null
          chapter_4?: string | null
          chapter_5?: string | null
          chapter_6?: string | null
          chapter_7?: string | null
          chapter_8?: string | null
          chapter_9?: string | null
          chapters_data?: Json | null
          character_id?: string | null
          character_image_url?: string | null
          created_at?: string | null
          id?: string
          theme_id?: string | null
          theme_title?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_stories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
