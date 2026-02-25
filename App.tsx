
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import Result from './pages/Result';
import History from './pages/History';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Test from './pages/Test';
import TestResult from './pages/TestResult';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import GlobalLoader from './components/GlobalLoader';

// Types
import { QuestionPaper } from './types';
import { saveUserProfile, fetchUserProfile, fetchHistory, savePaper } from './services/api';

interface UserProfile {
  name: string;
  email?: string;
  university: string;
  semester: string;
  theme?: string;
}

const AppContent: React.FC = () => {
  const location = useLocation();
  const [currentPaper, setCurrentPaper] = useState<QuestionPaper | null>(null);
  const [history, setHistory] = useState<QuestionPaper[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [globalLoading, setGlobalLoading] = useState({
    active: false,
    message: "",
    subMessage: ""
  });

  // Premium transition effect on route changes
  useEffect(() => {
    // Only trigger transition loader if we aren't already performing a heavy action (message is empty)
    setGlobalLoading(prev => {
      if (prev.active && prev.message !== "") return prev;
      return { active: true, message: "", subMessage: "" };
    });

    const timer = setTimeout(() => {
      setGlobalLoading(prev => {
        // Only turn off if this was a transition loader (message is empty)
        // If there's a message, an action like 'Generate' is still in progress
        if (prev.message !== "") return prev;
        return { active: false, message: "", subMessage: "" };
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('paper_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedUser = localStorage.getItem('nexusprep_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.theme) {
        document.body.className = `theme-${parsedUser.theme}`;
      }
    }
  }, []);

  const login = async (userData: UserProfile) => {
    try {
      let finalUser = { ...userData, theme: userData.theme || user?.theme || 'Dark' };

      // Sync with PostgreSQL
      if (finalUser.email) {
        try {
          setGlobalLoading({ active: true, message: "Syncing your profile...", subMessage: "Connecting to secure database" });

          await saveUserProfile(finalUser.email, finalUser);

          const h = await fetchHistory(finalUser.email);
          if (Array.isArray(h) && h.length > 0) {
            const parsedHistory = h.map((row: any) => typeof row.full_json_data === 'string' ? JSON.parse(row.full_json_data) : row.full_json_data);
            setHistory(parsedHistory);
            localStorage.setItem('paper_history', JSON.stringify(parsedHistory));
          }
        } catch (err) {
          console.error("Database sync failed:", err);
        } finally {
          setGlobalLoading({ active: false, message: "", subMessage: "" });
        }
      }

      setUser(finalUser);
      localStorage.setItem('nexusprep_user', JSON.stringify(finalUser));
      document.body.className = `theme-${finalUser.theme}`;
    } catch (err) {
      console.error("Unexpected error in login handler:", err);
      // Ensure we don't leave the loading spinner active globally
      setGlobalLoading({ active: false, message: "", subMessage: "" });
      throw err; // Re-throw so Login.tsx can catch and show the error text
    }
  };

  const logout = () => {
    setUser(null);
    setHistory([]);
    localStorage.removeItem('nexusprep_user');
    localStorage.removeItem('paper_history');
    document.body.className = 'theme-Dark';
  };

  const addToHistory = async (paper: QuestionPaper) => {
    const newHistory = [paper, ...history];
    setHistory(newHistory);
    localStorage.setItem('paper_history', JSON.stringify(newHistory));

    // Save to Postgres
    if (user?.email) {
      try {
        await savePaper({
          user_id: user.email,
          subject: paper.subject,
          semester: paper.semester,
          student_name: paper.studentName || user.name,
          full_json_data: paper
        });
      } catch (err) {
        console.error("Error saving paper to database:", err);
      }
    }
  };

  const isLandingRoute = location.pathname === '/';
  const isLoginRoute = location.pathname === '/login';
  const showSidebar = !isLandingRoute && !isLoginRoute && user;

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-400`}>
      <GlobalLoader
        isLoading={globalLoading.active}
        message={globalLoading.message}
        subMessage={globalLoading.subMessage}
      />

      {(isLandingRoute || isLoginRoute) && <Navbar user={user} onLogout={logout} />}

      <div className={`flex flex-1 ${showSidebar ? 'flex-row' : 'flex-col'}`}>
        {showSidebar && <Sidebar user={user} onLogout={logout} />}

        <main className={`flex-1 overflow-y-auto ${showSidebar ? 'p-4 md:p-8 pt-20 md:pt-8' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={login} />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={user ? <Dashboard history={history} user={user} /> : <Navigate to="/login" />}
                />
                <Route
                  path="/generate"
                  element={user ? <Generate setGlobalLoading={setGlobalLoading} onnexuspreperated={(paper) => {
                    setCurrentPaper(paper);
                    addToHistory(paper);
                  }} /> : <Navigate to="/login" />}
                />
                <Route
                  path="/result"
                  element={user ? <Result paper={currentPaper} /> : <Navigate to="/login" />}
                />
                <Route
                  path="/test/:paperId"
                  element={user ? <Test /> : <Navigate to="/login" />}
                />
                <Route
                  path="/test-result/:attemptId"
                  element={user ? <TestResult /> : <Navigate to="/login" />}
                />
                <Route
                  path="/history"
                  element={user ? <History papers={history} onSelectPaper={setCurrentPaper} /> : <Navigate to="/login" />}
                />
                <Route
                  path="/settings"
                  element={user ? <Settings user={user} onUpdateUser={login} /> : <Navigate to="/login" />}
                />
                <Route
                  path="/analytics"
                  element={user ? <Analytics user={user} /> : <Navigate to="/login" />}
                />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
