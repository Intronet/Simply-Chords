import React from 'react';
import { DrumPattern, DrumSound } from '../types';
import { DRUM_SOUNDS } from './drums/drumPatterns';

interface DrumMachineProps {
  pattern: Record<DrumSound, boolean[]>;
  onPatternChange: (sound: DrumSound, step: number, value: boolean) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isEnabled: boolean;
  onToggleEnabled: () => void;
  presets: DrumPattern[];
  selectedPresetIndex: number;
  onPresetChange: (index: number) => void;
  activeStep: number | null;
}

const soundLabels: Record<DrumSound, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hat: 'Hi-Hat',
  clap: 'Clap',
};

export const DrumMachine: React.FC<DrumMachineProps> = ({
  pattern,
  onPatternChange,
  volume,
  onVolumeChange,
  isEnabled,
  onToggleEnabled,
  presets,
  selectedPresetIndex,
  onPresetChange,
  activeStep,
}) => {
  const selectStyles = "bg-gray-800 border-2 border-gray-700 text-gray-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent block p-2 transition-all duration-200 w-full";
  const stepButtonBase = "w-full h-full rounded transition-colors duration-100 border";

  return (
    <div className="flex-shrink-0 bg-gray-800/50 rounded-lg border border-gray-700 p-3 mb-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-indigo-300">Drum Machine</h3>
        <div className="flex items-center gap-4">
          <select
            id="drum-preset-select"
            value={selectedPresetIndex}
            onChange={(e) => onPresetChange(parseInt(e.target.value, 10))}
            className={selectStyles}
            aria-label="Select drum pattern"
          >
            {presets.map((p, index) => <option key={p.name} value={index}>{p.name}</option>)}
          </select>

          <div className="flex items-center gap-2">
            <label htmlFor="drum-volume" className="text-sm font-medium text-gray-400">Vol</label>
            <input
              type="range"
              id="drum-volume"
              min={-40}
              max={6}
              step={1}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-slider"
              aria-label="Drum volume"
            />
          </div>

          <button
            type="button"
            onClick={onToggleEnabled}
            className={`${isEnabled ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
            role="switch"
            aria-checked={isEnabled}
            aria-label="Toggle drum machine"
          >
            <span
              aria-hidden="true"
              className={`${isEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[80px_1fr] gap-x-4">
        {/* Sound Labels */}
        <div className="flex flex-col gap-1">
          {DRUM_SOUNDS.map(sound => (
            <div key={sound} className="h-7 flex items-center justify-end pr-2 text-sm font-semibold text-gray-300">
              {soundLabels[sound]}
            </div>
          ))}
        </div>

        {/* Sequencer Grid */}
        <div className="relative grid grid-cols-16 gap-1">
          {DRUM_SOUNDS.map(sound => (
            <React.Fragment key={sound}>
              {pattern[sound].map((isActive, step) => {
                const isBeat = step % 4 === 0;
                const isPlaying = activeStep === step;
                return (
                  <div
                    key={`${sound}-${step}`}
                    className={`h-7 p-px rounded ${isBeat ? 'bg-gray-700/50' : 'bg-transparent'}`}
                  >
                    <button
                      onClick={() => onPatternChange(sound, step, !isActive)}
                      aria-pressed={isActive}
                      className={`${stepButtonBase} ${isActive ? 'bg-indigo-500 border-indigo-300' : 'bg-gray-800/80 hover:bg-gray-700 border-gray-700'}`}
                    >
                       {isPlaying && <div className="w-full h-full bg-sky-400/50 rounded animate-pulse-fast"></div>}
                    </button>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
       <style>{`
        .grid-cols-16 {
            grid-template-columns: repeat(16, minmax(0, 1fr));
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #818cf8;
          cursor: pointer;
          transition: background .2s;
        }
        
        .range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #818cf8;
          cursor: pointer;
          border: none;
          transition: background .2s;
        }

        .range-slider:hover::-webkit-slider-thumb {
            background: #a78bfa;
        }

        .range-slider:hover::-moz-range-thumb {
            background: #a78bfa;
        }
      `}</style>
    </div>
  );
};