import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Verify from './pages/Verify';
import { AnimatePresence } from 'framer-motion';
import ThreeBackground from './components/ThreeBackground';
import { ThemeProvider } from './context/ThemeContext';
import Cursor from './components/ui/Cursor';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col relative text-text antialiased selection:bg-primary/20 selection:text-primary dark:text-slate-100">
          <Cursor />
          <ThreeBackground />
          <ScrollToTop />
          <Navbar />
          <main className="flex-grow pt-20">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/verify" element={<Verify />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;