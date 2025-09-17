export const KEY_OPTIONS = [
  { value: 'C', label: 'C Major / A Minor' },
  { value: 'G', label: 'G Major / E Minor' },
  { value: 'D', label: 'D Major / B Minor' },
  { value: 'A', label: 'A Major / F# Minor' },
  { value: 'E', label: 'E Major / C# Minor' },
  { value: 'B', label: 'B Major / G# Minor' },
  { value: 'F#', label: 'F# Major / D# Minor' },
  { value: 'C#', label: 'C# Major / A# Minor' },
  { value: 'F', label: 'F Major / D Minor' },
  { value: 'Bb', label: 'Bb Major / G Minor' },
  { value: 'Eb', label: 'Eb Major / C Minor' },
  { value: 'Ab', label: 'Ab Major / F Minor' },
  { value: 'Db', label: 'Db Major / Bb Minor' },
  { value: 'Gb', label: 'Gb Major / Eb Minor' },
  { value: 'Cb', label: 'Cb Major / Ab Minor' },
];

export interface ChordSet {
  name: string;
  chords: string[];
}

export type ChordData = {
  [category: string]: ChordSet[];
};

export interface SequenceChord {
  id: string;
  chordName: string;
  start: number; // in 16th note steps (0-63 for 4 bars)
  duration: number; // in 16th note steps
}

export type DrumSound = 'kick' | 'snare' | 'hat' | 'clap' | 'rim' | 'timbale';

export interface DrumPattern {
  name: string;
  pattern: Record<DrumSound, boolean[]>;
}