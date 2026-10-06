/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project } from '../../models/Project.ts';
import { downloadBlob } from './svg.ts';

export function generateStandaloneHtml(project: Project): string {
  const jsonProject = JSON.stringify(project);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title.replace(/"/g, '&quot;')} — Animor Player</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: ${project.theme.fontFamily};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .container {
      width: 100%;
      max-width: 1080px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .stage {
      width: 100%;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      background: ${project.theme.background};
      position: relative;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.75rem 1.25rem;
      border-radius: 9999px;
      backdrop-filter: blur(8px);
    }
    button {
      background: ${project.theme.primary};
      color: white;
      border: none;
      padding: 0.5rem 1.2rem;
      border-radius: 9999px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: filter 0.2s;
    }
    button:hover { filter: brightness(1.15); }
    input[type=range] {
      flex: 1;
      accent-color: ${project.theme.primary};
      cursor: pointer;
    }
    .time-label {
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
      color: #94a3b8;
      min-width: 5rem;
      text-align: right;
    }
    .branding {
      text-align: center;
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="stage" id="stage"></div>
    <div class="controls">
      <button id="playBtn">▶ Lecture</button>
      <button id="restartBtn" style="background: rgba(255,255,255,0.1);">↺ Rejouer</button>
      <input type="range" id="timeline" min="0" max="1" step="0.001" value="0">
      <span class="time-label" id="timeLabel">0.0s / ${project.animation.duration.toFixed(1)}s</span>
    </div>
    <div class="branding">Généré avec Animor — Studio de visualisation de données local-first</div>
  </div>

  <script>
    (function() {
      const project = ${jsonProject};
      const stage = document.getElementById('stage');
      const playBtn = document.getElementById('playBtn');
      const restartBtn = document.getElementById('restartBtn');
      const timeline = document.getElementById('timeline');
      const timeLabel = document.getElementById('timeLabel');

      const duration = project.animation.duration;
      let isPlaying = project.animation.autoplay;
      let progress = 0;
      let lastTime = null;

      function easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function escapeXml(unsafe) {
        return (unsafe || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
      }

      function formatValue(val) {
        return Number.isInteger(val) ? val.toString() : val.toFixed(1);
      }

      function render(p) {
        const eased = easeInOut(p);
        const mode = project.animation.mode || 'bars';
        const rows = project.dataset.rows;
        const absMax = Math.max(1, ...rows.map(r => Math.abs(r.value)));
        const width = 1920, height = 1080;
        const left = 120, right = 1800, top = 200, bottom = 950;
        const chartW = right - left;
        const chartH = bottom - top;
        const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

        let content = '';

        if (mode === 'lines' || mode === 'area') {
          const stepX = chartW / Math.max(1, rows.length - 1 || 1);
          const pts = rows.map((r, i) => ({
            x: left + i * stepX,
            y: bottom - (Math.max(0, r.value * eased) / absMax) * chartH
          }));
          const pathD = pts.map((pt, i) => (i === 0 ? 'M' : 'L') + ' ' + pt.x + ' ' + pt.y).join(' ');
          
          if (mode === 'area') {
            const areaD = pathD + ' L ' + pts[pts.length-1].x + ' ' + bottom + ' L ' + pts[0].x + ' ' + bottom + ' Z';
            content += '<path d="' + areaD + '" fill="' + project.theme.primary + '" fill-opacity="0.3"/>';
          }
          content += '<path d="' + pathD + '" fill="none" stroke="' + project.theme.primary + '" stroke-width="4"/>';
          pts.forEach((pt, i) => {
            content += '<circle cx="' + pt.x + '" cy="' + pt.y + '" r="5" fill="#fff" stroke="' + project.theme.primary + '" stroke-width="2"/>';
            content += '<text x="' + pt.x + '" y="' + (bottom + 25) + '" fill="' + project.theme.text + '" font-size="12" text-anchor="middle">' + escapeXml(rows[i].label) + '</text>';
          });
        } else if (mode === 'pie') {
          const cx = left + chartW / 2;
          const cy = top + chartH / 2;
          const R = Math.min(chartW, chartH) * 0.38;
          const total = rows.reduce((acc, r) => acc + Math.max(0, r.value), 0) || 1;
          let angle = -Math.PI / 2;
          rows.forEach((r, idx) => {
            const delta = (Math.max(0, r.value) / total) * 2 * Math.PI * eased;
            const endA = angle + delta;
            const x1 = cx + R * Math.cos(angle);
            const y1 = cy + R * Math.sin(angle);
            const x2 = cx + R * Math.cos(endA);
            const y2 = cy + R * Math.sin(endA);
            const large = delta > Math.PI ? 1 : 0;
            const d = 'M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 + ' A ' + R + ' ' + R + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' Z';
            content += '<path d="' + d + '" fill="' + colors[idx % colors.length] + '" stroke="' + project.theme.background + '" stroke-width="2"/>';
            angle = endA;
          });
        } else {
          // Default Bars
          const rowH = chartH / Math.max(1, rows.length);
          const barH = Math.min(rowH * 0.58, 48);
          rows.forEach((r, idx) => {
            const val = r.value * eased;
            const barW = Math.max(2, (Math.abs(val) / absMax) * (chartW - 320));
            const y = top + idx * rowH + (rowH - barH)/2;
            const barX = left + 280;
            content += \`
              <g opacity="\${Math.min(1, p * 2.5)}">
                <text x="\${left}" y="\${y + barH/2 + 6}" fill="\${project.theme.text}" font-size="18" font-weight="600">\${escapeXml(r.label)}</text>
                <rect x="\${barX}" y="\${y}" width="\${barW}" height="\${barH}" rx="8" fill="\${project.theme.primary}"/>
                <text x="\${barX + barW + 16}" y="\${y + barH/2 + 6}" fill="\${project.theme.text}" font-size="18" font-weight="700">\${formatValue(val)}</text>
              </g>
            \`;
          });
        }

        stage.innerHTML = \`
          <svg viewBox="0 0 \${width} \${height}" style="background:\${project.theme.background}; font-family:\${project.theme.fontFamily}">
            <rect width="\${width}" height="\${height}" fill="\${project.theme.background}"/>
            <text x="\${left}" y="110" fill="\${project.theme.text}" font-size="46" font-weight="800">\${escapeXml(project.title)}</text>
            \${project.subtitle ? \`<text x="\${left}" y="150" fill="\${project.theme.text}" opacity="0.7" font-size="22">\${escapeXml(project.subtitle)}</text>\` : ''}
            <text x="\${left}" y="1020" fill="\${project.theme.text}" opacity="0.5" font-size="16">\${escapeXml(project.source || '')}</text>
            \${content}
          </svg>
        \`;
      }

      function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        if (isPlaying) {
          progress += delta / duration;
          if (progress >= 1) {
            progress = 1;
            isPlaying = false;
            playBtn.textContent = '▶ Lecture';
          }
          timeline.value = progress;
          timeLabel.textContent = (progress * duration).toFixed(1) + 's / ' + duration.toFixed(1) + 's';
          render(progress);
        }

        requestAnimationFrame(loop);
      }

      playBtn.addEventListener('click', () => {
        if (progress >= 1) progress = 0;
        isPlaying = !isPlaying;
        playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Lecture';
      });

      restartBtn.addEventListener('click', () => {
        progress = 0;
        isPlaying = true;
        playBtn.textContent = '⏸ Pause';
      });

      timeline.addEventListener('input', (e) => {
        progress = parseFloat(e.target.value);
        timeLabel.textContent = (progress * duration).toFixed(1) + 's / ' + duration.toFixed(1) + 's';
        render(progress);
      });

      render(progress);
      requestAnimationFrame(loop);
    })();
  </script>
</body>
</html>`;
}

export function exportStandaloneHtmlFile(project: Project, filename = 'animor-animation.html') {
  const html = generateStandaloneHtml(project);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  downloadBlob(blob, filename);
}
