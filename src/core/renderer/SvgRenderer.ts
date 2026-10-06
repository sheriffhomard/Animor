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

function buildBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function buildLinearPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export class SvgRenderer implements ChartRenderer {
  private palette = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#a855f7'];

  public renderToSvgString(state: AnimationState, config: RenderConfig): string {
    const { width, height, theme, mode, title, subtitle, source, seriesColumns, showTimeWatermark, showLegend } = config;
    const { items, timeWatermark } = state;

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
      <linearGradient id="primaryGradVert" x1="0%" y1="100%" x2="0%" y2="0%">
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
        <feGaussianBlur stdDeviation="6" result="blur"/>
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
        <text x="${chartRight - 10}" y="${chartBottom - 30}" fill="${theme.text}" fill-opacity="0.08" font-family="${theme.fontFamily}" font-size="${wmSize}" font-weight="900" text-anchor="end" letter-spacing="-0.03em" pointer-events="none">
          ${escapeXml(timeWatermark)}
        </text>
      `;
    }

    // Series Legend
    let legendSvg = '';
    if (showLegend !== false && seriesColumns && seriesColumns.length > 1) {
      const legendItems = seriesColumns.slice(0, 6).map((col, i) => {
        const xOffset = chartLeft + i * 135;
        return `
          <g transform="translate(${xOffset}, ${chartTop - 18})">
            <rect width="10" height="10" rx="3" fill="${this.palette[i % this.palette.length]}"/>
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

    const geom = { chartLeft, chartRight, chartTop, chartBottom, chartWidth, chartHeight };
    let chartContent = '';

    switch (mode) {
      case 'grouped_bars':
        chartContent = this.renderGroupedBars(state, config, geom);
        break;
      case 'ranking':
        chartContent = this.renderBars(state, config, { ...geom, isRanking: true });
        break;
      case 'bubbles':
        chartContent = this.renderBubbles(state, config, geom);
        break;
      case 'lines':
        chartContent = this.renderLines(state, config, geom);
        break;
      case 'area':
        chartContent = this.renderArea(state, config, geom);
        break;
      case 'stacked_bars':
        chartContent = this.renderStackedBars(state, config, geom);
        break;
      case 'pie':
        chartContent = this.renderPie(state, config, geom);
        break;
      case 'scatter':
        chartContent = this.renderScatter(state, config, geom);
        break;
      case 'combo':
        chartContent = this.renderCombo(state, config, geom);
        break;
      case 'bars':
      default:
        if (config.multiSeriesMode === 'grouped') {
          chartContent = this.renderGroupedBars(state, config, geom);
        } else {
          chartContent = this.renderBars(state, config, { ...geom, isRanking: false });
        }
        break;
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

  /* -------------------------------------------------------------
     1. BARS & RANKING
  ------------------------------------------------------------- */
  private renderBars(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number; isRanking: boolean },
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

  /* -------------------------------------------------------------
     2. GROUPED BARS
  ------------------------------------------------------------- */
  private renderGroupedBars(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
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
      const subBarHeight = Math.max(2, (rowHeight * 0.72) / numSeries);
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

    return `<g class="grouped-bars-layer">${groupRows.join('')}</g>`;
  }

  /* -------------------------------------------------------------
     3. LINES (COURBES)
  ------------------------------------------------------------- */
  private renderLines(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
  ): string {
    const { theme, curveType = 'smooth', showPoints = true } = config;
    const { items, absMax, minValue } = state;
    const count = items.length;
    if (count === 0) return '';

    const seriesList = state.seriesColumns && state.seriesColumns.length > 1 ? state.seriesColumns : [config.valueColumn || 'Valeur'];
    const isMulti = seriesList.length > 1;

    const marginX = 40;
    const stepX = (geom.chartWidth - marginX * 2) / Math.max(1, count - 1 || 1);
    const range = Math.max(1, absMax - Math.min(0, minValue));

    const gridLines: string[] = [];
    const gridColor = theme.gridColor || 'rgba(255, 255, 255, 0.06)';

    // Vertical category grid lines & X labels
    items.forEach((item, idx) => {
      const x = geom.chartLeft + marginX + idx * stepX;
      gridLines.push(`
        <line x1="${x}" y1="${geom.chartTop}" x2="${x}" y2="${geom.chartBottom}" stroke="${gridColor}" stroke-dasharray="3 3"/>
        <text x="${x}" y="${geom.chartBottom + 24}" fill="${theme.text}" fill-opacity="0.6" font-size="12" text-anchor="middle">
          ${escapeXml(item.label)}
        </text>
      `);
    });

    // Horizontal scale lines
    for (let t = 0; t <= 4; t++) {
      const y = geom.chartBottom - (t / 4) * geom.chartHeight;
      const val = (t / 4) * absMax;
      gridLines.push(`
        <line x1="${geom.chartLeft}" y1="${y}" x2="${geom.chartRight}" y2="${y}" stroke="${gridColor}"/>
        <text x="${geom.chartLeft - 12}" y="${y + 4}" fill="${theme.text}" fill-opacity="0.4" font-size="11" text-anchor="end">
          ${Math.round(val)}
        </text>
      `);
    }

    const linesSvg: string[] = [];

    seriesList.forEach((seriesName, sIdx) => {
      const color = this.palette[sIdx % this.palette.length];
      const points = items.map((item, idx) => {
        const x = geom.chartLeft + marginX + idx * stepX;
        const val = isMulti && item.groupedSeriesValues ? (item.groupedSeriesValues[sIdx]?.value ?? 0) : item.currentValue;
        const y = geom.chartBottom - (Math.max(0, val) / range) * geom.chartHeight;
        return { x, y, val };
      });

      const pathStr = curveType === 'smooth' ? buildBezierPath(points) : buildLinearPath(points);
      const estLength = geom.chartWidth * 1.5;
      const dashOffset = estLength * (1 - Math.min(1, state.easedProgress * 1.05));

      // Main animated stroke
      linesSvg.push(`
        <path d="${pathStr}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
              stroke-dasharray="${estLength}" stroke-dashoffset="${dashOffset}" filter="url(#softGlow)"/>
        <path d="${pathStr}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
              stroke-dasharray="${estLength}" stroke-dashoffset="${dashOffset}"/>
      `);

      // Points and value labels
      if (showPoints) {
        points.forEach((p, idx) => {
          const ptProgress = Math.min(1, Math.max(0, (state.progress - (idx / count) * 0.4) / 0.4));
          const ptRadius = 5 * ptProgress;
          if (ptRadius > 1) {
            linesSvg.push(`
              <circle cx="${p.x}" cy="${p.y}" r="${ptRadius + 3}" fill="${color}" opacity="0.3"/>
              <circle cx="${p.x}" cy="${p.y}" r="${ptRadius}" fill="#ffffff" stroke="${color}" stroke-width="2"/>
              ${
                count <= 25 && state.progress > 0.6
                  ? `<text x="${p.x}" y="${p.y - 12}" fill="${theme.text}" font-size="12" font-weight="700" text-anchor="middle">
                      ${formatValue(p.val)}
                    </text>`
                  : ''
              }
            `);
          }
        });
      }
    });

    return `
      <g class="grid-layer">${gridLines.join('')}</g>
      <g class="lines-layer">${linesSvg.join('')}</g>
    `;
  }

  /* -------------------------------------------------------------
     4. AREA (AIRES)
  ------------------------------------------------------------- */
  private renderArea(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
  ): string {
    const { theme, curveType = 'smooth', areaOpacity = 0.35, showPoints = true } = config;
    const { items, absMax } = state;
    const count = items.length;
    if (count === 0) return '';

    const seriesList = state.seriesColumns && state.seriesColumns.length > 1 ? state.seriesColumns : [config.valueColumn || 'Valeur'];
    const marginX = 40;
    const stepX = (geom.chartWidth - marginX * 2) / Math.max(1, count - 1 || 1);
    const range = Math.max(1, absMax);

    const gridLines: string[] = [];
    const gridColor = theme.gridColor || 'rgba(255, 255, 255, 0.06)';

    items.forEach((item, idx) => {
      const x = geom.chartLeft + marginX + idx * stepX;
      gridLines.push(`
        <line x1="${x}" y1="${geom.chartTop}" x2="${x}" y2="${geom.chartBottom}" stroke="${gridColor}" stroke-dasharray="3 3"/>
        <text x="${x}" y="${geom.chartBottom + 24}" fill="${theme.text}" fill-opacity="0.6" font-size="12" text-anchor="middle">
          ${escapeXml(item.label)}
        </text>
      `);
    });

    const areasSvg: string[] = [];
    const clipWidth = (geom.chartWidth + 50) * state.easedProgress;
    const clipId = `areaRevealClip_${Math.round(geom.chartLeft)}`;

    seriesList.forEach((seriesName, sIdx) => {
      const color = this.palette[sIdx % this.palette.length];
      const gradId = `areaGrad_${sIdx}`;

      const points = items.map((item, idx) => {
        const x = geom.chartLeft + marginX + idx * stepX;
        const val = seriesList.length > 1 && item.groupedSeriesValues ? (item.groupedSeriesValues[sIdx]?.value ?? 0) : item.currentValue;
        const y = geom.chartBottom - (Math.max(0, val) / range) * geom.chartHeight;
        return { x, y, val };
      });

      const firstX = points[0].x;
      const lastX = points[points.length - 1].x;

      const curvePath = curveType === 'smooth' ? buildBezierPath(points) : buildLinearPath(points);
      const closedAreaPath = `${curvePath} L ${lastX} ${geom.chartBottom} L ${firstX} ${geom.chartBottom} Z`;

      areasSvg.push(`
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${color}" stop-opacity="${areaOpacity}"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
          </linearGradient>
          <clipPath id="${clipId}">
            <rect x="${geom.chartLeft}" y="${geom.chartTop - 20}" width="${clipWidth}" height="${geom.chartHeight + 50}"/>
          </clipPath>
        </defs>
        <g clip-path="url(#${clipId})">
          <path d="${closedAreaPath}" fill="url(#${gradId})"/>
          <path d="${curvePath}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
        </g>
      `);

      if (showPoints) {
        points.forEach((p) => {
          if (p.x <= geom.chartLeft + clipWidth) {
            areasSvg.push(`
              <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#ffffff" stroke="${color}" stroke-width="2"/>
            `);
          }
        });
      }
    });

    return `
      <g class="grid-layer">${gridLines.join('')}</g>
      <g class="area-layer">${areasSvg.join('')}</g>
    `;
  }

  /* -------------------------------------------------------------
     5. STACKED BARS (GRAPHIQUES EMPILÉS)
  ------------------------------------------------------------- */
  private renderStackedBars(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
  ): string {
    const { theme, stackedMode = 'absolute' } = config;
    const { items } = state;
    const count = Math.max(1, items.length);

    const seriesList = state.seriesColumns && state.seriesColumns.length > 0 ? state.seriesColumns : [config.valueColumn || 'Valeur'];
    const isPercent = stackedMode === 'percent';

    // Calculate maximum stack total across rows
    let maxStackTotal = 1;
    items.forEach((item) => {
      const rowSum = (item.groupedSeriesValues || []).reduce((acc, s) => acc + Math.max(0, s.value), 0) || Math.max(1, item.currentValue);
      if (rowSum > maxStackTotal) maxStackTotal = rowSum;
    });

    const colWidth = Math.min((geom.chartWidth / count) * 0.62, 70);
    const colStep = geom.chartWidth / count;

    const columnsSvg: string[] = [];

    items.forEach((item, colIdx) => {
      const colX = geom.chartLeft + colIdx * colStep + (colStep - colWidth) / 2;
      const seriesVals = item.groupedSeriesValues || [
        { name: config.valueColumn || 'Valeur', value: item.currentValue, barLengthRatio: item.barLengthRatio, color: theme.primary },
      ];

      const rowTotal = seriesVals.reduce((acc, s) => acc + Math.max(0, s.value), 0);
      const effectiveMax = isPercent ? 100 : maxStackTotal;

      let currentStackY = geom.chartBottom;

      const segmentRects = seriesVals.map((s, sIdx) => {
        const val = Math.max(0, s.value);
        const segmentValRatio = isPercent && rowTotal > 0 ? (val / rowTotal) * 100 : val;
        const segmentHeight = (segmentValRatio / effectiveMax) * geom.chartHeight * state.easedProgress;

        currentStackY -= segmentHeight;
        const color = this.palette[sIdx % this.palette.length];
        const isTopSegment = sIdx === seriesVals.length - 1;

        return `
          <rect x="${colX}" y="${currentStackY}" width="${colWidth}" height="${Math.max(0, segmentHeight)}" fill="${color}"
                rx="${isTopSegment ? 4 : 0}"/>
          ${
            segmentHeight > 18
              ? `<text x="${colX + colWidth / 2}" y="${currentStackY + segmentHeight / 2 + 4}" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">
                  ${isPercent ? `${Math.round(segmentValRatio)}%` : formatValue(val)}
                </text>`
              : ''
          }
        `;
      });

      // Total label on top of stacked bar
      const totalLabel = `
        <text x="${colX + colWidth / 2}" y="${currentStackY - 8}" fill="${theme.text}" font-size="12" font-weight="700" text-anchor="middle">
          ${isPercent ? '100%' : formatValue(rowTotal)}
        </text>
      `;

      // Category label at bottom
      const catLabel = `
        <text x="${colX + colWidth / 2}" y="${geom.chartBottom + 22}" fill="${theme.text}" fill-opacity="0.7" font-size="12" font-weight="600" text-anchor="middle">
          ${escapeXml(item.label)}
        </text>
      `;

      columnsSvg.push(`
        <g opacity="${item.opacity}">
          ${segmentRects.join('')}
          ${totalLabel}
          ${catLabel}
        </g>
      `);
    });

    return `<g class="stacked-bars-layer">${columnsSvg.join('')}</g>`;
  }

  /* -------------------------------------------------------------
     6. PIE & DONUT (DIAGRAMMES CIRCULAIRES ANIMÉS)
  ------------------------------------------------------------- */
  private renderPie(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
  ): string {
    const { theme, pieStyle = 'donut', donutHoleRatio = 0.55, showPieLabels = true } = config;
    const { items } = state;
    const count = items.length;
    if (count === 0) return '';

    const cx = geom.chartLeft + geom.chartWidth * 0.46;
    const cy = geom.chartTop + geom.chartHeight * 0.5;
    const R = Math.min(geom.chartWidth * 0.38, geom.chartHeight * 0.44);
    const rInner = pieStyle === 'donut' ? R * donutHoleRatio : 0;

    const totalVal = items.reduce((acc, it) => acc + Math.max(0, it.targetValue), 0) || 1;
    const sweepProgress = state.easedProgress;

    let currentAngle = -Math.PI / 2; // Start from top 12 o'clock
    const slicesSvg: string[] = [];
    const legendBadges: string[] = [];

    items.forEach((item, idx) => {
      const sliceVal = Math.max(0, item.targetValue);
      const frac = sliceVal / totalVal;
      const angleDelta = frac * 2 * Math.PI * sweepProgress;
      const endAngle = currentAngle + angleDelta;

      const x1 = cx + R * Math.cos(currentAngle);
      const y1 = cy + R * Math.sin(currentAngle);
      const x2 = cx + R * Math.cos(endAngle);
      const y2 = cy + R * Math.sin(endAngle);

      const xi1 = cx + rInner * Math.cos(currentAngle);
      const yi1 = cy + rInner * Math.sin(currentAngle);
      const xi2 = cx + rInner * Math.cos(endAngle);
      const yi2 = cy + rInner * Math.sin(endAngle);

      const largeArcFlag = angleDelta > Math.PI ? 1 : 0;
      const color = this.palette[idx % this.palette.length];

      let pathD = '';
      if (rInner > 0) {
        pathD = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${xi1} ${yi1} Z`;
      } else {
        pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      }

      slicesSvg.push(`
        <path d="${pathD}" fill="${color}" stroke="${theme.background}" stroke-width="2.5" opacity="${item.opacity}"/>
      `);

      // Legend entry on right side
      if (showPieLabels && idx < 8) {
        const legendY = geom.chartTop + 40 + idx * 32;
        const legendX = geom.chartRight - 180;
        const percentStr = `${Math.round(frac * 100)}%`;
        legendBadges.push(`
          <g opacity="${item.opacity}">
            <rect x="${legendX}" y="${legendY}" width="14" height="14" rx="3" fill="${color}"/>
            <text x="${legendX + 22}" y="${legendY + 11}" fill="${theme.text}" font-size="12" font-weight="600">
              ${escapeXml(item.label)}
            </text>
            <text x="${legendX + 160}" y="${legendY + 11}" fill="${theme.text}" fill-opacity="0.6" font-size="12" font-weight="700" text-anchor="end">
              ${percentStr}
            </text>
          </g>
        `);
      }

      currentAngle = endAngle;
    });

    // Center hole text for Donut
    let centerHole = '';
    if (pieStyle === 'donut') {
      centerHole = `
        <circle cx="${cx}" cy="${cy}" r="${rInner - 2}" fill="${theme.background}"/>
        <text x="${cx}" y="${cy - 6}" fill="${theme.text}" font-size="28" font-weight="800" text-anchor="middle">
          ${formatValue(totalVal * sweepProgress)}
        </text>
        <text x="${cx}" y="${cy + 18}" fill="${theme.text}" fill-opacity="0.5" font-size="13" font-weight="600" text-anchor="middle" letter-spacing="0.05em">
          TOTAL
        </text>
      `;
    }

    return `
      <g class="pie-layer">${slicesSvg.join('')}</g>
      ${centerHole}
      <g class="pie-legend-layer">${legendBadges.join('')}</g>
    `;
  }

  /* -------------------------------------------------------------
     7. SCATTER PLOT (NUAGES DE POINTS)
  ------------------------------------------------------------- */
  private renderScatter(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
  ): string {
    const { theme, scatterPointScale = 1, showTrendline = true } = config;
    const { items, absMax, minValue } = state;
    const count = items.length;
    if (count === 0) return '';

    const marginX = 50;
    const stepX = (geom.chartWidth - marginX * 2) / Math.max(1, count - 1 || 1);
    const range = Math.max(1, absMax - Math.min(0, minValue));

    const gridLines: string[] = [];
    const gridColor = theme.gridColor || 'rgba(255, 255, 255, 0.06)';

    for (let t = 0; t <= 4; t++) {
      const y = geom.chartBottom - (t / 4) * geom.chartHeight;
      gridLines.push(`
        <line x1="${geom.chartLeft}" y1="${y}" x2="${geom.chartRight}" y2="${y}" stroke="${gridColor}"/>
        <text x="${geom.chartLeft - 12}" y="${y + 4}" fill="${theme.text}" fill-opacity="0.4" font-size="11" text-anchor="end">
          ${Math.round((t / 4) * absMax)}
        </text>
      `);
    }

    const points = items.map((item, idx) => {
      const x = geom.chartLeft + marginX + idx * stepX;
      const y = geom.chartBottom - (Math.max(0, item.currentValue) / range) * geom.chartHeight;
      return { x, y, item, idx };
    });

    const pointsSvg = points.map((p) => {
      const popProgress = Math.min(1, Math.max(0, (state.progress - (p.idx / count) * 0.4) / 0.4));
      const radius = 8 * scatterPointScale * popProgress;
      const color = this.palette[p.idx % this.palette.length];

      return `
        <g opacity="${p.item.opacity}">
          <circle cx="${p.x}" cy="${p.y}" r="${radius + 4}" fill="${color}" opacity="0.2"/>
          <circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${color}" stroke="#ffffff" stroke-width="2"/>
          ${
            count <= 30 && state.progress > 0.5
              ? `<text x="${p.x}" y="${p.y - radius - 8}" fill="${theme.text}" font-size="11" font-weight="600" text-anchor="middle">
                  ${escapeXml(p.item.label)} (${formatValue(p.item.currentValue)})
                </text>`
              : ''
          }
        </g>
      `;
    });

    // Linear regression trendline
    let trendlineSvg = '';
    if (showTrendline && count >= 2) {
      const n = points.length;
      const sumX = points.reduce((acc, p) => acc + p.x, 0);
      const sumY = points.reduce((acc, p) => acc + p.y, 0);
      const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
      const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
      const intercept = (sumY - slope * sumX) / n;

      const startX = points[0].x;
      const endX = points[points.length - 1].x;
      const animatedEndX = startX + (endX - startX) * state.easedProgress;

      const yStart = slope * startX + intercept;
      const yEnd = slope * animatedEndX + intercept;

      trendlineSvg = `
        <line x1="${startX}" y1="${yStart}" x2="${animatedEndX}" y2="${yEnd}" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6 4" filter="url(#softGlow)"/>
        <line x1="${startX}" y1="${yStart}" x2="${animatedEndX}" y2="${yEnd}" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 4"/>
      `;
    }

    return `
      <g class="grid-layer">${gridLines.join('')}</g>
      ${trendlineSvg}
      <g class="scatter-points-layer">${pointsSvg.join('')}</g>
    `;
  }

  /* -------------------------------------------------------------
     8. COMBO CHART (BARRES + COURBE COMBINÉES)
  ------------------------------------------------------------- */
  private renderCombo(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
  ): string {
    const { theme } = config;
    const { items, absMax } = state;
    const count = Math.max(1, items.length);

    const colWidth = Math.min((geom.chartWidth / count) * 0.55, 65);
    const colStep = geom.chartWidth / count;
    const range = Math.max(1, absMax);

    const barsSvg: string[] = [];
    const linePoints: { x: number; y: number; val: number }[] = [];

    items.forEach((item, idx) => {
      const colX = geom.chartLeft + idx * colStep + (colStep - colWidth) / 2;
      const barH = (Math.max(0, item.currentValue) / range) * geom.chartHeight;
      const barY = geom.chartBottom - barH;

      barsSvg.push(`
        <g opacity="${item.opacity}">
          <rect x="${colX}" y="${barY}" width="${colWidth}" height="${barH}" rx="4" fill="url(#primaryGradVert)"/>
          <text x="${colX + colWidth / 2}" y="${geom.chartBottom + 22}" fill="${theme.text}" fill-opacity="0.7" font-size="12" font-weight="600" text-anchor="middle">
            ${escapeXml(item.label)}
          </text>
        </g>
      `);

      // Compute line point: if multiple series, use second series; else compute rolling average / trend
      let lineVal = item.currentValue;
      if (item.groupedSeriesValues && item.groupedSeriesValues.length > 1) {
        lineVal = item.groupedSeriesValues[1].value;
      }
      const lineY = geom.chartBottom - (Math.max(0, lineVal) / range) * geom.chartHeight;
      linePoints.push({ x: colX + colWidth / 2, y: lineY, val: lineVal });
    });

    // Draw overlay curve
    const pathStr = buildBezierPath(linePoints);
    const estLength = geom.chartWidth * 1.5;
    const dashOffset = estLength * (1 - state.easedProgress);

    const lineOverlay = `
      <path d="${pathStr}" fill="none" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"
            stroke-dasharray="${estLength}" stroke-dashoffset="${dashOffset}" filter="url(#softGlow)"/>
      <path d="${pathStr}" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
            stroke-dasharray="${estLength}" stroke-dashoffset="${dashOffset}"/>
      ${linePoints
        .map(
          (p) => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#ffffff" stroke="#f59e0b" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 10}" fill="#f59e0b" font-size="11" font-weight="800" text-anchor="middle">
          ${formatValue(p.val)}
        </text>
      `,
        )
        .join('')}
    `;

    return `
      <g class="combo-bars">${barsSvg.join('')}</g>
      <g class="combo-line">${lineOverlay}</g>
    `;
  }

  /* -------------------------------------------------------------
     9. BUBBLES
  ------------------------------------------------------------- */
  private renderBubbles(
    state: AnimationState,
    config: RenderConfig,
    geom: { chartLeft: number; chartRight: number; chartTop: number; chartBottom: number; chartWidth: number; chartHeight: number },
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
