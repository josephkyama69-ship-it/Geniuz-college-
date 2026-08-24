import { openDB, IDBPDatabase } from 'idb';
import { cleanExtraneousLessonContent } from '../utils/studyNotesHelper';

const DB_NAME = 'GiniazCollegeDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<unknown>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('lessons')) {
          db.createObjectStore('lessons', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveLesson = async (id: string, content: string) => {
  const db = await initDB();
  await db.put('lessons', { id, content, timestamp: Date.now() });
};

export const getLesson = async (id: string) => {
  const db = await initDB();
  return await db.get('lessons', id);
};

export const deleteLesson = async (id: string) => {
  const db = await initDB();
  await db.delete('lessons', id);
};

export const clearCourseCache = async (courseTitle: string) => {
  const db = await initDB();
  await db.delete('lessons', `outline_${courseTitle}`);
  
  const tx = db.transaction('lessons', 'readwrite');
  const store = tx.objectStore('lessons');
  const keys = await store.getAllKeys();
  for (const key of keys) {
    if (typeof key === 'string' && (key.startsWith(`lesson_${courseTitle}_`) || key === `outline_${courseTitle}`)) {
      await store.delete(key);
    }
  }
  await tx.done;
};

export const saveProgress = async (id: string, progress: any) => {
  const db = await initDB();
  await db.put('progress', { id, progress, timestamp: Date.now() });
};

export const getProgress = async (id: string) => {
  const db = await initDB();
  return await db.get('progress', id);
};

export const cleanAllStoredLessons = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction('lessons', 'readwrite');
    const store = tx.objectStore('lessons');
    const keys = await store.getAllKeys();
    let cleanCount = 0;
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith('lesson_')) {
        const entry = await store.get(key);
        if (entry && entry.content) {
          const cleaned = cleanExtraneousLessonContent(entry.content);
          if (cleaned !== entry.content) {
            entry.content = cleaned;
            entry.timestamp = Date.now();
            await store.put(entry);
            cleanCount++;
          }
        }
      }
    }
    await tx.done;
    if (cleanCount > 0) {
      console.log(`[StorageService] Successfully cleaned ${cleanCount} stored lessons of extraneous sections.`);
    }
  } catch (err) {
    console.error("[StorageService] Error during database lesson cleaning:", err);
  }
};

