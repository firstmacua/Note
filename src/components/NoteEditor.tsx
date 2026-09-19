import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Pin, Globe, Lock } from 'lucide-react';
import { Note, NoteCategory } from '../types';
import { CATEGORIES } from '../data';
import { Translations } from '../translations';

interface NoteEditorProps {
  initialNote?: Note | null;
  defaultIsPublic?: boolean;
  t: Translations;
  onSave: (noteData: {
    title: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
    isPublic: boolean;
    authorName: string;
  }) => void;
  onCancel?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialNote,
  defaultIsPublic = false,
  t,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Загальне');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(defaultIsPublic);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('guest_author_name') || '';
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setCategory((initialNote.category as NoteCategory) || 'Загальне');
      setIsPinned(initialNote.isPinned);
      setIsPublic(Boolean(initialNote.isPublic));
      setAuthorName(initialNote.authorName || '');
      setError('');
    } else {
      setTitle('');
      setContent('');
      setCategory('Загальне');
      setIsPinned(false);
      setIsPublic(defaultIsPublic);
      setError('');
    }
  }, [initialNote, defaultIsPublic]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) {
      setError(t.editorErrorRequired);
      return;
    }

    const trimmedAuthor = authorName.trim();
    if (trimmedAuthor) {
      localStorage.setItem('guest_author_name', trimmedAuthor);
    }

    onSave({
      title: title.trim() || (t.appName === 'MikeNote' ? (t.allCategories === 'Всі' ? 'Без назви' : 'Untitled') : 'Untitled'),
      content: content.trim(),
      category,
      isPinned,
      isPublic,
      authorName: trimmedAuthor || t.cardGuest,
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
          placeholder={t.editorTitlePlaceholder}
          className="w-full text-base font-medium text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none"
        />
        <button
          id="note-pin-toggle-btn"
          type="button"
          onClick={() => setIsPinned(!isPinned)}
          title={isPinned ? t.cardUnpin : t.editorPinLabel}
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
        placeholder={t.editorContentPlaceholder}
        className="w-full text-sm text-neutral-800 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-y min-h-[72px]"
      />

      {error && (
        <p id="note-editor-error" className="text-xs text-rose-600 mb-3">
          {error}
        </p>
      )}

      {/* Guest author name field & Public/Private toggle */}
      <div className="py-2.5 px-3 mb-3 rounded-lg bg-neutral-50 border border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            id="editor-visibility-toggle"
            onClick={() => setIsPublic(!isPublic)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              isPublic
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            {isPublic ? (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.editorPublicLabel}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                <span>{t.tabMy}</span>
              </>
            )}
          </button>
        </div>

        {isPublic && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-neutral-500 whitespace-nowrap">{t.editorAuthorLabel}:</span>
            <input
              type="text"
              id="guest-author-input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t.editorAuthorPlaceholder}
              maxLength={30}
              className="bg-white px-2 py-1 rounded border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-neutral-600 w-28 sm:w-36"
            />
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
        {/* Category selector */}
        <div id="note-category-picker" className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            const translatedCat = (t.categories as Record<string, string>)[cat] || cat;
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
                {translatedCat}
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
              {t.editorCancelBtn}
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
                {t.editorUpdateBtn}
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                {isPublic ? t.writeForEveryone : t.editorSaveBtn}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
