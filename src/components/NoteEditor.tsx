import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Pin } from 'lucide-react';
import { Note, NoteCategory } from '../types';
import { CATEGORIES } from '../data';

interface NoteEditorProps {
  initialNote?: Note | null;
  onSave: (noteData: { title: string; content: string; category: NoteCategory; isPinned: boolean }) => void;
  onCancel?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ initialNote, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Общее');
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setCategory(initialNote.category);
      setIsPinned(initialNote.isPinned);
      setError('');
    } else {
      setTitle('');
      setContent('');
      setCategory('Общее');
      setIsPinned(false);
      setError('');
    }
  }, [initialNote]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) {
      setError('Пожалуйста, введите текст или заголовок заметки');
      return;
    }

    onSave({
      title: title.trim() || 'Без названия',
      content: content.trim(),
      category,
      isPinned,
    });

    if (!initialNote) {
      setTitle('');
      setContent('');
      setIsPinned(false);
      setError('');
    }
  };

  return (
    <form
      id="note-editor-form"
      onSubmit={handleSubmit}
      className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm transition-all focus-within:border-neutral-400"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <input
          id="note-title-input"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError('');
          }}
          placeholder="Заголовок заметки..."
          className="w-full text-base font-medium text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none"
        />
        <button
          id="note-pin-toggle-btn"
          type="button"
          onClick={() => setIsPinned(!isPinned)}
          title={isPinned ? 'Заметка закреплена' : 'Закрепить заметку вверху'}
          className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center ${
            isPinned
              ? 'bg-amber-50 text-amber-600'
              : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-600' : ''}`} />
        </button>
      </div>

      <textarea
        id="note-content-input"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (error) setError('');
        }}
        rows={initialNote ? 5 : 3}
        placeholder="Текст заметки..."
        className="w-full text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-y min-h-[72px]"
      />

      {error && (
        <p id="note-editor-error" className="text-xs text-rose-600 mb-3">
          {error}
        </p>
      )}

      <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
        {/* Category selector */}
        <div id="note-category-picker" className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                id={`category-btn-${cat}`}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {onCancel && (
            <button
              id="note-cancel-btn"
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Отмена
            </button>
          )}

          <button
            id="note-save-btn"
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            {initialNote ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Сохранить
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Записать заметку
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
