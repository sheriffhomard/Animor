/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { FolderOpen, Save, Trash2, X, Plus, Calendar, Layers } from 'lucide-react';
import { Project } from '../../models/Project.ts';
import {
  deleteProjectFromStorage,
  getAllProjectsFromStorage,
  saveProjectToStorage,
} from '../../core/storage/indexedDb.ts';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  onLoadProject: (project: Project) => void;
  onNewProject: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onNewProject,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const refreshList = async () => {
    try {
      const list = await getAllProjectsFromStorage();
      setProjects(list);
    } catch {
      // IndexedDB fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = async () => {
    try {
      await saveProjectToStorage(currentProject);
      setSaveStatus('Projet sauvegardé dans votre navigateur !');
      await refreshList();
      setTimeout(() => setSaveStatus(null), 2500);
    } catch {
      setSaveStatus('Erreur lors de la sauvegarde.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteProjectFromStorage(id);
      await refreshList();
    } catch {
      // handle error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Mes projets locaux (IndexedDB)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="py-4 flex items-center justify-between gap-3 border-b border-slate-800/80">
          <button
            onClick={handleSaveCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder le projet actuel</span>
          </button>

          <button
            onClick={() => {
              onNewProject();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nouveau projet</span>
          </button>
        </div>

        {saveStatus && (
          <div className="my-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium animate-in fade-in">
            {saveStatus}
          </div>
        )}

        {/* Project List */}
        <div className="py-3 flex-1 overflow-y-auto space-y-2 pr-1">
          {projects.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto opacity-30 text-indigo-400" />
              <p>Aucun projet sauvegardé pour le moment.</p>
              <p className="text-[11px] text-slate-600">
                Cliquez sur "Sauvegarder le projet actuel" pour le conserver dans votre navigateur.
              </p>
            </div>
          ) : (
            projects.map((proj) => {
              const isCurrent = proj.id === currentProject.id;
              const dateStr = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(
                'fr-FR',
                { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
              );

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onLoadProject(proj);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/50 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 group-hover:text-indigo-300 transition">
                        {proj.title || 'Sans titre'}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold">
                          Actuel
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {proj.dataset.rows.length} lignes ({proj.animation.mode})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Sauvegarde 100% locale dans votre navigateur • Aucune donnée n'est transmise à un serveur.
        </div>
      </div>
    </div>
  );
};
