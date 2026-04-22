
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FlippedImage {
  id: string;
  file: File;
  preview: string;
  flipH: boolean;
  flipV: boolean;
}

interface FlipImageToolProps {
  onBack: () => void;
}

const FlipImageTool: React.FC<FlipImageToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<FlippedImage[]>([]);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'processing' | 'download'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: FlippedImage[] = [];
      Array.from(files).slice(0, 20).forEach(file => {
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file),
          flipH: false,
          flipV: false
        });
      });
      setImages(prev => [...prev, ...newImages].slice(0, 20));
      setActiveStep('edit');
    }
  };

  const toggleFlipH = (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, flipH: !img.flipH } : img));
  };

  const toggleFlipV = (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, flipV: !img.flipV } : img));
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      if (filtered.length === 0) setActiveStep('upload');
      return filtered;
    });
  };

  const downloadAll = async () => {
    setActiveStep('processing');
    
    for (const imgData of images) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const img = new Image();
      await new Promise(resolve => {
        img.onload = resolve;
        img.src = imgData.preview;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.save();
      // Flip logic
      ctx.translate(imgData.flipH ? canvas.width : 0, imgData.flipV ? canvas.height : 0);
      ctx.scale(imgData.flipH ? -1 : 1, imgData.flipV ? -1 : 1);
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `flipped-${imgData.file.name}`;
      link.click();
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setActiveStep('download');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Flip Image Horizontally or Vertically</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm min-h-[500px] flex flex-col">
        {activeStep === 'upload' && (
          <div className="flex-1 p-20 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-arrows-left-right text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Images to Flip</h3>
              <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest">Mirror images instantly</p>
              <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Choose Photos</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
            </div>
          </div>
        )}

        {(activeStep === 'edit' || activeStep === 'download') && (
           <div className="flex-1 p-8 md:p-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                {images.map((img) => (
                  <div key={img.id} className="relative bg-white border py7-border-default rounded-[4px] overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all">
                    <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 z-20 w-6 h-6 bg-white/90 text-red-500 rounded-sm border border-red-100 flex items-center justify-center hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                    
                    <div className="aspect-video bg-[#f0f0f0] flex items-center justify-center p-4 overflow-hidden relative">
                       <img 
                        src={img.preview} 
                        className="max-h-full max-w-full object-contain transition-transform duration-300 shadow-md bg-black"
                        style={{ transform: `scaleX(${img.flipH ? -1 : 1}) scaleY(${img.flipV ? -1 : 1})` }}
                       />
                    </div>

                    <div className="bg-white p-4 border-t py7-border-default flex items-center justify-center gap-4">
                       <button 
                        onClick={() => toggleFlipH(img.id)} 
                        title="Flip Horizontal"
                        className={`w-10 h-10 border py7-border-default rounded-sm flex items-center justify-center transition-all ${img.flipH ? 'bg-indigo-50 text-[#3f51b5] border-[#3f51b5]' : 'text-slate-400 hover:bg-slate-50'}`}
                       >
                          <i className="fas fa-arrows-left-right"></i>
                       </button>
                       <button 
                        onClick={() => toggleFlipV(img.id)} 
                        title="Flip Vertical"
                        className={`w-10 h-10 border py7-border-default rounded-sm flex items-center justify-center transition-all ${img.flipV ? 'bg-indigo-50 text-[#3f51b5] border-[#3f51b5]' : 'text-slate-400 hover:bg-slate-50'}`}
                       >
                          <i className="fas fa-arrows-up-down"></i>
                       </button>
                       <button 
                        onClick={() => { const i = images.find(x => x.id === img.id); if(i) { setImages([i]); downloadAll(); } }}
                        className="w-10 h-10 border py7-border-default rounded-sm flex items-center justify-center text-slate-400 hover:text-[#00796b] hover:bg-slate-50 transition-all"
                       >
                          <i className="fas fa-download"></i>
                       </button>
                    </div>
                  </div>
                ))}
                
                {images.length < 20 && (
                   <div onClick={() => fileInputRef.current?.click()} className="aspect-video border-2 border-dashed py7-border-default rounded-[4px] bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-[#3f51b5] hover:bg-indigo-50/20 cursor-pointer transition-all">
                      <i className="fas fa-plus text-xl"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Add More Images</span>
                   </div>
                )}
              </div>

              <div className="mt-16 flex flex-col items-center gap-4">
                 <button 
                  onClick={downloadAll}
                  className="px-16 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[14px] uppercase tracking-[4px] shadow-2xl hover:bg-[#1a237e] transition-all flex items-center justify-center gap-3"
                 >
                   <i className="fas fa-download"></i> Download All
                 </button>
                 <button onClick={() => setImages([])} className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-indigo-50 tracking-widest hover:text-[#3f51b5] transition-colors">Reset All</button>
              </div>
           </div>
        )}

        {activeStep === 'processing' && (
          <div className="py-24 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
             <i className="fas fa-circle-notch fa-spin text-5xl text-[#3f51b5]"></i>
             <div className="text-center">
                <p className="text-[14px] font-black uppercase tracking-[5px] text-[#3f51b5]">Mirroring Pixels...</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[2px]">Flipping Canvas Data</p>
             </div>
          </div>
        )}
      </div>

      <div className="mt-20 text-center">
         <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
         <div className="mt-8 flex justify-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" title="Contact Developer"><i className="fab fa-whatsapp text-2xl"></i></a>
            <i className="fab fa-facebook-f text-2xl"></i>
            <i className="fab fa-twitter text-2xl"></i>
            <i className="fab fa-instagram text-2xl"></i>
         </div>
      </div>
    </div>
  );
};

export default FlipImageTool;
