
import React from 'react';
import type { Course } from '../types';
import { useTheme } from '../ThemeContext';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const { theme } = useTheme();
  const Icon = course.icon;

  const themeConfig = {
    cyber: {
      accentText: 'text-cyan-400',
      hoverBorder: 'hover:border-cyan-500',
      hoverShadow: 'hover:shadow-cyan-500/20',
      bg: 'bg-gray-800',
      text: 'text-white',
      mutedText: 'text-gray-400',
      border: 'border-gray-700/50',
      iconBg: 'bg-gray-700/50',
      iconBorder: 'border-gray-600/50',
      progressBg: 'bg-gray-700',
      progressFill: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]',
    },
    sunrise: {
      accentText: 'text-amber-300',
      hoverBorder: 'hover:border-amber-400',
      hoverShadow: 'hover:shadow-amber-400/20',
      bg: 'bg-yellow-900/30',
      text: 'text-yellow-100',
      mutedText: 'text-amber-200/80',
      border: 'border-amber-800/50',
      iconBg: 'bg-black/20',
      iconBorder: 'border-amber-800/50',
      progressBg: 'bg-yellow-950/60',
      progressFill: 'bg-amber-500',
    },
    forest: {
      accentText: 'text-emerald-400',
      hoverBorder: 'hover:border-emerald-500',
      hoverShadow: 'hover:shadow-emerald-500/20',
      bg: 'bg-green-900/30',
      text: 'text-green-100',
      mutedText: 'text-green-200/80',
      border: 'border-emerald-800/50',
      iconBg: 'bg-black/20',
      iconBorder: 'border-emerald-800/50',
      progressBg: 'bg-green-950/60',
      progressFill: 'bg-emerald-500',
    },
    light: {
      accentText: 'text-amber-600',
      hoverBorder: 'hover:border-amber-400',
      hoverShadow: 'hover:shadow-amber-500/10',
      bg: 'bg-white',
      text: 'text-amber-950',
      mutedText: 'text-amber-900/60',
      border: 'border-amber-100',
      iconBg: 'bg-amber-50/50',
      iconBorder: 'border-amber-100/50',
      progressBg: 'bg-amber-100/30',
      progressFill: 'bg-amber-500',
    },
    classic: {
      accentText: 'text-blue-600',
      hoverBorder: 'hover:border-blue-400',
      hoverShadow: 'hover:shadow-blue-500/10',
      bg: 'bg-white',
      text: 'text-slate-900',
      mutedText: 'text-slate-600',
      border: 'border-slate-200/80',
      iconBg: 'bg-[#f0f2fa]',
      iconBorder: 'border-slate-200',
      progressBg: 'bg-slate-100',
      progressFill: 'bg-blue-600',
    },
    sunny: {
      accentText: 'text-yellow-600',
      hoverBorder: 'hover:border-yellow-400',
      hoverShadow: 'hover:shadow-yellow-500/10',
      bg: 'bg-yellow-50/30',
      text: 'text-yellow-950',
      mutedText: 'text-amber-900/60',
      border: 'border-yellow-100',
      iconBg: 'bg-amber-50/50',
      iconBorder: 'border-yellow-100/50',
      progressBg: 'bg-yellow-100/30',
      progressFill: 'bg-yellow-500',
    }
  };

  const currentTheme = themeConfig[theme];

  // Kokotoa maendeleo (Progress calculation from localStorage)
  const savedOutlines = localStorage.getItem(`outlines_${course.id}`);
  const savedProgress = localStorage.getItem(`progress_${course.id}`);

  let totalLessons = 0;
  let completedCount = 0;
  let percentage = 0;

  if (savedOutlines) {
    try {
      const outlines = JSON.parse(savedOutlines);
      if (Array.isArray(outlines)) {
        if (course.title.toLowerCase().includes("eskatolojia") && outlines.length !== 12) {
          totalLessons = 12;
        } else {
          totalLessons = outlines.length;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (totalLessons === 0 && course.title.toLowerCase().includes("eskatolojia")) {
    totalLessons = 12;
  }

  if (savedProgress) {
    try {
      const progress = JSON.parse(savedProgress);
      if (Array.isArray(progress)) {
        completedCount = progress.filter(Boolean).length;
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (totalLessons > 0) {
    percentage = Math.round((completedCount / totalLessons) * 100);
  }

  return (
    <div 
      onClick={onClick}
      className={`${currentTheme.bg} rounded-lg p-6 flex flex-col items-center text-center cursor-pointer
                 border ${currentTheme.border} ${currentTheme.hoverBorder} transition-all duration-300
                 transform hover:-translate-y-1 hover:shadow-2xl ${currentTheme.hoverShadow} w-full h-full justify-between`}
    >
      <div className="flex flex-col items-center flex-grow w-full">
        <div className={`${currentTheme.iconBg} p-4 rounded-full mb-4 border-2 ${currentTheme.iconBorder} transition-colors`}>
          <Icon className={`h-10 w-10 ${currentTheme.accentText} transition-colors`} />
        </div>
        <h3 className={`text-lg font-semibold ${currentTheme.text} mb-2 transition-colors line-clamp-1`}>{course.title}</h3>
        <p className={`${currentTheme.mutedText} text-sm transition-colors line-clamp-2 mb-4`}>{course.description}</p>
      </div>
      
      {/* Progress Section */}
      <div className="w-full pt-4 mt-auto border-t border-gray-700/10 dark:border-gray-200/5">
        <div className="flex justify-between items-center mb-1.5 text-xs">
          <span className={`${currentTheme.mutedText} font-medium`}>
            {totalLessons > 0 
              ? `Masomo: ${completedCount}/${totalLessons}` 
              : 'Hujaanza bado'}
          </span>
          <span className={`${currentTheme.accentText} font-bold`}>
            {percentage}%
          </span>
        </div>
        <div className={`w-full h-2 rounded-full ${currentTheme.progressBg} overflow-hidden`}>
          <div 
            className={`h-full rounded-full ${currentTheme.progressFill} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
