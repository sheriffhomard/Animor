/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Database, Sliders, Eye } from 'lucide-react';
import { Project, createDefaultProject } from './models/Project.ts';
import { SAMPLE_DATASET } from './core/data/sampleData.ts';
import { Dataset } from './models/Dataset.ts';
import { AnimationEngine } from './core/animation/AnimationEngine.ts';
import { SvgRenderer } from './core/renderer/SvgRenderer.ts';
import { StudioHeader } from './components/layout/StudioHeader.tsx';
import { DataPanel } from './components/data/DataPanel.tsx';
import { StylePanel } from './components/style/StylePanel.tsx';
import { PreviewCanvas } from './components/preview/PreviewCanvas.tsx';
import { TimelineBar } from './components/timeline/TimelineBar.tsx';
import { ProjectsModal } from './components/modals/ProjectsModal.tsx';
import { ExportModal } from './components/modals/ExportModal.tsx';
import { PasteModal } from './components/modals/PasteModal.tsx';
import { HelpModal } from './components/modals/HelpModal.tsx';
import { OfflineIndicator } from './components/pwa/OfflineIndicator.tsx';

export default function App() {
  // Main Project State (defaulted to standard 10 European countries)
  const [project, setProject] = useState<Project>(() =>
    createDefaultProject(SAMPLE_DATASET)
  );

  // Tab selection for sidebar (Desktop / Mobile)
  const [activeTab, setActiveTab] = useState<'data' | 'style' | 'preview'>('data');

  // Animation Engine & Renderer instances
  const engine = useMemo(() => {
    return new AnimationEngine(project.dataset, project.animation);
  }, [project.dataset, project.animation]);

  const renderer = useMemo(() => {
    return new SvgRenderer();
  }, []);

  // Timeline & Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(project.animation.autoplay);
  const [progress, setProgress] = useState<number>(0);
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Modals state
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Animation Frame Loop
  const lastTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const loop = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaSec = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        const step = (deltaSec * playbackRate) / Math.max(0.1, project.animation.duration);
        setProgress((prev) => {
          const next = prev + step;
          if (next >= 1) {
            if (isLoop) {
              return 0;
            } else {
              setIsPlaying(false);
              return 1;
            }
          }
          return next;
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    },
    [isPlaying, playbackRate, project.animation.duration, isLoop]
  );

  useEffect(() => {
    lastTimeRef.current = null;
    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [loop]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        setProgress(0);
        setIsPlaying(true);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setProgress((prev) => Math.max(0, prev - 0.05));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setProgress((prev) => Math.min(1, prev + 0.05));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleTogglePlay = () => {
    if (progress >= 1) {
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleRestart = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSeek = (val: number) => {
    setProgress(val);
  };

  const handleDatasetChange = (newDataset: Dataset) => {
    setProject((prev) => ({
      ...prev,
      dataset: newDataset,
      updatedAt: Date.now(),
    }));
  };

  const handleResetSample = () => {
    setProject((prev) => ({
      ...prev,
      dataset: SAMPLE_DATASET,
      title: 'Visualisation Dynamique',
      updatedAt: Date.now(),
    }));
    setProgress(0);
    setIsPlaying(true);
  };

  const handleNewProject = () => {
    setProject(createDefaultProject(SAMPLE_DATASET));
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* 1. Header */}
      <StudioHeader
        title={project.title}
        onTitleChange={(title) => setProject((prev) => ({ ...prev, title }))}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onResetSample={handleResetSample}
        rowCount={project.dataset.rows.length}
      />

      {/* 2. Main Studio Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex border-b border-slate-800 bg-slate-950 shrink-0">
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'data'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Données</span>
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'style'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Style</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'preview'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Aperçu</span>
          </button>
        </div>

        {/* Left Sidebar (Desktop: always visible with mini tab switch | Mobile: toggleable) */}
        <aside
          className={`w-full md:w-96 lg:w-[420px] shrink-0 border-r border-slate-800 bg-slate-950/60 flex flex-col min-h-0 ${
            activeTab === 'preview' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Desktop Sub-tabs */}
          <div className="hidden md:flex p-3 pb-0 border-b border-slate-800/80 gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 pb-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition relative ${
                activeTab === 'data'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Données</span>
              {activeTab === 'data' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 pb-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition relative ${
                activeTab === 'style'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Style & Animation</span>
              {activeTab === 'style' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto min-h-0">
            {activeTab === 'data' ? (
              <DataPanel
                dataset={project.dataset}
                onDatasetChange={handleDatasetChange}
                onOpenPasteModal={() => setIsPasteOpen(true)}
              />
            ) : (
              <StylePanel project={project} onProjectChange={setProject} />
            )}
          </div>
        </aside>

        {/* Center / Right Canvas Area */}
        <main
          className={`flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-br from-[#070b14] via-[#090d16] to-[#0d1222] ${
            activeTab !== 'preview' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <PreviewCanvas
            project={project}
            engine={engine}
            renderer={renderer}
            progress={progress}
          />
        </main>
      </div>

      {/* 3. Bottom Timeline Scrubber */}
      <TimelineBar
        isPlaying={isPlaying}
        progress={progress}
        duration={project.animation.duration}
        isLoop={isLoop}
        playbackRate={playbackRate}
        onTogglePlay={handleTogglePlay}
        onRestart={handleRestart}
        onSeek={handleSeek}
        onToggleLoop={() => setIsLoop((prev) => !prev)}
        onRateChange={setPlaybackRate}
      />

      {/* 4. Modals */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        currentProject={project}
        onLoadProject={(loaded) => {
          setProject(loaded);
          setProgress(0);
          setIsPlaying(true);
        }}
        onNewProject={handleNewProject}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
        engine={engine}
        renderer={renderer}
        currentProgress={progress}
      />

      <PasteModal
        isOpen={isPasteOpen}
        onClose={() => setIsPasteOpen(false)}
        onApplyDataset={handleDatasetChange}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* 5. Offline PWA Indicator */}
      <OfflineIndicator />
    </div>
  );
}
