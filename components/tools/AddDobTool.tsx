
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ElementState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  text: string;
  fontSize: number;
  color: string;
}

interface AddDobToolProps {
  onBack: () => void;
}

const AddDobTool: React.FC<AddDobToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'processing' | 'download'>('upload');
  
  const [addExtraSpace, setAddExtraSpace] = useState(false);
  const [nameState, setNameState] = useState<ElementState>({
    x: 50, y: 75, scale: 1, rotation: 0, text: 'John Doe', fontSize: 24, color: '#000000'
  });
  const [dateState, setDateState] = useState<ElementState>({
    x: 50, y: 85, scale: 1, rotation: 0, text: '01-01-2000', fontSize: 18, color: '#000000'
  });

  const [selectedId, setSelectedId] = useState<'name' | 'date' | null>(null);
  const [interaction, setInteraction] = useState<'none' | 'dragging' | 'resizing' | 'rotating'>('none');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [cropInteraction, setCropInteraction] = useState<'none' | 'dragging' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setActiveStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateFinal = useCallback(async () => {
    if (!selectedImage) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    await new Promise((resolve) => { img.onload = resolve; img.src = selectedImage; });

    const extraH = addExtraSpace ? (img.height * 0.15) : 0;
    canvas.width = img.width;
    canvas.height = img.height + extraH;

    if (addExtraSpace) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0);

    const drawEl = (el: ElementState) => {
      ctx.save();
      const pxX = (el.x / 100) * canvas.width;
      const pxY = (el.y / 100) * canvas.height;
      ctx.translate(pxX, pxY);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.scale(el.scale, el.scale);
      ctx.fillStyle = el.color;
      ctx.textAlign = 'center';
      ctx.font = `bold ${el.fontSize * (canvas.width / 400)}px sans-serif`;
      ctx.fillText(el.text, 0, 0);
      ctx.restore();
    };

    drawEl(nameState);
    drawEl(dateState);
    setProcessedPreview(canvas.toDataURL('image/jpeg', 0.95));
  }, [selectedImage, addExtraSpace, nameState, dateState]);

  useEffect(() => {
    if (activeStep === 'edit' && selectedImage) {
      generateFinal();
    }
  }, [activeStep, selectedImage, generateFinal]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent, id: 'name' | 'date', type: any) => {
    e.stopPropagation();
    setSelectedId(id);
    setInteraction(type);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (interaction === 'none' || !selectedId) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastMousePos.current.x;
    const dy = clientY - lastMousePos.current.y;
    lastMousePos.current = { x: clientX, y: clientY };

    const update = selectedId === 'name' ? setNameState : setDateState;

    update(prev => {
      if (interaction === 'dragging') return { ...prev, x: prev.x + (dx / 5), y: prev.y + (dy / 5) };
      if (interaction === 'resizing') return { ...prev, scale: Math.max(0.1, prev.scale + (dx + dy) / 200) };
      if (interaction === 'rotating') return { ...prev, rotation: prev.rotation + (dx * 0.5) };
      return prev;
    });
  }, [interaction, selectedId]);

  const handleEnd = useCallback(() => setInteraction('none'), []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [handleMove, handleEnd]);

  const applyCrop = async () => {
    if (!selectedImage) return;
    const img = new Image();
    const croppedDataUrl = await new Promise<string>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const sX = (cropBox.x / 100) * img.width;
        const sY = (cropBox.y / 100) * img.height;
        const sW = (cropBox.width / 100) * img.width;
        const sH = (cropBox.height / 100) * img.height;
        canvas.width = sW; canvas.height = sH;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, sX, sY, sW, sH, 0, 0, sW, sH);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = selectedImage;
    });
    setSelectedImage(croppedDataUrl);
    setIsCropModalOpen(false);
  };

  const updateState = (id: 'name' | 'date', partial: Partial<ElementState>) => {
    if (id === 'name') setNameState(prev => ({...prev, ...partial}));
    else setDateState(prev => ({...prev, ...partial}));
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Add Name & DOB - Interactive Pad</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">MS Word Style Editing - Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden min-h-[600px] flex flex-col items-stretch">
        
        {activeStep === 'upload' && (
          <div className="flex-1 p-16 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[#c5cae9] rounded-[6px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-file-signature text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Edit</h3>
              <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Choose Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
        )}

        {(activeStep === 'edit' || activeStep === 'download' || activeStep === 'processing') && selectedImage && (
          <div className="flex flex-col md:flex-row w-full flex-1">
            <div className="flex-1 bg-slate-100 p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden" onClick={() => setSelectedId(null)}>
              {activeStep === 'processing' && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <i className="fas fa-circle-notch fa-spin text-4xl text-[#3f51b5]"></i>
                  <span className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">Generating HD Output...</span>
                </div>
              )}

              <div className="relative shadow-2xl bg-white border-4 border-white select-none group">
                <div className="relative flex flex-col overflow-hidden">
                    <img src={selectedImage} className="max-h-[500px] w-auto block" alt="Source" />
                    {addExtraSpace && <div className="bg-white w-full h-[80px]"></div>}
                </div>

                {activeStep === 'edit' && (
                  <>
                    {[
                      { id: 'name', state: nameState },
                      { id: 'date', state: dateState }
                    ].map(({ id, state }) => (
                      <div 
                        key={id}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(id as any); }}
                        onMouseDown={(e) => handleStart(e, id as any, 'dragging')}
                        className={`absolute z-30 flex items-center justify-center cursor-move transition-shadow ${selectedId === id ? 'ring-2 ring-[#3f51b5] ring-offset-2' : 'hover:ring-1 hover:ring-indigo-200'}`}
                        style={{ 
                          left: `${state.x}%`, top: `${state.y}%`, 
                          transform: `translate(-50%, -50%) scale(${state.scale}) rotate(${state.rotation}deg)`,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ color: state.color, fontSize: `${state.fontSize}px`, fontWeight: id === 'name' ? 'bold' : 'normal', fontFamily: 'sans-serif' }}>
                          {state.text}
                        </span>

                        {selectedId === id && (
                          <>
                            <div onMouseDown={(e) => handleStart(e, id as any, 'resizing')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3f51b5] rounded-full cursor-nwse-resize shadow-md"></div>
                            <div onMouseDown={(e) => handleStart(e, id as any, 'resizing')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3f51b5] rounded-full cursor-nesw-resize shadow-md"></div>
                            <div onMouseDown={(e) => handleStart(e, id as any, 'resizing')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#3f51b5] rounded-full cursor-nesw-resize shadow-md"></div>
                            <div onMouseDown={(e) => handleStart(e, id as any, 'resizing')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#3f51b5] rounded-full cursor-nwse-resize shadow-md"></div>
                            <div onMouseDown={(e) => handleStart(e, id as any, 'rotating')} className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#3f51b5] text-white rounded-full flex items-center justify-center cursor-alias shadow-xl border-2 border-white">
                               <i className="fas fa-rotate text-[10px]"></i>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="w-full md:w-96 p-8 flex flex-col justify-between bg-white border-l py7-border-default shadow-inner overflow-y-auto">
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b-2 py7-border-default pb-3">
                    <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Configuration</h3>
                    <button onClick={() => setIsCropModalOpen(true)} className="px-3 py-1.5 bg-indigo-50 text-[#3f51b5] rounded-sm text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors">
                        <i className="fas fa-crop mr-2"></i> Crop
                    </button>
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={addExtraSpace} onChange={() => setAddExtraSpace(!addExtraSpace)} className="w-4 h-4 accent-[#3f51b5]" />
                  <span className={`text-[11px] font-black uppercase tracking-widest ${addExtraSpace ? 'text-[#3f51b5]' : 'text-slate-400'}`}>Add Extra White Margin</span>
                </label>

                {/* Name Config Card */}
                <div className={`p-5 rounded-[8px] border-2 transition-all ${selectedId === 'name' ? 'bg-indigo-50/40 border-[#3f51b5] ring-4 ring-indigo-50' : 'bg-slate-50 border-transparent'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                      Name Settings
                      {selectedId === 'name' && <i className="fas fa-hand-pointer text-[#3f51b5] animate-bounce"></i>}
                    </p>
                    <div className="space-y-4">
                        <input type="text" value={nameState.text} onChange={(e) => updateState('name', {text: e.target.value})} onFocus={() => setSelectedId('name')} className="w-full px-3 py-2 text-xs font-bold border rounded-[4px] outline-none focus:border-[#3f51b5]" placeholder="Type name..." />
                        <div className="flex items-center gap-3">
                           <div className="flex-1 flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400">ROTATION</span>
                              <input type="range" min="-180" max="180" value={nameState.rotation} onChange={(e) => updateState('name', {rotation: parseInt(e.target.value)})} className="w-full accent-[#3f51b5] h-1" />
                           </div>
                           <div className="w-12 flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400">SIZE</span>
                              <input type="number" value={nameState.fontSize} onChange={(e) => updateState('name', {fontSize: parseInt(e.target.value) || 12})} className="w-full px-1 py-1 text-center text-[10px] font-black border rounded-sm" />
                           </div>
                           <input type="color" value={nameState.color} onChange={(e) => updateState('name', {color: e.target.value})} className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm" />
                        </div>
                    </div>
                </div>

                {/* Date Config Card */}
                <div className={`p-5 rounded-[8px] border-2 transition-all ${selectedId === 'date' ? 'bg-indigo-50/40 border-[#3f51b5] ring-4 ring-indigo-50' : 'bg-slate-50 border-transparent'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                      Date Settings
                      {selectedId === 'date' && <i className="fas fa-hand-pointer text-[#3f51b5] animate-bounce"></i>}
                    </p>
                    <div className="space-y-4">
                        <input type="text" value={dateState.text} onChange={(e) => updateState('date', {text: e.target.value})} onFocus={() => setSelectedId('date')} className="w-full px-3 py-2 text-xs font-bold border rounded-[4px] outline-none focus:border-[#3f51b5]" placeholder="Type date..." />
                        <div className="flex items-center gap-3">
                           <div className="flex-1 flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400">ROTATION</span>
                              <input type="range" min="-180" max="180" value={dateState.rotation} onChange={(e) => updateState('date', {rotation: parseInt(e.target.value)})} className="w-full accent-[#3f51b5] h-1" />
                           </div>
                           <div className="w-12 flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400">SIZE</span>
                              <input type="number" value={dateState.fontSize} onChange={(e) => updateState('date', {fontSize: parseInt(e.target.value) || 12})} className="w-full px-1 py-1 text-center text-[10px] font-black border rounded-sm" />
                           </div>
                           <input type="color" value={dateState.color} onChange={(e) => updateState('date', {color: e.target.value})} className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm" />
                        </div>
                    </div>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                {activeStep === 'edit' ? (
                  <button onClick={() => { setActiveStep('processing'); setTimeout(() => { generateFinal(); setActiveStep('download'); }, 1500); }} className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[4px] shadow-xl hover:bg-[#1a237e] transition-all">Apply & Save</button>
                ) : (
                  <>
                    <button onClick={() => { const link = document.createElement('a'); link.href = processedPreview!; link.download = `py7-photo-${Date.now()}.jpg`; link.click(); }} className="w-full py-4 bg-[#00796b] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[4px] shadow-2xl hover:bg-[#004d40] flex items-center justify-center gap-3 transition-all animate-in zoom-in-95">
                      <i className="fas fa-download"></i> Download Image
                    </button>
                    <button onClick={() => setActiveStep('edit')} className="w-full py-3 border-2 py7-border-default text-slate-400 rounded-[4px] font-black text-[10px] uppercase hover:bg-slate-50">Back to Canvas</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isCropModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
             <div className="bg-white border-2 border-[#3f51b5] rounded-[8px] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl scale-in-center">
                <div className="bg-[#3f51b5] px-4 py-3 text-white flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase tracking-[2px]">Crop Background</span>
                   <button onClick={() => setIsCropModalOpen(false)}><i className="fas fa-times"></i></button>
                </div>
                <div className="p-10 flex flex-col items-center bg-slate-50">
                   <div className="relative inline-block border-2 border-white shadow-xl overflow-hidden select-none bg-white rounded-sm">
                      <img src={selectedImage!} className="max-h-[350px] object-contain" alt="Crop Area" />
                      <div 
                        className="absolute border-2 border-white border-dashed shadow-[0_0_0_999px_rgba(0,0,0,0.4)] z-20 cursor-move"
                        style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.width}%`, height: `${cropBox.height}%`, touchAction: 'none' }}
                        onMouseDown={(e) => { e.stopPropagation(); setCropInteraction('dragging'); lastMousePos.current = { x: e.clientX, y: e.clientY }; }}
                      >
                         {['nw', 'ne', 'sw', 'se'].map(pos => (
                             <div key={pos} onMouseDown={(e) => { e.stopPropagation(); setCropInteraction(pos as any); lastMousePos.current = { x: e.clientX, y: e.clientY }; }} 
                                  className={`absolute w-3 h-3 bg-[#3f51b5] border border-white rounded-full z-30 ${pos==='nw'?'-top-1.5 -left-1.5 cursor-nwse-resize':pos==='ne'?'-top-1.5 -right-1.5 cursor-nesw-resize':pos==='sw'?'-bottom-1.5 -left-1.5 cursor-nesw-resize':'-bottom-1.5 -right-1.5 cursor-nwse-resize'}`}></div>
                         ))}
                      </div>
                   </div>
                   <div className="mt-8 flex gap-3 w-full">
                     <button onClick={() => setIsCropModalOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-[#3f51b5] border border-[#3f51b5] rounded-[4px]">Cancel</button>
                     <button onClick={applyCrop} className="flex-[2] py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase shadow-lg">Apply Crop</button>
                   </div>
                </div>
             </div>
          </div>
      )}

      <div className="mt-16 text-center">
         <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
      </div>
    </div>
  );
};

export default AddDobTool;
