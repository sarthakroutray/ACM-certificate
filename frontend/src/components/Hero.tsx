import React from 'react';
import Button from './ui/Button';
import AnimatedSection from './ui/AnimatedSection';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import Card from './ui/Card';

const Hero: React.FC = () => {
  return (
    <div className="relative pt-16 pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <AnimatedSection>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6 border border-primary/20">
                <Zap size={14} className="mr-2" />
                Level Up Your Portfolio
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
                Validate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-accent">Skills.</span> <br />
                Elevate Your <span className="relative whitespace-nowrap">Future
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-cta opacity-40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>.
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 font-mono leading-relaxed">
                Join premium workshops, master cutting-edge technologies, and receive verifiable blockchain-backed certificates issued by the ACM Chapter.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button href="/verify" size="lg" className="w-full sm:w-auto shadow-xl shadow-primary/20">
                  Verify Certificate <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm font-mono text-slate-500 dark:text-slate-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-cta mr-2 animate-pulse"></div>
                  500+ Certificates Issued
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-accent mr-2 animate-pulse"></div>
                  50+ Workshops Held
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Visual Content */}
          <div className="lg:w-1/2 relative">
            <AnimatedSection delay={0.2}>
              <div className="relative w-full max-w-md mx-auto aspect-[4/3]">
                {/* Abstract Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl -z-10"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl -z-10"></div>
                
                {/* Main Card */}
                <Card className="absolute inset-0 z-20 border-t-4 border-t-primary transform rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                   <div className="h-full flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="h-8 w-8 bg-slate-900 dark:bg-slate-800 rounded mb-2 flex items-center justify-center text-white font-bold">A</div>
                         <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Certificate of Mastery</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400">Advanced React Patterns</p>
                       </div>
                       <ShieldCheck className="w-12 h-12 text-cta opacity-80" />
                     </div>
                     
                     <div className="space-y-4">
                       <div className="h-px w-full bg-slate-100 dark:bg-slate-700"></div>
                       <div className="flex justify-between items-end">
                         <div>
                           <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Recipient</p>
                           <p className="font-mono font-bold text-slate-700 dark:text-slate-200">Alex Johnson</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Date</p>
                           <p className="font-mono font-bold text-slate-700 dark:text-slate-200">Oct 24, 2023</p>
                         </div>
                       </div>
                     </div>
                   </div>
                </Card>

                {/* Floating Badge Card */}
                <div className="absolute -bottom-6 -right-6 z-30 w-48">
                  <div className="glass-card p-4 rounded-xl shadow-xl border-l-4 border-l-cta animate-[float_4s_ease-in-out_infinite]">
                    <div className="flex items-center gap-3">
                      <div className="bg-cta/10 p-2 rounded-full text-cta">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Status</p>
                        <p className="text-sm font-bold text-cta">Verified Valid</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;