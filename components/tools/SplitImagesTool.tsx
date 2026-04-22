
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SplitImagesToolProps {
  onBack: () => void;
}

const SplitImagesTool: React.FC<SplitImagesToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitResults, setSplitResults] = useState<string[]>([]);
  
  // Interactive Crop Box State (Percentages)
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [interaction, setInteraction] = useState<'none' | 'dragging' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  const lastMousePos = useRef({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setSplitResults([]);
        setCropBox({ x: 10, y: 10, width: 80, height: 80 }); // Reset box
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, type: any) => {
    e.preventDefault();
    e.stopPropagation();
    setInteraction(type);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (interaction === 'none' || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const dx = ((clientX - lastMousePos.current.x) / rect.width) * 100;
    const dy = ((clientY - lastMousePos.current.y) / rect.height) * 100;
    
    lastMousePos.current = { x: clientX, y: clientY };

    setCropBox(prev => {
      let { x, y, width, height } = { ...prev };

      if (interaction === 'dragging') {
        x = Math.max(0, Math.min(100 - width, x + dx));
        y = Math.max(0, Math.min(100 - height, y + dy));
      } else if (interaction === 'nw') {
        const newX = Math.max(0, Math.min(x + width - 5, x + dx));
        width = width + (x - newX);
        x = newX;
        const newY = Math.max(0, Math.min(y + height - 5, y + dy));
        height = height + (y - newY);
        y = newY;
      } else if (interaction === 'ne') {
        width = Math.max(5, Math.min(100 - x, width + dx));
        const newY = Math.max(0, Math.min(y + height - 5, y + dy));
        height = height + (y - newY);
        y = newY;
      } else if (interaction === 'sw') {
        const newX = Math.max(0, Math.min(x + width - 5, x + dx));
        width = width + (x - newX);
        x = newX;
        height = Math.max(5, Math.min(100 - y, height + dy));
      } else if (interaction === 'se') {
        width = Math.max(5, Math.min(100 - x, width + dx));
        height = Math.max(5, Math.min(100 - y, height + dy));
      }

      return { x, y, width, height };
    });
  }, [interaction]);

  const handleInteractionEnd = useCallback(() => {
    setInteraction('none');
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleInteractionMove);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchmove', handleInteractionMove, { passive: false });
    window.addEventListener('touchend', handleInteractionEnd);
    return () => {
      window.removeEventListener('mousemove', handleInteractionMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleInteractionMove);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [handleInteractionMove, handleInteractionEnd]);

  const handleSplit = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = selectedImage;
    await new Promise(resolve => { img.onload = resolve; });

    const results: string[] = [];
    
    // Calculate source crop area in pixels
    const sourceX = (cropBox.x / 100) * img.width;
    const sourceY = (cropBox.y / 100) * img.height;
    const sourceWidth = (cropBox.width / 100) * img.width;
    const sourceHeight = (cropBox.height / 100) * img.height;

    // Tile dimensions relative to the crop area
    const tileWidth = sourceWidth / cols;
    const tileHeight = sourceHeight / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const canvas = document.createElement('canvas');
        canvas.width = tileWidth;
        canvas.height = tileHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(
            img,
            sourceX + (c * tileWidth), sourceY + (r * tileHeight), tileWidth, tileHeight,
            0, 0, tileWidth, tileHeight
          );
          results.push(canvas.toDataURL('image/jpeg', 0.95));
        }
      }
    }

    setSplitResults(results);
    setIsProcessing(false);
    
    setTimeout(() => {
      const el = document.getElementById('results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const downloadAll = () => {
    splitResults.forEach((data, index) => {
      const link = document.createElement('a');
      link.href = data;
      link.download = `py7-split-part-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Online Image Splitter - Split Picture in 3, 4, 9 or More</h1>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select your split area by dragging the corners. Powered by Muhammad Sufyan.</p>
      </div>

      <div className="bg-white border-2 py7-border-default rounded-[4px] shadow-sm overflow-hidden flex flex-col items-center">
        {!selectedImage ? (
          <div className="w-full p-24 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-table-cells text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Split</h3>
              <button className="px-12 py-3.5 bg-[#00796b] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Select Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            {/* Header Control Panel */}
            <div className="bg-indigo-50/50 border-b-2 py7-border-default p-4 flex flex-col items-center gap-4">
              <p className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">Adjust Rows and Columns for Split</p>
              <div className="flex flex-wrap justify-center gap-10 items-center">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Rows:</span>
                  <div className="flex items-center bg-white border py7-border-default rounded-sm overflow-hidden">
                    <button onClick={() => setRows(Math.max(1, rows - 1))} className="px-3 py-1.5 hover:bg-slate-50 text-slate-400">-</button>
                    <input type="number" value={rows} onChange={(e) => setRows(parseInt(e.target.value) || 1)} className="w-12 text-center text-xs font-black outline-none" />
                    <button onClick={() => setRows(rows + 1)} className="px-3 py-1.5 hover:bg-slate-50 text-slate-400">+</button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Columns:</span>
                  <div className="flex items-center bg-white border py7-border-default rounded-sm overflow-hidden">
                    <button onClick={() => setCols(Math.max(1, cols - 1))} className="px-3 py-1.5 hover:bg-slate-50 text-slate-400">-</button>
                    <input type="number" value={cols} onChange={(e) => setCols(parseInt(e.target.value) || 1)} className="w-12 text-center text-xs font-black outline-none" />
                    <button onClick={() => setCols(cols + 1)} className="px-3 py-1.5 hover:bg-slate-50 text-slate-400">+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Visualizer with Interactive Crop Box */}
            <div className="flex-1 bg-[#222] p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[600px]">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}></div>
              
              <div className="relative shadow-2xl bg-white border-4 border-white select-none max-w-full z-10">
                <img ref={imageRef} src={selectedImage} className="max-h-[600px] w-auto block pointer-events-none" alt="Source" />
                
                {/* Backdrop Mask */}
                <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

                {/* Interactive Split Area (The "Crop Box") */}
                <div 
                  className={`absolute z-20 border-2 border-dashed border-[#3f51b5] bg-white/5 cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0)]`}
                  style={{ 
                    left: `${cropBox.x}%`, 
                    top: `${cropBox.y}%`, 
                    width: `${cropBox.width}%`, 
                    height: `${cropBox.height}%`,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    touchAction: 'none'
                  }}
                  onMouseDown={(e) => handleInteractionStart(e, 'dragging')}
                  onTouchStart={(e) => handleInteractionStart(e, 'dragging')}
                >
                  {/* Visual Content Inside Box */}
                  <div className="w-full h-full relative overflow-hidden pointer-events-none">
                     <img src={selectedImage} className="max-w-none block absolute" 
                          style={{ 
                            width: `${(100/cropBox.width)*100}%`, 
                            left: `-${(cropBox.x/cropBox.width)*100}%`,
                            top: `-${(cropBox.y/cropBox.height)*100}%`,
                            height: `${(100/cropBox.height)*100}%`
                          }} 
                      />
                      {/* Grid Lines inside the Box */}
                      <div className="absolute inset-0 grid" style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                        {Array.from({ length: rows * cols }).map((_, i) => (
                          <div key={i} className="border border-white/40 flex items-center justify-center">
                             <span className="text-[10px] font-black text-white/30 bg-black/10 px-1 rounded-sm">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                  </div>

                  {/* Corner Handles */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#3f51b5] border-2 border-white rounded-full cursor-nw-resize z-30" onMouseDown={(e) => handleInteractionStart(e, 'nw')}></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#3f51b5] border-2 border-white rounded-full cursor-ne-resize z-30" onMouseDown={(e) => handleInteractionStart(e, 'ne')}></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#3f51b5] border-2 border-white rounded-full cursor-sw-resize z-30" onMouseDown={(e) => handleInteractionStart(e, 'sw')}></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#3f51b5] border-2 border-white rounded-full cursor-se-resize z-30" onMouseDown={(e) => handleInteractionStart(e, 'se')}></div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-3 z-10">
                 <div className="flex gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-white text-[#3f51b5] rounded-sm font-black text-[10px] uppercase shadow-lg flex items-center gap-2">
                       <i className="fas fa-file-arrow-up"></i> New Image
                    </button>
                    <button onClick={handleSplit} disabled={isProcessing} className="px-12 py-2.5 bg-[#3f51b5] text-white rounded-sm font-black text-[10px] uppercase shadow-xl hover:bg-[#1a237e] transition-all flex items-center gap-2">
                       {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-scissors"></i>}
                       Split Area
                    </button>
                 </div>
                 <p className="text-[9px] font-black text-white/50 uppercase tracking-[2px]">Drag box to move, pull corners to resize</p>
              </div>
            </div>

            {/* Split Results Area */}
            {splitResults.length > 0 && (
              <div id="results-section" className="p-8 bg-[#f8f9fc] border-t-2 py7-border-default animate-in slide-in-from-bottom-6 duration-700">
                <div className="max-w-4xl mx-auto space-y-8">
                   <div className="flex justify-between items-center px-2">
                      <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Extracted Tiles ({splitResults.length})</p>
                      <button 
                        onClick={downloadAll}
                        className="bg-[#00796b] text-white px-8 py-2.5 rounded-sm text-[10px] font-black uppercase shadow-xl flex items-center gap-2 hover:bg-[#004d40] transition-colors"
                      >
                        <i className="fas fa-download"></i> Download All Parts
                      </button>
                   </div>
                   
                   <div className="grid gap-3 border-2 border-white shadow-xl bg-white p-3 rounded-sm" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                      {splitResults.map((src, i) => (
                        <div key={i} className="aspect-square bg-slate-50 border py7-border-default relative group overflow-hidden shadow-inner">
                           <img src={src} className="w-full h-full object-cover" alt={`Part ${i+1}`} />
                           <div className="absolute inset-0 bg-[#3f51b5]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => { const a = document.createElement('a'); a.href=src; a.download=`part-${i+1}.jpg`; a.click(); }} className="w-10 h-10 bg-white text-[#3f51b5] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><i className="fas fa-download text-sm"></i></button>
                           </div>
                           <span className="absolute bottom-1 right-1 bg-black/40 text-white text-[8px] px-1 rounded-sm font-black">{i+1}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-20 text-center space-y-12">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
        <div className="flex justify-center gap-8 text-slate-200">
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#3f51b5] group-hover:text-[#3f51b5] transition-all">
                <i className="fab fa-linkedin-in text-lg"></i>
              </div>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-[#3f51b5] group-hover:text-[#3f51b5] transition-all">
                <i className="fab fa-twitter text-lg"></i>
              </div>
           </div>
           <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-green-500 group-hover:text-green-500 transition-all">
                <i className="fab fa-whatsapp text-lg"></i>
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SplitImagesTool;
