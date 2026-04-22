
import React, { useState } from 'react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navLinks = [
    { name: "Merge PDF's", href: "#", icon: "fa-object-group" },
    { name: "Resize Image", href: "#", icon: "fa-expand" },
    { name: "Passport Photo", href: "#", icon: "fa-id-card" },
    { 
      name: "Convert Image", 
      href: "#", 
      icon: "fa-rotate",
      hasDropdown: true,
      items: [
        { label: "PNG to JPEG", icon: "fa-image" },
        { label: "HEIC To JPG", icon: "fa-mobile-screen" },
        { label: "Images To PDF", icon: "fa-file-pdf" },
        { label: "JPG to Text", icon: "fa-font" },
        { label: "WEBP to JPG", icon: "fa-globe" }
      ]
    },
    { 
      name: "Compress Tool", 
      href: "#", 
      icon: "fa-compress",
      hasDropdown: true,
      items: [
        { label: "Compress to 100KB", icon: "fa-gauge-high" },
        { label: "Compress to 500KB", icon: "fa-gauge" },
        { label: "Optimize Images", icon: "fa-bolt" },
        { label: "Resize For Web", icon: "fa-network-wired" }
      ]
    },
    { name: "Crop Image", href: "#", icon: "fa-crop-simple" },
  ];

  return (
    <nav className="bg-[#3f51b5] text-white sticky top-0 z-[100] border-b-2 py7-border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-[2px] px-2 py-0.5 text-[#3f51b5] font-black text-lg cursor-pointer">
              <span>Py</span><span className="bg-[#3f51b5] text-white px-1.5 ml-0.5 rounded-[1px]">7</span>
            </div>
            <span className="font-black text-lg tracking-tight hidden sm:block uppercase">IMAGE TOOL</span>
          </div>
          
          <div className="hidden lg:block">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => (
                <div 
                  key={link.name} 
                  className="relative group h-14 flex items-center"
                  onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a href={link.href} className="px-4 py-2 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 min-w-[80px] justify-center hover:bg-white/10 transition-colors rounded-md">
                    <i className={`fas ${link.icon} opacity-60`}></i>
                    <span>{link.name}</span>
                    {link.hasDropdown && <i className={`fas fa-chevron-down text-[7px] opacity-70 transition-transform ${activeDropdown === link.name ? 'rotate-180' : ''}`}></i>}
                  </a>

                  {link.hasDropdown && activeDropdown === link.name && (
                    <div className="simple-dropdown animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="space-y-1">
                        {link.items?.map((item) => (
                          <a key={item.label} href="#" className="dropdown-item-pill">
                            <div className="dropdown-icon-dot">
                              <i className={`fas ${item.icon} text-[8px]`}></i>
                            </div>
                            <span className="flex-1">{item.label}</span>
                            <i className="fas fa-arrow-right text-[7px] opacity-30"></i>
                          </a>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10 text-center">
                         <span className="text-[8px] text-white/30 uppercase font-black tracking-widest">Py7 PRO</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden bg-[#3f51b5] border-t-2 py7-border-default max-h-[80vh] overflow-y-auto">
          <div className="px-4 pt-2 pb-6 space-y-4">
            {navLinks.map((link) => (
              <div key={link.name} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase">
                   <a href={link.href} className="flex items-center gap-3">
                     <i className={`fas ${link.icon} opacity-50`}></i>
                     {link.name}
                   </a>
                </div>
                {link.hasDropdown && (
                  <div className="grid grid-cols-1 gap-2 pl-4">
                    {link.items?.map(item => (
                      <a key={item.label} href="#" className="text-[10px] font-bold text-indigo-100 uppercase flex items-center gap-2 py-1">
                        <i className={`fas ${item.icon} text-[8px] opacity-40`}></i>
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
