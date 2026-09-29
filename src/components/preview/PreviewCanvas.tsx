/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AspectRatio, ASPECT_RATIO_DIMENSIONS } from '../../models/AnimationConfig.ts';
import { SvgRenderer } from '../../core/renderer/SvgRenderer.ts';
import { AnimationEngine } from '../../core/animation/AnimationEngine.ts';
import { Project } from '../../models/Project.ts';
import { RenderConfig } from '../../core/renderer/types.ts';

interface PreviewCanvasProps {
  project: Project;
  engine: AnimationEngine;
  renderer: SvgRenderer;
  progress: number;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  project,
  engine,
  renderer,
  progress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const resolution = ASPECT_RATIO_DIMENSIONS[project.animation.aspectRatio];

  // Direct fast DOM update without triggering React subtree re-renders
  useEffect(() => {
    if (!stageRef.current) return;

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
    };

    const state = engine.getStateAt(progress);
    const svgString = renderer.renderToSvgString(state, renderConfig);
    stageRef.current.innerHTML = svgString;
  }, [project, engine, renderer, progress, resolution]);

  const getAspectClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-video max-h-[82vh]';
      case '1:1':
        return 'aspect-square max-h-[75vh]';
      case '9:16':
        return 'aspect-[9/16] max-h-[82vh]';
      default:
        return 'aspect-video';
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden relative"
    >
      {/* Studio Viewport Wrapper */}
      <div
        className={`w-full max-w-full relative rounded-2xl shadow-2xl overflow-hidden border border-slate-800/80 transition-all duration-300 flex items-center justify-center bg-slate-950 ${getAspectClass(
          project.animation.aspectRatio,
        )}`}
        style={{
          boxShadow: `0 25px 60px -15px ${project.theme.primary}25, 0 10px 20px -10px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Render container */}
        <div
          ref={stageRef}
          className="w-full h-full flex items-center justify-center pointer-events-none select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
        />

        {/* Floating Format / Status Pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] text-slate-300 font-mono shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{project.animation.aspectRatio}</span>
          <span className="text-slate-500">|</span>
          <span>{resolution.width}x{resolution.height}</span>
        </div>
      </div>
    </div>
  );
};
