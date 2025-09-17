import React from 'react';
import { Pad } from './Loader';

interface PadGridProps {
  chords: string[];
  onPadMouseDown: (chordName: string) => void;
  onPadMouseUp: () => void;
  onPadMouseEnter: (chordName: string) => void;
  onPadMouseLeave: () => void;
  onPadDragStart: (e: React.DragEvent, chordName: string) => void;
  isPianoLoaded: boolean;
}

export const PadGrid: React.FC<PadGridProps> = ({ chords, onPadMouseDown, onPadMouseUp, onPadMouseEnter, onPadMouseLeave, onPadDragStart, isPianoLoaded }) => {
  return (
    <div className="relative animate-fade-in">
      <div className="grid grid-cols-4 gap-3">
        {chords.map((chord, index) => (
          <Pad 
            key={`${chord}-${index}`} 
            chordName={chord} 
            onMouseDown={onPadMouseDown} 
            onMouseUp={onPadMouseUp} 
            onMouseEnter={onPadMouseEnter}
            onMouseLeave={onPadMouseLeave}
            onDragStart={(e) => onPadDragStart(e, chord)}
            isLoaded={isPianoLoaded} 
          />
        ))}
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
