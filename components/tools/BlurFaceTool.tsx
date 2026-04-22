
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface BlurZone {
  id: string;
  x: number; // Percent
  y: number; // Percent
  width: number; // Percent
  height: number; // Percent
  shape: 'rectangle' | 'ellipse';
  mode: 'blur' | 'pixelate';
  factor: number;
}

interface BlurFaceToolProps {
  onBack: () => void;
}

const BlurFaceTool: React.FC<BlurFaceToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'download'>('upload');
  
  // Workspace Controls
  const [mode, setMode] = useState<'blur' | 'pixelate'>('blur');
  const [factor, setFactor] = useState(50);
  const [isManual, setIsManual] = useState(true);
  const [shape, setShape] = useState<'rectangle' | 'ellipse'>('ellipse');
  
  // Interaction State
  const [zones, setZones] = useState<BlurZone[]>([]);
  const [history, setHistory] = useState<BlurZone[][]>([]);
  const [redoStack, setRedoStack] = useState<BlurZone[][]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  
  const [interaction, setInteraction] = useState<'none' | 'drawing' | 'dragging' | 'resizing'>('none');
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [drawingZone, setDrawingZone] = useState<{ startX: number; startY: number; curX: number; curY: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setActiveStep('edit');
        setZones([]);
        setHistory([]);
        setRedoStack([]);
        setSelectedZoneId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const pushToHistory = (newZones: BlurZone[]) => {
    setHistory(prev => [...prev, zones]);
    setZones(newZones);
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(stack => [...stack, zones]);
    setZones(prev);
    setHistory(h => h.slice(0, -1));
    setSelectedZoneId(null);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(h => [...h, zones]);
    setZones(next);
    setRedoStack(s => s.slice(0, -1));
    setSelectedZoneId(null);
  };

  const removeZone = (id: string) => {
    pushToHistory(zones.filter(z => z.id !== id));
    if (selectedZoneId === id) setSelectedZoneId(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isManual || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // Check if we clicked a handle of the selected zone
    if (selectedZoneId) {
      const activeZone = zones.find(z => z.id === selectedZoneId);
      if (activeZone) {
        const hSize = 2; // Handle size sensitivity in %
        const isNear = (px: number, py: number) => Math.abs(x - px) < hSize && Math.abs(y - py) < hSize;
        
        if (isNear(activeZone.x, activeZone.y)) { setInteraction('resizing'); setResizeHandle('nw'); return; }
        if (isNear(activeZone.x + activeZone.width, activeZone.y)) { setInteraction('resizing'); setResizeHandle('ne'); return; }
        if (isNear(activeZone.x, activeZone.y + activeZone.height)) { setInteraction('resizing'); setResizeHandle('sw'); return; }
        if (isNear(activeZone.x + activeZone.width, activeZone.y + activeZone.height)) { setInteraction('resizing'); setResizeHandle('se'); return; }
        
        // Check if dragging inside
        if (x > activeZone.x && x < activeZone.x + activeZone.width && y > activeZone.y && y < activeZone.y + activeZone.height) {
          setInteraction('dragging');
          return;
        }
      }
    }

    // Check if clicking another existing zone to select it
    const clickedZone = [...zones].reverse().find(z => 
      x > z.x && x < z.x + z.width && y > z.y && y < z.y + z.height
    );
    if (clickedZone) {
      setSelectedZoneId(clickedZone.id);
      setInteraction('dragging');
      return;
    }

    // Otherwise, start drawing new zone
    setSelectedZoneId(null);
    setInteraction('drawing');
    setDrawingZone({ startX: x, startY: y, curX: x, curY: y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (interaction === 'none' || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const dx = ((e.clientX - lastMousePos.current.x) / rect.width) * 100;
    const dy = ((e.clientY - lastMousePos.current.y) / rect.height) * 100;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    if (interaction === 'drawing') {
      setDrawingZone(prev => prev ? { ...prev, curX: x, curY: y } : null);
    } else if (interaction === 'dragging' && selectedZoneId) {
      setZones(prev => prev.map(z => z.id === selectedZoneId ? {
        ...z,
        x: Math.max(0, Math.min(100 - z.width, z.x + dx)),
        y: Math.max(0, Math.min(100 - z.height, z.y + dy))
      } : z));
    } else if (interaction === 'resizing' && selectedZoneId && resizeHandle) {
      setZones(prev => prev.map(z => {
        if (z.id !== selectedZoneId) return z;
        let { x: nx, y: ny, width: nw, height: nh } = z;
        if (resizeHandle === 'nw') { nx += dx; ny += dy; nw -= dx; nh -= dy; }
        else if (resizeHandle === 'ne') { ny += dy; nw += dx; nh -= dy; }
        else if (resizeHandle === 'sw') { nx += dx; nw -= dx; nh += dy; }
        else if (resizeHandle === 'se') { nw += dx; nh += dy; }
        
        // Minimum size constraints
        if (nw < 2) nw = 2;
        if (nh < 2) nh = 2;

        return { ...z, x: nx, y: ny, width: nw, height: nh };
      }));
    }
  };

  const handleMouseUp = () => {
    if (interaction === 'drawing' && drawingZone) {
      const width = Math.abs(drawingZone.curX - drawingZone.startX);
      const height = Math.abs(drawingZone.curY - drawingZone.startY);
      
      if (width > 1 && height > 1) {
        const newZone: BlurZone = {
          id: Math.random().toString(36).substr(2, 9),
          x: Math.min(drawingZone.startX, drawingZone.curX),
          y: Math.min(drawingZone.startY, drawingZone.curY),
          width,
          height,
          shape,
          mode,
          factor
        };
        pushToHistory([...zones, newZone]);
        setSelectedZoneId(newZone.id);
      }
      setDrawingZone(null);
    } else if (interaction === 'dragging' || interaction === 'resizing') {
      // Just save the state change for history if we implemented continuous history, 
      // but here we just settle the interaction
    }
    setInteraction('none');
    setResizeHandle(null);
  };

  const processOutput = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = selectedImage!;
    await new Promise(res => img.onload = res);
    
    canvas.width = img.width;
    canvas.height = img.height;
    if (!ctx) return '';

    // Draw base image
    ctx.drawImage(img, 0, 0);

    for (const zone of zones) {
      const zX = (zone.x / 100) * canvas.width;
      const zY = (zone.y / 100) * canvas.height;
      const zW = (zone.width / 100) * canvas.width;
      const zH = (zone.height / 100) * canvas.height;

      // Extract area
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = zW;
      tempCanvas.height = zH;
      const tCtx = tempCanvas.getContext('2d');
      if (!tCtx) continue;

      tCtx.drawImage(canvas, zX, zY, zW, zH, 0, 0, zW, zH);

      if (zone.mode === 'blur') {
        tCtx.filter = `blur(${zone.factor / 3}px)`;
        tCtx.drawImage(tempCanvas, 0, 0);
      } else {
        // Pixelate logic
        const pSize = Math.max(2, Math.floor(zone.factor / 4));
        const pCanvas = document.createElement('canvas');
        pCanvas.width = zW / pSize;
        pCanvas.height = zH / pSize;
        const pCtx = pCanvas.getContext('2d');
        if (pCtx) {
          pCtx.imageSmoothingEnabled = false;
          pCtx.drawImage(tempCanvas, 0, 0, zW, zH, 0, 0, pCanvas.width, pCanvas.height);
          tCtx.imageSmoothingEnabled = false;
          tCtx.drawImage(pCanvas, 0, 0, pCanvas.width, pCanvas.height, 0, 0, zW, zH);
        }
      }

      // Draw back with clip
      ctx.save();
      ctx.beginPath();
      if (zone.shape === 'ellipse') {
        ctx.ellipse(zX + zW / 2, zY + zH / 2, zW / 2, zH / 2, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(zX, zY, zW, zH);
      }
      ctx.clip();
      ctx.drawImage(tempCanvas, zX, zY);
      ctx.restore();
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const download = async () => {
    const data = await processOutput();
    const link = document.createElement('a');
    link.href = data;
    link.download = `py7-blur-face-${Date.now()}.jpg`;
    link.click();
    setActiveStep('download');
  };

  const reset = () => {
    setSelectedImage(null);
    setZones([]);
    setActiveStep('upload');
    setSelectedZoneId(null);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Blur Face Online</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Welcome to Py7 Image Tool - Your Reliable Solution to Blur Faces in Photos Instantly & Securely!</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Workspace Area */}
        <div className="flex-1 bg-white p-6 md:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r py7-border-default relative">
          {activeStep === 'upload' ? (
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-lg border-2 border-dashed border-[#c5cae9] rounded-[8px] p-16 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center shadow-inner">
              <i className="fas fa-user-secret text-6xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-1">Select Image to Blur Faces</h3>
              <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl">Select Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              <div 
                ref={containerRef}
                className={`relative shadow-2xl border-4 border-white overflow-hidden bg-slate-50 select-none ${interaction === 'resizing' ? 'cursor-nwse-resize' : interaction === 'dragging' ? 'cursor-move' : 'cursor-crosshair'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img ref={imageRef} src={selectedImage!} className="max-h-[550px] w-auto block pointer-events-none" alt="Edit" />
                
                {/* Zones Overlay */}
                {zones.map(z => (
                  <div 
                    key={z.id}
                    className={`absolute group z-20 ${selectedZoneId === z.id ? 'ring-2 ring-[#3f51b5] ring-offset-1 shadow-2xl' : 'hover:ring-1 hover:ring-indigo-300'}`}
                    style={{ 
                      left: `${z.x}%`, top: `${z.y}%`, width: `${z.width}%`, height: `${z.height}%`,
                      borderRadius: z.shape === 'ellipse' ? '50%' : '0',
                      boxShadow: selectedZoneId === z.id ? 'inset 0 0 0 2px #3f51b5' : 'inset 0 0 0 1px rgba(63, 81, 181, 0.4)',
                      backdropFilter: z.mode === 'blur' ? `blur(${z.factor/8}px)` : 'none',
                      backgroundColor: z.mode === 'pixelate' ? 'rgba(0,0,0,0.1)' : 'transparent',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Pixelate Visual Sim */}
                    {z.mode === 'pixelate' && (
                        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: `${Math.max(4, z.factor/5)}px ${Math.max(4, z.factor/5)}px` }}></div>
                    )}
                    
                    {/* Corner Handles for resizing (only visible when selected) */}
                    {selectedZoneId === z.id && (
                      <>
                        <div className="absolute top-0 left-0 w-3 h-3 bg-[#3f51b5] border border-white cursor-nw-resize"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 bg-[#3f51b5] border border-white cursor-ne-resize"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 bg-[#3f51b5] border border-white cursor-sw-resize"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#3f51b5] border border-white cursor-se-resize"></div>
                      </>
                    )}

                    <button 
                      onClick={(e) => { e.stopPropagation(); removeZone(z.id); }}
                      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800/80 text-white rounded-full flex items-center justify-center transition-opacity ${selectedZoneId === z.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                  </div>
                ))}

                {/* Active Drawing Preview */}
                {drawingZone && (
                  <div 
                    className="absolute border-2 border-[#3f51b5] border-dashed bg-[#3f51b5]/10 pointer-events-none z-30"
                    style={{
                      left: `${Math.min(drawingZone.startX, drawingZone.curX)}%`,
                      top: `${Math.min(drawingZone.startY, drawingZone.curY)}%`,
                      width: `${Math.abs(drawingZone.curX - drawingZone.startX)}%`,
                      height: `${Math.abs(drawingZone.curY - drawingZone.startY)}%`,
                      borderRadius: shape === 'ellipse' ? '50%' : '0'
                    }}
                  />
                )}
              </div>
              <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                Click and drag to draw. Click a shape to move or resize it from corners.
              </p>
            </div>
          )}
        </div>

        {/* Controls Sidebar */}
        <div className="w-full md:w-[380px] bg-[#d3d3d3] p-8 flex flex-col justify-between shadow-inner">
          <div className="space-y-8">
            {activeStep === 'download' && (
                <div className="flex flex-col items-center gap-2 mb-6 animate-in slide-in-from-top-4 duration-500">
                    <i className="fas fa-check-circle text-4xl text-green-500"></i>
                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Faces Hidden</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Document ready for download</p>
                </div>
            )}

            <div className="flex gap-6 justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={mode === 'blur'} onChange={() => setMode('blur')} className="w-4 h-4 accent-[#3f51b5]" />
                <span className={`text-[12px] font-bold ${mode === 'blur' ? 'text-slate-800' : 'text-slate-500'}`}>Blur</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={mode === 'pixelate'} onChange={() => setMode('pixelate')} className="w-4 h-4 accent-[#3f51b5]" />
                <span className={`text-[12px] font-bold ${mode === 'pixelate' ? 'text-slate-800' : 'text-slate-500'}`}>Pixelate</span>
              </label>
            </div>

            <div className="space-y-4">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Blur Factor:</span>
              <input type="range" min="0" max="100" value={factor} onChange={(e) => {
                const val = parseInt(e.target.value);
                setFactor(val);
                if (selectedZoneId) {
                  setZones(prev => prev.map(z => z.id === selectedZoneId ? { ...z, factor: val } : z));
                }
              }} className="w-full accent-[#3f51b5]" />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-400/20">
              <label className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setIsManual(!isManual)}>
                <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all bg-white ${isManual ? 'border-[#3f51b5]' : 'border-slate-300'}`}>
                   {isManual && <i className="fas fa-check text-[#3f51b5] text-[10px]"></i>}
                </div>
                <span className="text-[12px] font-bold text-slate-700 uppercase">Manually Blur Image</span>
              </label>

              {isManual && (
                <div className="flex gap-6 justify-center pl-8 animate-in slide-in-from-left-2 duration-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={shape === 'rectangle'} onChange={() => {
                      setShape('rectangle');
                      if (selectedZoneId) {
                        setZones(prev => prev.map(z => z.id === selectedZoneId ? { ...z, shape: 'rectangle' } : z));
                      }
                    }} className="w-4 h-4 accent-[#3f51b5]" />
                    <span className="text-[11px] font-bold text-slate-600">Rectangle</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={shape === 'ellipse'} onChange={() => {
                      setShape('ellipse');
                      if (selectedZoneId) {
                        setZones(prev => prev.map(z => z.id === selectedZoneId ? { ...z, shape: 'ellipse' } : z));
                      }
                    }} className="w-4 h-4 accent-[#3f51b5]" />
                    <span className="text-[11px] font-bold text-slate-600">Ellipse</span>
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6">
               <button onClick={undo} disabled={history.length === 0} className="py-2 bg-slate-100 hover:bg-white border border-slate-300 text-slate-600 rounded-sm text-[10px] font-black uppercase flex items-center justify-center gap-2 disabled:opacity-40">
                 <i className="fas fa-rotate-left"></i> Undo
               </button>
               <button onClick={redo} disabled={redoStack.length === 0} className="py-2 bg-slate-100 hover:bg-white border border-slate-300 text-slate-600 rounded-sm text-[10px] font-black uppercase flex items-center justify-center gap-2 disabled:opacity-40">
                 <i className="fas fa-rotate-right"></i> Redo
               </button>
            </div>
          </div>

          <div className="space-y-3 pt-12">
            <button onClick={download} disabled={zones.length === 0} className="w-full py-3 bg-[#3f51b5] text-white rounded-sm font-bold text-[13px] uppercase tracking-widest shadow-xl hover:bg-[#1a237e] transition-all disabled:opacity-50">
              Download
            </button>
            <button onClick={reset} className="w-full py-3 bg-[#f8f9fb] border py7-border-default text-[#3f51b5] rounded-sm font-bold text-[12px] uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> Blur New Image
            </button>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center space-y-12">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
        <div className="flex justify-center gap-10 text-slate-200">
           <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center hover:border-[#3f51b5] hover:text-[#3f51b5] transition-all shadow-sm cursor-pointer"><i className="fab fa-linkedin-in text-lg"></i></div>
           <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center hover:border-[#3f51b5] hover:text-[#3f51b5] transition-all shadow-sm cursor-pointer"><i className="fab fa-twitter text-lg"></i></div>
           <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-all shadow-sm"><i className="fab fa-whatsapp text-lg"></i></a>
        </div>
      </div>
    </div>
  );
};

export default BlurFaceTool;
