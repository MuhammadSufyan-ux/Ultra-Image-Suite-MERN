
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface RemoveBgToolProps {
  onBack: () => void;
}

const RemoveBgTool: React.FC<RemoveBgToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'processing' | 'edit' | 'download'>('upload');
  const [activeTab, setActiveTab] = useState<'color' | 'crop'>('color');
  
  const [bgColor, setBgColor] = useState('transparent');
  const [customColor, setCustomColor] = useState('#ffffff');
  
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [cropInteraction, setCropInteraction] = useState<'none' | 'dragging' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  const lastMousePos = useRef({ x: 0, y: 0 });

  const [finalResult, setFinalResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKey = 'igpZnxr44cdZCpW4LqzVyf3t';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        processImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (file: File) => {
    setActiveStep('processing');
    const formData = new FormData();
    formData.append('image_file', file);
    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey },
        body: formData
      });
      if (!response.ok) throw new Error('Failed to remove background');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setRemovedBgImage(reader.result as string);
        setActiveStep('edit');
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      alert('Error removing background.');
      reset();
    }
  };

  const handleFinalize = async () => {
    if (!removedBgImage) return;
    setActiveStep('processing');
    const canvas = document.createElement('canvas');
    const img = new Image();
    await new Promise((resolve) => { img.onload = resolve; img.src = removedBgImage; });
    const sX = (cropBox.x / 100) * img.width;
    const sY = (cropBox.y / 100) * img.height;
    const sW = (cropBox.width / 100) * img.width;
    const sH = (cropBox.height / 100) * img.height;
    canvas.width = sW; canvas.height = sH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor === 'custom' ? customColor : bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, sW, sH);
    setFinalResult(canvas.toDataURL('image/png'));
    setActiveStep('download');
  };

  const reset = () => {
    setSelectedImage(null);
    setRemovedBgImage(null);
    setFinalResult(null);
    setActiveStep('upload');
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, type: any) => {
    if (activeTab !== 'crop') return;
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
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">AI Background Remover</h1>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm p-4 md:p-12 min-h-[500px] flex items-center justify-center">
        {activeStep === 'upload' && (
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-indigo-200 rounded-[8px] p-12 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-white w-full">
            <i className="fas fa-image text-5xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image</h3>
            <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#1a237e]">Upload Photo</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
        )}

        {activeStep === 'processing' && (
          <div className="py-20 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-300">
             <div className="w-16 h-16 border-4 border-[#3f51b5] border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[12px] font-black uppercase tracking-[3px] text-[#3f51b5]">Removing BG...</p>
          </div>
        )}

        {activeStep === 'edit' && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
             <div className="flex w-full max-w-5xl bg-[#f0f2fa] rounded-t-[4px] border-2 border-b-0 border-[#3f51b5]">
                <button onClick={() => setActiveTab('color')} className={`flex-1 py-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 ${activeTab === 'color' ? 'bg-[#3f51b5] text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>Color</button>
                <button onClick={() => setActiveTab('crop')} className={`flex-1 py-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 ${activeTab === 'crop' ? 'bg-[#3f51b5] text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>Crop</button>
             </div>

             <div className="w-full max-w-5xl border-2 border-[#3f51b5] p-10 flex flex-col lg:flex-row gap-8 items-center justify-center bg-[#fdfdfd]">
                <div className="relative shadow-2xl overflow-hidden border-2 border-white min-h-[350px] min-w-[300px] flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" style={{ backgroundColor: bgColor === 'custom' ? customColor : (bgColor === 'transparent' ? 'transparent' : bgColor) }}>
                  <img src={removedBgImage!} alt="Preview" className="max-h-[400px] object-contain relative z-10" />
                </div>
                <button onClick={handleFinalize} className="w-full lg:w-72 px-8 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#1a237e]">Apply & Save</button>
             </div>
          </div>
        )}

        {activeStep === 'download' && (
          <div className="w-full flex flex-col items-center gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <i className="fas fa-check-circle text-6xl text-green-500 mb-2"></i>
             <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Ready to Download</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Background successfully removed.</p>
             </div>
             <div className="bg-white border-4 border-white shadow-2xl rounded-[4px] overflow-hidden max-w-lg">
                <img src={finalResult!} alt="Result" className="max-h-[350px] object-contain" />
             </div>
             <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <button onClick={() => { const a = document.createElement('a'); a.href = finalResult!; a.download = `py7-extracted-${Date.now()}.png`; a.click(); }} className="w-full px-12 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[3px] shadow-2xl hover:bg-[#1a237e] flex items-center justify-center gap-3">
                  <i className="fas fa-download"></i> Download Result
                </button>
                <button onClick={reset} className="text-[#3f51b5] font-black uppercase text-[10px] border-b-2 border-indigo-200 mt-2 hover:text-[#1a237e]">Replace Image</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveBgTool;
