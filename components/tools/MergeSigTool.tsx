
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface MergeSigToolProps {
  onBack: () => void;
}

const MergeSigTool: React.FC<MergeSigToolProps> = ({ onBack }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'edit' | 'processing' | 'download'>('upload');
  
  // Settings
  const [overlap, setOverlap] = useState(false);
  const [hasBorder, setHasBorder] = useState(false);
  const [unit, setUnit] = useState<'CM' | 'Inch' | 'Pixel'>('CM');
  const [dpi, setDpi] = useState<number>(200);
  const [width, setWidth] = useState<string>('32');
  const [height, setHeight] = useState<string>('61.86');
  const [compressToSize, setCompressToSize] = useState(false);
  const [targetKb, setTargetKb] = useState<string>('60');

  // Preview / Processing
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target?.result as string);
        if (signature) setActiveStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSignature(ev.target?.result as string);
        if (photo) setActiveStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAll = () => {
    setPhoto(null);
    setSignature(null);
    setFinalResult(null);
    setActiveStep('upload');
  };

  const processMerge = async () => {
    if (!photo || !signature) {
      alert("Please upload both photo and signature.");
      return;
    }
    setActiveStep('processing');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions in Pixels
    let pxW = 0, pxH = 0;
    const wVal = parseFloat(width) || 0;
    const hVal = parseFloat(height) || 0;

    if (unit === 'Pixel') {
      pxW = wVal;
      pxH = hVal;
    } else if (unit === 'Inch') {
      pxW = wVal * dpi;
      pxH = hVal * dpi;
    } else { // CM
      pxW = (wVal * dpi) / 2.54;
      pxH = (hVal * dpi) / 2.54;
    }

    canvas.width = pxW;
    canvas.height = pxH;

    const imgPhoto = new Image();
    const imgSig = new Image();

    await Promise.all([
      new Promise(res => { imgPhoto.onload = res; imgPhoto.src = photo; }),
      new Promise(res => { imgSig.onload = res; imgSig.src = signature; })
    ]);

    // Draw Logic
    if (overlap) {
      ctx.drawImage(imgPhoto, 0, 0, pxW, pxH);
      const sigW = pxW * 0.4;
      const sigH = (imgSig.height / imgSig.width) * sigW;
      ctx.drawImage(imgSig, pxW - sigW - 10, pxH - sigH - 10, sigW, sigH);
    } else {
      const photoH = pxH * 0.75;
      const sigH = pxH * 0.25;
      ctx.drawImage(imgPhoto, 0, 0, pxW, photoH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, photoH, pxW, sigH);
      
      const drawSigW = pxW * 0.8;
      const drawSigH = (imgSig.height / imgSig.width) * drawSigW;
      const finalSigH = Math.min(drawSigH, sigH * 0.8);
      const finalSigW = (imgSig.width / imgSig.height) * finalSigH;
      ctx.drawImage(imgSig, (pxW - finalSigW) / 2, photoH + (sigH - finalSigH) / 2, finalSigW, finalSigH);
    }

    if (hasBorder) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, pxW, pxH);
    }

    let quality = 0.95;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);

    if (compressToSize) {
      const target = parseInt(targetKb) || 60;
      for (let q = 0.9; q > 0.05; q -= 0.05) {
        const testUrl = canvas.toDataURL('image/jpeg', q);
        const kb = (testUrl.length * (3/4)) / 1024;
        if (kb <= target) {
          dataUrl = testUrl;
          break;
        }
        dataUrl = testUrl;
      }
    }

    setFinalResult(dataUrl);
    setTimeout(() => setActiveStep('download'), 1000);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Merge Photo and Signature</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Pi7 Image Tool - Create professional merged images for forms and documents instantly.</p>
      </div>

      <div className="bg-white border-2 py7-border-default rounded-[4px] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {activeStep === 'upload' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-20 items-center justify-center bg-slate-50/30">
            <div 
              onClick={() => photoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[12px] p-16 text-center hover:bg-white cursor-pointer transition-all group bg-white flex flex-col items-center justify-center gap-4 ${photo ? 'border-green-500 ring-2 ring-green-50 shadow-sm' : 'border-indigo-100'}`}
            >
              <i className={`fas ${photo ? 'fa-check-circle text-green-500' : 'fa-user-circle text-indigo-100'} text-6xl group-hover:scale-110 transition-transform`}></i>
              <div className="space-y-1">
                <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest">1. Select Photo</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Passport size or ID photo</p>
              </div>
              <button className={`px-8 py-2.5 rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-lg ${photo ? 'bg-green-600 text-white' : 'bg-[#3f51b5] text-white'}`}>
                {photo ? 'Photo Selected' : 'Choose Photo'}
              </button>
              <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>

            <div 
              onClick={() => sigInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[12px] p-16 text-center hover:bg-white cursor-pointer transition-all group bg-white flex flex-col items-center justify-center gap-4 ${signature ? 'border-green-500 ring-2 ring-green-50 shadow-sm' : 'border-indigo-100'}`}
            >
              <i className={`fas ${signature ? 'fa-check-circle text-green-500' : 'fa-signature text-indigo-100'} text-6xl group-hover:scale-110 transition-transform`}></i>
              <div className="space-y-1">
                <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest">2. Select Signature</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Scan or Digital Signature</p>
              </div>
              <button className={`px-8 py-2.5 rounded-[4px] font-black text-[10px] uppercase tracking-widest shadow-lg ${signature ? 'bg-green-600 text-white' : 'bg-[#3f51b5] text-white'}`}>
                {signature ? 'Signature Selected' : 'Choose Signature'}
              </button>
              <input type="file" ref={sigInputRef} onChange={handleSigUpload} className="hidden" accept="image/*" />
            </div>

            {photo && signature && (
              <div className="md:col-span-2 flex justify-center animate-in slide-in-from-bottom-4 duration-500">
                <button 
                  onClick={() => setActiveStep('edit')}
                  className="px-20 py-4 bg-[#00796b] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[4px] shadow-2xl hover:bg-[#004d40] transition-all transform active:scale-95"
                >
                  Proceed to Workspace
                </button>
              </div>
            )}
          </div>
        )}

        {activeStep === 'edit' && (
          <div className="flex flex-col md:flex-row flex-1">
            {/* Left Side: Preview Areas */}
            <div className="flex-1 bg-slate-100 p-8 md:p-12 flex flex-col items-center justify-center gap-0 border-b md:border-b-0 md:border-r py7-border-default">
              <div className="w-full max-w-[320px] bg-white border py7-border-default shadow-xl rounded-[2px] overflow-hidden flex flex-col">
                <div className="relative group aspect-[3/4] border-b py7-border-default flex items-center justify-center overflow-hidden">
                  <img src={photo!} className="w-full h-full object-cover" alt="User" />
                  <button className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-sm text-[8px] font-black uppercase flex items-center gap-1 hover:bg-[#3f51b5] transition-colors shadow-lg">
                    <i className="fas fa-crop-simple"></i> Crop
                  </button>
                </div>
                <div className="relative group h-32 flex items-center justify-center bg-black overflow-hidden">
                  <img src={signature!} className="max-h-full max-w-full object-contain p-4 invert brightness-200" alt="Signature" />
                  <button className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-sm text-[8px] font-black uppercase flex items-center gap-1 hover:bg-[#3f51b5] transition-colors shadow-lg">
                    <i className="fas fa-crop-simple"></i> Crop
                  </button>
                </div>
              </div>
              <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-info-circle text-[#3f51b5]"></i> Preview reflects default layout
              </p>
            </div>

            {/* Right Side: Professional Controls */}
            <div className="w-full md:w-[480px] p-8 md:p-12 flex flex-col bg-white overflow-y-auto">
              <div className="space-y-8 flex-1">
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={overlap} onChange={() => setOverlap(!overlap)} className="w-4 h-4 accent-[#3f51b5] rounded-sm" />
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-tight group-hover:text-[#3f51b5]">Overlap signature on photo</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={hasBorder} onChange={() => setHasBorder(!hasBorder)} className="w-4 h-4 accent-[#3f51b5] rounded-sm" />
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-tight group-hover:text-[#3f51b5]">Add border on image</span>
                  </label>
                </div>

                <div className="space-y-4 pt-6 border-t py7-border-default">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Set Width & Height</p>
                  <div className="flex bg-slate-50 p-1 rounded-full border py7-border-default">
                    {['CM', 'Inch', 'Pixel'].map(u => (
                      <button 
                        key={u} 
                        onClick={() => setUnit(u as any)}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-full transition-all ${unit === u ? 'bg-white text-[#3f51b5] shadow-md border py7-border-default' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-5 items-end gap-3">
                    <div className="col-span-1 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase block text-center">DPI</span>
                      <input type="number" value={dpi} onChange={(e) => setDpi(parseInt(e.target.value) || 0)} className="w-full px-2 py-2 border-2 py7-border-default rounded-sm text-[10px] font-bold text-center outline-none focus:border-[#3f51b5]" />
                    </div>
                    <span className="col-span-1 text-slate-300 text-center font-black pb-2 text-xl">=</span>
                    <div className="col-span-1 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase block text-center">Width ({unit.toLowerCase()})</span>
                      <input type="text" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full px-2 py-2 border-2 py7-border-default rounded-sm text-[10px] font-bold text-center outline-none focus:border-[#3f51b5]" />
                    </div>
                    <span className="col-span-1 text-slate-300 text-center font-black pb-2 text-xl">X</span>
                    <div className="col-span-1 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase block text-center">Height ({unit.toLowerCase()})</span>
                      <input type="text" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full px-2 py-2 border-2 py7-border-default rounded-sm text-[10px] font-bold text-center outline-none focus:border-[#3f51b5]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t py7-border-default">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={compressToSize} onChange={() => setCompressToSize(!compressToSize)} className="w-4 h-4 accent-[#3f51b5] rounded-sm" />
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-tight group-hover:text-[#3f51b5]">Compress image to specific size (ex. 60kb)</span>
                  </label>
                  {compressToSize && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                      <input type="text" value={targetKb} onChange={(e) => setTargetKb(e.target.value)} className="w-24 px-3 py-2 border-2 py7-border-default rounded-sm text-[11px] font-black text-center outline-none focus:border-[#3f51b5]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">KB Target</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-10 mt-10 border-t py7-border-default flex gap-4">
                <button 
                  onClick={clearAll}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-2 py7-border-default rounded-[4px] hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                >
                  Clear All
                </button>
                <button 
                  onClick={processMerge}
                  className="flex-[2] py-4 bg-[#3f51b5] text-white text-[11px] font-black uppercase tracking-[3px] rounded-[4px] shadow-2xl hover:bg-[#1a237e] transition-all transform active:scale-95 flex items-center justify-center gap-3"
                >
                  <i className="fas fa-file-export"></i> Download Image
                </button>
              </div>
            </div>
          </div>
        )}

        {activeStep === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-40">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-[#3f51b5]/10 rounded-full"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-[#3f51b5] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-black uppercase tracking-[6px] text-[#3f51b5]">Merging Assets...</p>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[2px]">Calculating DPI & Layout</p>
            </div>
          </div>
        )}

        {activeStep === 'download' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-10 py-20 px-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100 shadow-sm">
              <i className="fas fa-check text-4xl text-green-500"></i>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest">Document Ready</h2>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase">Merged successfully with {width}x{height} {unit.toLowerCase()} dimensions.</p>
            </div>
            
            <div className="bg-white border-8 border-white shadow-2xl rounded-[2px] max-w-sm overflow-auto max-h-[400px]">
              <img src={finalResult!} className="w-full h-auto" alt="Final" />
            </div>

            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button 
                onClick={() => { const a = document.createElement('a'); a.href = finalResult!; a.download = `py7-merged-${Date.now()}.jpg`; a.click(); }}
                className="w-full py-5 bg-[#00796b] text-white rounded-[4px] font-black text-[14px] uppercase tracking-[4px] shadow-2xl hover:bg-[#004d40] transition-all flex items-center justify-center gap-4"
              >
                <i className="fas fa-download"></i> Save HD Image
              </button>
              <button onClick={clearAll} className="text-[#3f51b5] font-black uppercase text-[11px] border-b-2 border-indigo-100 mt-4 tracking-widest hover:text-[#1a237e] text-center mx-auto">Create New Merge</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-20 text-center space-y-12">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
        <div className="flex justify-center gap-8 text-slate-300">
          <i className="fab fa-facebook-f text-xl hover:text-[#3f51b5] cursor-pointer transition-colors"></i>
          <i className="fab fa-twitter text-xl hover:text-[#3f51b5] cursor-pointer transition-colors"></i>
          <i className="fab fa-instagram text-xl hover:text-[#3f51b5] cursor-pointer transition-colors"></i>
          <i className="fab fa-linkedin-in text-xl hover:text-[#3f51b5] cursor-pointer transition-colors"></i>
          <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="hover:text-green-500 transition-colors">
            <i className="fab fa-whatsapp text-xl"></i>
          </a>
        </div>
      </div>
    </div>
  );
};

export default MergeSigTool;
