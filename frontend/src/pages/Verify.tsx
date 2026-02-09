import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import AnimatedSection from '../components/ui/AnimatedSection';
import { Search, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyCertificate, CertificateVerifyResponse } from '../services/api';

const Verify: React.FC = () => {
  const [certCode, setCertCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<CertificateVerifyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCode.trim()) return;

    setStatus('loading');
    setResult(null);
    setErrorMessage('');

    try {
      const certificate = await verifyCertificate(certCode.trim());
      setResult(certificate);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="max-w-lg w-full relative z-10">
        <AnimatedSection>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-slate-900 dark:text-white">Verify Certificate</h1>
            <p className="text-slate-600 dark:text-slate-300 font-mono">Enter the unique Certificate Code to validate authenticity.</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <Card className="mb-8 border-t-4 border-primary">
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="cert-code" className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Certificate Code
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="cert-code"
                    placeholder="e.g. ACM-2024-ABCD"
                    value={certCode}
                    onChange={(e) => setCertCode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={status === 'loading'}
              >
                {status === 'loading' ? 'Verifying...' : 'Verify Now'}
              </Button>
            </form>
          </Card>
        </AnimatedSection>

        <AnimatePresence mode="wait">
          {status === 'success' && result && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-1 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-20"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                      <CheckCircle size={32} />
                    </div>
                  </div>

                  <div className="text-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-6">
                    <h3 className="text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase text-sm mb-1">Verified Authentic</h3>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{result.workshopName}</h2>
                    <p className="font-mono text-slate-500 dark:text-slate-400 text-xs mt-2">Code: {result.code}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-slate-400 text-xs uppercase font-bold mb-1 flex items-center"><User size={12} className="mr-1" /> Recipient</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{result.recipientName}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                      <p className="text-slate-400 text-xs uppercase font-bold mb-1 flex items-center sm:justify-end"><Calendar size={12} className="mr-1" /> Issued On</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{result.issueDate}</p>
                    </div>
                    <div className="col-span-2 mt-2">
                      <p className="text-slate-400 text-xs uppercase font-bold mb-2">Skills Validated</p>
                      <div className="flex flex-wrap gap-2">
                        {result.skills.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md font-mono border border-slate-200 dark:border-slate-600">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start">
                <XCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300">Certificate Not Found</h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errorMessage || `The code "${certCode}" does not match our records. Please check for typos.`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center text-xs text-slate-400 font-mono">
          <p>Enter the certificate code shown on your certificate</p>
        </div>
      </div>
    </div>
  );
};

export default Verify;