
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Settings,
  History,
  ShieldAlert
} from 'lucide-react';
import { QuestionPaper } from '../types';

interface DashboardProps {
  history: QuestionPaper[];
  user: { name: string; university: string; semester: string };
}

const Dashboard: React.FC<DashboardProps> = ({ history, user }) => {
  const navigate = useNavigate();
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-gray-400 mt-1">Here's what's happening with your papers at {user.university}.</p>
        </div>
        <Link
          to="/generate"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" /> Generate Paper
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Papers', value: history.length, icon: FileText, color: 'text-blue-400' },
          { label: 'Subjects Covered', value: new Set(history.map(p => p.subject)).size, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Current Semester', value: `Sem ${user.semester}`, icon: Clock, color: 'text-purple-400' }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-white/5 rounded-2xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Stats</span>
            </div>
            <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Papers */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Recent Papers</h2>
            <Link to="/history" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {history.length > 0 ? (
              history.slice(0, 4).map((paper, idx) => (
                <div key={`${paper.id}-${idx}`} className="glass-card p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group">
                  <Link to="/result" state={{ paper }} className="flex-1 flex items-center gap-4 group-hover:text-white transition-colors">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {paper.subject} <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </h4>
                      <p className="text-xs text-gray-500">Semester {paper.semester} • {paper.date}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => navigate(`/test/${paper.id}`, { state: { paper } })}
                    className="ml-4 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shrink-0"
                  >
                    <ShieldAlert size={16} /> Take Exam
                  </button>
                </div>
              ))
            ) : (
              <div className="glass-card p-12 rounded-3xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-500">No papers generated yet.</p>
                <Link to="/generate" className="text-indigo-400 mt-2 font-semibold">Generate your first one &rarr;</Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => navigate('/generate')}
              className="glass-card p-4 rounded-2xl border border-white/5 hover:bg-white/5 text-left flex items-center gap-3 w-full transition-colors group"
            >
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-medium group-hover:text-white">Create New Paper</span>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="glass-card p-4 rounded-2xl border border-white/5 hover:bg-white/5 text-left flex items-center gap-3 w-full transition-colors group"
            >
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500/20">
                <History className="w-5 h-5" />
              </div>
              <span className="font-medium group-hover:text-white">View All History</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="glass-card p-4 rounded-2xl border border-white/5 hover:bg-white/5 text-left flex items-center gap-3 w-full transition-colors group"
            >
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500/20">
                <Settings className="w-5 h-5" />
              </div>
              <span className="font-medium group-hover:text-white">Profile Settings</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
