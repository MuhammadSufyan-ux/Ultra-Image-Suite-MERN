
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const passportColors = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Sky Blue', hex: '#ADD8E6' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Red', hex: '#FF0000' }
];

interface PassportPhotoToolProps {
  onBack: () => void;
}

const PassportPhotoTool: React.FC<PassportPhotoToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('size');
  const [selectedSize, setSelectedSize] = useState('india');
  
  const [customWidth, setCustomWidth] = useState('3.5');
  const [customHeight, setCustomHeight] = useState('4.5');

  const targetAspectRatio = useMemo(() => {
    if (selectedSize === 'india') return 3.5 / 4.5;
    if (selectedSize === 'usa') return 2 / 2;
    if (selectedSize === 'canada') return 50 / 70;
    const w = parseFloat(customWidth);
    const h = parseFloat(customHeight);
    return (w > 0 && h > 0) ? w / h : 1;
  }, [selectedSize, customWidth, customHeight]);

  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [vignette, setVignette] = useState(0);
  
  const [cropBox, setCropBox] = useState({ x: 15, y: 10, width: 70, height: 80 });
  const [cropInteraction, setCropInteraction] = useState<'none' | 'dragging' | 'nw' | 'ne' | 'sw' | 'se'>('none');

  useEffect(() => {
    const width = 60;
    const height = width / targetAspectRatio;
    let finalH = height, finalW = width;
    if (finalH > 90) { finalH = 90; finalW = finalH * targetAspectRatio; }
    setCropBox({ x: (100 - finalW) / 2, y: (100 - finalH) / 2, width: finalW, height: finalH });
  }, [targetAspectRatio]);

  const [backgroundStyle, setBackgroundStyle] = useState<'original' | 'processed'>('original');
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null);
  const [isBgRemoving, setIsBgRemoving] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isCustomColorActive, setIsCustomColorActive] = useState(false);

  const [selectedClothUrl, setSelectedClothUrl] = useState<string | null>(null);
  const [clothPos, setClothPos] = useState({ x: 0, y: 70, scale: 1.4, rotation: 0 }); 
  const [interaction, setInteraction] = useState<'none' | 'dragging' | 'resizing' | 'rotating'>('none');

  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  
  const lastMousePos = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ASSET_PATH = 'components/tools/passportToolClothes';
  const REMOVE_BG_API_KEY = 'igpZnxr44cdZCpW4LqzVyf3t';

  const clothAssets = Array.from({ length: 13 }, (_, i) => ({
    id: `c${i + 1}`, name: `Suit ${i + 1}`, file: `cloth${i + 1}.png`
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setRemovedBgImage(null); setFinalImage(null); setActiveTab('size'); 
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackgroundAPI = async () => {
    if (!selectedImage || isBgRemoving) return;
    setIsBgRemoving(true);
    setBackgroundStyle('processed');
    try {
      const blobResponse = await fetch(selectedImage);
      const blob = await blobResponse.blob();
      const formData = new FormData();
      formData.append('image_file', blob);
      const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        body: formData,
      });
      if (!apiResponse.ok) throw new Error('Failed to remove background');
      const resultBlob = await apiResponse.blob();
      const reader = new FileReader();
      reader.onloadend = () => { setRemovedBgImage(reader.result as string); setIsBgRemoving(false); };
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      setIsBgRemoving(false);
      alert("Error removing background.");
    }
  };

  const generateFinalImage = async () => {
    setIsGeneratingFinal(true);
    setActiveTab('download');
    try {
      const canvas = document.createElement('canvas');
      const baseWidth = 800;
      canvas.width = baseWidth;
      canvas.height = baseWidth / targetAspectRatio;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = backgroundStyle === 'processed' ? bgColor : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const personImg = new Image();
      await new Promise((resolve) => { personImg.onload = resolve; personImg.src = (backgroundStyle === 'processed' && removedBgImage) ? removedBgImage : selectedImage!; });
      const srcX = (cropBox.x / 100) * personImg.width;
      const srcY = (cropBox.y / 100) * personImg.height;
      const srcW = (cropBox.width / 100) * personImg.width;
      const srcH = (cropBox.height / 100) * personImg.height;
      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(personImg, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      if (selectedClothUrl) {
        const clothImg = new Image();
        await new Promise((resolve) => { clothImg.onload = resolve; clothImg.src = selectedClothUrl; });
        const cw = (canvas.width * 0.7) * clothPos.scale;
        const ch = (clothImg.height / clothImg.width) * cw;
        ctx.save();
        ctx.translate(canvas.width/2 + (clothPos.x * (canvas.width/500)), canvas.height/2 + (clothPos.y * (canvas.height/500)));
        ctx.rotate((clothPos.rotation * Math.PI) / 180);
        ctx.drawImage(clothImg, -cw/2, -ch/2, cw, ch);
        ctx.restore();
      }
      setFinalImage(canvas.toDataURL('image/jpeg', 0.98));
    } catch (err) { console.error(err); } finally { setIsGeneratingFinal(false); }
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, type: any) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastMousePos.current = { x: clientX, y: clientY };
    if (activeTab === 'crop') setCropInteraction(type);
    else setInteraction(type);
  };

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastMousePos.current.x;
    const dy = clientY - lastMousePos.current.y;
    lastMousePos.current = { x: clientX, y: clientY };
    if (activeTab === 'crop') {
      if (cropInteraction === 'none') return;
      setCropBox(prev => {
        const sens = 0.5; let { x, y, width, height } = { ...prev };
        if (cropInteraction === 'dragging') { x += dx * sens; y += dy * sens; }
        else if (cropInteraction === 'nw') { const d = dx * sens; x += d; width -= d; height = width / targetAspectRatio; y = prev.y + (prev.height - height); }
        else if (cropInteraction === 'ne') { const d = dx * sens; width += d; height = width / targetAspectRatio; y = prev.y + (prev.height - height); }
        else if (cropInteraction === 'sw') { const d = dx * sens; x += d; width -= d; height = width / targetAspectRatio; }
        else if (cropInteraction === 'se') { const d = dx * sens; width += d; height = width / targetAspectRatio; }
        return { x: Math.max(0, Math.min(100 - width, x)), y: Math.max(0, Math.min(100 - height, y)), width: Math.max(5, Math.min(100 - x, width)), height: Math.max(5, Math.min(100 - y, height)) };
      });
    } else if (activeTab === 'cloth') {
      if (interaction === 'none') return;
      if (interaction === 'dragging') setClothPos(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      else if (interaction === 'resizing') setClothPos(prev => ({ ...prev, scale: Math.max(0.1, prev.scale + (dx + dy) / 400) }));
      else if (interaction === 'rotating') setClothPos(prev => ({ ...prev, rotation: prev.rotation + (dx * 0.5) }));
    }
  }, [interaction, cropInteraction, activeTab, targetAspectRatio]);

  const handleInteractionEnd = useCallback(() => { setInteraction('none'); setCropInteraction('none'); }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleInteractionMove);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchmove', handleInteractionMove);
    window.addEventListener('touchend', handleInteractionEnd);
    return () => { window.removeEventListener('mousemove', handleInteractionMove); window.removeEventListener('mouseup', handleInteractionEnd); window.removeEventListener('touchmove', handleInteractionMove); window.removeEventListener('touchend', handleInteractionEnd); };
  }, [handleInteractionMove, handleInteractionEnd]);

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4 pb-12">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      {!selectedImage ? (
        <div className="max-w-4xl mx-auto space-y-8 py-12">
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-indigo-200 rounded-[12px] p-12 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-white shadow-sm">
            <i className="fas fa-cloud-arrow-up text-5xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image</h3>
            <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-[#1a237e]">Upload Photo</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden">
          <div className="flex border-b-2 border-[#3f51b5] bg-indigo-50/30 overflow-x-auto no-scrollbar">
            {[
              { id: 'size', label: 'Size', icon: 'fa-expand' },
              { id: 'crop', label: 'Edit & Crop', icon: 'fa-crop' },
              { id: 'background', label: 'Background', icon: 'fa-image' },
              { id: 'cloth', label: 'Cloth', icon: 'fa-shirt' },
              { id: 'download', label: 'Download', icon: 'fa-download' }
            ].map(tab => (
              <button key={tab.id} onClick={() => { if (tab.id === 'download') generateFinalImage(); else setActiveTab(tab.id); }}
                className={`flex-1 min-w-[140px] py-5 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-[#3f51b5] text-white shadow-lg' : 'text-slate-500 hover:bg-white border-r py7-border-default/30'}`}
              >
                <i className={`fas ${tab.icon}`}></i> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4 md:p-12 min-h-[600px] flex flex-col items-center">
            {activeTab === 'size' && (
               <div className="animate-in slide-in-from-left-4 duration-300 w-full max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4">
                  <div onClick={() => setSelectedSize('india')} className={`p-10 border-2 rounded-[8px] cursor-pointer transition-all flex flex-col items-center text-center gap-4 bg-white shadow-sm ${selectedSize === 'india' ? 'border-[#3f51b5] scale-105 shadow-xl bg-indigo-50/20' : 'border-slate-100'}`}>
                    <p className="text-xs font-black text-slate-700 uppercase border-b pb-2">3.5 CM X 4.5 CM</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">India/Pak Standard</p>
                  </div>
                  {/* ... other sizes simplified for clarity ... */}
                </div>
                <div className="mt-16 flex justify-center">
                  <button onClick={() => setActiveTab('crop')} className="px-14 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-widest shadow-2xl hover:bg-[#1a237e]">Proceed to Edit</button>
                </div>
              </div>
            )}

            {activeTab === 'crop' && (
              <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col lg:flex-row items-start gap-12 w-full max-w-6xl">
                 <div className="flex-1 flex flex-col items-center">
                    <div className="relative border-4 border-white bg-slate-100 p-8 w-full flex justify-center overflow-hidden shadow-inner rounded-[4px]">
                      <div className="relative inline-block shadow-2xl overflow-hidden border-2 border-white select-none">
                        <img src={selectedImage!} className="max-h-[450px] object-contain transition-all" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`, transform: `scale(${zoom})` }} />
                        <div className="absolute border-4 border-[#3f51b5] border-dashed cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-20" 
                             style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.width}%`, height: `${cropBox.height}%`, touchAction: 'none' }} 
                             onMouseDown={(e) => handleInteractionStart(e, 'dragging')}>
                        </div>
                      </div>
                    </div>
                 </div>
                 <button onClick={() => setActiveTab('background')} className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase shadow-xl hover:bg-[#1a237e]">Save Adjustments</button>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col items-center w-full">
                <button onClick={removeBackgroundAPI} className={`flex-1 py-3 px-10 text-[11px] font-black uppercase tracking-widest border-2 rounded-[4px] bg-[#3f51b5] text-white border-[#3f51b5] shadow-lg`}>
                  {removedBgImage ? "Edit Colors" : "Remove Background"}
                </button>
                <button onClick={() => setActiveTab('cloth')} className="mt-8 px-14 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-widest shadow-xl hover:bg-[#1a237e]">Next Stage</button>
              </div>
            )}

            {activeTab === 'cloth' && (
              <div className="animate-in fade-in duration-500 flex flex-col items-center w-full">
                <button onClick={generateFinalImage} className="px-16 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[14px] uppercase shadow-2xl hover:bg-[#1a237e]">Generate Final Photo</button>
              </div>
            )}

            {activeTab === 'download' && (
              <div className="py-12 flex flex-col items-center justify-center w-full animate-in fade-in duration-500 text-center">
                {isGeneratingFinal ? (
                    <div className="flex flex-col items-center gap-8">
                       <div className="animate-spin w-16 h-16 border-4 border-[#3f51b5] border-t-transparent rounded-full"></div>
                       <p className="text-[12px] font-black uppercase tracking-[5px] text-[#3f51b5]">Exporting...</p>
                    </div>
                ) : (
                  <>
                    <i className="fas fa-check-circle text-6xl text-green-500 mb-6"></i>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-2">Ready for Download</h2>
                    <p className="text-[10px] font-bold text-slate-400 mb-8 uppercase tracking-widest">Your professional ID photo is ready.</p>
                    <div className="bg-white border-8 border-white shadow-2xl rounded-[4px] overflow-hidden mb-10 max-h-[400px]">
                       <img src={finalImage!} alt="Final Result" className="max-h-full" />
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                        <button onClick={() => { const a = document.createElement('a'); a.href = finalImage!; a.download = `py7-passport-${Date.now()}.jpg`; a.click(); }} 
                          className="w-full px-14 py-5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[14px] uppercase tracking-[4px] shadow-2xl hover:bg-[#1a237e] flex items-center justify-center gap-4"
                        >
                          <i className="fas fa-download"></i> Download High Quality
                        </button>
                        <button onClick={() => { setSelectedImage(null); setActiveTab('size'); }} className="text-[#3f51b5] font-black uppercase text-[11px] border-b-2 border-indigo-100 mt-4 tracking-widest hover:text-[#1a237e]">Replace Photo</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-20 text-center">
         <p className="text-[12px] font-black text-slate-300 uppercase tracking-[8px]">Powered by Muhammad Sufyan</p>
      </div>
    </div>
  );
};

export default PassportPhotoTool;
