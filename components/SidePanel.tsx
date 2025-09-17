import React from 'react';
import { PadGrid } from './ResultCard';
import { Controls } from './PromptForm';
import { ChordSet } from '../types';
import { OctaveSlider } from './OctaveSlider';
import { Generator } from './Generator';

interface SidePanelProps {
  chords: string[];
  songKey: string;
  setSongKey: (key: string) => void;
  category: string;
  setCategory: (category: string) => void;
  chordSetIndex: number;
  setChordSetIndex: (index: number) => void;
  categories: string[];
  chordSets: ChordSet[];
  keys: { value: string; label: string; }[];
  onPadMouseDown: (chordName: string) => void;
  onPadMouseUp: () => void;
  onPadMouseEnter: (chordName: string) => void;
  onPadMouseLeave: () => void;
  isPianoLoaded: boolean;
  octave: number;
  setOctave: (octave: number) => void;
  inversionLevel: number;
  setInversionLevel: (level: number) => void;
  isVoicingFeatureOn: boolean;
  setIsVoicingFeatureOn: (isOn: boolean) => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const InversionControl: React.FC<{
  inversionLevel: number;
  setInversionLevel: (level: number) => void;
  disabled: boolean;
}> = ({ inversionLevel, setInversionLevel, disabled }) => {
  const options = [
    { label: 'Root', value: 0 },
    { label: '1st Inv', value: 1 },
    { label: '2nd Inv', value: 2 },
    { label: '3rd Inv', value: 3 },
  ];

  return (
    <div className={`flex flex-col gap-2 transition-opacity duration-200 ${disabled ? 'opacity-50' : ''}`}>
       <label className="block text-sm font-medium text-gray-400">Inversion</label>
       <div className="flex items-center bg-gray-800 border-2 border-gray-700 rounded-lg p-1">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => setInversionLevel(option.value)}
            disabled={disabled}
            className={`flex-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800
              ${inversionLevel === option.value && !disabled
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-300 hover:bg-gray-700'
              }
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            aria-pressed={inversionLevel === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const VoicingToggle: React.FC<{
  isOn: boolean;
  setIsOn: (isOn: boolean) => void;
}> = ({ isOn, setIsOn }) => {
  return (
    <button
      type="button"
      onClick={() => setIsOn(!isOn)}
      className={`${
        isOn ? 'bg-indigo-600' : 'bg-gray-600'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
      role="switch"
      aria-checked={isOn}
      aria-label="Toggle voicing feature"
    >
      <span
        aria-hidden="true"
        className={`${
          isOn ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};


export const SidePanel: React.FC<SidePanelProps> = ({
  chords,
  songKey,
  setSongKey,
  category,
  setCategory,
  chordSetIndex,
  setChordSetIndex,
  categories,
  chordSets,
  keys,
  onPadMouseDown,
  onPadMouseUp,
  onPadMouseEnter,
  onPadMouseLeave,
  isPianoLoaded,
  octave,
  setOctave,
  inversionLevel,
  setInversionLevel,
  isVoicingFeatureOn,
  setIsVoicingFeatureOn,
  onGenerate,
  isGenerating,
}) => {
  
  const handlePadDragStart = (e: React.DragEvent, chordName: string) => {
    e.dataTransfer.setData("text/plain", chordName);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-[34rem] h-full bg-gray-800/30 p-4 border-l border-gray-700 hidden lg:block">
      <div className="h-full grid grid-rows-[auto_1fr] gap-4">
        {/* Non-scrolling controls area */}
        <div className="flex-shrink-0 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-indigo-300 mb-2">Controls</h2>
            <Controls
              songKey={songKey}
              setSongKey={setSongKey}
              category={category}
              setCategory={setCategory}
              chordSetIndex={chordSetIndex}
              setChordSetIndex={setChordSetIndex}
              categories={categories}
              chordSets={chordSets}
              keys={keys}
            />
          </div>
          
          <div>
            <Generator onGenerate={onGenerate} isGenerating={isGenerating} />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-indigo-300">Voicing Controls</h2>
              <VoicingToggle isOn={isVoicingFeatureOn} setIsOn={setIsVoicingFeatureOn} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <OctaveSlider octave={octave} setOctave={setOctave} />
              <InversionControl 
                inversionLevel={inversionLevel} 
                setInversionLevel={setInversionLevel}
                disabled={!isVoicingFeatureOn}
              />
            </div>
          </div>
        </div>

        {/* Scrolling pad grid area */}
        <div className="min-h-0 pr-2 pb-[10px] overflow-y-scroll custom-scrollbar">
          <PadGrid 
            chords={chords} 
            onPadMouseDown={onPadMouseDown} 
            onPadMouseUp={onPadMouseUp} 
            isPianoLoaded={isPianoLoaded}
            onPadMouseEnter={onPadMouseEnter}
            onPadMouseLeave={onPadMouseLeave}
            onPadDragStart={handlePadDragStart}
          />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; /* gray-800 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4f46e5; /* indigo-600 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1; /* indigo-500 */
        }
      `}</style>
    </aside>
  );
};
