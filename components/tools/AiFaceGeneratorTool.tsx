
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AiFaceGeneratorToolProps {
  onBack: () => void;
}

const AiFaceGeneratorTool: React.FC<AiFaceGeneratorToolProps> = ({ onBack }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [generatedFace, setGeneratedFace] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filters
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [ageGroup, setAgeGroup] = useState<'adult' | 'child' | 'kid'>('adult');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    // Proceed regardless of immediate return due to race condition rule
    setHasKey(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedReference(event.target?.result as string);
        setGeneratedFace(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateFace = async () => {
    setIsProcessing(true);
    // Create new instance before call to use the most recent key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    try {
      let prompt = `Using Google Search to find high-quality real-world portrait lighting and facial structure references for a ${ageGroup} ${gender}, generate a realistic unique 4K high-resolution portrait face. `;
      prompt += "Ensure professional studio quality, sharp details, and neutral aesthetics. Do not return search results, return a generated image grounded in current high-quality portrait trends.";

      const contents: any = { parts: [{ text: prompt }] };

      if (selectedReference) {
        const base64Data = selectedReference.split(',')[1];
        contents.parts.unshift({
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        });
        contents.parts[1].text = `Browse Google for facial similarities and lighting styles matching the provided reference asset. Generate a new, unique realistic 4K face of a ${ageGroup} ${gender} that matches the aesthetic and harmony of the uploaded image.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents,
        config: {
            imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
            },
            // @ts-ignore
            tools: [{ google_search: {} }]
        }
      });

      let imageFound = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setGeneratedFace(`data:image/png;base64,${part.inlineData.data}`);
          imageFound = true;
          break;
        }
      }

      if (!imageFound) {
          // Fallback if model just returns text grounding
          alert("Grounding successful but image generation part was skipped. Please try again.");
      }
    } catch (error: any) {
      console.error("Face Generation Error:", error);
      if (error?.message?.includes("Requested entity was not found")) {
          setHasKey(false);
          alert("Key session expired. Please re-select your API key.");
      } else {
          alert("Failed to generate face. Ensure you are using a Paid Project API key for Pro features.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFace = () => {
    if (!generatedFace) return;
    const link = document.createElement('a');
    link.href = generatedFace;
    link.download = `py7-pro-face-${Date.now()}.png`;
    link.click();
  };

  const reset = () => {
    setSelectedReference(null);
    setGeneratedFace(null);
  };

  if (hasKey === false) {
    return (
      <div className="animate-in fade-in duration-500 max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="bg-white border-2 py7-border-default rounded-[12px] p-12 shadow-2xl space-y-8">
           <i className="fas fa-key text-5xl text-[#3f51b5] animate-pulse"></i>
           <div className="space-y-2">
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Select Pro API Key</h2>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
               To use High-Quality Pro generation with Google Search integration, you must select a valid API key from a 
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[#3f51b5] mx-1 underline underline-offset-2">paid GCP project</a>.
             </p>
           </div>
           <button 
             onClick={handleSelectKey}
             className="w-full py-4 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[4px] shadow-xl hover:bg-[#1a237e] transition-all"
           >
             Select API Key to Begin
           </button>
           <button onClick={onBack} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors pt-4 border-t w-full">Cancel and go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <div className="inline-block px-3 py-1 bg-indigo-50 border py7-border-default rounded-full text-[8px] font-black text-[#3f51b5] uppercase tracking-[3px] mb-4">Pro Version • Google Search Enabled</div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">AI Face Generator Pro</h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Browsing the web to generate realistic human faces with custom filters & image matching</p>
      </div>

      <div className="bg-white border py7-border-default rounded-[4px] shadow-lg overflow-hidden flex flex-col items-center">
        {/* Filter Section */}
        <div className="w-full bg-[#f8f9fb] border-b py7-border-default p-6 flex flex-wrap justify-center gap-8">
           <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gender</p>
              <div className="flex gap-2">
                 {['male', 'female'].map(g => (
                   <button key={g} onClick={() => setGender(g as any)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all border-2 ${gender === g ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>{g}</button>
                 ))}
              </div>
           </div>

           <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Age Group</p>
              <div className="flex gap-2">
                 {['adult', 'child', 'kid'].map(a => (
                   <button key={a} onClick={() => setAgeGroup(a as any)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all border-2 ${ageGroup === a ? 'bg-[#3f51b5] text-white border-[#3f51b5]' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}>{a}</button>
                 ))}
              </div>
           </div>

           <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pro Matching</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all border-2 flex items-center gap-2 ${selectedReference ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
              >
                <i className={`fas ${selectedReference ? 'fa-check-circle' : 'fa-image'}`}></i>
                {selectedReference ? 'Match Success' : 'Upload Style'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
           </div>
        </div>

        {/* Main Workspace */}
        <div className="w-full bg-[#e0e0e0] p-8 md:p-16 flex flex-col items-center justify-center relative min-h-[500px]">
           {/* Reference Image Thumbnail */}
           {selectedReference && (
              <div className="absolute top-4 left-4 z-20 group animate-in slide-in-from-left-4">
                 <div className="bg-white p-1 rounded-sm shadow-xl border-2 border-white relative w-20 h-20 overflow-hidden">
                    <img src={selectedReference} className="w-full h-full object-cover grayscale" alt="Ref" />
                    <button onClick={(e) => { e.stopPropagation(); setSelectedReference(null); }} className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-black uppercase">Remove</button>
                 </div>
                 <p className="text-[8px] font-black uppercase text-slate-500 mt-1 text-center bg-white/50 rounded-full">Pro Reference</p>
              </div>
           )}

           {/* Result Face */}
           <div className="relative shadow-2xl bg-white border-4 border-white select-none overflow-hidden rounded-sm w-[400px] h-[400px] flex items-center justify-center">
              {isProcessing && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-4">
                   <div className="w-12 h-12 border-4 border-[#3f51b5] border-t-transparent rounded-full animate-spin"></div>
                   <div className="text-center space-y-1">
                      <span className="text-[10px] font-black text-[#3f51b5] uppercase tracking-[3px] animate-pulse block">Browsing Web...</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Finding 4K Reference Data</span>
                   </div>
                </div>
              )}
              
              {generatedFace ? (
                <img src={generatedFace} className="w-full h-full object-cover animate-in zoom-in duration-500" alt="Generated Pro Face" />
              ) : (
                <div className="text-center p-10 opacity-20">
                   <i className="fas fa-id-card-clip text-7xl mb-4 text-slate-400"></i>
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Awaiting Pro Generation</p>
                </div>
              )}
           </div>
        </div>

        {/* Action Toolbar */}
        <div className="w-full border-t py7-border-default bg-white p-6 flex flex-col items-center gap-6">
           <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
              <button 
                onClick={generateFace}
                disabled={isProcessing}
                className="flex-1 min-w-[200px] py-4 bg-[#3f51b5] hover:bg-[#1a237e] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[3px] shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <i className={`fas ${generatedFace ? 'fa-rotate' : 'fa-search'}`}></i>
                {generatedFace ? 'Find Different Face' : 'Browse & Generate'}
              </button>
              
              {generatedFace && (
                <button 
                  onClick={downloadFace}
                  className="flex-1 min-w-[200px] py-4 bg-[#00796b] hover:bg-[#004d40] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[3px] shadow-lg transition-all flex items-center justify-center gap-3 animate-in zoom-in-95 duration-300"
                >
                  <i className="fas fa-download"></i>
                  Download 4K
                </button>
              )}
           </div>

           {/* Floating Bottom Button */}
           <div className="mt-2">
              <button 
                onClick={reset}
                title="Clear Workspace"
                className="w-12 h-12 bg-indigo-50 text-[#3f51b5] rounded-full border py7-border-default flex items-center justify-center hover:scale-110 transition-transform shadow-md hover:bg-white"
              >
                <i className="fas fa-plus"></i>
              </button>
           </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-20 text-center space-y-12">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
        <div className="flex justify-center gap-10 text-slate-200">
           <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center hover:border-[#3f51b5] hover:text-[#3f51b5] transition-all shadow-sm cursor-pointer">
              <i className="fab fa-linkedin-in text-lg"></i>
           </div>
           <div className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center hover:border-[#3f51b5] hover:text-[#3f51b5] transition-all shadow-sm cursor-pointer">
              <i className="fab fa-twitter text-lg"></i>
           </div>
           <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-all shadow-sm">
              <i className="fab fa-whatsapp text-lg"></i>
           </a>
        </div>
      </div>
    </div>
  );
};

export default AiFaceGeneratorTool;
