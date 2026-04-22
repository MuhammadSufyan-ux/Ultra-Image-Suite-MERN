
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
  
  // Size Inputs
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

  // Image Adjustment States
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [vignette, setVignette] = useState(0);
  const [activeAdjustment, setActiveAdjustment] = useState('brightness');
  
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
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
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
      formData.append('size', 'auto');
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
      alert("Error removing background. Please ensure your API key is valid.");
    }
  };

  const generateFinalImage = async () => {
    setIsGeneratingFinal(true);
    setActiveTab('download');

    try {
      const canvas = document.createElement('canvas');
      const baseWidth = 800;
      const targetWidth = baseWidth; 
      const targetHeight = baseWidth / targetAspectRatio; 
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw BG
      ctx.fillStyle = backgroundStyle === 'processed' ? (isCustomColorActive ? customBgColor : bgColor) : '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const personImg = new Image();
      await new Promise((resolve) => { personImg.onload = resolve; personImg.src = (backgroundStyle === 'processed' && removedBgImage) ? removedBgImage : selectedImage!; });

      const srcX = (cropBox.x / 100) * personImg.width;
      const srcY = (cropBox.y / 100) * personImg.height;
      const srcW = (cropBox.width / 100) * personImg.width;
      const srcH = (cropBox.height / 100) * personImg.height;

      ctx.save();
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(personImg, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);
      ctx.restore();

      // Apply Vignette
      if (vignette > 0) {
        const gradient = ctx.createRadialGradient(targetWidth/2, targetHeight/2, targetWidth/4, targetWidth/2, targetHeight/2, targetWidth);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Draw Clothing
      if (selectedClothUrl) {
        const clothImg = new Image();
        await new Promise((resolve) => { clothImg.onload = resolve; clothImg.src = selectedClothUrl; });
        const finalClothWidth = (targetWidth * 0.7) * clothPos.scale;
        const finalClothHeight = (clothImg.height / clothImg.width) * finalClothWidth;
        const centerX = targetWidth / 2 + (clothPos.x * (targetWidth/500));
        const centerY = targetHeight / 2 + (clothPos.y * (targetHeight/500));
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((clothPos.rotation * Math.PI) / 180);
        ctx.drawImage(clothImg, -finalClothWidth / 2, -finalClothHeight / 2, finalClothWidth, finalClothHeight);
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
           <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Passport Photo Maker</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Powered by Muhammad Sufyan</p>
          </div>
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-indigo-200 rounded-[12px] p-24 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-white shadow-sm">
            <i className="fas fa-cloud-arrow-up text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest mb-2">Select Or Drag & Drop Image Here</h3>
            <p className="text-[11px] text-slate-400 mb-8 font-bold uppercase">Professional ID Photo Editor</p>
            <button className="px-12 py-4 bg-[#00796b] text-white rounded-[4px] font-black text-[12px] uppercase tracking-widest shadow-xl">Upload Source Image</button>
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
                <h2 className="text-center text-[#3f51b5] font-black text-sm uppercase tracking-[3px] mb-12">Select Document Format</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4">
                  <div onClick={() => setSelectedSize('india')} className={`p-10 border-2 rounded-[8px] cursor-pointer transition-all flex flex-col items-center text-center gap-4 bg-white shadow-sm ${selectedSize === 'india' ? 'border-[#3f51b5] scale-105 shadow-xl bg-indigo-50/20' : 'border-slate-100'}`}>
                    <p className="text-xs font-black text-slate-700 uppercase border-b pb-2">3.5 CM X 4.5 CM</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">India, Australia, Pakistan</p>
                  </div>
                  <div onClick={() => setSelectedSize('usa')} className={`p-10 border-2 rounded-[8px] cursor-pointer transition-all flex flex-col items-center text-center gap-4 bg-white shadow-sm ${selectedSize === 'usa' ? 'border-[#3f51b5] scale-105 shadow-xl bg-indigo-50/20' : 'border-slate-100'}`}>
                    <p className="text-xs font-black text-slate-700 uppercase border-b pb-2">2 Inch X 2 Inch</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">USA Visa</p>
                  </div>
                  <div onClick={() => setSelectedSize('canada')} className={`p-10 border-2 rounded-[8px] cursor-pointer transition-all flex flex-col items-center text-center gap-4 bg-white shadow-sm ${selectedSize === 'canada' ? 'border-[#3f51b5] scale-105 shadow-xl bg-indigo-50/20' : 'border-slate-100'}`}>
                    <p className="text-xs font-black text-slate-700 uppercase border-b pb-2">50 MM X 70MM</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 leading-relaxed">Canada Passport</p>
                  </div>
                  <div onClick={() => setSelectedSize('custom')} className={`p-10 border-2 rounded-[8px] cursor-pointer transition-all flex flex-col items-center text-center gap-4 bg-white shadow-sm ${selectedSize === 'custom' ? 'border-[#3f51b5] scale-105 shadow-xl bg-indigo-50/20' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                       <input type="text" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} className="w-12 border py-1.5 text-center text-xs font-bold" />
                       <span className="text-slate-300 text-xs font-black">X</span>
                       <input type="text" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} className="w-12 border py-1.5 text-center text-xs font-bold" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase border-t pt-2 w-full mt-2">Custom</p>
                  </div>
                </div>
                <div className="mt-16 flex justify-center">
                  <button onClick={() => setActiveTab('crop')} className="px-14 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-widest shadow-2xl">Proceed to Edit</button>
                </div>
              </div>
            )}

            {activeTab === 'crop' && (
              <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col lg:flex-row items-start gap-12 w-full max-w-6xl">
                 <div className="flex-1 flex flex-col items-center">
                    <h2 className="text-[#3f51b5] font-black text-sm uppercase tracking-[2px] mb-8">Crop & Adjust Face</h2>
                    <div className="relative border-4 border-white bg-slate-100 p-8 w-full flex justify-center overflow-hidden shadow-inner rounded-[4px]">
                      <div className="relative inline-block shadow-2xl overflow-hidden border-2 border-white select-none">
                        <img src={selectedImage!} className="max-h-[450px] object-contain transition-all" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`, transform: `scale(${zoom})` }} />
                        <div className="absolute border-4 border-[#3f51b5] border-dashed cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-20" 
                             style={{ left: `${cropBox.x}%`, top: `${cropBox.y}%`, width: `${cropBox.width}%`, height: `${cropBox.height}%`, touchAction: 'none' }} 
                             onMouseDown={(e) => handleInteractionStart(e, 'dragging')}>
                          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#3f51b5] rounded-full border-2 border-white shadow-md cursor-nw-resize" onMouseDown={(e) => handleInteractionStart(e, 'nw')}></div>
                          <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#3f51b5] rounded-full border-2 border-white shadow-md cursor-ne-resize" onMouseDown={(e) => handleInteractionStart(e, 'ne')}></div>
                          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#3f51b5] rounded-full border-2 border-white shadow-md cursor-sw-resize" onMouseDown={(e) => handleInteractionStart(e, 'sw')}></div>
                          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#3f51b5] rounded-full border-2 border-white shadow-md cursor-se-resize" onMouseDown={(e) => handleInteractionStart(e, 'se')}></div>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="w-full lg:w-80 bg-slate-50 border py7-border-default p-8 rounded-[8px] space-y-8 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-[#3f51b5] tracking-[3px] border-b-2 border-indigo-200 pb-2">Adjustments</p>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500"><span>Brightness</span> <span>{brightness}%</span></div>
                          <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full accent-[#3f51b5]" />
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500"><span>Contrast</span> <span>{contrast}%</span></div>
                          <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="w-full accent-[#3f51b5]" />
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500"><span>Saturation</span> <span>{saturation}%</span></div>
                          <input type="range" min="50" max="150" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} className="w-full accent-[#3f51b5]" />
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500"><span>Vignette</span> <span>{vignette}%</span></div>
                          <input type="range" min="0" max="100" value={vignette} onChange={(e) => setVignette(parseInt(e.target.value))} className="w-full accent-[#3f51b5]" />
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500"><span>Zoom</span> <span>{Math.round(zoom * 100)}%</span></div>
                          <input type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-[#3f51b5]" />
                       </div>
                    </div>
                    <button onClick={() => setActiveTab('background')} className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase shadow-xl hover:bg-[#1a237e] transition-all">Save Adjustments</button>
                 </div>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col items-center w-full">
                <h2 className="text-center text-[#3f51b5] font-black text-sm uppercase tracking-[2px] mb-8">Background Editing</h2>
                <div className="relative border-4 border-white bg-slate-100 p-10 w-full max-w-lg flex justify-center overflow-hidden mb-10 shadow-inner rounded-sm min-h-[450px]">
                   <div className="relative inline-block shadow-2xl overflow-hidden border-2 border-white min-h-[380px] min-w-[280px] flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" 
                        style={{ backgroundColor: backgroundStyle === 'processed' ? (isCustomColorActive ? customBgColor : bgColor) : 'transparent' }}>
                     {isBgRemoving ? (
                         <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin w-12 h-12 border-4 border-[#3f51b5] border-t-transparent rounded-full"></div>
                            <span className="text-[10px] font-black text-[#3f51b5] uppercase animate-pulse">Removing...</span>
                         </div>
                     ) : (
                         <img src={removedBgImage || selectedImage!} alt="Person" className="max-h-[380px] object-contain relative z-10" />
                     )}
                   </div>
                </div>

                <div className="w-full max-w-md space-y-8">
                   <div className="flex gap-4">
                      <button onClick={() => setBackgroundStyle('original')} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest border-2 rounded-[4px] transition-all ${backgroundStyle === 'original' ? 'bg-[#3f51b5] text-white border-[#3f51b5] shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>Use Original</button>
                      <button onClick={removeBackgroundAPI} className={`flex-1 py-3 text-[11px] font-black uppercase tracking-widest border-2 rounded-[4px] transition-all ${backgroundStyle === 'processed' ? 'bg-[#3f51b5] text-white border-[#3f51b5] shadow-lg' : 'bg-[#00796b] text-white border-[#00796b]'}`}>
                        {removedBgImage ? "Edit Colors" : "Remove Background"}
                      </button>
                   </div>

                   {backgroundStyle === 'processed' && removedBgImage && (
                     <div className="flex flex-wrap justify-center gap-4 animate-in fade-in">
                        {passportColors.map(c => (
                          <button key={c.hex} onClick={() => { setBgColor(c.hex); setIsCustomColorActive(false); }} className={`w-12 h-12 rounded-full border-4 shadow-md ${bgColor === c.hex && !isCustomColorActive ? 'border-[#3f51b5] scale-125' : 'border-white'}`} style={{ backgroundColor: c.hex }} />
                        ))}
                     </div>
                   )}
                </div>

                <div className="mt-16 flex gap-6">
                  <button onClick={() => setActiveTab('crop')} className="px-10 py-3 border-2 border-[#3f51b5] text-[#3f51b5] font-black text-[11px] uppercase tracking-widest">Back</button>
                  <button onClick={() => setActiveTab('cloth')} className="px-14 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-widest shadow-xl">Proceed to Cloth</button>
                </div>
              </div>
            )}

            {activeTab === 'cloth' && (
              <div className="animate-in fade-in duration-500 flex flex-col items-center w-full">
                <h2 className="text-center text-[#3f51b5] font-black text-sm uppercase tracking-[2px] mb-8">Overlay Professional Clothing</h2>
                <div className="relative border-4 border-white bg-slate-100 p-12 w-full max-w-2xl flex justify-center overflow-hidden mb-10 min-h-[550px] shadow-2xl rounded-sm">
                   <div className="relative inline-block overflow-hidden min-w-[300px] border-2 border-white" style={{ backgroundColor: backgroundStyle === 'processed' ? (isCustomColorActive ? customBgColor : bgColor) : '#ffffff' }}>
                      <img src={removedBgImage || selectedImage!} alt="Person" className="max-h-[450px] object-contain relative z-10" />
                      {selectedClothUrl && (
                        <div className="absolute z-20 cursor-move pointer-events-auto" style={{ left: `calc(50% + ${clothPos.x}px)`, top: `calc(50% + ${clothPos.y}px)`, transform: `translate(-50%, -50%) scale(${clothPos.scale}) rotate(${clothPos.rotation}deg)`, touchAction: 'none' }} onMouseDown={(e) => handleInteractionStart(e, 'dragging')}>
                          <img src={selectedClothUrl} className="w-[380px] drop-shadow-2xl" />
                          <button onClick={() => setSelectedClothUrl(null)} className="absolute -top-6 -right-6 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white hover:bg-red-800 transition-colors"><i className="fas fa-times text-xl"></i></button>
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#3f51b5] text-white rounded-full flex items-center justify-center cursor-pointer shadow-2xl border-2 border-white" onMouseDown={(e) => handleInteractionStart(e, 'rotating')}><i className="fas fa-rotate text-lg"></i></div>
                          <div className="absolute -bottom-6 -right-6 w-10 h-10 bg-white border-2 border-[#3f51b5] rounded-full flex items-center justify-center cursor-nwse-resize shadow-xl" onMouseDown={(e) => handleInteractionStart(e, 'resizing')}><i className="fas fa-arrows-alt-v text-xs text-[#3f51b5]"></i></div>
                        </div>
                      )}
                   </div>
                </div>

                <div className="w-full max-w-4xl border-2 border-[#3f51b5] rounded-[8px] bg-[#f0f2fa] flex overflow-hidden h-[180px] shadow-lg mb-8">
                   <div className="flex-1 overflow-x-auto p-4 flex items-center gap-6 bg-white custom-scrollbar">
                      {clothAssets.map((cloth) => (
                        <div key={cloth.id} onClick={() => { setSelectedClothUrl(`${ASSET_PATH}/${cloth.file}`); setClothPos({ x: 0, y: 70, scale: 1.4, rotation: 0 }); }} 
                          className={`flex-shrink-0 w-32 h-32 border-2 rounded-[6px] bg-[#f8f9fc] cursor-pointer transition-all flex items-center justify-center p-3 ${selectedClothUrl === `${ASSET_PATH}/${cloth.file}` ? 'border-[#3f51b5] shadow-xl scale-110' : 'border-slate-100'}`}
                        >
                           <img src={`${ASSET_PATH}/${cloth.file}`} className="h-full w-full object-contain" />
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-8 flex justify-center gap-6">
                  <button onClick={() => setActiveTab('background')} className="px-10 py-3 border-2 border-[#3f51b5] text-[#3f51b5] font-black text-[11px] uppercase tracking-widest">Back</button>
                  <button onClick={generateFinalImage} className="px-16 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[14px] uppercase shadow-2xl hover:bg-[#1a237e] tracking-widest">Generate Final Photo</button>
                </div>
              </div>
            )}

            {activeTab === 'download' && (
              <div className="py-20 flex flex-col items-center justify-center w-full animate-in fade-in duration-500 text-center">
                {isGeneratingFinal ? (
                    <div className="flex flex-col items-center gap-8">
                       <div className="animate-spin w-20 h-20 border-6 border-[#3f51b5] border-t-transparent rounded-full"></div>
                       <p className="text-[14px] font-black uppercase tracking-[5px] text-[#3f51b5]">Exporting Photo...</p>
                    </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest mb-10">Export Ready!</h2>
                    <div className="bg-white border-8 border-white shadow-2xl rounded-[4px] overflow-hidden mb-12">
                       <img src={finalImage!} alt="Final Result" className="max-h-[450px]" />
                    </div>
                    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
                        <button onClick={() => { const a = document.createElement('a'); a.href = finalImage!; a.download = `py7-passport-${Date.now()}.jpg`; a.click(); }} 
                          className="w-full px-14 py-5 bg-[#00796b] text-white rounded-[4px] font-black text-[15px] uppercase tracking-[4px] shadow-2xl hover:bg-[#004d40] flex items-center justify-center gap-4 transition-all"
                        >
                          <i className="fas fa-cloud-arrow-down"></i> Download High Quality
                        </button>
                        <button onClick={() => { setSelectedImage(null); setActiveTab('size'); }} className="text-[#3f51b5] font-black uppercase text-[11px] border-b-2 border-indigo-200 mt-4 tracking-widest">Create New Photo</button>
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
