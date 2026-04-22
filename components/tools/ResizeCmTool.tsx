
import React, { useState, useRef, useEffect, useCallback } from 'react';

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

interface ResizeCmToolProps {
  onBack: () => void;
}

const ResizeCmTool: React.FC<ResizeCmToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [activeStep, setActiveStep] = useState<'upload' | 'config' | 'processing' | 'download'>('upload');
  
  // Configuration State
  const [dpi, setDpi] = useState<string>('200');
  const [widthCm, setWidthCm] = useState<string>('15');
  const [heightCm, setHeightCm] = useState<string>('10');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [enableCompression, setEnableCompression] = useState(false);
  const [targetKb, setTargetKb] = useState<string>('50');
  
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

  const updateWidthCm = (val: string) => {
    setWidthCm(val);
    if (maintainAspectRatio && images.length > 0) {
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        const ratio = images[0].height / images[0].width;
        setHeightCm((numVal * ratio).toFixed(2));
      }
    }
  };

  const updateHeightCm = (val: string) => {
    setHeightCm(val);
    if (maintainAspectRatio && images.length > 0) {
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        const ratio = images[0].width / images[0].height;
        setWidthCm((numVal * ratio).toFixed(2));
      }
    }
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setActiveStep('processing');

    const d = parseFloat(dpi) || 200;
    const wCm = parseFloat(widthCm) || 15;
    const hCm = parseFloat(heightCm) || 10;
    const kb = parseFloat(targetKb) || 50;

    // Convert CM to Pixels: pixels = (cm * DPI) / 2.54
    const finalW = Math.round((wCm * d) / 2.54);
    const finalH = Math.round((hCm * d) / 2.54);

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
          
          if (enableCompression) {
            // Simple compression loop
            for (let q = 0.9; q > 0.1; q -= 0.1) {
              const testUrl = canvas.toDataURL('image/jpeg', q);
              const testKb = (testUrl.length * (3/4)) / 1024;
              if (testKb <= kb) {
                dataUrl = testUrl;
                break;
              }
              dataUrl = testUrl;
            }
          }

          resolve({
            ...imgFile,
            processedPreview: dataUrl,
            processedSize: Math.round((dataUrl.length * (3/4)) / 1024)
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
      link.download = `py7-resized-cm-${idx + 1}.jpg`;
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
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Resize Image In Centimeter</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm p-6 md:p-10 relative flex flex-col items-center min-h-[450px]">
        
        {/* STEP 1: UPLOAD */}
        {activeStep === 'upload' && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#c5cae9] rounded-[6px] p-20 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-white w-full flex flex-col items-center justify-center"
          >
            <i className="fas fa-cloud-arrow-up text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Or Drag & Drop Images Here</h3>
            <p className="text-[10px] text-slate-400 mb-8 font-bold uppercase tracking-[2px]">Resize based on CM & DPI</p>
            <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl group-hover:bg-[#004d40]">Select Images</button>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} className="hidden" accept="image/*" multiple />
          </div>
        )}

        {/* STEP 2: CONFIGURE */}
        {activeStep === 'config' && (
          <div className="w-full flex flex-col items-center space-y-10 animate-in slide-in-from-right-4 duration-300">
            {/* Image Grid Previews */}
            <div className="flex flex-wrap justify-center gap-4 w-full">
              {images.map(img => (
                <div key={img.id} className="relative w-32 h-32 border-2 py7-border-default rounded-[4px] bg-slate-50 p-2 group shadow-sm overflow-hidden">
                  <img src={img.preview} className="w-full h-full object-contain" alt="Preview" />
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
              {images.length < 10 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 border-2 border-dashed py7-border-default rounded-[4px] flex flex-col items-center justify-center text-slate-300 hover:text-[#3f51b5] hover:bg-indigo-50/20 transition-all"
                >
                  <i className="fas fa-plus text-xl mb-2"></i>
                  <span className="text-[9px] font-black uppercase">Add More</span>
                </button>
              )}
            </div>

            {/* Config Area */}
            <div className="bg-slate-50 border py7-border-default p-8 rounded-[4px] w-full max-w-xl space-y-8 shadow-sm">
              <div className="flex flex-col items-center gap-6">
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={maintainAspectRatio} 
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)} 
                    className="w-4 h-4 accent-[#3f51b5]" 
                  />
                  <span className={`text-[11px] font-black uppercase tracking-widest ${maintainAspectRatio ? 'text-[#3f51b5]' : 'text-slate-400'}`}>Maintain Aspect Ratio</span>
                </label>

                <div className="flex items-center justify-center gap-6 w-full">
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">DPI</span>
                    <input 
                      type="text" 
                      value={dpi} 
                      onChange={(e) => setDpi(e.target.value)} 
                      className="w-full px-4 py-2.5 border-2 py7-border-default rounded-[4px] text-xs font-black text-center focus:border-[#3f51b5] outline-none transition-colors shadow-inner bg-white" 
                    />
                  </div>
                  <span className="text-slate-300 font-black pt-4">=</span>
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Width (CM)</span>
                    <input 
                      type="text" 
                      value={widthCm} 
                      onChange={(e) => updateWidthCm(e.target.value)} 
                      className="w-full px-4 py-2.5 border-2 py7-border-default rounded-[4px] text-xs font-black text-center focus:border-[#3f51b5] outline-none transition-colors shadow-inner bg-white" 
                    />
                  </div>
                  <span className="text-slate-300 font-black pt-4">X</span>
                  <div className="flex flex-col gap-2 flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Height (CM)</span>
                    <input 
                      type="text" 
                      value={heightCm} 
                      onChange={(e) => updateHeightCm(e.target.value)} 
                      className="w-full px-4 py-2.5 border-2 py7-border-default rounded-[4px] text-xs font-black text-center focus:border-[#3f51b5] outline-none transition-colors shadow-inner bg-white" 
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={enableCompression} 
                      onChange={(e) => setEnableCompression(e.target.checked)} 
                      className="w-4 h-4 accent-[#3f51b5]" 
                    />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${enableCompression ? 'text-[#3f51b5]' : 'text-slate-400'}`}>Compress Image To Specific Size (Ex. 50kb)</span>
                  </label>

                  {enableCompression && (
                    <div className="flex border-2 border-[#3f51b5] rounded-[4px] overflow-hidden shadow-sm animate-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        value={targetKb} 
                        onChange={(e) => setTargetKb(e.target.value)} 
                        className="w-24 px-4 py-2 text-xs font-black text-center outline-none bg-white" 
                        placeholder="50"
                      />
                      <span className="bg-slate-500 text-white px-3 flex items-center text-[10px] font-black uppercase tracking-widest">KB</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex flex-col gap-4 w-full">
                  <button 
                    onClick={processImages}
                    className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[4px] shadow-xl hover:bg-[#1a237e] transition-all transform active:scale-95"
                  >
                    Resize Image
                  </button>
                  <p className="text-[10px] font-black text-[#3f51b5]/60 uppercase tracking-widest text-center">Note:- You can resize 10 images at once.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {activeStep === 'processing' && (
          <div className="py-24 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
             <i className="fas fa-circle-notch fa-spin text-5xl text-[#3f51b5]"></i>
             <div className="text-center">
                <p className="text-[14px] font-black uppercase tracking-[5px] text-[#3f51b5] animate-pulse">Processing Pixels...</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[2px]">Calculating DPI & Dimensions</p>
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
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-[6px]">Resizing Ready</h2>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Target: {widthCm}x{heightCm} CM @ {dpi} DPI</p>
             </div>

             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full px-4">
                {images.map((img, idx) => (
                  <div key={idx} className="bg-white border-2 py7-border-default p-2 rounded-[4px] text-center shadow-sm flex flex-col items-center">
                     <div className="aspect-square bg-[#f8f9fc] border py7-border-default rounded-sm mb-3 flex items-center justify-center overflow-hidden w-full">
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
                  Resize New Images
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

export default ResizeCmTool;
