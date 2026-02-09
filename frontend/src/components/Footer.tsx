import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-sans font-bold text-xl mb-4 text-text dark:text-white">ACM<span className="text-primary"> Get My Certificate</span></h3>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-sm leading-relaxed max-w-xs">
              Empowering students with verifiable skills. Join our workshops, earn certificates, and build your future career.
            </p>
          </div>
          
          <div>
            <h4 className="font-sans font-bold text-lg mb-4 text-text dark:text-white">Platform</h4>
            <ul className="space-y-2 text-sm font-mono text-slate-500 dark:text-slate-400">
              <li><a href="#/verify" className="hover:text-primary transition-colors">Verification</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-bold text-lg mb-4 text-text dark:text-white">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all hover:-translate-y-1">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-400 hover:text-white transition-all hover:-translate-y-1">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-700 hover:text-white transition-all hover:-translate-y-1">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm font-mono text-slate-400">
          © {new Date().getFullYear()} ACM Student Chapter. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;