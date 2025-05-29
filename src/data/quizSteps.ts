import { QuizStep } from '../types/Character';

export const quizSteps: QuizStep[] = [
  {
    id: 1,
    title: 'Qual é o nome do seu personagem?',
    field: 'nome', // Stays as 'nome'
    type: 'text',
    placeholder: 'Digite um nome mágico...'
  },
  {
    id: 2,
    title: 'Quantos anos tem o seu personagem?',
    field: 'idade', // Stays as 'idade'
    type: 'number',
    placeholder: 'Digite a idade'
  },
  {
    id: 3,
    title: 'Qual é o sexo do seu personagem?',
    field: 'sexo', // Stays as 'sexo'
    type: 'select',
    options: ['Masculino', 'Feminino', 'Outro']
  },
  {
    id: 4,
    title: 'Qual é a cor da pele?',
    field: 'cor_pele', // Changed from 'corPele'
    type: 'select',
    options: [
      'Pele Clara',
      'Pele Morena',
      'Pele Escura',
      'Pele Dourada',
      'Pele Azulada (Fantasia)',
      'Pele Rosada (Fantasia)',
      'Pele Verde (Fantasia)'
    ]
  },
  {
    id: 5,
    title: 'Qual é a cor do cabelo?',
    field: 'cor_cabelo', // Changed from 'corCabelo'
    type: 'select',
    options: [
      'Preto',
      'Castanho Escuro',
      'Castanho Claro',
      'Loiro',
      'Ruivo',
      'Branco/Grisalho',
      'Azul (Fantasia)',
      'Rosa (Fantasia)',
      'Roxo (Fantasia)',
      'Verde (Fantasia)'
    ]
  },
  {
    id: 6,
    title: 'Qual é a cor dos olhos?',
    field: 'cor_olhos', // Changed from 'corOlhos'
    type: 'select',
    options: [
      'Castanhos',
      'Azuis',
      'Verdes',
      'Mel/Âmbar',
      'Cinza',
      'Violeta (Fantasia)',
      'Dourados (Fantasia)',
      'Vermelhos (Fantasia)'
    ]
  },
  {
    id: 7,
    title: 'Qual é o estilo do cabelo?',
    field: 'estlio_cabelo', // Changed from 'estiloCabelo' to 'estlio_cabelo'
    type: 'select',
    options: [
      'Liso e Curto',
      'Liso e Longo',
      'Cacheado e Curto',
      'Cacheado e Longo',
      'Ondulado',
      'Careca',
      'Moicano',
      'Tranças',
      'Rabo de Cavalo',
      'Coque',
      'Franja',
      'Spikes (Fantasia)'
    ]
  }
];