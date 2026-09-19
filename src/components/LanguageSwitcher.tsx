import React from 'react';
import { Languages } from 'lucide-react';
import { Language } from '../translations';

interface LanguageSwitcherProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLang,
  onLanguageChange,
}) => {
  return (
    <div
      id="language-switcher"
      className="inline-flex items-center p-0.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs shadow-2xs"
    >
      <button
        type="button"
        id="lang-btn-uk"
        onClick={() => onLanguageChange('uk')}
        className={`px-2 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
          currentLang === 'uk'
            ? 'bg-white text-neutral-900 shadow-xs'
            : 'text-neutral-500 hover:text-neutral-900'
        }`}
        title="Українська мова (за замовчуванням)"
      >
        <span className="text-xs">🇺🇦</span>
        <span>УКР</span>
      </button>

      <button
        type="button"
        id="lang-btn-en"
        onClick={() => onLanguageChange('en')}
        className={`px-2 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
          currentLang === 'en'
            ? 'bg-white text-neutral-900 shadow-xs'
            : 'text-neutral-500 hover:text-neutral-900'
        }`}
        title="English language"
      >
        <span className="text-xs">🇬🇧</span>
        <span>ENG</span>
      </button>
    </div>
  );
};
