import React from 'react';

interface TransportControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPanic: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  isMetronomeOn: boolean;
  onMetronomeToggle: () => void;
}

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M6 6h12v12H6z" /></svg>
);

const PanicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" fill="currentColor" stroke="none" />
  </svg>
);

const MetronomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.49 18.28-8.49-14-8.49 14" />
    <path d="M4 22h16" />
    <path d="M12 2v20" />
    <path d="M12 12.5 4.5 10" />
  </svg>
);


export const TransportControls: React.FC<TransportControlsProps> = ({ isPlaying, onPlayPause, onStop, onPanic, bpm, onBpmChange, isMetronomeOn, onMetronomeToggle }) => {
  const buttonClasses = "p-2 rounded-md bg-black/20 hover:bg-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-purple-800";

  return (
    <div className="flex items-center justify-between w-full p-3 rounded-b-lg bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 to-purple-800">
      <div className="flex items-center gap-4">
        <button onClick={onPlayPause} className={buttonClasses} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
        <button onClick={onStop} className={buttonClasses} aria-label="Stop">
          <StopIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <label htmlFor="bpm" className="text-sm font-medium text-gray-300">BPM</label>
          <input
            type="number"
            id="bpm"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value, 10) || 120)}
            className="w-20 bg-black/20 border-2 border-white/10 text-center rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onMetronomeToggle}
          className={`${buttonClasses} ${isMetronomeOn ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}
          aria-label="Toggle Metronome"
          aria-pressed={isMetronomeOn}
        >
          <MetronomeIcon className="w-6 h-6" />
        </button>
        <button
          onClick={onPanic}
          className={`${buttonClasses} text-gray-400 hover:bg-red-600 hover:text-white`}
          aria-label="Panic: Stop all sound"
        >
          <PanicIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};