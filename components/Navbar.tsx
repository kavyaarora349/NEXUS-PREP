
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, User, LogOut, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  user?: { name: string; university: string } | null;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            PaperGen AI
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 glass rounded-full hover:bg-white/5 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <>
                    <div className="fixed inset-0" onClick={() => setShowDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 glass-card rounded-2xl border border-white/10 p-2 shadow-2xl z-[60]"
                    >
                      <Link 
                        to="/dashboard" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Dashboard</span>
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">Profile Settings</span>
                      </Link>
                      <div className="h-px bg-white/5 my-1" />
                      <button 
                        onClick={() => {
                          onLogout?.();
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              to={location.pathname === '/login' ? '/' : '/login'}
              className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
            >
              {location.pathname === '/login' ? 'Home' : 'Sign In'}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
