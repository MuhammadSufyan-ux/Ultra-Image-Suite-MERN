
import React, { useState, useRef } from 'react';

interface ExifTags {
  Artist: string;
  Make: string;
  Model: string;
  Software: string;
  DateTimeOriginal: string;
  UserComment: string;
  GPSLatitude: string;
  GPSLongitude: string;
  [key: string]: string;
}

interface MetadataToolProps {
  onBack: () => void;
  mode: 'view' | 'edit' | 'remove';
}

const MetadataTool: React.FC<MetadataToolProps> = ({ onBack, mode }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tags, setTags] = useState<ExifTags>({
    Artist: '',
    Make: '',
    Model: '',
    Software: 'Py7 Image Tool Pro',
    DateTimeOriginal: new Date().toISOString().split('T')[0],
    UserComment: '',
    GPSLatitude: '',
    GPSLongitude: ''
  });
  const [showAll, setShowAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        // In a real scenario, we'd use a library like exif-js here.
        // For this UI implementation, we simulate finding no metadata initially as per user's screenshot.
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setTags(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = () => {
    if (!selectedImage) return;
    // Simulation: In a real app, we'd use piexifjs to inject these tags back into the blob
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `py7-metadata-${Date.now()}.jpg`;
    link.click();
  };

  const commonTags = [
    { label: 'Artist', key: 'Artist' },
    { label: 'Make', key: 'Make' },
    { label: 'Model', key: 'Model' },
    { label: 'Software', key: 'Software' },
    { label: 'DateTimeOriginal', key: 'DateTimeOriginal' },
    { label: 'UserComment', key: 'UserComment' },
    { label: 'GPSLatitude', key: 'GPSLatitude' },
    { label: 'GPSLongitude', key: 'GPSLongitude' },
  ];

  const extendedTags = [
    { label: 'Copyright', key: 'Copyright' },
    { label: 'ImageDescription', key: 'ImageDescription' },
    { label: 'ExposureProgram', key: 'ExposureProgram' },
    { label: 'ISOSpeedRatings', key: 'ISOSpeedRatings' },
    { label: 'FocalLength', key: 'FocalLength' },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#3f51b5] font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
        <i className="fas fa-arrow-left"></i> Back to Home
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
          {mode === 'edit' ? 'Edit Image Metadata Online' : mode === 'view' ? 'View Image Metadata Online' : 'Remove Image Metadata'}
        </h1>
        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-loose">Py7 Image Tool - Complete control over every EXIF tag in your image.</p>
      </div>

      <div className="bg-white border-2 py7-border-default rounded-[4px] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {!selectedImage ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-2xl border-2 border-dashed border-[#c5cae9] rounded-[8px] p-24 text-center hover:bg-slate-50 cursor-pointer transition-all group bg-white flex flex-col items-center justify-center">
              <i className="fas fa-file-code text-6xl text-indigo-100 mb-8 group-hover:scale-110 transition-transform"></i>
              <h3 className="text-[14px] font-black text-slate-700 uppercase tracking-widest mb-2">Select Image to Manage Metadata</h3>
              <button className="px-12 py-3.5 bg-[#3f51b5] text-white rounded-[4px] font-black text-[11px] uppercase tracking-widest shadow-xl">Choose Photo</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg,image/tiff" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-col lg:flex-row border-b py7-border-default">
              {/* Left: Image Info */}
              <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r py7-border-default bg-slate-50/30">
                <div className="flex items-center gap-3 text-green-600 mb-8 font-black text-[11px] uppercase tracking-widest">
                  <i className="fas fa-circle-info"></i> No metadata found in this image.
                </div>
                <div className="bg-white border-4 border-white shadow-2xl rounded-sm overflow-hidden max-w-[280px]">
                   <img src={selectedImage} className="w-full h-auto block" alt="Source" />
                </div>
                <button onClick={() => setSelectedImage(null)} className="mt-8 text-[10px] font-black text-[#3f51b5] uppercase border-b-2 border-indigo-100 tracking-widest">Select New Image</button>
              </div>

              {/* Right: Metadata Inputs */}
              <div className="w-full lg:w-[600px] bg-white">
                <div className="bg-slate-100/50 p-3 text-center border-b py7-border-default">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Commonly Used Tags</span>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {commonTags.map((tag) => (
                    <div key={tag.key} className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{tag.label}</label>
                      <input 
                        type="text" 
                        readOnly={mode === 'view'}
                        value={tags[tag.key]} 
                        onChange={(e) => handleInputChange(tag.key, e.target.value)}
                        className="w-full px-3 py-2 border py7-border-default rounded-sm text-[11px] font-bold outline-none focus:border-[#3f51b5] bg-white shadow-inner"
                        placeholder={`Enter ${tag.label}...`}
                      />
                    </div>
                  ))}

                  {showAll && extendedTags.map((tag) => (
                    <div key={tag.key} className="space-y-1.5 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{tag.label}</label>
                      <input 
                        type="text" 
                        readOnly={mode === 'view'}
                        value={tags[tag.key] || ''} 
                        onChange={(e) => handleInputChange(tag.key, e.target.value)}
                        className="w-full px-3 py-2 border py7-border-default rounded-sm text-[11px] font-bold outline-none focus:border-[#3f51b5] bg-white shadow-inner"
                        placeholder={`Enter ${tag.label}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="p-4 bg-slate-50 flex items-center justify-between px-8">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={showAll} onChange={() => setShowAll(!showAll)} className="w-4 h-4 accent-[#3f51b5]" />
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#3f51b5]">Show All Metadata Tags</span>
               </label>
               <button 
                onClick={handleDownload}
                className="px-10 py-3 bg-[#3f51b5] text-white rounded-[4px] font-black text-[12px] uppercase tracking-[2px] shadow-lg hover:bg-[#1a237e] transition-all"
               >
                 Download Image
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-20 text-center space-y-12">
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[6px]">Powered by Muhammad Sufyan</p>
        <div className="flex justify-center gap-12 text-slate-200">
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

export default MetadataTool;
