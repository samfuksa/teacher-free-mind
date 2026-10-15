import React, { useState, useRef, useEffect, memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Plus, Trash2, Palette, Lock, User, Edit3 } from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'Modrá', hex: '#3b82f6' },
  { label: 'Zelená', hex: '#10b981' },
  { label: 'Fialová', hex: '#8b5cf6' },
  { label: 'Oranžová', hex: '#f97316' },
  { label: 'Jantarová', hex: '#f59e0b' },
  { label: 'Růžová', hex: '#f43f5e' },
  { label: 'Tyrkysová', hex: '#06b6d4' },
  { label: 'Břidlicová', hex: '#475569' },
];

function MindMapNodeComponent({ id, data, selected }) {
  const [label, setLabel] = useState(data.label || 'Téma');
  const [showPalette, setShowPalette] = useState(false);
  const textareaRef = useRef(null);
  const paletteRef = useRef(null);

  const color = data.color || '#3b82f6';
  const author = data.authorName || 'Účastník';
  const isLocked = data.isLocked || false;

  useEffect(() => {
    setLabel(data.label || 'Téma');
  }, [data.label]);

  // Zavřít paletku při kliknutí mimo
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setShowPalette(false);
      }
    };
    if (showPalette) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPalette]);

  const handleBlur = () => {
    if (data.onUpdateLabel && label.trim() !== data.label) {
      data.onUpdateLabel(id, label.trim() || 'Bez názvu');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  };

  const handleAddDirection = (e, direction) => {
    e.stopPropagation();
    if (!isLocked && data.onAddDirectionalChild) {
      data.onAddDirectionalChild(id, direction);
    }
  };

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.nativeEvent?.stopImmediatePropagation?.();
      }}
      className={`group relative min-w-[180px] min-h-[85px] w-full h-full rounded-3xl px-4 py-3 border-2 transition-shadow duration-150 flex flex-col justify-between ${
        selected
          ? 'shadow-xl ring-2 ring-indigo-500/50'
          : 'shadow-md hover:shadow-lg'
      }`}
      style={{
        backgroundColor: `${color}0D`,
        borderColor: selected ? color : `${color}88`,
        boxShadow: selected
          ? `0 12px 28px -6px ${color}40, 0 4px 12px -2px ${color}20`
          : `0 4px 16px -4px ${color}25`,
      }}
    >
      {/* Resizer pro změnu velikosti bubliny */}
      <NodeResizer
        isVisible={selected && !isLocked}
        minWidth={160}
        minHeight={80}
        color={color}
        handleStyle={{ width: 10, height: 10, borderRadius: 4, borderWidth: 2 }}
        lineStyle={{ borderWidth: 1.5, borderColor: color }}
      />

      {/* 4 univerzální body pro manuální spojování čar */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-3.5 !h-3.5 !border-2 !border-white !shadow-sm !opacity-0 group-hover:!opacity-100 transition-all hover:!scale-125"
        style={{ backgroundColor: color }}
      />

      {/* Směrová (+) tlačítka pro okamžité vytvoření větve */}
      {!isLocked && (
        <>
          {/* Vpravo */}
          <button
            type="button"
            title="Vytvořit větev vpravo"
            onClick={(e) => handleAddDirection(e, 'right')}
            className="nodrag absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-20 active:scale-95 border-2 border-white"
            style={{ backgroundColor: color }}
          >
            <Plus size={15} strokeWidth={3} />
          </button>

          {/* Dole */}
          <button
            type="button"
            title="Vytvořit větev dolů"
            onClick={(e) => handleAddDirection(e, 'bottom')}
            className="nodrag absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-20 active:scale-95 border-2 border-white"
            style={{ backgroundColor: color }}
          >
            <Plus size={15} strokeWidth={3} />
          </button>

          {/* Vlevo */}
          <button
            type="button"
            title="Vytvořit větev vlevo"
            onClick={(e) => handleAddDirection(e, 'left')}
            className="nodrag absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-20 active:scale-95 border-2 border-white"
            style={{ backgroundColor: color }}
          >
            <Plus size={15} strokeWidth={3} />
          </button>

          {/* Nahoře */}
          <button
            type="button"
            title="Vytvořit větev nahoru"
            onClick={(e) => handleAddDirection(e, 'top')}
            className="nodrag absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 hover:scale-125 transition-all z-20 active:scale-95 border-2 border-white"
            style={{ backgroundColor: color }}
          >
            <Plus size={15} strokeWidth={3} />
          </button>
        </>
      )}

      {/* Horní řádek: Autor a indikátor */}
      <div className="flex items-center justify-between gap-2 mb-1 select-none">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
            style={{ backgroundColor: color }}
          />
          <span className="truncate max-w-[120px] flex items-center gap-1">
            <User size={11} />
            {author}
          </span>
        </div>

        {isLocked && (
          <span className="text-[10px] bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
            <Lock size={10} /> Zamčeno
          </span>
        )}
      </div>

      {/* Obsah / Text uvnitř bubliny – VŽDY přímo přepisovatelný s třídou nodrag nopan */}
      <div className="nodrag nopan my-auto py-1 w-full">
        <textarea
          ref={textareaRef}
          value={label}
          disabled={isLocked}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation?.();
          }}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Napište myšlenku..."
          rows={Math.max(1, Math.min(6, Math.ceil(label.length / 18)))}
          className="nodrag nopan w-full resize-none bg-transparent font-semibold text-[15px] leading-snug text-neutral-900 dark:text-neutral-100 outline-none select-text cursor-text border border-transparent focus:border-indigo-400 focus:bg-white/85 dark:focus:bg-neutral-800/85 rounded-xl p-1.5 transition-all disabled:cursor-not-allowed"
          title={isLocked ? 'Mapa je uzamčena pro úpravy' : 'Kliknutím můžete text přímo přepsat'}
        />
      </div>

      {/* Plovoucí ovládací lišta (Paleta + Koš)
          - viditelná při najetí myší i při vybrání uzlu
          - před prvkem je 'before' most, takže myš nikdy neztratí hover při přejezdu na koš */}
      {!isLocked && (
        <div
          className={`nodrag absolute -top-12 right-2 flex items-center gap-1.5 bg-white dark:bg-neutral-800 border border-black/[0.1] dark:border-white/[0.1] shadow-xl rounded-2xl px-2 py-1.5 transition-all duration-150 z-30 before:content-[''] before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-4 ${
            selected
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
          }`}
        >
          {/* Tlačítko Paleta barev */}
          <div className="relative" ref={paletteRef}>
            <button
              type="button"
              title="Změnit barvu bubliny"
              onClick={(e) => {
                e.stopPropagation();
                setShowPalette(!showPalette);
              }}
              className="p-1.5 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Palette size={15} />
            </button>

            {/* Vyskakovací paleta barev: umístěna NAD lištu */}
            {showPalette && (
              <div
                className="absolute bottom-11 right-0 grid grid-cols-4 gap-2 p-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-2xl shadow-2xl z-50 min-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              >
                {COLOR_PRESETS.map((item) => (
                  <button
                    key={item.hex}
                    type="button"
                    title={item.label}
                    onClick={() => {
                      if (data.onUpdateColor) data.onUpdateColor(id, item.hex);
                      setShowPalette(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${
                      color === item.hex ? 'border-neutral-900 scale-110 shadow-sm' : 'border-white'
                    }`}
                    style={{ backgroundColor: item.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Tlačítko Smazat uzel (Koš) – velká oblast pro snadný klik */}
          <button
            type="button"
            title="Smazat tuto bublinu"
            onClick={(e) => {
              e.stopPropagation();
              if (data.onDeleteNode) data.onDeleteNode(id);
            }}
            className="p-1.5 rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(MindMapNodeComponent);
