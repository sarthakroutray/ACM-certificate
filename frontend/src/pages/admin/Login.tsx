import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AnimatedSection from '../../components/ui/AnimatedSection';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate('/admin');
    } else {
      setError('Invalid credentials. Make sure the backend is running and admin is initialized.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <AnimatedSection>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3 text-slate-900 dark:text-white">Admin Login</h1>
            <p className="text-slate-600 dark:text-slate-300 font-mono">
              Enter your credentials to access the admin panel
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <Card className="border-t-4 border-primary">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all outline-none bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center">
                Use admin credentials from backend .env file
              </p>
            </div>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default Login;
