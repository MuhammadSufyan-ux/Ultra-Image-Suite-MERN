
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface BlurBgToolProps {
  onBack: () => void;
}

const BlurBgTool: React.FC<BlurBgToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit'>('upload');
  
  // Controls from screenshot
  const [blurType, setBlurType] = useState<'gaussian' | 'motion'>('gaussian');
  const [blurFactor, setBlurFactor] = useState(58);
  const [blurBackgroundOnly, setBlurBackgroundOnly] = useState(true);
  
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKey = 'igpZnxr44cdZCpW4LqzVyf3t'; // remove.bg API Key

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setActiveStep('edit');
        setSubjectImage(null);
        setProcessedPreview(null);
        setIsFirstLoad(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractSubject = async (fileData: string) => {
    if (subjectImage) return subjectImage;
    try {
      const blobResponse = await fetch(fileData);
      const blob = await blobResponse.blob();
      const formData = new FormData();
      formData.append('image_file', blob);
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey },
        body: formData
      });
      if (!response.ok) throw new Error('Subject extraction failed');
      const resultBlob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setSubjectImage(result);
          resolve(result);
        };
        reader.readAsDataURL(resultBlob);
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const applyBlurEffect = useCallback(async () => {
    if (!selectedImage) return;
    setIsProcessing(true);

    // If "Blur Background" is checked, we need the foreground subject
    if (blurBackgroundOnly && !subjectImage) {
        await extractSubject(selectedImage);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = selectedImage;
    });

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw blurred version (background)
    if (blurType === 'gaussian') {
        ctx.filter = `blur(${blurFactor / 4}px)`;
    } else {
        ctx.filter = `blur(${blurFactor / 6}px) contrast(1.1)`;
    }
    ctx.drawImage(img, 0, 0);
    
    // If background only, overlay the original sharp subject
    if (blurBackgroundOnly && subjectImage) {
        const subImg = new Image();
        await new Promise((resolve) => {
            subImg.onload = resolve;
            subImg.src = subjectImage;
        });
        ctx.filter = 'none';
        ctx.drawImage(subImg, 0, 0, canvas.width, canvas.height);
    }

    setProcessedPreview(canvas.toDataURL('image/jpeg', 0.9));
    setIsProcessing(false);
    setIsFirstLoad(false);
  }, [selectedImage, blurType, blurFactor, blurBackgroundOnly, subjectImage]);

  useEffect(() => {
    if (activeStep === 'edit' && selectedImage) {
        const timer = setTimeout(() => applyBlurEffect(), 400);
        return () => clearTimeout(timer);
    }
  }, [blurType, blurFactor, blurBackgroundOnly, selectedImage, activeStep]);

  const download = () => {
    if (!processedPreview) return;
    const link = document.createElement('a');
    link.href = processedPreview;
    link.download = `py7-blurred-${Date.now()}.jpg`;
    link.click();
  };

  const reset = () => {
    setSelectedImage(null);
    setProcessedPreview(null);
    setSubjectImage(null);
    setActiveStep('upload');
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Blur Image Online</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Welcome to Py7 Image Tool - Your Reliable Solution to Blur Photos Instantly & Securely!</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden min-h-[520px] flex flex-col md:flex-row">
        
        {/* Workspace Preview */}
        <div className="flex-1 bg-white p-6 flex items-center justify-center border-b md:border-b-0 md:border-r py7-border-default relative">
            {activeStep === 'upload' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-12 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center shadow-inner"
                >
                  <i className="fas fa-droplet text-5xl text-indigo-100 mb-4 group-hover:scale-110 transition-transform"></i>
                  <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-widest mb-1">Select Image To Blur</h3>
                  <p className="text-[9px] font-bold text-slate-300 uppercase mb-6">Small & Professional Pad</p>
                  <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl">Choose Photo</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
            ) : (
                <div className="relative shadow-2xl bg-white border-4 border-white select-none rounded-sm overflow-hidden max-h-[500px]">
                    {isProcessing && (
                        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                             <i className="fas fa-circle-notch fa-spin text-3xl text-[#3f51b5]"></i>
                             <span className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">Applying Blur...</span>
                        </div>
                    )}
                    <img 
                      src={processedPreview || selectedImage!} 
                      className="max-h-[480px] w-auto block transition-opacity duration-300" 
                      alt="Blur Preview" 
                    />
                </div>
            )}
        </div>

        {/* Right Controls Panel */}
        <div className="w-full md:w-[380px] bg-[#d3d3d3] p-8 flex flex-col justify-between shadow-inner">
            <div className="space-y-8">
                {/* Green Success Tick Logic */}
                {processedPreview && !isProcessing && !isFirstLoad && (
                    <div className="flex flex-col items-center gap-2 animate-in slide-in-from-top-4 duration-500">
                        <i className="fas fa-check-circle text-4xl text-green-500"></i>
                        <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Image Processed</h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ready to download</p>
                    </div>
                )}

                <div className="flex gap-6 justify-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="radio" 
                            name="blurType" 
                            checked={blurType === 'gaussian'} 
                            onChange={() => setBlurType('gaussian')}
                            className="w-4 h-4 accent-[#3f51b5]"
                        />
                        <span className={`text-[12px] font-bold ${blurType === 'gaussian' ? 'text-slate-800' : 'text-slate-500'}`}>Gaussian Blur</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="radio" 
                            name="blurType" 
                            checked={blurType === 'motion'} 
                            onChange={() => setBlurType('motion')}
                            className="w-4 h-4 accent-[#3f51b5]"
                        />
                        <span className={`text-[12px] font-bold ${blurType === 'motion' ? 'text-slate-800' : 'text-slate-500'}`}>Motion Blur</span>
                    </label>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase">
                        <span>Blur Factor ({blurFactor})</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={blurFactor} 
                        onChange={(e) => setBlurFactor(parseInt(e.target.value))}
                        className="w-full accent-[#3f51b5] cursor-pointer"
                    />
                </div>

                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setBlurBackgroundOnly(!blurBackgroundOnly)}>
                    <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all bg-white ${blurBackgroundOnly ? 'border-[#3f51b5]' : 'border-slate-300'}`}>
                        {blurBackgroundOnly && <i className="fas fa-check text-[#3f51b5] text-[10px]"></i>}
                    </div>
                    <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">Blur Background</span>
                </div>
            </div>

            <div className="space-y-3 pt-12">
                <button 
                  onClick={download}
                  disabled={!processedPreview || isProcessing}
                  className="w-full py-4 bg-[#3f51b5] text-white rounded-sm font-black text-[13px] uppercase tracking-[3px] shadow-2xl hover:bg-[#1a237e] transition-all disabled:opacity-50"
                >
                  Download
                </button>
                <button 
                  onClick={reset}
                  className="w-full py-3 bg-[#f8f9fb] border py7-border-default text-[#3f51b5] rounded-sm font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i> Blur New Image
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

export default BlurBgTool;
