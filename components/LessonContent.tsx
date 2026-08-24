
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateLessonContentStream } from '../services/geminiService';
import { getLesson, deleteLesson, saveLesson } from '../services/storageService';
import { ArrowLeftIcon, ClockIcon, LightBulbIcon, CheckCircleIcon, SparklesIcon, DownloadIcon } from './icons';
import { useTheme } from '../ThemeContext';
import { getStudyNotes, cleanLessonTitle, cleanExtraneousLessonContent } from '../utils/studyNotesHelper';

function sanitizeClientText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/[#*_~`]/g, '')
    .replace(/\(\s*n\s*\/\s*n\s*\)/gi, '')
    .replace(/\[\s*n\s*\/\s*n\s*\]/gi, '')
    .replace(/\(\s*\\n\\n\s*\)/gi, '')
    .replace(/\\n\\n/g, '\n\n')
    .trim();
}

function formatIntoEightLinesClient(text: string): string {
  const cleaned = sanitizeClientText(text);
  const normalized = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawBlocks = normalized.split(/\n\s*\n/);
  const result: string[] = [];

  // Helper to split text into distinct single-idea sentences safely without breaking common abbreviations
  const splitIntoSentences = (content: string): string[] => {
    const protectedContent = content
      .replace(/n\.k\./gi, '__NK__')
      .replace(/k\.m\./gi, '__KM__')
      .replace(/k\.v\./gi, '__KV__')
      .replace(/t\.z\./gi, '__TZ__')
      .replace(/Na\./g, '__NA__')
      .replace(/Dr\./g, '__DR__')
      .replace(/Prof\./g, '__PROF__');

    const rawSentences = protectedContent.split(/(?<=[.!?])\s+/).filter(Boolean);

    return rawSentences.map(s => 
      s.replace(/__NK__/g, 'n.k.')
       .replace(/__KM__/g, 'k.m.')
       .replace(/__KV__/g, 'k.v.')
       .replace(/__TZ__/g, 'T.Z.')
       .replace(/__NA__/g, 'Na.')
       .replace(/__DR__/g, 'Dr.')
       .replace(/__PROF__/g, 'Prof.')
       .trim()
    ).filter(Boolean);
  };

  for (const block of rawBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    // Check if the whole block is a heading
    const isHeading = 
      /^(sehemu\s+ya\s+\d+|sehemu\s+ya\s+[a-z]+|hitimisho|utangulizi|kazi\s+ya\s+nyumbani|tathmini|tafakari|swali|chemsha\s+bongo|ujasiriamali|mjasiriamali|majumuisho|mzee\s+wa\s+hekima|sehemu\s+ya\s+ziada)/i.test(trimmedBlock) ||
      (trimmedBlock.length < 120 && trimmedBlock.endsWith(':') && !trimmedBlock.includes('\n'));

    if (isHeading) {
      result.push(trimmedBlock);
      continue;
    }

    // Split lines inside the block if any
    const lines = trimmedBlock.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const isLineHeading = 
        /^(sehemu\s+ya\s+\d+|sehemu\s+ya\s+[a-z]+|hitimisho|utangulizi|kazi\s+ya\s+nyumbani|tathmini|tafakari|swali|chemsha\s+bongo|ujasiriamali|mjasiriamali|majumuisho|mzee\s+wa\s+hekima|sehemu\s+ya\s+ziada)/i.test(line) ||
        (line.length < 120 && line.endsWith(':') && !line.includes('\n'));

      if (isLineHeading) {
        result.push(line);
      } else {
        // Kata katika vipande vidogo vidogo vya wazo moja (sentensi 1 hadi 2 tu kwa kila kipande)
        const sentences = splitIntoSentences(line);
        if (sentences.length <= 1) {
          if (line.trim()) result.push(line.trim());
        } else {
          for (let i = 0; i < sentences.length; i += 2) {
            const chunk = sentences.slice(i, i + 2).join(' ');
            if (chunk.trim()) result.push(chunk.trim());
          }
        }
      }
    }
  }

  return result.join("\n\n");
}

interface LessonContentProps {
  courseTitle: string;
  lessonTitle: string;
  onBack: () => void;
  onCancel?: () => void;
  lessonNumber: number;
  manualLoad?: boolean;
}

const LessonContent: React.FC<LessonContentProps> = ({ courseTitle, lessonTitle, onBack, onCancel, lessonNumber, manualLoad = false }) => {
  const { theme } = useTheme();
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshingLesson, setIsRefreshingLesson] = useState(false);
  
  const [isPrecheckingCache, setIsPrecheckingCache] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [hasInitiatedLoad, setHasInitiatedLoad] = useState(false);
  
  const studyNotes = useMemo(() => {
    if (!content) return null;
    return getStudyNotes(courseTitle, lessonTitle, content);
  }, [courseTitle, lessonTitle, content]);

  const contentEndRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);

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

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          console.info('Wake Lock permission denied or not allowed: ', err.message);
        } else {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, []);

  const themeConfig = {
    cyber: {
      bg: 'bg-[#070a10]', border: 'border-cyan-950', prose: 'text-gray-100 font-sans',
      accentText: 'text-cyan-400',
      accentTextHover: 'hover:text-cyan-300',
      accentButton: 'bg-cyan-600',
      accentButtonHover: 'hover:bg-cyan-500',
    },
    sunrise: {
      bg: 'bg-[#120a05]', border: 'border-amber-950', prose: 'text-amber-50 font-sans',
      accentText: 'text-amber-300',
      accentTextHover: 'hover:text-amber-200',
      accentButton: 'bg-amber-600',
      accentButtonHover: 'hover:bg-amber-500',
    },
    forest: {
      bg: 'bg-[#040e08]', border: 'border-emerald-950', prose: 'text-emerald-50 font-sans',
      accentText: 'text-emerald-400',
      accentTextHover: 'hover:text-emerald-300',
      accentButton: 'bg-emerald-600',
      accentButtonHover: 'hover:bg-emerald-500',
    },
    light: {
      bg: 'bg-white', border: 'border-amber-100', prose: 'text-gray-800 font-sans',
      accentText: 'text-amber-600',
      accentTextHover: 'hover:text-amber-500',
      accentButton: 'bg-amber-600',
      accentButtonHover: 'hover:bg-amber-500',
    },
    classic: {
      bg: 'bg-white', border: 'border-slate-200', prose: 'text-slate-800 font-sans',
      accentText: 'text-blue-600',
      accentTextHover: 'hover:text-blue-500',
      accentButton: 'bg-blue-600',
      accentButtonHover: 'hover:bg-blue-500',
    },
    sunny: {
      bg: 'bg-yellow-50/20', border: 'border-yellow-100', prose: 'text-yellow-950 font-sans',
      accentText: 'text-yellow-600',
      accentTextHover: 'hover:text-yellow-500',
      accentButton: 'bg-yellow-600',
      accentButtonHover: 'hover:bg-yellow-500',
    }
  };
  const currentTheme = themeConfig[theme];
  const badgeColors = {
    cyber: { bg: 'bg-cyan-950/80 border border-cyan-800/30', text: 'text-cyan-400', cardBg: 'bg-cyan-950/10 hover:bg-cyan-950/20' },
    sunrise: { bg: 'bg-amber-950/80 border border-amber-800/30', text: 'text-amber-300', cardBg: 'bg-amber-950/10 hover:bg-amber-950/20' },
    forest: { bg: 'bg-emerald-950/80 border border-emerald-800/30', text: 'text-emerald-400', cardBg: 'bg-emerald-950/10 hover:bg-emerald-950/20' },
    light: { bg: 'bg-amber-100 border border-amber-200', text: 'text-amber-800', cardBg: 'bg-amber-50 hover:bg-amber-100/50' },
    classic: { bg: 'bg-blue-50 border border-blue-100', text: 'text-blue-600', cardBg: 'bg-slate-50 hover:bg-slate-100/50' },
    sunny: { bg: 'bg-yellow-100 border border-yellow-200', text: 'text-yellow-800', cardBg: 'bg-yellow-50 hover:bg-yellow-100/30' }
  }[theme] || { bg: 'bg-gray-800 border border-gray-700', text: 'text-gray-300', cardBg: 'bg-gray-800/20 hover:bg-gray-800/30' };

  // Pre-check if lesson is cached on mount or load
  useEffect(() => {
    let isMounted = true;
    const checkLessonCache = async () => {
      setIsPrecheckingCache(true);
      setHasInitiatedLoad(false);
      setIsCached(false);
      setContent("");
      setError(null);
      try {
        const cached = await getLesson(`lesson_${courseTitle}_${lessonTitle}`);
        if (isMounted) {
          if (cached && cached.content) {
            const cleanedContent = cleanExtraneousLessonContent(cached.content);
            if (cleanedContent !== cached.content) {
              await saveLesson(`lesson_${courseTitle}_${lessonTitle}`, cleanedContent);
              setContent(cleanedContent);
            } else {
              setContent(cached.content);
            }
            setIsCached(true);
            setIsStreaming(false);
          } else {
            setIsCached(false);
            if (!manualLoad) {
              setHasInitiatedLoad(true);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsCached(false);
          if (!manualLoad) {
            setHasInitiatedLoad(true);
          }
        }
      } finally {
        if (isMounted) {
          setIsPrecheckingCache(false);
        }
      }
    };
    checkLessonCache();
    return () => { isMounted = false; };
  }, [courseTitle, lessonTitle, manualLoad, retryCount]);

  // Actual streaming content downloader
  useEffect(() => {
    if (!hasInitiatedLoad) return;
    
    let isMounted = true;
    const runStream = async () => {
      setIsStreaming(true);
      setError(null);
      try {
        await generateLessonContentStream(courseTitle, lessonTitle, (chunk) => {
          if (isMounted) setContent(chunk);
        });
        if (isMounted) {
          setIsStreaming(false);
          setIsCached(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Imeshindwa kupakia somo.');
          setIsStreaming(false);
        }
      }
    };
    runStream();
    return () => { isMounted = false; };
  }, [courseTitle, lessonTitle, hasInitiatedLoad, retryCount]);

  useEffect(() => {
    if (isStreaming && content) {
      const threshold = 150;
      const position = window.innerHeight + window.scrollY;
      const height = document.documentElement.scrollHeight;
      
      if (height - position < threshold) {
        contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [content, isStreaming]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isStreaming && content) {
        localStorage.setItem(`scroll_${courseTitle}_${lessonTitle}`, window.scrollY.toString());
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isStreaming, content, courseTitle, lessonTitle]);

  useEffect(() => {
    if (!isStreaming && content) {
      const savedScrollY = localStorage.getItem(`scroll_${courseTitle}_${lessonTitle}`);
      if (savedScrollY) {
        const timer = setTimeout(() => {
          window.scrollTo({
            top: parseFloat(savedScrollY),
            behavior: 'instant' as any
          });
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [isStreaming, content, courseTitle, lessonTitle]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  const handleRefreshLesson = async () => {
    if (window.confirm("Je, una uhakika unataka kupakua somo hili upya kutoka mwanzo? Maudhui ya sasa yatafutwa na kupakiwa upya.")) {
      setIsRefreshingLesson(true);
      setIsStreaming(true);
      setContent('');
      setError(null);
      try {
        await deleteLesson(`lesson_${courseTitle}_${lessonTitle}`);
        setRetryCount(prev => prev + 1);
      } catch (err: any) {
        setError(err.message || 'Imeshindwa kufuta cache ya somo hili.');
        setIsStreaming(false);
      } finally {
        setIsRefreshingLesson(false);
      }
    }
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }, [content]);

  if (isPrecheckingCache) {
    return (
      <div className={`w-full max-w-full overflow-hidden ${currentTheme.bg} text-left py-12 px-4 sm:px-8 md:px-10 rounded-xl border ${currentTheme.border} shadow-sm flex flex-col items-center justify-center space-y-4`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${currentTheme.accentText}`}></div>
        <p className={`text-sm opacity-60 ${currentTheme.accentText}`}>Inahakiki kumbukumbu ya somo...</p>
      </div>
    );
  }

  if (manualLoad && !isCached && !hasInitiatedLoad) {
    return (
      <div className={`w-full max-w-full overflow-hidden ${currentTheme.bg} text-left py-12 px-4 sm:px-8 md:px-10 rounded-xl border ${currentTheme.border} shadow-sm space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-dashed border-gray-700/20 pb-4">
          <button 
            onClick={onCancel || onBack} 
            className="flex items-center px-3.5 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 text-gray-400 hover:text-gray-300 transition-all text-xs sm:text-sm font-medium"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Rudi Kwenye Masomo
          </button>
          <span className="text-xs text-gray-500 font-mono opacity-70">
            Somo #{lessonNumber}
          </span>
        </div>

        <div className="text-center py-12 max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/30 text-3xl animate-bounce">
            📥
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-100">Somo {lessonNumber}: {cleanLessonTitle(lessonTitle)}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Mpendwa mwanafunzi wa <b>Geniuz College</b>, somo hili linahitaji kupakiwa manually ili uweze kulisoma na kulihifadhi kwenye kifaa chako kwa matumizi ya baadae (hata ukiwa offline).
            </p>
          </div>

          <button
            onClick={() => setHasInitiatedLoad(true)}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-center gap-2.5 transition duration-200 shadow-lg border border-blue-400/20"
          >
            <DownloadIcon className="w-5 h-5" />
            <span>Pakia Somo Hili Manually</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-full overflow-hidden ${currentTheme.bg} text-left py-6 px-4 sm:px-8 md:px-10 rounded-xl border ${currentTheme.border} shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border-b border-dashed border-gray-700/20 pb-4">
          <div className="flex flex-wrap gap-2.5">
            <button 
                onClick={onCancel || onBack} 
                className="flex items-center px-3.5 py-2 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 text-gray-400 hover:text-gray-300 transition-all text-xs sm:text-sm font-medium"
                title="Rudi kwenye mtaala bila kuweka alama ya kukamilisha"
            >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Toka (Hifadhi Maendeleo)
            </button>
            <button 
                onClick={onBack} 
                className={`flex items-center px-4 py-2 rounded-lg ${currentTheme.accentButton} hover:${currentTheme.accentButtonHover} text-white transition-all text-xs sm:text-sm font-bold shadow-sm`}
                title="Weka alama kuwa somo limekamilika na rudi"
            >
                ✓ Kamilisha Somo & Rudi
            </button>
          </div>
          {studyNotes && (
            <span className="text-xs text-gray-500 font-mono self-end sm:self-auto opacity-70">
              Somo #{lessonNumber}
            </span>
          )}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 break-words">
          <span className="max-w-full">Somo {lessonNumber}: {cleanLessonTitle(lessonTitle)}</span>
          {!isOnline && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded animate-pulse self-start sm:self-auto">
              Haupo Mtandaoni
            </span>
          )}
        </h3>
        {(() => {
          const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
          const readingTime = Math.max(1, Math.ceil(wordCount / 200));
          const infoTextClass = {
            cyber: 'text-gray-400',
            sunrise: 'text-amber-200/70',
            forest: 'text-green-200/70',
            light: 'text-amber-900/60',
            classic: 'text-slate-500',
            sunny: 'text-amber-900/60',
          }[theme] || 'text-gray-400';

          return content ? (
            <div className={`flex items-center space-x-4 mb-5 text-xs sm:text-sm border-b border-dashed ${theme === 'light' ? 'border-amber-100' : 'border-gray-700/50'} pb-3`}>
              <div className={`flex items-center space-x-1.5 ${currentTheme.accentText}`}>
                <ClockIcon className="h-4 w-4" />
                <span className="font-semibold">Muda wa kusoma: ~{readingTime} dk</span>
              </div>
              <span className={`${infoTextClass}`}>•</span>
              <div className={`${infoTextClass} flex items-center space-x-1.5`}>
                <span>📝</span>
                <span>{wordCount} maneno</span>
              </div>
            </div>
          ) : null;
        })()}



        <div className={`prose ${theme === 'light' ? 'prose-slate' : 'prose-invert'} max-w-none ${currentTheme.prose} font-normal text-base sm:text-lg leading-relaxed tracking-normal min-h-[200px] break-words overflow-hidden w-full`}>
            {isStreaming && !content ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${currentTheme.accentText}`}></div>
                    <p className={`text-lg font-medium ${currentTheme.accentText}`}>Inapakua somo, tafadhali subiri...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                    <p className="text-red-400">{error}</p>
                    <button 
                      onClick={handleRetry}
                      className={`px-4 py-2 ${currentTheme.accentButton} text-white rounded-lg`}
                    >
                      Jaribu Tena
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {(() => {
                      const formattedContent = formatIntoEightLinesClient(content.replace(/\\n/g, '\n'));
                      return formattedContent.split(/\n\s*\n/).map((para, index, arr) => {
                        const trimmed = para.trim();
                        if (!trimmed) return null;
                        const isLast = index === arr.length - 1;

                        const sanitizedPara = sanitizeClientText(trimmed);
                        if (!sanitizedPara) return null;

                        // Check if paragraph is a heading
                        const isHeading = 
                            /^(sehemu\s+ya\s+(\d+|kwanza|pili|tatu|nne|tano|sita|saba|nane|tisa|kumi)|utangulizi\s+wa\s+somo|shurti\s+kuu)/i.test(sanitizedPara) ||
                            (sanitizedPara.length < 120 && sanitizedPara.endsWith(':') && !sanitizedPara.includes('\n'));

                        if (isHeading) {
                            const cleanHeading = sanitizedPara.replace(/^#+\s*/, '');
                            return (
                                <h3 
                                    key={index} 
                                    className={`text-xl sm:text-2xl font-extrabold tracking-tight ${index > 0 ? 'pt-6' : 'pt-2'} pb-2`}
                                >
                                    {cleanHeading}
                                </h3>
                            );
                        }

                        // Split paragraph to detect and bold the welcome/intro sentence
                        const welcomeRegex = /((?:Karibu\s+(?:sana\s+)?(?:katika\s+)?(?:Gen[iu]+z|Giniaz)\s+College[^.!?]*[.!?]))/i;
                        const parts = sanitizedPara.split(welcomeRegex);

                        return (
                            <p 
                                key={index} 
                                className="text-base sm:text-lg leading-relaxed text-left whitespace-pre-wrap font-normal p-2 rounded transition-all duration-300"
                            >
                                {parts.map((part, i) => {
                                    const lower = part.toLowerCase();
                                    const isWelcomePart = lower.includes("karibu") && 
                                                          (lower.includes("geniuz") || lower.includes("giniaz") || lower.includes("college"));
                                    if (isWelcomePart) {
                                        return (
                                            <strong key={i} className="font-extrabold">
                                                {part}
                                            </strong>
                                        );
                                    }
                                    return part;
                                })}
                                {isStreaming && isLast && (
                                    <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse ml-1 align-middle"></span>
                                )}
                            </p>
                        );
                      });
                    })()}
                </div>
            )}



            <div ref={contentEndRef} />
        </div>
        {!isStreaming && content && !error && (
          <div className="mt-8 border-t border-dashed border-gray-700/50 pt-6 space-y-6">
              {/* Main Bottom Complete/Save Action Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                      onClick={onBack} 
                      className="flex-1 flex items-center justify-center px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-all text-sm sm:text-base font-bold shadow-md"
                  >
                      ✓ Umemaliza Kusoma? Kamilisha Somo & Hifadhi
                  </button>
                  <button 
                      onClick={onCancel || onBack} 
                      className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3.5 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 text-gray-400 hover:text-gray-300 transition-all text-sm font-medium"
                  >
                      Hifadhi Maendeleo & Toka
                  </button>
              </div>

              {/* Auxiliary utilities row */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                  <button
                      onClick={handleCopy}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 text-sm bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-all duration-300 relative"
                      title="Nakili Somo"
                  >
                      <span className="mr-1.5">{copiedToast ? "✓" : "📋"}</span>
                      {copiedToast ? "Copied! ✓" : "Nakili Somo"}
                  </button>
                  <button
                      onClick={handleRefreshLesson}
                      disabled={isRefreshingLesson}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 text-sm bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300"
                      title="Pakua Somo Upya"
                  >
                      <span className={`mr-1.5 ${isRefreshingLesson ? 'animate-spin inline-block' : ''}`}>🔄</span>
                      {isRefreshingLesson ? "Upya..." : "Refresh"}
                  </button>
                  {copiedToast && (
                    <div className="w-full text-emerald-400 font-medium text-xs mt-1 animate-fade-in text-center sm:text-left">
                      ✓ Somo limekopiliwa kikamilifu kwenye clipboard.
                    </div>
                  )}
              </div>
          </div>
        )}
    </div>
  );
};

export default LessonContent;
