export type NoteCategory = 'Общее' | 'Работа' | 'Идеи' | 'Личное' | 'Покупки';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CategoryFilter = 'Все' | NoteCategory;
