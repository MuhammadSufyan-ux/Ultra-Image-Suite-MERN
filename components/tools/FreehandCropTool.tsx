
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Point { x: number; y: number; }

interface FreehandCropToolProps { onBack: () => void; }

const FreehandCropTool: React.FC<FreehandCropToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { setSelectedImage(event.target?.result as string); setPoints([]); setCroppedImage(null); setZoom(1); };
      reader.readAsDataURL(file);
    }
  };

  const addPoint = (e: React.MouseEvent) => {
    if (!imageRef.current || draggedPointIndex !== null) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPoints([...points, { x, y }]);
  };

  const executeCrop = async () => {
    if (points.length < 3 || !imageRef.current) { alert("Please select at least 3 points."); return; }
    setIsProcessing(true);
    const img = new Image();
    img.src = selectedImage!;
    await new Promise(res => { img.onload = res; });
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    const canvas = document.createElement('canvas');
    canvas.width = (maxX - minX) * (img.width / 100);
    canvas.height = (maxY - minY) * (img.height / 100);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    points.forEach((p, i) => { const pxX = (p.x - minX) * (img.width / 100); const pxY = (p.y - minY) * (img.height / 100); if (i === 0) ctx.moveTo(pxX, pxY); else ctx.lineTo(pxX, pxY); });
    ctx.closePath(); ctx.clip();
    ctx.drawImage(img, (minX / 100) * img.width, (minY / 100) * img.height, img.width * ((maxX - minX) / 100), img.height * ((maxY - minY) / 100), 0, 0, canvas.width, canvas.height);
    setCroppedImage(canvas.toDataURL('image/png'));
    setIsProcessing(false);
  };

  // Fix: Added missing reset function to clear the workspace and select a new image
  const reset = () => {
    setSelectedImage(null);
    setPoints([]);
    setCroppedImage(null);
    setZoom(1);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      {!selectedImage ? (
        <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] p-8 md:p-12 flex items-center justify-center min-h-[400px]">
          <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-12 text-center hover:bg-slate-50 cursor-pointer transition-all bg-white flex flex-col items-center justify-center shadow-inner">
            <i className="fas fa-scissors text-5xl text-indigo-100 mb-6"></i>
            <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-widest mb-1">Select Photo to Crop</h3>
            <p className="text-[9px] font-bold text-slate-300 uppercase mb-8">Freehand Path Tool</p>
            <button className="px-12 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl">Choose Photo</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden">
          <div className="flex-1 bg-slate-100 p-8 flex flex-col items-center relative overflow-hidden">
             <div className="relative shadow-2xl bg-white border-4 border-white overflow-hidden max-w-full" onClick={addPoint}>
                <img ref={imageRef} src={selectedImage} className="max-h-[500px] w-auto block pointer-events-none" />
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                   {points.length > 1 && <polyline points={points.map(p => `${p.x}%,${p.y}%`).join(' ')} fill="rgba(63, 81, 181, 0.2)" stroke="#3f51b5" strokeWidth="2" strokeDasharray="4" />}
                   {points.length > 2 && <line x1={`${points[points.length-1].x}%`} y1={`${points[points.length-1].y}%`} x2={`${points[0].x}%`} y2={`${points[0].y}%`} stroke="#3f51b5" strokeWidth="2" strokeDasharray="4" />}
                </svg>
                {points.map((p, idx) => (
                  <div key={idx} className={`absolute w-3 h-3 border-2 border-white rounded-full z-20 shadow-md ${idx === 0 ? 'bg-green-500 scale-125' : 'bg-[#3f51b5]'}`} style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }} />
                ))}
             </div>
             <div className="mt-8 flex gap-3">
                <button onClick={() => setPoints([])} className="px-5 py-2 bg-white border py7-border-default text-red-500 rounded-sm font-black text-[10px] uppercase shadow-sm">Reset</button>
                <button onClick={executeCrop} className="px-10 py-2 bg-[#3f51b5] text-white rounded-sm font-black text-[11px] uppercase shadow-lg hover:bg-[#1a237e]">Process Crop</button>
             </div>
          </div>
          <div className="w-full lg:w-96 bg-slate-50 p-8 flex flex-col items-center border-l py7-border-default shadow-inner">
             {croppedImage ? (
                <div className="w-full flex flex-col items-center animate-in slide-in-from-right-4 duration-500">
                    <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                    <h3 className="text-sm font-black text-slate-800 uppercase mb-6 tracking-widest">Crop Successful</h3>
                    <div className="bg-white p-4 border-4 border-white shadow-xl rounded-sm mb-10 overflow-hidden"><img src={croppedImage} className="max-h-60" /></div>
                    <button onClick={() => { const a = document.createElement('a'); a.href = croppedImage; a.download = `py7-crop.png`; a.click(); }} className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[3px] shadow-2xl">Download HD</button>
                    <button onClick={reset} className="text-[#3f51b5] font-black uppercase text-[10px] border-b-2 border-indigo-200 mt-6 tracking-widest hover:text-[#1a237e]">New Image</button>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40 text-slate-300">
                    <i className="fas fa-scissors text-5xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase text-center tracking-[4px]">Awaiting Path Selection</p>
                </div>
             )}
          </div>
        </div>
      )}
      <div className="mt-16 text-center"><p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p></div>
    </div>
  );
};

export default FreehandCropTool;
