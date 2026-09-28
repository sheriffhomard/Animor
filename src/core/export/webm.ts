/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimationEngine } from '../animation/AnimationEngine.ts';
import { SvgRenderer } from '../renderer/SvgRenderer.ts';
import { RenderConfig } from '../renderer/types.ts';
import { downloadBlob } from './svg.ts';

export interface WebMExportOptions {
  engine: AnimationEngine;
  renderer: SvgRenderer;
  config: RenderConfig;
  durationSeconds: number;
  fps?: number;
  onProgress?: (progress: number) => void;
}

export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    typeof window.MediaRecorder === 'function'
  );
}

export function getSupportedVideoMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'video/webm';
}

/**
 * Exports the animation to WebM by rendering SVG frames to Canvas and capturing via MediaRecorder.
 */
export async function exportWebMVideo(options: WebMExportOptions): Promise<Blob> {
  const { engine, renderer, config, durationSeconds, fps = 30, onProgress } = options;

  if (!isMediaRecorderSupported()) {
    throw new Error(
      'L\'export vidéo WebM n\'est pas supporté par votre navigateur (MediaRecorder ou canvas.captureStream indisponible).'
    );
  }

  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Impossible d\'obtenir le contexte 2D pour l\'enregistrement vidéo.');
  }

  const mimeType = getSupportedVideoMimeType();
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6000000, // 6 Mbps for high fidelity
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const totalFrames = Math.max(30, Math.round(durationSeconds * fps));
  const frameIntervalMs = 1000 / fps;

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    recorder.onerror = (err) => {
      reject(new Error(`Erreur lors de l'enregistrement vidéo : ${err}`));
    };

    recorder.start(100);

    let frame = 0;

    const renderNextFrame = () => {
      if (frame > totalFrames) {
        recorder.stop();
        return;
      }

      const progress = frame / totalFrames;
      if (onProgress) {
        onProgress(progress);
      }

      const state = engine.getStateAt(progress);
      const svgString = renderer.renderToSvgString(state, config);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        ctx.clearRect(0, 0, config.width, config.height);
        ctx.drawImage(img, 0, 0, config.width, config.height);
        URL.revokeObjectURL(url);
        frame++;
        setTimeout(renderNextFrame, frameIntervalMs / 2); // fast capture
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        frame++;
        setTimeout(renderNextFrame, frameIntervalMs / 2);
      };

      img.src = url;
    };

    // Begin recording loop
    renderNextFrame();
  });
}

export async function exportAndDownloadWebM(options: WebMExportOptions, filename = 'animor-video.webm') {
  const blob = await exportWebMVideo(options);
  downloadBlob(blob, filename);
}
