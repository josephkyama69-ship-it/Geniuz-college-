import React, { useState, useEffect, useRef } from 'react';
import type { Course } from '../types';
import { generateCourseOutline, generateLessonContentStream } from '../services/geminiService';
import LessonContent from './LessonContent';
import Certificate from './Certificate';
import { 
  ArrowLeftIcon, LockClosedIcon, CheckCircleIcon, PlayCircleIcon, 
  TrophyIcon, DownloadIcon, RefreshIcon, ClockIcon, CopyIcon, SparklesIcon, CodeBracketIcon
} from './icons';
import { useTheme } from '../ThemeContext';
import { getLesson, clearCourseCache, deleteLesson } from '../services/storageService';
import { triggerCelebration } from '../services/celebration';
import { cleanLessonTitle } from '../utils/studyNotesHelper';

interface ApiEconomyProps {
  course: Course;
  onBack: () => void;
}

interface LessonOutline {
  title: string;
  description: string;
}

const ApiEconomy: React.FC<ApiEconomyProps> = ({ course, onBack }) => {
  const { theme } = useTheme();
  
  // Active Main Tab: "masomo" vs "kiwanda"
  const [activeMainTab, setActiveMainTab] = useState<'masomo' | 'kiwanda'>(() => {
    return (localStorage.getItem(`api_economy_main_tab`) as 'masomo' | 'kiwanda') || 'masomo';
  });

  useEffect(() => {
    localStorage.setItem(`api_economy_main_tab`, activeMainTab);
  }, [activeMainTab]);

  // --- TAB 1: MASOMO STATE & LOGIC (Consistent with CourseDetail) ---
  const [outlines, setOutlines] = useState<LessonOutline[] | null>(() => {
    const savedOutlines = localStorage.getItem(`outlines_${course.id}`);
    if (savedOutlines) {
      try {
        return JSON.parse(savedOutlines);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoadingOutlines, setIsLoadingOutlines] = useState(!outlines);
  const [outlineError, setOutlineError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedLessons, setCachedLessons] = useState<Set<string>>(new Set());
  const [readingTimes, setReadingTimes] = useState<Record<string, number>>({});
  
  // Save/Restore Selected Lesson Index so students continue where they left off!
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(() => {
    const saved = localStorage.getItem(`selectedLessonIndex_${course.id}`);
    return saved ? parseInt(saved, 10) : null;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingLessonIndex, setRefreshingLessonIndex] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [completedLessons, setCompletedLessons] = useState<boolean[]>(() => {
    const saved = localStorage.getItem(`progress_${course.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [showCertificate, setShowCertificate] = useState(() => {
    return localStorage.getItem(`showCertificate_${course.id}`) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(`showCertificate_${course.id}`, showCertificate.toString());
  }, [showCertificate, course.id]);

  useEffect(() => {
    if (selectedLessonIndex !== null) {
      localStorage.setItem(`selectedLessonIndex_${course.id}`, selectedLessonIndex.toString());
      localStorage.setItem(`lastActive_${course.id}`, selectedLessonIndex.toString());
    } else {
      localStorage.removeItem(`selectedLessonIndex_${course.id}`);
    }
  }, [selectedLessonIndex, course.id]);

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

  // Load Outlines if not in cache
  useEffect(() => {
    if (outlines) return;
    const loadOutlines = async () => {
      setIsLoadingOutlines(true);
      setOutlineError(null);
      try {
        const data = await generateCourseOutline(course.title);
        if (data && Array.isArray(data)) {
          setOutlines(data);
          localStorage.setItem(`outlines_${course.id}`, JSON.stringify(data));
          if (completedLessons.length === 0) {
            const initialProgress = new Array(data.length).fill(false);
            setCompletedLessons(initialProgress);
            localStorage.setItem(`progress_${course.id}`, JSON.stringify(initialProgress));
          }
        } else {
          throw new Error("Mtaala haukupatikana vizuri.");
        }
      } catch (err: any) {
        setOutlineError(err.message || "Hitilafu imetokea wakati wa kupakia mtaala.");
      } finally {
        setIsLoadingOutlines(false);
      }
    };
    loadOutlines();
  }, [course.title, course.id, outlines]);

  // Download all lessons for complete offline cache
  const handleDownloadAll = async () => {
    if (!outlines) return;
    setIsRefreshing(true);
    let successCount = 0;
    try {
      for (let i = 0; i < outlines.length; i++) {
        const outline = outlines[i];
        const cacheKey = `lesson_${course.title}_${outline.title}`;
        const cached = await getLesson(cacheKey);
        if (!cached) {
          try {
            await new Promise<void>((resolve, reject) => {
              generateLessonContentStream(course.title, outline.title, () => {}, 3)
                .then(() => resolve())
                .catch((e) => reject(e));
            });
            successCount++;
          } catch (e) {
            console.warn(`Failed to download lesson ${outline.title}:`, e);
          }
        } else {
          successCount++;
        }
      }
      await checkCache();
      setNotification({
        message: `Upakuaji umekamilika! Masomo yote ${successCount}/${outlines.length} sasa yapo offline kwenye kifaa chako.`,
        type: 'success'
      });
    } catch {
      setNotification({ message: "Hitilafu fulani imetokea wakati wa kupakua masomo.", type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Delete all lessons cache
  const handleClearCache = async () => {
    if (!outlines) return;
    try {
      await clearCourseCache(course.title);
      await checkCache();
      setNotification({ message: "Kumbukumbu ya kozi hii (cache) imefutwa kikamilifu.", type: 'success' });
    } catch {
      setNotification({ message: "Imeshindwa kufuta cache.", type: 'error' });
    }
  };

  // Single lesson cache refresh
  const handleRefreshSingleLesson = async (index: number, lessonTitle: string) => {
    setRefreshingLessonIndex(index);
    try {
      await deleteLesson(`lesson_${course.title}_${lessonTitle}`);
      await new Promise<void>((resolve, reject) => {
        generateLessonContentStream(course.title, lessonTitle, () => {}, 1)
          .then(() => resolve())
          .catch((e) => reject(e));
      });
      await checkCache();
      setNotification({ message: `Somo la "${lessonTitle}" limesasishwa kikamilifu!`, type: 'success' });
    } catch {
      setNotification({ message: "Imeshindwa kusasisha somo hili.", type: 'error' });
    } finally {
      setRefreshingLessonIndex(null);
    }
  };

  // Mark lesson as complete
  const handleCompleteLesson = (index: number) => {
    const updated = [...completedLessons];
    updated[index] = true;
    setCompletedLessons(updated);
    localStorage.setItem(`progress_${course.id}`, JSON.stringify(updated));

    // If all lessons completed, trigger celebration!
    if (updated.every(v => v)) {
      setShowCertificate(true);
      triggerCelebration();
    } else {
      setNotification({ message: "Somo limekamilika kwa mafanikio! Endelea na somo linalofuata.", type: 'success' });
    }
  };

  // Theme support consistent with CourseDetail
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
      cardBg: 'bg-[#182232]',
      borderStyle: 'border-cyan-500/20',
      tabActive: 'bg-cyan-600 text-white border-cyan-400',
      tabInactive: 'bg-[#1b2536] text-gray-400 border-transparent hover:bg-cyan-900/20 hover:text-cyan-400',
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
      mutedText: 'text-amber-200/60',
      baseBg: 'bg-[#1a140f]',
      hoverBg: 'hover:bg-[#251d16]',
      cardBg: 'bg-[#211913]',
      borderStyle: 'border-amber-500/20',
      tabActive: 'bg-amber-600 text-white border-amber-400',
      tabInactive: 'bg-[#251d16] text-amber-200/60 border-transparent hover:bg-amber-900/20 hover:text-amber-300',
    },
    forest: {
      titleText: 'text-emerald-50',
      accentText: 'text-emerald-400',
      accentTextHover: 'hover:text-emerald-300',
      accentBorder: 'border-emerald-400',
      accentBorderHover: 'hover:border-emerald-400',
      accentBorderActive: 'border-emerald-600',
      accentButton: 'bg-emerald-600',
      accentButtonHover: 'hover:bg-emerald-500',
      mutedText: 'text-emerald-200/50',
      baseBg: 'bg-[#0a1410]',
      hoverBg: 'hover:bg-[#11221b]',
      cardBg: 'bg-[#0d1d16]',
      borderStyle: 'border-emerald-500/20',
      tabActive: 'bg-emerald-600 text-white border-emerald-400',
      tabInactive: 'bg-[#11221b] text-emerald-200/50 border-transparent hover:bg-emerald-950/40 hover:text-emerald-400',
    },
    slate: {
      titleText: 'text-zinc-50',
      accentText: 'text-blue-400',
      accentTextHover: 'hover:text-blue-300',
      accentBorder: 'border-blue-400',
      accentBorderHover: 'hover:border-blue-400',
      accentBorderActive: 'border-blue-600',
      accentButton: 'bg-blue-600',
      accentButtonHover: 'hover:bg-blue-500',
      mutedText: 'text-zinc-400',
      baseBg: 'bg-[#18181b]',
      hoverBg: 'hover:bg-[#27272a]',
      cardBg: 'bg-[#202023]',
      borderStyle: 'border-zinc-700/50',
      tabActive: 'bg-blue-600 text-white border-blue-400',
      tabInactive: 'bg-[#27272a] text-zinc-400 border-transparent hover:bg-blue-950/30 hover:text-blue-400',
    }
  };

  const style = themeConfig[theme as keyof typeof themeConfig] || themeConfig.slate;

  // --- TAB 2: KIWANDA CHA AI (AI App Studio Playground) ---
  const [appName, setAppName] = useState('');
  const [appCategory, setAppCategory] = useState('App ya Burudani na Video');
  const [apiKey, setApiKey] = useState('');
  const [contentLinks, setContentLinks] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [appTheme, setAppTheme] = useState('slate');

  // AI Assistant generating progress & output
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [generatedCode, setGeneratedCode] = useState(() => {
    return localStorage.getItem('api_economy_generated_code') || '';
  });
  const [aiResponseError, setAiResponseError] = useState<string | null>(null);

  // Live preview tab inside kiwanda: "code" vs "preview" vs "about"
  const [playgroundSubTab, setPlaygroundSubTab] = useState<'code' | 'preview' | 'guide'>('code');

  // Interactive AI Assistant refinement chat
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Generate App Code trigger
  const handleGenerateApp = async (promptExt?: string) => {
    if (!appName.trim()) {
      setAiResponseError("Tafadhali ingiza Jina la App!");
      return;
    }

    setIsGenerating(true);
    setAiResponseError(null);
    setCurrentStepIndex(0);
    setGeneratedCode('');
    setPlaygroundSubTab('code');

    const steps = [
      "AI inakagua malengo na aina ya app uliyochagua...",
      "Mshauri Mkuu anasanifu muonekano, rangi na bento-grid...",
      "Developer anaandaa Section IDs maalum kwa ajili ya App Creator 24...",
      "Kujenga msimbo wa HTML5, CSS na JavaScript ya kisasa...",
      "Kuhakiki utendaji offline (caching na kumbukumbu ya simu)...",
      "Kukamilisha na kutoa msimbo kamili tayari kwa kupaste!"
    ];
    setGenerationSteps(steps);

    // Step animation interval
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200);

    try {
      const response = await fetch('/api/gemini/generate-app-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName,
          category: appCategory,
          apiKey,
          contentLinks,
          logoUrl,
          aboutUs,
          theme: appTheme,
          promptExtension: promptExt
        })
      });

      if (!response.ok) {
        throw new Error("Imeshindwa kuzalisha msimbo wa app.");
      }

      const data = await response.json();
      if (data && data.code) {
        setGeneratedCode(data.code);
        localStorage.setItem('api_economy_generated_code', data.code);
        setPlaygroundSubTab('preview');
        triggerCelebration();
      } else {
        throw new Error("Msimbo uliorudishwa haukukamilika.");
      }
    } catch (err: any) {
      setAiResponseError(err.message || "Hitilafu fulani imetokea wakati wa kuunda app.");
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const handleRefineApp = async () => {
    if (!refinePrompt.trim()) return;
    setIsRefining(true);
    setAiResponseError(null);
    try {
      await handleGenerateApp(`Marekebisho ya mwanafunzi: ${refinePrompt}`);
      setRefinePrompt('');
    } catch (err: any) {
      setAiResponseError("Imeshindwa kufanya marekebisho. Jaribu tena.");
    } finally {
      setIsRefining(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setNotification({ message: "Code imenakiliwa! Sasa unaweza kuipaste App Creator 24.", type: 'success' });
  };

  return (
    <div className={`min-h-screen ${style.baseBg} p-4 pb-24 text-gray-100 transition-colors duration-300`}>
      {/* Header Consistent with App */}
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 text-sm font-semibold transition ${style.accentText} ${style.accentTextHover}`}
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Rudi kwenye Kozi</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-60">Kozi:</span>
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${style.accentBorder}`} style={{ color: style.accentText }}>
            {course.title}
          </span>
        </div>
      </div>

      {/* Main Title & Brand banner */}
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex justify-center items-center gap-3">
          <CodeBracketIcon className="w-10 h-10 text-blue-400" />
          <span className={style.titleText}>API Economy</span>
        </h1>
        <p className={`text-sm max-w-xl mx-auto ${style.mutedText}`}>
          Mtaala wa ujasiriamali wa juu na uundaji wa apps za simu bila kuandika kodi. Utawala wa API Keys, kukuza brand ya <b className="text-yellow-400">Geniuz College</b> Kibaha, na kujenga fursa za kipato.
        </p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="max-w-4xl mx-auto mb-4 animate-bounce">
          <div className={`p-4 rounded-xl flex items-center justify-between border ${notification.type === 'success' ? 'bg-green-950/70 border-green-500/50 text-green-200' : 'bg-red-950/70 border-red-500/50 text-red-200'}`}>
            <span className="text-sm font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-xs font-bold opacity-60 hover:opacity-100">Funga</button>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2 mb-6 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveMainTab('masomo')}
          className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition duration-200 ${activeMainTab === 'masomo' ? style.tabActive : style.tabInactive}`}
        >
          <span>📚</span>
          <span>Masomo ya Kozi (Curriculum)</span>
        </button>
        <button
          onClick={() => setActiveMainTab('kiwanda')}
          className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition duration-200 ${activeMainTab === 'kiwanda' ? style.tabActive : style.tabInactive}`}
        >
          <span>⚡</span>
          <span>Kiwanda cha AI (App Creator Studio)</span>
        </button>
      </div>

      {/* --- TAB 1: MASOMO VIEWER --- */}
      {activeMainTab === 'masomo' && (
        <div className="max-w-4xl mx-auto">
          {selectedLessonIndex === null ? (
            <div className="space-y-6">
              {/* Action buttons & Cache state info */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-black/40 border border-gray-800">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-xs font-medium opacity-80">
                    {isOnline ? "Upo Mtandaoni (Kupakia kote kupitia Gemini)" : "Upo Nje ya Mtandao (Njia thabiti ya Offline imeamilishwa)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadAll}
                    disabled={isRefreshing || !outlines}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:bg-blue-600/50 disabled:opacity-50`}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Pakua Masomo Yote</span>
                  </button>
                  <button
                    onClick={handleClearCache}
                    disabled={isRefreshing || !outlines}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/50 text-red-300 border border-red-500/30 hover:bg-red-950"
                  >
                    Futa Cache
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="p-4 rounded-xl bg-black/30 border border-gray-800/80">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">Maendeleo ya Kozi (Progress):</span>
                  <span className={`text-sm font-black ${style.accentText}`}>
                    {completedLessons.length > 0 
                      ? `${Math.round((completedLessons.filter(Boolean).length / completedLessons.length) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${completedLessons.length > 0 ? (completedLessons.filter(Boolean).length / completedLessons.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Certificate Alert */}
              {showCertificate && (
                <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-950/30 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <TrophyIcon className="w-10 h-10 text-yellow-400" />
                    <div>
                      <h4 className="font-bold text-yellow-200">Hongera Sana Mwanafunzi!</h4>
                      <p className="text-xs text-yellow-200/70">Umekamilisha masomo yote 12 ya API Economy na uundaji wa programu bila kuandika kodi.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => triggerCelebration()}
                    className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-bold text-xs hover:bg-yellow-500 shadow-md flex items-center gap-1.5"
                  >
                    <span>🎓 Onyesha Cheti Chako</span>
                  </button>
                </div>
              )}

              {/* Lesson outlines List */}
              {isLoadingOutlines ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <RefreshIcon className="w-10 h-10 animate-spin text-blue-500" />
                  <span className="text-sm opacity-60">Inapakia muundo na masomo ya kozi ya API Economy...</span>
                </div>
              ) : outlineError ? (
                <div className="p-8 text-center bg-red-950/20 border border-red-500/20 rounded-xl space-y-3">
                  <p className="text-sm text-red-300">{outlineError}</p>
                  <button 
                    onClick={() => { setOutlines(null); }}
                    className="px-4 py-2 bg-red-900 text-white rounded-lg text-xs font-bold"
                  >
                    Jaribu Kupakia Tena
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {outlines?.map((outline, idx) => {
                    const isCompleted = completedLessons[idx];
                    const isFirstLesson = idx === 0;
                    const isPrevCompleted = idx > 0 && completedLessons[idx - 1];
                    const isUnlocked = isFirstLesson || isPrevCompleted || isCompleted;
                    const isCached = cachedLessons.has(outline.title);
                    const readingTime = readingTimes[outline.title] || 15;

                    return (
                      <div 
                        key={idx}
                        className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${isUnlocked ? 'bg-black/30 border-gray-800' : 'bg-black/10 border-gray-900 opacity-60'}`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold font-mono opacity-40">SOMO {idx + 1}</span>
                            <div className="flex items-center gap-1.5">
                              {isCompleted ? (
                                <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                                  <CheckCircleIcon className="w-4 h-4" />
                                  <span>Imesomwa</span>
                                </span>
                              ) : isUnlocked ? (
                                <span className="text-blue-400 text-xs font-bold flex items-center gap-1">
                                  <PlayCircleIcon className="w-4 h-4 animate-pulse" />
                                  <span>Inasubiri</span>
                                </span>
                              ) : (
                                <span className="text-gray-500 text-xs font-bold flex items-center gap-1">
                                  <LockClosedIcon className="w-3.5 h-3.5" />
                                  <span>Imefungwa</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="font-bold text-base text-gray-100 mb-1 leading-snug">{outline.title}</h3>
                          <p className="text-xs opacity-70 mb-4 leading-relaxed line-clamp-2">{outline.description}</p>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-800/50 mt-auto">
                          <span className="text-[10px] opacity-50 flex items-center gap-1 font-mono">
                            <ClockIcon className="w-3 h-3" />
                            <span>Muda: dkk {readingTime}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isCached && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRefreshSingleLesson(idx, outline.title);
                                }}
                                disabled={refreshingLessonIndex !== null}
                                className="p-1 rounded bg-gray-800/80 text-gray-400 hover:text-white"
                                title="Sasisha cache ya somo hili"
                              >
                                <RefreshIcon className={`w-3.5 h-3.5 ${refreshingLessonIndex === idx ? 'animate-spin' : ''}`} />
                              </button>
                            )}
                            <button
                              disabled={!isUnlocked}
                              onClick={() => setSelectedLessonIndex(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${isUnlocked ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                            >
                              <span>Soma Sasa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Lesson detail view
            <div className="space-y-4">
              <button 
                onClick={() => setSelectedLessonIndex(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Rudi Kwenye Orodha ya Masomo</span>
              </button>

              {outlines && (
                <LessonContent 
                  courseTitle={course.title}
                  lessonTitle={outlines[selectedLessonIndex].title}
                  onBack={() => {
                    handleCompleteLesson(selectedLessonIndex);
                    setSelectedLessonIndex(null);
                  }}
                  onCancel={() => setSelectedLessonIndex(null)}
                  lessonNumber={selectedLessonIndex + 1}
                  manualLoad={true}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: KIWANDA CHA AI APP --- */}
      {activeMainTab === 'kiwanda' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form parameters section (Left 5 columns on desktop) */}
          <div className="md:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-black/30 border border-gray-800 space-y-3 shadow-xl">
              <h2 className="font-extrabold text-base text-gray-200 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-blue-400" />
                <span>Sanidi App Yako</span>
              </h2>
              <p className="text-xs opacity-60">
                Jaza fomu hii kwa upendo kisha uwaombe AI wetu mbobezi wa Giniaz College asanifu na kuandika msimbo (code) kamili kwa ajili yako.
              </p>

              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase opacity-80 text-gray-300">Jina la Programu (App Name) *</label>
                  <input 
                    type="text" 
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="K.m. App ya Video za DJ Mark"
                    className="w-full bg-[#18181b] border border-gray-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase opacity-80 text-gray-300">Makundi (Category)</label>
                  <select 
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value)}
                    className="w-full bg-[#18181b] border border-gray-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="App ya Burudani na Video">App ya Burudani na Video</option>
                    <option value="App ya Redio na Music Streaming">App ya Redio na Music Streaming</option>
                    <option value="App ya Habari na Makala">App ya Habari na Makala</option>
                    <option value="App ya Kilimo na Mazao">App ya Kilimo na Mazao</option>
                    <option value="App ya Elimu na Shule">App ya Elimu na Shule</option>
                    <option value="App ya Huduma na Biashara">App ya Huduma na Biashara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase opacity-80 text-gray-300">Google API Key (Kama unayo)</label>
                  <input 
                    type="text" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AI_zaSyD6..."
                    className="w-full bg-[#18181b] border border-gray-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] opacity-50 block mt-1">Google Maps SDK key, Vision, au YouTube API key kwa ajili ya data.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase opacity-80 text-gray-300">Viungo vya Maudhui (Links / Streaming URLs)</label>
                  <textarea 
                    value={contentLinks}
                    onChange={(e) => setContentLinks(e.target.value)}
                    placeholder="K.m. link ya video ya DJ Mark (mp4), RSS feed ya habari, au Redio stream"
                    rows={2}
                    className="w-full bg-[#18181b] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase opacity-80 text-gray-300">Kiungo cha Nembo ya App (Logo URL)</label>
                  <input 
                    type="text" 
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#18181b] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase opacity-80 text-gray-300">Kuhusu Sisi (About description)</label>
                  <textarea 
                    value={aboutUs}
                    onChange={(e) => setAboutUs(e.target.value)}
                    placeholder="Maelezo mafupi kuhusu madhumuni ya app hii..."
                    rows={2}
                    className="w-full bg-[#18181b] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase opacity-80 text-gray-300">Theme ya Programu</label>
                  <div className="grid grid-cols-5 gap-1">
                    {['slate', 'cyber', 'sunrise', 'forest', 'light'].map((thm) => (
                      <button
                        key={thm}
                        type="button"
                        onClick={() => setAppTheme(thm)}
                        className={`text-[10px] font-bold py-1.5 rounded uppercase border transition ${appTheme === thm ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#18181b] border-gray-800 text-gray-400'}`}
                      >
                        {thm}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateApp()}
                  disabled={isGenerating || !appName.trim()}
                  className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition duration-200 shadow-lg ${appName.trim() ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                  <SparklesIcon className="w-5 h-5 animate-pulse" />
                  <span>{isGenerating ? "AI Inaandaa App..." : "Omba Code ya App"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Output preview & interactive simulator (Right 7 columns on desktop) */}
          <div className="md:col-span-7 space-y-4">
            {isGenerating ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-gray-800 min-h-[400px] flex flex-col justify-center items-center text-center space-y-6 shadow-xl">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xl">⚡</span>
                </div>
                <div className="space-y-2 max-w-sm">
                  <h4 className="font-extrabold text-lg text-gray-100">AI Inasanifu & Inaandaa Programu Yako</h4>
                  <p className="text-xs opacity-60">Sisi tukiwa kama mlezi na mshauri wako, tunapanga misingi imara nchini Tanzania.</p>
                </div>
                
                {/* Steps animation list */}
                <div className="w-full max-w-sm space-y-2 pt-2">
                  {generationSteps.map((stp, idx) => (
                    <div 
                      key={idx} 
                      className={`text-xs p-2 rounded-lg flex items-center gap-2.5 transition-all duration-300 ${idx === currentStepIndex ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30' : idx < currentStepIndex ? 'text-green-400 opacity-60' : 'text-gray-600'}`}
                    >
                      <span>{idx < currentStepIndex ? '✓' : idx === currentStepIndex ? '●' : '○'}</span>
                      <span className="font-medium text-left">{stp}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : generatedCode ? (
              <div className="space-y-4">
                {/* Result Control tabs */}
                <div className="p-1 rounded-xl bg-[#18181b] border border-gray-800 grid grid-cols-3 gap-1 shadow-lg">
                  <button
                    onClick={() => setPlaygroundSubTab('code')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${playgroundSubTab === 'code' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Msimbo (Source Code)
                  </button>
                  <button
                    onClick={() => setPlaygroundSubTab('preview')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${playgroundSubTab === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Simu ya Kijaribio (Live Preview)
                  </button>
                  <button
                    onClick={() => setPlaygroundSubTab('guide')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${playgroundSubTab === 'guide' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Mwongozo wa App Creator 24
                  </button>
                </div>

                {/* Sub Tab: Code */}
                {playgroundSubTab === 'code' && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-200">Kodi Kamili ya Programu</h3>
                        <span className="text-[10px] opacity-60">Faili moja (Single-Page App) tayari kwa kupaste.</span>
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                      >
                        <CopyIcon className="w-3.5 h-3.5" />
                        <span>Nakili (Copy Code)</span>
                      </button>
                    </div>

                    <textarea
                      readOnly
                      value={generatedCode}
                      className="w-full h-80 bg-black/60 font-mono text-[11px] p-3 rounded-xl border border-gray-800 text-green-400 focus:outline-none"
                    />

                    {/* Section IDs card helper */}
                    <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-1 text-xs">
                      <span className="font-bold text-blue-300">📌 Section IDs za App Creator 24 kulingana na Kadi zako:</span>
                      <p className="opacity-80">Msimbo huu una tabo na kadi zinazowakilisha templates. Ukibonyeza kadi ya video au sauti, inafunguka ndani kwa kasi isiyo na mipaka.</p>
                    </div>
                  </div>
                )}

                {/* Sub Tab: Live Preview */}
                {playgroundSubTab === 'preview' && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-gray-800 space-y-3 shadow-xl flex flex-col items-center">
                    <div className="w-full flex justify-between items-center pb-2 border-b border-gray-800">
                      <h3 className="font-extrabold text-sm text-gray-200">Muonekano Kwenye Simu (Emulator)</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/20 font-bold uppercase animate-pulse">Inafanya kazi vizuri</span>
                    </div>

                    {/* Interactive Mobile iframe simulator */}
                    <div className="w-[320px] h-[520px] rounded-[40px] border-[12px] border-gray-800 shadow-2xl overflow-hidden bg-white relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                      
                      {/* Iframe displaying the generated code */}
                      <iframe
                        srcDoc={generatedCode}
                        className="w-full h-full border-none z-10"
                        title="App Emulator Live Preview"
                      />
                    </div>
                    <span className="text-[10px] opacity-50 block mt-2">Mwanafunzi anaweza kujaribu kubofya kadi na tabo ili kuona jinsi inavyofanya kazi!</span>
                  </div>
                )}

                {/* Sub Tab: Guide */}
                {playgroundSubTab === 'guide' && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-gray-800 space-y-3 shadow-xl leading-relaxed text-sm">
                    <h3 className="font-extrabold text-base text-yellow-400 border-b border-gray-800 pb-2">💡 Hatua za Kuingiza Kwenye App Creator 24</h3>
                    <div className="space-y-3 text-xs opacity-90">
                      <p>
                        <b>Hatua ya 1:</b> Bonyeza kitufe cha <b>Msimbo (Source Code)</b> hapo juu, kisha ubofye <b>Nakili (Copy Code)</b> ili kuhifadhi code yote kwenye kifaa chako.
                      </p>
                      <p>
                        <b>Hatua ya 2:</b> Ingia kwenye akaunti yako ya <b>App Creator 24</b> na ufungue mradi wako wa sasa au uunde mradi mpya.
                      </p>
                      <p>
                        <b>Hatua ya 3:</b> Nenda kwenye orodha ya upande wa kushoto na ubofye <b>Sections</b>, kisha ubofye <b>Create Section</b>.
                      </p>
                      <p>
                        <b>Hatua ya 4:</b> Chagua aina ya section inayoitwa <b>Web / HTML</b>, kisha chagua chaguo la pili: <b>Enter HTML code</b>.
                      </p>
                      <p>
                        <b>Hatua ya 5:</b> Bandika (paste) code uliyonakili kutoka hapa. Weka kichwa cha habari (Title) kisha ubofye <b>Save</b>.
                      </p>
                      <p>
                        <b>Hatua ya 6:</b> Nenda kwenye upande wa <b>Download App</b> kwenye App Creator 24, pakua APK yako na uisakinishe kwenye simu yako! Unaweza kuanza kutengeneza utajiri na kukuza sifa za chuo chetu.
                      </p>
                    </div>
                  </div>
                )}

                {/* Interactive AI Refine Input */}
                <div className="p-4 rounded-xl bg-black/30 border border-gray-800 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧙‍♂️</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-blue-400 uppercase">Mshauri na Mboreshaji wa AI</h4>
                      <p className="text-[10px] opacity-60">Je, unataka kuboresha muundo, kuongeza kadi, au kubadili rangi? Muombe mzee wa hekima kwa lugha ya Kiswahili.</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refinePrompt}
                      onChange={(e) => setRefinePrompt(e.target.value)}
                      placeholder="Mzee wa hekima, naomba uongeze rangi ya Sunrise kwenye msimbo..."
                      disabled={isRefining}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRefineApp();
                      }}
                      className="flex-1 bg-[#18181b] border border-gray-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleRefineApp}
                      disabled={isRefining || !refinePrompt.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      {isRefining ? "Inaboresha..." : "Boresha"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-black/20 border border-dashed border-gray-800 min-h-[400px] flex flex-col justify-center items-center text-center space-y-3 shadow-xl">
                <span className="text-5xl">📱</span>
                <h4 className="font-bold text-gray-400">Inasubiri Maelekezo Yako</h4>
                <p className="text-xs opacity-60 max-w-xs">
                  Jaza maelezo ya app yako upande wa kushoto kisha ubofye <b>Omba Code ya App</b> ili kuanza uundaji wa msimbo offline/online thabiti.
                </p>
              </div>
            )}

            {aiResponseError && (
              <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-200 rounded-xl text-xs font-medium">
                ⚠️ Hitilafu: {aiResponseError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiEconomy;
