import { useEffect, useRef, useState } from 'react';
import { COURSES } from '../constants';
import { generateCourseOutline, generateLessonContentStream } from '../services/geminiService';
import { getLesson } from '../services/storageService';

const GlobalPreloader = () => {
  const isPreloading = useRef(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (isPreloading.current) return;
    isPreloading.current = true;
    
    const preloadAll = async () => {
      setStatus("Inaanza kupakua masomo...");
      for (let i = 0; i < COURSES.length; i++) {
        const course = COURSES[i];
        try {
          setStatus(`Inapakua: ${course.title} (${i + 1}/${COURSES.length})`);
          const cacheKey = `outline_${course.title}`;
          const cachedOutline = await getLesson(cacheKey);
          
          let outline;
          if (cachedOutline) {
            outline = JSON.parse(cachedOutline.content);
            if (outline.length < 12) {
              console.log(`Cache faulty for ${course.title} (only ${outline.length} lessons), forcing regen`);
              outline = await generateCourseOutline(course.title);
            }
          } else {
            outline = await generateCourseOutline(course.title);
            if (outline.length < 12) {
                console.log(`Regen for ${course.title} failed to produce 12 lessons, retrying once`);
                outline = await generateCourseOutline(course.title);
            }
          }

          for (let j = 0; j < outline.length; j++) {
            const lesson = outline[j];
            const lessonCacheKey = `lesson_${course.title}_${lesson.title}`;
            
            let attempts = 0;
            let success = false;
            while (attempts < 3 && !success) {
              const cachedLesson = await getLesson(lessonCacheKey);
              if (cachedLesson) {
                success = true;
                break;
              }
              
              try {
                setStatus(`Inapakua (${attempts + 1}/3): ${course.title} - ${lesson.title} (${j + 1}/${outline.length})`);
                await generateLessonContentStream(course.title, lesson.title, () => {});
                
                // Verify it was actually saved
                const newlyCached = await getLesson(lessonCacheKey);
                if (newlyCached) {
                  success = true;
                  await new Promise(resolve => setTimeout(resolve, 2000)); // Throttling
                } else {
                  throw new Error("Lesson content not found in cache after generation");
                }
              } catch (error) {
                attempts++;
                console.error(`Attempt ${attempts} failed for ${lesson.title}:`, error);
                await new Promise(resolve => setTimeout(resolve, 5000 * attempts)); // Backoff
              }
            }
            if (!success) {
              console.error(`Failed to preload lesson ${lesson.title} in ${course.title} after 3 attempts.`);
            }
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Failed to preload course ${course.title}:`, error);
        }
      }
      setStatus("Masomo yote yameshapakiwa!");
      setTimeout(() => setStatus(''), 3000);
      isPreloading.current = false;
    };
    preloadAll();
  }, []);

  if (!status) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-black/80 text-white p-3 rounded-lg text-sm text-center z-50">
      {status}
    </div>
  );
};

export default GlobalPreloader;
