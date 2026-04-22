
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  width: number;
  height: number;
  compressedPreview?: string;
  compressedSize?: number;
}

interface ReduceKbToolProps {
  onBack: () => void;
}

const ReduceKbTool: React.FC<ReduceKbToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [targetKb, setTargetKb] = useState<number>(100);
  const [dimensionUnit, setDimensionUnit] = useState<'Pixels' | 'MM' | 'CM'>('Pixels');
  const [activeStep, setActiveStep] = useState<'edit' | 'processing' | 'download'>('edit');
  
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
  };

  const compressImage = async (imgFile: ImageFile, target: number): Promise<ImageFile> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imgFile);
        ctx.drawImage(img, 0, 0);

        let min = 0.01, max = 0.99, dataUrl = '', currentSize = 0;
        for (let i = 0; i < 6; i++) {
          const mid = (min + max) / 2;
          const tempUrl = canvas.toDataURL('image/jpeg', mid);
          const sizeKb = Math.round((tempUrl.length * 0.75) / 1024);
          if (sizeKb > target) max = mid;
          else { min = mid; dataUrl = tempUrl; currentSize = sizeKb; }
        }
        if (!dataUrl) { dataUrl = canvas.toDataURL('image/jpeg', 0.1); currentSize = Math.round((dataUrl.length * 0.75) / 1024); }

        resolve({ ...imgFile, compressedPreview: dataUrl, compressedSize: currentSize });
      };
      img.src = imgFile.preview;
    });
  };

  const handleReduceSize = async () => {
    if (images.length === 0) return;
    setActiveStep('processing');
    const processed = [];
    for (const img of images) processed.push(await compressImage(img, targetKb));
    setImages(processed);
    setTimeout(() => setActiveStep('download'), 1000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-10 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Reduce Image Size In KB</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm p-8 min-h-[400px] flex flex-col items-center justify-center">
        {activeStep === 'edit' && (
          <div className="w-full space-y-10">
            {images.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-indigo-200 rounded-[8px] p-12 text-center hover:bg-indigo-50/30 cursor-pointer transition-all bg-white shadow-inner max-w-xl mx-auto w-full">
                <i className="fas fa-file-arrow-up text-5xl text-indigo-100 mb-4"></i>
                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-widest mb-1">Select Image</h3>
                <p className="text-[9px] text-slate-300 font-bold uppercase mb-6">Supports all formats</p>
                <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-lg">Upload Photo</button>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} multiple className="hidden" accept="image/*" />
              </div>
            ) : (
              <div className="space-y-8 flex flex-col items-center">
                 <div className="flex flex-wrap justify-center gap-6">
                    {images.map(img => (
                      <div key={img.id} className="relative w-40 bg-white border py7-border-default rounded-[4px] shadow-sm overflow-hidden">
                        <div className="aspect-square bg-[#f8f9fc] p-2"><img src={img.preview} className="w-full h-full object-contain" /></div>
                        <div className="bg-[#3f51b5] p-2 text-white text-[8px] font-black uppercase text-center">{img.originalSize} KB</div>
                      </div>
                    ))}
                 </div>
                 <div className="flex items-center gap-4 border-t pt-8 w-full justify-center">
                    <div className="flex border-2 border-[#3f51b5] rounded-sm overflow-hidden bg-white">
                       <input type="number" value={targetKb} onChange={(e) => setTargetKb(parseInt(e.target.value)||0)} className="w-20 px-3 py-2 text-xs font-black outline-none text-center" />
                       <span className="bg-slate-500 text-white px-3 flex items-center text-[9px] font-black uppercase">KB</span>
                    </div>
                    <button onClick={handleReduceSize} className="px-10 py-3 bg-[#3f51b5] text-white rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl">Apply Reduction</button>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeStep === 'processing' && (
          <div className="py-20 flex flex-col items-center gap-6">
             <div className="w-14 h-14 border-4 border-[#3f51b5] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[12px] font-black uppercase tracking-[4px] text-[#3f51b5]">Compressing...</p>
          </div>
        )}

        {activeStep === 'download' && (
          <div className="py-10 flex flex-col items-center gap-8 animate-in slide-in-from-bottom-4 duration-500 w-full">
             <i className="fas fa-check-circle text-6xl text-green-500 mb-2"></i>
             <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Ready to Download!</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Media has been successfully reduced.</p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl px-4">
               {images.map((img, idx) => (
                 <div key={idx} className="bg-slate-50 border py7-border-default rounded-[4px] p-2 text-center shadow-sm">
                   <div className="aspect-square bg-white border py7-border-default mb-2 flex items-center justify-center overflow-hidden"><img src={img.compressedPreview || img.preview} className="max-h-full object-contain" /></div>
                   <p className="text-[9px] font-black text-[#3f51b5] uppercase">{img.compressedSize} KB</p>
                 </div>
               ))}
             </div>

             <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                <button onClick={() => { images.forEach(img => { const a = document.createElement('a'); a.href = img.compressedPreview!; a.download = `py7-${Date.now()}.jpg`; a.click(); }); }} className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[3px] shadow-2xl hover:bg-[#1a237e] transition-all flex items-center justify-center gap-3">
                  <i className="fas fa-download"></i> Download All
                </button>
                <button onClick={() => { setImages([]); setActiveStep('edit'); }} className="text-[#3f51b5] font-black uppercase text-[10px] border-b-2 border-indigo-100 mt-2 hover:text-[#1a237e] transition-colors">Replace Images</button>
             </div>
          </div>
        )}
      </div>
      <div className="mt-16 text-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p></div>
    </div>
  );
};

export default ReduceKbTool;
