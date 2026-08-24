import type { ComponentType } from 'react';

export interface Course {
  id: string;
  title: string;
  description: string;
  // FIX: Use ComponentType imported from 'react' to resolve namespace error.
  icon: ComponentType<{ className?: string }>;
}

export interface Lesson {
  title: string;
  content: string;
}
