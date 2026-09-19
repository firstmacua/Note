export type NoteCategory = 'Общее' | 'Работа' | 'Идеи' | 'Личное' | 'Покупки';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  // Guest and public visibility attributes
  isPublic?: boolean;
  authorName?: string;
  authorId?: string;
}

export type CategoryFilter = 'Все' | NoteCategory;

export type NotesTab = 'public' | 'my';
