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
    const { width, height, theme, mode, title, subtitle, source, seriesColumns, showTimeWatermark, showLegend } = config;
    const { items, hasNegative, zeroRatio, absMax, timeWatermark } = state;

    const isPortrait = height > width;
    const paddingX = Math.round(width * 0.06);
    const paddingTop = Math.round(height * 0.13);
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

    // Background & subtle grid
    const gridColor = theme.gridColor || 'rgba(255, 255, 255, 0.05)';
    const bgElements = `
      <rect width="${width}" height="${height}" fill="${theme.background}"/>
      <line x1="${chartLeft}" y1="${chartTop}" x2="${chartRight}" y2="${chartTop}" stroke="${gridColor}" stroke-width="1"/>
      <line x1="${chartLeft}" y1="${chartBottom}" x2="${chartRight}" y2="${chartBottom}" stroke="${gridColor}" stroke-width="1"/>
    `;

    // Large Animated Time Watermark (e.g. "2024", "T3")
    let timeWatermarkSvg = '';
    if (timeWatermark && showTimeWatermark !== false) {
      const wmSize = isPortrait ? 90 : 140;
      timeWatermarkSvg = `
        <text x="${chartRight - 10}" y="${chartBottom - 30}" fill="${theme.text}" fill-opacity="0.10" font-family="${theme.fontFamily}" font-size="${wmSize}" font-weight="900" text-anchor="end" letter-spacing="-0.03em" pointer-events="none">
          ${escapeXml(timeWatermark)}
        </text>
      `;
    }

    // Series Legend (if multi-series grouped or active)
    let legendSvg = '';
    if (showLegend !== false && seriesColumns && seriesColumns.length > 1) {
      const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
      const legendItems = seriesColumns.slice(0, 6).map((col, i) => {
        const xOffset = chartLeft + i * 130;
        return `
          <g transform="translate(${xOffset}, ${chartTop - 18})">
            <rect width="10" height="10" rx="3" fill="${colors[i % colors.length]}"/>
            <text x="15" y="9" fill="${theme.text}" fill-opacity="0.8" font-size="11" font-weight="500">${escapeXml(col)}</text>
          </g>
        `;
      });
      legendSvg = `<g class="legend-layer">${legendItems.join('')}</g>`;
    }

    // Headers & Watermark
    const titleSize = isPortrait ? 38 : 46;
    const subSize = isPortrait ? 18 : 22;
    const metaSize = isPortrait ? 15 : 18;

    const countLabel = items.length > 0 ? ` (${items.length} éléments)` : '';

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
        ${escapeXml(source || 'Animor')}${countLabel}
      </text>
      <text x="${chartRight}" y="${height - Math.round(paddingBottom * 0.4)}" text-anchor="end" fill="${theme.primary}" fill-opacity="0.8" font-family="${theme.fontFamily}" font-size="${metaSize}" font-weight="600" letter-spacing="0.05em">
        ANIMOR STUDIO
      </text>
    `;

    let chartContent = '';
    const isGrouped = mode === 'grouped_bars' || config.multiSeriesMode === 'grouped';

    if (isGrouped) {
      chartContent = this.renderGroupedBars(state, config, {
        chartLeft,
        chartRight,
        chartTop,
        chartBottom,
        chartWidth,
        chartHeight,
      });
    } else if (mode === 'bars' || mode === 'ranking') {
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
        ${timeWatermarkSvg}
        ${headerElements}
        ${legendSvg}
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

    const rowHeight = geom.chartHeight / count;
    const barHeight = Math.max(2.5, Math.min(rowHeight * 0.68, 48));
    const fontSize = Math.max(7, Math.min(16, rowHeight * 0.45));
    const valueFontSize = Math.max(7, Math.min(16, rowHeight * 0.45));

    const badgeHeight = Math.max(10, Math.min(28, rowHeight * 0.72));
    const badgeWidth = Math.max(16, Math.min(34, rowHeight * 0.85));
    const badgeFontSize = Math.max(6, Math.min(13, badgeHeight * 0.55));

    const labelColumnWidth = Math.min(geom.chartWidth * 0.28, count > 30 ? 200 : 280);

    const barsAreaLeft = geom.chartLeft + labelColumnWidth;
    const barsAreaWidth = geom.chartWidth - labelColumnWidth;

    let zeroX = barsAreaLeft;
    let posWidth = barsAreaWidth - (count > 50 ? 60 : 110);
    let negWidth = 0;

    if (hasNegative) {
      zeroX = barsAreaLeft + barsAreaWidth * zeroRatio;
      negWidth = zeroX - barsAreaLeft - 40;
      posWidth = barsAreaLeft + barsAreaWidth - zeroX - (count > 50 ? 50 : 90);
    }

    const gridLines: string[] = [];
    const gridColor = theme.gridColor || 'rgba(255, 255, 255, 0.06)';

    gridLines.push(`
      <line x1="${zeroX}" y1="${geom.chartTop}" x2="${zeroX}" y2="${geom.chartBottom}" stroke="${theme.text}" stroke-opacity="0.3" stroke-width="2"/>
    `);

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

    const showSparks = barHeight >= 9;
    const showValues = count <= 65;

    const barRows = items.map((item) => {
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
        valueX = zeroX + barW + (count > 40 ? 6 : 14);
        textAnchor = 'start';
      } else {
        barW = Math.max(0, Math.abs(item.barLengthRatio) * negWidth);
        barX = zeroX - barW;
        valueX = barX - (count > 40 ? 6 : 14);
        textAnchor = 'end';
      }

      const rankBadge = geom.isRanking
        ? `
          <rect x="${geom.chartLeft}" y="${barY + (barHeight - badgeHeight) / 2}" width="${badgeWidth}" height="${badgeHeight}" rx="${Math.min(6, badgeHeight / 3)}" fill="${item.targetRank === 0 ? theme.primary : 'rgba(255,255,255,0.08)'}"/>
          <text x="${geom.chartLeft + badgeWidth / 2}" y="${barY + barHeight / 2 + badgeFontSize * 0.35}" fill="${item.targetRank === 0 ? '#ffffff' : theme.text}" fill-opacity="${item.targetRank === 0 ? '1' : '0.7'}" font-size="${badgeFontSize}" font-weight="700" text-anchor="middle">
            #${Math.round(item.currentRank) + 1}
          </text>
        `
        : '';

      const labelIndent = geom.isRanking ? geom.chartLeft + badgeWidth + 8 : geom.chartLeft;
      const barGrad = isNegative ? 'url(#negGrad)' : 'url(#primaryGrad)';

      const labelText = count <= 80 ? `
        <text x="${labelIndent}" y="${barY + barHeight / 2 + fontSize * 0.35}" fill="${theme.text}" font-size="${fontSize}" font-weight="600" text-anchor="start">
          ${escapeXml(item.label)}
        </text>
      ` : '';

      const valueText = showValues ? `
        <text x="${valueX}" y="${barY + barHeight / 2 + valueFontSize * 0.35}" fill="${isNegative ? '#f87171' : theme.text}" font-size="${valueFontSize}" font-weight="700" text-anchor="${textAnchor}">
          ${formatValue(item.currentValue)}
        </text>
      ` : '';

      return `
        <g opacity="${item.opacity}">
          ${rankBadge}
          ${labelText}
          <rect x="${barX}" y="${barY}" width="${Math.max(1.5, barW)}" height="${barHeight}" rx="${Math.min(8, barHeight / 3)}" fill="${barGrad}"/>
          ${
            showSparks && barW > 6
              ? `<circle cx="${isNegative ? barX + 3 : barX + barW - 3}" cy="${barY + barHeight / 2}" r="${Math.min(3, barHeight / 4)}" fill="#ffffff" opacity="0.8"/>`
              : ''
          }
          ${valueText}
        </g>
      `;
    });

    return `
      <g class="grid-layer">${gridLines.join('')}</g>
      <g class="bars-layer">${barRows.join('')}</g>
    `;
  }

  private renderGroupedBars(
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
    const count = Math.max(1, items.length);

    const rowHeight = geom.chartHeight / count;
    const labelColumnWidth = Math.min(geom.chartWidth * 0.25, 240);
    const barsAreaLeft = geom.chartLeft + labelColumnWidth;
    const barsAreaWidth = geom.chartWidth - labelColumnWidth - 60;

    const groupRows = items.map((item, rowIdx) => {
      const rowY = geom.chartTop + rowIdx * rowHeight;
      const seriesList = item.groupedSeriesValues || [];
      const numSeries = Math.max(1, seriesList.length);
      const subBarHeight = Math.max(2, (rowHeight * 0.7) / numSeries);
      const groupTop = rowY + (rowHeight - subBarHeight * numSeries) / 2;

      const subBars = seriesList.map((s, sIdx) => {
        const barY = groupTop + sIdx * subBarHeight;
        const barW = Math.max(2, (Math.abs(s.value) / absMax) * barsAreaWidth);
        return `
          <rect x="${barsAreaLeft}" y="${barY}" width="${barW}" height="${subBarHeight - 1}" rx="2" fill="${s.color}"/>
        `;
      });

      return `
        <g opacity="${item.opacity}">
          <text x="${geom.chartLeft}" y="${rowY + rowHeight / 2 + 5}" fill="${theme.text}" font-size="${Math.max(8, Math.min(14, rowHeight * 0.35))}" font-weight="600">
            ${escapeXml(item.label)}
          </text>
          ${subBars.join('')}
        </g>
      `;
    });

    return `
      <g class="grouped-bars-layer">${groupRows.join('')}</g>
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
    const { items } = state;
    const count = Math.max(1, items.length);

    const densityFactor = Math.sqrt(15 / Math.max(15, count));
    const maxAllowedRadius = Math.min(geom.chartWidth, geom.chartHeight) * 0.18 * densityFactor;
    const minRadius = Math.max(3, 24 * densityFactor);

    const centerRing = `
      <circle cx="${geom.chartLeft + geom.chartWidth * 0.5}" cy="${geom.chartTop + geom.chartHeight * 0.5}" r="${geom.chartHeight * 0.38}" fill="none" stroke="${theme.gridColor || 'rgba(255,255,255,0.05)'}" stroke-dasharray="6 6"/>
      <circle cx="${geom.chartLeft + geom.chartWidth * 0.5}" cy="${geom.chartTop + geom.chartHeight * 0.5}" r="${geom.chartHeight * 0.22}" fill="none" stroke="${theme.gridColor || 'rgba(255,255,255,0.05)'}" stroke-dasharray="4 4"/>
    `;

    const bubbleGradients = ['url(#bubbleGrad1)', 'url(#bubbleGrad2)', 'url(#bubbleGrad3)'];
    const sortedForDraw = [...items].sort((a, b) => Math.abs(a.targetValue) - Math.abs(b.targetValue));

    const bubbleElements = sortedForDraw.map((item, idx) => {
      const cx = geom.chartLeft + (item.bubbleXRatio ?? 0.5) * geom.chartWidth;
      const cy = geom.chartTop + (item.bubbleYRatio ?? 0.5) * geom.chartHeight;

      const targetR = minRadius + (maxAllowedRadius - minRadius) * item.bubbleRadiusRatio;
      const r = Math.max(2.5, targetR);
      const grad = bubbleGradients[idx % bubbleGradients.length];

      const fontSizeLabel = Math.max(7, Math.min(16, r * 0.28));
      const fontSizeValue = Math.max(8, Math.min(20, r * 0.36));
      const showText = r >= 14 && count <= 80;

      return `
        <g opacity="${item.opacity}">
          <circle cx="${cx}" cy="${cy}" r="${r + (r > 15 ? 4 : 1)}" fill="${theme.primary}" opacity="0.12"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="${grad}" stroke="#ffffff" stroke-width="${r > 15 ? 2 : 1}" stroke-opacity="0.35"/>
          ${
            r >= 12
              ? `<ellipse cx="${cx - r * 0.25}" cy="${cy - r * 0.35}" rx="${r * 0.35}" ry="${r * 0.18}" fill="#ffffff" opacity="0.25" transform="rotate(-15, ${cx - r * 0.25}, ${cy - r * 0.35})"/>`
              : ''
          }
          ${
            showText
              ? `
              <text x="${cx}" y="${cy - r * 0.08}" fill="#ffffff" font-size="${fontSizeLabel}" font-weight="600" text-anchor="middle" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
                ${escapeXml(item.label)}
              </text>
              <text x="${cx}" y="${cy + fontSizeValue * 0.85}" fill="#ffffff" font-size="${fontSizeValue}" font-weight="800" text-anchor="middle" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
                ${formatValue(item.currentValue)}
              </text>
            `
              : ''
          }
        </g>
      `;
    });

    return `
      ${centerRing}
      <g class="bubbles-layer">${bubbleElements.join('')}</g>
    `;
  }
}
