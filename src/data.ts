import { Note, NoteCategory } from './types';

export const CATEGORIES: NoteCategory[] = ['Загальне', 'Робота', 'Ідеї', 'Особисте', 'Покупки'];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Плани на тиждень',
    content: '1. Завершити звіт по проєкту\n2. Записатися на масаж у четвер\n3. Замовити нові книги по дизайну',
    category: 'Особисте',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'note-2',
    title: 'Ідея для нового сервісу',
    content: 'Зробити мінімалістичний календар із фокусом на глибоку роботу без зайвих сповіщень.',
    category: 'Ідеї',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'note-3',
    title: 'Список покупок на вихідні',
    content: 'Оливкова олія, свіжий базилік, томати чері, цільнозерновий хліб, мінеральна вода.',
    category: 'Покупки',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
  },
];
