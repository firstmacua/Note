export type NoteCategory =
  | 'Загальне'
  | 'Робота'
  | 'Ідеї'
  | 'Покупки'
  | 'Тренування'
  | 'Тренировка'
  | 'Workout'
  | 'Общее'
  | 'Личное';

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
}

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
  exercises?: WorkoutExercise[];
}

export type CategoryFilter = 'all' | string;

export type NotesTab = 'public' | 'my';
