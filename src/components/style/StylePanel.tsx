/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart2,
  TrendingUp,
  CircleDot,
  Type,
  Palette,
  Clock,
  Sparkles,
  Maximize2,
  LineChart,
  AreaChart,
  Layers,
  PieChart,
  ScatterChart,
  Activity,
  Sliders,
} from 'lucide-react';
import { Project } from '../../models/Project.ts';
import {
  AspectRatio,
  ChartMode,
  EasingType,
} from '../../models/AnimationConfig.ts';
import { FONT_OPTIONS, THEME_PRESETS, Theme } from '../../models/Theme.ts';

interface StylePanelProps {
  project: Project;
  onProjectChange: (updatedProject: Project) => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({ project, onProjectChange }) => {
  const { animation, theme } = project;

  const updateAnimation = (partial: Partial<typeof animation>) => {
    onProjectChange({
      ...project,
      animation: { ...animation, ...partial },
    });
  };

  const updateTheme = (partial: Partial<Theme>) => {
    onProjectChange({
      ...project,
      theme: { ...theme, ...partial },
    });
  };

  const modes: { mode: ChartMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: 'bars', label: 'Barres', icon: BarChart2 },
    { mode: 'ranking', label: 'Classement', icon: TrendingUp },
    { mode: 'bubbles', label: 'Bulles', icon: CircleDot },
    { mode: 'lines', label: 'Courbes', icon: LineChart },
    { mode: 'area', label: 'Aires', icon: AreaChart },
    { mode: 'stacked_bars', label: 'Empilées', icon: Layers },
    { mode: 'pie', label: 'Circulaire', icon: PieChart },
    { mode: 'scatter', label: 'Nuage', icon: ScatterChart },
    { mode: 'combo', label: 'Combiné', icon: Activity },
  ];

  const aspectRatios: { ratio: AspectRatio; label: string; sub: string }[] = [
    { ratio: '16:9', label: '16:9', sub: 'Landscape' },
    { ratio: '1:1', label: '1:1', sub: 'Square' },
    { ratio: '9:16', label: '9:16', sub: 'Story / Reel' },
  ];

  const durations = [1, 2, 3, 5, 10];
  const easings: { type: EasingType; label: string }[] = [
    { type: 'linear', label: 'Linear' },
    { type: 'easeIn', label: 'Ease In' },
    { type: 'easeOut', label: 'Ease Out' },
    { type: 'easeInOut', label: 'Ease In-Out' },
  ];

  const isMulti = Boolean(
    project.dataset.isMultiSeries ||
    (project.dataset.seriesColumns && project.dataset.seriesColumns.length > 1)
  );

  const seriesList = project.dataset.seriesColumns || [project.dataset.valueColumn || 'Valeur'];

  return (
    <div className="flex flex-col h-full space-y-5 overflow-y-auto pr-1">
      {/* Multi-Series / Dimension Temporelle Badge & Selector */}
      {isMulti && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Mode Multi-Séries / Temporel
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
              {seriesList.length} colonnes
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={() => updateAnimation({ multiSeriesMode: 'time_race' })}
              className={`p-2 rounded-lg border text-center transition font-semibold text-[11px] ${
                (animation.multiSeriesMode ?? 'time_race') === 'time_race'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ⏱️ Course (Race)
            </button>
            <button
              onClick={() => updateAnimation({ multiSeriesMode: 'grouped' })}
              className={`p-2 rounded-lg border text-center transition font-semibold text-[11px] ${
                animation.multiSeriesMode === 'grouped'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📊 Groupées
            </button>
            <button
              onClick={() => updateAnimation({ multiSeriesMode: 'single' })}
              className={`p-2 rounded-lg border text-center transition font-semibold text-[11px] ${
                animation.multiSeriesMode === 'single'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🎯 Série Unique
            </button>
          </div>

          {animation.multiSeriesMode === 'single' && (
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 block mb-1">Choisir la colonne à animer :</span>
              <select
                value={animation.activeSeries || seriesList[0]}
                onChange={(e) => updateAnimation({ activeSeries: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
              >
                {seriesList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400">Afficher filigrane temporel (ex: 2024)</span>
            <input
              type="checkbox"
              checked={animation.showTimeWatermark !== false}
              onChange={(e) => updateAnimation({ showTimeWatermark: e.target.checked })}
              className="accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 1. Mode de Visualisation (9 modes) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Type de Visualisation</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map(({ mode, label, icon: Icon }) => {
            const isActive = animation.mode === mode;
            return (
              <button
                key={mode}
                onClick={() => updateAnimation({ mode })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* 1.1 Configuration Spécifique au Type Choisi */}
        {animation.mode === 'lines' && (
          <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">Règles des Courbes</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tracé :</span>
              <div className="flex gap-1">
                {(['smooth', 'linear'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateAnimation({ curveType: t })}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      (animation.curveType ?? 'smooth') === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'smooth' ? 'Lissée (Bézier)' : 'Linéaire'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="text-slate-400">Puces de données :</span>
              <input
                type="checkbox"
                checked={animation.showPoints !== false}
                onChange={(e) => updateAnimation({ showPoints: e.target.checked })}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {animation.mode === 'area' && (
          <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">Règles des Aires</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Lissage :</span>
              <div className="flex gap-1">
                {(['smooth', 'linear'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateAnimation({ curveType: t })}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      (animation.curveType ?? 'smooth') === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'smooth' ? 'Lissée' : 'Linéaire'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="text-slate-400">Opacité dégradé :</span>
              <div className="flex gap-1">
                {[0.2, 0.35, 0.5, 0.75].map((op) => (
                  <button
                    key={op}
                    onClick={() => updateAnimation({ areaOpacity: op })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      (animation.areaOpacity ?? 0.35) === op
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {Math.round(op * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {animation.mode === 'stacked_bars' && (
          <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">Règles Empilées</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mode de cumul :</span>
              <div className="flex gap-1">
                {(['absolute', 'percent'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => updateAnimation({ stackedMode: m })}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      (animation.stackedMode ?? 'absolute') === m
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m === 'absolute' ? 'Valeurs Réelles' : '100% Proportionnel'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {animation.mode === 'pie' && (
          <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">Règles Diagramme Circulaire</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Forme :</span>
              <div className="flex gap-1">
                {(['donut', 'pie'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateAnimation({ pieStyle: s })}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                      (animation.pieStyle ?? 'donut') === s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s === 'donut' ? 'Anneau (Donut)' : 'Disque Plein'}
                  </button>
                ))}
              </div>
            </div>
            {animation.pieStyle !== 'pie' && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                <span className="text-slate-400">Trou central :</span>
                <div className="flex gap-1">
                  {[0.4, 0.55, 0.7].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateAnimation({ donutHoleRatio: r })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                        (animation.donutHoleRatio ?? 0.55) === r
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {Math.round(r * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="text-slate-400">Afficher légende & pourcentages :</span>
              <input
                type="checkbox"
                checked={animation.showPieLabels !== false}
                onChange={(e) => updateAnimation({ showPieLabels: e.target.checked })}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {animation.mode === 'scatter' && (
          <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-300 block">Règles Nuage de Points</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Taille des points :</span>
              <div className="flex gap-1">
                {[0.7, 1.0, 1.4].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => updateAnimation({ scatterPointScale: scale })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                      (animation.scatterPointScale ?? 1.0) === scale
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {scale === 0.7 ? 'Petit' : scale === 1.0 ? 'Normal' : 'Grand'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
              <span className="text-slate-400">Ligne de tendance (Trendline) :</span>
              <input
                type="checkbox"
                checked={animation.showTrendline !== false}
                onChange={(e) => updateAnimation({ showTrendline: e.target.checked })}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {animation.mode === 'combo' && (
          <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-slate-300 block">Graphique Combiné</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Superposition synchronisée : colonnes verticales pour la première série et courbe de tendance animée pour la seconde série.
            </p>
          </div>
        )}
      </div>

      {/* 2. Format & Ratio */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Format du Canevas</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatios.map(({ ratio, label, sub }) => {
            const isActive = animation.aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() => updateAnimation({ aspectRatio: ratio })}
                className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-xs transition ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="font-mono text-xs">{label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Textes & Métadonnées */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>Textes & Labels</span>
        </label>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Titre</span>
            <input
              type="text"
              value={project.title}
              onChange={(e) => onProjectChange({ ...project, title: e.target.value })}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ex: Évolution Comparée"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Sous-titre (optionnel)</span>
            <input
              type="text"
              value={project.subtitle || ''}
              onChange={(e) => onProjectChange({ ...project, subtitle: e.target.value })}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ex: Analyse 2020-2024"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Source (optionnelle)</span>
            <input
              type="text"
              value={project.source || ''}
              onChange={(e) => onProjectChange({ ...project, source: e.target.value })}
              className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ex: Données Internes"
            />
          </div>
        </div>
      </div>

      {/* 4. Thèmes & Couleurs */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Palette & Style Visuel</span>
        </label>

        {/* Theme presets grid */}
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.map((preset) => {
            const isSelected = theme.name === preset.name;
            return (
              <button
                key={preset.id}
                onClick={() => updateTheme({ ...preset })}
                className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  isSelected
                    ? 'border-indigo-500 bg-slate-900 ring-1 ring-indigo-500/40'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                  }}
                />
                <span className="text-[11px] font-semibold text-slate-200 truncate">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
            Personnalisation fine des couleurs :
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-300">Primaire</span>
              <input
                type="color"
                value={theme.primary}
                onChange={(e) => updateTheme({ primary: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-300">Secondaire</span>
              <input
                type="color"
                value={theme.secondary}
                onChange={(e) => updateTheme({ secondary: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-300">Arrière-plan</span>
              <input
                type="color"
                value={theme.background}
                onChange={(e) => updateTheme({ background: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-300">Texte</span>
              <input
                type="color"
                value={theme.text}
                onChange={(e) => updateTheme({ text: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>
        </div>

        {/* Police */}
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Typographie</span>
          <select
            value={theme.fontFamily}
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Paramètres d'Animation */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Configuration Animation</span>
        </label>

        {/* Durée */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Durée</span>
            <span className="text-slate-200 font-semibold font-mono">{animation.duration}s</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => updateAnimation({ duration: d })}
                className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                  animation.duration === d
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Easing */}
        <div>
          <span className="text-[11px] text-slate-400 font-medium block mb-1">Courbe d'atténuation (Easing)</span>
          <div className="grid grid-cols-2 gap-1.5">
            {easings.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => updateAnimation({ easing: type })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold text-center transition ${
                  animation.easing === type
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 border'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Limite configurable d'éléments animés */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Éléments affichés dans l'animation</span>
            <span className="text-slate-200 font-semibold font-mono">
              {(animation.maxVisibleItems ?? 15) === 0 ? 'Tous' : `Top ${animation.maxVisibleItems ?? 15}`}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[10, 15, 20, 30, 50, 100, 0].map((lim) => (
              <button
                key={lim}
                onClick={() => updateAnimation({ maxVisibleItems: lim })}
                className={`py-1 rounded text-[10px] font-mono font-semibold transition ${
                  (animation.maxVisibleItems ?? 15) === lim
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {lim === 0 ? 'Tous' : lim}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
