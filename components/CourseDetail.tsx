
import React, { useState, useEffect } from 'react';
import type { Course } from '../types';
import { generateCourseOutline, generateLessonContentStream } from '../services/geminiService';
import LessonContent from './LessonContent';
import Certificate from './Certificate';
import { ArrowLeftIcon, LockClosedIcon, CheckCircleIcon, PlayCircleIcon, TrophyIcon, DownloadIcon, RefreshIcon, ClockIcon } from './icons';
import { useTheme } from '../ThemeContext';
import { getLesson, clearCourseCache, deleteLesson } from '../services/storageService';
import { triggerCelebration } from '../services/celebration';
import { cleanLessonTitle } from '../utils/studyNotesHelper';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

interface LessonOutline {
  title: string;
  description: string;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ course, onBack }) => {
  const { theme } = useTheme();
  const [outlines, setOutlines] = useState<LessonOutline[] | null>(() => {
    const savedOutlines = localStorage.getItem(`outlines_${course.id}`);
    if (savedOutlines) {
      try {
        const parsed = JSON.parse(savedOutlines);
        if (course.title.toLowerCase().includes("eskatolojia") && (!Array.isArray(parsed) || parsed.length !== 12)) {
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!outlines);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedLessons, setCachedLessons] = useState<Set<string>>(new Set());
  const [readingTimes, setReadingTimes] = useState<Record<string, number>>({});
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(() => {
    const savedLessonIndex = localStorage.getItem(`selectedLessonIndex_${course.id}`);
    return savedLessonIndex ? parseInt(savedLessonIndex, 10) : null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingLessonIndex, setRefreshingLessonIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
    if (!outlines) return;
    const cached = new Set<string>();
    const times: Record<string, number> = {};
    for (const outline of outlines) {
      const lesson = await getLesson(`lesson_${course.title}_${outline.title}`);
      if (lesson) {
        cached.add(outline.title);
        if (lesson.content) {
          const words = lesson.content.trim().split(/\s+/).filter(Boolean).length;
          times[outline.title] = Math.max(1, Math.ceil(words / 200));
        }
      }
    }
    setCachedLessons(cached);
    setReadingTimes(times);
  };

  useEffect(() => {
    checkCache();
  }, [outlines, course.title, selectedLessonIndex]);
  
  const [completedLessons, setCompletedLessons] = useState<boolean[]>(() => {
    const savedProgressRaw = localStorage.getItem(`progress_${course.id}`);
    if (savedProgressRaw) {
      const savedProgress = JSON.parse(savedProgressRaw);
      return Array.isArray(savedProgress) ? savedProgress : [];
    }
    return [];
  });
  const [showCertificate, setShowCertificate] = useState(() => {
    return localStorage.getItem(`showCertificate_${course.id}`) === 'true';
  });

  const [lastActiveLessonIndex, setLastActiveLessonIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem(`lastActive_${course.id}`);
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    localStorage.setItem(`showCertificate_${course.id}`, showCertificate.toString());
  }, [showCertificate, course.id]);

  useEffect(() => {
    if (selectedLessonIndex !== null) {
      localStorage.setItem(`selectedLessonIndex_${course.id}`, selectedLessonIndex.toString());
      localStorage.setItem(`lastActive_${course.id}`, selectedLessonIndex.toString());
      setLastActiveLessonIndex(selectedLessonIndex);
    } else {
      localStorage.removeItem(`selectedLessonIndex_${course.id}`);
    }
  }, [selectedLessonIndex, course.id]);

  const themeConfig = {
    cyber: {
      titleText: 'text-white',
      accentText: 'text-cyan-400',
      accentTextHover: 'hover:text-cyan-300',
      accentBorder: 'border-cyan-400',
      accentBorderHover: 'hover:border-cyan-400',
      accentBorderActive: 'border-cyan-600',
      accentButton: 'bg-cyan-600',
      accentButtonHover: 'hover:bg-cyan-500',
      mutedText: 'text-gray-400',
      baseBg: 'bg-[#131a26]',
      hoverBg: 'hover:bg-[#1b2536]',
      errorBg: 'bg-red-950', errorText: 'text-red-400',
      successBg: 'bg-green-950', successBorder: 'border-green-500', successText: 'text-green-300', successMuted: 'text-green-400',
    },
    sunrise: {
      titleText: 'text-yellow-100',
      accentText: 'text-amber-300',
      accentTextHover: 'hover:text-amber-200',
      accentBorder: 'border-amber-300',
      accentBorderHover: 'hover:border-amber-300',
      accentBorderActive: 'border-amber-500',
      accentButton: 'bg-amber-600',
      accentButtonHover: 'hover:bg-amber-500',
      mutedText: 'text-amber-200/80',
      baseBg: 'bg-[#1f1208]',
      hoverBg: 'hover:bg-[#2b190b]',
      errorBg: 'bg-red-950', errorText: 'text-red-400',
      successBg: 'bg-green-950', successBorder: 'border-green-500', successText: 'text-green-300', successMuted: 'text-green-400',
    },
    forest: {
      titleText: 'text-green-100',
      accentText: 'text-emerald-400',
      accentTextHover: 'hover:text-emerald-300',
      accentBorder: 'border-emerald-400',
      accentBorderHover: 'hover:border-emerald-400',
      accentBorderActive: 'border-emerald-600',
      accentButton: 'bg-emerald-600',
      accentButtonHover: 'hover:bg-emerald-500',
      mutedText: 'text-green-200/80',
      baseBg: 'bg-[#0a180f]',
      hoverBg: 'hover:bg-[#102417]',
      errorBg: 'bg-red-950', errorText: 'text-red-400',
      successBg: 'bg-green-950', successBorder: 'border-green-500', successText: 'text-green-300', successMuted: 'text-green-400',
    },
    light: {
      titleText: 'text-amber-950',
      accentText: 'text-amber-600',
      accentTextHover: 'hover:text-amber-500',
      accentBorder: 'border-amber-400',
      accentBorderHover: 'hover:border-amber-500',
      accentBorderActive: 'border-amber-600',
      accentButton: 'bg-amber-600',
      accentButtonHover: 'hover:bg-amber-500',
      mutedText: 'text-amber-900/60',
      baseBg: 'bg-white',
      hoverBg: 'hover:bg-amber-50/50',
      errorBg: 'bg-red-50', errorText: 'text-red-700',
      successBg: 'bg-green-50', successBorder: 'border-green-200', successText: 'text-green-800', successMuted: 'text-green-600',
    },
    classic: {
      titleText: 'text-slate-900',
      accentText: 'text-blue-600',
      accentTextHover: 'hover:text-blue-500',
      accentBorder: 'border-blue-400',
      accentBorderHover: 'hover:border-blue-500',
      accentBorderActive: 'border-blue-600',
      accentButton: 'bg-blue-600',
      accentButtonHover: 'hover:bg-blue-500',
      mutedText: 'text-slate-600',
      baseBg: 'bg-white',
      hoverBg: 'hover:bg-[#f0f2fa]',
      errorBg: 'bg-red-50', errorText: 'text-red-700',
      successBg: 'bg-green-50', successBorder: 'border-green-200', successText: 'text-green-800', successMuted: 'text-green-600',
    },
    sunny: {
      titleText: 'text-yellow-950',
      accentText: 'text-yellow-600',
      accentTextHover: 'hover:text-yellow-500',
      accentBorder: 'border-yellow-400',
      accentBorderHover: 'hover:border-yellow-500',
      accentBorderActive: 'border-yellow-600',
      accentButton: 'bg-yellow-600',
      accentButtonHover: 'hover:bg-yellow-500',
      mutedText: 'text-amber-900/60',
      baseBg: 'bg-yellow-50/30',
      hoverBg: 'hover:bg-yellow-100/40',
      errorBg: 'bg-red-50', errorText: 'text-red-700',
      successBg: 'bg-green-50', successBorder: 'border-green-200', successText: 'text-green-800', successMuted: 'text-green-600',
    }
  };
  const currentTheme = themeConfig[theme];

  useEffect(() => {
    const initializeCourse = async () => {
      // If we already have outlines and we are offline, don't try to fetch
      if (outlines && !navigator.onLine) {
        setIsLoading(false);
        return;
      }

      // If we already have outlines from localStorage, we can skip showing the loader
      if (!outlines) setIsLoading(true);
      setError(null);
      
      try {
        const fetchedOutlines = await generateCourseOutline(course.title);
        setOutlines(fetchedOutlines);
        localStorage.setItem(`outlines_${course.id}`, JSON.stringify(fetchedOutlines));

        const savedProgressRaw = localStorage.getItem(`progress_${course.id}`);
        if (savedProgressRaw) {
          const savedProgress = JSON.parse(savedProgressRaw);
          if (Array.isArray(savedProgress) && savedProgress.length === fetchedOutlines.length) {
            setCompletedLessons(savedProgress);
          } else {
            setCompletedLessons(Array(fetchedOutlines.length).fill(false));
          }
        } else {
          setCompletedLessons(Array(fetchedOutlines.length).fill(false));
        }
      } catch (err) {
        // If we have cached outlines, we don't necessarily want to show an error
        // unless they are completely missing
        if (!outlines) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeCourse();
  }, [course.id, course.title]);

  useEffect(() => {
    if (outlines && completedLessons.length === outlines.length) {
      localStorage.setItem(`progress_${course.id}`, JSON.stringify(completedLessons));
    }
  }, [completedLessons, course.id, outlines]);

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const downloadAllLessons = async () => {
    if (!outlines) return;
    setIsDownloadingAll(true);
    setDownloadProgress(0);
    
    let completedCount = 0;
    const total = outlines.length;

    try {
      for (const lesson of outlines) {
        await generateLessonContentStream(course.title, lesson.title, () => {});
        completedCount++;
        setDownloadProgress(Math.round((completedCount / total) * 100));
      }
      await checkCache();
      setNotification({
        message: "Kozi nzima imepakiwa na sasa unaweza kusoma ukiwa offline!",
        type: 'success'
      });
    } catch (err) {
      console.error("Download failed:", err);
      setNotification({
        message: "Kulitokea tatizo wakati wa kupakua. Baadhi ya masomo yanaweza kuwa hayajapakiwa.",
        type: 'error'
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleSelectLesson = (index: number) => {
    setSelectedLessonIndex(index);
    setLastActiveLessonIndex(index);
    localStorage.setItem(`lastActive_${course.id}`, index.toString());
  };
  
  const handleCompleteLesson = (index: number) => {
    const newCompletedLessons = [...completedLessons];
    if (!newCompletedLessons[index]) {
      newCompletedLessons[index] = true;
      setCompletedLessons(newCompletedLessons);
      
      const allCompletedNow = outlines && outlines.length > 0 && newCompletedLessons.slice(0, outlines.length).every(status => status === true);
      if (allCompletedNow) {
        // Delay slightly to let the transition finish before starting the burst of joy!
        setTimeout(() => {
          triggerCelebration();
        }, 300);
      }
    }

    // Set next lesson as last active if it exists
    if (outlines && index + 1 < outlines.length) {
      setLastActiveLessonIndex(index + 1);
      localStorage.setItem(`lastActive_${course.id}`, (index + 1).toString());
    } else {
      setLastActiveLessonIndex(null);
      localStorage.removeItem(`lastActive_${course.id}`);
    }

    setSelectedLessonIndex(null);
  };

  const handleRefreshCourse = () => {
    setShowConfirmModal(true);
  };

  const confirmRefreshCourse = async () => {
    setShowConfirmModal(false);
    setIsRefreshing(true);
    setIsLoading(true);
    setError(null);
    setSelectedLessonIndex(null);
    setOutlines(null);
    setCompletedLessons([]);
    setLastActiveLessonIndex(null);
    
    try {
      await clearCourseCache(course.title);
      localStorage.removeItem(`outlines_${course.id}`);
      localStorage.removeItem(`progress_${course.id}`);
      localStorage.removeItem(`selectedLessonIndex_${course.id}`);
      localStorage.removeItem(`lastActive_${course.id}`);
      localStorage.removeItem(`showCertificate_${course.id}`);
      
      const fetchedOutlines = await generateCourseOutline(course.title);
      setOutlines(fetchedOutlines);
      localStorage.setItem(`outlines_${course.id}`, JSON.stringify(fetchedOutlines));
      setCompletedLessons(Array(fetchedOutlines.length).fill(false));
      setCachedLessons(new Set());
      setNotification({
        message: "Kozi imewekwa upya kwa mafanikio! Mtaala mpya umepakiwa.",
        type: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleRefreshSingleLesson = async (e: React.MouseEvent, index: number, lessonTitle: string) => {
    e.stopPropagation();
    if (window.confirm(`Je, una uhakika unataka kufuta kumbukumbu na kurefresh Somo la ${index + 1}: "${lessonTitle}"?`)) {
      setRefreshingLessonIndex(index);
      try {
        const cacheKey = `lesson_${course.title}_${lessonTitle}`;
        await deleteLesson(cacheKey);
        
        // Update cachedLessons set
        const updatedCached = new Set(cachedLessons);
        updatedCached.delete(lessonTitle);
        setCachedLessons(updatedCached);

        // Update readingTimes map
        const updatedTimes = { ...readingTimes };
        delete updatedTimes[lessonTitle];
        setReadingTimes(updatedTimes);

        setNotification({
          message: `Somo la ${index + 1} limewekwa upya! Litakapofunguliwa, litaandikwa upya kulingana na maelekezo yote ya chuo.`,
          type: 'success'
        });
      } catch (err: any) {
        setNotification({
          message: `Imeshindwa kuweka upya somo: ${err.message || 'Hitilafu'}`,
          type: 'error'
        });
      } finally {
        setRefreshingLessonIndex(null);
      }
    }
  };
  
  const allLessonsCompleted = outlines && outlines.length > 0 && completedLessons.slice(0, outlines.length).every(status => status === true);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${currentTheme.accentBorder} mx-auto`}></div>
            <p className={`mt-4 ${currentTheme.mutedText}`}>Tunaandaa mtaala...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`text-center py-10 ${currentTheme.errorText} ${currentTheme.errorBg} rounded-lg p-4`}>
          <p>Tatizo limetokea: {error}</p>
          <button onClick={() => window.location.reload()} className={`mt-4 px-4 py-2 ${currentTheme.accentButton} ${currentTheme.accentButtonHover} text-white rounded-md`}>Jaribu Tena</button>
        </div>
      );
    }
    
    if (outlines) {
      const firstUncompletedIndex = completedLessons.findIndex(status => !status);

      return (
          <div>
            {allLessonsCompleted && (
              <div className={`${currentTheme.successBg} border ${currentTheme.successBorder} text-center p-6 rounded-lg mb-8 relative overflow-hidden`}>
                <div className="absolute top-2 right-2">
                  <button 
                    onClick={() => triggerCelebration()} 
                    className="p-1.5 rounded-full hover:bg-black/10 transition-colors text-lg"
                    title="Sherehekea tena!"
                  >
                    🎉
                  </button>
                </div>
                <h3 className={`text-2xl font-bold ${currentTheme.successText}`}>Pongezi! Umekamilisha Kozi!</h3>
                <p className={`${currentTheme.successMuted} mt-2`}>Sasa unaweza kupata cheti chako maalum cha pongezi.</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      triggerCelebration();
                      setShowCertificate(true);
                    }}
                    className="flex items-center justify-center px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors shadow-md"
                  >
                    <TrophyIcon className="h-6 w-6 mr-2" />
                    Pata Cheti Chako
                  </button>
                  <button
                    onClick={() => triggerCelebration()}
                    className={`flex items-center justify-center px-4 py-3 border ${currentTheme.accentBorder} ${currentTheme.accentText} font-semibold rounded-lg hover:bg-black/5 transition-colors`}
                  >
                    🎉 Sherehekea Tena!
                  </button>
                </div>
              </div>
            )}
            {lastActiveLessonIndex !== null && outlines && lastActiveLessonIndex < outlines.length && (
              <div className="mb-6 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                    📖 ENDELEA NA MASOMO
                  </span>
                  <h4 className={`text-base sm:text-lg font-bold ${currentTheme.titleText} mt-2`}>
                    Somo la {lastActiveLessonIndex + 1}: {cleanLessonTitle(outlines[lastActiveLessonIndex].title)}
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
              {outlines.map((outline, index) => {
                const isCompleted = completedLessons[index];
                const isLocked = false; // All lessons are now unlocked
                const isLastActive = lastActiveLessonIndex === index;

                let statusIcon;
                let cursorClass = 'cursor-pointer';
                let hoverClass = currentTheme.hoverBg;
                let lessonTextColor = isCompleted ? (theme === 'light' ? 'text-gray-800' : 'text-gray-300') : currentTheme.titleText;
                let borderColorClass = theme === 'light' ? 'border-gray-200' : 'border-gray-700';

                if (isCompleted) {
                  statusIcon = <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />;
                  borderColorClass += ' hover:border-green-500';
                } else if (isLastActive) {
                  statusIcon = <PlayCircleIcon className="h-6 w-6 text-blue-400 flex-shrink-0 animate-pulse" />;
                  borderColorClass = 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5';
                  lessonTextColor = 'text-blue-400 font-bold';
                } else {
                  statusIcon = <PlayCircleIcon className={`h-6 w-6 ${currentTheme.accentText} flex-shrink-0`} />;
                  borderColorClass = `${currentTheme.accentBorderActive} ${currentTheme.accentBorderHover}`;
                }
                
                return (
                  <div
                    key={index}
                    onClick={() => !isLocked && handleSelectLesson(index)}
                    className={`${currentTheme.baseBg} p-4 rounded-lg border flex items-center justify-between space-x-4 transition-all duration-300 ${cursorClass} ${hoverClass} ${borderColorClass}`}
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {statusIcon}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`text-lg font-semibold truncate ${lessonTextColor}`}>{cleanLessonTitle(outline.title)}</h4>
                            {isLastActive && (
                              <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full border border-blue-400 font-bold uppercase tracking-wider inline-flex items-center">
                                📖 Ulipoishia
                              </span>
                            )}
                          </div>
                          {cachedLessons.has(outline.title) && (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 uppercase tracking-tighter whitespace-nowrap">
                              Tayari Offline
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${currentTheme.mutedText} line-clamp-1`}>{outline.description}</p>
                        <div className="flex items-center space-x-1.5 mt-1.5">
                          <ClockIcon className={`h-3.5 w-3.5 ${currentTheme.mutedText} opacity-80`} />
                          <span className={`text-xs ${currentTheme.mutedText} font-medium`}>
                            {readingTimes[outline.title] !== undefined ? (
                              <span>Muda wa kusoma: ~{readingTimes[outline.title]} dk</span>
                            ) : (
                              <span className="opacity-70">Muda wa kusoma: ~6 dk (makadirio)</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Lesson-specific Refresh Button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => handleRefreshSingleLesson(e, index, outline.title)}
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

            {/* Second Course-Wide Refresh Button (Bottom Refresh) */}
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
                {isRefreshing ? "Inaweka upya Mtaala..." : "Weka Upya Mtaala na Kozi Nzima (Bottom Refresh)"}
              </button>
            </div>
          </div>
      );
    }
    return null;
  };

  if (showCertificate) {
    return <Certificate courseTitle={course.title} onBack={() => setShowCertificate(false)} />;
  }
  
  if (selectedLessonIndex !== null && outlines) {
      return (
        <LessonContent 
          courseTitle={course.title}
          lessonTitle={outlines[selectedLessonIndex].title} 
          onBack={() => handleCompleteLesson(selectedLessonIndex)} 
          onCancel={() => setSelectedLessonIndex(null)}
          lessonNumber={selectedLessonIndex + 1} 
        />
      );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Dynamic Native Confirmation Dialog inside the React tree */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${currentTheme.baseBg} border border-red-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left`}>
            <h3 className="text-xl font-bold text-red-500 mb-3 flex items-center">
              ⚠️ Weka Upya Kozi?
            </h3>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} mb-6 leading-relaxed`}>
              Je, una uhakika unataka kuweka upya mtaala na maendeleo ya kozi hii? Hii itafuta masomo uliyopakua ili uanze upya masomo mapya kwa usahihi.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`px-4 py-2 text-sm rounded-lg border ${currentTheme.accentBorder} ${currentTheme.accentText} hover:bg-black/10 transition-all`}
              >
                Ghairi
              </button>
              <button
                onClick={confirmRefreshCourse}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500 transition-all font-semibold shadow-md"
              >
                Ndio, Weka Upya
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={onBack} 
        className={`flex items-center mb-6 ${currentTheme.accentText} ${currentTheme.accentTextHover} transition-colors`}
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Rudi kwenye Masomo
      </button>

      {/* Elegant notifications with modern styling */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between border ${
          notification.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        } animate-in slide-in-from-top-4 duration-300`}>
          <span className="text-sm font-medium">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="text-xs font-bold underline hover:no-underline ml-4"
          >
            Funga
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className={`text-3xl font-bold mb-2 ${currentTheme.titleText}`}>{course.title}</h2>
          <p className={`${currentTheme.mutedText}`}>Fuata mtiririko wa masomo {outlines ? outlines.length : 12} ili kukamilisha kozi.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRefreshCourse}
            disabled={isRefreshing || isDownloadingAll}
            className={`flex items-center justify-center px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50`}
            title="Weka upya mtaala na upakue upya masomo"
          >
            <RefreshIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : 'mr-2'}`} />
            {!isRefreshing && "Weka Upya Kozi (Refresh)"}
            {isRefreshing && "Inaweka upya..."}
          </button>
          <button
            onClick={downloadAllLessons}
            disabled={isDownloadingAll || isRefreshing}
            className={`flex items-center justify-center px-4 py-2 border ${currentTheme.accentBorder} ${currentTheme.accentText} rounded-lg hover:bg-black/20 transition-all disabled:opacity-50`}
          >
            {isDownloadingAll ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Kupakua... {downloadProgress}%
              </span>
            ) : (
              <span className="flex items-center">
                <DownloadIcon className="h-5 w-5 mr-2" />
                Pakua Kozi kwa Offline
              </span>
            )}
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default CourseDetail;
