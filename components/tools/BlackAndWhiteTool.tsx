
import React, { useState, useRef, useEffect } from 'react';

interface BlackAndWhiteToolProps {
  onBack: () => void;
}

const BlackAndWhiteTool: React.FC<BlackAndWhiteToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(115); // Default boost to prevent "darkness"
  const [contrast, setContrast] = useState(105);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyEffect = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    
    const img = new Image();
    img.src = selectedImage;
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply specific filters to prevent the "Too Dark" look
    ctx.filter = `grayscale(100%) brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(img, 0, 0);
    
    setTimeout(() => {
      setProcessedImage(canvas.toDataURL('image/jpeg', 0.95));
      setIsProcessing(false);
    }, 400);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = processedImage || selectedImage!;
    link.download = `py7-bw-${Date.now()}.jpg`;
    link.click();
  };

  const reset = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setBrightness(115);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Turn Color Image to Black and White</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Pi7 Image Tool: Transforming Color Picture to Classic Black & White.</p>
      </div>

      <div className="bg-white border py7-border-default rounded-[4px] shadow-lg overflow-hidden flex flex-col items-center">
        {!selectedImage ? (
          <div className="w-full p-24 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center shadow-inner">
              <i className="fas fa-camera-retro text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Convert</h3>
              <button className="px-12 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl">Choose Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Main Workspace matching user screenshot */}
            <div className="w-full bg-[#e0e0e0] p-4 md:p-10 flex flex-col items-center justify-center relative min-h-[450px]">
               {/* Red Close Button Top Right */}
               <button 
                  onClick={reset}
                  className="absolute top-4 right-4 w-8 h-8 bg-white text-red-500 rounded-md border border-red-100 shadow-lg flex items-center justify-center hover:bg-red-50 transition-all z-20"
               >
                  <i className="fas fa-times-circle text-lg"></i>
               </button>

               <div className="relative shadow-2xl overflow-hidden max-w-full">
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-10 flex items-center justify-center">
                       <i className="fas fa-spinner fa-spin text-3xl text-[#3f51b5]"></i>
                    </div>
                  )}
                  <img 
                    src={processedImage || selectedImage} 
                    className="max-h-[550px] w-auto block border-4 border-white" 
                    alt="B&W View" 
                    style={{ filter: !processedImage ? `grayscale(100%) brightness(${brightness}%)` : 'none' }}
                  />
               </div>

               {/* Brightness Adjustment (to fix the "dark" issue) */}
               <div className="mt-6 bg-white/80 backdrop-blur px-6 py-3 rounded-full shadow-sm flex items-center gap-4 border border-white/50">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Adjust Lightness:</span>
                  <input 
                    type="range" min="80" max="180" value={brightness} 
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-40 h-1 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-[#3f51b5]"
                  />
                  <span className="text-[10px] font-black text-[#3f51b5] w-8">{brightness}%</span>
               </div>
            </div>

            {/* Bottom Action Bar matching user screenshot */}
            <div className="w-full border-t py7-border-default bg-white p-4 flex flex-col items-center gap-4">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={applyEffect}
                    disabled={isProcessing}
                    className="px-10 py-2.5 bg-white border py7-border-default hover:bg-slate-50 text-slate-700 rounded-[4px] font-bold text-[11px] transition-all shadow-sm"
                  >
                    Turn Black & White
                  </button>
                  <button 
                    onClick={downloadImage}
                    className="w-10 h-10 border py7-border-default rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <i className="fas fa-file-arrow-down"></i>
                  </button>
               </div>

               {/* Large Plus Icon Button for New Image */}
               <div className="mt-2">
                  <button 
                    onClick={reset}
                    className="w-12 h-12 bg-indigo-50 text-[#3f51b5] rounded-full border py7-border-default flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
               </div>
            </div>
          </div>
        )}
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

export default BlackAndWhiteTool;
