import React, { useState, useRef } from 'react';
import { Tool } from '../types';
import { processImageWithAI } from '../services/geminiService';

interface ToolModalProps {
  tool: Tool | null;
  onClose: () => void;
}

const ToolModal: React.FC<ToolModalProps> = ({ tool, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!tool) return null;

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

  const handleAction = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);

    try {
      if (tool.badge === 'AI') {
        let prompt = "";
        if (tool.id === 'remove-bg') {
          prompt = "Please remove the background of this image and return the main subject clearly with a transparent or solid background.";
        } else if (tool.id === 'remove-obj') {
          prompt = "Please remove unwanted or distracting objects from this photo, filling the area seamlessly with the surrounding background.";
        } else {
          prompt = "Please enhance this image quality, improving sharpness, clarity, and color balance to make it look professional.";
        }
        
        const result = await processImageWithAI(selectedImage, prompt);
        setProcessedImage(result);
      } else {
        setTimeout(() => {
          setProcessedImage(selectedImage);
          setIsProcessing(false);
        }, 1500);
        return;
      }
    } catch (error) {
      console.error(error);
      alert("AI Service temporary unavailable. Please check your API key configuration.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `pi7-${tool.id}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white border-2 py7-blue-border rounded-[4px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-4 bg-[#3f51b5] text-white flex justify-between items-center border-b-2 py7-blue-border">
          <h2 className="text-xs font-black flex items-center gap-3 uppercase tracking-widest">
            {tool.badge && <span className="bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full border-2 border-white font-black uppercase">{tool.badge}</span>}
            {tool.name}
          </h2>
          <button onClick={onClose} className="hover:rotate-90 transition-transform duration-200">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {!selectedImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed py7-blue-border rounded-[4px] p-16 text-center hover:bg-indigo-50/50 cursor-pointer transition-all group"
            >
              <i className="fas fa-cloud-arrow-up text-5xl text-indigo-100 group-hover:text-[#3f51b5] mb-6 transition-colors"></i>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Upload Your Source Image</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">SUPPORTS JPG, PNG, WEBP & HEIC</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Original Asset</p>
                  <div className="border-2 py7-blue-border rounded-[2px] overflow-hidden bg-slate-50 aspect-square flex items-center justify-center shadow-inner">
                    <img src={selectedImage} alt="Original" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">AI Output</p>
                  <div className="border-2 py7-blue-border rounded-[2px] overflow-hidden bg-slate-100 aspect-square flex items-center justify-center relative shadow-inner">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-[#3f51b5] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] text-[#3f51b5] font-black uppercase tracking-widest animate-pulse">Processing...</span>
                      </div>
                    ) : processedImage ? (
                      <img src={processedImage} alt="Processed" className="max-h-full max-w-full object-contain animate-in zoom-in duration-300" />
                    ) : (
                      <div className="text-slate-300 text-[10px] uppercase font-black tracking-widest opacity-40">Awaiting Process</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-4">
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="px-6 py-2.5 border-2 py7-blue-border rounded-[4px] text-[11px] font-black uppercase hover:bg-slate-50 transition-colors tracking-widest"
                >
                  Clear Selection
                </button>
                {!processedImage ? (
                  <button 
                    onClick={handleAction}
                    disabled={isProcessing}
                    className="px-8 py-2.5 bg-[#3f51b5] text-white rounded-[4px] border-2 py7-blue-border text-[11px] font-black uppercase tracking-widest hover:bg-[#1a237e] shadow-xl disabled:opacity-50 transition-all active:scale-95"
                  >
                    Process with AI
                  </button>
                ) : (
                  <button 
                    onClick={downloadImage}
                    className="px-8 py-2.5 bg-green-600 text-white rounded-[4px] border-2 py7-blue-border text-[11px] font-black uppercase tracking-widest hover:bg-green-700 shadow-xl flex items-center gap-3 transition-all animate-in slide-in-from-bottom-2"
                  >
                    <i className="fas fa-file-arrow-down text-lg"></i>
                    Download High-Res
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolModal;