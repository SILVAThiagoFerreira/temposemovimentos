import { SUPPORTED_LOCALES, getLocaleLabel } from '../i18n/messages.js';
import { useApp } from '../context/AppContext';

export function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, t } = useApp();

  return (
    <label className={`language-switcher ${className}`.trim()}>
      <select
        aria-label={t('language.selector')}
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {getLocaleLabel(locale, language)}
          </option>
        ))}
      </select>
    </label>
  );
}
