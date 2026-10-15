import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import {
  Plus,
  Download,
  Upload,
  Lock,
  Unlock,
  Share2,
  Maximize2,
  Trash2,
  Info
} from 'lucide-react';

export default function DockToolbar({
  onAddNode,
  onExport,
  onImport,
  onToggleLock,
  onShare,
  onFitView,
  onClear,
  isAdmin,
  isLocked,
  roomCode
}) {
  const dockRef = useRef(null);

  useEffect(() => {
    if (dockRef.current) {
      gsap.fromTo(
        dockRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, []);

  return (
    <div
      ref={dockRef}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-2 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.12)] select-none"
    >
      {/* Přidat uzel */}
      <button
        type="button"
        disabled={isLocked && !isAdmin}
        onClick={onAddNode}
        title="Přidat nový uzel"
        className="group relative flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
      >
        <Plus size={20} strokeWidth={2.2} />
        <span className="sr-only">Přidat uzel</span>
      </button>

      <div className="w-[1px] h-6 bg-black/[0.08] dark:bg-white/[0.1] mx-1" />

      {/* Vycentrovat pohled */}
      <button
        type="button"
        onClick={onFitView}
        title="Vycentrovat mapu na střed"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
      >
        <Maximize2 size={18} />
      </button>

      {/* Zvací kód / Sdílet */}
      <button
        type="button"
        onClick={onShare}
        title={`Zvací kód: ${roomCode} (Kliknutím zkopírujete)`}
        className="flex items-center gap-2 h-10 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-[13px] hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors active:scale-95 border border-indigo-200 dark:border-indigo-800/60"
      >
        <Share2 size={16} />
        <span className="font-mono tracking-wider">{roomCode}</span>
      </button>

      {/* Export JSON */}
      <button
        type="button"
        onClick={onExport}
        title="Uložit a stáhnout jako JSON"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
      >
        <Download size={18} />
      </button>

      {/* Import JSON */}
      <button
        type="button"
        onClick={onImport}
        title="Nahrát mapu z JSON souboru"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
      >
        <Upload size={18} />
      </button>

      {/* Administrátorské zámky a nástroje */}
      {isAdmin && (
        <>
          <div className="w-[1px] h-6 bg-black/[0.08] dark:bg-white/[0.1] mx-1" />

          {/* Zamknout / Odemknout */}
          <button
            type="button"
            onClick={onToggleLock}
            title={isLocked ? 'Odemknout pro studenty' : 'Zamknout mapu (pouze pro čtení)'}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors active:scale-95 ${
              isLocked
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-medium'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          </button>

          {/* Vyčistit plátno */}
          <button
            type="button"
            onClick={onClear}
            title="Vyčistit plátno"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        </>
      )}
    </div>
  );
}
