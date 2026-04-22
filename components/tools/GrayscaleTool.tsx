
import React, { useState, useRef } from 'react';

interface GrayscaleToolProps {
  onBack: () => void;
}

const GrayscaleTool: React.FC<GrayscaleToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
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

  const applyGrayscale = async () => {
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

    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(img, 0, 0);
    
    // Artificial small delay for UX feel
    setTimeout(() => {
      setProcessedImage(canvas.toDataURL('image/jpeg', 0.95));
      setIsProcessing(false);
    }, 400);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = processedImage || selectedImage!;
    link.download = `py7-grayscale-${Date.now()}.jpg`;
    link.click();
  };

  const reset = () => {
    setSelectedImage(null);
    setProcessedImage(null);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Convert Image to Grayscale</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Transform Colors, Embrace Elegance: Py7 Image Tool for Effortless Grayscale Conversion</p>
      </div>

      <div className="bg-white border py7-border-default rounded-[4px] shadow-lg overflow-hidden flex flex-col items-center">
        {!selectedImage ? (
          <div className="w-full p-24 flex items-center justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center shadow-inner">
              <i className="fas fa-palette text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Grayscale</h3>
              <button className="px-12 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl">Choose Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Image Preview Container */}
            <div className="w-full bg-[#e0e0e0] p-4 md:p-10 flex items-center justify-center relative min-h-[450px]">
               {/* Red Close Button */}
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
                    alt="Grayscale View" 
                  />
               </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="w-full border-t py7-border-default bg-white p-6 flex flex-col items-center gap-4">
               <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
                  <button 
                    onClick={applyGrayscale}
                    disabled={isProcessing}
                    className="flex-1 min-w-[180px] py-3.5 bg-[#3f51b5] hover:bg-[#1a237e] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-lg transition-all disabled:opacity-50"
                  >
                    Apply Grayscale
                  </button>
                  
                  {processedImage && (
                    <button 
                      onClick={downloadImage}
                      className="flex-1 min-w-[180px] py-3.5 bg-[#00796b] hover:bg-[#004d40] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 animate-in zoom-in-95 duration-300"
                    >
                      <i className="fas fa-download"></i>
                      Download Image
                    </button>
                  )}
               </div>

               {/* Bottom Plus Icon Button */}
               <div className="mt-4">
                  <button 
                    onClick={reset}
                    title="Select New Image"
                    className="w-12 h-12 bg-indigo-50 text-[#3f51b5] rounded-full border py7-border-default flex items-center justify-center hover:scale-110 transition-transform shadow-md hover:bg-white"
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

export default GrayscaleTool;
