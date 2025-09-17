import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SidePanel } from './components/SidePanel';
import { chordData as staticChordData } from './services/geminiService';
import { 
  transposeProgression, 
  getChordNoteStrings,
  startChordSound, 
  stopChordSound, 
  startNoteSound,
  stopNoteSound,
  initAudio,
  parseChord,
  INVERSION_REGEX,
  updateChord,
  playChordOnce,
  sampler
} from './index';
import { KEY_OPTIONS, ChordSet, SequenceChord } from './types';
import { Piano } from './components/Piano';
import { generateProgression } from './services/geminiService';
import { HoverDisplay } from './components/HoverDisplay';
import { Sequencer } from './components/Sequencer';
import * as Tone from 'tone';
import { TransportControls } from './components/TransportControls';
import { ChordEditor } from './components/ChordEditor';

// Simple unique ID generator
const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

// --- Note Normalization for Piano UI ---
// The Piano component expects sharp notes for black keys (e.g., 'C#'),
// but the audio engine can produce flat notes (e.g., 'Db').
// These functions convert flats to sharps for UI display without affecting audio.
const FLAT_TO_SHARP: { [note: string]: string } = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
};
const normalizeNoteForPiano = (note: string): string => {
  if (!note) return '';
  // Match the pitch class (e.g., 'C', 'Db', 'F#') and the rest (octave, etc.)
  const match = note.match(/^([A-G](?:b|#)?)(.*)$/);
  if (!match) return note; // Return original if no match

  const pitch = match[1];
  const rest = match[2];

  return (FLAT_TO_SHARP[pitch] || pitch) + rest;
};
const normalizeNotesForPiano = (notes: string[]): string[] => notes.map(normalizeNoteForPiano);


const App: React.FC = () => {
  const [songKey, setSongKey] = useState<string>('C');
  const [category, setCategory] = useState<string>(Object.keys(staticChordData)[0]);
  const [chordSetIndex, setChordSetIndex] = useState(0);
  const [octave, setOctave] = useState(0);
  const [inversionLevel, setInversionLevel] = useState(0); // 0: Root, 1: 1st, 2: 2nd
  const [isVoicingFeatureOn, setIsVoicingFeatureOn] = useState(false);
  const [isPianoLoaded, setIsPianoLoaded] = useState(false);
  const [activePadChordNotes, setActivePadChordNotes] = useState<string[]>([]);
  const [activePianoNote, setActivePianoNote] = useState<string | null>(null);
  const [generatedChordSets, setGeneratedChordSets] = useState<ChordSet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredItemName, setHoveredItemName] = useState<string | null>(null);
  const [hoveredNotes, setHoveredNotes] = useState<string[]>([]);
  
  // --- Sequencer State ---
  const [sequence, setSequence] = useState<SequenceChord[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [playingChordId, setPlayingChordId] = useState<string | null>(null);
  const [sequencerActiveNotes, setSequencerActiveNotes] = useState<string[]>([]);
  const [activeSequencerManualNotes, setActiveSequencerManualNotes] = useState<string[]>([]);
  const partRef = useRef<Tone.Part | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // --- Metronome State ---
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const metronomeRef = useRef<{ synth: Tone.Synth, loop: Tone.Loop } | null>(null);

  // --- Chord Editor State ---
  const [editingChord, setEditingChord] = useState<SequenceChord | null>(null);
  const [activeEditorPreviewNotes, setActiveEditorPreviewNotes] = useState<string[]>([]);

  // Configure Tone.Transport to loop
  useEffect(() => {
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = '4m';
  }, []);

  // Initialize Metronome
  useEffect(() => {
    const metronomeSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.1 },
        volume: -12,
    }).toDestination();

    const loop = new Tone.Loop(time => {
      // This callback is invoked on the audio thread.
      const ticks = Tone.Transport.getTicksAtTime(time);
      const currentBeat = Math.floor(ticks / Tone.Transport.PPQ) % 4;

      if (currentBeat === 0) {
          // Downbeat: higher pitch
          metronomeSynth.triggerAttackRelease("G5", "32n", time);
      } else {
          // Other beats: lower pitch
          metronomeSynth.triggerAttackRelease("C5", "32n", time);
      }
    }, "4n").start(0);

    loop.mute = true;
    metronomeRef.current = { synth: metronomeSynth, loop };

    return () => {
        metronomeRef.current?.synth.dispose();
        metronomeRef.current?.loop.dispose();
    }
  }, []);

  useEffect(() => {
    if (metronomeRef.current) {
        metronomeRef.current.loop.mute = !isMetronomeOn;
    }
  }, [isMetronomeOn]);


  const handlePadMouseUp = useCallback(() => {
    if (activePadChordNotes.length > 0) {
      // Use stopChordSound to release only the specific notes from the pad.
      // This prevents it from cutting off other sustained notes (e.g., from the sequencer).
      stopChordSound(activePadChordNotes);
      setActivePadChordNotes([]);
    }
  }, [activePadChordNotes]);

  const handleSequencerChordMouseUp = useCallback(() => {
    if (activeSequencerManualNotes.length > 0) {
      stopChordSound(activeSequencerManualNotes);
      setActiveSequencerManualNotes([]);
    }
  }, [activeSequencerManualNotes]);

  // Global mouse up listener to act as a safety net against stuck notes
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // Stop any pad notes that are playing
      handlePadMouseUp();
      // Stop any manually played sequencer notes
      handleSequencerChordMouseUp();
      // Stop any piano notes that are playing
      if (activePianoNote) {
        stopNoteSound(activePianoNote);
        setActivePianoNote(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    // Also listen for mouse leaving the window entirely
    document.documentElement.addEventListener('mouseleave', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [activePianoNote, handlePadMouseUp, handleSequencerChordMouseUp]);

  // Sync Tone.Transport BPM with state
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  // Sync Tone.Part with sequence state
  useEffect(() => {
    if (partRef.current) {
      partRef.current.dispose();
    }
    
    const events: {
      time: string;
      type: 'attack' | 'release' | 'ui_stop';
      id: string | null;
      chordName: string | null;
    }[] = [];

    sequence.forEach(seqChord => {
      // START EVENT (ATTACK + UI)
      const totalSixteenthsStart = seqChord.start;
      const barStart = Math.floor(totalSixteenthsStart / 16);
      const beatStart = Math.floor((totalSixteenthsStart % 16) / 4);
      const sixteenthStart = totalSixteenthsStart % 4;

      events.push({
        time: `${barStart}:${beatStart}:${sixteenthStart}`,
        type: 'attack',
        id: seqChord.id,
        chordName: seqChord.chordName,
      });

      // END EVENT (RELEASE + UI)
      const totalSixteenthsEnd = seqChord.start + seqChord.duration;
      const barEnd = Math.floor(totalSixteenthsEnd / 16);
      const beatEnd = Math.floor((totalSixteenthsEnd % 16) / 4);
      const sixteenthEnd = totalSixteenthsEnd % 4;

      events.push({
        time: `${barEnd}:${beatEnd}:${sixteenthEnd}`,
        type: 'release',
        id: seqChord.id,
        chordName: seqChord.chordName, // Pass name to get notes for release
      });
    });

    // Add a final event to clear any active highlight at the end of the loop.
    events.push({ time: '4:0:0', type: 'ui_stop', id: null, chordName: null });

    partRef.current = new Tone.Part((time, value) => {
      const chordNotes = value.chordName ? getChordNoteStrings(value.chordName, octave) : [];

      if (value.type === 'attack' && chordNotes.length > 0) {
        // Simulates mousedown: attack notes, start UI highlight
        sampler.set({ release: 0.05 }); // Tiny release to prevent clicks but feel instant
        sampler.triggerAttack(chordNotes, time);
        Tone.Draw.schedule(() => {
          setPlayingChordId(value.id);
          setSequencerActiveNotes(chordNotes);
        }, time);
      } else if (value.type === 'release' && chordNotes.length > 0) {
        // Simulates mouseup: release notes, stop UI highlight
        sampler.triggerRelease(chordNotes, time);
        Tone.Draw.schedule(() => {
          setPlayingChordId(currentId => {
            if (currentId === value.id) {
              setSequencerActiveNotes([]);
              return null;
            }
            return currentId;
          });
        }, time);
      } else if (value.type === 'ui_stop') {
        // Clean up UI at the very end of the loop
        Tone.Draw.schedule(() => {
          setPlayingChordId(null);
          setSequencerActiveNotes([]);
        }, time);
      }
    }, events).start(0);

    partRef.current.loop = true;
    partRef.current.loopEnd = '4m';

  }, [sequence, octave]);

  const updatePlayhead = useCallback(() => {
    const totalBeats = 16; // 4 bars * 4 beats
    const progress = Tone.Transport.progress;
    setPlayheadPosition(progress * totalBeats);
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, []);
  

  const handlePlay = () => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    }
  };

  const handleStop = () => {
    Tone.Transport.stop();
    sampler.releaseAll();
    Tone.Transport.position = 0;
    setIsPlaying(false);
    setPlayheadPosition(0);
    setPlayingChordId(null);
    setSequencerActiveNotes([]);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handlePanic = () => {
    sampler.releaseAll();
    // No need to release metronome synths as they have very short tails.
    // Pause transport immediately without resetting position.
    Tone.Transport.pause();
    setIsPlaying(false);
    setSequencerActiveNotes([]); // Clear visual feedback
    setPlayingChordId(null);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };


  const addChordToSequence = (chordName: string, start: number) => {
    const newChord: SequenceChord = {
      id: generateId(),
      chordName,
      start,
      duration: 8, // Default to a half note (8 * 16th notes)
    };
    setSequence(prev => [...prev, newChord]);
  };

  const updateChordInSequence = (id: string, newProps: Partial<SequenceChord>) => {
    setSequence(prev => prev.map(c => c.id === id ? { ...c, ...newProps } : c));
  };

  const removeChordFromSequence = (id: string) => {
    setSequence(prev => prev.filter(c => c.id !== id));
  };
  
  const handleSequencerChordMouseDown = (chordName: string) => {
    sampler.set({ release: 0.1 }); // A little release is nice for manual playing
    const notes = getChordNoteStrings(chordName, octave);
    if (notes.length > 0) {
      startChordSound(notes);
      setActiveSequencerManualNotes(notes);
    }
  };

  const handleApplyChordEdit = (newChordName: string) => {
    if (editingChord) {
      updateChordInSequence(editingChord.id, { chordName: newChordName });
    }
    setEditingChord(null);
  };
  
  const playEditorPreview = useCallback((chordName: string) => {
    sampler.set({ release: 0.1 }); // Restore longer release for manual playing/preview
    const notes = getChordNoteStrings(chordName, octave);
    if (activeEditorPreviewNotes.length > 0) {
      stopChordSound(activeEditorPreviewNotes);
    }
    if (notes.length > 0) {
      startChordSound(notes);
      setActiveEditorPreviewNotes(notes);
    }
  }, [octave, activeEditorPreviewNotes]);

  const stopEditorPreview = useCallback(() => {
    if (activeEditorPreviewNotes.length > 0) {
      stopChordSound(activeEditorPreviewNotes);
      setActiveEditorPreviewNotes([]);
    }
  }, [activeEditorPreviewNotes]);


  const chordData = useMemo(() => {
    const generatedData = generatedChordSets.length > 0 ? { "AI Generated": generatedChordSets } : {};
    return {
      ...generatedData,
      ...staticChordData,
    };
  }, [generatedChordSets]);
  
  const categories = useMemo(() => Object.keys(chordData), [chordData]);

  useEffect(() => {
    initAudio().then(() => setIsPianoLoaded(true));
  }, []);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setChordSetIndex(0);
  };
  
  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const newChords = await generateProgression(prompt, songKey);
      if (newChords.length > 0) {
        const newSet: ChordSet = {
          name: `AI: ${prompt.length > 30 ? prompt.substring(0, 27) + '...' : prompt}`,
          chords: newChords,
        };
        const updatedGeneratedSets = [newSet, ...generatedChordSets];
        setGeneratedChordSets(updatedGeneratedSets);
        setCategory("AI Generated");
        setChordSetIndex(0);
      } else {
        throw new Error("AI returned an empty or invalid progression.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedChordSet = useMemo(() => {
    if (!chordData[category] || !chordData[category][chordSetIndex]) {
      const firstCategory = Object.keys(chordData)[0];
      if (firstCategory && chordData[firstCategory]?.length > 0) {
        return chordData[firstCategory][0];
      }
      return { name: '', chords: [] };
    }
    return chordData[category][chordSetIndex];
  }, [category, chordSetIndex, chordData]);

  const processChordsForDisplay = useCallback((chords: string[]) => {
      if (!isVoicingFeatureOn) {
        return chords;
      }
      const getInvSuffix = (level: number): string => {
        switch (level) {
          case 1: return ' (1st inv.)';
          case 2: return ' (2nd inv.)';
          case 3: return ' (3rd inv.)';
          default: return '';
        }
      };
      
      const invSuffix = getInvSuffix(inversionLevel);

      return chords.map(chord => {
        const parsed = parseChord(chord);
        if (!parsed || parsed.bass) return chord;
        const baseChordName = `${parsed.root}${parsed.quality.replace(INVERSION_REGEX, '').trim()}`;
        if (invSuffix) {
          return `${baseChordName}${invSuffix}`;
        }
        return baseChordName;
      });
  }, [inversionLevel, isVoicingFeatureOn]);

  const transposedChords = useMemo(() => {
    if (!selectedChordSet || !selectedChordSet.chords) return [];
    const transposed = transposeProgression(selectedChordSet.chords, songKey);
    return processChordsForDisplay(transposed);
  }, [selectedChordSet, songKey, processChordsForDisplay]);

  const displayedChordSets = useMemo(() => {
    if (!chordData[category]) return [];
    return chordData[category].map(set => {
       const transposed = transposeProgression(set.chords, songKey);
       const finalChords = processChordsForDisplay(transposed);
       return {
        ...set,
        name: set.name.startsWith("AI:") ? set.name : finalChords.join(', '),
      }
    });
  }, [category, songKey, chordData, processChordsForDisplay]);

  const handlePadMouseDown = (chordName: string) => {
    // Set a very short attack and zero release for an immediate pad sound that stops instantly.
    sampler.set({
      attack: 0.005,
      release: 0.0,
    });
    const notes = getChordNoteStrings(chordName, octave);
    if (notes.length > 0) {
      startChordSound(notes);
      setActivePadChordNotes(notes);
    }
  };

  const handlePianoMouseDown = (note: string) => {
    sampler.set({ release: 0.1 }); // Restore longer release for manual playing
    startNoteSound(note);
    setActivePianoNote(note);
  };

  const handlePadMouseEnter = (chordName: string) => {
    const notes = getChordNoteStrings(chordName, octave);
    if (notes.length > 0) {
      const noteNames = notes.map(n => n.replace(/[0-9]/g, '')).join(' ');
      setHoveredItemName(noteNames);
      setHoveredNotes(notes);
    }
  };

  const handlePadMouseLeave = () => {
    setHoveredItemName(null);
    setHoveredNotes([]);
  };

  const handlePianoKeyMouseEnter = (note: string) => {
    if (activePianoNote && note !== activePianoNote) {
      stopNoteSound(activePianoNote);
      startNoteSound(note);
      setActivePianoNote(note);
    }
    setHoveredItemName(note);
    setHoveredNotes([note]);
  };

  const handlePianoKeyMouseLeave = () => {
    setHoveredItemName(null);
    setHoveredNotes([]);
  };

  const handlePianoMouseLeave = () => {
    if (activePianoNote) {
      stopNoteSound(activePianoNote);
      setActivePianoNote(null);
    }
    setHoveredItemName(null);
    setHoveredNotes([]);
  };

  const allActiveNotes = useMemo(() => {
    const notes = [
      ...activePadChordNotes,
      ...activeEditorPreviewNotes,
      ...sequencerActiveNotes,
      ...activeSequencerManualNotes
    ];
    if (activePianoNote) {
        notes.push(activePianoNote);
    }
    return [...new Set(notes)];
  }, [
      activePadChordNotes, 
      activeEditorPreviewNotes, 
      activePianoNote, 
      sequencerActiveNotes,
      activeSequencerManualNotes
    ]);

  const highlightedNotesForPiano = useMemo(() => {
    const notes = [...new Set([...allActiveNotes, ...hoveredNotes])];
    return normalizeNotesForPiano(notes);
  }, [allActiveNotes, hoveredNotes]);
  
  const pressedPianoNotes = useMemo(() => {
    return normalizeNotesForPiano(allActiveNotes);
  }, [allActiveNotes]);


  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex selection:bg-indigo-500 selection:text-white overflow-hidden">
      <main className="flex-1 flex flex-col w-full px-8 overflow-hidden">
        <Header />
        <HoverDisplay name={hoveredItemName} />
        <Piano 
          highlightedNotes={highlightedNotesForPiano}
          pressedNotes={pressedPianoNotes}
          onKeyMouseDown={handlePianoMouseDown}
          onKeyMouseEnter={handlePianoKeyMouseEnter}
          onKeyMouseLeave={handlePianoKeyMouseLeave}
          onPianoMouseLeave={handlePianoMouseLeave}
        />
        <div className="flex-grow flex flex-col pt-4 min-h-0">
          <div className="bg-gray-800/50 rounded-t-lg border border-b-0 border-gray-700 overflow-hidden">
            <Sequencer 
              sequence={sequence}
              onAddChord={addChordToSequence}
              onUpdateChord={updateChordInSequence}
              onRemoveChord={removeChordFromSequence}
              onChordDoubleClick={setEditingChord}
              onChordMouseDown={handleSequencerChordMouseDown}
              onChordMouseUp={handleSequencerChordMouseUp}
              playheadPosition={playheadPosition}
              playingChordId={playingChordId}
            />
          </div>
          <TransportControls 
            isPlaying={isPlaying}
            onPlayPause={handlePlay}
            onStop={handleStop}
            onPanic={handlePanic}
            bpm={bpm}
            onBpmChange={setBpm}
            isMetronomeOn={isMetronomeOn}
            onMetronomeToggle={() => setIsMetronomeOn(prev => !prev)}
          />
        </div>
        {error && (
          <div 
            className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-red-500/90 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up"
            role="alert"
          >
            <p><span className="font-bold">Error:</span> {error}</p>
          </div>
        )}
      </main>

      <SidePanel
        songKey={songKey}
        setSongKey={setSongKey}
        category={category}
        setCategory={handleCategoryChange}
        chordSetIndex={chordSetIndex}
        setChordSetIndex={setChordSetIndex}
        categories={categories}
        chordSets={displayedChordSets}
        keys={KEY_OPTIONS}
        chords={transposedChords}
        onPadMouseDown={handlePadMouseDown}
        onPadMouseUp={handlePadMouseUp}
        onPadMouseEnter={handlePadMouseEnter}
        onPadMouseLeave={handlePadMouseLeave}
        isPianoLoaded={isPianoLoaded}
        octave={octave}
        setOctave={setOctave}
        inversionLevel={inversionLevel}
        setInversionLevel={setInversionLevel}
        isVoicingFeatureOn={isVoicingFeatureOn}
        setIsVoicingFeatureOn={setIsVoicingFeatureOn}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      {editingChord && (
        <ChordEditor 
          chord={editingChord}
          onClose={() => {
            stopEditorPreview();
            setEditingChord(null);
          }}
          onApply={handleApplyChordEdit}
          onPreview={playEditorPreview}
          updateChordUtil={updateChord}
        />
      )}

       <style>{`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
          }
       `}</style>
    </div>
  );
};

export default App;
