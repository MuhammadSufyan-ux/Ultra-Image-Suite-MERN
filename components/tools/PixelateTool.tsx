
import React, { useState, useRef, useEffect, useCallback } from 'react';

const PRESET_PALETTES = {
  'Default': ['#000000', '#1a1a1a', '#332211', '#554433', '#886644', '#aa8855', '#ccaa66', '#ddee77', '#77aa44', '#337744', '#225577', '#4466aa', '#5588cc', '#88ccaa', '#cccccc', '#998899', '#aa6644'],
  'Retro 8-bit': ['#000000', '#FFFFFF', '#880000', '#AAFFEE', '#CC44CC', '#00CC55', '#0000AA', '#EEEE77', '#DD8855', '#664400', '#FF7777', '#333333', '#777777', '#AAFF66', '#0088FF', '#BBBBBB'],
  'Nature': ['#2d5a27', '#4f7942', '#8da47e', '#dcd7a0', '#b87333', '#8b4513', '#deb887', '#f5f5dc'],
  'Vibrant': ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'],
  'Grayscale': ['#000000', '#222222', '#444444', '#666666', '#888888', '#aaaaaa', '#cccccc', '#eeeeee', '#ffffff']
};

interface PixelateToolProps {
  onBack: () => void;
}

const PixelateTool: React.FC<PixelateToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit'>('upload');
  
  // Controls
  const [blockSize, setBlockSize] = useState(25);
  
  // Palette Controls
  const [changeColorPalette, setChangeColorPalette] = useState(false);
  const [customPalette, setCustomPalette] = useState<string[]>(PRESET_PALETTES['Default']);
  const [selectedPreset, setSelectedPreset] = useState('Default');
  const [newPaletteColor, setNewPaletteColor] = useState('#3f51b5');

  const [applyGrayscale, setApplyGrayscale] = useState(false);
  
  // Grid Controls
  const [drawGridLines, setDrawGridLines] = useState(false);
  const [gridRows, setGridRows] = useState(20);
  const [gridCols, setGridCols] = useState(20);
  const [gridLineColor, setGridLineColor] = useState('#ffffff');

  // Edge Controls
  const [drawEdges, setDrawEdges] = useState(false);
  const [edgeLineWidth, setEdgeLineWidth] = useState(9);
  const [edgeThreshold, setEdgeThreshold] = useState(40);
  
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setActiveStep('edit');
        setProcessedPreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetChange = (name: string) => {
    setSelectedPreset(name);
    setCustomPalette(PRESET_PALETTES[name as keyof typeof PRESET_PALETTES]);
  };

  const addColorToPalette = () => {
    if (!customPalette.includes(newPaletteColor)) {
      setCustomPalette([...customPalette, newPaletteColor]);
    }
  };

  const removeColorFromPalette = (hex: string) => {
    setCustomPalette(customPalette.filter(c => c !== hex));
  };

  const applyPixelate = useCallback(async () => {
    if (!selectedImage) return;
    setIsProcessing(true);

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = selectedImage;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    if (applyGrayscale) {
      ctx.filter = 'grayscale(100%)';
    }
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';

    const w = canvas.width;
    const h = canvas.height;
    const size = Math.max(1, blockSize);
    
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    const getClosestPaletteColor = (r: number, g: number, b: number) => {
        let minDist = Infinity;
        let closest = { r, g, b };
        customPalette.forEach(hex => {
            const pr = parseInt(hex.slice(1, 3), 16);
            const pg = parseInt(hex.slice(3, 5), 16);
            const pb = parseInt(hex.slice(5, 7), 16);
            const dist = Math.sqrt((r-pr)**2 + (g-pg)**2 + (b-pb)**2);
            if (dist < minDist) {
                minDist = dist;
                closest = { r: pr, g: pg, b: pb };
            }
        });
        return closest;
    };

    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        const pixelIndex = (Math.min(y + Math.floor(size/2), h-1) * w + Math.min(x + Math.floor(size/2), w-1)) * 4;
        let r = data[pixelIndex];
        let g = data[pixelIndex + 1];
        let b = data[pixelIndex + 2];

        if (changeColorPalette && customPalette.length > 0) {
          const closest = getClosestPaletteColor(r, g, b);
          r = closest.r; g = closest.g; b = closest.b;
        }

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, size, size);
      }
    }

    if (drawGridLines) {
        ctx.strokeStyle = gridLineColor;
        ctx.lineWidth = 1;
        const rowStep = h / gridRows;
        const colStep = w / gridCols;
        
        ctx.beginPath();
        for (let i = 0; i <= gridCols; i++) {
            ctx.moveTo(i * colStep, 0);
            ctx.lineTo(i * colStep, h);
        }
        for (let j = 0; j <= gridRows; j++) {
            ctx.moveTo(0, j * rowStep);
            ctx.lineTo(w, j * rowStep);
        }
        ctx.stroke();
    }

    if (drawEdges) {
        const edgeData = ctx.getImageData(0, 0, w, h);
        const edgePixels = edgeData.data;
        
        for (let i = 0; i < edgePixels.length; i += 4) {
            const r = edgePixels[i];
            const g = edgePixels[i+1];
            const b = edgePixels[i+2];
            const luminance = (r + g + b) / 3;
            
            const rightLum = (edgePixels[i+4] + edgePixels[i+5] + edgePixels[i+6]) / 3 || luminance;
            const bottomLum = (edgePixels[i + w*4] + edgePixels[i + w*4 + 1] + edgePixels[i + w*4 + 2]) / 3 || luminance;
            
            if (Math.abs(luminance - rightLum) > edgeThreshold || Math.abs(luminance - bottomLum) > edgeThreshold) {
                ctx.fillStyle = '#000000';
                const px = (i / 4) % w;
                const py = Math.floor((i / 4) / w);
                ctx.fillRect(px, py, edgeLineWidth, edgeLineWidth);
            }
        }
    }

    setProcessedPreview(canvas.toDataURL('image/jpeg', 0.95));
    setIsProcessing(false);
  }, [selectedImage, blockSize, changeColorPalette, customPalette, applyGrayscale, drawGridLines, gridRows, gridCols, gridLineColor, drawEdges, edgeLineWidth, edgeThreshold]);

  useEffect(() => {
    if (activeStep === 'edit' && selectedImage) {
      const timer = setTimeout(() => applyPixelate(), 400);
      return () => clearTimeout(timer);
    }
  }, [blockSize, changeColorPalette, customPalette, applyGrayscale, drawGridLines, gridRows, gridCols, gridLineColor, drawEdges, edgeLineWidth, edgeThreshold, selectedImage, activeStep, applyPixelate]);

  const download = () => {
    if (!processedPreview) return;
    const link = document.createElement('a');
    link.href = processedPreview;
    link.download = `py7-pixelate-${Date.now()}.jpg`;
    link.click();
  };

  const reset = () => {
    setSelectedImage(null);
    setProcessedPreview(null);
    setActiveStep('upload');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Pixelate Image Online</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Welcome to Py7 Image Tool - The Most Advanced Way to Pixelate a Image Online.</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Workspace Preview */}
        <div className="flex-1 bg-white p-6 flex items-center justify-center border-b md:border-b-0 md:border-r py7-border-default relative">
          {activeStep === 'upload' ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-lg border-2 border-dashed border-[#c5cae9] rounded-[8px] p-16 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center shadow-inner"
            >
              <i className="fas fa-table-cells text-6xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-1">Select Image to Pixelate</h3>
              <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl">Choose Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          ) : (
            <div className="relative shadow-2xl bg-white border-4 border-white select-none rounded-sm overflow-hidden max-h-[600px]">
              {isProcessing && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <i className="fas fa-spinner fa-spin text-4xl text-[#3f51b5]"></i>
                  <span className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">Generating Pixels...</span>
                </div>
              )}
              <img 
                src={processedPreview || selectedImage!} 
                className="max-h-[580px] w-auto block transition-opacity duration-300" 
                alt="Pixelate Preview" 
              />
            </div>
          )}
        </div>

        {/* Right Controls Panel */}
        <div className="w-full md:w-[420px] bg-[#f0f0f0] p-6 flex flex-col justify-between shadow-inner overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* Block Size */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold text-slate-700">Block size</span>
                <span className="bg-[#3f51b5] text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">{blockSize}</span>
              </div>
              <input 
                type="range" min="1" max="100" value={blockSize} 
                onChange={(e) => setBlockSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#3f51b5]"
              />
            </div>

            {/* Change Color Palette Section */}
            <div className="space-y-4 pt-4 border-t border-slate-300">
               <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" checked={changeColorPalette} 
                      onChange={(e) => setChangeColorPalette(e.target.checked)}
                      className="peer h-5 w-5 border-2 border-slate-300 rounded-[2px] appearance-none checked:bg-[#3f51b5] checked:border-[#3f51b5] transition-all cursor-pointer bg-white"
                    />
                    <i className="fas fa-check absolute text-white text-[10px] left-1 opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                  </div>
                  <span className={`text-[12px] font-bold ${changeColorPalette ? 'text-slate-800' : 'text-slate-500'}`}>Change Color Palette</span>
               </label>
               
               {changeColorPalette && (
                <div className="pl-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Select Preset Palette</p>
                      <select 
                        value={selectedPreset} 
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full px-3 py-2 border py7-border-default rounded-sm text-xs font-bold bg-white outline-none focus:border-[#3f51b5] shadow-sm"
                      >
                        {Object.keys(PRESET_PALETTES).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-sm border py7-border-default shadow-inner max-h-32 overflow-y-auto">
                        {customPalette.map((hex, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => removeColorFromPalette(hex)}
                              className="w-5 h-5 rounded-[2px] border border-slate-200 cursor-pointer hover:scale-110 transition-transform relative group" 
                              style={{ backgroundColor: hex }}
                              title="Click to remove"
                            >
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white">×</div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-bold text-slate-700">Add Custom Color</p>
                        <div className="flex items-center gap-3">
                            <input type="color" value={newPaletteColor} onChange={(e) => setNewPaletteColor(e.target.value)} className="w-8 h-8 rounded-sm cursor-pointer border py7-border-default bg-white" />
                            <button onClick={addColorToPalette} className="px-4 h-8 flex items-center justify-center border-2 border-indigo-200 text-[#3f51b5] rounded-sm font-black text-[10px] uppercase hover:bg-[#3f51b5] hover:text-white transition-all">Add Color</button>
                        </div>
                    </div>
                </div>
               )}
            </div>

            {/* Apply Grayscale */}
            <label className="flex items-center gap-3 cursor-pointer group select-none">
                <div className="relative flex items-center">
                <input 
                    type="checkbox" checked={applyGrayscale} 
                    onChange={(e) => setApplyGrayscale(e.target.checked)}
                    className="peer h-5 w-5 border-2 border-slate-300 rounded-[2px] appearance-none checked:bg-[#3f51b5] checked:border-[#3f51b5] transition-all cursor-pointer bg-white"
                />
                <i className="fas fa-check absolute text-white text-[10px] left-1 opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                </div>
                <span className={`text-[12px] font-bold ${applyGrayscale ? 'text-slate-800' : 'text-slate-500'}`}>Apply Grayscale</span>
            </label>

            {/* Draw Grid Lines */}
            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                    <input 
                        type="checkbox" checked={drawGridLines} 
                        onChange={(e) => setDrawGridLines(e.target.checked)}
                        className="peer h-5 w-5 border-2 border-slate-300 rounded-[2px] appearance-none checked:bg-[#3f51b5] checked:border-[#3f51b5] transition-all cursor-pointer bg-white"
                    />
                    <i className="fas fa-check absolute text-white text-[10px] left-1 opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                    </div>
                    <span className={`text-[12px] font-bold ${drawGridLines ? 'text-slate-800' : 'text-slate-500'}`}>Draw Grid Lines</span>
                </label>
                {drawGridLines && (
                    <div className="pl-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Rows</p>
                                <input type="number" value={gridRows} onChange={(e) => setGridRows(parseInt(e.target.value)||1)} className="w-full px-2 py-1.5 border py7-border-default rounded-sm text-xs font-bold outline-none bg-white" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Columns</p>
                                <input type="number" value={gridCols} onChange={(e) => setGridCols(parseInt(e.target.value)||1)} className="w-full px-2 py-1.5 border py7-border-default rounded-sm text-xs font-bold outline-none bg-white" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Line Color</p>
                            <input type="color" value={gridLineColor} onChange={(e) => setGridLineColor(e.target.value)} className="w-8 h-8 rounded-sm cursor-pointer border py7-border-default bg-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Draw Edges */}
            <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                    <input 
                        type="checkbox" checked={drawEdges} 
                        onChange={(e) => setDrawEdges(e.target.checked)}
                        className="peer h-5 w-5 border-2 border-slate-300 rounded-[2px] appearance-none checked:bg-[#3f51b5] checked:border-[#3f51b5] transition-all cursor-pointer bg-white"
                    />
                    <i className="fas fa-check absolute text-white text-[10px] left-1 opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                    </div>
                    <span className={`text-[12px] font-bold ${drawEdges ? 'text-slate-800' : 'text-slate-500'}`}>Draw Edges</span>
                </label>
                {drawEdges && (
                    <div className="pl-8 space-y-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">Line Width</span>
                            <div className="flex items-center bg-white border py7-border-default rounded-sm overflow-hidden">
                                <button onClick={() => setEdgeLineWidth(Math.max(1, edgeLineWidth-1))} className="px-3 py-1 hover:bg-slate-50 text-slate-400">-</button>
                                <span className="w-12 text-center text-xs font-black">{edgeLineWidth}</span>
                                <button onClick={() => setEdgeLineWidth(edgeLineWidth+1)} className="px-3 py-1 hover:bg-slate-50 text-slate-400">+</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                <span>Threshold</span>
                                <span className="text-green-600 font-black">{edgeThreshold}</span>
                             </div>
                             <input 
                                type="range" min="1" max="150" value={edgeThreshold} 
                                onChange={(e) => setEdgeThreshold(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-green-500"
                             />
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-10 pt-6 border-t border-slate-300">
            <button 
              onClick={reset}
              className="w-full py-3 bg-white border-2 py7-border-default text-[#3f51b5] rounded-sm font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              New Image
            </button>
            <button 
              onClick={download}
              disabled={!processedPreview || isProcessing}
              className="w-full py-3 bg-[#3f51b5] text-white rounded-sm font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-[#1a237e] transition-all disabled:opacity-50"
            >
              Download Image
            </button>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center space-y-12">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
        <div className="flex justify-center gap-10 text-slate-200">
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

export default PixelateTool;
