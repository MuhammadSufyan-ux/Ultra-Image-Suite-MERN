
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CircleCropToolProps {
  onBack: () => void;
}

const CircleCropTool: React.FC<CircleCropToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [cropBox, setCropBox] = useState({ x: 25, y: 25, size: 50 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<'none' | 'dragging' | 'resizing'>('none');
  
  const [hasBorder, setHasBorder] = useState(false);
  const [borderColor, setBorderColor] = useState('#3f51b5');
  const [borderSize, setBorderSize] = useState(10);

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
        setCroppedImage(null);
        setZoom(1);
        setCropBox({ x: 25, y: 25, size: 50 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent, type: any) => {
    e.preventDefault();
    e.stopPropagation();
    setInteraction(type);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (interaction === 'none' || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = ((clientX - lastMousePos.current.x) / rect.width) * 100;
    const dy = ((clientY - lastMousePos.current.y) / rect.height) * 100;
    
    lastMousePos.current = { x: clientX, y: clientY };

    setCropBox(prev => {
      if (interaction === 'dragging') {
        return {
          ...prev,
          x: Math.max(0, Math.min(100 - prev.size, prev.x + dx)),
          y: Math.max(0, Math.min(100 - prev.size, prev.y + dy))
        };
      }
      if (interaction === 'resizing') {
        const delta = Math.max(dx, dy);
        const newSize = Math.max(10, Math.min(100 - prev.x, 100 - prev.y, prev.size + delta));
        return { ...prev, size: newSize };
      }
      return prev;
    });
  }, [interaction]);

  const handleEnd = useCallback(() => setInteraction('none'), []);

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

  const executeCrop = async () => {
    if (!selectedImage || !imageRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = selectedImage;
    await new Promise(res => { img.onload = res; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pxSize = (cropBox.size / 100) * img.width;
    canvas.width = pxSize;
    canvas.height = pxSize;

    const sourceX = (cropBox.x / 100) * img.width;
    const sourceY = (cropBox.y / 100) * img.height;

    // Draw Circle Clip
    ctx.beginPath();
    ctx.arc(pxSize / 2, pxSize / 2, pxSize / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(img, sourceX, sourceY, pxSize, pxSize, 0, 0, pxSize, pxSize);

    if (hasBorder) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = (borderSize / 100) * pxSize;
      ctx.stroke();
    }

    setCroppedImage(canvas.toDataURL('image/png'));
    setIsProcessing(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Circle Crop Your Images Online</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 py7-border-default rounded-[4px] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {!selectedImage ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-circle-dot text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Circle Crop</h3>
              <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Select Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-1">
            <div className="flex-1 bg-slate-100 p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Click & Drag to Adjust Circle</div>
              
              <div className="relative shadow-2xl bg-white border-4 border-white select-none overflow-hidden max-w-full">
                <div className="relative" style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}>
                  <img ref={imageRef} src={selectedImage} className="max-h-[500px] w-auto block pointer-events-none" alt="Source" />
                  
                  {/* Backdrop Mask */}
                  <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

                  {/* Interactive Circle */}
                  <div 
                    onMouseDown={(e) => handleStart(e, 'dragging')}
                    onTouchStart={(e) => handleStart(e, 'dragging')}
                    className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0)] flex items-center justify-center z-20"
                    style={{ 
                      left: `${cropBox.x}%`, top: `${cropBox.y}%`, 
                      width: `${cropBox.size}%`, height: `${cropBox.size}%`,
                      borderRadius: '50%',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
                      overflow: 'hidden'
                    }}
                  >
                     <img src={selectedImage} className="max-w-none block absolute pointer-events-none" 
                          style={{ 
                            width: `${(100/cropBox.size)*100}%`, 
                            left: `-${(cropBox.x/cropBox.size)*100}%`,
                            top: `-${(cropBox.y/cropBox.size)*100}%`,
                          }} 
                      />
                      <div className="absolute inset-0 border border-white/30 pointer-events-none grid grid-cols-3 grid-rows-3">
                         <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                         <div className="border-r border-b border-white/20"></div><div className="border-r border-b border-white/20"></div><div className="border-b border-white/20"></div>
                         <div className="border-r border-white/20"></div><div className="border-r border-white/20"></div><div></div>
                      </div>
                  </div>

                  {/* Resize Handle */}
                  <div 
                    onMouseDown={(e) => handleStart(e, 'resizing')}
                    onTouchStart={(e) => handleStart(e, 'resizing')}
                    className="absolute w-5 h-5 bg-white border-2 border-[#3f51b5] rounded-full z-30 cursor-nwse-resize shadow-md"
                    style={{ left: `${cropBox.x + cropBox.size}%`, top: `${cropBox.y + cropBox.size}%`, transform: 'translate(-50%, -50%)' }}
                  ></div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                 <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="px-5 py-2 bg-white border py7-border-default text-slate-600 rounded-sm font-black text-[10px] uppercase shadow-sm">Zoom In</button>
                 <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="px-5 py-2 bg-white border py7-border-default text-slate-600 rounded-sm font-black text-[10px] uppercase shadow-sm">Zoom Out</button>
                 <button onClick={executeCrop} className="px-10 py-2 bg-[#3f51b5] text-white rounded-sm font-black text-[11px] uppercase shadow-lg hover:bg-[#1a237e] transition-all">Crop & Download</button>
              </div>
              <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Tip:- Scroll mouse wheel for zoom</p>
              <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-[#3f51b5] font-black text-[10px] uppercase border-b border-indigo-100">+ Select Another Image</button>
            </div>

            <div className="w-full lg:w-80 p-8 bg-slate-50 border-l py7-border-default flex flex-col items-center">
               <div className="w-full space-y-6">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Settings</p>
                     
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={hasBorder} onChange={() => setHasBorder(!hasBorder)} className="w-4 h-4 accent-[#3f51b5]" />
                        <span className="text-[11px] font-black uppercase text-slate-600">Image Border</span>
                     </label>

                     {hasBorder && (
                       <div className="space-y-4 animate-in slide-in-from-top-2">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Color:</span>
                             <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                             <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Size:</span> <span>{borderSize}</span></div>
                             <input type="range" min="1" max="50" value={borderSize} onChange={(e) => setBorderSize(parseInt(e.target.value))} className="w-full accent-[#3f51b5]" />
                          </div>
                       </div>
                     )}
                  </div>

                  {croppedImage && (
                    <div className="space-y-4 pt-8 border-t py7-border-default animate-in zoom-in duration-300">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preview</p>
                       <div className="bg-white p-4 border py7-border-default rounded-[4px] shadow-inner bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                          <img src={croppedImage} className="w-full h-auto drop-shadow-xl" />
                       </div>
                       <button onClick={() => { const a = document.createElement('a'); a.href = croppedImage; a.download = `py7-circle-${Date.now()}.png`; a.click(); }} className="w-full py-4 bg-[#00796b] text-white rounded-[4px] font-black text-[12px] uppercase shadow-xl hover:bg-[#004d40]">Download HD PNG</button>
                    </div>
                  )}
               </div>
               
               <div className="mt-auto pt-10 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-20 text-center">
         <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">© 2024 Py7 Media - WhatsApp: 3429748731</p>
      </div>
    </div>
  );
};

export default CircleCropTool;
