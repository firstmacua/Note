import React, { useState } from 'react';
import {
  X,
  Send,
  Share2,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Smartphone,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { Note } from '../types';

interface ShareModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ note, isOpen, onClose }) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [systemShareError, setSystemShareError] = useState(false);

  if (!isOpen || !note) return null;

  // Prepare note formatted message
  const formattedMessage = `📌 ${note.title}\n\n${note.content}${
    note.category ? `\n\nКатегория: ${note.category}` : ''
  }`;

  // Generate shareable link
  const createShareLink = () => {
    try {
      const payload = {
        t: note.title,
        c: note.content,
        cat: note.category,
      };
      const json = JSON.stringify(payload);
      // Safe base64 encoding for utf-8
      const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
      const url = new URL(window.location.href);
      url.searchParams.set('shared', b64);
      return url.toString();
    } catch {
      return window.location.href;
    }
  };

  const shareUrl = createShareLink();

  // Social URLs
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
    `📌 ${note.title}\n\n${note.content}`
  )}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `📌 ${note.title}\n\n${note.content}\n\nСсылка на заметку: ${shareUrl}`
  )}`;

  const emailSubject = encodeURIComponent(`Заметка: ${note.title}`);
  const emailBody = encodeURIComponent(
    `${note.content}\n\nКатегория: ${note.category}\n\nОткрыть в приложении: ${shareUrl}`
  );
  const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  const smsUrl = `sms:?body=${encodeURIComponent(`${note.title}: ${note.content}`)}`;

  const copyToClipboard = async (text: string, isLinkType: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLinkType) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      if (isLinkType) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: `${note.title}\n\n${note.content}`,
          url: shareUrl,
        });
      } catch (err: unknown) {
        // Ignore user cancellation, show message only if actual error
        if (err instanceof Error && err.name !== 'AbortError') {
          setSystemShareError(true);
          setTimeout(() => setSystemShareError(false), 3000);
        }
      }
    } else {
      // Fallback: copy link directly
      copyToClipboard(shareUrl, true);
    }
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="share-modal-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              id="share-header-icon"
              className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base font-semibold text-neutral-900 leading-tight">
                Отправить заметку другу
              </h2>
              <p id="share-modal-subtitle" className="text-xs text-neutral-500">
                Выберите удобный способ отправки
              </p>
            </div>
          </div>

          <button
            id="share-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note Preview Box */}
        <div
          id="share-note-preview"
          className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 text-left max-h-32 overflow-y-auto"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-xs font-semibold text-neutral-900 truncate">{note.title}</h4>
            <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-medium shrink-0">
              {note.category}
            </span>
          </div>
          <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed whitespace-pre-wrap">
            {note.content || '(Без текста)'}
          </p>
        </div>

        {/* Messenger Action Grid */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">
            Отправить через мессенджер
          </span>

          <div id="share-channels-grid" className="grid grid-cols-2 gap-2.5">
            {/* Telegram */}
            <a
              id="share-telegram-btn"
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-sky-100 bg-sky-50/50 hover:bg-sky-50 text-sky-900 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Send className="w-3.5 h-3.5" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold leading-none mb-1 flex items-center gap-1">
                  Telegram
                  <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                </div>
                <div className="text-[10px] text-sky-700 leading-none">В личные сообщения</div>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              id="share-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold leading-none mb-1 flex items-center gap-1">
                  WhatsApp
                  <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                </div>
                <div className="text-[10px] text-emerald-700 leading-none">Чат или группа</div>
              </div>
            </a>

            {/* Email */}
            <a
              id="share-email-btn"
              href={mailtoUrl}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold leading-none mb-1">Почта (Email)</div>
                <div className="text-[10px] text-neutral-500 leading-none">Письмом другу</div>
              </div>
            </a>

            {/* SMS / Messages */}
            <a
              id="share-sms-btn"
              href={smsUrl}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold leading-none mb-1">SMS / iMessage</div>
                <div className="text-[10px] text-neutral-500 leading-none">На телефон</div>
              </div>
            </a>
          </div>
        </div>

        {/* Direct Link and Native Share */}
        <div className="pt-2 border-t border-neutral-100 space-y-2.5">
          {/* Native Web Share API button if supported */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              id="native-share-btn"
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Поделиться через меню устройства</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {/* Copy full text button */}
            <button
              id="copy-text-message-btn"
              type="button"
              onClick={() => copyToClipboard(formattedMessage, false)}
              className="flex-1 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Текст скопирован</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Скопировать текст</span>
                </>
              )}
            </button>

            {/* Copy direct link button */}
            <button
              id="copy-direct-link-btn"
              type="button"
              onClick={() => copyToClipboard(shareUrl, true)}
              className="flex-1 py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Ссылка скопирована</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Скопировать ссылку</span>
                </>
              )}
            </button>
          </div>

          {systemShareError && (
            <p className="text-[11px] text-amber-600 text-center">
              Не удалось открыть системное меню. Ссылка скопирована в буфер обмена.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
