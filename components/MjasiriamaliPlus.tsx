import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { CheckCircleIcon, PlayCircleIcon, LockClosedIcon, ArrowLeftIcon, DownloadIcon, RefreshIcon, TrophyIcon } from './icons';
import LessonContent from './LessonContent';
import { generateLessonContentStream } from '../services/geminiService';
import { getLesson, deleteLesson, clearCourseCache } from '../services/storageService';
import { triggerCelebration } from '../services/celebration';

interface MjasiriamaliPlusProps {
  onBack: () => void;
}

const MjasiriamaliPlus: React.FC<MjasiriamaliPlusProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const [completedLessons, setCompletedLessons] = useState<boolean[]>(() => {
    const saved = localStorage.getItem('completed_mjasiriamali-plus');
    return saved ? JSON.parse(saved) : Array(12).fill(false);
  });
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedLessonIndex_mjasiriamali-plus');
    return saved ? parseInt(saved, 10) : null;
  });
  const [lastActiveLessonIndex, setLastActiveLessonIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastActive_mjasiriamali-plus');
    return saved ? parseInt(saved, 10) : null;
  });
  const [cachedLessons, setCachedLessons] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    localStorage.setItem('completed_mjasiriamali-plus', JSON.stringify(completedLessons));
  }, [completedLessons]);

  useEffect(() => {
    if (selectedLessonIndex !== null) {
      localStorage.setItem('selectedLessonIndex_mjasiriamali-plus', selectedLessonIndex.toString());
      localStorage.setItem('lastActive_mjasiriamali-plus', selectedLessonIndex.toString());
      setLastActiveLessonIndex(selectedLessonIndex);
    } else {
      localStorage.removeItem('selectedLessonIndex_mjasiriamali-plus');
    }
  }, [selectedLessonIndex]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkCache = async () => {
    const cached = new Set<string>();
    for (const lesson of lessons) {
      const stored = await getLesson(`lesson_Mjasiriamali Plus_${lesson.title}`);
      if (stored) {
        cached.add(lesson.title);
      }
    }
    setCachedLessons(cached);
  };

  useEffect(() => {
    checkCache();
  }, []);

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingLessonIndex, setRefreshingLessonIndex] = useState<number | null>(null);

  const handleRefreshSingleLesson = async (e: React.MouseEvent, index: number, lessonTitle: string) => {
    e.stopPropagation();
    if (window.confirm(`Je, una uhakika unataka kurefresh na kuandika upya Somo la ${index + 1}: "${lessonTitle}"?`)) {
      setRefreshingLessonIndex(index);
      try {
        const cacheKey = `lesson_Mjasiriamali Plus_${lessonTitle}`;
        await deleteLesson(cacheKey);
        
        const updatedCached = new Set(cachedLessons);
        updatedCached.delete(lessonTitle);
        setCachedLessons(updatedCached);

        setStatusType('success');
        setStatusMessage(`Somo la ${index + 1} limewekwa upya! Litakapofunguliwa, litaandikwa upya kwa usahihi.`);
        setTimeout(() => setStatusMessage(null), 8000);
      } catch (err: any) {
        setStatusType('error');
        setStatusMessage(`Imeshindwa kuweka upya somo: ${err.message || 'Hitilafu'}`);
        setTimeout(() => setStatusMessage(null), 8000);
      } finally {
        setRefreshingLessonIndex(null);
      }
    }
  };

  const handleRefreshCourse = async () => {
    if (window.confirm("Je, una uhakika unataka kurefresh na kufuta masomo yote ya kozi hii ili yaandikwe upya?")) {
      setIsRefreshing(true);
      try {
        await clearCourseCache("Mjasiriamali Plus");
        setCachedLessons(new Set());
        setCompletedLessons(Array(12).fill(false));
        localStorage.removeItem('completed_mjasiriamali-plus');
        localStorage.removeItem('selectedLessonIndex_mjasiriamali-plus');
        localStorage.removeItem('lastActive_mjasiriamali-plus');
        setLastActiveLessonIndex(null);
        setStatusType('success');
        setStatusMessage("Mtaala na masomo yote ya kozi hii yamewekwa upya kwa usahihi!");
        setTimeout(() => setStatusMessage(null), 8000);
      } catch (err: any) {
        setStatusType('error');
        setStatusMessage(`Hitilafu wakati wa kuweka upya mtaala: ${err.message || 'Hitilafu'}`);
        setTimeout(() => setStatusMessage(null), 8000);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const downloadAllLessons = async () => {
    setIsDownloadingAll(true);
    setDownloadProgress(0);
    setStatusMessage(null);
    setStatusType(null);
    
    let completedCount = 0;
    const total = lessons.length;

    try {
      for (const lesson of lessons) {
        await generateLessonContentStream("Mjasiriamali Plus", lesson.title, () => {});
        completedCount++;
        setDownloadProgress(Math.round((completedCount / total) * 100));
      }
      await checkCache();
      setStatusType('success');
      setStatusMessage("Masomo yote ya Mjasiriamali Plus yamepakiwa kwa offline!");
      setTimeout(() => setStatusMessage(null), 8000);
    } catch (err) {
      console.error("Download failed:", err);
      setStatusType('error');
      setStatusMessage("Kulitokea tatizo wakati wa kupakua masomo.");
      setTimeout(() => setStatusMessage(null), 8000);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const themeConfig = {
    cyber: {
      titleText: 'text-white',
      accentText: 'text-cyan-400',
      accentTextHover: 'hover:text-cyan-300',
      accentBorderActive: 'border-cyan-600',
      accentBorderHover: 'hover:border-cyan-400',
      mutedText: 'text-gray-400',
      baseBg: 'bg-[#131a26]',
      hoverBg: 'hover:bg-[#1b2536]',
    },
    sunrise: {
      titleText: 'text-yellow-100',
      accentText: 'text-amber-300',
      accentTextHover: 'hover:text-amber-200',
      accentBorderActive: 'border-amber-500',
      accentBorderHover: 'hover:border-amber-300',
      mutedText: 'text-amber-200/80',
      baseBg: 'bg-[#1f1208]',
      hoverBg: 'hover:bg-[#2b190b]',
    },
    forest: {
      titleText: 'text-green-100',
      accentText: 'text-emerald-400',
      accentTextHover: 'hover:text-emerald-300',
      accentBorderActive: 'border-emerald-600',
      accentBorderHover: 'hover:border-emerald-400',
      mutedText: 'text-green-200/80',
      baseBg: 'bg-[#0a180f]',
      hoverBg: 'hover:bg-[#102417]',
    },
    light: {
      titleText: 'text-amber-950',
      accentText: 'text-amber-600',
      accentTextHover: 'hover:text-amber-500',
      accentBorderActive: 'border-amber-600',
      accentBorderHover: 'hover:border-amber-500',
      mutedText: 'text-amber-900/60',
      baseBg: 'bg-white',
      hoverBg: 'hover:bg-amber-50/50',
    },
    classic: {
      titleText: 'text-slate-900',
      accentText: 'text-blue-600',
      accentTextHover: 'hover:text-blue-500',
      accentBorderActive: 'border-blue-600',
      accentBorderHover: 'hover:border-blue-500',
      mutedText: 'text-slate-600',
      baseBg: 'bg-white',
      hoverBg: 'hover:bg-[#f0f2fa]',
    },
    sunny: {
      titleText: 'text-yellow-950',
      accentText: 'text-yellow-600',
      accentTextHover: 'hover:text-yellow-500',
      accentBorderActive: 'border-yellow-600',
      accentBorderHover: 'hover:border-yellow-500',
      mutedText: 'text-amber-900/60',
      baseBg: 'bg-yellow-50/30',
      hoverBg: 'hover:bg-yellow-100/40',
    }
  };
  const currentTheme = themeConfig[theme];

  const lessons = [
    { title: '1. Utangulizi wa Mjasiriamali Plus', description: 'Kujenga mtazamo wa kibiashara na kutambua fursa.' },
    { title: '2. Utengenezaji wa Maandazi na Mikate', description: 'Mbinu za uokaji kwa bidhaa zinazodumu zaidi ya siku 7.' },
    { title: '3. Utengenezaji wa Biscuits na Keki', description: 'Mapishi rahisi na ufungashaji sahihi kwa ajili ya soko.' },
    { title: '4. Utengenezaji wa Ubuyu', description: 'Mbinu za kuongeza thamani na kukausha vizuri.' },
    { title: '5. Utengenezaji wa Mafuta ya Mgando na Lotion', description: 'Kuchanganya mafuta ya asili na harufu kwa ubora.' },
    { title: '6. Utengenezaji wa Sabuni za Mche', description: 'Mchakato wa Cold Process kwa sabuni imara.' },
    { title: '7. Utengenezaji wa Sabuni za Maji', description: 'Kutengeneza sabuni za maji kwa matumizi ya nyumbani na biashara.' },
    { title: '8. Malighafi na Vifungashio (Dar & Kibaha)', description: 'Maeneo ya kununua kemikali na vifungashio kwa bei ya jumla.' },
    { title: '9. Branding: Kuunda Brand na Stika Bora', description: 'Kutengeneza jina la biashara, logo, na stika zinazovutia.' },
    { title: '10. Ufungashaji (Packaging) wa Kitaalamu', description: 'Ufungashaji unaozuia hewa na kuongeza muda wa bidhaa.' },
    { title: '11. Mikakati ya Masoko na Njia za Kuuza', description: 'Kutumia mitandao ya kijamii na wauzaji wa jumla.' },
    { title: '12. Usimamizi wa Fedha za Biashara Ndogo', description: 'Kutenganisha mtaji na faida kwa ukuaji wa biashara.' },
  ];

  const firstUncompletedIndex = completedLessons.findIndex(status => !status);

  const handleSelectLesson = (index: number) => {
    setSelectedLessonIndex(index);
    setLastActiveLessonIndex(index);
    localStorage.setItem('lastActive_mjasiriamali-plus', index.toString());
  };

  if (selectedLessonIndex !== null) {
    return (
      <LessonContent 
        courseTitle="Mjasiriamali Plus"
        lessonTitle={lessons[selectedLessonIndex].title} 
        onBack={() => {
          setCompletedLessons(prev => {
            const next = [...prev];
            next[selectedLessonIndex] = true;
            
            // Trigger celebration if this completes the course!
            const allCompleted = next.every(status => status === true);
            if (allCompleted) {
              setTimeout(() => {
                triggerCelebration();
              }, 300);
            }
            return next;
          });

          // Set next lesson as last active if it exists
          if (selectedLessonIndex + 1 < lessons.length) {
            setLastActiveLessonIndex(selectedLessonIndex + 1);
            localStorage.setItem('lastActive_mjasiriamali-plus', (selectedLessonIndex + 1).toString());
          } else {
            setLastActiveLessonIndex(null);
            localStorage.removeItem('lastActive_mjasiriamali-plus');
          }

          setSelectedLessonIndex(null);
        }} 
        onCancel={() => setSelectedLessonIndex(null)}
        lessonNumber={selectedLessonIndex + 1} 
      />
    );
  }

  const allLessonsCompleted = completedLessons.length > 0 && completedLessons.every(status => status === true);
  const successTheme = {
    cyber: { bg: 'bg-green-950/30 border-green-500/30 text-green-300', muted: 'text-green-400' },
    sunrise: { bg: 'bg-amber-950/30 border-amber-500/30 text-amber-200', muted: 'text-amber-300' },
    forest: { bg: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300', muted: 'text-emerald-400' },
    light: { bg: 'bg-green-50 border-green-200 text-green-800', muted: 'text-green-600' },
    classic: { bg: 'bg-green-50 border-green-200 text-green-800', muted: 'text-green-600' },
    sunny: { bg: 'bg-green-50 border-green-200 text-green-800', muted: 'text-green-600' },
  }[theme] || { bg: 'bg-green-50 border-green-200 text-green-800', muted: 'text-green-600' };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <button 
        onClick={onBack} 
        className={`flex items-center mb-6 ${currentTheme.accentText} ${currentTheme.accentTextHover} transition-colors`}
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Rudi kwenye Masomo
      </button>

      {allLessonsCompleted && (
        <div className={`${successTheme.bg} border-2 border-dashed p-6 rounded-lg mb-8 text-center relative overflow-hidden`}>
          <div className="absolute top-2 right-2">
            <button 
              onClick={() => triggerCelebration()} 
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors text-lg animate-bounce"
              title="Sherehekea tena!"
            >
              🎉
            </button>
          </div>
          <h3 className="text-2xl font-bold mb-2 flex items-center justify-center">
            <TrophyIcon className="h-7 w-7 text-yellow-500 mr-2 animate-pulse" />
            Hongera Sana! Umekamilisha Kozi Nzima ya Mjasiriamali Plus!
          </h3>
          <p className={`${successTheme.muted} text-sm max-w-xl mx-auto`}>
            Umekamilisha safari ya masomo yote 12 ya ujasiriamali. Sasa umejipanga vizuri kwa ajili ya kufanya biashara na kusimamia fedha kwa weledi mkubwa!
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => triggerCelebration()}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-md transition-colors"
            >
              🎉 Sherehekea Mafanikio!
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className={`p-4 mb-6 rounded-lg font-medium text-sm flex items-center justify-between transition-all ${
          statusType === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs underline hover:no-underline ml-4">Funga</button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${currentTheme.titleText}`}>Mjasiriamali Plus</h2>
          <p className={`${currentTheme.mutedText}`}>Fuata mtiririko wa masomo 12 ili kukamilisha kozi.</p>
        </div>
        <button
          onClick={downloadAllLessons}
          disabled={isDownloadingAll}
          className={`flex items-center justify-center px-4 py-2 border ${currentTheme.accentBorderActive} ${currentTheme.accentText} rounded-lg hover:bg-black/20 transition-all disabled:opacity-50`}
        >
          {isDownloadingAll ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Kupakua... {downloadProgress}%
            </span>
          ) : (
            <span className="flex items-center">
              <DownloadIcon className="h-5 w-5 mr-2" />
              Pakua Kozi yote
            </span>
          )}
        </button>
      </div>

      {lastActiveLessonIndex !== null && lastActiveLessonIndex < lessons.length && (
        <div className="mb-6 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              📖 ENDELEA NA MASOMO
            </span>
            <h4 className={`text-base sm:text-lg font-bold ${currentTheme.titleText} mt-2`}>
              Somo la {lastActiveLessonIndex + 1}: {lessons[lastActiveLessonIndex].title}
            </h4>
            <p className={`text-xs ${currentTheme.mutedText} mt-1`}>
              Ulisoma hili mara ya mwisho. Bonyeza kitufe kuendelea kusoma ulipoishia!
            </p>
          </div>
          <button
            onClick={() => handleSelectLesson(lastActiveLessonIndex)}
            className="flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-md transition-all self-stretch sm:self-auto"
          >
            <PlayCircleIcon className="h-5 w-5 mr-1.5" />
            Endelea Ulipoishia
          </button>
        </div>
      )}
      
      <div className="space-y-3">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessons[index];
          const isNext = index === firstUncompletedIndex;
          const isLocked = !isCompleted && !isNext;
          const isLastActive = lastActiveLessonIndex === index;

          let statusIcon;
          let cursorClass = isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer';
          let hoverClass = isLocked ? '' : currentTheme.hoverBg;
          let lessonTextColor = currentTheme.mutedText;
          let borderColorClass = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

          if (isCompleted) {
            statusIcon = <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />;
            lessonTextColor = theme === 'light' ? 'text-gray-800' : 'text-gray-300';
            borderColorClass += ' hover:border-green-500';
          } else if (isLastActive) {
            statusIcon = <PlayCircleIcon className="h-6 w-6 text-blue-400 flex-shrink-0 animate-pulse" />;
            borderColorClass = 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5';
            lessonTextColor = 'text-blue-400 font-bold';
            cursorClass = 'cursor-pointer';
            hoverClass = currentTheme.hoverBg;
          } else if (isNext) {
            statusIcon = <PlayCircleIcon className={`h-6 w-6 ${currentTheme.accentText} flex-shrink-0`} />;
            lessonTextColor = currentTheme.titleText;
            borderColorClass = `${currentTheme.accentBorderActive} ${currentTheme.accentBorderHover}`;
            hoverClass += ' animate-pulse';
          } else {
            statusIcon = <LockClosedIcon className="h-6 w-6 text-gray-600 flex-shrink-0" />;
          }

          return (
            <div
              key={index}
              onClick={() => (!isLocked || isLastActive) && handleSelectLesson(index)}
              className={`${currentTheme.baseBg} p-4 rounded-lg border flex items-center justify-between space-x-4 transition-all duration-300 ${cursorClass} ${hoverClass} ${borderColorClass}`}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {statusIcon}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-lg font-semibold truncate ${lessonTextColor}`}>{lesson.title}</h4>
                      {isLastActive && (
                        <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full border border-blue-400 font-bold uppercase tracking-wider inline-flex items-center">
                          📖 Ulipoishia
                        </span>
                      )}
                    </div>
                    {cachedLessons.has(lesson.title) && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 uppercase tracking-tighter whitespace-nowrap">
                        Tayari Offline
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${currentTheme.mutedText} line-clamp-1`}>{lesson.description}</p>
                </div>
              </div>

              {/* Lesson-specific Refresh Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={(e) => handleRefreshSingleLesson(e, index, lesson.title)}
                  disabled={refreshingLessonIndex === index}
                  className="p-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full transition-all"
                  title={`Weka upya Somo la ${index + 1}`}
                >
                  <RefreshIcon className={`h-5 w-5 ${refreshingLessonIndex === index ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course-Wide Refresh Button (Bottom Refresh) */}
      <div className="mt-8 pt-6 border-t border-dashed border-gray-700/50 flex flex-col items-center justify-center space-y-3">
        <p className={`text-sm ${currentTheme.mutedText} text-center`}>
          Je, unataka kurefresh na kuandika upya mtaala mzima wa kozi hii?
        </p>
        <button
          onClick={handleRefreshCourse}
          disabled={isRefreshing || isDownloadingAll}
          className="flex items-center justify-center px-6 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500 text-red-400 rounded-lg transition-all text-sm font-semibold disabled:opacity-50"
        >
          <RefreshIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? "Inaweka upya..." : "Weka Upya Mtaala na Kozi Nzima (Bottom Refresh)"}
        </button>
      </div>
    </div>
  );
};

export default MjasiriamaliPlus;
