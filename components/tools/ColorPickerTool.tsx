
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ColorEntry {
  hex: string;
  rgb: string;
}

interface ColorPickerToolProps {
  onBack: () => void;
}

const ColorPickerTool: React.FC<ColorPickerToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorEntry[]>([]);
  const [activeColor, setActiveColor] = useState<ColorEntry>({ hex: '#3f51b5', rgb: 'rgb(63, 81, 181)' });
  const [pickerPos, setPickerPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setPalette([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const getColorAtPosition = (clientX: number, clientY: number) => {
    if (!imageRef.current || !selectedImage) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // Create a temporary canvas to sample the pixel
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const pxX = Math.floor((x / 100) * img.naturalWidth);
    const pxY = Math.floor((y / 100) * img.naturalHeight);
    const pixel = ctx.getImageData(pxX, pxY, 1, 1).data;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    const rgb = `rgb(${r}, ${g}, ${b})`;

    return { hex, rgb, x, y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const colorData = getColorAtPosition(e.clientX, e.clientY);
    if (colorData) {
      setActiveColor({ hex: colorData.hex, rgb: colorData.rgb });
      setPickerPos({ x: colorData.x, y: colorData.y });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const colorData = getColorAtPosition(e.clientX, e.clientY);
    if (colorData) {
      addToPalette({ hex: colorData.hex, rgb: colorData.rgb });
    }
  };

  const addToPalette = (color: ColorEntry) => {
    if (!palette.some(c => c.hex === color.hex)) {
      setPalette(prev => [color, ...prev].slice(0, 20));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple UI feedback could be added here
  };

  const autoExtractPalette = async () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 100; // Small sample
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);
    const imageData = ctx.getImageData(0, 0, 100, 100).data;
    
    const colorsFound: Record<string, number> = {};
    for (let i = 0; i < imageData.length; i += 40) { // Step to speed up
      const r = imageData[i];
      const g = imageData[i+1];
      const b = imageData[i+2];
      const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      colorsFound[hex] = (colorsFound[hex] || 0) + 1;
    }

    const sorted = Object.entries(colorsFound).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const newPalette = sorted.map(([hex]) => {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return { hex, rgb: `rgb(${r}, ${g}, ${b})` };
    });
    
    setPalette(newPalette);
  };

  const downloadPalette = () => {
    const content = palette.map(c => `${c.hex} - ${c.rgb}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'py7-color-palette.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Find Color Code From Image | HEX & RGB</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Welcome to Py7 Image Tool - Your Reliable Solution for Extracting HEX & RGB Color Codes!</p>
      </div>

      <div className="bg-white border-2 py7-border-default rounded-[4px] shadow-sm overflow-hidden flex flex-col items-center">
        {!selectedImage ? (
          <div className="w-full p-24 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-eye-dropper text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Extract Colors</h3>
              <button className="px-12 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Select Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col lg:flex-row min-h-[600px]">
            {/* Left: Image Workspace */}
            <div className="flex-1 bg-slate-100 p-8 flex flex-col items-center justify-center border-r py7-border-default relative">
              <div className="bg-white p-2 border py7-border-default rounded-sm shadow-sm mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase text-center">Click On Image To Pick Color</p>
              </div>

              <div className="relative group cursor-crosshair">
                <img 
                  ref={imageRef}
                  src={selectedImage} 
                  className="max-h-[500px] w-auto block border-4 border-white shadow-2xl" 
                  alt="Source"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onClick={handleClick}
                />
                
                {/* Visual Picker Overlay */}
                {isHovering && (
                  <div 
                    className="absolute w-24 h-24 rounded-full border-4 border-white shadow-2xl pointer-events-none flex items-center justify-center overflow-hidden z-20"
                    style={{ 
                      left: `${pickerPos.x}%`, 
                      top: `${pickerPos.y}%`, 
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: activeColor.hex 
                    }}
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-10 px-8 py-2 bg-white border py7-border-default rounded-sm text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2"
              >
                <i className="fas fa-file-arrow-up"></i> Upload New Image
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </button>
            </div>

            {/* Right: Palette Panel */}
            <div className="w-full lg:w-[480px] p-8 md:p-12 flex flex-col bg-white">
              <div className="bg-[#f0f2fa] border-2 py7-border-default rounded-[4px] flex flex-col overflow-hidden">
                <div className="bg-white/50 p-2 text-center border-b py7-border-default">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color Palette</span>
                </div>
                
                <div className="p-6 grid grid-cols-5 gap-3">
                  {palette.map((color, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setActiveColor(color)}
                      className="aspect-square rounded-[4px] border py7-border-default shadow-sm cursor-pointer hover:scale-110 transition-transform relative group"
                      style={{ backgroundColor: color.hex }}
                    >
                       <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[4px]">
                          <i className="fas fa-check text-white text-[10px]"></i>
                       </div>
                    </div>
                  ))}
                  {palette.length === 0 && (
                    <div className="col-span-5 py-4 text-center">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No colors saved yet</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white/30 border-t py7-border-default flex gap-3 justify-center">
                   <button 
                    onClick={autoExtractPalette}
                    className="px-4 py-2 bg-white border py7-border-default rounded-sm text-[9px] font-black text-[#3f51b5] uppercase hover:bg-slate-50 transition-colors"
                   >
                     + Load More Colors
                   </button>
                   <button 
                    onClick={downloadPalette}
                    className="px-4 py-2 bg-white border py7-border-default rounded-sm text-[9px] font-black text-[#3f51b5] uppercase hover:bg-slate-50 transition-colors"
                   >
                     Download Palette
                   </button>
                </div>
              </div>

              {/* Active Info */}
              <div className="mt-8 bg-white border-2 py7-border-default rounded-[4px] overflow-hidden flex flex-col md:flex-row">
                 <div className="w-full md:w-32 aspect-video md:aspect-auto border-b md:border-b-0 md:border-r py7-border-default" style={{ backgroundColor: activeColor.hex }}></div>
                 <div className="flex-1 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight">HEX: <span className="text-slate-800 ml-1">#ffc0b1</span></p>
                       <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight">{activeColor.hex}</span>
                          <button onClick={() => copyToClipboard(activeColor.hex)} className="text-slate-300 hover:text-[#3f51b5] transition-colors"><i className="fas fa-copy"></i></button>
                       </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-tight">RGB: <span className="text-slate-800 ml-1">rgba(255,192,177)</span></p>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{activeColor.rgb}</span>
                          <button onClick={() => copyToClipboard(activeColor.rgb)} className="text-slate-300 hover:text-[#3f51b5] transition-colors"><i className="fas fa-copy"></i></button>
                       </div>
                    </div>
                    <button 
                      onClick={() => addToPalette(activeColor)}
                      className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest hover:underline underline-offset-4"
                    >
                      + Add Color To Palette
                    </button>
                 </div>
              </div>

              <div className="mt-auto pt-10 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-20 text-center space-y-12">
        <div className="flex justify-center gap-12 text-slate-200">
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#3f51b5] group-hover:text-[#3f51b5] transition-all shadow-sm">
                <i className="fab fa-linkedin-in text-lg"></i>
              </div>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#3f51b5] group-hover:text-[#3f51b5] transition-all shadow-sm">
                <i className="fab fa-twitter text-lg"></i>
              </div>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-green-500 group-hover:text-green-500 transition-all shadow-sm">
                <i className="fab fa-whatsapp text-lg"></i>
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerTool;
