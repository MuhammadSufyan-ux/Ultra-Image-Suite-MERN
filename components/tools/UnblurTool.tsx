
import React, { useState, useRef } from 'react';
import { processImageWithAI } from '../../services/geminiService';

interface UnblurToolProps {
  onBack: () => void;
}

const UnblurTool: React.FC<UnblurToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [unblurredImage, setUnblurredImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewOriginal, setPreviewOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setUnblurredImage(null);
        setPreviewOriginal(false);
        handleUnblur(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnblur = async (base64: string) => {
    setIsProcessing(true);
    try {
      const prompt = "Please unblur this image: perform motion deblurring, sharpen soft edges, restore lost details in out-of-focus areas, and produce a crisp, high-clarity version while maintaining natural textures.";
      const result = await processImageWithAI(base64, prompt);
      setUnblurredImage(result);
    } catch (error) {
      console.error(error);
      alert("AI Processing failed. Please check your connectivity.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!unblurredImage) return;
    const link = document.createElement('a');
    link.href = unblurredImage;
    link.download = `py7-unblurred-${Date.now()}.png`;
    link.click();
  };

  const reset = () => {
    setSelectedImage(null);
    setUnblurredImage(null);
    setPreviewOriginal(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Unblur Image Online Free</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Py7 Image Tool - Turn Blurry Photos Into Clear Memories.</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {!selectedImage ? (
          <div className="flex-1 flex items-center justify-center p-8 md:p-12">
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-12 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center shadow-inner">
              <i className="fas fa-wand-magic text-5xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-widest mb-1">Select Image to Unblur</h3>
              <p className="text-[9px] font-bold text-slate-300 uppercase mb-6">Drag & Drop or click to upload</p>
              <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-[#1a237e]">Select Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-1">
            {/* Left Image Viewport */}
            <div className="flex-1 bg-slate-100 p-6 md:p-10 flex items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r py7-border-default">
              <div className="relative shadow-2xl bg-white border-4 border-white select-none rounded-sm overflow-hidden max-h-[500px]">
                 {isProcessing && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
                       <i className="fas fa-spinner fa-spin text-4xl text-[#3f51b5]"></i>
                       <span className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">Sharpening Details...</span>
                    </div>
                 )}
                 <img 
                   src={previewOriginal ? selectedImage : (unblurredImage || selectedImage)} 
                   className="max-h-[480px] w-auto block transition-opacity duration-300" 
                   alt="Unblur Result" 
                 />
                 <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-[9px] font-black uppercase rounded-sm z-20">
                    {previewOriginal ? 'Blurry Original' : (unblurredImage ? 'Unblurred HD' : 'Processing...')}
                 </div>
              </div>
            </div>

            {/* Right Control Side Panel */}
            <div className="w-full lg:w-96 bg-[#f8f9fb] p-8 flex flex-col justify-between shadow-inner">
               <div className="space-y-8 text-center lg:text-left">
                  {unblurredImage && !isProcessing && (
                    <div className="flex flex-col items-center lg:items-start animate-in slide-in-from-top-4 duration-500">
                        <i className="fas fa-check-circle text-4xl text-green-500 mb-3"></i>
                        <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Image Restored</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready for download</p>
                    </div>
                  )}

                  <div className="space-y-4 pt-6">
                     <button 
                        onClick={downloadImage}
                        disabled={!unblurredImage || isProcessing}
                        className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[13px] uppercase tracking-[3px] shadow-2xl hover:bg-[#1a237e] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                     >
                       <i className="fas fa-download"></i> Download Image
                     </button>

                     <button 
                        onClick={reset}
                        className="w-full py-3 bg-white border-2 py7-border-default text-[#3f51b5] rounded-[4px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                     >
                       <i className="fas fa-plus-circle"></i> Another Image
                     </button>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start gap-3 cursor-pointer group select-none mt-6" onClick={() => setPreviewOriginal(!previewOriginal)}>
                     <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all ${previewOriginal ? 'bg-[#3f51b5] border-[#3f51b5]' : 'border-slate-300 group-hover:border-[#3f51b5]'}`}>
                        {previewOriginal && <i className="fas fa-check text-white text-[10px]"></i>}
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-widest ${previewOriginal ? 'text-[#3f51b5]' : 'text-slate-500 group-hover:text-slate-800'}`}>Preview Original Image</span>
                  </div>
               </div>

               <div className="mt-20 border-t py7-border-default pt-6 text-center">
                  <div className="flex items-center justify-center gap-3 group cursor-pointer" onClick={reset}>
                     <span className="text-[10px] font-black uppercase text-red-500 hover:underline">Delete Image From Server</span>
                     <i className="fas fa-circle-info text-slate-300 text-xs"></i>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-16 text-center space-y-12">
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

export default UnblurTool;
