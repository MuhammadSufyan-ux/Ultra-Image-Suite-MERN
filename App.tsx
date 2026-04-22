
import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import FilterPopup from './components/FilterPopup';
import PassportPhotoTool from './components/tools/passportToolClothes/PassportPhotoTool';
import ReduceKbTool from './components/tools/ReduceKbTool';
import IncreaseKbTool from './components/tools/IncreaseKbTool';
import RemoveBgTool from './components/tools/RemoveBgTool';
import ResizePixelTool from './components/tools/ResizePixelTool';
import SignatureGeneratorTool from './components/tools/SignatureGeneratorTool';
import AiEnhancerTool from './components/tools/AiEnhancerTool';
import ResizeSignatureTool from './components/tools/ResizeSignatureTool';
import ResizeCmTool from './components/tools/ResizeCmTool';
import ResizeFixedTool from './components/tools/ResizeFixedTool';
import BlurBgTool from './components/tools/BlurBgTool';
import AddDobTool from './components/tools/AddDobTool';
import RotateImageTool from './components/tools/RotateImageTool';
import FlipImageTool from './components/tools/FlipImageTool';
import WatermarkTool from './components/tools/WatermarkTool';
import FreehandCropTool from './components/tools/FreehandCropTool';
import CircleCropTool from './components/tools/CircleCropTool';
import SquareCropTool from './components/tools/SquareCropTool';
import MergeSigTool from './components/tools/MergeSigTool';
import JoinImagesTool from './components/tools/JoinImagesTool';
import SplitImagesTool from './components/tools/SplitImagesTool';
import ColorPickerTool from './components/tools/ColorPickerTool';
import MetadataTool from './components/tools/MetadataTool';
import BeautifyTool from './components/tools/BeautifyTool';
import UnblurTool from './components/tools/UnblurTool';
import BlurFaceTool from './components/tools/BlurFaceTool';
import PixelateTool from './components/tools/PixelateTool';
import MotionBlurTool from './components/tools/MotionBlurTool';
import GrayscaleTool from './components/tools/GrayscaleTool';
import BlackAndWhiteTool from './components/tools/BlackAndWhiteTool';
import AiFaceGeneratorTool from './components/tools/AiFaceGeneratorTool';
import { TOOLS } from './constants';
import { Tool, ToolCategory } from './types';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    aiOnly: false,
    types: [] as string[],
    formats: [] as string[]
  });

  const selectedTool = useMemo(() => 
    activeToolId ? TOOLS.find(t => t.id === activeToolId) || null : null
  , [activeToolId]);

  const filteredTools = useMemo(() => {
    let result = TOOLS;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(tool => 
        tool.name.toLowerCase().includes(term) ||
        tool.category.toLowerCase().includes(term) ||
        tool.id.toLowerCase().includes(term)
      );
    }

    if (filters.aiOnly) {
      result = result.filter(tool => tool.badge === 'AI');
    }

    if (filters.types.length > 0) {
      const typeMap: Record<string, string[]> = {
        'Compression': ['comp-', 'reduce-kb', 'increase-kb', 'General Compression', 'Exact Target Sizes'],
        'Pixel Resize': ['resize-pixel', 'dimensions'],
        'CM Resize': ['resize-cm', 'centimeter'],
        'Passport Size': ['id-', 'passport'],
        'Remove Background': ['remove-bg'],
        'Remove Object': ['remove-obj'],
        'Unblur Image': ['unblur'],
        'Blur Image': ['blur-img', 'blur-bg', 'motion-blur'],
        'Pixelate': ['pixelate'],
        'Face Blur': ['blur-face', 'pixelate-face', 'censor'],
        'Watermark': ['watermark'],
        'Grayscale': ['grayscale'],
        'Black & White': ['bw-filter'],
        'Crop Tools': ['crop'],
        'Metadata': ['meta'],
        'Instagram': ['insta'],
        'WhatsApp': ['wa-dp'],
        'YouTube': ['yt-banner'],
        'DPI Convert': ['dpi'],
        'Image Join': ['join-img'],
        'Image Split': ['split-img', 'split-image'],
        'Color Picker': ['color-picker', 'extract-color'],
        'Beautify': ['beautify'],
        'AI Face Gen': ['face-gen']
      };
      
      result = result.filter(tool => 
        filters.types.some(activeType => {
          const criteria = typeMap[activeType];
          if (!criteria) return false;
          return criteria.some(c => 
            tool.id.toLowerCase().includes(c.toLowerCase()) || 
            tool.name.toLowerCase().includes(c.toLowerCase()) ||
            tool.category.toLowerCase().includes(c.toLowerCase())
          );
        })
      );
    }

    if (filters.formats.length > 0) {
      result = result.filter(tool => 
        filters.formats.some(activeFormat => {
          const format = activeFormat.toLowerCase();
          return tool.name.toLowerCase().includes(format) || tool.id.toLowerCase().includes(format);
        })
      );
    }

    return result;
  }, [searchTerm, filters]);

  const categories = Object.values(ToolCategory);
  const activeFilterCount = (filters.aiOnly ? 1 : 0) + filters.types.length + filters.formats.length;

  const removeType = (type: string) => setFilters({...filters, types: filters.types.filter(t => t !== type)});
  const removeFormat = (format: string) => setFilters({...filters, formats: filters.formats.filter(f => f !== format)});

  // View Switcher Logic
  const renderToolView = () => {
    switch (activeToolId) {
      case 'passport':
        return <PassportPhotoTool onBack={() => setActiveToolId(null)} />;
      case 'reduce-kb':
        return <ReduceKbTool onBack={() => setActiveToolId(null)} />;
      case 'increase-kb':
        return <IncreaseKbTool onBack={() => setActiveToolId(null)} />;
      case 'remove-bg':
        return <RemoveBgTool onBack={() => setActiveToolId(null)} />;
      case 'resize-pixel':
        return <ResizePixelTool onBack={() => setActiveToolId(null)} />;
      case 'signature':
        return <SignatureGeneratorTool onBack={() => setActiveToolId(null)} />;
      case 'ai-enhancer':
        return <AiEnhancerTool onBack={() => setActiveToolId(null)} />;
      case 'resize-sig':
        return <ResizeSignatureTool onBack={() => setActiveToolId(null)} />;
      case 'resize-cm':
        return <ResizeCmTool onBack={() => setActiveToolId(null)} />;
      case 'resize-fixed':
        return <ResizeFixedTool onBack={() => setActiveToolId(null)} />;
      case 'blur-bg':
        return <BlurBgTool onBack={() => setActiveToolId(null)} />;
      case 'motion-blur':
      case 'blur-img':
        return <MotionBlurTool onBack={() => setActiveToolId(null)} />;
      case 'blur-face':
      case 'pixelate-face':
        return <BlurFaceTool onBack={() => setActiveToolId(null)} />;
      case 'pixelate':
        return <PixelateTool onBack={() => setActiveToolId(null)} />;
      case 'grayscale':
        return <GrayscaleTool onBack={() => setActiveToolId(null)} />;
      case 'bw-filter':
        return <BlackAndWhiteTool onBack={() => setActiveToolId(null)} />;
      case 'face-gen':
        return <AiFaceGeneratorTool onBack={() => setActiveToolId(null)} />;
      case 'add-dob':
        return <AddDobTool onBack={() => setActiveToolId(null)} />;
      case 'rotate':
        return <RotateImageTool onBack={() => setActiveToolId(null)} />;
      case 'flip':
        return <FlipImageTool onBack={() => setActiveToolId(null)} />;
      case 'watermark':
        return <WatermarkTool onBack={() => setActiveToolId(null)} />;
      case 'free-crop':
        return <FreehandCropTool onBack={() => setActiveToolId(null)} />;
      case 'circle-crop':
        return <CircleCropTool onBack={() => setActiveToolId(null)} />;
      case 'square-crop':
        return <SquareCropTool onBack={() => setActiveToolId(null)} />;
      case 'merge-sig':
        return <MergeSigTool onBack={() => setActiveToolId(null)} />;
      case 'join-img':
        return <JoinImagesTool onBack={() => setActiveToolId(null)} />;
      case 'split-img':
        return <SplitImagesTool onBack={() => setActiveToolId(null)} />;
      case 'color-picker':
        return <ColorPickerTool onBack={() => setActiveToolId(null)} />;
      case 'view-meta':
        return <MetadataTool onBack={() => setActiveToolId(null)} mode="view" />;
      case 'edit-meta':
        return <MetadataTool onBack={() => setActiveToolId(null)} mode="edit" />;
      case 'remove-meta':
        return <MetadataTool onBack={() => setActiveToolId(null)} mode="remove" />;
      case 'beautify':
        return <BeautifyTool onBack={() => setActiveToolId(null)} />;
      case 'unblur':
        return <UnblurTool onBack={() => setActiveToolId(null)} />;
      default:
        return (
          <div className="p-20 text-center space-y-4">
             <i className="fas fa-tools text-5xl text-indigo-100"></i>
             <h2 className="text-xl font-black text-slate-700 uppercase">{selectedTool?.name}</h2>
             <p className="text-sm text-slate-400 font-bold">This tool is currently being modularized. Stay tuned!</p>
             <button onClick={() => setActiveToolId(null)} className="text-[#3f51b5] font-black uppercase text-[10px] tracking-widest border-b-2 border-indigo-200">Go Back</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfd]">
      <Header />
      
      <main className="flex-grow max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeToolId ? (
          renderToolView()
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            <div className="flex-1 space-y-8 w-full">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Compress, Resize & Edit Pictures</h1>
              
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2 max-w-4xl">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-[#3f51b5]/50"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Search Tool (e.g. JPG, Resize, Crop...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border rounded-[4px] py7-border-default py7-border-hover bg-white shadow-sm focus:outline-none focus:border-[#1a237e] transition-all text-sm font-medium"
                  />
                </div>
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className={`flex items-center justify-center gap-2 px-5 py-2 rounded-[4px] border transition-all font-black text-xs uppercase tracking-widest ${activeFilterCount > 0 ? 'bg-[#3f51b5] text-white border-[#1a237e] shadow-lg shadow-indigo-100' : 'bg-white text-[#3f51b5] py7-border-default py7-border-hover hover:text-[#1a237e]'}`}
                >
                  <i className="fas fa-filter"></i>
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="bg-white text-[#3f51b5] w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Active Filter Badges */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                  {filters.aiOnly && (
                     <span className="bg-rose-50 border py7-border-default text-rose-700 px-3 py-1 rounded-[4px] text-[9px] font-black flex items-center gap-2 uppercase tracking-tight">
                       AI ONLY <i className="fas fa-times cursor-pointer hover:text-rose-900" onClick={() => setFilters({...filters, aiOnly: false})}></i>
                     </span>
                  )}
                  {filters.types.map(t => (
                     <span key={t} className="bg-indigo-50 border py7-border-default text-indigo-700 px-3 py-1 rounded-[4px] text-[9px] font-black flex items-center gap-2 uppercase tracking-tight">
                       TYPE: {t} <i className="fas fa-times cursor-pointer hover:text-indigo-900" onClick={() => removeType(t)}></i>
                     </span>
                  ))}
                  {filters.formats.map(f => (
                     <span key={f} className="bg-teal-50 border py7-border-default text-teal-700 px-3 py-1 rounded-[4px] text-[9px] font-black flex items-center gap-2 uppercase tracking-tight">
                       FORMAT: {f} <i className="fas fa-times cursor-pointer hover:text-teal-900" onClick={() => removeFormat(f)}></i>
                     </span>
                  ))}
                  <button 
                    onClick={() => setFilters({ aiOnly: false, types: [], formats: [] })}
                    className="text-[10px] text-[#3f51b5] font-black hover:underline underline-offset-4 ml-1 uppercase"
                  >
                    Reset All
                  </button>
                </div>
              )} 

              {/* Tool Sections */}
              {categories.map((cat) => {
                const categoryTools = filteredTools.filter(t => t.category === cat);
                if (categoryTools.length === 0) return null;
                
                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-[10px]">●</span>
                      <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">{cat}</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      {categoryTools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => setActiveToolId(tool.id)}
                          className="group relative py-3 px-3 bg-white border py7-border-default py7-border-hover rounded-[4px] text-[#3f51b5] hover:text-[#1a237e] transition-all text-center min-h-[52px] flex items-center justify-center shadow-sm hover:shadow-md"
                        >
                          {tool.badge && (
                            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black border-2 border-white z-10 shadow-sm">
                              {tool.badge}
                            </span>
                          )}
                          <span className="text-[11px] font-bold leading-tight uppercase tracking-tight">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-full lg:w-80">
              <Sidebar />
            </div>
          </div>
        )}
      </main>

      <Footer />

      <FilterPopup 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        activeFilters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};

export default App;
