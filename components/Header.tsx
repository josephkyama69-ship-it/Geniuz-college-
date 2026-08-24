
import React from 'react';
import { BookOpenIcon } from './icons';
import { useTheme } from '../ThemeContext';

const Header: React.FC = () => {
  const { theme } = useTheme();

  const themeConfig = {
    cyber: {
      bg: 'bg-gray-900/50',
      text: 'text-white',
      accent: 'text-cyan-400',
      shadow: 'shadow-cyan-500/10'
    },
    sunrise: {
      bg: 'bg-black/20',
      text: 'text-yellow-100',
      accent: 'text-amber-300',
      shadow: 'shadow-amber-500/10'
    },
    forest: {
      bg: 'bg-black/20',
      text: 'text-green-100',
      accent: 'text-emerald-400',
      shadow: 'shadow-emerald-500/10'
    },
    light: {
      bg: 'bg-white/80',
      text: 'text-amber-950',
      accent: 'text-amber-500',
      shadow: 'shadow-amber-500/5'
    },
    classic: {
      bg: 'bg-white/90',
      text: 'text-indigo-950',
      accent: 'text-blue-600',
      shadow: 'shadow-indigo-500/5'
    },
    sunny: {
      bg: 'bg-amber-50/80',
      text: 'text-yellow-950',
      accent: 'text-yellow-600',
      shadow: 'shadow-yellow-500/5'
    }
  };

  const currentTheme = themeConfig[theme];

  return (
    <header className={`${currentTheme.bg} backdrop-blur-sm shadow-lg ${currentTheme.shadow} sticky top-0 z-50 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full py-3 flex items-center justify-center">
        <BookOpenIcon className={`h-8 w-8 ${currentTheme.accent} mr-3 transition-colors duration-500`} />
        <h1 className={`text-2xl md:text-3xl font-bold ${currentTheme.text} tracking-wider transition-colors duration-500`}>
          Giniaz College
        </h1>
      </div>
    </header>
  );
};

export default Header;
