
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpen, Cpu, ShieldCheck, Zap } from 'lucide-react';

const Landing: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Historical Accuracy",
      desc: "Our AI is trained on actual REVA University previous year papers to match complexity and patterns.",
      color: "blue"
    },
    {
      icon: Cpu,
      title: "Contextual Intelligence",
      desc: "Upload your specific lecture notes or syllabus to generate questions relevant to your classroom teaching.",
      color: "indigo"
    },
    {
      icon: ShieldCheck,
      title: "Standardized Formats",
      desc: "Strict adherence to Bloom's Taxonomy and institutional formatting for professional-grade results.",
      color: "purple"
    },
    {
      icon: Zap,
      title: "Instant Generation",
      desc: "Get a full-length, formatted question paper ready for print or digital distribution in seconds.",
      color: "emerald"
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
            Generate Exam Question <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
              Papers Instantly
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered examiner engine specifically trained on REVA University previous papers and your own custom syllabus notes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        {/* Floating Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative mx-auto max-w-5xl"
        >
          <div className="glass-card rounded-3xl p-4 md:p-8 aspect-[16/10] overflow-hidden">
            <div className="w-full h-full bg-[#030712] rounded-xl border border-white/5 p-6 md:p-10 text-left overflow-hidden relative shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-8">
                <div>
                  <h4 className="text-white font-black text-xl md:text-2xl tracking-tight italic">REVA UNIVERSITY</h4>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">School of Computing & Information Technology</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Session 2024-25</p>
                  <p className="text-white font-medium text-xs">Time: 3 Hours | Max: 100</p>
                </div>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-black text-indigo-400 uppercase tracking-[0.25em]">Section A — Concept Basics</h5>
                    <span className="text-[10px] text-gray-600 font-bold">[10 x 2 = 20 Marks]</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Explain the core components of the Von Neumann architecture.",
                      "Distinguish between Big-O and Little-o notation in complexity analysis.",
                      "What are the four pillars of Object Oriented Programming?"
                    ].map((q, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        key={i} 
                        className="flex gap-4 text-sm md:text-base border-l-2 border-indigo-500/20 pl-4 py-1"
                      >
                        <span className="text-gray-600 font-black min-w-[1.5rem]">{i+1}.</span>
                        <p className="text-gray-300 font-medium leading-relaxed">{q}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative AI Sparkle in Mockup */}
              <div className="absolute bottom-6 right-6 p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-200">AI OPTIMIZED</span>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/20 blur-[120px]" />
        </motion.div>
      </section>

      {/* Features Section - NEW */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Empowering Academic Excellence
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            A comprehensive suite of tools designed specifically for the modern examiner and student.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass-card p-8 rounded-[2rem] border border-white/10 flex flex-col items-start gap-4 hover:border-indigo-500/30 transition-colors"
            >
              <div className="p-3 bg-white/5 rounded-2xl">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mt-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-white">PaperGen AI</span>
        </div>
        <div className="flex justify-center gap-8 mb-8 text-sm">
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">Terms</a>
           <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
        </div>
        <p>&copy; 2024 PaperGen AI. Built for REVA University Students.</p>
      </footer>
    </div>
  );
};

export default Landing;
