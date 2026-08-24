
import React from 'react';

const AudioWaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8v8m4-10v12m4-14v16m4-12v8m4-6v4" />
  </svg>
);

export default AudioWaveIcon;
