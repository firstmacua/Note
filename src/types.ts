export type NoteCategory =
  | 'Загальне'
  | 'Робота'
  | 'Ідеї'
  | 'Особисте'
  | 'Покупки'
  | 'Тренування'
  | 'Тренировка'
  | 'Общее'
  | 'Личное';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory | string;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  // Guest and public visibility attributes
  isPublic?: boolean;
  authorName?: string;
  authorId?: string;
}

export type CategoryFilter = 'all' | string;

export type NotesTab = 'public' | 'my';
