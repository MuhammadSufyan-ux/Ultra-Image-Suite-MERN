
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface MotionBlurToolProps {
  onBack: () => void;
}

const MotionBlurTool: React.FC<MotionBlurToolProps> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit'>('upload');
  
  // Advanced Controls
  const [blurFactor, setBlurFactor] = useState(35);
  const [blurAngle, setBlurAngle] = useState(45); 
  const [samples, setSamples] = useState(25); // Smoothness
  const [exposure, setExposure] = useState(100); // Brightness correction
  const [blurBackgroundOnly, setBlurBackgroundOnly] = useState(false);
  
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
      console.error("AI Subject Extraction Failed:", err);
      return null;
    }
  };

  const applyMotionBlur = useCallback(async () => {
    if (!selectedImage) return;
    setIsProcessing(true);

    if (blurBackgroundOnly && !subjectImage) {
        await extractSubject(selectedImage);
    }

    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = selectedImage;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    const angleRad = (blurAngle * Math.PI) / 180;
    
    // To prevent darkness, we use a scratch canvas and correct alpha/brightness
    const scratch = document.createElement('canvas');
    scratch.width = canvas.width;
    scratch.height = canvas.height;
    const sCtx = scratch.getContext('2d');
    if(!sCtx) return;

    // Draw blurred version by stacking with linear weight
    // Higher sample count = smoother motion but more heavy processing
    const sampleCount = Math.max(10, samples);
    
    // First pass: Draw a baseline to prevent alpha-void (darkness)
    sCtx.filter = `brightness(${exposure}%)`;
    sCtx.globalAlpha = 1.0;
    sCtx.drawImage(img, 0, 0);

    // Cumulative pass: stack offsets
    sCtx.globalAlpha = 1.0 / sampleCount;
    for (let i = 1; i <= sampleCount; i++) {
        const offset = (i / sampleCount) * blurFactor;
        const dx = Math.cos(angleRad) * offset;
        const dy = Math.sin(angleRad) * offset;
        
        // Draw the image slightly offset in both directions for centered motion
        sCtx.drawImage(img, dx, dy);
        sCtx.drawImage(img, -dx, -dy);
    }

    // Combine result
    ctx.drawImage(scratch, 0, 0);

    // Overlay sharp subject if requested
    if (blurBackgroundOnly && subjectImage) {
        const subImg = new Image();
        await new Promise((resolve) => {
            subImg.onload = resolve;
            subImg.src = subjectImage;
        });
        ctx.drawImage(subImg, 0, 0);
    }

    setProcessedPreview(canvas.toDataURL('image/jpeg', 0.95));
    setIsProcessing(false);
  }, [selectedImage, blurFactor, blurAngle, samples, exposure, blurBackgroundOnly, subjectImage]);

  useEffect(() => {
    if (activeStep === 'edit' && selectedImage) {
        const timer = setTimeout(() => applyMotionBlur(), 500);
        return () => clearTimeout(timer);
    }
  }, [blurFactor, blurAngle, samples, exposure, blurBackgroundOnly, selectedImage, activeStep, applyMotionBlur]);

  const download = () => {
    if (!processedPreview) return;
    const link = document.createElement('a');
    link.href = processedPreview;
    link.download = `py7-motion-pro-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Professional Motion Blur</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Welcome to Py7 Image Tool - Advanced Motion Streaks without Darkness.</p>
      </div>

      <div className="bg-white border-2 border-[#3f51b5] rounded-[4px] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Workspace Preview */}
        <div className="flex-1 bg-white p-6 flex items-center justify-center border-b md:border-b-0 md:border-r py7-border-default relative min-h-[400px]">
            {activeStep === 'upload' ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-lg border-2 border-dashed border-[#c5cae9] rounded-[8px] p-16 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center shadow-inner"
                >
                  <i className="fas fa-wind text-6xl text-indigo-100 mb-6 group-hover:scale-110 transition-transform"></i>
                  <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-1">Select Image to Blur</h3>
                  <button className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-xl">Choose Photo</button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
            ) : (
                <div className="relative shadow-2xl bg-white border-4 border-white select-none rounded-sm overflow-hidden max-h-[550px]">
                    {isProcessing && (
                        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                             <i className="fas fa-circle-notch fa-spin text-4xl text-[#3f51b5]"></i>
                             <span className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">Rendering Motion...</span>
                        </div>
                    )}
                    <img 
                      src={processedPreview || selectedImage!} 
                      className="max-h-[520px] w-auto block transition-opacity duration-300" 
                      alt="Motion Preview" 
                    />
                </div>
            )}
        </div>

        {/* Right Controls Panel */}
        <div className="w-full md:w-[400px] bg-[#f8f9fc] p-8 flex flex-col justify-between shadow-inner overflow-y-auto">
            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-600 uppercase">
                        <span>Motion Distance</span>
                        <span className="bg-[#3f51b5] text-white px-2 py-0.5 rounded-full shadow-sm">{blurFactor}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="150" value={blurFactor} 
                        onChange={(e) => setBlurFactor(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#3f51b5]"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-600 uppercase">
                        <span>Motion Angle</span>
                        <span className="bg-[#3f51b5] text-white px-2 py-0.5 rounded-full shadow-sm">{blurAngle}°</span>
                    </div>
                    <input 
                        type="range" min="0" max="360" value={blurAngle} 
                        onChange={(e) => setBlurAngle(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#3f51b5]"
                    />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-600 uppercase">
                        <span>Exposure Correction</span>
                        <span className="text-orange-500 font-black">{exposure}%</span>
                    </div>
                    <input 
                        type="range" min="50" max="150" value={exposure} 
                        onChange={(e) => setExposure(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-orange-400"
                    />
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">Fixes the "darkness" of the motion blur</p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-[11px] font-black text-slate-600 uppercase">
                        <span>Motion Smoothness</span>
                    </div>
                    <input 
                        type="range" min="10" max="50" value={samples} 
                        onChange={(e) => setSamples(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#00796b]"
                    />
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer group select-none" onClick={() => setBlurBackgroundOnly(!blurBackgroundOnly)}>
                        <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all bg-white ${blurBackgroundOnly ? 'border-[#3f51b5] bg-[#3f51b5]' : 'border-slate-300'}`}>
                            {blurBackgroundOnly && <i className="fas fa-check text-white text-[10px]"></i>}
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 uppercase">Keep Subject Sharp (AI)</span>
                    </label>
                </div>
            </div>

            <div className="space-y-3 pt-12">
                <button 
                  onClick={download}
                  disabled={!processedPreview || isProcessing}
                  className="w-full py-4 bg-[#3f51b5] text-white rounded-sm font-black text-[12px] uppercase tracking-[3px] shadow-2xl hover:bg-[#1a237e] transition-all disabled:opacity-50"
                >
                  Download HD
                </button>
                <button 
                  onClick={() => { setSelectedImage(null); setProcessedPreview(null); setSubjectImage(null); setActiveStep('upload'); }}
                  className="w-full py-3 bg-white border py7-border-default text-[#3f51b5] rounded-sm font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i> New Image
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

export default MotionBlurTool;
