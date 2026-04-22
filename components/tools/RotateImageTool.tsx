
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface RotatedImage {
  id: string;
  file: File;
  preview: string;
  rotation: number;
}

interface RotateImageToolProps {
  onBack: () => void;
}

const RotateImageTool: React.FC<RotateImageToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<RotatedImage[]>([]);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'processing' | 'download'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: RotatedImage[] = [];
      Array.from(files).slice(0, 20).forEach(file => {
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file),
          rotation: 0
        });
      });
      setImages(prev => [...prev, ...newImages].slice(0, 20));
      setActiveStep('edit');
    }
  };

  const updateRotation = (id: string, delta: number) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: img.rotation + delta } : img));
  };

  const handleManualRotation = (id: string, value: string) => {
    const rot = parseInt(value) || 0;
    setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: rot } : img));
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

      const angleRad = (imgData.rotation * Math.PI) / 180;
      const absCos = Math.abs(Math.cos(angleRad));
      const absSin = Math.abs(Math.sin(angleRad));
      const newWidth = img.width * absCos + img.height * absSin;
      const newHeight = img.width * absSin + img.height * absCos;

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(angleRad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `rotated-${imgData.file.name}`;
      link.click();
      
      // Short delay between downloads
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
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Rotate Multiple Images | Py7 Tool</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">One-Click Individual & Batch Rotation - Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm min-h-[500px] flex flex-col">
        {activeStep === 'upload' && (
          <div className="flex-1 p-20 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-rotate text-6xl text-indigo-100 mb-8 group-hover:rotate-180 transition-transform duration-700"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Images to Rotate</h3>
              <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest">Supports Batch Processing (Up to 20 Photos)</p>
              <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Choose Photos</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
            </div>
          </div>
        )}

        {(activeStep === 'edit' || activeStep === 'download') && (
           <div className="flex-1 p-8 md:p-12">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {images.map((img) => (
                  <div key={img.id} className="relative bg-slate-50 border py7-border-default rounded-[4px] overflow-hidden flex flex-col group shadow-sm hover:shadow-lg transition-shadow">
                    <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 z-20 w-6 h-6 bg-white/90 text-red-500 rounded-sm border border-red-100 flex items-center justify-center hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                    
                    <div className="aspect-square flex items-center justify-center p-6 bg-[#f0f0f0] overflow-hidden">
                       <img 
                        src={img.preview} 
                        className="max-h-full max-w-full object-contain transition-transform duration-300 shadow-md"
                        style={{ transform: `rotate(${img.rotation}deg)` }}
                       />
                    </div>

                    <div className="bg-white p-3 border-t py7-border-default space-y-3">
                       <p className="text-[9px] font-black text-slate-400 uppercase truncate text-center">{img.file.name}</p>
                       <div className="flex items-center justify-center gap-2">
                          <button onClick={() => updateRotation(img.id, -90)} className="w-8 h-8 bg-indigo-50 text-[#3f51b5] rounded-sm hover:bg-indigo-100 transition-colors"><i className="fas fa-rotate-left text-xs"></i></button>
                          <div className="flex items-center border py7-border-default rounded-sm px-2 bg-slate-50/50">
                             <input 
                              type="text" 
                              value={img.rotation} 
                              onChange={(e) => handleManualRotation(img.id, e.target.value)}
                              className="w-10 text-center text-[10px] font-black bg-transparent outline-none"
                             />
                             <span className="text-[8px] font-black text-slate-300">°</span>
                          </div>
                          <button onClick={() => updateRotation(img.id, 90)} className="w-8 h-8 bg-indigo-50 text-[#3f51b5] rounded-sm hover:bg-indigo-100 transition-colors"><i className="fas fa-rotate-right text-xs"></i></button>
                       </div>
                    </div>
                  </div>
                ))}
                
                {images.length < 20 && (
                   <div onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed py7-border-default rounded-[4px] bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-[#3f51b5] hover:bg-indigo-50/20 cursor-pointer transition-all">
                      <i className="fas fa-plus text-xl"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Add More</span>
                   </div>
                )}
              </div>

              <div className="mt-16 flex flex-col items-center gap-4">
                 <button 
                  onClick={downloadAll}
                  className="px-16 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[14px] uppercase tracking-[4px] shadow-2xl hover:bg-[#1a237e] transition-all flex items-center justify-center gap-3 animate-bounce"
                 >
                   <i className="fas fa-download"></i> Download All Rotated
                 </button>
                 <button onClick={() => setImages([])} className="text-[10px] font-black text-slate-400 uppercase border-b-2 border-indigo-50 tracking-widest hover:text-[#3f51b5] transition-colors">Reset Workspace</button>
              </div>
           </div>
        )}

        {activeStep === 'processing' && (
          <div className="py-24 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
             <i className="fas fa-circle-notch fa-spin text-5xl text-[#3f51b5]"></i>
             <div className="text-center">
                <p className="text-[14px] font-black uppercase tracking-[5px] text-[#3f51b5]">Applying Rotation...</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[2px]">Rendering High Definition Assets</p>
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

export default RotateImageTool;
