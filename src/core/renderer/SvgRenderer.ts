/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimationState, ChartRenderer, InterpolatedItem, RenderConfig } from './types.ts';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatValue(val: number): string {
  if (Math.abs(val) >= 1000) {
    return val.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
  }
  if (Number.isInteger(val)) {
    return val.toString();
  }
  return val.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export class SvgRenderer implements ChartRenderer {
  public renderToSvgString(state: AnimationState, config: RenderConfig): string {
    const { width, height, theme, mode, title, subtitle, source, labelColumn, valueColumn } = config;
    const { items, hasNegative, zeroRatio, absMax } = state;

    // Responsive layout margins based on format
    const isPortrait = height > width;
    const paddingX = Math.round(width * 0.06);
    const paddingTop = Math.round(height * 0.12);
    const paddingBottom = Math.round(height * 0.1);

    const chartLeft = paddingX;
    const chartRight = width - paddingX;
    const chartTop = paddingTop + (subtitle ? 35 : 15);
    const chartBottom = height - paddingBottom;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    // Palette & Gradients
    const gradients = `
      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${theme.primary}"/>
        <stop offset="100%" stop-color="${theme.secondary}"/>
      </linearGradient>
      <linearGradient id="negGrad" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#ef4444"/>
        <stop offset="100%" stop-color="#f87171"/>
      </linearGradient>
      <linearGradient id="bubbleGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.primary}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${theme.secondary}" stop-opacity="0.95"/>
      </linearGradient>
      <linearGradient id="bubbleGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.secondary}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0.95"/>
      </linearGradient>
      <linearGradient id="bubbleGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${theme.primary}" stop-opacity="0.95"/>
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    `;

    // Background & subtle grid pattern
    const gridColor = theme.gridColor || 'rgba(255, 255, 255, 0.05)';
    const bgElements = `
      <rect width="${width}" height="${height}" fill="${theme.background}"/>
      <line x1="${chartLeft}" y1="${chartTop}" x2="${chartRight}" y2="${chartTop}" stroke="${gridColor}" stroke-width="1"/>
      <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="${gridColor}" stroke-width="1"/>
    `;

    // Headers & Watermark
    const titleSize = isPortrait ? 38 : 46;
    const subSize = isPortrait ? 18 : 22;
    const metaSize = isPortrait ? 15 : 18;

    const headerElements = `
      <text x="${chartLeft}" y="${paddingTop - (subtitle ? 35 : 15)}" fill="${theme.text}" font-family="${theme.fontFamily}" font-size="${titleSize}" font-weight="700" letter-spacing="-0.02em">
        ${escapeXml(title)}
      </text>
      ${
        subtitle
          ? `<text x="${chartLeft}" y="${paddingTop - 5}" fill="${theme.text}" fill-opacity="0.7" font-family="${theme.fontFamily}" font-size="${subSize}" font-weight="400">
              ${escapeXml(subtitle)}
            </text>`
          : ''
      }
      <text x="${chartLeft}" y="${height - Math.round(paddingBottom * 0.4)}" fill="${theme.text}" fill-opacity="0.5" font-family="${theme.fontFamily}" font-size="${metaSize}" font-weight="500">
        ${escapeXml(source || 'Animor')}
      </text>
      <text x="${chartRight}" y="${height - Math.round(paddingBottom * 0.4)}" text-anchor="end" fill="${theme.primary}" fill-opacity="0.8" font-family="${theme.fontFamily}" font-size="${metaSize}" font-weight="600" letter-spacing="0.05em">
        ANIMOR STUDIO
      </text>
    `;

    let chartContent = '';
    if (mode === 'bars' || mode === 'ranking') {
      chartContent = this.renderBars(state, config, {
        chartLeft,
        chartRight,
        chartTop,
        chartBottom,
        chartWidth,
        chartHeight,
        isRanking: mode === 'ranking',
      });
    } else if (mode === 'bubbles') {
      chartContent = this.renderBubbles(state, config, {
        chartLeft,
        chartRight,
        chartTop,
        chartBottom,
        chartWidth,
        chartHeight,
      });
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: ${theme.background}; font-family: ${theme.fontFamily};">
        <defs>${gradients}</defs>
        ${bgElements}
        ${headerElements}
        ${chartContent}
      </svg>
    `.trim();
  }

  private renderBars(
    state: AnimationState,
    config: RenderConfig,
    geom: {
      chartLeft: number;
      chartRight: number;
      chartTop: number;
      chartBottom: number;
      chartWidth: number;
      chartHeight: number;
      isRanking: boolean;
    },
  ): string {
    const { theme } = config;
    const { items, hasNegative, zeroRatio, absMax } = state;
    const count = Math.max(1, items.length);

    // Row layout
    const rowHeight = geom.chartHeight / count;
    const barHeight = Math.max(18, Math.min(rowHeight * 0.58, 48));
    const labelColumnWidth = Math.min(geom.chartWidth * 0.28, 280);

    const barsAreaLeft = geom.chartLeft + labelColumnWidth;
    const barsAreaWidth = geom.chartWidth - labelColumnWidth;

    // Zero baseline position
    let zeroX = barsAreaLeft;
    let posWidth = barsAreaWidth - 110; // leave room for right value label
    let negWidth = 0;

    if (hasNegative) {
      zeroX = barsAreaLeft + barsAreaWidth * zeroRatio;
      negWidth = zeroX - barsAreaLeft - 50;
      posWidth = barsAreaLeft + barsAreaWidth - zeroX - 90;
    }

    const gridLines: string[] = [];
    const gridColor = theme.gridColor || 'rgba(255, 255, 255, 0.06)';

    // Vertical zero axis line
    gridLines.push(`
      <line x1="${zeroX}" y1="${geom.chartTop}" x2="${zeroX}" y2="${geom.chartBottom}" stroke="${theme.text}" stroke-opacity="0.3" stroke-width="2"/>
    `);

    // Subtle scale markers
    const ticks = 4;
    for (let t = 1; t <= ticks; t++) {
      const frac = t / ticks;
      const tickX = zeroX + posWidth * frac;
      const tickVal = absMax * frac;
      gridLines.push(`
        <line x1="${tickX}" y1="${geom.chartTop}" x2="${tickX}" y2="${geom.chartBottom}" stroke="${gridColor}" stroke-dasharray="4 4" stroke-width="1"/>
        <text x="${tickX}" y="${geom.chartBottom + 20}" fill="${theme.text}" fill-opacity="0.4" font-size="13" text-anchor="middle">
          ${Math.round(tickVal)}
        </text>
      `);
    }

    // Render bar rows
    const barRows = items.map((item) => {
      // In ranking mode, currentRank interpolates dynamically
      const rowY = geom.chartTop + item.currentRank * rowHeight;
      const barY = rowY + (rowHeight - barHeight) / 2;
      const isNegative = item.currentValue < 0;

      let barX = zeroX;
      let barW = 0;
      let valueX = zeroX;
      let textAnchor = 'start';

      if (!isNegative) {
        barW = Math.max(0, item.barLengthRatio * posWidth);
        barX = zeroX;
        valueX = zeroX + barW + 14;
        textAnchor = 'start';
      } else {
        barW = Math.max(0, Math.abs(item.barLengthRatio) * negWidth);
        barX = zeroX - barW;
        valueX = barX - 14;
        textAnchor = 'end';
      }

      // Rank badge for Mode B
      const rankBadge = geom.isRanking
        ? `
          <rect x="${geom.chartLeft}" y="${barY + (barHeight - 28) / 2}" width="32" height="28" rx="6" fill="${item.targetRank === 0 ? theme.primary : 'rgba(255,255,255,0.08)'}"/>
          <text x="${geom.chartLeft + 16}" y="${barY + (barHeight - 28) / 2 + 19}" fill="${item.targetRank === 0 ? '#ffffff' : theme.text}" fill-opacity="${item.targetRank === 0 ? '1' : '0.7'}" font-size="13" font-weight="700" text-anchor="middle">
            #${Math.round(item.currentRank) + 1}
          </text>
        `
        : '';

      const labelIndent = geom.isRanking ? geom.chartLeft + 44 : geom.chartLeft;
      const barGrad = isNegative ? 'url(#negGrad)' : 'url(#primaryGrad)';

      return `
        <g opacity="${item.opacity}" style="transition: transform 0.05s ease;">
          ${rankBadge}
          <!-- Label -->
          <text x="${labelIndent}" y="${barY + barHeight / 2 + 5}" fill="${theme.text}" font-size="16" font-weight="600" text-anchor="start">
            ${escapeXml(item.label)}
          </text>
          
          <!-- Bar -->
          <rect x="${barX}" y="${barY}" width="${Math.max(2, barW)}" height="${barHeight}" rx="${barHeight / 4}" fill="${barGrad}"/>
          
          <!-- End-cap spark / glow -->
          ${
            barW > 6
              ? `<circle cx="${isNegative ? barX + 4 : barX + barW - 4}" cy="${barY + barHeight / 2}" r="3" fill="#ffffff" opacity="0.8"/>`
              : ''
          }

          <!-- Live Value -->
          <text x="${valueX}" y="${barY + barHeight / 2 + 5}" fill="${isNegative ? '#f87171' : theme.text}" font-size="16" font-weight="700" text-anchor="${textAnchor}">
            ${formatValue(item.currentValue)}
          </text>
        </g>
      `;
    });

    return `
      <g class="grid-layer">${gridLines.join('')}</g>
      <g class="bars-layer">${barRows.join('')}</g>
    `;
  }

  private renderBubbles(
    state: AnimationState,
    config: RenderConfig,
    geom: {
      chartLeft: number;
      chartRight: number;
      chartTop: number;
      chartBottom: number;
      chartWidth: number;
      chartHeight: number;
    },
  ): string {
    const { theme } = config;
    const { items, absMax } = state;
    const maxAllowedRadius = Math.min(geom.chartWidth, geom.chartHeight) * 0.18;
    const minRadius = 26;

    // Background circle rings for aesthetics
    const centerRing = `
      <circle cx="${geom.chartLeft + geom.chartWidth * 0.5}" cy="${geom.chartTop + geom.chartHeight * 0.5}" r="${geom.chartHeight * 0.38}" fill="none" stroke="${theme.gridColor || 'rgba(255,255,255,0.05)'}" stroke-dasharray="6 6"/>
      <circle cx="${geom.chartLeft + geom.chartWidth * 0.5}" cy="${geom.chartTop + geom.chartHeight * 0.5}" r="${geom.chartHeight * 0.22}" fill="none" stroke="${theme.gridColor || 'rgba(255,255,255,0.05)'}" stroke-dasharray="4 4"/>
    `;

    const bubbleGradients = ['url(#bubbleGrad1)', 'url(#bubbleGrad2)', 'url(#bubbleGrad3)'];

    // Render bubbles sorted ascending by size so smaller bubbles render on top if slight overlap
    const sortedForDraw = [...items].sort((a, b) => Math.abs(a.targetValue) - Math.abs(b.targetValue));

    const bubbleElements = sortedForDraw.map((item, idx) => {
      const cx = geom.chartLeft + (item.bubbleXRatio ?? 0.5) * geom.chartWidth;
      const cy = geom.chartTop + (item.bubbleYRatio ?? 0.5) * geom.chartHeight;

      // Radius scales with square root of current absolute value
      const targetR = minRadius + (maxAllowedRadius - minRadius) * item.bubbleRadiusRatio;
      const r = Math.max(4, targetR);
      const grad = bubbleGradients[idx % bubbleGradients.length];

      const fontSizeLabel = Math.max(11, Math.min(18, r * 0.28));
      const fontSizeValue = Math.max(13, Math.min(22, r * 0.36));

      return `
        <g opacity="${item.opacity}">
          <!-- Subtle Glow Halo -->
          <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="${theme.primary}" opacity="0.15" filter="url(#softGlow)"/>
          
          <!-- Outer Circle -->
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="${grad}" stroke="#ffffff" stroke-width="2" stroke-opacity="0.35"/>
          
          <!-- Gloss highlight -->
          <ellipse cx="${cx - r * 0.25}" cy="${cy - r * 0.35}" rx="${r * 0.35}" ry="${r * 0.18}" fill="#ffffff" opacity="0.25" transform="rotate(-15, ${cx - r * 0.25}, ${cy - r * 0.35})"/>

          <!-- Label inside circle -->
          <text x="${cx}" y="${cy - r * 0.08}" fill="#ffffff" font-size="${fontSizeLabel}" font-weight="600" text-anchor="middle" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
            ${escapeXml(item.label)}
          </text>
          
          <!-- Value inside circle -->
          <text x="${cx}" y="${cy + fontSizeValue * 0.85}" fill="#ffffff" font-size="${fontSizeValue}" font-weight="800" text-anchor="middle" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
            ${formatValue(item.currentValue)}
          </text>
        </g>
      `;
    });

    return `
      ${centerRing}
      <g class="bubbles-layer">${bubbleElements.join('')}</g>
    `;
  }
}
