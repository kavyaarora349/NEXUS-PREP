
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, User, School, GraduationCap, Mail, Lock } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

interface LoginProps {
  onLogin: (user: { name: string; email: string; university: string; semester: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'auth' | 'profile'>('auth');
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    university: 'REVA University',
    semester: '1'
  });

  const [error, setError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isLogin) {
      try {
        const user = await loginUser({ email: formData.email, password: formData.password });
        onLogin({
          email: user.email,
          name: user.name,
          university: user.university,
          semester: user.semester
        });
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Failed to sign in. Please check your password.');
      }
    } else {
      setStep('profile');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await registerUser({
        email: formData.email,
        password: formData.password,
        name: formData.name || 'Student',
        university: formData.university,
        semester: formData.semester
      });
      onLogin({
        email: user.email,
        name: user.name,
        university: user.university,
        semester: user.semester
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-24 h-24 text-white" />
          </div>

          <AnimatePresence mode="wait">
            {step === 'auth' ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold">{isLogin ? 'Welcome back' : 'Create an account'}</h2>
                  <p className="text-gray-400 mt-2">{isLogin ? 'Sign in to your PaperGen account' : 'Join PaperGen to start generating papers'}</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email address
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="name@reva.edu.in"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Password
                    </label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
                  >
                    {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-white hover:text-indigo-400 font-medium transition-colors"
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b101c] px-2 text-gray-500">Or continue with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="py-3 px-4 glass rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">Google</button>
                  <button className="py-3 px-4 glass rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">Microsoft</button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold">Complete Profile</h2>
                  <p className="text-gray-400 mt-2">Help us personalize your papers</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Kavya S."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <School className="w-4 h-4" /> University
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="REVA University"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Current Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full bg-[#0b101c] border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s.toString()}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
                  >
                    Finish Setup <Sparkles className="w-5 h-5" />
                  </button>
                </form>

                <button
                  onClick={() => setStep('auth')}
                  className="w-full text-center text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Back to login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
