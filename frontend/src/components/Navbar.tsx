import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Award, LogOut, Shield } from 'lucide-react';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import acmLogo from '../../public/assets/acm-logo.png'

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Verify Certificate', path: '/verify' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass py-3 shadow-sm' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src={acmLogo}
              alt="acm logo"
              className="w-10 h-10 object-contain"
            />

            <span className="font-sans font-bold text-xl tracking-tight text-text dark:text-white">
              ACM<span className="text-primary">Get My Certificate</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary relative group ${location.pathname === link.path ? 'text-primary' : 'text-slate-600 dark:text-slate-300 dark:hover:text-primary'}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300 ${location.pathname === link.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
              </Link>
            ))}
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/admin"
                  className={`text-sm font-medium transition-colors hover:text-primary relative group flex items-center gap-1 ${location.pathname === '/admin' ? 'text-primary' : 'text-slate-600 dark:text-slate-300 dark:hover:text-primary'}`}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                  <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300 ${location.pathname === '/admin' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-primary dark:text-slate-300 focus:outline-none transition-transform active:scale-95"
            >
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 w-full glass border-t border-white/20 shadow-lg transition-all duration-300 ease-in-out origin-top ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
      >
        <div className="px-4 pt-4 pb-6 space-y-3 flex flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${location.pathname === link.path ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {link.name}
            </Link>
          ))}
          
          {isAuthenticated && (
            <>
              <Link
                to="/admin"
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-2 ${location.pathname === '/admin' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
              <button
                onClick={handleLogout}
                className="block px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-left w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;