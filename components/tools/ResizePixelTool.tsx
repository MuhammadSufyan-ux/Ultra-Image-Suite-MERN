
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
}

interface ResizePixelToolProps {
  onBack: () => void;
}

const ResizePixelTool: React.FC<ResizePixelToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [targetWidth, setTargetWidth] = useState<number>(1280);
  const [targetHeight, setTargetHeight] = useState<number>(720);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [enableCompression, setEnableCompression] = useState(false);
  const [targetKb, setTargetKb] = useState(100);
  const [outputFormat, setOutputFormat] = useState<'JPEG' | 'PNG' | 'WEBP'>('JPEG');
  
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'processing' | 'download'>('upload');
  const [activeCropId, setActiveCropId] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [cropInteraction, setCropInteraction] = useState<'none' | 'dragging' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

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
      newImages.push({ id: Math.random().toString(36).substr(2, 9), file, preview, originalSize: Math.round(file.size / 1024), width: dimensions.w, height: dimensions.h });
    }
    setImages(prev => [...prev, ...newImages].slice(0, 10));
    setActiveStep('edit');
  };

  const updateWidth = (val: number) => {
    setTargetWidth(val);
    if (maintainAspectRatio && images.length > 0) {
      const ratio = images[0].height / images[0].width;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const updateHeight = (val: number) => {
    setTargetHeight(val);
    if (maintainAspectRatio && images.length > 0) {
      const ratio = images[0].width / images[0].height;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const processBatch = async () => {
    setActiveStep('processing');
    const processed = [];
    for (const imgFile of images) {
      const result = await new Promise<ImageFile>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(imgFile);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          let mime = outputFormat === 'JPEG' ? 'image/jpeg' : `image/${outputFormat.toLowerCase()}`;
          let dataUrl = canvas.toDataURL(mime, 0.92);
          resolve({ ...imgFile, processedPreview: dataUrl, processedSize: Math.round((dataUrl.length * (3/4)) / 1024) });
        };
        img.src = imgFile.preview;
      });
      processed.push(result);
    }
    setImages(processed);
    setTimeout(() => setActiveStep('download'), 800);
  };

  const downloadAll = () => {
    images.forEach((img, idx) => {
      const link = document.createElement('a');
      link.href = img.processedPreview || img.preview;
      link.download = `py7-resized-${idx + 1}.${outputFormat.toLowerCase()}`;
      link.click();
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
      const sens = 0.3; let { x, y, width, height } = { ...prev };
      if (cropInteraction === 'dragging') { x += dx * sens; y += dy * sens; }
      else if (cropInteraction === 'nw') { x += dx * sens; y += dy * sens; width -= dx * sens; height -= dy * sens; }
      else if (cropInteraction === 'ne') { y += dy * sens; width += dx * sens; height -= dy * sens; }
      else if (cropInteraction === 'sw') { x += dx * sens; width -= dx * sens; height += dy * sens; }
      else if (cropInteraction === 'se') { width += dx * sens; height += dy * sens; }
      return { x: Math.max(0, Math.min(100 - width, x)), y: Math.max(0, Math.min(100 - height, y)), width: Math.max(5, Math.min(100 - x, width)), height: Math.max(5, Math.min(100 - y, height)) };
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
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-10 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Resize Image Pixel</h1>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm p-8 flex items-center justify-center">
        {activeStep === 'upload' && (
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-indigo-100 rounded-[8px] p-12 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-slate-50/30 w-full">
            <i className="fas fa-images text-5xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Images</h3>
            <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#1a237e]">Upload Photos</button>
            <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} multiple className="hidden" accept="image/*" />
          </div>
        )}

        {activeStep === 'edit' && (
          <div className="space-y-12 animate-in fade-in duration-500 w-full flex flex-col items-center">
            <div className="max-w-3xl mx-auto space-y-8 bg-slate-50/50 p-8 rounded-[4px] border py7-border-default w-full">
               <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-4">
                     <input type="number" value={targetWidth} onChange={(e) => updateWidth(parseInt(e.target.value) || 0)} className="w-28 px-4 py-2 border-2 py7-border-default rounded-[4px] text-sm font-black text-center outline-none focus:border-[#3f51b5]" />
                     <span className="text-slate-300 font-black">X</span>
                     <input type="number" value={targetHeight} onChange={(e) => updateHeight(parseInt(e.target.value) || 0)} className="w-28 px-4 py-2 border-2 py7-border-default rounded-[4px] text-sm font-black text-center outline-none focus:border-[#3f51b5]" />
                  </div>
                  <button onClick={processBatch} className="px-16 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[14px] uppercase tracking-[4px] shadow-xl hover:bg-[#1a237e] transition-all">Resize Images</button>
               </div>
            </div>
          </div>
        )}

        {activeStep === 'processing' && (
          <div className="py-24 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
             <div className="w-16 h-16 border-4 border-[#3f51b5] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[14px] font-black uppercase tracking-[5px] text-[#3f51b5]">Scaling Pixels...</p>
          </div>
        )}

        {activeStep === 'download' && (
          <div className="py-12 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-6 duration-700 w-full">
             <i className="fas fa-check-circle text-6xl text-green-500 mb-2"></i>
             <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Ready to Download!</h2>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Images resized to {targetWidth}x{targetHeight}</p>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
                {images.map((img, idx) => (
                  <div key={idx} className="bg-white border-2 py7-border-default p-2 rounded-[4px] text-center shadow-sm">
                     <div className="aspect-square bg-slate-50 border py7-border-default rounded-sm mb-2 flex items-center justify-center overflow-hidden">
                        <img src={img.processedPreview} className="max-h-full max-w-full object-contain" />
                     </div>
                     <p className="text-[10px] font-black text-[#3f51b5]">{img.processedSize} KB</p>
                  </div>
                ))}
             </div>
             <div className="flex flex-col gap-4 w-full max-w-sm mt-6">
                <button onClick={downloadAll} className="w-full px-12 py-5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[14px] uppercase tracking-[4px] shadow-2xl hover:bg-[#1a237e] flex items-center justify-center gap-4">
                  <i className="fas fa-download"></i> Download All Images
                </button>
                <button onClick={() => { setImages([]); setActiveStep('upload'); }} className="text-[#3f51b5] font-black uppercase text-[11px] border-b-2 border-indigo-100 mt-2 hover:text-[#1a237e] tracking-widest">Replace Images</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResizePixelTool;
