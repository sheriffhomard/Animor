/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  FileCode,
  Film,
  Image as ImageIcon,
  Share2,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Project } from '../../models/Project.ts';
import { ASPECT_RATIO_DIMENSIONS } from '../../models/AnimationConfig.ts';
import { AnimationEngine } from '../../core/animation/AnimationEngine.ts';
import { SvgRenderer } from '../../core/renderer/SvgRenderer.ts';
import { RenderConfig } from '../../core/renderer/types.ts';
import { exportSvgFile } from '../../core/export/svg.ts';
import { exportPngFile } from '../../core/export/png.ts';
import { exportAndDownloadWebM, isMediaRecorderSupported } from '../../core/export/webm.ts';
import { exportStandaloneHtmlFile } from '../../core/export/standaloneHtml.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  engine: AnimationEngine;
  renderer: SvgRenderer;
  currentProgress: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  engine,
  renderer,
  currentProgress,
}) => {
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pngFrameChoice, setPngFrameChoice] = useState<'current' | 'final'>('final');

  if (!isOpen) return null;

  const resolution = ASPECT_RATIO_DIMENSIONS[project.animation.aspectRatio];
  const renderConfig: RenderConfig = {
    width: resolution.width,
    height: resolution.height,
    theme: project.theme,
    mode: project.animation.mode,
    multiSeriesMode: project.animation.multiSeriesMode,
    title: project.title,
    subtitle: project.subtitle,
    source: project.source,
    labelColumn: project.dataset.labelColumn,
    valueColumn: project.dataset.valueColumn,
    seriesColumns: project.dataset.seriesColumns,
    showTimeWatermark: project.animation.showTimeWatermark,
    showLegend: project.animation.showLegend,
    curveType: project.animation.curveType,
    showPoints: project.animation.showPoints,
    areaOpacity: project.animation.areaOpacity,
    stackedMode: project.animation.stackedMode,
    pieStyle: project.animation.pieStyle,
    donutHoleRatio: project.animation.donutHoleRatio,
    showPieLabels: project.animation.showPieLabels,
    scatterPointScale: project.animation.scatterPointScale,
    showTrendline: project.animation.showTrendline,
    comboLineSeries: project.animation.comboLineSeries,
  };

  const cleanFilename = (ext: string) => {
    const base = (project.title || 'animor-export')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    return `${base}.${ext}`;
  };

  const handleExportSvg = () => {
    const progressToUse = pngFrameChoice === 'current' ? currentProgress : 1.0;
    const state = engine.getStateAt(progressToUse);
    const svgString = renderer.renderToSvgString(state, renderConfig);
    exportSvgFile(svgString, cleanFilename('svg'));
  };

  const handleExportPng = async () => {
    const progressToUse = pngFrameChoice === 'current' ? currentProgress : 1.0;
    const state = engine.getStateAt(progressToUse);
    const svgString = renderer.renderToSvgString(state, renderConfig);
    await exportPngFile(svgString, resolution.width, resolution.height, cleanFilename('png'));
  };

  const handleExportWebM = async () => {
    setIsExportingVideo(true);
    setVideoProgress(0);
    setVideoError(null);

    try {
      await exportAndDownloadWebM(
        {
          engine,
          renderer,
          config: renderConfig,
          durationSeconds: project.animation.duration,
          fps: 30,
          onProgress: (p) => setVideoProgress(Math.round(p * 100)),
        },
        cleanFilename('webm'),
      );
      setIsExportingVideo(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setVideoError(msg);
      setIsExportingVideo(false);
    }
  };

  const handleExportHtml = () => {
    exportStandaloneHtmlFile(project, cleanFilename('html'));
  };

  const webmSupported = isMediaRecorderSupported();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Centre d'exportation Animor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1">
          {/* Frame selection for static formats */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Image statique (SVG / PNG) :</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPngFrameChoice('final')}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  pngFrameChoice === 'final'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                État final (100%)
              </button>
              <button
                onClick={() => setPngFrameChoice('current')}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  pngFrameChoice === 'current'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Frame courante ({Math.round(currentProgress * 100)}%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* SVG Export */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                  <FileCode className="w-4 h-4 text-pink-400" />
                  <span>Vecteur SVG</span>
                </div>
                <p className="text-xs text-slate-400">
                  Graphique vectoriel infini, idéal pour l'intégration web et print.
                </p>
              </div>
              <button
                onClick={handleExportSvg}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger .SVG</span>
              </button>
            </div>

            {/* PNG Export */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Image PNG (HD)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Résolution projet {resolution.width}x{resolution.height}px.
                </p>
              </div>
              <button
                onClick={handleExportPng}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger .PNG</span>
              </button>
            </div>

            {/* WebM Video Export */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 flex flex-col justify-between sm:col-span-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <Film className="w-4 h-4 text-indigo-400" />
                    <span>Vidéo WebM (Animation complète)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    30 FPS • {project.animation.duration}s
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Capture locale directe sans serveur via Canvas & MediaRecorder.
                </p>
              </div>

              {videoError && (
                <div className="my-2 p-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{videoError}</span>
                </div>
              )}

              {isExportingVideo ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enregistrement en cours...
                    </span>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-100 rounded-full"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleExportWebM}
                  disabled={!webmSupported}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition active:scale-95"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Générer la vidéo WebM</span>
                </button>
              )}
            </div>

            {/* Standalone HTML Export */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col justify-between sm:col-span-2 hover:border-slate-700 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>HTML Autonome (Expérimental V1)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Fichier HTML unique contenant vos données et le lecteur d'animation interactif, partageable sans serveur.
                </p>
              </div>
              <button
                onClick={handleExportHtml}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Télécharger HTML Autonome</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Rendu local • Aucun filigrane forcé</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
