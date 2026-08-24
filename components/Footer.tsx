
import React from 'react';
import { useTheme, Theme } from '../ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themeConfig = {
      cyber: { ringOffset: 'ring-offset-gray-900' },
      sunrise: { ringOffset: 'ring-offset-yellow-900' },
      forest: { ringOffset: 'ring-offset-slate-900' },
      light: { ringOffset: 'ring-offset-amber-50' },
      classic: { ringOffset: 'ring-offset-slate-100' },
      sunny: { ringOffset: 'ring-offset-amber-100' },
  }

  const themes: { name: Theme; color: string; label: string; }[] = [
    { name: 'cyber', color: 'bg-cyan-400', label: 'Cyber' },
    { name: 'sunrise', color: 'bg-amber-400', label: 'Sunrise' },
    { name: 'forest', color: 'bg-emerald-400', label: 'Forest' },
    { name: 'light', color: 'bg-amber-400 border border-amber-100', label: 'Manjano & Nyeupe' },
    { name: 'classic', color: 'bg-indigo-500 border border-indigo-200', label: 'Bluu & Lavender' },
    { name: 'sunny', color: 'bg-yellow-500 border border-yellow-200', label: 'Zahabu & Jua' },
  ];

  return (
    <div className="flex justify-center items-center space-x-4 mb-5">
      <span className="text-sm">Mandhari:</span>
      <div className="flex items-center space-x-3">
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            aria-label={`Switch to ${t.label} theme`}
            className={`w-6 h-6 rounded-full ${t.color} transition-all duration-300 transform hover:scale-110 focus:outline-none ${
              theme === t.name ? `ring-2 ring-white ${themeConfig[theme].ringOffset}` : 'scale-90 opacity-70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  const { theme } = useTheme();

  const themeConfig = {
    cyber: { bg: 'bg-gray-900/70', border: 'border-gray-700/50', textMuted: 'text-gray-500', textPrimary: 'text-gray-400', linkHover: 'hover:text-cyan-400' },
    sunrise: { bg: 'bg-black/20', border: 'border-amber-900/50', textMuted: 'text-amber-200/70', textPrimary: 'text-amber-200', linkHover: 'hover:text-amber-300' },
    forest: { bg: 'bg-black/20', border: 'border-emerald-900/50', textMuted: 'text-green-200/70', textPrimary: 'text-green-200', linkHover: 'hover:text-emerald-300' },
    light: { bg: 'bg-amber-50/40', border: 'border-amber-100', textMuted: 'text-amber-900/60', textPrimary: 'text-amber-950', linkHover: 'hover:text-amber-600' },
    classic: { bg: 'bg-white/70', border: 'border-slate-200/80', textMuted: 'text-slate-500', textPrimary: 'text-slate-700', linkHover: 'hover:text-blue-600' },
    sunny: { bg: 'bg-yellow-50/40', border: 'border-yellow-100', textMuted: 'text-amber-900/60', textPrimary: 'text-yellow-950', linkHover: 'hover:text-yellow-600' },
  }

  const currentTheme = themeConfig[theme];

  return (
    <footer className={`${currentTheme.bg} border-t ${currentTheme.border} mt-12 py-6 backdrop-blur-sm`}>
      <div className={`max-w-7xl mx-auto px-4 md:px-8 w-full text-center ${currentTheme.textMuted}`}>
        <ThemeSwitcher />
        <p className="text-sm">
          App hii imebuniwa na kutengenezwa na <span className={`font-semibold ${currentTheme.textPrimary}`}>Joseph Marwa Kyama</span>.
        </p>
        <div className="flex flex-col sm:flex-row sm:justify-center items-center sm:space-x-4 mt-2 text-xs">
          <a href="mailto:josephkyama69@gmail.com" className={`${currentTheme.linkHover} transition-colors py-1 sm:py-0`}>
            josephkyama69@gmail.com
          </a>
          <span className="hidden sm:inline">&bull;</span>
          <a href="tel:+255769500621" className={`${currentTheme.linkHover} transition-colors py-1 sm:py-0`}>
            0769500621
          </a>
          <span className="hidden sm:inline">&bull;</span>
          <span className="py-1 sm:py-0 font-medium text-emerald-400">Makao Makuu: Kibaha, Pwani, Tanzania (TZ)</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
