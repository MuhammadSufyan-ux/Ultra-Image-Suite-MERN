
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface JoinImageFile {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
}

interface JoinImagesToolProps {
  onBack: () => void;
}

const JoinImagesTool: React.FC<JoinImagesToolProps> = ({ onBack }) => {
  const [images, setImages] = useState<JoinImageFile[]>([]);
  const [direction, setDirection] = useState<'Horizontal' | 'Vertical'>('Horizontal');
  const [arrange, setArrange] = useState<'Proper Align' | 'Free Style'>('Proper Align');
  const [addBorder, setAddBorder] = useState(false);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [borderSize, setBorderSize] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [joinedImage, setJoinedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newImages: JoinImageFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      const img = new Image();
      const dimensions = await new Promise<{ w: number, h: number }>((resolve) => {
        img.onload = () => resolve({ w: img.width, h: img.height });
        img.src = preview;
      });

      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        width: dimensions.w,
        height: dimensions.h
      });
    }

    setImages(prev => [...prev, ...newImages]);
    setJoinedImage(null);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setJoinedImage(null);
  };

  const generateJoin = async () => {
    if (images.length < 2) {
      alert("Please upload at least 2 images to join.");
      return;
    }

    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loadedImages = await Promise.all(images.map(imgData => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = imgData.preview;
      });
    }));

    const bSize = addBorder ? borderSize : 0;
    
    // Calculate total canvas dimensions
    let totalW = 0;
    let totalH = 0;

    if (direction === 'Horizontal') {
      const maxHeight = Math.max(...loadedImages.map(img => img.height));
      totalH = maxHeight + (bSize * 2);
      
      loadedImages.forEach(img => {
        const ratio = maxHeight / img.height;
        totalW += (img.width * ratio) + (bSize * 2);
      });
    } else {
      const maxWidth = Math.max(...loadedImages.map(img => img.width));
      totalW = maxWidth + (bSize * 2);
      
      loadedImages.forEach(img => {
        const ratio = maxWidth / img.width;
        totalH += (img.height * ratio) + (bSize * 2);
      });
    }

    canvas.width = totalW;
    canvas.height = totalH;

    if (addBorder) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, totalW, totalH);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalW, totalH);
    }

    let currentOffset = 0;
    loadedImages.forEach((img, idx) => {
      if (direction === 'Horizontal') {
        const maxHeight = totalH - (bSize * 2);
        const ratio = maxHeight / img.height;
        const drawW = img.width * ratio;
        const drawH = maxHeight;
        
        ctx.drawImage(img, currentOffset + bSize, bSize, drawW, drawH);
        currentOffset += drawW + (bSize * 2);
      } else {
        const maxWidth = totalW - (bSize * 2);
        const ratio = maxWidth / img.width;
        const drawW = maxWidth;
        const drawH = img.height * ratio;
        
        ctx.drawImage(img, bSize, currentOffset + bSize, drawW, drawH);
        currentOffset += drawH + (bSize * 2);
      }
    });

    setJoinedImage(canvas.toDataURL('image/jpeg', 0.95));
    setIsProcessing(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Join Images Online: Free & Easy Photo Merger</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Stitch multiple photos into one high-quality document instantly.</p>
      </div>

      <div className="bg-white border-2 py7-border-default rounded-[4px] shadow-sm overflow-hidden flex flex-col">
        
        {/* Upload & Grid Area */}
        <div className="p-8 md:p-12 bg-slate-50/50">
          {images.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-white cursor-pointer transition-all group bg-white flex flex-col items-center justify-center gap-6"
            >
              <i className="fas fa-images text-6xl text-indigo-100 group-hover:scale-110 transition-transform"></i>
              <div className="space-y-1">
                <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest">Select Images to Join</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">You can upload multiple files at once</p>
              </div>
              <button className="px-12 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Select Photos</button>
              <input type="file" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} multiple className="hidden" accept="image/*" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((img) => (
                <div key={img.id} className="relative bg-white border-2 py7-border-default rounded-[4px] overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-all">
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
                      <button className="bg-[#3f51b5] text-white text-[8px] font-black px-2 py-1 rounded-sm shadow-md"><i className="fas fa-crop-simple"></i></button>
                      <button onClick={() => removeImage(img.id)} className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-sm shadow-md"><i className="fas fa-trash"></i></button>
                   </div>
                   <div className="aspect-video flex items-center justify-center p-3 bg-slate-50 relative overflow-hidden">
                      <img src={img.preview} className="max-h-full max-w-full object-contain shadow-sm" alt="Thumbnail" />
                   </div>
                   <div className="p-3 bg-white border-t py7-border-default">
                      <p className="text-[9px] font-black text-slate-700 truncate uppercase border-b border-slate-50 pb-1 mb-2">{img.file.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{img.width} x {img.height} PX</p>
                   </div>
                </div>
              ))}
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video border-2 border-dashed border-[#c5cae9] rounded-[4px] flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-[#3f51b5] hover:bg-white hover:shadow-sm cursor-pointer transition-all bg-white/40"
              >
                <i className="fas fa-plus-circle text-2xl"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Add Images</span>
              </div>
            </div>
          )}
        </div>

        {/* Workspace Settings Controls */}
        {images.length > 0 && (
          <div className="border-t py7-border-default bg-white p-8 md:p-12 space-y-12">
            <div className="flex flex-wrap justify-center gap-12 lg:gap-20">
              {/* Orientation Setting */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] border-b border-slate-100 pb-2">Orientation</p>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-full border py7-border-default">
                  <button 
                    onClick={() => setDirection('Horizontal')}
                    className={`px-6 py-2 text-[9px] font-black uppercase rounded-full transition-all flex items-center gap-2 ${direction === 'Horizontal' ? 'bg-[#3f51b5] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <i className="fas fa-grip-lines-vertical"></i> Horizontal
                  </button>
                  <button 
                    onClick={() => setDirection('Vertical')}
                    className={`px-6 py-2 text-[9px] font-black uppercase rounded-full transition-all flex items-center gap-2 ${direction === 'Vertical' ? 'bg-[#3f51b5] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <i className="fas fa-grip-lines"></i> Vertical
                  </button>
                </div>
              </div>

              {/* Layout Setting */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] border-b border-slate-100 pb-2">Layout Mode</p>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-full border py7-border-default">
                   <button 
                    onClick={() => setArrange('Proper Align')}
                    className={`px-6 py-2 text-[9px] font-black uppercase rounded-full transition-all ${arrange === 'Proper Align' ? 'bg-[#3f51b5] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Proper Align
                  </button>
                  <button 
                    onClick={() => setArrange('Free Style')}
                    className={`px-6 py-2 text-[9px] font-black uppercase rounded-full transition-all ${arrange === 'Free Style' ? 'bg-[#3f51b5] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Free Style
                  </button>
                </div>
              </div>

              {/* Borders Setting */}
              <div className="space-y-4 min-w-[220px]">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] border-b border-slate-100 pb-2">Image Padding</p>
                 <div className="flex items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={addBorder} onChange={() => setAddBorder(!addBorder)} className="w-5 h-5 accent-[#3f51b5] rounded-sm" />
                      <span className="text-[11px] font-black text-slate-700 uppercase group-hover:text-[#3f51b5]">Add Border</span>
                    </label>
                    {addBorder && (
                      <div className="flex items-center gap-4 animate-in slide-in-from-left-3 duration-300">
                        <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" title="Border Color" />
                        <div className="flex items-center border-2 py7-border-default rounded-sm overflow-hidden h-9 bg-white shadow-inner">
                           <input type="number" value={borderSize} onChange={(e) => setBorderSize(parseInt(e.target.value)||0)} className="w-12 text-center text-[11px] font-black outline-none bg-transparent" />
                           <span className="bg-slate-50 px-2 flex items-center text-[9px] font-black uppercase border-l text-slate-400">PX</span>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-6">
               <button 
                onClick={generateJoin}
                className="px-20 py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[4px] shadow-2xl hover:bg-[#1a237e] transition-all transform active:scale-95 flex items-center gap-3"
               >
                 <i className="fas fa-object-group"></i> Join Images
               </button>
               <p className="text-[10px] font-black text-[#3f51b5]/60 uppercase tracking-[2px]">Powered by Muhammad Sufyan</p>
            </div>
          </div>
        )}
      </div>

      {/* Results Workspace - Seamlessly integrated */}
      {(joinedImage || isProcessing) && (
        <div className="mt-12 bg-white border-2 py7-border-default rounded-[4px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
           <div className="p-4 bg-[#3f51b5] text-white flex justify-between items-center px-8 border-b-2 py7-border-default">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-file-image text-xs"></i>
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[3px]">Merged Document Workspace</span>
              </div>
              {joinedImage && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { const a = document.createElement('a'); a.href = joinedImage; a.download = `py7-join-${Date.now()}.jpg`; a.click(); }}
                    className="bg-white text-[#3f51b5] px-6 py-2 rounded-[2px] text-[10px] font-black uppercase shadow-lg flex items-center gap-2 hover:bg-[#f0f2fa] transition-colors"
                  >
                    <i className="fas fa-cloud-arrow-down"></i> Download HD
                  </button>
                  <button onClick={() => setJoinedImage(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
           </div>
           
           <div className="p-12 bg-[#f0f2fa] min-h-[500px] flex items-center justify-center overflow-x-auto custom-scrollbar relative">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-6 py-20 animate-in zoom-in duration-300">
                   <div className="relative">
                      <div className="w-16 h-16 border-4 border-[#3f51b5]/10 rounded-full"></div>
                      <div className="absolute inset-0 w-16 h-16 border-4 border-[#3f51b5] border-t-transparent rounded-full animate-spin"></div>
                   </div>
                   <div className="text-center">
                      <p className="text-[14px] font-black uppercase tracking-[6px] text-[#3f51b5]">Generating Result...</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[2px]">Calculating Pixel Matrix</p>
                   </div>
                </div>
              ) : (
                <div className="bg-white border-[16px] border-white shadow-2xl relative animate-in zoom-in-95 duration-500">
                   <img src={joinedImage!} className="max-w-none max-h-[1000px]" alt="Joined Result" />
                   <div className="absolute top-0 right-0 left-0 bottom-0 pointer-events-none border border-indigo-50/50"></div>
                </div>
              )}
           </div>

           <div className="p-6 bg-white border-t py7-border-default flex justify-between items-center px-8">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Py7 Media - WhatsApp: 3429748731</p>
              <div className="flex gap-6 text-slate-300">
                 <i className="fab fa-facebook-f hover:text-[#3f51b5] transition-colors cursor-pointer"></i>
                 <i className="fab fa-instagram hover:text-[#3f51b5] transition-colors cursor-pointer"></i>
                 <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="hover:text-green-500 transition-colors"><i className="fab fa-whatsapp"></i></a>
              </div>
           </div>
        </div>
      )}

      <div className="mt-20 text-center space-y-12">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
        <div className="flex justify-center gap-12 text-slate-200">
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#3f51b5] group-hover:text-[#3f51b5] transition-all">
                <i className="fab fa-linkedin-in text-lg"></i>
              </div>
              <span className="text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">LinkedIn</span>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#3f51b5] group-hover:text-[#3f51b5] transition-all">
                <i className="fab fa-twitter text-lg"></i>
              </div>
              <span className="text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Twitter</span>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-green-500 group-hover:text-green-500 transition-all">
                <i className="fab fa-whatsapp text-lg"></i>
              </a>
              <span className="text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">WhatsApp</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default JoinImagesTool;
