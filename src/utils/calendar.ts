/**
 * Calendar utilities for Google Calendar and native Phone iCalendar (.ics) exports
 */

export function toGoogleCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function getGoogleCalendarUrl(
  title: string,
  description: string,
  startDate: Date,
  durationMinutes = 30
): string {
  const startStr = toGoogleCalendarUtc(startDate);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const endStr = toGoogleCalendarUtc(endDate);

  const cleanTitle = encodeURIComponent(title || 'MikeNote Нагадування');
  const cleanDetails = encodeURIComponent(description || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${cleanTitle}&details=${cleanDetails}&dates=${startStr}/${endStr}`;
}

export function generateIcsContent(
  title: string,
  description: string,
  startDate: Date,
  durationMinutes = 30
): string {
  const startStr = toGoogleCalendarUtc(startDate);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const endStr = toGoogleCalendarUtc(endDate);
  const nowStr = toGoogleCalendarUtc(new Date());
  const uid = `mikenote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@mikenote.app`;

  const cleanTitle = (title || 'Нагадування').replace(/[\r\n]+/g, ' ').trim();
  const cleanDescription = (description || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MikeNote//Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${cleanTitle}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || '';
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh|MacIntel/.test(platform) && (navigator.maxTouchPoints || 0) > 1)
  );
}

export function getIcsServerUrl(
  title: string,
  description: string,
  startDate: Date,
  durationMinutes = 30
): string {
  const params = new URLSearchParams({
    title: (title || 'MikeNote Нагадування').slice(0, 120),
    details: (description || '').slice(0, 800),
    start: startDate.getTime().toString(),
    duration: durationMinutes.toString(),
  });
  return `/api/calendar/event.ics?${params.toString()}`;
}

export async function shareIcsFile(
  filename: string,
  icsContent: string,
  title: string
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }
  try {
    const file = new File([icsContent], filename.endsWith('.ics') ? filename : `${filename}.ics`, {
      type: 'text/calendar;charset=utf-8',
    });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title,
      });
      return true;
    }
  } catch (err) {
    // If user cancelled, don't crash
    if ((err as Error)?.name === 'AbortError') {
      return true;
    }
    console.warn('Share API failed:', err);
  }
  return false;
}

export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatReminderDisplay(timestamp: number, lang: 'uk' | 'en'): string {
  try {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();

    const timeStr = d.toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return lang === 'uk' ? `Сьогодні, ${timeStr}` : `Today, ${timeStr}`;
    }
    if (isTomorrow) {
      return lang === 'uk' ? `Завтра, ${timeStr}` : `Tomorrow, ${timeStr}`;
    }

    const dateStr = d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
      day: 'numeric',
      month: 'short',
    });
    return `${dateStr}, ${timeStr}`;
  } catch {
    return '';
  }
}
