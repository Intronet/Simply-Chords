import { DrumPattern } from '../../types';

export const DRUM_SOUNDS = ['kick', 'snare', 'hat', 'clap'] as const;
export type DrumSound = typeof DRUM_SOUNDS[number];

export const PRESET_DRUM_PATTERNS: DrumPattern[] = [
  {
    name: 'Four on the Floor',
    pattern: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
      clap:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
  {
    name: 'Basic Rock',
    pattern: {
      kick:  [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      clap:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
  {
    name: 'Hip-Hop',
    pattern: {
      kick:  [true, false, false, true, false, false, false, true, true, false, false, false, false, true, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true],
      clap:  [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
  },
    {
    name: 'Trap',
    pattern: {
      kick:  [true, false, false, false, false, true, false, false, false, false, true, false, true, true, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [false, false, true, true, false, false, true, true, false, false, true, true, false, true, true, true],
      clap:  [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
  },
  {
    name: 'Offbeat Hats',
    pattern: {
      kick:  [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
      snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      hat:   [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true],
      clap:  [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
  },
  {
    name: 'Empty',
    pattern: {
      kick:  Array(16).fill(false),
      snare: Array(16).fill(false),
      hat:   Array(16).fill(false),
      clap:  Array(16).fill(false),
    },
  },
];
