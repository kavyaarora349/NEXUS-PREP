import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Filter, Calendar, ChevronRight, X, Loader2 } from 'lucide-react';
import { QuestionPaper } from '../types';
import { fetchHistory } from '../services/api';

interface HistoryProps {
  papers?: QuestionPaper[]; // Kept optional for backwards compatibility with App.tsx
  onSelectPaper: (paper: QuestionPaper) => void;
}

const History: React.FC<HistoryProps> = ({ onSelectPaper }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const userStr = localStorage.getItem('papergen_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const data = await fetchHistory(user.email);
          const parsed = data.map((row: any) => typeof row.full_json_data === 'string' ? JSON.parse(row.full_json_data) : row.full_json_data);
          setPapers(parsed);
        } catch (err) {
          console.error("Failed to load papers", err);
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredPapers = useMemo(() => {
    return papers.filter(p =>
      p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.semester.includes(searchTerm)
    );
  }, [papers, searchTerm]);

  const handleSelect = (paper: QuestionPaper) => {
    onSelectPaper(paper);
    navigate('/result');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Paper History</h1>
          <p className="text-gray-400 mt-1">Review and manage your generated question papers.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subjects..."
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2 border rounded-xl transition-all ${showFilter ? 'bg-indigo-600 border-indigo-500 text-white' : 'glass border-white/10 hover:bg-white/5'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      {showFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 rounded-2xl border border-white/10 flex flex-wrap gap-3"
        >
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center px-2">Filters:</span>
          {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'].map(f => (
            <button
              key={f}
              onClick={() => setSearchTerm(f.split(' ')[1])}
              className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs hover:bg-white/10 transition-colors"
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setSearchTerm('')}
            className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs hover:bg-red-500/20 transition-colors"
          >
            Clear All
          </button>
        </motion.div>
      )}

      {filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper, idx) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleSelect(paper)}
              className="glass-card p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <Calendar className="w-3 h-3" /> {paper.date}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold group-hover:text-indigo-400 transition-colors">{paper.subject}</h3>
                <p className="text-sm text-gray-400">Semester {paper.semester} • REVA University</p>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-semibold px-2 py-1 bg-white/5 rounded-md text-gray-400">
                  {paper.maxMarks} Marks
                </span>
                <span className="text-indigo-400 text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Paper <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-[3rem] p-20 text-center border border-dashed border-white/10">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-700" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No papers found</h2>
          <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Clear Search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default History;
