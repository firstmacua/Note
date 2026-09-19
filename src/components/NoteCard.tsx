import React, { useState } from 'react';
import { Pin, Pencil, Trash2, Copy, Check, Share2, Globe, User as UserIcon } from 'lucide-react';
import { Note } from '../types';
import { Translations, Language } from '../translations';

interface NoteCardProps {
  note: Note;
  t: Translations;
  currentLang: Language;
  onTogglePin: (id: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onShare: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  t,
  currentLang,
  onTogglePin,
  onEdit,
  onDelete,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = note.title ? `${note.title}\n\n${note.content || ''}` : (note.content || '');
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Safe fallback
      }
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp || isNaN(Number(timestamp))) {
      return t.cardJustNow;
    }
    try {
      const date = new Date(Number(timestamp));
      const locale = currentLang === 'uk' ? 'uk-UA' : 'en-US';
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return t.cardJustNow;
    }
  };

  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat) {
      case 'Робота':
      case 'Работа':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Ідеї':
      case 'Идеи':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Особисте':
      case 'Личное':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Покупки':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const translatedCategory =
    (t.categories as Record<string, string>)[note.category] || note.category;

  return (
    <article
      id={`note-card-${note.id}`}
      className={`group relative bg-white border rounded-xl p-5 shadow-xs transition-all hover:shadow-sm flex flex-col justify-between ${
        note.isPinned
          ? 'border-amber-300 ring-1 ring-amber-100'
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <div>
        {/* Header with Title, Guest Author Badge & Pin */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {note.isPublic ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  <Globe className="w-2.5 h-2.5" />
                  {t.cardPublicBadge}
                </span>
              ) : null}

              {note.authorName && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                  <UserIcon className="w-2.5 h-2.5 text-neutral-400" />
                  {note.authorName}
                </span>
              )}
            </div>

            <h3
              id={`note-title-${note.id}`}
              className="text-base font-semibold text-neutral-900 tracking-tight leading-snug break-words"
            >
              {note.title || (currentLang === 'uk' ? 'Без назви' : 'Untitled')}
            </h3>
          </div>

          <button
            id={`note-pin-btn-${note.id}`}
            type="button"
            onClick={() => onTogglePin(note.id)}
            title={note.isPinned ? t.cardUnpin : t.cardPin}
            className={`p-1.5 rounded-md transition-colors shrink-0 ${
              note.isPinned
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-neutral-400 opacity-60 hover:opacity-100 hover:bg-neutral-100'
            }`}
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Content */}
        {note.content ? (
          <p
            id={`note-content-${note.id}`}
            className="text-sm text-neutral-700 whitespace-pre-wrap break-words leading-relaxed mb-4"
          >
            {note.content}
          </p>
        ) : null}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2">
          <span
            id={`note-badge-${note.id}`}
            className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getCategoryBadgeClass(
              note.category
            )}`}
          >
            {translatedCategory || (currentLang === 'uk' ? 'Загальне' : 'General')}
          </span>
          <time
            id={`note-date-${note.id}`}
            className="text-[11px] text-neutral-400 whitespace-nowrap"
          >
            {formatDate(note.createdAt)}
          </time>
        </div>

        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            id={`note-share-btn-${note.id}`}
            type="button"
            onClick={() => onShare(note)}
            title={t.cardShare}
            className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            id={`note-copy-btn-${note.id}`}
            type="button"
            onClick={handleCopy}
            title={copied ? t.cardCopied : t.cardCopy}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            id={`note-edit-btn-${note.id}`}
            type="button"
            onClick={() => onEdit(note)}
            title={t.cardEdit}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            id={`note-delete-btn-${note.id}`}
            type="button"
            onClick={() => onDelete(note.id)}
            title={t.cardDelete}
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
