import { COURSES } from '../constants';
import { generateCourseOutline, generateLessonContentStream } from './geminiService';

export const preloadAll = async () => {
  console.log('Starting background preloading...');
  for (const course of COURSES) {
    try {
      console.log(`Preloading course: ${course.title}`);
      const outline = await generateCourseOutline(course.title);
      for (const lesson of outline) {
        console.log(`Preloading lesson: ${lesson.title}`);
        await generateLessonContentStream(course.title, lesson.title, () => {});
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.error(`Failed to preload ${course.title}`, e);
    }
  }
  console.log('Background preloading complete.');
};
