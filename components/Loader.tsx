import React from 'react';

interface PadProps {
  chordName: string;
  onMouseDown: (chordName: string) => void;
  onMouseUp: () => void;
  onMouseEnter: (chordName: string) => void;
  onMouseLeave: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isLoaded: boolean;
}

export const Pad: React.FC<PadProps> = ({ chordName, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, onDragStart, isLoaded }) => {
  const baseClasses = "w-full min-h-20 flex items-center justify-center p-3 rounded-lg bg-gray-700 border-b-4 border-gray-900 shadow-md transition-all duration-150 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500";
  const enabledClasses = "cursor-pointer hover:-translate-y-0.5 hover:bg-gray-600 active:translate-y-0 active:border-b-2 active:bg-indigo-700";
  const disabledClasses = "cursor-not-allowed bg-gray-600 opacity-50";

  return (
    <button
      onMouseDown={() => onMouseDown(chordName)}
      onMouseUp={onMouseUp}
      onMouseEnter={() => onMouseEnter(chordName)}
      onMouseLeave={() => {
        onMouseUp();
        onMouseLeave();
      }}
      onDragStart={onDragStart}
      draggable={isLoaded}
      disabled={!isLoaded}
      className={`${baseClasses} ${isLoaded ? enabledClasses : disabledClasses}`}
      aria-label={`Play chord ${chordName}`}
      title={isLoaded ? `Play or drag ${chordName}` : 'Loading piano samples...'}
    >
      <span className="text-white text-center font-semibold text-sm sm:text-base break-words">
        {chordName}
      </span>
    </button>
  );
};
