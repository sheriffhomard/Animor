/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { downloadBlob } from './svg.ts';

export async function svgToPngBlob(svgString: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Impossible d’initialiser le contexte 2D du Canvas.'));
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('La conversion du Canvas en PNG a échoué.'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Erreur lors du chargement de l'image SVG : ${err}`));
    };

    img.src = url;
  });
}

export async function exportPngFile(
  svgString: string,
  width: number,
  height: number,
  filename = 'animor-chart.png',
): Promise<void> {
  const blob = await svgToPngBlob(svgString, width, height);
  downloadBlob(blob, filename);
}
