
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Settings,
  Sparkles,
  ChevronLeft,
  Menu,
  LogOut,
  BarChart2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  user: { name: string; university: string } | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FilePlus, label: 'Generate Paper', path: '/generate' },
    { icon: History, label: 'History', path: '/history' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 glass rounded-lg"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? '280px' : '80px' }}
        className={`fixed md:relative h-full z-40 bg-[#070b14] border-r border-white/5 flex flex-col transition-all duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="shrink-0 p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <span className="text-lg font-bold whitespace-nowrap">Nexus Prep</span>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
                ${isActive
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              {user?.name.charAt(0) || 'U'}
            </div>
            {isOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.university || 'REVA University'}</p>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-red-400 hover:bg-red-500/10 ${!isOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
