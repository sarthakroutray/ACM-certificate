import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Verify from './pages/Verify';
import Login from './pages/admin/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AnimatePresence } from 'framer-motion';
import ThreeBackground from './components/ThreeBackground';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
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
      <AuthProvider>
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
                  <Route path="/admin/login" element={<Login />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;