
import React from 'react';

const Sidebar: React.FC = () => {
  const items = [
    { name: "PDF To Images", color: "text-blue-600" },
    { name: "Watermark Image", color: "text-blue-600" },
    { name: "Pi7 PDF Tool", color: "text-[#3f51b5] font-black" },
    { name: "Images To PDF", color: "text-red-500", dot: true },
    { name: "Signature Maker", color: "text-blue-600" },
    { name: "Blur Background", color: "text-blue-600" },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-white border rounded-[4px] py7-border-default py7-border-hover overflow-hidden shadow-sm">
        <div className="p-3 border-b py7-border-default flex items-center justify-center bg-indigo-50/50">
          <span className="text-red-500 text-[8px] font-black mr-2 animate-pulse">●</span>
          <span className="text-[#3f51b5] font-black text-[11px] uppercase tracking-widest">Resize Image In KB</span>
        </div>
        
        <div className="grid grid-cols-2">
          {items.map((item, idx) => (
            <a 
              key={idx} 
              href="#" 
              className={`p-4 border-b border-r py7-border-default/20 last:border-b-0 text-[10px] font-bold uppercase text-center hover:bg-indigo-50 transition-all ${item.color}`}
            >
              {item.dot && <span className="text-red-500 mr-1">●</span>}
              {item.name}
            </a>
          ))}
        </div>

        <div className="p-3 border-t py7-border-default flex items-center justify-center bg-indigo-50/50">
          <span className="text-red-500 text-[8px] font-black mr-2 animate-pulse">●</span>
          <span className="text-[#3f51b5] font-black text-[11px] uppercase tracking-widest">Image Quality Enhancer</span>
        </div>
      </div>

      <div className="bg-white border py7-border-default py7-border-hover rounded-[4px] p-1.5 shadow-sm min-h-[350px] flex flex-col">
        <div className="text-[9px] text-slate-400 text-right uppercase font-black tracking-tighter mb-1.5 px-1">Advertisements</div>
        <div className="flex-1 bg-slate-50 rounded-[2px] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
           <i className="fas fa-rectangle-ad text-3xl text-slate-200"></i>
           <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest text-center">Premium Ad Space</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
