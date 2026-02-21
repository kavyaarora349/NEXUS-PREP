import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Sparkles,
  User,
  Hash,
  BookOpen
} from 'lucide-react';
import { generatePaper } from '../services/api';
import { QuestionPaper } from '../types';

// Mock simple useAuth if context isn't available in scope. 
// Assuming user ID needs to be pulled from local storage based on earlier login setup.
const getUserId = () => {
  const userStr = localStorage.getItem('papergen_user');
  if (userStr) {
    try { return JSON.parse(userStr).email; } catch (e) { return null; }
  }
  return null;
}

interface GenerateProps {
  onPaperGenerated: (paper: QuestionPaper) => void;
  setGlobalLoading: (loading: { active: boolean; message: string; subMessage: string }) => void;
}

const Generate: React.FC<GenerateProps> = ({ onPaperGenerated, setGlobalLoading }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    semester: 'Semester 1',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files as Iterable<File>).filter(
        file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
      );

      if (filesArray.length > 0) {
        setSelectedFiles(prev => [...prev, ...filesArray]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files as Iterable<File>);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = getUserId();
    if (!userId) {
      alert("You must be logged in to generate a paper.");
      return;
    }

    setGlobalLoading({
      active: true,
      message: "AI Generator Pipeline Running",
      subMessage: "Analyzing REVA University historical patterns and extracting student notes..."
    });

    try {
      // Validations
      if (!formData.subject.trim()) throw new Error("Please enter a subject name.");
      if (selectedFiles.length === 0) throw new Error("Please upload at least one Notes PDF.");

      const payload = new FormData();
      payload.append('user_id', userId);
      payload.append('subject', formData.subject);
      payload.append('semester', formData.semester.replace('Semester ', ''));

      // Append multiple files
      selectedFiles.forEach(file => {
        payload.append('notes', file);
      });

      // Call Express Backend -> Python Script
      const result = await generatePaper(payload);

      if (result.success && result.paper) {
        // paper might be a string (if from python), parse it to JSON
        let parsedPaper: QuestionPaper;
        if (typeof result.paper === 'string') {
          parsedPaper = JSON.parse(result.paper);
        } else {
          parsedPaper = result.paper;
        }

        onPaperGenerated(parsedPaper);
        setGlobalLoading({ active: false, message: "", subMessage: "" });

        setTimeout(() => {
          navigate('/result', { state: { paper: parsedPaper }, replace: true });
        }, 50);
      } else {
        throw new Error("API returned success false");
      }

    } catch (err: any) {
      setGlobalLoading({ active: false, message: "", subMessage: "" });
      alert(err?.response?.data?.error || err.message || "Failed to generate AI paper. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">Generate Question Paper</h1>
          <p className="text-gray-400 mt-2">Input your details and content to create a personalized exam paper.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <form onSubmit={handleGenerate} className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                    <User className="w-4 h-4" /> Student Name
                  </span>
                  <input
                    type="text"
                    value="Student" // Read-only representation
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Enter your name"
                    readOnly
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                      <Hash className="w-4 h-4" /> Semester
                    </span>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={`Semester ${sem}`}>Semester {sem}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                      <BookOpen className="w-4 h-4" /> Subject
                    </span>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. Data Structures"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                  <FileText className="w-4 h-4" /> Syllabus / Notes (Optional)
                </span>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isHovering
                    ? 'border-indigo-400 bg-indigo-500/10'
                    : selectedFiles.length > 0
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-white/20 hover:border-indigo-500/50 hover:bg-white/5'
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                  onDragLeave={() => setIsHovering(false)}
                  onDrop={handleFileDrop}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {selectedFiles.length > 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-2">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-green-400">{selectedFiles.length} PDFs Selected</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-4 relative z-20">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-black/40 rounded-lg border border-white/10">
                            <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                            <button
                              onClick={(e) => { e.preventDefault(); removeFile(idx); }}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 z-0">Click or drag more PDFs to add</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="font-semibold text-white">Drop your notes here</p>
                      <p className="text-sm text-gray-500 mt-1">PDFs only, up to 10MB each</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-indigo-600/20 hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5" /> Generate Paper
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" /> Pro Tips
              </h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 text-xs">1</div>
                  Providing detailed notes helps the AI create more relevant questions.
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 text-xs">2</div>
                  The generated papers follow REVA University's standard weightage.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Generate;
