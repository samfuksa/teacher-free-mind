import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { Sparkles, ArrowRight, Upload, Plus, Users, ShieldCheck } from 'lucide-react';
import DecryptedText from './reactbits/DecryptedText';
import ShinyText from './reactbits/ShinyText';
import DotPattern from './reactbits/DotPattern';

export default function LobbyModal({
  onCreateRoom,
  onJoinRoom,
  onImportRoom,
  initialCode = ''
}) {
  const [tab, setTab] = useState(initialCode ? 'join' : 'create'); // 'create' | 'join' | 'import'
  const [teacherName, setTeacherName] = useState('Učitel');
  const [roomTitle, setRoomTitle] = useState('Myšlenková mapa hodiny');
  const [studentName, setStudentName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const fileInputRef = useRef(null);

  // Inicializace Lenis pro plynulé procházení
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // GSAP animace při načtení
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [tab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomTitle.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onCreateRoom(roomTitle.trim(), teacherName.trim() || 'Učitel');
    } catch (err) {
      setError(err.message || 'Nepodařilo se vytvořit místnost.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Zadejte prosím zvací kód.');
      return;
    }
    if (!studentName.trim()) {
      setError('Zadejte prosím své jméno nebo přezdívku.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onJoinRoom(joinCode.trim().toUpperCase(), studentName.trim());
    } catch (err) {
      setError(err.message || 'Nepodařilo se připojit k místnosti.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result);
        setLoading(true);
        setError('');
        await onImportRoom(json);
      } catch (err) {
        setError('Neplatný JSON soubor: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-md overflow-y-auto"
    >
      <DotPattern className="opacity-40" />

      <div
        ref={cardRef}
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-6 sm:p-8 overflow-hidden z-10"
      >
        {/* Horní záhlaví Taste Skill style */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[12px] font-medium mb-3 border border-black/[0.05] dark:border-white/[0.06]">
            <Sparkles size={13} className="text-indigo-500" />
            <span>Spolupráce v reálném čase bez registrace</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            <DecryptedText text="Teacher Free Mind" speed={30} />
          </h2>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Tvořte myšlenkové mapy společně se studenty během výuky.
          </p>
        </div>

        {/* Přepínač záložek: Učitel (Nová mapa) / Student (Připojit se) */}
        <div className="flex p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 mb-6 border border-black/[0.04] dark:border-white/[0.05]">
          <button
            type="button"
            onClick={() => { setTab('create'); setError(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              tab === 'create'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Vytvořit mapu
          </button>
          <button
            type="button"
            onClick={() => { setTab('join'); setError(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              tab === 'join'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Mám zvací kód
          </button>
          <button
            type="button"
            onClick={() => { setTab('import'); setError(''); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              tab === 'import'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Nahrát JSON
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Záložka 1: Vytvořit novou mapu */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Hlavní téma / Název myšlenkové mapy
              </label>
              <input
                type="text"
                required
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="např. Sluneční soustava, Baroko, Brainstorming"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Vaše jméno (Učitel)
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Pan učitel / Vaše jméno"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-11 flex items-center justify-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Zakládám místnost...' : (
                <>
                  <span>Založit a vygenerovat zvací kód</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Záložka 2: Připojit se ke kódu */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Zvací kód místnosti (od učitele)
              </label>
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="např. TFM-4821"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 font-mono tracking-widest uppercase text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Vaše jméno nebo přezdívka
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="např. Jana, Tomáš, Skupina 1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-11 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Připojuji...' : (
                <>
                  <span>Vstoupit do mapy</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Záložka 3: Nahrát uloženou mapu ze souboru JSON */}
        {tab === 'import' && (
          <div className="space-y-4 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-500 rounded-2xl p-8 cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 bg-neutral-50/50 dark:bg-neutral-800/30"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Vyberte .json soubor s uloženou mapou
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Vytvoří se nová místnost a nový kód pro studenty
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400">
          <span>SQL Real-time Synchronizace</span>
          <span>Zero-Auth (Bez hesel a účtů)</span>
        </div>
      </div>
    </div>
  );
}
