
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface WatermarkElement {
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bgColor: string;
  strokeSize: number;
  strokeColor: string;
  borders: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}

interface WatermarkToolProps {
  onBack: () => void;
}

const WatermarkTool: React.FC<WatermarkToolProps> = ({ onBack }) => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'processing'>('upload');
  const [activeMode, setActiveMode] = useState<'text' | 'image'>('text');
  
  const [elements, setElements] = useState<WatermarkElement[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [applyGrid, setApplyGrid] = useState(false);
  const [gridStyle, setGridStyle] = useState<'plane' | 'wavy' | 'space'>('plane');
  
  const [currentText, setCurrentText] = useState('SECURE COPY');
  const [currentFontSize, setCurrentFontSize] = useState(30);
  const [currentOpacity, setCurrentOpacity] = useState(0.4);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('transparent');
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentStroke, setCurrentStroke] = useState(0);
  const [currentStrokeColor, setCurrentStrokeColor] = useState('#80cbc4');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkImgRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [interaction, setInteraction] = useState<'none' | 'dragging' | 'resizing' | 'rotating'>('none');
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleBaseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBaseImage(event.target?.result as string);
        setActiveStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWatermarkImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl: WatermarkElement = {
          type: 'image',
          content: event.target?.result as string,
          x: 50, y: 50, width: 20, height: 20,
          rotation: 0, opacity: 0.6, fontSize: 0, fontFamily: '', color: '', bgColor: '', strokeSize: 0, strokeColor: '',
          borders: { top: false, bottom: false, left: false, right: false }
        };
        const newIdx = elements.length;
        setElements([...elements, newEl]);
        setSelectedId(newIdx);
        if(watermarkImgRef.current) watermarkImgRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    const newEl: WatermarkElement = {
      type: 'text',
      content: currentText,
      x: 50, y: 50, width: 30, height: 10,
      rotation: 0,
      opacity: currentOpacity,
      fontSize: currentFontSize,
      fontFamily: currentFont,
      color: currentColor,
      bgColor: currentBgColor,
      strokeSize: currentStroke,
      strokeColor: currentStrokeColor,
      borders: { top: false, bottom: false, left: false, right: false }
    };
    const newIdx = elements.length;
    setElements([...elements, newEl]);
    setSelectedId(newIdx);
  };

  const updateElement = (index: number, patch: Partial<WatermarkElement>) => {
    setElements(prev => prev.map((el, i) => i === index ? { ...el, ...patch } : el));
  };

  const toggleBorder = (index: number, side: keyof WatermarkElement['borders']) => {
    const el = elements[index];
    if (!el) return;
    updateElement(index, {
      borders: { ...el.borders, [side]: !el.borders[side] }
    });
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent, index: number, type: any) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(index);
    setInteraction(type);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (interaction === 'none' || selectedId === null || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = ((clientX - lastMousePos.current.x) / rect.width) * 100;
    const dy = ((clientY - lastMousePos.current.y) / rect.height) * 100;
    
    lastMousePos.current = { x: clientX, y: clientY };

    setElements(prev => prev.map((el, i) => {
      if (i !== selectedId) return el;
      if (interaction === 'dragging') {
        return { ...el, x: el.x + dx, y: el.y + dy };
      }
      if (interaction === 'resizing') {
        // Uniform resizing relative to center
        const scaleFactor = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        return { 
          ...el, 
          width: Math.max(2, el.width + scaleFactor), 
          height: Math.max(2, el.height + scaleFactor) 
        };
      }
      if (interaction === 'rotating') {
        return { ...el, rotation: el.rotation + (clientX - lastMousePos.current.x) * 0.8 };
      }
      return el;
    }));
  }, [interaction, selectedId]);

  const handleEnd = useCallback(() => {
    setInteraction('none');
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [handleMove, handleEnd]);

  const download = async () => {
    if (!baseImage) return;
    setActiveStep('processing');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainImg = new Image();
    await new Promise(resolve => { mainImg.onload = resolve; mainImg.src = baseImage; });
    canvas.width = mainImg.width;
    canvas.height = mainImg.height;
    ctx.drawImage(mainImg, 0, 0);

    const drawEl = async (el: WatermarkElement, x: number, y: number, isGridItem: boolean = false) => {
      ctx.save();
      ctx.globalAlpha = isGridItem ? Math.min(el.opacity, 0.25) : el.opacity;
      const pxX = (x / 100) * canvas.width;
      const pxY = (y / 100) * canvas.height;
      const pxW = (el.width / 100) * canvas.width;
      const pxH = (el.height / 100) * canvas.height;
      
      ctx.translate(pxX, pxY);
      // Continuous patterns usually don't rotate individual elements unless it's the master
      ctx.rotate((el.rotation * Math.PI) / 180);

      if (el.type === 'image') {
        const wImg = new Image();
        await new Promise(res => { wImg.onload = res; wImg.src = el.content; });
        ctx.drawImage(wImg, -pxW/2, -pxH/2, pxW, pxH);
      } else {
        const size = el.fontSize * (canvas.width / 1000);
        ctx.font = `bold ${size}px ${el.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const metrics = ctx.measureText(el.content);
        const textWidth = metrics.width;
        const textHeight = size;

        if (el.bgColor !== 'transparent') {
          ctx.fillStyle = el.bgColor;
          ctx.fillRect(-textWidth/2 - 8, -textHeight/2 - 4, textWidth + 16, textHeight + 8);
        }

        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.5;
        if (el.borders.top) { ctx.beginPath(); ctx.moveTo(-textWidth/2 - 8, -textHeight/2 - 4); ctx.lineTo(textWidth/2 + 8, -textHeight/2 - 4); ctx.stroke(); }
        if (el.borders.bottom) { ctx.beginPath(); ctx.moveTo(-textWidth/2 - 8, textHeight/2 + 4); ctx.lineTo(textWidth/2 + 8, textHeight/2 + 4); ctx.stroke(); }
        if (el.borders.left) { ctx.beginPath(); ctx.moveTo(-textWidth/2 - 8, -textHeight/2 - 4); ctx.lineTo(-textWidth/2 - 8, textHeight/2 + 4); ctx.stroke(); }
        if (el.borders.right) { ctx.beginPath(); ctx.moveTo(textWidth/2 + 8, -textHeight/2 - 4); ctx.lineTo(textWidth/2 + 8, textHeight/2 + 4); ctx.stroke(); }

        if (el.strokeSize > 0) {
          ctx.strokeStyle = el.strokeColor;
          ctx.lineWidth = el.strokeSize * (canvas.width / 1200);
          ctx.strokeText(el.content, 0, 0);
        }

        ctx.fillStyle = el.color;
        ctx.fillText(el.content, 0, 0);
      }
      ctx.restore();
    };

    if (applyGrid && elements.length > 0) {
      const template = elements[0];
      const stepX = gridStyle === 'space' ? 35 : (gridStyle === 'wavy' ? 18 : 22);
      const stepY = gridStyle === 'space' ? 35 : 12;
      
      for (let iy = -10; iy < 110; iy += stepY) {
        for (let ix = -10; ix < 110; ix += stepX) {
          let finalY = iy;
          let finalX = ix;
          if (gridStyle === 'wavy') finalY += Math.sin(ix * 0.15) * 6;
          else if (gridStyle === 'space' && Math.floor(iy / stepY) % 2 === 0) finalX += stepX / 2;
          await drawEl(template, finalX, finalY, true);
        }
      }
    }

    for (const el of elements) {
      await drawEl(el, el.x, el.y);
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `py7-watermark-${Date.now()}.png`;
    link.click();
    setActiveStep('edit');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Watermark Images Online</h1>
      </div>

      <div className="bg-white border py7-border-default rounded-[4px] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[680px]">
        {activeStep === 'upload' && (
          <div className="flex-1 p-24 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-stamp text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Watermark</h3>
              <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Upload Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleBaseFile} className="hidden" accept="image/*" />
            </div>
          </div>
        )}

        {activeStep !== 'upload' && (
          <>
            {/* CANVAS INTERACTIVE AREA */}
            <div className="flex-1 bg-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden" 
                 onMouseDown={() => setSelectedId(null)}
            >
              {activeStep === 'processing' && (
                <div className="absolute inset-0 z-[100] bg-white/85 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                  <i className="fas fa-cog fa-spin text-5xl text-[#3f51b5]"></i>
                  <span className="text-[12px] font-black text-[#3f51b5] uppercase tracking-[4px]">Rendering Pattern...</span>
                </div>
              )}

              <div ref={containerRef} className="relative shadow-2xl bg-white border-4 border-white select-none overflow-hidden max-w-full">
                <img src={baseImage!} className="max-h-[500px] w-auto block pointer-events-none" alt="Base" />
                
                {/* GRID PATTERN PREVIEW */}
                {applyGrid && (
                   <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {Array.from({length: 25}).map((_, row) => (
                        <div key={row} className="flex whitespace-nowrap gap-4" style={{ transform: gridStyle === 'wavy' ? `translateX(${Math.sin(row)*25}px)` : '' }}>
                           {Array.from({length: 12}).map((_, col) => (
                             <div key={col} className="text-[8px] font-black uppercase" style={{ 
                               fontFamily: elements[0]?.fontFamily || 'Arial', 
                               color: elements[0]?.color || '#000',
                               transform: `rotate(${elements[0]?.rotation || 0}deg)`
                             }}>
                               {elements[0]?.type === 'image' ? <img src={elements[0].content} className="w-8 h-8 object-contain" /> : (elements[0]?.content || 'SECURE')}
                             </div>
                           ))}
                        </div>
                      ))}
                   </div>
                )}

                {/* INTERACTIVE ELEMENTS */}
                {elements.map((el, idx) => (
                  <div 
                    key={idx}
                    onMouseDown={(e) => handleStart(e, idx, 'dragging')}
                    onTouchStart={(e) => handleStart(e, idx, 'dragging')}
                    className={`absolute z-40 flex items-center justify-center cursor-move transition-all ${selectedId === idx ? 'ring-2 ring-orange-500 ring-offset-2 bg-[#3f51b5]/5 shadow-lg' : 'hover:ring-1 hover:ring-indigo-200'}`}
                    style={{ 
                      left: `${el.x}%`, top: `${el.y}%`, 
                      width: `${el.width}%`, height: `${el.height}%`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                      opacity: el.opacity,
                      backgroundColor: el.bgColor,
                      borderTop: el.borders.top ? `2px solid ${el.color}` : 'none',
                      borderBottom: el.borders.bottom ? `2px solid ${el.color}` : 'none',
                      borderLeft: el.borders.left ? `2px solid ${el.color}` : 'none',
                      borderRight: el.borders.right ? `2px solid ${el.color}` : 'none',
                    }}
                  >
                    {el.type === 'image' ? (
                      <img src={el.content} className="w-full h-full object-contain pointer-events-none" />
                    ) : (
                      <span className="pointer-events-none select-none" style={{ 
                          color: el.color, 
                          fontSize: `${el.fontSize * (400/1000)}px`, 
                          fontFamily: el.fontFamily,
                          whiteSpace: 'nowrap',
                          fontWeight: 'bold',
                          WebkitTextStroke: el.strokeSize > 0 ? `${el.strokeSize/3}px ${el.strokeColor}` : 'none'
                        }}
                      >
                        {el.content}
                      </span>
                    )}

                    {selectedId === idx && (
                      <>
                        <div onMouseDown={(e) => handleStart(e, idx, 'resizing')} onTouchStart={(e) => handleStart(e, idx, 'resizing')} className="absolute -top-3 -left-3 w-6 h-6 bg-white border-2 border-orange-500 rounded-sm cursor-nwse-resize shadow-lg z-50"></div>
                        <div onMouseDown={(e) => handleStart(e, idx, 'resizing')} onTouchStart={(e) => handleStart(e, idx, 'resizing')} className="absolute -top-3 -right-3 w-6 h-6 bg-white border-2 border-orange-500 rounded-sm cursor-nesw-resize shadow-lg z-50"></div>
                        <div onMouseDown={(e) => handleStart(e, idx, 'resizing')} onTouchStart={(e) => handleStart(e, idx, 'resizing')} className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border-2 border-orange-500 rounded-sm cursor-nesw-resize shadow-lg z-50"></div>
                        <div onMouseDown={(e) => handleStart(e, idx, 'resizing')} onTouchStart={(e) => handleStart(e, idx, 'resizing')} className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-orange-500 rounded-sm cursor-nwse-resize shadow-lg z-50"></div>
                        <div onMouseDown={(e) => handleStart(e, idx, 'rotating')} onTouchStart={(e) => handleStart(e, idx, 'rotating')} className="absolute -top-12 left-1/2 -translate-x-1/2 w-9 h-9 bg-orange-500 text-white rounded-full flex items-center justify-center cursor-alias shadow-xl border-2 border-white z-50">
                           <i className="fas fa-sync-alt text-xs"></i>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setElements(elements.filter((_, i) => i !== idx)); setSelectedId(null); }}
                          className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-4 py-2 rounded-full uppercase font-black shadow-xl hover:bg-red-700 transition-colors z-50 whitespace-nowrap"
                        >
                          <i className="fas fa-trash mr-1"></i> Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-10 flex flex-col items-center gap-2">
                 <button onClick={download} className="px-14 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[4px] shadow-2xl hover:bg-[#1a237e] transition-all">Export Image</button>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-4 px-4 py-2 rounded-full border py7-border-default shadow-sm bg-white">
                    <i className="fas fa-hand-point-up text-[#3f51b5]"></i> Click any element to drag, resize or rotate it.
                 </p>
              </div>
            </div>

            {/* CONTROL PANEL */}
            <div className="w-full md:w-96 p-6 flex flex-col bg-white border-l py7-border-default h-full overflow-y-auto custom-scrollbar shadow-inner">
               <div className="flex bg-slate-50 rounded-md p-1 mb-8 border py7-border-default">
                  <button onClick={() => setActiveMode('image')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-[4px] flex items-center justify-center gap-2 transition-all ${activeMode === 'image' ? 'bg-white text-[#3f51b5] shadow-sm' : 'text-slate-400'}`}>
                    <i className="fas fa-image"></i> Logo
                  </button>
                  <button onClick={() => setActiveMode('text')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-[4px] flex items-center justify-center gap-2 transition-all ${activeMode === 'text' ? 'bg-white text-[#3f51b5] shadow-sm' : 'text-slate-400'}`}>
                    <i className="fas fa-font"></i> Text
                  </button>
               </div>

               {activeMode === 'text' ? (
                 <div className="space-y-8 animate-in slide-in-from-right-3 duration-300">
                    <div className="flex gap-2">
                      <input 
                        type="text" value={currentText} onChange={(e) => { setCurrentText(e.target.value); if(selectedId!==null && elements[selectedId].type==='text') updateElement(selectedId, {content: e.target.value}); }} 
                        className="flex-1 px-4 py-3 border py7-border-default rounded-sm text-xs font-bold outline-none focus:border-[#3f51b5] shadow-inner" placeholder="Enter Text..." 
                      />
                      <button onClick={handleAddText} className="px-5 bg-[#009688] text-white rounded-sm font-black text-[10px] uppercase shadow-lg">Add</button>
                    </div>

                    <div className="space-y-6">
                       <div className="p-5 bg-indigo-50/40 border-2 border-[#c5cae9] rounded-[8px] space-y-4">
                          <label className="flex items-center gap-3 cursor-pointer group">
                             <input type="checkbox" checked={applyGrid} onChange={() => setApplyGrid(!applyGrid)} className="w-5 h-5 accent-[#3f51b5]" />
                             <span className="text-[11px] font-black uppercase text-slate-800 tracking-tight group-hover:text-[#3f51b5]">Professional Grid</span>
                          </label>

                          {applyGrid && (
                            <div className="flex gap-1.5 animate-in slide-in-from-top-3 duration-300">
                               {['plane', 'wavy', 'space'].map(s => (
                                 <button key={s} onClick={() => setGridStyle(s as any)} className={`flex-1 py-2 rounded-sm border-2 text-[9px] font-black uppercase tracking-widest transition-all ${gridStyle === s ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-white text-slate-400 border-slate-200'}`}>
                                    {s}
                                 </button>
                               ))}
                            </div>
                          )}
                       </div>

                       <div className="space-y-4">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase text-slate-400">Font Family</p>
                             <select value={currentFont} onChange={(e) => { setCurrentFont(e.target.value); if(selectedId !== null) updateElement(selectedId, { fontFamily: e.target.value }); }} className="w-full px-3 py-3 border py7-border-default rounded-sm text-xs font-bold shadow-sm">
                                <option>Arial</option>
                                <option>Times New Roman</option>
                                <option>Courier New</option>
                                <option>Great Vibes</option>
                                <option>Dancing Script</option>
                             </select>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                                   <span>Size</span> 
                                   <span className="text-slate-800">{currentFontSize}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <button onClick={() => { const v = Math.max(5, currentFontSize-5); setCurrentFontSize(v); if(selectedId!==null) updateElement(selectedId,{fontSize:v}); }} className="w-9 h-9 border py7-border-default rounded-sm bg-white shadow-sm">-</button>
                                   <button onClick={() => { const v = currentFontSize+5; setCurrentFontSize(v); if(selectedId!==null) updateElement(selectedId,{fontSize:v}); }} className="w-9 h-9 border py7-border-default rounded-sm bg-white shadow-sm">+</button>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                                   <span>Opacity</span> 
                                   <span className="text-slate-800">{Math.round(currentOpacity*100)}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <button onClick={() => { const v = Math.max(0.1, currentOpacity-0.1); setCurrentOpacity(v); if(selectedId!==null) updateElement(selectedId,{opacity:v}); }} className="w-9 h-9 border py7-border-default rounded-sm bg-white shadow-sm">-</button>
                                   <button onClick={() => { const v = Math.min(1, currentOpacity+0.1); setCurrentOpacity(v); if(selectedId!==null) updateElement(selectedId,{opacity:v}); }} className="w-9 h-9 border py7-border-default rounded-sm bg-white shadow-sm">+</button>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-3">
                             <p className="text-[9px] font-black uppercase text-slate-400">Border Controls</p>
                             <div className="flex border-2 py7-border-default rounded-sm overflow-hidden text-[10px] font-black uppercase bg-white">
                                {[
                                  { id: 'top', label: 'Top' },
                                  { id: 'bottom', label: 'Bottom' },
                                  { id: 'left', label: 'Left' },
                                  { id: 'right', label: 'Right' }
                                ].map(s => (
                                  <button 
                                   key={s.id}
                                   onClick={() => selectedId !== null && toggleBorder(selectedId, s.id as any)}
                                   className={`flex-1 py-3 border-r py7-border-default last:border-0 transition-colors ${selectedId !== null && elements[selectedId].borders[s.id as keyof WatermarkElement['borders']] ? 'bg-[#3f51b5] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-3 border-t pt-6 py7-border-default">
                             <p className="text-[9px] font-black uppercase text-slate-400">Color Palette</p>
                             <div className="flex flex-wrap gap-2.5">
                                {['#000000', '#f44336', '#3f51b5', '#009688', '#ff9800', '#ffffff'].map(c => (
                                  <button key={c} onClick={() => { setCurrentColor(c); if(selectedId!==null) updateElement(selectedId, { color: c }); }} className={`w-8 h-8 rounded-full border-2 transition-transform ${currentColor === c ? 'border-orange-500 scale-110 shadow-md' : 'border-slate-100'}`} style={{ backgroundColor: c }} />
                                ))}
                                <input type="color" value={currentColor} onChange={(e) => { setCurrentColor(e.target.value); if(selectedId!==null) updateElement(selectedId, { color: e.target.value }); }} className="w-8 h-8 rounded-full cursor-pointer border-2 border-slate-100" />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-8 animate-in slide-in-from-right-3 duration-300">
                    <div 
                      onClick={() => watermarkImgRef.current?.click()} 
                      className="border-2 border-dashed border-indigo-200 rounded-[8px] p-16 text-center hover:bg-indigo-50/50 cursor-pointer transition-all flex flex-col items-center group bg-slate-50/50 shadow-inner"
                    >
                       <i className="fas fa-file-upload text-5xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
                       <p className="text-[12px] font-black uppercase text-slate-600 tracking-widest">Select Brand Logo</p>
                       <input type="file" ref={watermarkImgRef} onChange={handleAddWatermarkImage} className="hidden" accept="image/*" />
                    </div>

                    {selectedId !== null && elements[selectedId].type === 'image' && (
                       <div className="space-y-8">
                          <div className="p-6 bg-slate-50 border-2 py7-border-default rounded-[8px] space-y-4 shadow-sm">
                             <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-700">
                                <span>Logo Opacity</span>
                                <span className="bg-white px-2 py-0.5 border rounded-sm">{Math.round(elements[selectedId].opacity * 100)}%</span>
                             </div>
                             <input 
                                type="range" min="0" max="1" step="0.05" value={elements[selectedId].opacity} 
                                onChange={(e) => updateElement(selectedId, { opacity: parseFloat(e.target.value) })}
                                className="w-full accent-[#3f51b5] h-2 cursor-pointer"
                             />
                          </div>
                          
                          <div className="p-6 border-2 py7-border-default rounded-[8px] space-y-4 bg-white shadow-sm">
                             <label className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" checked={applyGrid} onChange={() => setApplyGrid(!applyGrid)} className="w-5 h-5 accent-[#3f51b5]" />
                                <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight group-hover:text-[#3f51b5]">Tile Logo Pattern</span>
                             </label>
                          </div>
                       </div>
                    )}
                 </div>
               )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WatermarkTool;
