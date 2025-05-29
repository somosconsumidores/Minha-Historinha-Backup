// src/hooks/useCharacters.ts

import { useState, useCallback }_ from 'react';
import { Character } from '../types/Character'; // Assuming Character type is defined in src/types/Character.ts
import { supabase } from '@/integrations/supabase/client'; // Assuming client is configured correctly
import { useToast }_ from '@/hooks/use-toast'; // Assuming use-toast hook is correctly set up

export const useCharacters = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveCharacter = useCallback(async (character: Character): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Ensure your Character type (passed as argument) has snake_case properties
      // so character.cor_pele etc. are defined.
      const characterData = {
        user_id: user?.id || null,
        nome: character.nome,
        idade: character.idade,
        sexo: character.sexo,
        cor_pele: character.cor_pele,          
        cor_cabelo: character.cor_cabelo,      
        cor_olhos: character.cor_olhos,        
        estilo_cabelo: character.estilo_cabelo, // Corrected: 'i' instead of 'l'
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
      console.error('Detailed error saving character:', JSON.stringify(error, null, 2)); 
      toast({
        title: "❌ Erro ao salvar personagem",
        description: error.message || "Não foi possível salvar o personagem no banco de dados.",
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateCharacterImage = useCallback(async (characterId: string, imageUrl: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({ image_url: imageUrl })
        .eq('id', characterId);

      if (error) {
        throw error;
      }

      console.log('Imagem do personagem atualizada no banco');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar imagem do personagem:', error);
      toast({
        title: "❌ Erro ao salvar imagem",
        description: error.message || "A imagem foi gerada mas não pôde ser salva no banco.",
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getCharacters = useCallback(async (): Promise<Character[]> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('characters')
        .select('*') 
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

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
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    saveCharacter,
    updateCharacterImage,
    getCharacters,
    isLoading,
  };
};