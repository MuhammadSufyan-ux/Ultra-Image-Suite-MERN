
import React from 'react';

interface FilterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: {
    aiOnly: boolean;
    types: string[];
    formats: string[];
  };
  setFilters: (filters: any) => void;
}

const FilterPopup: React.FC<FilterPopupProps> = ({ isOpen, onClose, activeFilters, setFilters }) => {
  if (!isOpen) return null;

  const toggleAI = () => setFilters({ ...activeFilters, aiOnly: !activeFilters.aiOnly });
  
  const toggleType = (type: string) => {
    const newTypes = activeFilters.types.includes(type)
      ? activeFilters.types.filter(t => t !== type)
      : [...activeFilters.types, type];
    setFilters({ ...activeFilters, types: newTypes });
  };

  const toggleFormat = (format: string) => {
    const newFormats = activeFilters.formats.includes(format)
      ? activeFilters.formats.filter(f => f !== format)
      : [...activeFilters.formats, format];
    setFilters({ ...activeFilters, formats: newFormats });
  };

  const typesList = [
    'Compression', 'Pixel Resize', 'CM Resize', 'Passport Size', 
    'Remove Background', 'Remove Object', 'Unblur Image', 'Blur Image', 
    'Pixelate', 'Face Blur', 'Watermark', 'Grayscale', 
    'Crop Tools', 'Metadata', 'Instagram', 'WhatsApp', 
    'YouTube', 'DPI Convert', 'Image Join', 'Image Split'
  ];

  const formats = ['JPEG', 'PNG', 'PDF', 'WEBP', 'HEIC'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg border-2 py7-border-default rounded-[12px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 py7-border-default flex items-center justify-between bg-gradient-to-r from-[#3f51b5] to-[#1a237e] text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-sliders-h text-sm"></i>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest leading-none">Py7 Filters</h3>
              <p className="text-[8px] font-bold text-indigo-200 mt-1 uppercase tracking-tighter">Customize your toolkit experience</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {/* AI Toggle Card */}
          <div 
            onClick={toggleAI}
            className={`group flex items-center justify-between p-3.5 border-2 rounded-[8px] cursor-pointer transition-all duration-300 ${activeFilters.aiOnly ? 'bg-indigo-50 border-[#3f51b5] shadow-sm' : 'bg-white py7-border-default hover:border-[#3f51b5]'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeFilters.aiOnly ? 'bg-[#3f51b5] text-white' : 'bg-slate-100 text-slate-400'}`}>
                <i className="fas fa-brain text-xs"></i>
              </div>
              <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">AI Generated Tools Only</p>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${activeFilters.aiOnly ? 'bg-[#3f51b5] border-[#3f51b5]' : 'bg-transparent border-slate-200'}`}>
              {activeFilters.aiOnly && <i className="fas fa-check text-[8px] text-white"></i>}
            </div>
          </div>

          {/* Tools Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Image Processing Tools</p>
              <span className="text-[8px] font-bold text-[#3f51b5] bg-indigo-50 px-2 py-0.5 rounded-full">{typesList.length} Options</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {typesList.map(t => (
                <div 
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`group flex items-center justify-between px-3 py-2.5 border rounded-[6px] cursor-pointer transition-all duration-200 ${activeFilters.types.includes(t) ? 'bg-indigo-50 border-[#3f51b5] shadow-sm' : 'bg-white border-slate-100 hover:border-[#3f51b5] hover:bg-slate-50'}`}
                >
                  <span className={`text-[9px] font-black uppercase tracking-tight truncate ${activeFilters.types.includes(t) ? 'text-[#1a237e]' : 'text-slate-500'}`}>{t}</span>
                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${activeFilters.types.includes(t) ? 'bg-[#3f51b5] border-[#3f51b5]' : 'bg-white border-slate-200'}`}>
                    {activeFilters.types.includes(t) && <i className="fas fa-check text-[7px] text-white"></i>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formats Grid */}
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Preferred File Formats</p>
            <div className="grid grid-cols-3 gap-2">
              {formats.map(f => (
                <div 
                  key={f}
                  onClick={() => toggleFormat(f)}
                  className={`flex items-center justify-between px-3 py-2.5 border rounded-[6px] cursor-pointer transition-all duration-200 ${activeFilters.formats.includes(f) ? 'bg-indigo-50 border-[#3f51b5] shadow-sm' : 'bg-white border-slate-100 hover:border-[#3f51b5] hover:bg-slate-50'}`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-tight ${activeFilters.formats.includes(f) ? 'text-[#1a237e]' : 'text-slate-500'}`}>{f}</span>
                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${activeFilters.formats.includes(f) ? 'bg-[#3f51b5] border-[#3f51b5]' : 'bg-white border-slate-200'}`}>
                    {activeFilters.formats.includes(f) && <i className="fas fa-check text-[7px] text-white"></i>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t-2 py7-border-default flex gap-3">
          <button 
            onClick={() => setFilters({ aiOnly: false, types: [], formats: [] })}
            className="flex-1 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[6px] transition-all"
          >
            Reset All
          </button>
          <button 
            onClick={onClose}
            className="flex-[2] py-3 bg-[#3f51b5] text-white rounded-[6px] border border-[#1a237e] text-[10px] font-black uppercase tracking-widest hover:bg-[#1a237e] hover:shadow-lg hover:-translate-y-0.5 shadow-md transition-all active:scale-95"
          >
            Apply Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPopup;
