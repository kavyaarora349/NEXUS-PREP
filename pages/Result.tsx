
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Download, 
  RotateCcw, 
  Printer, 
  Share2, 
  ChevronLeft
} from 'lucide-react';
import { QuestionPaper } from '../types';

interface ResultProps {
  paper: QuestionPaper | null;
}

const Result: React.FC<ResultProps> = ({ paper: initialPaper }) => {
  const location = useLocation();
  const [paper, setPaper] = useState<QuestionPaper | null>(initialPaper);

  // Sync state with location or props
  useEffect(() => {
    const paperFromState = (location.state as any)?.paper;
    if (paperFromState) {
      setPaper(paperFromState);
    } else if (initialPaper) {
      setPaper(initialPaper);
    }
  }, [initialPaper, location.state]);

  // If after mounting and checking state we still have no paper, redirect
  if (!paper && !initialPaper && !(location.state as any)?.paper) {
    return <Navigate to="/generate" replace />;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `Question Paper: ${paper?.subject}`,
      text: `Generated a question paper for ${paper?.subject} Semester ${paper?.semester} using PaperGen AI.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!paper) return null; // Wait for useEffect to potentially pick up state

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
        <Link to="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 glass border border-white/10 rounded-xl hover:bg-white/5 transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <Link 
            to="/generate"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <RotateCcw className="w-4 h-4" /> Generate Again
          </Link>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] border border-white/5 overflow-hidden bg-white/5 print:m-0 print:border-0 print:shadow-none print:bg-white">
        <div className="bg-white text-black p-8 md:p-12 min-h-[1000px] shadow-2xl relative print:p-0 print:shadow-none">
          <div className="text-center space-y-2 border-b-2 border-black pb-6 mb-8">
            <h1 className="text-3xl font-black tracking-tighter italic">REVA UNIVERSITY</h1>
            <p className="font-bold text-sm tracking-[0.2em] uppercase">Bengaluru, India</p>
            <div className="flex justify-between items-end mt-6 text-sm">
              <div className="text-left space-y-1">
                <p><span className="font-bold">Course:</span> B.Tech / M.Tech</p>
                <p><span className="font-bold">Subject:</span> {paper.subject}</p>
                <p><span className="font-bold">Semester:</span> {paper.semester}</p>
              </div>
              <div className="text-right space-y-1">
                <p><span className="font-bold">Date:</span> {paper.date}</p>
                <p><span className="font-bold">Time:</span> {paper.timeAllowed}</p>
                <p><span className="font-bold">Max Marks:</span> {paper.maxMarks}</p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {paper.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-black/10 pb-2">
                  <h2 className="text-xl font-black uppercase">{section.name}</h2>
                  <p className="text-sm italic font-medium">{section.instructions}</p>
                </div>
                
                <div className="space-y-6">
                  {section.questions.map((q, qIdx) => (
                    <div key={qIdx} className="flex gap-4 group">
                      <span className="font-bold min-w-[20px]">{qIdx + 1}.</span>
                      <div className="flex-1 flex justify-between items-start">
                        <p className="text-gray-800 leading-relaxed">{q.text}</p>
                        <span className="font-bold ml-4 whitespace-nowrap">({q.marks})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-black/5 text-center text-xs text-gray-500">
            <p>End of Question Paper • Generated by PaperGen AI</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          #root { background: white !important; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </motion.div>
  );
};

export default Result;
