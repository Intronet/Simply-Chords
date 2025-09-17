import React from 'react';

interface PadProps {
  chordName: string;
  onMouseDown: (chordName: string) => void;
  onMouseUp: () => void;
  onMouseEnter: (chordName: string) => void;
  onMouseLeave: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isLoaded: boolean;
  isDisabled?: boolean;
}

export const Pad: React.FC<PadProps> = ({ chordName, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, onDragStart, isLoaded, isDisabled = false }) => {
  const baseClasses = "w-full min-h-[5rem] flex items-center justify-center p-2 rounded-md text-white font-semibold transition-all duration-100 transform focus:outline-none";
  
  // Classes for a darker, gradient pad with an inset shadow to give a curved look.
  const enabledClasses = "cursor-pointer bg-gradient-to-b from-slate-700 to-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] hover:from-slate-600 hover:to-slate-800 active:translate-y-px active:shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)]";
  
  const disabledClasses = "cursor-not-allowed bg-gray-700 opacity-50 shadow-inner";

  const finalIsDisabled = !isLoaded || isDisabled;
  
  const getTitle = () => {
    if (isDisabled) {
      return '3rd inversion is not available for this chord';
    }
    if (!isLoaded) {
      return 'Loading piano samples...';
    }
    return `Play or drag ${chordName}`;
  };

  return (
    <button
      onMouseDown={(e) => { if (e.button === 0 && !finalIsDisabled) onMouseDown(chordName); }}
      onMouseUp={onMouseUp}
      onMouseEnter={() => onMouseEnter(chordName)}
      onMouseLeave={() => {
        onMouseUp();
        onMouseLeave();
      }}
      onDragStart={onDragStart}
      draggable={!finalIsDisabled}
      disabled={finalIsDisabled}
      className={`${baseClasses} ${finalIsDisabled ? disabledClasses : enabledClasses}`}
      aria-label={`Play chord ${chordName}`}
      title={getTitle()}
    >
      <span className="text-white text-center font-semibold text-sm sm:text-base break-words pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
        {chordName}
      </span>
    </button>
  );
};