import React, { useState, useEffect } from 'react';

export const Header: React.FC = () => {
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    fetch('/metadata.json')
      .then(response => response.json())
      .then(data => setProjectName(data.name))
      .catch(error => {
        console.error('Error fetching metadata.json:', error);
        // Fallback in case fetch fails
        setProjectName('Simply Chords');
      });
  }, []);

  return (
    <div className="flex flex-col items-center pt-12 pb-8">
      <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
        {projectName}
      </h1>
    </div>
  );
};