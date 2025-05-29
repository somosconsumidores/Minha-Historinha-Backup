import { useState } from 'react';
import { Character } from '../types/Character'; // Ensure this type uses snake_case for cor_pele etc.
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCharacters = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveCharacter = async (character: Character): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const characterData = {
        user_id: user?.id || null,
        nome: character.nome,
        idade: character.idade,
        sexo: character.sexo,
        cor_pele: character.cor_pele,
        cor_cabelo: character.cor_cabelo,
        cor_olhos: character.cor_olhos,
        estilo_cabelo: character.estilo_cabelo, // Corrected: 'i'
        // image_url is handled by updateCharacterImage
      };

      const { data, error } = await supabase
        .from('characters')
        .insert(characterData)
        .select('id')
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Personagem salvo no banco:', data);
      return data.id;
    } catch (error: any) {
      // Keep the detailed error log here for now
      console.error('Detailed error saving character:', JSON.stringify(error, null, 2));
      toast({
        title: "❌ Erro ao salvar personagem",
        description: error.message || "Não foi possível salvar o personagem no banco de dados.",
        className: "text-black",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCharacterImage = async (characterId: string, imageUrl: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({ image_url: imageUrl })
        .eq('id', characterId);

      if (error) throw error;

      console.log('Imagem do personagem atualizada no banco');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar imagem do personagem:', error);
      toast({
        title: "❌ Erro ao salvar imagem",
        description: error.message || "A imagem foi gerada mas não pôde ser salva no banco.",
        className: "text-black",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacters = async (): Promise<Character[]> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user?.id || null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const characters: Character[] = data.map(char => ({
        id: char.id,
        user_id: char.user_id,
        nome: char.nome,
        idade: char.idade,
        sexo: char.sexo as 'Masculino' | 'Feminino' | 'Outro',
        cor_pele: char.cor_pele,
        cor_cabelo: char.cor_cabelo,
        cor_olhos: char.cor_olhos,
        estilo_cabelo: char.estilo_cabelo, // Corrected: 'i'
        image_url: char.image_url,
        created_at: char.created_at,
        updated_at: char.updated_at,
      }));

      return characters;
    } catch (error: any) {
      console.error('Erro ao buscar personagens:', error);
      toast({
        title: "❌ Erro ao carregar personagens",
        description: error.message || "Não foi possível carregar os personagens salvos.",
        className: "text-black",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveCharacter,
    updateCharacterImage,
    getCharacters,
    isLoading,
  };
};