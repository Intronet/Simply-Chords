import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface GeneratorProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export const Generator: React.FC<GeneratorProps> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-indigo-300">AI Generator</h2>
        <button
          type="submit"
          disabled={true}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Generate
        </button>
      </div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a progression (e.g., 'dreamy lofi in C minor')"
        className="bg-gray-800 border-2 border-gray-700 text-gray-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent block w-full p-2.5 transition-all duration-200 resize-none h-20 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Chord progression description"
        disabled={true}
      />
    </form>
  );
};