
import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [isFlying, setIsFlying] = useState(false);

  const handleScrollToTop = () => {
    setIsFlying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setIsFlying(false), 800);
  };

  const socialLinks = [
    { icon: 'fa-facebook-f', href: '#' },
    { icon: 'fa-twitter', href: '#' },
    { icon: 'fa-instagram', href: '#' },
    { icon: 'fa-linkedin-in', href: '#' },
    { icon: 'fa-youtube', href: '#' },
  ];

  return (
    <footer className="footer-notch-container text-white border-t border-slate-200">
      <div className="footer-notch-mask"></div>
      
      <div className="footer-mihrab-circle cursor-pointer" onClick={handleScrollToTop}>
        <i className={`fas fa-paper-plane text-2xl text-[#2b43b4] ${isFlying ? 'plane-animate' : ''}`}></i>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest border-b border-white/20 pb-2">Our Mission</h3>
              <p className="text-indigo-100 text-[13px] leading-relaxed opacity-80">
                Py7 Tools is dedicated to providing professional-grade image processing tools for free. Your privacy is paramount; all files are deleted within 30 minutes.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-widest border-b border-white/20 pb-2">Other Platforms</h3>
              <ul className="grid grid-cols-1 gap-3 text-[13px] font-bold text-indigo-100/90">
                <li className="hover:text-white flex items-center gap-2 cursor-pointer transition-colors">
                  <i className="fas fa-caret-right text-[10px] opacity-40"></i> Pi7 PDF Platform
                </li>
                <li className="hover:text-white flex items-center gap-2 cursor-pointer transition-colors">
                  <i className="fas fa-caret-right text-[10px] opacity-40"></i> Pi7 Audio Toolkit
                </li>
                <li className="hover:text-white flex items-center gap-2 cursor-pointer transition-colors">
                  <i className="fas fa-caret-right text-[10px] opacity-40"></i> Bulk Optimizer
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[4px] text-indigo-300 mb-6">Connect With Us</p>
              <div className="flex gap-6">
                {socialLinks.map((social, idx) => (
                  <a key={idx} href={social.href} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all transform hover:scale-110">
                    <i className={`fab ${social.icon} text-lg`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="relative group flex flex-col items-center">
              <a href="https://wa.me/3429748731" target="_blank" rel="noreferrer" className="wa-circle-btn w-16 h-16 bg-[#25d366] text-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105">
                <i className="fab fa-whatsapp text-4xl"></i>
              </a>
              <span className="text-[11px] font-black mt-3 uppercase tracking-widest text-indigo-200">3429748731</span>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end justify-center space-y-4">
             <div className="flex items-center gap-2 bg-white text-[#2b43b4] px-4 py-1.5 rounded-sm font-black text-xl shadow-md">
               <span>Py</span><span className="bg-[#2b43b4] text-white px-2 ml-1 rounded-sm">7</span>
             </div>
             <p className="text-[10px] uppercase font-black tracking-[4px] opacity-40">Image Toolkit</p>
             <div className="text-right mt-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Powered by Muhammad Sufyan</p>
             </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] font-bold uppercase tracking-tight opacity-50">
          <div>Powered by Muhammad Sufyan</div>
          <div className="mt-4 md:mt-0">© 2024 Py7 Tools - Professional Media Solutions</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
