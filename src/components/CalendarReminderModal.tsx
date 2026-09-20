import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Calendar as CalendarIcon,
  Smartphone,
  Check,
  Trash2,
  ExternalLink,
  Clock,
  Apple,
  Share2,
} from 'lucide-react';
import { Note } from '../types';
import { Translations, Language } from '../translations';
import {
  getGoogleCalendarUrl,
  generateIcsContent,
  downloadIcsFile,
  formatReminderDisplay,
  isIOSDevice,
  getIcsServerUrl,
  shareIcsFile,
} from '../utils/calendar';

interface CalendarReminderModalProps {
  note: Note;
  t: Translations;
  currentLang: Language;
  onClose: () => void;
  onSaveReminder: (noteId: string, timestamp: number | undefined) => void;
}

export const CalendarReminderModal: React.FC<CalendarReminderModalProps> = ({
  note,
  t,
  currentLang,
  onClose,
  onSaveReminder,
}) => {
  const isIOS = isIOSDevice();

  // Format datetime-local input string: YYYY-MM-DDTHH:mm
  const formatInputDateTime = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const getInitialDate = (): Date => {
    if (note.reminderAt && note.reminderAt > Date.now()) {
      return new Date(note.reminderAt);
    }
    // Default to 1 hour from now, rounded to nearest 5 minutes
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
    return d;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() =>
    formatInputDateTime(getInitialDate())
  );
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [canShareFile, setCanShareFile] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const testFile = new File([''], 'test.ics', { type: 'text/calendar' });
        setCanShareFile(Boolean(navigator.canShare({ files: [testFile] })));
      } catch {
        setCanShareFile(false);
      }
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getSelectedDate = (): Date => {
    const d = new Date(selectedDateStr);
    return isNaN(d.getTime()) ? getInitialDate() : d;
  };

  const setPresetDate = (hoursAhead: number) => {
    const d = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0);
    setSelectedDateStr(formatInputDateTime(d));
  };

  const setPresetTonight = () => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    if (d.getTime() <= Date.now()) {
      d.setDate(d.getDate() + 1);
    }
    setSelectedDateStr(formatInputDateTime(d));
  };

  const setPresetTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    setSelectedDateStr(formatInputDateTime(d));
  };

  const setPresetIn2Days = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(10, 0, 0, 0);
    setSelectedDateStr(formatInputDateTime(d));
  };

  const targetDate = getSelectedDate();
  const serverIcsUrl = getIcsServerUrl(
    note.title || (currentLang === 'uk' ? 'Нотатка MikeNote' : 'MikeNote Note'),
    note.content || '',
    targetDate
  );

  const handleAppleIosCalendarClick = () => {
    onSaveReminder(note.id, targetDate.getTime());
    setFeedbackMessage(t.reminderSavedSuccess);
  };

  const handleShareIcs = async () => {
    const ics = generateIcsContent(
      note.title || 'MikeNote Нагадування',
      note.content || '',
      targetDate
    );
    const cleanFilename = (note.title || 'reminder')
      .replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ_-]/g, '_')
      .substring(0, 30);
    const shared = await shareIcsFile(
      cleanFilename,
      ics,
      note.title || 'MikeNote Нагадування'
    );
    if (shared) {
      onSaveReminder(note.id, targetDate.getTime());
      setFeedbackMessage(t.reminderSavedSuccess);
    }
  };

  const handleOpenGoogleCalendar = () => {
    const googleUrl = getGoogleCalendarUrl(
      note.title || 'Нотатка MikeNote',
      note.content || '',
      targetDate
    );
    onSaveReminder(note.id, targetDate.getTime());
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
    setFeedbackMessage(t.reminderSavedSuccess);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDownloadPhoneIcs = () => {
    const ics = generateIcsContent(
      note.title || 'Нотатка MikeNote',
      note.content || '',
      targetDate
    );
    const cleanFilename = (note.title || 'mikenote-reminder')
      .replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ_-]/g, '_')
      .substring(0, 30);
    downloadIcsFile(`${cleanFilename}.ics`, ics);

    onSaveReminder(note.id, targetDate.getTime());
    setFeedbackMessage(t.reminderSavedSuccess);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  const handleSaveOnly = () => {
    onSaveReminder(note.id, targetDate.getTime());
    setFeedbackMessage(t.reminderSavedSuccess);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleRemoveReminder = () => {
    onSaveReminder(note.id, undefined);
    setFeedbackMessage(t.reminderRemovedSuccess);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const selectedTimestamp = targetDate.getTime();
  const readableSelected = formatReminderDisplay(selectedTimestamp, currentLang);

  return (
    <div
      id="calendar-reminder-modal-overlay"
      className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="calendar-reminder-modal-content"
        className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-start justify-between gap-3 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="reminder-modal-title"
                className="text-base font-semibold text-neutral-900 tracking-tight"
              >
                {t.reminderModalTitle}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {t.reminderModalSubtitle}
              </p>
            </div>
          </div>
          <button
            id="close-reminder-modal-btn"
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note Preview */}
        <div className="px-5 pt-4">
          <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs">
            <div className="font-semibold text-neutral-900 truncate mb-1">
              📌 {note.title || (currentLang === 'uk' ? 'Без назви' : 'Untitled')}
            </div>
            {note.content && (
              <p className="text-neutral-600 line-clamp-2 leading-relaxed">
                {note.content}
              </p>
            )}
            {note.reminderAt && (
              <div className="mt-2 pt-2 border-t border-neutral-200/70 flex items-center justify-between text-[11px] text-amber-700">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {t.reminderBadgePrefix} {formatReminderDisplay(note.reminderAt, currentLang)}
                </span>
                <button
                  type="button"
                  id="remove-reminder-btn"
                  onClick={handleRemoveReminder}
                  className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t.reminderRemoveFromNote}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {/* Quick presets */}
          <div>
            <span className="block text-xs font-medium text-neutral-700 mb-1.5">
              {currentLang === 'uk' ? 'Швидкий вибір:' : 'Quick presets:'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                id="preset-1h-btn"
                onClick={() => setPresetDate(1)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-colors text-center"
              >
                {t.reminderQuickIn1h}
              </button>
              <button
                type="button"
                id="preset-tonight-btn"
                onClick={setPresetTonight}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-colors text-center"
              >
                {t.reminderQuickTonight}
              </button>
              <button
                type="button"
                id="preset-tomorrow-btn"
                onClick={setPresetTomorrowMorning}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-colors text-center"
              >
                {t.reminderQuickTomorrow}
              </button>
              <button
                type="button"
                id="preset-2days-btn"
                onClick={setPresetIn2Days}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium transition-colors text-center"
              >
                {t.reminderQuickIn2Days}
              </button>
            </div>
          </div>

          {/* DateTime picker */}
          <div>
            <label
              htmlFor="reminder-datetime-input"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              {t.reminderDateTimeLabel}
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                id="reminder-datetime-input"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                min={formatInputDateTime(new Date())}
                className="w-full bg-white border border-neutral-300 focus:border-neutral-900 rounded-xl px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors"
              />
            </div>
            {readableSelected && (
              <div className="mt-1 text-[11px] text-neutral-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                <span>
                  {currentLang === 'uk' ? 'Обрано:' : 'Selected:'} {readableSelected}
                </span>
              </div>
            )}
          </div>

          {/* Feedback message */}
          {feedbackMessage && (
            <div
              id="reminder-feedback-msg"
              className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-1.5 animate-in fade-in"
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Calendar Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* 1. Direct Apple Calendar / iPhone Link (Native iOS Event Sheet) */}
            <a
              id="open-apple-calendar-link"
              href={serverIcsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAppleIosCalendarClick}
              className="w-full inline-flex items-center justify-between px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Apple className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">{t.reminderBtnAppleIos}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
            </a>

            {/* 2. Web Share API for iOS (opens system share sheet with Calendar option) */}
            {canShareFile && (
              <button
                type="button"
                id="share-apple-calendar-btn"
                onClick={handleShareIcs}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                <span>{t.reminderBtnShareIos}</span>
              </button>
            )}

            {/* 3. Google Calendar button */}
            <button
              type="button"
              id="open-google-calendar-btn"
              onClick={handleOpenGoogleCalendar}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{t.reminderBtnGoogle}</span>
              </div>
              <ExternalLink className="w-3 h-3 opacity-60 shrink-0 ml-2" />
            </button>

            {/* 4. Phone Calendar (.ics file download for Android / PC) */}
            {!isIOS && (
              <button
                type="button"
                id="download-phone-ics-btn"
                onClick={handleDownloadPhoneIcs}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-medium transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                <span>{t.reminderBtnPhoneIcs}</span>
              </button>
            )}

            {/* 5. Just save date inside note */}
            <button
              type="button"
              id="save-reminder-only-btn"
              onClick={handleSaveOnly}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl text-xs font-medium transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-neutral-400" />
              <span>{t.reminderSaveToNote}</span>
            </button>
          </div>

          {/* Help tip with iPhone specific instructions */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-950 leading-relaxed space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <span>🍏</span> {t.reminderCalendarHint}
            </p>
            <p className="text-amber-800">
              {t.reminderIosHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

