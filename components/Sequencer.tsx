import React, { useState, useRef, useCallback, MouseEvent, useEffect } from 'react';
import { SequenceChord } from '../types';

interface SequencerProps {
  sequence: SequenceChord[];
  onAddChord: (chordName: string, start: number) => void;
  onUpdateChord: (id: string, newProps: Partial<SequenceChord>) => void;
  onRemoveChord: (id: string) => void;
  onChordDoubleClick: (chord: SequenceChord) => void;
  onChordMouseDown: (chordName: string) => void;
  onChordMouseUp: () => void;
  playheadPosition: number; // in beats
  playingChordId: string | null;
}

const BAR_COUNT = 4;
const BEAT_COUNT = BAR_COUNT * 4;
const SUBDIVISION = 4; // 16th notes
const TOTAL_STEPS = BEAT_COUNT * SUBDIVISION;
const DEFAULT_CHORD_DURATION = 8; // A half note (8 * 16th steps)
const TRACK_PADDING = 4; // vertical padding in px

// --- ChordBlock Component ---
interface ChordBlockProps {
  chord: SequenceChord;
  stepWidth: number;
  trackHeight: number;
  onUpdate: (id: string, newProps: Partial<SequenceChord>) => void;
  onRemove: (id: string) => void;
  onDoubleClick: (chord: SequenceChord) => void;
  onChordMouseDown: (chordName: string) => void;
  onChordMouseUp: () => void;
  playingChordId: string | null;
}

const ChordBlock: React.FC<ChordBlockProps> = ({ chord, stepWidth, trackHeight, onUpdate, onRemove, onDoubleClick, onChordMouseDown, onChordMouseUp, playingChordId }) => {
  const dragStateRef = useRef<{
    isResizing: boolean;
    isMoving: boolean;
    startX: number;
    originalStart: number;
    originalDuration: number;
  } | null>(null);

  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };
    const handleBlur = () => setIsCtrlPressed(false);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  const isCurrentlyPlaying = chord.id === playingChordId;

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      const isResizeHandle = target.classList.contains('resize-handle');
      
      dragStateRef.current = {
        isResizing: isResizeHandle,
        isMoving: !isResizeHandle,
        startX: e.clientX,
        originalStart: chord.start,
        originalDuration: chord.duration,
      };

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        if (!dragStateRef.current || stepWidth === 0) return;
        
        const dx = moveEvent.clientX - dragStateRef.current.startX;
        
        if (dragStateRef.current.isResizing) {
          let newDuration;
          if (moveEvent.shiftKey) { // Precision mode (hold Shift)
            const durationDelta = dx / stepWidth;
            newDuration = dragStateRef.current.originalDuration + durationDelta;
          } else { // Snap to grid mode
            const dSteps = Math.round(dx / stepWidth);
            newDuration = dragStateRef.current.originalDuration + dSteps;
          }

          // Clamp duration to bounds
          newDuration = Math.max(
            0.1, // Minimum duration
            Math.min(TOTAL_STEPS - chord.start, newDuration)
          );

          if (newDuration !== chord.duration) {
            onUpdate(chord.id, { duration: newDuration });
          }

        } else if (dragStateRef.current.isMoving) {
          let newStart;
          if (moveEvent.shiftKey) { // Precision mode for moving
            const startDelta = dx / stepWidth;
            newStart = dragStateRef.current.originalStart + startDelta;
          } else { // Snap to grid mode for moving
            const dSteps = Math.round(dx / stepWidth);
            newStart = dragStateRef.current.originalStart + dSteps;
          }

          // Clamp start position to bounds
          newStart = Math.max(
            0,
            Math.min(TOTAL_STEPS - chord.duration, newStart)
          );

          if (newStart !== chord.start) {
            onUpdate(chord.id, { start: newStart });
          }
        }
      };

      const handleMouseUp = () => {
        dragStateRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else if (e.button === 0) {
      onChordMouseDown(chord.chordName);
    }
  }, [chord.id, chord.start, chord.duration, stepWidth, onUpdate, onChordMouseDown, chord.chordName]);
  
  const totalChordHeight = trackHeight; // A 1-beat chord width is beatWidth, which now equals trackHeight.

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 rounded-md flex items-center justify-center text-white text-xs font-medium select-none shadow-lg transition-colors duration-150 z-10
        bg-indigo-600 border border-indigo-400
        ${isCurrentlyPlaying ? 'ring-2 ring-sky-400' : ''}
        ${isCtrlPressed ? 'cursor-move' : 'cursor-pointer'}
      `}
      style={{
        left: `${chord.start * stepWidth + TRACK_PADDING}px`,
        width: `${chord.duration * stepWidth}px`,
        height: `${totalChordHeight}px`,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={onChordMouseUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onRemove(chord.id);
      }}
      onDoubleClick={() => onDoubleClick(chord)}
      title={`${chord.chordName}\nHold CTRL to move or resize.\nHold CTRL+SHIFT for precise move/resize.\nRight-click to delete.\nDouble-click to edit.`}
    >
      <span className="truncate px-2 pointer-events-none">{chord.chordName}</span>
      <div className={`resize-handle absolute right-0 top-0 bottom-0 w-2 ${isCtrlPressed ? 'cursor-ew-resize' : ''}`} />
    </div>
  );
};


// --- Sequencer Component ---
export const Sequencer: React.FC<SequencerProps> = ({
  sequence,
  onAddChord,
  onUpdateChord,
  onRemoveChord,
  onChordDoubleClick,
  onChordMouseDown,
  onChordMouseUp,
  playheadPosition,
  playingChordId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOverStep, setDragOverStep] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const calculateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    calculateWidth();
    const resizeObserver = new ResizeObserver(calculateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const gridWidth = containerWidth > 0 ? containerWidth - (TRACK_PADDING * 2) : 0;
  const stepWidth = gridWidth / TOTAL_STEPS;
  const beatWidth = stepWidth * SUBDIVISION;
  const barWidth = beatWidth * 4;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current || stepWidth === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const currentStep = Math.round(x / stepWidth);
    setDragOverStep(Math.max(0, Math.min(TOTAL_STEPS - DEFAULT_CHORD_DURATION, currentStep)));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const chordName = e.dataTransfer.getData("text/plain");
    if (chordName && dragOverStep !== null) {
      onAddChord(chordName, dragOverStep);
    }
    setDragOverStep(null);
  };
  
  const handleDragLeave = () => {
    setDragOverStep(null);
  };
  
  const playheadLeft = playheadPosition * beatWidth;

  const trackHeight = beatWidth > 0 ? beatWidth : 80;

  return (
    <div className="w-full flex flex-col p-2">
      {/* Timeline Ruler */}
      <div className="flex h-6 items-end" style={{ paddingLeft: `${TRACK_PADDING}px`, paddingRight: `${TRACK_PADDING}px` }}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div key={`bar-${i}`} style={{ width: `${barWidth}px` }} className="text-xs text-gray-500 border-l border-gray-600 pl-1">
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* Main track area */}
      <div 
        ref={containerRef}
        className="relative w-full bg-gray-900/50"
        style={{ height: `${trackHeight + 20}px` }} // +20 for vertical padding
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
      >
        {/* Grid background */}
        <div className="absolute inset-0" style={{ left: `${TRACK_PADDING}px`, right: `${TRACK_PADDING}px` }}>
           {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const isBeat = i % 4 === 0;
              const isThirdBeatOfBar = i % 16 === 8;
              let borderColorClass = 'border-gray-700'; // 16th note default
              if (isBeat) {
                // 3rd beat gets a lighter color for emphasis (half-note mark)
                borderColorClass = isThirdBeatOfBar ? 'border-gray-400' : 'border-gray-500';
              }
              return (
                <div
                  key={`sub-${i}`}
                  className={`absolute top-0 bottom-0 border-l ${borderColorClass}`}
                  style={{ left: `${i * stepWidth}px` }}
                />
              );
            })}
           {Array.from({ length: BAR_COUNT + 1 }).map((_, i) => (
              <div
                key={`barline-${i}`}
                className="absolute top-0 bottom-0 border-l-2 border-gray-600"
                style={{ left: `${i * barWidth}px` }}
              />
            ))}
        </div>
      
        {sequence.length === 0 && !dragOverStep && (
           <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-semibold pointer-events-none">
             Drag a chord from the side panel to start
           </div>
        )}

        {/* Drag Preview */}
        {dragOverStep !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 bg-indigo-500/30 rounded pointer-events-none"
            style={{
              left: `${dragOverStep * stepWidth + TRACK_PADDING}px`,
              width: `${DEFAULT_CHORD_DURATION * stepWidth}px`, // Default duration
              height: `${trackHeight}px`,
            }}
          />
        )}
        
        {/* Chords */}
        {sequence.map(chord => (
          <ChordBlock
            key={chord.id}
            chord={chord}
            stepWidth={stepWidth}
            trackHeight={trackHeight}
            onUpdate={onUpdateChord}
            onRemove={onRemoveChord}
            onDoubleClick={onChordDoubleClick}
            onChordMouseDown={onChordMouseDown}
            onChordMouseUp={onChordMouseUp}
            playingChordId={playingChordId}
          />
        ))}
        
        {/* Playhead */}
        {stepWidth > 0 && playheadLeft <= gridWidth && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ 
              left: `${playheadLeft + TRACK_PADDING}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};