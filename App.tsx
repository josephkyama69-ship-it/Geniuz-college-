
import React, { useState, Suspense, lazy } from 'react';
import type { Course } from './types';
import { COURSES } from './constants';
import Header from './components/Header';
import CourseCard from './components/CourseCard';
import Footer from './components/Footer';
import { ThemeProvider, useTheme } from './ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { cleanAllStoredLessons } from './services/storageService';

import KaribuGiniazCollege from './components/KiwandaChaNyumbani';
import MjasiriamaliPlus from './components/MjasiriamaliPlus';
import ApiEconomy from './components/ApiEconomy';
import CourseDetail from './components/CourseDetail';

const AppContent: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(() => {
    const savedCourseId = localStorage.getItem('selectedCourseId');
    if (savedCourseId) {
      return COURSES.find(c => c.id === savedCourseId) || null;
    }
    return null;
  });
  const { theme } = useTheme();

  React.useEffect(() => {
    // Perform a comprehensive audit of all cached lessons on app load to remove extraneous sections
    cleanAllStoredLessons();
  }, []);

  React.useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem('selectedCourseId', selectedCourse.id);
    } else {
      localStorage.removeItem('selectedCourseId');
    }
  }, [selectedCourse]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleBack = () => {
    setSelectedCourse(null);
  };

  const themeClasses = {
    cyber: 'bg-[#070a10] text-gray-200',
    sunrise: 'bg-[#120a05] text-amber-100',
    forest: 'bg-[#040e08] text-green-100',
    light: 'bg-[#fffdf2] text-gray-800',
    classic: 'bg-[#e8ebf5] text-slate-800',
    sunny: 'bg-[#fffbeb] text-yellow-950',
  };

  const accentTextClass = {
      cyber: 'text-cyan-400',
      sunrise: 'text-amber-300',
      forest: 'text-emerald-400',
      light: 'text-amber-600',
      classic: 'text-indigo-600',
      sunny: 'text-yellow-600',
  };

  const mutedTextClass = {
      cyber: 'text-gray-400',
      sunrise: 'text-amber-200/80',
      forest: 'text-green-200/80',
      light: 'text-amber-800/80',
      classic: 'text-slate-600',
      sunny: 'text-amber-900/70',
  };

  return (
    <div className={`min-h-screen ${themeClasses[theme]} flex flex-col transition-colors duration-500`}>
      <Header />
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 flex-grow">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        }>
          {selectedCourse ? (
            selectedCourse.id === 'karibu-giniaz-college' ? (
              <KaribuGiniazCollege onBack={handleBack} />
            ) : selectedCourse.id === 'mjasiriamali-plus' ? (
              <MjasiriamaliPlus onBack={handleBack} />
            ) : selectedCourse.id === 'api-economy' ? (
              <ApiEconomy course={selectedCourse} onBack={handleBack} />
            ) : (
              <CourseDetail course={selectedCourse} onBack={handleBack} />
            )
          ) : (
            <div>
              <h2 className={`text-3xl font-bold mb-2 text-center ${accentTextClass[theme]}`}>Karibu Giniaz College</h2>
              <p className={`text-lg text-center mb-8 ${mutedTextClass[theme]}`}>Chagua somo ili uanze kujifunza.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {COURSES.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onClick={() => handleSelectCourse(course)} 
                  />
                ))}
              </div>
            </div>
          )}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
