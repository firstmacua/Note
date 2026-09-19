import { Note, NoteCategory } from './types';

export const CATEGORIES: NoteCategory[] = ['Общее', 'Работа', 'Идеи', 'Личное', 'Покупки'];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Планы на неделю',
    content: '1. Завершить отчёт по проекту\n2. Записаться на массаж в четверг\n3. Заказать новые книги по дизайну',
    category: 'Личное',
    isPinned: true,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'note-2',
    title: 'Идея для нового сервиса',
    content: 'Сделать минималистичный календарь с фокусом на глубокую работу без отвлекающих уведомлений.',
    category: 'Идеи',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'note-3',
    title: 'Список покупок к выходным',
    content: 'Оливковое масло, свежий базилик, помидоры черри, зерновой хлеб, минеральная вода.',
    category: 'Покупки',
    isPinned: false,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
  },
];
