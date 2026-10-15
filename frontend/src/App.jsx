import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import gsap from 'gsap';

import MindMapNode from './components/MindMapNode';
import Navbar from './components/Navbar';
import DockToolbar from './components/DockToolbar';
import LobbyModal from './components/LobbyModal';
import ShareModal from './components/ShareModal';

import {
  createRoom,
  joinRoom,
  syncGet,
  syncPost,
  toggleRoomLock,
  updateRoomTitle,
  exportRoomJson,
  importRoomJson
} from './services/api';

const nodeTypes = {
  customMindMap: MindMapNode,
};

function FlowCanvas() {
  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // React Flow helpers
  const flowInstance = useReactFlow();

  const lastServerTimeRef = useRef(0);
  const toastRef = useRef(null);
  const fileInputRef = useRef(null);

  // URL zvací kód z parametrů (?code=ABC-1234)
  const initialCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || '';
  }, []);

  // Notifikace s GSAP
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (toastMessage && toastRef.current) {
      gsap.fromTo(
        toastRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      const timer = setTimeout(() => {
        if (toastRef.current) {
          gsap.to(toastRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.3,
            onComplete: () => setToastMessage(null),
          });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Vytvoření místnosti
  const handleCreateRoom = async (title, teacherName) => {
    const res = await createRoom(title, teacherName);
    if (!res.ok) throw new Error(res.error || 'Chyba při vytváření místnosti.');

    const newRoom = res.room;
    setRoom(newRoom);
    setAdminToken(newRoom.admin_token);
    localStorage.setItem(`admin_token_${newRoom.code}`, newRoom.admin_token);

    // Připojíme učitele jako účastníka
    const joinRes = await joinRoom(newRoom.code, teacherName);
    if (joinRes.ok) {
      setCurrentUser(joinRes.user);
      setNodes(joinRes.nodes || []);
      setEdges(joinRes.edges || []);
      lastServerTimeRef.current = joinRes.serverTime || 0;
      setTimeout(() => flowInstance.fitView({ padding: 0.3 }), 150);
      showToast(`Místnost založena! Kód: ${newRoom.code}`);
    }
  };

  // Připojení k existující místnosti
  const handleJoinRoom = async (code, name) => {
    const savedToken = localStorage.getItem(`admin_token_${code}`) || null;
    const res = await joinRoom(code, name);
    if (!res.ok) throw new Error(res.error || 'Nepodařilo se připojit.');

    setRoom(res.room);
    setCurrentUser(res.user);
    if (savedToken) setAdminToken(savedToken);

    setNodes(res.nodes || []);
    setEdges(res.edges || []);
    setCollaborators(res.collaborators || []);
    lastServerTimeRef.current = res.serverTime || 0;

    setTimeout(() => flowInstance.fitView({ padding: 0.3 }), 150);
    showToast(`Vítejte v mapě, ${name}!`);
  };

  // Import JSON do nové místnosti
  const handleImportRoom = async (jsonData) => {
    const res = await importRoomJson(jsonData);
    if (!res.ok) throw new Error(res.error || 'Chyba při importu.');

    const newRoom = res.room;
    setRoom(newRoom);
    setAdminToken(newRoom.admin_token);
    localStorage.setItem(`admin_token_${newRoom.code}`, newRoom.admin_token);

    const joinRes = await joinRoom(newRoom.code, 'Učitel');
    if (joinRes.ok) {
      setCurrentUser(joinRes.user);
      setNodes(joinRes.nodes || []);
      setEdges(joinRes.edges || []);
      lastServerTimeRef.current = joinRes.serverTime || 0;
      setTimeout(() => flowInstance.fitView({ padding: 0.3 }), 150);
      showToast('Mapa byla úspěšně nahrána!');
    }
  };

  // Pomocná funkce pro vytvoření samostatného bloku na zadané souřadnici
  const createStandaloneNode = useCallback(
    (flowX, flowY) => {
      if (!room) return;
      if (room.is_locked && !adminToken) return;

      const newId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newNode = {
        id: newId,
        type: 'customMindMap',
        position: { x: flowX, y: flowY },
        data: {
          label: 'Nová myšlenka',
          color: randomColor,
          authorName: currentUser?.name || 'Účastník',
        },
      };

      setNodes((nds) => [...nds, newNode]);
      syncPost(room.code, currentUser?.sessionId, adminToken, {
        nodes: [newNode],
      });
      showToast('Nový blok vytvořen (můžete jej propojit)');
    },
    [room, adminToken, currentUser, setNodes, showToast]
  );

  // Uzly obohacené o callbacks
  const enrichedNodes = useMemo(() => {
    const isLockedForUser = room?.is_locked && !adminToken;

    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isLocked: isLockedForUser,
        onUpdateLabel: (id, newLabel) => {
          setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n))
          );
          const target = nodes.find((n) => n.id === id);
          if (target) {
            syncPost(room.code, currentUser?.sessionId, adminToken, {
              nodes: [{ ...target, data: { ...target.data, label: newLabel } }],
            });
          }
        },
        onUpdateColor: (id, newColor) => {
          setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, color: newColor } } : n))
          );
          const target = nodes.find((n) => n.id === id);
          if (target) {
            syncPost(room.code, currentUser?.sessionId, adminToken, {
              nodes: [{ ...target, data: { ...target.data, color: newColor } }],
            });
          }
        },
        // Vytvoření větve podle kliknuté strany (+ vpravo, dole, vlevo, nahoře)
        onAddDirectionalChild: (parentId, direction) => {
          if (isLockedForUser) return;
          const parentNode = nodes.find((n) => n.id === parentId);
          if (!parentNode) return;

          const newId = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          let posX = parentNode.position.x;
          let posY = parentNode.position.y;
          let sourceHandle = 'right-source';
          let targetHandle = 'left-target';

          if (direction === 'right') {
            posX += 250;
            posY += (Math.random() * 30 - 15);
            sourceHandle = 'right-source';
            targetHandle = 'left-target';
          } else if (direction === 'left') {
            posX -= 250;
            posY += (Math.random() * 30 - 15);
            sourceHandle = 'left-source';
            targetHandle = 'right-target';
          } else if (direction === 'bottom') {
            posY += 140;
            posX += (Math.random() * 30 - 15);
            sourceHandle = 'bottom-source';
            targetHandle = 'top-target';
          } else if (direction === 'top') {
            posY -= 140;
            posX += (Math.random() * 30 - 15);
            sourceHandle = 'top-source';
            targetHandle = 'bottom-target';
          }

          const newNode = {
            id: newId,
            type: 'customMindMap',
            position: { x: posX, y: posY },
            data: {
              label: 'Nová myšlenka',
              color: parentNode.data?.color || '#3b82f6',
              authorName: currentUser?.name || 'Účastník',
            },
          };

          const newEdgeId = `edge-${parentId}-${newId}-${Date.now()}`;
          const newEdge = {
            id: newEdgeId,
            source: parentId,
            target: newId,
            sourceHandle,
            targetHandle,
            type: 'bezier',
            animated: false,
            style: {
              stroke: parentNode.data?.color || '#6366f1',
              strokeWidth: 3,
              strokeLinecap: 'round',
            },
          };

          setNodes((nds) => [...nds, newNode]);
          setEdges((eds) => [...eds, newEdge]);

          syncPost(room.code, currentUser?.sessionId, adminToken, {
            nodes: [newNode],
            edges: [newEdge],
          });
          showToast(`Větev vytvořena (${direction})`);
        },
        onDeleteNode: (id) => {
          if (isLockedForUser) return;
          setNodes((nds) => nds.filter((n) => n.id !== id));
          setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));

          syncPost(room.code, currentUser?.sessionId, adminToken, {
            deletedNodeIds: [id],
          });
          showToast('Uzel smazán');
        },
      },
    }));
  }, [nodes, room, adminToken, currentUser, setNodes, setEdges, showToast]);

  // Přidání samostatného uzlu tlačítkem z doku
  const handleAddStandaloneFromDock = () => {
    let flowPos = { x: 250, y: 200 };
    if (flowInstance.screenToFlowPosition) {
      flowPos = flowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    }
    createStandaloneNode(flowPos.x - 80, flowPos.y - 40);
  };

  // Dvojklik kamkoliv na volnou plochu plátna vytvoří nový samostatný blok
  const handlePaneDoubleClick = (event) => {
    const target = event.target;
    if (!target) return;

    // Pokud uživatel kliknul na uzel, textové pole, tlačítko nebo jakýkoliv prvek bubliny, NIKDY nevytvářet uzel
    if (
      target.closest?.('.react-flow__node') ||
      target.closest?.('.react-flow__edge') ||
      target.closest?.('.react-flow__controls') ||
      target.closest?.('.react-flow__minimap') ||
      target.closest?.('.nodrag') ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }

    // Povolit vytvoření pouze pokud bylo kliknuto na prázdné plátno / pozadí
    const isBackground =
      target.classList?.contains('react-flow__pane') ||
      target.classList?.contains('react-flow__background') ||
      target.closest?.('.react-flow__background');

    if (!isBackground) {
      return;
    }

    let flowPos = { x: 250, y: 200 };
    if (flowInstance.screenToFlowPosition) {
      flowPos = flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
    }
    createStandaloneNode(flowPos.x - 80, flowPos.y - 30);
  };

  // Smazání uzlů klávesou (Delete / Backspace)
  const onNodesDelete = useCallback(
    (deletedNodes) => {
      if (room?.is_locked && !adminToken) return;
      const deletedIds = deletedNodes.map((n) => n.id);
      syncPost(room.code, currentUser?.sessionId, adminToken, {
        deletedNodeIds: deletedIds,
      });
      showToast(deletedIds.length > 1 ? `${deletedIds.length} uzlů smazáno` : 'Uzel smazán klávesou');
    },
    [room, adminToken, currentUser, showToast]
  );

  // Smazání hran klávesou (Delete / Backspace)
  const onEdgesDelete = useCallback(
    (deletedEdges) => {
      if (room?.is_locked && !adminToken) return;
      const deletedIds = deletedEdges.map((e) => e.id);
      syncPost(room.code, currentUser?.sessionId, adminToken, {
        deletedEdgeIds: deletedIds,
      });
      showToast('Spojnice smazána klávesou');
    },
    [room, adminToken, currentUser, showToast]
  );

  // Propojení hranou tažením mezi jakýmikoliv dvěma uzly
  const onConnect = useCallback(
    (params) => {
      if (room?.is_locked && !adminToken) return;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const edgeColor = sourceNode?.data?.color || '#6366f1';

      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: 'bezier',
        animated: false,
        style: {
          stroke: edgeColor,
          strokeWidth: 3,
          strokeLinecap: 'round',
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      syncPost(room.code, currentUser?.sessionId, adminToken, {
        edges: [newEdge],
      });
      showToast('Uzly úspěšně propojeny');
    },
    [room, adminToken, currentUser, setEdges, showToast]
  );

  // Uložení pozice po přetažení uzlu
  const onNodeDragStop = useCallback(
    (_, node) => {
      if (room?.is_locked && !adminToken) return;
      syncPost(room.code, currentUser?.sessionId, adminToken, {
        nodes: [node],
      });
    },
    [room, adminToken, currentUser]
  );

  // Synchronizační polling loop (každých 1.5s)
  useEffect(() => {
    if (!room || !currentUser) return;

    const interval = setInterval(async () => {
      try {
        const data = await syncGet(
          room.code,
          lastServerTimeRef.current,
          currentUser.sessionId,
          currentUser.name
        );

        if (!data.ok) return;

        // Aktualizace stavu zamčení
        if (data.room && data.room.is_locked !== room.is_locked) {
          setRoom((prev) => ({ ...prev, is_locked: data.room.is_locked, title: data.room.title }));
        }

        // Aktualizace spolupracovníků
        if (data.collaborators) {
          setCollaborators(data.collaborators);
        }

        // Zpracování nových/změněných uzlů
        if (data.nodes && data.nodes.length > 0) {
          setNodes((prevNodes) => {
            const nextNodes = [...prevNodes];
            data.nodes.forEach((incoming) => {
              if (incoming.is_deleted) {
                const idx = nextNodes.findIndex((n) => n.id === incoming.id);
                if (idx !== -1) nextNodes.splice(idx, 1);
              } else {
                const idx = nextNodes.findIndex((n) => n.id === incoming.id);
                if (idx !== -1) {
                  nextNodes[idx] = {
                    ...incoming,
                    position: incoming.position,
                    data: { ...nextNodes[idx].data, ...incoming.data },
                  };
                } else {
                  nextNodes.push(incoming);
                }
              }
            });
            return nextNodes;
          });
        }

        // Zpracování hran
        if (data.edges && data.edges.length > 0) {
          setEdges((prevEdges) => {
            const nextEdges = [...prevEdges];
            data.edges.forEach((incoming) => {
              if (incoming.is_deleted) {
                const idx = nextEdges.findIndex((e) => e.id === incoming.id);
                if (idx !== -1) nextEdges.splice(idx, 1);
              } else {
                const idx = nextEdges.findIndex((e) => e.id === incoming.id);
                if (idx !== -1) {
                  nextEdges[idx] = incoming;
                } else {
                  nextEdges.push(incoming);
                }
              }
            });
            return nextEdges;
          });
        }

        if (data.serverTime) {
          lastServerTimeRef.current = data.serverTime;
        }
      } catch (err) {
        console.error('Chyba synchronizace:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [room, currentUser, setNodes, setEdges]);

  // Export JSON
  const handleExport = async () => {
    if (!room) return;
    try {
      const res = await exportRoomJson(room.code);
      if (res.ok) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmap-${room.code}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Mapa stažena jako JSON!');
      }
    } catch (err) {
      showToast('Chyba při exportu: ' + err.message);
    }
  };

  // Přepnutí zámku místnosti
  const handleToggleLock = async () => {
    if (!adminToken) return;
    try {
      const res = await toggleRoomLock(room.code, adminToken);
      if (res.ok) {
        setRoom((r) => ({ ...r, is_locked: res.is_locked }));
        showToast(res.message);
      }
    } catch (err) {
      showToast('Chyba při změně zámku: ' + err.message);
    }
  };

  // Úprava názvu místnosti
  const handleUpdateTitle = async (newTitle) => {
    if (!adminToken) return;
    try {
      const res = await updateRoomTitle(room.code, adminToken, newTitle);
      if (res.ok) {
        setRoom((r) => ({ ...r, title: newTitle }));
        showToast('Název mapy byl změněn');
      }
    } catch (err) {
      showToast('Chyba při přejmenování: ' + err.message);
    }
  };

  // Vyčištění plátna
  const handleClearMap = () => {
    if (!adminToken) return;
    if (!window.confirm('Opravdu chcete vyčistit celé plátno myšlenkové mapy?')) return;
    const allNodeIds = nodes.map((n) => n.id);
    const allEdgeIds = edges.map((e) => e.id);
    setNodes([]);
    setEdges([]);
    syncPost(room.code, currentUser?.sessionId, adminToken, {
      deletedNodeIds: allNodeIds,
      deletedEdgeIds: allEdgeIds,
    });
    showToast('Plátno bylo vyčištěno');
  };

  // Opuštění místnosti
  const handleLeave = () => {
    if (window.confirm('Opravdu chcete odejít z této myšlenkové mapy?')) {
      setRoom(null);
      setCurrentUser(null);
      setAdminToken(null);
      setNodes([]);
      setEdges([]);
    }
  };

  // Zajištění správných stran propojení hran (aby se nikdy nepřipojovaly na horní úchyt, pokud mají jít do stran)
  const resolvedEdges = useMemo(() => {
    return edges.map((edge) => {
      let sourceHandle = edge.sourceHandle;
      let targetHandle = edge.targetHandle;

      if (!sourceHandle || !targetHandle) {
        const sNode = nodes.find((n) => n.id === edge.source);
        const tNode = nodes.find((n) => n.id === edge.target);

        if (sNode && tNode) {
          const dx = tNode.position.x - sNode.position.x;
          const dy = tNode.position.y - sNode.position.y;

          if (Math.abs(dx) >= Math.abs(dy)) {
            if (dx >= 0) {
              sourceHandle = sourceHandle || 'right-source';
              targetHandle = targetHandle || 'left-target';
            } else {
              sourceHandle = sourceHandle || 'left-source';
              targetHandle = targetHandle || 'right-target';
            }
          } else {
            if (dy >= 0) {
              sourceHandle = sourceHandle || 'bottom-source';
              targetHandle = targetHandle || 'top-target';
            } else {
              sourceHandle = sourceHandle || 'top-source';
              targetHandle = targetHandle || 'bottom-target';
            }
          }
        }
      }

      const sNode = nodes.find((n) => n.id === edge.source);
      const edgeColor = sNode?.data?.color || '#6366f1';

      return {
        ...edge,
        sourceHandle: sourceHandle || 'right-source',
        targetHandle: targetHandle || 'left-target',
        type: 'bezier',
        animated: false,
        style: {
          stroke: edgeColor,
          strokeWidth: 3,
          strokeLinecap: 'round',
          ...(edge.style || {}),
        },
      };
    });
  }, [edges, nodes]);

  return (
    <div className="relative w-full h-full bg-[#fbfbfa] dark:bg-neutral-950 overflow-hidden select-none">
      {/* Toast notifikace */}
      {toastMessage && (
        <div
          ref={toastRef}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold shadow-lg border border-black/10 flex items-center gap-2 pointer-events-none"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Lobby dialog */}
      {!room ? (
        <LobbyModal
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onImportRoom={handleImportRoom}
          initialCode={initialCode}
        />
      ) : (
        <>
          {/* Horní navigační lišta s rychlým kopírováním URL i kódu a zámkem pro učitele */}
          <Navbar
            room={room}
            currentUser={currentUser}
            isAdmin={Boolean(adminToken)}
            collaborators={collaborators}
            onLeave={handleLeave}
            onUpdateTitle={handleUpdateTitle}
            onOpenShare={() => setShowShareModal(true)}
            onToggleLock={handleToggleLock}
          />

          {/* Upozornění pro studenty při pozastavených úpravách */}
          {room.is_locked && !adminToken && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-amber-500/95 text-white text-xs font-semibold shadow-lg backdrop-blur-md flex items-center gap-2 border border-amber-600/50">
              <span>Režim čtení: Učitel pozastavil úpravy mapy pro studenty.</span>
            </div>
          )}

          {/* React Flow plátno */}
          <div className="w-full h-full pt-16" onDoubleClick={handlePaneDoubleClick}>
            <ReactFlow
              nodes={enrichedNodes}
              edges={resolvedEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              deleteKeyCode={['Backspace', 'Delete']}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              connectionLineType="bezier"
              connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 3, strokeLinecap: 'round' }}
              defaultEdgeOptions={{
                type: 'bezier',
                animated: false,
                style: { stroke: '#6366f1', strokeWidth: 3, strokeLinecap: 'round' },
              }}
              minZoom={0.2}
              maxZoom={2.5}
            >
              <Background color="#94a3b8" gap={20} size={1} />
              <Controls position="bottom-right" className="!m-6 !bg-white/80 dark:!bg-neutral-900/80 !backdrop-blur-md !border !border-black/[0.08] dark:!border-white/[0.1] !rounded-xl !shadow-sm" />
              <MiniMap
                position="top-right"
                className="!mt-20 !mr-6 !bg-white/80 dark:!bg-neutral-900/80 !backdrop-blur-md !border !border-black/[0.08] dark:!border-white/[0.1] !rounded-2xl !shadow-sm hidden md:block"
                nodeColor={(node) => node.data?.color || '#3b82f6'}
                maskColor="rgba(240, 240, 240, 0.6)"
              />
            </ReactFlow>
          </div>

          {/* Spodní plovoucí Dock nástrojů */}
          <DockToolbar
            onAddNode={handleAddStandaloneFromDock}
            onExport={handleExport}
            onImport={() => fileInputRef.current?.click()}
            onToggleLock={handleToggleLock}
            onShare={() => setShowShareModal(true)}
            onFitView={() => flowInstance.fitView({ padding: 0.3, duration: 400 })}
            onClear={handleClearMap}
            isAdmin={Boolean(adminToken)}
            isLocked={room.is_locked}
            roomCode={room.code}
          />

          {/* Skrytý input pro nahrání JSON */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async (evt) => {
                try {
                  const json = JSON.parse(evt.target?.result);
                  await handleImportRoom(json);
                } catch (err) {
                  showToast('Chyba souboru: ' + err.message);
                }
              };
              reader.readAsText(file);
            }}
            className="hidden"
          />

          {/* Modal se zvacím kódem a přímým odkazem (URL) */}
          {showShareModal && (
            <ShareModal
              code={room.code}
              roomTitle={room.title}
              onClose={() => setShowShareModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
