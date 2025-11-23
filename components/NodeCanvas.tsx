import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SmartNode } from './SmartNode';
import { NodeData, NodeType, Connection } from '../types';
import { generateEditedImage } from '../services/gemini';
import { ToolStack } from './ToolStack';
import { X, Wand2, Download } from './ui/Icons';
import { useTheme } from '../contexts/ThemeContext';

// Helper: Composite mask logic
const compositeImageWithMask = (baseImage: string, maskImage: string | null): Promise<string> => {
    if (!maskImage) return Promise.resolve(baseImage);
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img1 = new Image();
        const img2 = new Image();
        img1.onload = () => {
            canvas.width = img1.width;
            canvas.height = img1.height;
            ctx?.drawImage(img1, 0, 0);
            img2.onload = () => {
                ctx?.drawImage(img2, 0, 0, img1.width, img1.height);
                resolve(canvas.toDataURL('image/png'));
            };
            img2.src = maskImage;
        };
        img1.src = baseImage;
    });
};

export const NodeCanvas: React.FC = () => {
  const { theme } = useTheme();

  // --- State ---
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1', type: NodeType.INPUT, x: 50, y: 150, width: 320, height: 350, title: 'Source Image', data: {} },
    { id: '2', type: NodeType.PROCESSOR, x: 450, y: 150, width: 400, height: 500, title: 'Gemini 2.5 Flash', data: {} },
    { id: '3', type: NodeType.OUTPUT, x: 950, y: 150, width: 320, height: 350, title: 'Final Render', data: {} }
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 'c1', from: '1', to: '2' },
    { id: 'c2', from: '2', to: '3' }
  ]);

  // Refs for stable callbacks
  const nodesRef = useRef(nodes);
  const connectionsRef = useRef(connections);

  useEffect(() => {
    nodesRef.current = nodes;
    connectionsRef.current = connections;
  }, [nodes, connections]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Pan & Zoom State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  
  // Update refs when state changes
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseStart = useRef({ x: 0, y: 0 });
  
  // Connection interaction state
  const [pendingLink, setPendingLink] = useState<{
      startNodeId: string;
      startType: 'source' | 'target';
      mousePos: { x: number, y: number };
  } | null>(null);

  // Quick Add Menu State
  const [quickAddMenu, setQuickAddMenu] = useState<{
      visible: boolean;
      x: number;
      y: number;
      sourceNodeId: string;
      sourceHandleType: 'source' | 'target';
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
      const p = panRef.current;
      const z = zoomRef.current;
      return {
          x: (screenX - p.x) / z,
          y: (screenY - p.y) / z
      };
  }, []);

  // --- Actions ---

  const handleAddNode = useCallback((type: NodeType, position?: { x: number, y: number }) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Determine Position (World Coordinates)
    let x, y;
    if (position) {
        x = position.x;
        y = position.y;
    } else {
        const p = panRef.current;
        const z = zoomRef.current;
        x = (-p.x + 400) / z; 
        y = (-p.y + 300) / z;
    }
    
    let title = 'Node';
    let width = 320;
    let height = 300;

    if (type === NodeType.INPUT) {
        title = 'Source Image';
        height = 320;
    }
    else if (type === NodeType.PROCESSOR) {
        title = 'Gemini 2.5 Flash';
        width = 400;
        height = 450;
    }
    else if (type === NodeType.OUTPUT) {
        title = 'Output';
        height = 320;
    }

    const newNode = { id, type, x, y, width, height, title, data: {} };
    setNodes(prev => [...prev, newNode]);
    return id;
  }, []);

  // Optimized Move Handler - Dependencies reduced using Refs
  const handleMove = useCallback((id: string, screenX: number, screenY: number) => {
    const p = panRef.current;
    const z = zoomRef.current;
    
    setNodes(prev => prev.map(n => {
        if (n.id !== id) return n;
        const worldX = (screenX - p.x) / z;
        const worldY = (screenY - p.y) / z;
        return { ...n, x: worldX, y: worldY };
    }));
  }, []);

  const handleResize = useCallback((id: string, width: number, height: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, width, height } : n));
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
  }, []);

  const handleDeleteConnection = useCallback((id: string) => {
      setConnections(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleImageUpload = useCallback((id: string, img: string) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, outputImage: img } } : n));
  }, []);

  const updateNodeData = useCallback((id: string, newData: Partial<NodeData['data']>) => {
    setNodes(prev => prev.map(n => 
        n.id === id ? { ...n, data: { ...n.data, ...newData } } : n
    ));
  }, []);

  const handleQuickAdd = useCallback((type: NodeType) => {
      if (!quickAddMenu) return;

      const worldPos = screenToWorld(quickAddMenu.x, quickAddMenu.y);
      const newNodeId = handleAddNode(type, { x: worldPos.x, y: worldPos.y });
      const { sourceNodeId, sourceHandleType } = quickAddMenu;

      let fromId, toId;
      if (sourceHandleType === 'source') {
          fromId = sourceNodeId;
          toId = newNodeId;
      } else {
          fromId = newNodeId;
          toId = sourceNodeId;
      }

      setConnections(prev => [
          ...prev, 
          { id: Math.random().toString(36).substr(2, 9), from: fromId, to: toId }
      ]);

      setQuickAddMenu(null);
  }, [quickAddMenu, handleAddNode, screenToWorld]);

  // --- Keyboard Shortcuts ---
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          handleDeleteNode(selectedNodeId);
          setSelectedNodeId(null);
        }
        if (selectedConnectionId) {
          handleDeleteConnection(selectedConnectionId);
          setSelectedConnectionId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedConnectionId, handleDeleteNode, handleDeleteConnection]);

  // --- Pan & Zoom Logic ---

  const handleMouseDown = (e: React.MouseEvent) => {
      if (quickAddMenu) setQuickAddMenu(null);

      setSelectedNodeId(null);
      setSelectedConnectionId(null);

      if (e.button === 0) {
          setIsPanning(true);
          mouseStart.current = { x: e.clientX, y: e.clientY };
          panStart.current = { ...pan };
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isPanning) {
          const dx = e.clientX - mouseStart.current.x;
          const dy = e.clientY - mouseStart.current.y;
          setPan({
              x: panStart.current.x + dx,
              y: panStart.current.y + dy
          });
      }
  };

  const handleMouseUp = () => {
      setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newZoom = Math.min(Math.max(0.1, zoom + delta), 5);

      if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const scaleFactor = newZoom / zoom;
          const newPanX = mouseX - (mouseX - pan.x) * scaleFactor;
          const newPanY = mouseY - (mouseY - pan.y) * scaleFactor;

          setPan({ x: newPanX, y: newPanY });
          setZoom(newZoom);
      }
  };

  // --- Connection Logic ---

  const handleConnectStart = useCallback((nodeId: string, handleType: 'source' | 'target', e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      
      const p = panRef.current;
      const z = zoomRef.current;
      const worldPos = { x: (clientX - p.x) / z, y: (clientY - p.y) / z };

      setPendingLink({
          startNodeId: nodeId,
          startType: handleType,
          mousePos: worldPos
      });
  }, []);

  const handleConnectEnd = useCallback((endNodeId: string, endType: 'source' | 'target') => {
      setPendingLink(currentPending => {
          if (!currentPending) return null;
          
          const { startNodeId, startType } = currentPending;

          if (startNodeId === endNodeId) return null; 
          if (startType === endType) return null; 

          const sourceId = startType === 'source' ? startNodeId : endNodeId;
          const targetId = startType === 'target' ? startNodeId : endNodeId;

          setConnections(prev => {
              const filtered = prev.filter(c => c.to !== targetId);
              return [...filtered, { id: Math.random().toString(36).substr(2, 9), from: sourceId, to: targetId }];
          });

          return null;
      });
  }, []);

  useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
          if (pendingLink && canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              const clientY = e.clientY - rect.top;
              
              const p = panRef.current;
              const z = zoomRef.current;
              const worldPos = { x: (clientX - p.x) / z, y: (clientY - p.y) / z };

              setPendingLink(prev => prev ? {
                  ...prev,
                  mousePos: worldPos
              } : null);
          }
      };

      const handleGlobalMouseUp = (e: MouseEvent) => {
          if (pendingLink) {
              if (canvasRef.current) {
                  const rect = canvasRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  setQuickAddMenu({
                      visible: true,
                      x: x, 
                      y: y,
                      sourceNodeId: pendingLink.startNodeId,
                      sourceHandleType: pendingLink.startType
                  });
              }
              setPendingLink(null);
          }
      };

      if (pendingLink) {
          window.addEventListener('mousemove', handleGlobalMouseMove);
          window.addEventListener('mouseup', handleGlobalMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
  }, [pendingLink]); // Removed pan/zoom deps, using refs inside

  // --- Gemini Processing ---

  // Use Refs to keep this callback stable, preventing SmartNode re-renders
  const handleProcessorGenerate = useCallback(async (nodeId: string, prompt: string, maskData: string | null, settings: any) => {
      const currentNodes = nodesRef.current;
      const currentConnections = connectionsRef.current;

      const incoming = currentConnections.find(c => c.to === nodeId);
      if (!incoming) {
          alert("Connect an image source first!");
          return;
      }
      const sourceNode = currentNodes.find(n => n.id === incoming.from);
      const inputImage = sourceNode?.data?.outputImage;

      if (!inputImage) {
          alert("Source node has no image!");
          return;
      }

      setIsProcessing(true);
      
      try {
        const imageToSend = maskData ? await compositeImageWithMask(inputImage, maskData) : inputImage;
        const result = await generateEditedImage({
            base64Image: imageToSend,
            prompt: prompt,
            creativity: settings.creativity || 0.5
        });
        
        // Use functional update to be safe with state
        setNodes(prev => prev.map(n => 
            n.id === nodeId ? { ...n, data: { ...n.data, outputImage: result } } : n
        ));
      } catch (e) {
        console.error(e);
        alert("Generation failed. See console.");
      } finally {
        setIsProcessing(false);
      }
  }, []); 

  // --- Render Helpers ---

  const getHandlePosition = (nodeId: string, type: 'in' | 'out') => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };
      
      const width = node.width || 320;
      const height = node.height || 200;
      const yPos = node.y + (height / 2);
      
      return {
          x: type === 'in' ? node.x : node.x + width,
          y: yPos
      };
  };

  const drawBezier = (x1: number, y1: number, x2: number, y2: number) => {
      const dist = Math.abs(x2 - x1);
      const controlDist = Math.max(dist * 0.5, 50); 
      const cp1x = x1 + controlDist;
      const cp2x = x2 - controlDist;
      return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
  };

  const gridColor = theme === 'dark' ? '#1e293b' : '#cbd5e1';

  return (
    <div 
        className={`relative w-full h-full overflow-hidden transition-colors duration-200 bg-slate-50 dark:bg-[#0f172a] ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
            backgroundImage: `radial-gradient(${gridColor} 1px, transparent 1px)`, 
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px` 
        }}
    >
        <ToolStack onAddNode={handleAddNode} />

        <div 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0'
            }}
        >
            {/* Connections Layer */}
            <svg className="absolute overflow-visible top-0 left-0 w-full h-full z-0 pointer-events-none">
                {connections.map(conn => {
                    const start = getHandlePosition(conn.from, 'out');
                    const end = getHandlePosition(conn.to, 'in');
                    const isSelected = selectedConnectionId === conn.id;

                    return (
                        <g key={conn.id} className="group pointer-events-auto">
                            <path 
                                d={drawBezier(start.x, start.y, end.x, end.y)}
                                stroke="transparent" 
                                strokeWidth="20" 
                                fill="none"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                    e.stopPropagation(); 
                                    setSelectedConnectionId(conn.id);
                                    setSelectedNodeId(null);
                                }}
                            />
                            <path 
                                d={drawBezier(start.x, start.y, end.x, end.y)}
                                stroke={isSelected ? "#3b82f6" : (theme === 'dark' ? "#475569" : "#94a3b8")} 
                                strokeWidth={isSelected ? "4" : "3"}
                                fill="none"
                                className={`transition-all duration-200 pointer-events-none ${isSelected ? 'shadow-lg' : 'group-hover:stroke-blue-400'}`}
                                style={{ filter: isSelected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none' }}
                            />
                            {isSelected && (
                                <foreignObject
                                    x={(start.x + end.x) / 2 - 12} 
                                    y={(start.y + end.y) / 2 - 12} 
                                    width="24" 
                                    height="24"
                                    className="overflow-visible"
                                >
                                    <button 
                                        className="w-6 h-6 bg-white dark:bg-slate-900 rounded-full border border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:border-red-500 shadow-md flex items-center justify-center transform hover:scale-110 transition-all"
                                        onMouseDown={(e) => e.stopPropagation()} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteConnection(conn.id);
                                            setSelectedConnectionId(null);
                                        }}
                                        title="Delete Connection"
                                    >
                                        <X size={12} />
                                    </button>
                                </foreignObject>
                            )}
                        </g>
                    );
                })}
                
                {pendingLink && (
                    <path 
                        d={drawBezier(
                            getHandlePosition(pendingLink.startNodeId, pendingLink.startType === 'source' ? 'out' : 'in').x, 
                            getHandlePosition(pendingLink.startNodeId, pendingLink.startType === 'source' ? 'out' : 'in').y, 
                            pendingLink.mousePos.x, 
                            pendingLink.mousePos.y
                        )}
                        stroke="#3b82f6" 
                        strokeWidth="3" 
                        strokeDasharray="5,5"
                        fill="none"
                    />
                )}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-auto">
                {nodes.map(node => {
                    let inputImage = null;
                    if (node.type === NodeType.PROCESSOR || node.type === NodeType.OUTPUT) {
                        const incoming = connections.find(c => c.to === node.id);
                        if (incoming) {
                            const source = nodes.find(n => n.id === incoming.from);
                            inputImage = source?.data.outputImage || null;
                        }
                    }

                    return (
                        <SmartNode
                            key={node.id}
                            node={node}
                            scale={zoom}
                            isSelected={selectedNodeId === node.id}
                            inputImage={inputImage}
                            isProcessing={isProcessing}
                            onSelect={setSelectedNodeId}
                            onMove={handleMove}
                            onResize={handleResize}
                            onDelete={handleDeleteNode}
                            onConnectStart={handleConnectStart}
                            onConnectEnd={handleConnectEnd}
                            onImageUpload={handleImageUpload}
                            onPreview={setPreviewImage}
                            onGenerate={handleProcessorGenerate}
                        />
                    );
                })}
            </div>
        </div>

        {/* Quick Add Menu & Preview Overlay */}
        {quickAddMenu && (
            <div 
                className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 flex flex-col gap-1 w-48 animate-in zoom-in-95 duration-100"
                style={{ left: quickAddMenu.x, top: quickAddMenu.y }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="px-2 py-1 text-[10px] text-slate-500 font-bold uppercase border-b border-slate-100 dark:border-slate-700/50 mb-1">
                    Add Node
                </div>
                <button 
                    onClick={() => handleQuickAdd(NodeType.PROCESSOR)}
                    className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-left text-xs text-slate-700 dark:text-slate-200 transition-colors"
                >
                    <Wand2 size={14} className="text-blue-500 dark:text-blue-400" />
                    <div>
                        <div className="font-medium">Processor</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Edit & Generate</div>
                    </div>
                </button>
                <button 
                    onClick={() => handleQuickAdd(NodeType.OUTPUT)}
                    className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-left text-xs text-slate-700 dark:text-slate-200 transition-colors"
                >
                    <Download size={14} className="text-purple-500 dark:text-purple-400" />
                    <div>
                        <div className="font-medium">Final Output</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">View Result</div>
                    </div>
                </button>
            </div>
        )}

        {previewImage && (
            <div 
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
                onClick={() => setPreviewImage(null)}
                style={{ cursor: 'zoom-out' }}
            >
                <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                    <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-slate-700" 
                    />
                    <button 
                        className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors bg-slate-800 p-2 rounded-full"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>
        )}

        <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full text-xs text-slate-600 dark:text-slate-400 pointer-events-none select-none transition-colors">
            {Math.round(zoom * 100)}%
        </div>
    </div>
  );
};