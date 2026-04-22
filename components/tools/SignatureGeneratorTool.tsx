
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SignatureGeneratorToolProps {
  onBack: () => void;
}

const SignatureGeneratorTool: React.FC<SignatureGeneratorToolProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'draw'>('text');
  const [signatureText, setSignatureText] = useState('John Doe');
  const [fontSize, setFontSize] = useState(28);
  const [paperType, setPaperType] = useState<'plain' | 'lined' | 'grid' | 'notebook' | 'none'>('lined');
  const [inkColor, setInkColor] = useState('#2b43b4');
  const [paperColor, setPaperColor] = useState('#f8f9fc');
  const [lineColor, setLineColor] = useState('#d1d5db');
  const [visibleCount, setVisibleCount] = useState(12);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Expanded fonts for signature previews
  const signatureFonts = [
    "'Great Vibes', cursive", "'Dancing Script', cursive", "'Pacifico', cursive",
    "'Alex Brush', cursive", "'Allura', cursive", "'Caveat', cursive",
    "'Sacramento', cursive", "'Satisfy', cursive", "'Pinyon Script', cursive",
    "'Parisienne', cursive", "'Yellowtail', cursive", "'Cookie', cursive",
    "'Homemade Apple', cursive", "'Marck Script', cursive", "'Mrs Saint Delafield', cursive",
    "'Petit Formal Script', cursive", "'Rochester', cursive", "'Tangerine', cursive"
  ];

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Caveat&family=Cookie&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Parisienne&family=Pinyon+Script&family=Sacramento&family=Satisfy&family=Yellowtail&family=Homemade+Apple&family=Marck+Script&family=Mrs+Saint+Delafield&family=Petit+Formal+Script&family=Rochester&family=Tangerine&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const getBackgroundStyle = () => {
    if (paperType === 'none') return {};
    if (paperType === 'plain') return { backgroundColor: paperColor };

    const styles: React.CSSProperties = { backgroundColor: paperColor };
    
    if (paperType === 'lined') {
      styles.backgroundImage = `linear-gradient(transparent 95%, ${lineColor} 95%)`;
      styles.backgroundSize = '100% 25px';
    } else if (paperType === 'grid') {
      styles.backgroundImage = `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`;
      styles.backgroundSize = '25px 25px';
    } else if (paperType === 'notebook') {
      styles.backgroundImage = `linear-gradient(transparent 95%, ${lineColor} 95%), linear-gradient(90deg, transparent 79px, #ef4444 79px, #ef4444 81px, transparent 81px)`;
      styles.backgroundSize = '100% 25px, 100% 100%';
    }
    
    return styles;
  };

  const downloadTextSignature = (font: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Background
    if (paperType !== 'none') {
        ctx.fillStyle = paperColor;
        ctx.fillRect(0, 0, 1000, 400);
        
        if (paperType !== 'plain') {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            if (paperType === 'lined' || paperType === 'notebook') {
                for(let i=0; i<400; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1000, i); ctx.stroke(); }
                if (paperType === 'notebook') {
                    ctx.strokeStyle = '#ef4444';
                    ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(80, 400); ctx.stroke();
                }
            } else if (paperType === 'grid') {
                for(let i=0; i<1000; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke(); }
                for(let i=0; i<400; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1000, i); ctx.stroke(); }
            }
        }
    }

    ctx.fillStyle = inkColor;
    ctx.font = `${fontSize * 3}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signatureText, 500, 200);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `py7-signature-${Date.now()}.png`;
    a.click();
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `py7-drawn-signature.png`;
    a.click();
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto px-4 pb-20">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="bg-white border py7-border-default rounded-[4px] shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex bg-[#f8f9fb] border-b py7-border-default">
          <button 
            onClick={() => setActiveTab('text')} 
            className={`flex-1 py-3 px-6 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'text' ? 'bg-[#3f51b5] text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fas fa-font"></i> Text to Signature
          </button>
          <button 
            onClick={() => setActiveTab('draw')} 
            className={`flex-1 py-3 px-6 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'draw' ? 'bg-[#3f51b5] text-white shadow-inner' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fas fa-signature"></i> Draw Signature
          </button>
        </div>

        {/* Unified Tool Bar */}
        <div className="p-4 border-b py7-border-default flex flex-wrap items-center gap-6 bg-white">
           {activeTab === 'text' && (
             <div className="flex items-center gap-2">
                <div className="flex items-center border py7-border-default rounded-sm px-2 bg-white">
                   <i className="fas fa-italic text-slate-400 text-xs mr-2"></i>
                   <input 
                    type="text" 
                    value={signatureText} 
                    onChange={(e) => setSignatureText(e.target.value)} 
                    placeholder="Type name..." 
                    className="py-2 px-1 text-sm font-bold outline-none w-48"
                   />
                </div>
                <div className="flex items-center border py7-border-default rounded-sm px-2 bg-white">
                   <i className="fas fa-text-height text-slate-400 text-xs mr-2"></i>
                   <input 
                    type="number" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 10)} 
                    className="py-2 w-12 text-sm font-bold outline-none text-center"
                   />
                   <span className="text-[10px] font-black text-slate-300 ml-1">PX</span>
                </div>
             </div>
           )}

           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Paper</span>
              <div className="flex gap-1.5">
                 {[
                   { id: 'plain', icon: 'fa-square' },
                   { id: 'lined', icon: 'fa-list' },
                   { id: 'grid', icon: 'fa-table-cells' },
                   { id: 'notebook', icon: 'fa-book-open' }
                 ].map(p => (
                   <button 
                    key={p.id} 
                    onClick={() => setPaperType(p.id as any)}
                    className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-all ${paperType === p.id ? 'border-[#3f51b5] bg-indigo-50 text-[#3f51b5] shadow-sm' : 'border-slate-200 text-slate-300 hover:border-indigo-200'}`}
                   >
                     <i className={`fas ${p.icon} text-xs`}></i>
                   </button>
                 ))}
                 <button 
                  onClick={() => setPaperType('none')}
                  className={`w-8 h-8 rounded-sm border flex items-center justify-center transition-all ${paperType === 'none' ? 'border-red-500 bg-red-50 text-red-500' : 'border-slate-200 text-slate-300'}`}
                 >
                    <i className="fas fa-ban text-xs"></i>
                 </button>
              </div>
           </div>

           <div className="flex items-center gap-4 border-l pl-6 py7-border-default">
              <div className="flex flex-col items-center gap-1">
                 <input type="color" value={inkColor} onChange={(e) => setInkColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer border border-white shadow-sm" />
                 <span className="text-[7px] font-black uppercase text-slate-400">Ink</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                 <input type="color" value={paperColor} onChange={(e) => setPaperColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer border border-white shadow-sm" />
                 <span className="text-[7px] font-black uppercase text-slate-400">Paper</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                 <input type="color" value={lineColor} onChange={(e) => setLineColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer border border-white shadow-sm" />
                 <span className="text-[7px] font-black uppercase text-slate-400">Line</span>
              </div>
           </div>
        </div>

        {/* Content Area */}
        <div className="p-8 md:p-10 min-h-[500px] bg-[#fdfdfd]">
          {activeTab === 'text' ? (
            <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {signatureFonts.slice(0, visibleCount).map((font, idx) => (
                   <div key={idx} className="bg-white border py7-border-default rounded-[4px] shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                      <div className="p-1.5 border-b py7-border-default flex justify-between bg-slate-50/30">
                         <div className="flex items-center gap-2">
                           <button className="w-6 h-6 bg-white border py7-border-default flex items-center justify-center rounded-sm text-slate-400 hover:text-[#3f51b5]"><i className="fas fa-rotate text-[10px]"></i></button>
                           <span className="text-[10px] font-black text-slate-300">0</span>
                         </div>
                         <div className="flex gap-1">
                            {[0,1,2,3].map(n => <span key={n} className={`w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-sm border py7-border-default ${n===idx%4 ? 'bg-indigo-50 text-[#3f51b5]' : 'bg-white text-slate-300'}`}>{n}</span>)}
                         </div>
                      </div>
                      <div className="h-40 flex items-center justify-center p-6" style={getBackgroundStyle()}>
                         <span style={{ fontFamily: font, fontSize: `${fontSize}px`, color: inkColor }} className="whitespace-nowrap truncate">{signatureText}</span>
                      </div>
                      <div className="p-3 border-t py7-border-default flex justify-between items-center bg-white">
                         <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: inkColor }}></div>
                         <button 
                          onClick={() => downloadTextSignature(font)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-[#3f51b5] hover:text-white text-slate-500 rounded-sm text-[9px] font-black uppercase transition-all"
                         >
                           <i className="fas fa-download"></i> Download
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
              
              {visibleCount < signatureFonts.length && (
                <div className="flex justify-center pt-6">
                   <button onClick={() => setVisibleCount(prev => prev + 6)} className="px-10 py-3 bg-slate-800 text-white font-black text-[11px] uppercase tracking-[3px] rounded-sm shadow-lg hover:bg-black transition-all">Load More Styles</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 animate-in fade-in">
               <div className="relative border-2 border-[#3f51b5]/20 rounded-[4px] overflow-hidden shadow-2xl w-full max-w-4xl h-[500px]" style={getBackgroundStyle()}>
                  <canvas 
                    ref={canvasRef} 
                    width={1600} 
                    height={800} 
                    className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <div className="absolute bottom-4 right-4 z-20 pointer-events-none opacity-40">
                     <p className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Py7 Pro Pad</p>
                  </div>
               </div>

               <div className="flex gap-4">
                  <button onClick={clearCanvas} className="px-10 py-3 border-2 border-red-100 text-red-500 font-black text-[11px] uppercase tracking-widest hover:bg-red-50 rounded-sm">
                    <i className="fas fa-rotate-right mr-2"></i> Reset
                  </button>
                  <button onClick={downloadDrawing} className="px-14 py-3 bg-[#00796b] text-white rounded-sm font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#004d40]">
                    <i className="fas fa-file-arrow-down mr-2"></i> Save Drawing
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-16 text-center">
         <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
      </div>
    </div>
  );
};

export default SignatureGeneratorTool;
