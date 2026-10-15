import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Copy, Check, X, Link, KeyRound } from 'lucide-react';
import { copyToClipboard, getInviteUrl } from '../utils/clipboard';

export default function ShareModal({ code, roomTitle, onClose }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const modalRef = useRef(null);

  const inviteUrl = getInviteUrl(code);

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
      );
    }
  }, []);

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(inviteUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
            Sdílet mapu se studenty
          </span>

          <h3 className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">
            {roomTitle}
          </h3>

          <p className="mt-1 text-xs text-neutral-500">
            Studenti se mohou připojit přes zvací kód nebo přímý odkaz:
          </p>

          {/* 1. Zvací kód */}
          <div
            onClick={handleCopyCode}
            className="my-5 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-indigo-400 dark:border-indigo-600/60 cursor-pointer hover:bg-neutral-200/60 transition-colors group relative"
            title="Klikněte pro zkopírování kódu"
          >
            <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">
              {code}
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">
              {copiedCode ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Kód zkopírován do schránky!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Kliknutím zkopírovat kód</span>
                </>
              )}
            </div>
          </div>

          {/* 2. Přímý odkaz */}
          <div className="mt-4 text-left">
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Přímý odkaz (URL) pro studenty:
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/[0.08] dark:border-white/[0.08]">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-transparent px-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-all active:scale-95 shadow-xs"
              >
                {copiedLink ? <Check size={13} /> : <Link size={13} />}
                <span>{copiedLink ? 'Zkopírováno' : 'Kopírovat URL'}</span>
              </button>
            </div>
          </div>

          {/* Tlačítka pro rychlé zkopírování */}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all"
            >
              <KeyRound size={14} />
              <span>{copiedCode ? 'Kód zkopírován' : 'Zkopírovat kód'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              <Link size={14} />
              <span>{copiedLink ? 'URL zkopírována' : 'Zkopírovat URL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
