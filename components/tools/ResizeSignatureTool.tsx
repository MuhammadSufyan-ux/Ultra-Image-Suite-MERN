
import React, { useState, useRef } from 'react';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  width: number;
  height: number;
  processedPreview?: string;
  processedSize?: number;
}

interface ResizeSignatureToolProps {
  onBack: () => void;
}

const ResizeSignatureTool: React.FC<ResizeSignatureToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [unit, setUnit] = useState<'pixel' | 'centimeter'>('pixel');
  const [width, setWidth] = useState<string>('140');
  const [height, setHeight] = useState<string>('60');
  const [targetKb, setTargetKb] = useState<string>('20');
  const [activeStep, setActiveStep] = useState<'upload' | 'config' | 'processing' | 'download'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newImages: ImageFile[] = [];
    const filesToProcess = Array.from(files).slice(0, 10);

    for (const file of filesToProcess) {
      const preview = URL.createObjectURL(file);
      const img = new Image();
      const dims = await new Promise<{ w: number, h: number }>((resolve) => {
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.src = preview;
      });

      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        originalSize: Math.round(file.size / 1024),
        width: dims.w,
        height: dims.h
      });
    }

    setImages(newImages);
    setActiveStep('config');
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setActiveStep('processing');

    const w = parseFloat(width) || 140;
    const h = parseFloat(height) || 60;
    const kb = parseFloat(targetKb) || 20;

    const finalW = unit === 'centimeter' ? w * 37.795 : w;
    const finalH = unit === 'centimeter' ? h * 37.795 : h;

    const results: ImageFile[] = [];

    for (const imgFile of images) {
      const result = await new Promise<ImageFile>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = finalW;
          canvas.height = finalH;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(imgFile);

          ctx.drawImage(img, 0, 0, finalW, finalH);

          let quality = 0.95;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let currentKb = (dataUrl.length * (3/4)) / 1024;

          if (currentKb > kb) {
            for (let q = 0.9; q > 0.1; q -= 0.1) {
              const testUrl = canvas.toDataURL('image/jpeg', q);
              const testKb = (testUrl.length * (3/4)) / 1024;
              if (testKb <= kb) {
                dataUrl = testUrl;
                currentKb = testKb;
                break;
              }
              dataUrl = testUrl;
              currentKb = testKb;
            }
          }

          resolve({
            ...imgFile,
            processedPreview: dataUrl,
            processedSize: Math.round(currentKb)
          });
        };
        img.src = imgFile.preview;
      });
      results.push(result);
    }

    setImages(results);
    setTimeout(() => {
      setActiveStep('download');
    }, 1500);
  };

  const downloadAll = () => {
    images.forEach((img, idx) => {
      if (!img.processedPreview) return;
      const link = document.createElement('a');
      link.href = img.processedPreview;
      link.download = `py7-signature-resized-${idx + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-10 px-4">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
      >
        <i className="fas fa-arrow-left"></i>
        Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Resize Signature</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm p-6 md:p-10 relative overflow-visible flex flex-col items-center min-h-[450px]">
        
        {/* STEP 1: UPLOAD */}
        {activeStep === 'upload' && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#c5cae9] rounded-[6px] p-20 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-white w-full flex flex-col items-center justify-center"
          >
            <i className="fas fa-cloud-arrow-up text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Signature Image</h3>
            <p className="text-[10px] text-slate-400 mb-8 font-bold uppercase tracking-[2px]">Supports JPG, PNG, WEBP</p>
            <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl group-hover:bg-[#004d40]">Select Image</button>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept="image/*" />
          </div>
        )}

        {/* STEP 2: CONFIGURE */}
        {activeStep === 'config' && (
          <div className="w-full flex flex-col items-center space-y-10 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-wrap justify-center gap-4 w-full">
              {images.map(img => (
                <div key={img.id} className="relative w-32 h-32 border-2 py7-border-default rounded-[4px] bg-slate-50 p-2 group shadow-sm">
                  <img src={img.preview} className="w-full h-full object-contain" alt="Selected" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const newImages = images.filter(i => i.id !== img.id);
                        setImages(newImages);
                        if (newImages.length === 0) setActiveStep('upload');
                      }}
                      className="text-white hover:text-red-400"
                    >
                      <i className="fas fa-trash-alt text-lg"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border py7-border-default p-8 rounded-[4px] w-full max-w-lg space-y-8 shadow-sm">
              <div className="flex justify-center gap-10">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="unit" checked={unit === 'pixel'} onChange={() => setUnit('pixel')} className="w-4 h-4 accent-[#3f51b5]" />
                  <span className={`text-[11px] font-black uppercase tracking-widest ${unit === 'pixel' ? 'text-[#3f51b5]' : 'text-slate-400 group-hover:text-slate-600'}`}>Pixel</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="unit" checked={unit === 'centimeter'} onChange={() => setUnit('centimeter')} className="w-4 h-4 accent-[#3f51b5]" />
                  <span className={`text-[11px] font-black uppercase tracking-widest ${unit === 'centimeter' ? 'text-[#3f51b5]' : 'text-slate-400 group-hover:text-slate-600'}`}>Centimeter</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Width ({unit === 'pixel' ? 'px' : 'cm'})</span>
                  <input 
                    type="text" 
                    value={width} 
                    onChange={(e) => setWidth(e.target.value)} 
                    className="w-full px-4 py-2.5 border-2 py7-border-default rounded-[4px] text-xs font-black text-center focus:border-[#3f51b5] outline-none transition-colors shadow-inner bg-white" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Height ({unit === 'pixel' ? 'px' : 'cm'})</span>
                  <input 
                    type="text" 
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)} 
                    className="w-full px-4 py-2.5 border-2 py7-border-default rounded-[4px] text-xs font-black text-center focus:border-[#3f51b5] outline-none transition-colors shadow-inner bg-white" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Target Size (KB):</span>
                <div className="flex border-2 border-[#3f51b5] rounded-[4px] overflow-hidden shadow-sm">
                  <input 
                    type="text" 
                    value={targetKb} 
                    onChange={(e) => setTargetKb(e.target.value)} 
                    className="w-20 px-4 py-2 text-xs font-black text-center outline-none bg-white" 
                  />
                  <span className="bg-slate-500 text-white px-3 flex items-center text-[10px] font-black uppercase">KB</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={processImages}
                  className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[4px] shadow-xl hover:bg-[#1a237e] transition-all transform active:scale-95"
                >
                  Resize Signature
                </button>
                <button 
                  onClick={() => { setImages([]); setActiveStep('upload'); }}
                  className="text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-[#3f51b5] transition-colors"
                >
                  Cancel & Restart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {activeStep === 'processing' && (
          <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
             <i className="fas fa-circle-notch fa-spin text-5xl text-[#3f51b5]"></i>
             <div className="text-center">
                <p className="text-[14px] font-black uppercase tracking-[5px] text-[#3f51b5] animate-pulse">Processing Signature...</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[2px]">Optimizing For {targetKb}KB</p>
             </div>
          </div>
        )}

        {/* STEP 4: DOWNLOAD */}
        {activeStep === 'download' && (
          <div className="py-10 flex flex-col items-center gap-10 animate-in slide-in-from-bottom-6 duration-500 w-full">
             <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100 mb-4 mx-auto">
                   <i className="fas fa-check text-3xl text-green-500"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-[6px]">Task Complete!</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Dimensions: {width}x{height} {unit}</p>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full px-4">
                {images.map((img, idx) => (
                  <div key={idx} className="bg-white border-2 py7-border-default p-2 rounded-[4px] text-center shadow-sm flex flex-col items-center">
                     <div className="aspect-video bg-[#f8f9fc] border py7-border-default rounded-sm mb-3 flex items-center justify-center overflow-hidden w-full">
                        <img src={img.processedPreview} className="max-h-full max-w-full object-contain" alt="Result" />
                     </div>
                     <p className="text-[10px] font-black text-[#00796b] uppercase tracking-tighter">{img.processedSize} KB</p>
                  </div>
                ))}
             </div>

             <div className="flex flex-col gap-4 w-full max-w-[280px]">
                <button 
                  onClick={downloadAll}
                  className="w-full py-4 bg-[#00796b] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[4px] shadow-2xl hover:bg-[#004d40] transition-all flex items-center justify-center gap-3"
                >
                  <i className="fas fa-cloud-arrow-down text-lg"></i>
                  Download All
                </button>
                <button 
                  onClick={() => {
                    setImages([]);
                    setActiveStep('upload');
                  }}
                  className="text-[#3f51b5] font-black uppercase text-[10px] border-b-2 border-indigo-100 mt-2 tracking-widest hover:text-[#1a237e] text-center"
                >
                  Resize New Signature
                </button>
             </div>
          </div>
        )}
      </div>

      <div className="mt-16 text-center">
         <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
      </div>
    </div>
  );
};

export default ResizeSignatureTool;
