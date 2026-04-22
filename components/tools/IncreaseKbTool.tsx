
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  width: number;
  height: number;
  processedPreview?: string;
  processedSize?: number;
  processedBlob?: Blob;
}

interface IncreaseKbToolProps {
  onBack: () => void;
}

const IncreaseKbTool: React.FC<IncreaseKbToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [targetKb, setTargetKb] = useState<number>(200);
  const [dimensionUnit, setDimensionUnit] = useState<'Pixels' | 'MM' | 'CM'>('Pixels');
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'processing' | 'download'>('upload');
  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [cropInteraction, setCropInteraction] = useState<'none' | 'dragging' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  const lastMousePos = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newImages: ImageFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      
      const img = new Image();
      const dimensions = await new Promise<{w: number, h: number}>((resolve) => {
        img.onload = () => resolve({w: img.width, h: img.height});
        img.src = preview;
      });

      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        originalSize: Math.round(file.size / 1024),
        width: dimensions.w,
        height: dimensions.h
      });
    }

    setImages(prev => [...prev, ...newImages].slice(0, 10));
    setActiveStep('edit');
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (images.length <= 1 && images.length > 0) setActiveStep('upload');
  };

  const increaseSizeProcess = async (imgFile: ImageFile, target: number): Promise<ImageFile> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imgFile);
        
        ctx.drawImage(img, 0, 0);

        // 1. Get high quality blob
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 1.0));
        const arrayBuffer = await blob.arrayBuffer();
        let bytes = new Uint8Array(arrayBuffer);
        
        const targetBytes = target * 1024;
        
        // 2. Pad bytes if current size is smaller than target
        if (bytes.length < targetBytes) {
          const paddingNeeded = targetBytes - bytes.length;
          const paddedBytes = new Uint8Array(bytes.length + paddingNeeded);
          paddedBytes.set(bytes);
          
          // Fill padding with random data to ensure physical size increase
          for (let i = bytes.length; i < paddedBytes.length; i++) {
            paddedBytes[i] = Math.floor(Math.random() * 256);
          }
          bytes = paddedBytes;
        }

        const processedBlob = new Blob([bytes], { type: 'image/jpeg' });
        const processedPreview = URL.createObjectURL(processedBlob);

        resolve({
          ...imgFile,
          processedPreview,
          processedBlob,
          processedSize: Math.round(processedBlob.size / 1024)
        });
      };
      img.src = imgFile.preview;
    });
  };

  const handleIncreaseSize = async () => {
    if (images.length === 0) return;
    setActiveStep('processing');
    
    const processed = [];
    for (const img of images) {
      const result = await increaseSizeProcess(img, targetKb);
      processed.push(result);
    }
    
    setImages(processed);
    setTimeout(() => setActiveStep('download'), 1500);
  };

  const downloadAll = () => {
    images.forEach((img, index) => {
      if (!img.processedPreview) return;
      const link = document.createElement('a');
      link.href = img.processedPreview;
      link.download = `py7-upsized-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, type: any) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePos.current = { x: clientX, y: clientY };
    setCropInteraction(type);
  };

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (cropInteraction === 'none') return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastMousePos.current.x;
    const dy = clientY - lastMousePos.current.y;
    lastMousePos.current = { x: clientX, y: clientY };

    setCropBox(prev => {
      const sens = 0.3; 
      let { x, y, width, height } = { ...prev };
      if (cropInteraction === 'dragging') { x += dx * sens; y += dy * sens; }
      else if (cropInteraction === 'nw') { x += dx * sens; y += dy * sens; width -= dx * sens; height -= dy * sens; }
      else if (cropInteraction === 'ne') { y += dy * sens; width += dx * sens; height -= dy * sens; }
      else if (cropInteraction === 'sw') { x += dx * sens; width -= dx * sens; height += dy * sens; }
      else if (cropInteraction === 'se') { width += dx * sens; height += dy * sens; }
      
      return { 
        x: Math.max(0, Math.min(100 - width, x)),
        y: Math.max(0, Math.min(100 - height, y)),
        width: Math.max(5, Math.min(100 - x, width)),
        height: Math.max(5, Math.min(100 - y, height))
      };
    });
  }, [cropInteraction]);

  const handleInteractionEnd = useCallback(() => setCropInteraction('none'), []);

  useEffect(() => {
    window.addEventListener('mousemove', handleInteractionMove);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchmove', handleInteractionMove);
    window.addEventListener('touchend', handleInteractionEnd);
    return () => {
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [handleInteractionMove, handleInteractionEnd]);

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
      >
        <i className="fas fa-arrow-left"></i>
        Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Increase Image Size In KB</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm p-4 md:p-8 relative overflow-visible">
        
        {activeStep === 'upload' && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-100 rounded-[6px] p-16 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-white w-full"
          >
            <i className="fas fa-cloud-arrow-up text-5xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Or Drag & Drop Images Here</h3>
            <p className="text-[9px] text-slate-400 mb-6 font-bold uppercase">PHYSICAL KB INJECTION ENGINE</p>
            <button className="px-8 py-2.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-lg">Upload Images</button>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} multiple className="hidden" accept="image/*" />
          </div>
        )}

        {activeStep === 'edit' && (
          <div className="animate-in fade-in duration-300 w-full flex flex-col items-center">
            <div className="absolute -top-3 right-6 flex items-center bg-white border py7-border-default rounded-sm px-2 py-0.5 gap-2 z-10 shadow-sm">
              <span className="text-[8px] font-black text-slate-400 uppercase">Image Dimensions:-</span>
              <div className="flex bg-slate-100 rounded-sm p-0.5">
                {['Pixels', 'MM', 'CM'].map(unit => (
                  <button
                    key={unit}
                    onClick={() => setDimensionUnit(unit as any)}
                    className={`px-2 py-0.5 text-[7px] font-black uppercase rounded-sm transition-all ${dimensionUnit === unit ? 'bg-slate-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-2 border-dashed border-indigo-50 rounded-[4px] p-5 w-full bg-[#fcfdff] flex flex-wrap justify-center gap-5 min-h-[300px]">
               {images.map(img => (
                 <div key={img.id} className="relative w-[240px] bg-white border-2 border-[#3f51b5] rounded-[4px] overflow-visible shadow-md">
                    <div className="relative aspect-video flex items-center justify-center p-2 bg-[#f8f9fc]">
                       <img src={img.preview} alt="Preview" className="max-h-full max-w-full object-contain" />
                       <div className="absolute top-1 left-1 flex flex-col gap-1">
                          <button onClick={() => setActiveCropId(img.id)} className="bg-[#00796b] text-white text-[7px] font-black px-1.5 py-1 rounded-sm flex items-center gap-1 shadow-sm hover:bg-[#004d40]">
                             <i className="fas fa-expand-arrows-alt"></i> Resize
                          </button>
                          <button onClick={() => setActiveCropId(img.id)} className="bg-[#00796b] text-white text-[7px] font-black px-1.5 py-1 rounded-sm flex items-center gap-1 shadow-sm hover:bg-[#004d40]">
                             <i className="fas fa-crop"></i> Crop
                          </button>
                       </div>
                       <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 w-5 h-5 bg-white text-slate-400 rounded-full flex items-center justify-center hover:text-red-500 shadow-sm border border-slate-100">
                          <i className="fas fa-times text-[10px]"></i>
                       </button>
                    </div>
                    <div className="bg-[#00796b] p-2.5 text-white">
                       <p className="text-[8px] font-black uppercase truncate border-b border-white/20 pb-1 mb-1.5">{img.file.name}</p>
                       <div className="space-y-0.5 text-[8px] font-bold uppercase">
                          <div className="flex justify-between"><span>Size:</span> <span>{img.originalSize} KB</span></div>
                          <div className="flex justify-between"><span>Dim:</span> <span>{img.width}x{img.height} PX</span></div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="mt-8 w-full max-w-md space-y-4 text-center">
               <div className="flex items-center justify-center gap-3">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Target Size:</span>
                  <div className="flex border-2 border-[#3f51b5] rounded-[4px] overflow-hidden shadow-sm">
                     <input 
                      type="number" 
                      value={targetKb} 
                      onChange={(e) => setTargetKb(parseInt(e.target.value) || 0)} 
                      className="w-16 px-2 py-1.5 text-xs font-black outline-none text-center"
                     />
                     <span className="bg-slate-500 text-white px-2 flex items-center text-[8px] font-black uppercase">Kb</span>
                  </div>
                  <button 
                    onClick={handleIncreaseSize}
                    className="px-6 py-2 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#1a237e] transition-all"
                  >
                    Increase KB
                  </button>
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Note:- Exact size might vary slightly based on file container.</p>
            </div>
          </div>
        )}

        {activeStep === 'processing' && (
          <div className="py-20 flex flex-col items-center gap-5 animate-in fade-in duration-300">
             <i className="fas fa-circle-notch fa-spin text-4xl text-[#3f51b5]"></i>
             <div className="text-center">
                <p className="text-[11px] font-black uppercase tracking-[3px] text-[#3f51b5]">Injecting Data Buffer...</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-[1px]">Targeting Physical KB Limit</p>
             </div>
          </div>
        )}

        {activeStep === 'download' && (
          <div className="py-10 flex flex-col items-center gap-8 animate-in slide-in-from-bottom-6 duration-500">
             <div className="text-center">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-100 mb-3 mx-auto">
                   <i className="fas fa-check-circle text-2xl text-green-500"></i>
                </div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-[4px]">Expansion Done</h2>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">New Target Size: {targetKb} KB</p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full max-w-4xl px-4">
                {images.map((img, idx) => (
                  <div key={idx} className="bg-white border py7-border-default p-2 rounded-[4px] text-center shadow-sm">
                     <div className="aspect-video bg-[#f8f9fc] border py7-border-default rounded-sm mb-2 flex items-center justify-center overflow-hidden">
                        <img src={img.processedPreview} className="max-h-full max-w-full object-contain" />
                     </div>
                     <p className="text-[10px] font-black text-[#00796b] uppercase">{img.processedSize} KB</p>
                  </div>
                ))}
             </div>

             <div className="flex flex-col gap-2 w-full max-w-[240px]">
                <button 
                  onClick={downloadAll}
                  className="w-full px-6 py-3 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-[3px] shadow-lg hover:bg-[#004d40] transition-all flex items-center justify-center gap-3"
                >
                  <i className="fas fa-file-arrow-down"></i>
                  Download All
                </button>
                <button 
                  onClick={() => {
                    images.forEach(img => { if(img.processedPreview) URL.revokeObjectURL(img.processedPreview); });
                    setImages([]);
                    setActiveStep('upload');
                  }}
                  className="text-[#3f51b5] font-black uppercase text-[9px] border-b border-indigo-100 mt-2 tracking-[2px] hover:text-[#1a237e] text-center"
                >
                  Upload More
                </button>
             </div>
          </div>
        )}
      </div>

      {activeCropId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
              <div className="bg-[#3f51b5] p-2.5 text-white flex justify-between items-center">
                 <span className="text-[9px] font-black uppercase tracking-widest">Image Workspace</span>
                 <button onClick={() => setActiveCropId(null)} className="hover:rotate-90 transition-all duration-300"><i className="fas fa-times text-lg"></i></button>
              </div>
              <div className="p-6 flex flex-col items-center bg-[#fdfdfd]">
                 <div className="relative inline-block border py-px border-slate-100 shadow-xl overflow-hidden select-none bg-slate-50">
                    <img src={images.find(i => i.id === activeCropId)?.preview} className="max-h-[300px] object-contain" alt="Crop Area" />
                    <div 
                      className="absolute border-2 border-[#3f51b5] border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-20 cursor-move"
                      style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.width}%`, height: `${cropBox.height}%`, touchAction: 'none' }}
                      onMouseDown={(e) => handleInteractionStart(e, 'dragging')}
                    >
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#3f51b5] rounded-full border border-white shadow-xl" onMouseDown={(e) => handleInteractionStart(e, 'nw')}></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#3f51b5] rounded-full border border-white shadow-xl" onMouseDown={(e) => handleInteractionStart(e, 'ne')}></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#3f51b5] rounded-full border border-white shadow-xl" onMouseDown={(e) => handleInteractionStart(e, 'sw')}></div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#3f51b5] rounded-full border border-white shadow-xl" onMouseDown={(e) => handleInteractionStart(e, 'se')}></div>
                    </div>
                 </div>
                 <div className="mt-6 flex gap-3 w-full max-w-[280px]">
                   <button onClick={() => setActiveCropId(null)} className="flex-1 px-4 py-2 border-2 border-[#3f51b5] text-[#3f51b5] font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all rounded-sm">Exit</button>
                   <button onClick={() => setActiveCropId(null)} className="flex-[1.5] px-6 py-2 bg-[#3f51b5] text-white rounded-[4px] font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-[#1a237e] transition-all">Apply</button>
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

export default IncreaseKbTool;
