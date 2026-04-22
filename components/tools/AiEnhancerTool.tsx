
import React, { useState, useRef } from 'react';
import { processImageWithAI } from '../../services/geminiService';

interface AiEnhancerToolProps {
  onBack: () => void;
}

const AiEnhancerTool: React.FC<AiEnhancerToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setEnhancedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    try {
      const prompt = "Please enhance this image: upscale the resolution, improve sharpness, reduce noise, and refine color balance for a professional high-definition result.";
      const result = await processImageWithAI(selectedImage, prompt);
      setEnhancedImage(result);
    } catch (error) {
      alert("AI Service temporary unavailable.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!enhancedImage) return;
    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = `py7-ai-enhanced-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">AI Photo Enhancer</h1>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[4px]">Powered by Muhammad Sufyan</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm p-8 min-h-[500px] flex items-center justify-center">
        {!selectedImage && !isProcessing && (
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-indigo-100 rounded-[6px] p-12 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group bg-white w-full">
            <i className="fas fa-wand-magic-sparkles text-5xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
            <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image</h3>
            <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#1a237e]">Upload Photo</button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
        )}

        {isProcessing && (
          <div className="py-20 flex flex-col items-center gap-5 animate-in fade-in duration-300">
             <i className="fas fa-circle-notch fa-spin text-4xl text-[#3f51b5]"></i>
             <p className="text-[11px] font-black uppercase tracking-[3px] text-[#3f51b5]">Enhancing...</p>
          </div>
        )}

        {selectedImage && !isProcessing && !enhancedImage && (
          <div className="w-full flex flex-col items-center gap-8 animate-in fade-in duration-500">
             <div className="relative border-4 border-white shadow-2xl rounded-sm overflow-hidden bg-slate-50 max-h-[400px]">
                <img src={selectedImage} className="max-h-full object-contain" alt="Original" />
             </div>
             <button onClick={handleEnhance} className="px-12 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[3px] shadow-2xl hover:bg-[#1a237e]">Enhance Image</button>
          </div>
        )}

        {enhancedImage && !isProcessing && (
          <div className="w-full flex flex-col items-center gap-6 animate-in slide-in-from-bottom-6 duration-500">
             <i className="fas fa-check-circle text-6xl text-green-500 mb-2"></i>
             <div className="text-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Enhancement Complete</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Ready for high-res download.</p>
             </div>

             <div className="relative border-4 border-white shadow-2xl rounded-sm overflow-hidden bg-slate-50 group select-none max-h-[400px]">
                <img src={showOriginal ? selectedImage! : enhancedImage} className="max-h-full object-contain transition-all" alt="Enhanced" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-[8px] font-black uppercase rounded-sm">{showOriginal ? 'Before' : 'After'}</div>
                <div className="absolute bottom-4 right-4 z-20">
                   <button onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} className="w-12 h-12 bg-white text-[#3f51b5] rounded-full flex items-center justify-center shadow-2xl border-2 border-[#3f51b5] hover:scale-110"><i className="fas fa-eye text-xl"></i></button>
                </div>
             </div>

             <div className="flex flex-col gap-4 w-full max-w-[260px] mt-6">
                <button onClick={downloadImage} className="w-full px-8 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[3px] shadow-xl hover:bg-[#1a237e] flex items-center justify-center gap-3">
                  <i className="fas fa-download"></i> Download Result
                </button>
                <button onClick={() => { setSelectedImage(null); setEnhancedImage(null); }} className="text-[#3f51b5] font-black uppercase text-[9px] border-b border-indigo-100 mt-2 tracking-[2px] hover:text-[#1a237e] text-center">Replace Photo</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiEnhancerTool;
