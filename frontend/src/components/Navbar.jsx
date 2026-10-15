import React, { useState } from 'react';
import { Sparkles, Lock, Unlock, LogOut, Check, Copy, Link, Share2 } from 'lucide-react';
import { copyToClipboard, getInviteUrl } from '../utils/clipboard';

export default function Navbar({
  room,
  currentUser,
  isAdmin,
  collaborators,
  onLeave,
  onUpdateTitle,
  onOpenShare,
  onToggleLock,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(room.title);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== room.title) {
      onUpdateTitle(title.trim());
    }
  };

  const copyCode = async () => {
    const ok = await copyToClipboard(room.code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyUrl = async () => {
    const url = getInviteUrl(room.code);
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 h-16 px-4 md:px-6 flex items-center justify-between bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08] select-none">
      {/* Vlevo: Brand + Název místnosti */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold shadow-xs">
          <Sparkles size={14} className="text-amber-400" />
          <span>FreeMind</span>
        </div>

        <div className="h-4 w-[1px] bg-black/[0.1] dark:bg-white/[0.1] hidden sm:block" />

        {isEditingTitle && isAdmin ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-indigo-500 outline-none px-1"
          />
        ) : (
          <h1
            onClick={() => isAdmin && setIsEditingTitle(true)}
            className={`text-[15px] font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px] md:max-w-xs ${
              isAdmin ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''
            }`}
            title={isAdmin ? 'Kliknutím změníte název' : ''}
          >
            {room.title}
          </h1>
        )}

        {/* Tlačítko pro vlastníka: Pozastavit / Povolit úpravy pro ostatní */}
        {isAdmin ? (
          <button
            type="button"
            onClick={onToggleLock}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 shadow-xs border ${
              room.is_locked
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
            }`}
            title={
              room.is_locked
                ? 'Úpravy jsou pozastaveny. Klikněte pro povolení úprav studentům.'
                : 'Úpravy studentů jsou povoleny. Kliknutím úpravy pro ostatní pozastavíte.'
            }
          >
            {room.is_locked ? <Lock size={13} /> : <Unlock size={13} />}
            <span>{room.is_locked ? 'Úpravy pozastaveny (Zamčeno)' : 'Úpravy povoleny'}</span>
          </button>
        ) : (
          room.is_locked && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/60">
              <Lock size={12} /> Pouze pro čtení (Učitel pozastavil úpravy)
            </span>
          )
        )}
      </div>

      {/* Vpravo: Zvací kód + URL + Online studenti + Odchod */}
      <div className="flex items-center gap-2">
        {/* Zvací kód tlačítko */}
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 border border-black/[0.06] dark:border-white/[0.08] text-[12px] font-medium text-neutral-700 dark:text-neutral-300 transition-all active:scale-95"
          title="Klikněte pro zkopírování zvacího kódu"
        >
          <span className="text-neutral-400">Kód:</span>
          <span className="font-mono font-bold text-neutral-900 dark:text-white">{room.code}</span>
          {copiedCode ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} className="text-neutral-400" />}
        </button>

        {/* Kopírovat URL tlačítko */}
        <button
          type="button"
          onClick={copyUrl}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-[12px] font-medium transition-all active:scale-95"
          title="Klikněte pro zkopírování přímé webové adresy mapy"
        >
          {copiedUrl ? <Check size={13} className="text-emerald-500" /> : <Link size={13} />}
          <span>{copiedUrl ? 'URL zkopírována' : 'Kopírovat URL'}</span>
        </button>

        {/* Tlačítko pro plný dialog sdílení */}
        <button
          type="button"
          onClick={onOpenShare}
          className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          title="Zobrazit možnosti sdílení"
        >
          <Share2 size={16} />
        </button>

        {/* Seznam online spolupracovníků */}
        <div className="flex items-center -space-x-1.5 ml-1">
          {collaborators.slice(0, 5).map((collab, i) => (
            <div
              key={collab.session_id || i}
              className="relative group w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs border-2 border-white dark:border-neutral-900 uppercase"
              style={{ backgroundColor: collab.color || '#3b82f6' }}
            >
              {(collab.name || 'A')[0]}
              <div className="absolute top-9 left-1/2 -translate-x-1/2 hidden group-hover:block bg-neutral-900 text-white text-[11px] py-1 px-2 rounded-md whitespace-nowrap z-50 shadow-md">
                {collab.name}
              </div>
            </div>
          ))}
          {collaborators.length > 5 && (
            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-neutral-900">
              +{collaborators.length - 5}
            </div>
          )}
        </div>

        {/* Profil uživatele */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-50 dark:bg-neutral-800/60 border border-black/[0.05] dark:border-white/[0.06] text-[12px] text-neutral-600 dark:text-neutral-400">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentUser?.color || '#3b82f6' }}
          />
          <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[100px]">
            {currentUser?.name}
          </span>
          {isAdmin && (
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 rounded">
              Učitel
            </span>
          )}
        </div>

        {/* Opustit místnost */}
        <button
          type="button"
          onClick={onLeave}
          title="Opustit místnost"
          className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
