/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Gauge,
} from 'lucide-react';

interface TimelineBarProps {
  isPlaying: boolean;
  progress: number;
  duration: number;
  isLoop: boolean;
  playbackRate: number;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSeek: (progress: number) => void;
  onToggleLoop: () => void;
  onRateChange: (rate: number) => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  isPlaying,
  progress,
  duration,
  isLoop,
  playbackRate,
  onTogglePlay,
  onRestart,
  onSeek,
  onToggleLoop,
  onRateChange,
}) => {
  const currentTime = (progress * duration).toFixed(1);
  const totalTime = duration.toFixed(1);

  const rates = [0.5, 1, 1.5, 2];

  return (
    <div className="h-16 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Left controls: Play, Restart, Loop */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition active:scale-95"
          title={isPlaying ? 'Pause (Espace)' : 'Lecture (Espace)'}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        <button
          onClick={onRestart}
          className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition"
          title="Recommencer depuis le début (R)"
          aria-label="Recommencer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleLoop}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
            isLoop
              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title={isLoop ? 'Boucle active' : 'Activer la boucle'}
          aria-label="Boucle"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Scrubber & Progress */}
      <div className="flex-1 max-w-3xl flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 min-w-[3.2rem] text-right">
          {currentTime}s
        </span>

        {/* Custom Range Slider */}
        <div className="relative flex-1 flex items-center group py-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none"
            aria-label="Curseur temporel de l'animation"
          />
        </div>

        <span className="text-xs font-mono text-slate-500 min-w-[3.2rem]">
          {totalTime}s
        </span>
      </div>

      {/* Right controls: Playback Speed */}
      <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded-xl">
        <Gauge className="w-3.5 h-3.5 text-slate-500" />
        <div className="flex items-center gap-1">
          {rates.map((r) => (
            <button
              key={r}
              onClick={() => onRateChange(r)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                playbackRate === r
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
