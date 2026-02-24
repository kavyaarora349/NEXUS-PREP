import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertTriangle, Send, XCircle } from 'lucide-react';
import { startTest, saveTestAnswer, logTestEvent, submitTest } from '../services/api';

const Test: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { paperId } = useParams();

    // We expect the paper to be passed via React Router state (e.g. from Dashboard or Generate page)
    const paper = location.state?.paper;

    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 Hours in seconds
    const [warnings, setWarnings] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [strictness, setStrictness] = useState<'normal' | 'strict' | 'chill'>('normal');
    const [selectedSets, setSelectedSets] = useState<Record<number, 'A' | 'B' | null>>({}); // Track selected set per unit
    const [securityWarning, setSecurityWarning] = useState<string | null>(null);
    const isTrackingRef = useRef(false);
    const maxWarnings = 3;

    const containerRef = useRef<HTMLDivElement>(null);
    const attemptIdRef = useRef<number | null>(null);
    const answersRef = useRef<any[]>([]);
    const submitHandlerRef = useRef<(() => Promise<void>) | null>(null);

    attemptIdRef.current = attemptId;

    // Critical fix: Keep answersRef in sync with answers state at all times
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    // 1. Initialize Test on Mount
    useEffect(() => {
        if (!paper) {
            alert("No paper data found to start test.");
            navigate('/');
            return;
        }

        const initTest = async () => {
            try {
                // For demo purposes, we usually rely on localStorage
                const rawUser = localStorage.getItem('nexusprep_user');
                if (!rawUser) { navigate('/login'); return; }
                const user = JSON.parse(rawUser);

                // Hardcoding paperId to paper.id or 1 since paper.id might be a string like "GEN-SUBJECT-SEM"
                // In a robust implementation, the generated paper would be inserted first and return an integer ID.
                const res = await startTest({ user_id: user.email, paper_id: String(paper.id || 'unknown'), paper_json: paper });
                if (res.success) {
                    setAttemptId(res.attemptId);
                    if (res.answers && res.answers.length > 0) {
                        setAnswers(res.answers);
                    } else {
                        // Init blank answers array matching the paper structure
                        const initAns: any[] = [];
                        (paper.sections || []).forEach((unit: any) => {
                            (unit.questions || []).forEach((q: any) => {
                                if (q.text && q.text.toUpperCase() !== "OR") {
                                    initAns.push({
                                        question_text: q.text,
                                        max_marks: q.marks ?? 0,
                                        answer_text: ""
                                    });
                                }
                            });
                        });
                        setAnswers(initAns);
                    }
                }
            } catch (e) {
                console.error(e);
                alert("Failed to initialize secure test.");
            }
        };

        initTest();
    }, [paper, navigate]);


    // 2. Anti-Cheating & Fullscreen Locks - DISABLED FOR NOW
    // 2. Anti-Cheating & Fullscreen Locks - STRICT ENFORCEMENT
    useEffect(() => {
        // Force Fullscreen
        const enterFullscreen = async () => {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (e) {
                console.warn("Fullscreen request requires user interaction.", e);
            }
        };

        // We add a click listener anywhere to trigger fullscreen if it failed initially
        const handleUserInteraction = () => {
            if (!document.fullscreenElement) {
                enterFullscreen();
            }
        };

        const trackEvent = async (type: string) => {
            if (!isTrackingRef.current) return;
            const rawUser = localStorage.getItem('nexusprep_user');
            if (!rawUser) return;
            const user = JSON.parse(rawUser);
            const paperIdStr = String(paper?.id ?? 'unknown');

            try {
                await logTestEvent({ user_id: user.email, paper_id: paperIdStr, event_type: type });
            } catch (e) {
                console.warn('Security log failed:', e);
            }

            setWarnings(prev => {
                const newWarns = prev + 1;
                if (newWarns >= maxWarnings) {
                    setSecurityWarning("Maximum warnings reached (Tab Switch / Exit Fullscreen / Copy-Paste). Your test will be automatically submitted.");
                    setTimeout(() => submitHandlerRef.current?.(), 3000);
                } else {
                    setSecurityWarning(`WARNING: Strict Mode. Tab switching, exiting fullscreen, and copy/paste are not allowed. (${newWarns}/${maxWarnings} warnings)`);
                }
                return newWarns;
            });
        };

        const handleVisibilityChange = () => {
            if (document.hidden) trackEvent("TAB_SWITCH_OR_MINIMIZE");
        };

        const handleBlur = () => {
            trackEvent("WINDOW_BLUR");
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                trackEvent("FULLSCREEN_EXIT");
            }
        };

        const disableCopyPaste = (e: any) => {
            e.preventDefault();
            trackEvent("COPY_PASTE_ATTEMPT");
        };

        const disableRightClick = (e: any) => e.preventDefault();

        // Delay attaching strict anti-cheat tracking to avoid false positives on mount
        const timer = setTimeout(() => {
            isTrackingRef.current = true;
            enterFullscreen();
        }, 2000);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('click', handleUserInteraction);

        document.addEventListener('copy', disableCopyPaste);
        document.addEventListener('paste', disableCopyPaste);
        document.addEventListener('contextmenu', disableRightClick);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('copy', disableCopyPaste);
            document.removeEventListener('paste', disableCopyPaste);
            document.removeEventListener('contextmenu', disableRightClick);
        };
    }, [paper]);


    // 3. Auto-Save Answers Timer (Every 30 seconds) — uses refs to avoid stale closures
    useEffect(() => {
        const interval = setInterval(() => {
            const currentAttemptId = attemptIdRef.current;
            const currentAnswers = answersRef.current;
            if (currentAttemptId && currentAnswers.length > 0) {
                saveTestAnswer({
                    attempt_id: currentAttemptId,
                    answers: currentAnswers,
                    selected_sets: selectedSets
                }).catch(e => console.error("Autosave failed", e));
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [selectedSets]); // Include selectedSets in deps


    // 4. Countdown Timer — single interval, uses ref for submit
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    submitHandlerRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Submit logic — use refs so timer/security callbacks always use latest attemptId/answers
    const handleFinalSubmit = useCallback(async () => {
        const currentAttemptId = attemptIdRef.current ?? attemptId;
        const currentAnswers = answersRef.current ?? answers;
        if (!currentAttemptId || isSubmitting) return;
        setIsSubmitting(true);

        try {
            await saveTestAnswer({
                attempt_id: currentAttemptId,
                answers: currentAnswers,
                selected_sets: selectedSets
            });
            // Removed alert per user request
            await submitTest({
                attempt_id: currentAttemptId,
                selected_sets: selectedSets,
                strictness: strictness
            });
            // Exit fullscreen on submit
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
            navigate(`/test-result/${currentAttemptId}`, { replace: true });
        } catch (err) {
            console.error(err);
            alert("Failed to submit and evaluate test. Check console and try again.");
            setIsSubmitting(false);
        }
    }, [attemptId, answers, isSubmitting, navigate, selectedSets, strictness]);

    useEffect(() => {
        submitHandlerRef.current = handleFinalSubmit;
    }, [handleFinalSubmit]);

    const updateAnswer = (questionText: string, updatedText: string) => {
        setAnswers(prev => prev.map(a =>
            a.question_text === questionText ? { ...a, answer_text: updatedText } : a
        ));
    };

    const getAnswerText = (questionText: string) => {
        const a = answers.find(x => x.question_text === questionText);
        return a ? a.answer_text : "";
    };

    // Helper function to determine if a question belongs to Set A or Set B
    const getQuestionSet = (questionText: string): 'A' | 'B' | null => {
        if (!questionText) return null;
        const upperText = questionText.toUpperCase();
        // Check for Set A variations: "Set A:", "SET A", "Set-A", "Set A)", etc.
        if (upperText.includes('SET A') || upperText.match(/SET\s*A[:\-)]/)) return 'A';
        // Check for Set B variations: "Set B:", "SET B", "Set-B", "Set B)", etc.
        if (upperText.includes('SET B') || upperText.match(/SET\s*B[:\-)]/)) return 'B';
        return null;
    };

    // Handle set selection - clear answers from unselected set
    const handleSetSelection = (unitIndex: number, selectedSet: 'A' | 'B') => {
        setSelectedSets(prev => ({ ...prev, [unitIndex]: selectedSet }));

        // Clear answers from the unselected set
        const unit = paper.sections[unitIndex];
        if (unit) {
            setAnswers(prev => prev.map(ans => {
                const questionSet = getQuestionSet(ans.question_text);
                // If this answer belongs to the unselected set, clear it
                if (questionSet && questionSet !== selectedSet) {
                    return { ...ans, answer_text: '' };
                }
                return ans;
            }));
        }
    };

    // Check if a unit has both Set A and Set B
    const unitHasBothSets = (unit: any): boolean => {
        let hasSetA = false;
        let hasSetB = false;
        (unit.questions || []).forEach((q: any) => {
            if (q.text && q.text.toUpperCase() !== 'OR') {
                const set = getQuestionSet(q.text);
                if (set === 'A') hasSetA = true;
                if (set === 'B') hasSetB = true;
            }
        });
        return hasSetA && hasSetB;
    };

    // Filter questions based on selected set
    const getVisibleQuestions = (unit: any, unitIndex: number) => {
        const selectedSet = selectedSets[unitIndex];
        const allQuestions = unit.questions || [];

        // If no set selected and unit has both sets, show all (with selection prompt)
        if (!selectedSet && unitHasBothSets(unit)) {
            return allQuestions;
        }

        // If a set is selected, filter to show only that set
        if (selectedSet) {
            return allQuestions.filter((q: any) => {
                if (q.text && q.text.toUpperCase() === 'OR') return false; // Hide OR marker when set is selected
                const questionSet = getQuestionSet(q.text);
                return questionSet === selectedSet || questionSet === null; // Show selected set or questions without set label
            });
        }

        // If unit doesn't have both sets, show all questions
        return allQuestions;
    };


    if (!paper) return <div>Loading...</div>;

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div ref={containerRef} className="min-h-screen bg-black text-gray-100 flex flex-col font-sans">

            {/* Test Header */}
            <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between shadow-lg">
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-blue-500" /> TEST MODE
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">{paper.subject} (Sem {paper.semester})</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-red-400 font-semibold mb-1 uppercase tracking-wider">Warnings</span>
                        <div className="flex gap-1">
                            {[...Array(maxWarnings)].map((_, i) => (
                                <XCircle key={i} size={16} className={i < warnings ? 'text-red-500' : 'text-gray-600'} />
                            ))}
                        </div>
                    </div>

                    <select
                        value={strictness}
                        onChange={(e) => setStrictness(e.target.value as any)}
                        className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-black/70 transition-colors hidden sm:block outline-none"
                        title="AI Evaluator Strictness"
                    >
                        <option value="chill">😎 Chill Evaluation</option>
                        <option value="normal">😐 Normal Evaluation</option>
                        <option value="strict">😠 Strict Evaluation</option>
                    </select>

                    <div className={`flex items-center gap-2 font-mono text-2xl font-bold tracking-widest px-4 py-2 rounded-lg bg-black/50 border ${timeLeft < 300 ? 'border-red-500/50 text-red-500 animate-pulse' : 'border-white/10'}`}>
                        <Clock size={20} className={timeLeft < 300 ? 'text-red-500' : 'text-gray-400'} />
                        {formatTime(timeLeft)}
                    </div>

                    <button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Evaluating...' : 'Finish & Submit'} <Send size={16} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">

                <div className="text-center mb-10 border-b border-white/10 pb-8">
                    <h2 className="text-3xl font-bold mb-2 uppercase tracking-wide">{paper.university}</h2>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-400 font-medium">
                        <span className="bg-white/5 px-3 py-1 rounded-full">Subject: <span className="text-white">{paper.subject}</span></span>
                        <span className="bg-white/5 px-3 py-1 rounded-full">Course: <span className="text-white">{paper.course || 'B.Tech'}</span></span>
                        <span className="bg-white/5 px-3 py-1 rounded-full">Semester: <span className="text-white">{paper.semester}</span></span>
                        <span className="bg-white/5 px-3 py-1 rounded-full">Max Marks: <span className="text-white">{paper.maxMarks}</span></span>
                    </div>
                </div>

                <div className="space-y-12">
                    {paper.sections.map((unit: any, uIdx: number) => {
                        const hasBothSets = unitHasBothSets(unit);
                        const selectedSet = selectedSets[uIdx];
                        const visibleQuestions = getVisibleQuestions(unit, uIdx);

                        return (
                            <div key={uIdx} className="bg-gray-900/40 p-6 rounded-3xl border border-white/5">
                                <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-white/10">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-blue-400">{unit.name}</h3>
                                        <span className="text-sm font-semibold text-gray-500 bg-black/40 px-4 py-2 rounded-full uppercase tracking-wider">{unit.instructions}</span>
                                    </div>

                                    {/* Set Selection Buttons */}
                                    {hasBothSets && (
                                        <div className="flex flex-col gap-3 mt-2 p-4 bg-black/30 rounded-xl border border-white/5">
                                            {!selectedSet && (
                                                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
                                                    <AlertTriangle size={16} />
                                                    Please select which set you want to answer
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-400 font-medium">Choose Set:</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleSetSelection(uIdx, 'A')}
                                                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${selectedSet === 'A'
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                            : selectedSet === null
                                                                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                                                                : 'bg-gray-800/30 text-gray-500 border border-gray-700'
                                                            }`}
                                                    >
                                                        Set A
                                                    </button>
                                                    <button
                                                        onClick={() => handleSetSelection(uIdx, 'B')}
                                                        className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${selectedSet === 'B'
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                            : selectedSet === null
                                                                ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                                                                : 'bg-gray-800/30 text-gray-500 border border-gray-700'
                                                            }`}
                                                    >
                                                        Set B
                                                    </button>
                                                </div>
                                                {selectedSet && (
                                                    <span className="text-xs text-green-400 ml-auto flex items-center gap-1">
                                                        ✓ {selectedSet === 'A' ? 'Set A' : 'Set B'} selected - Other set hidden
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    {visibleQuestions.map((q: any, qIdx: number) => {
                                        if (q.text && q.text.toUpperCase() === "OR") {
                                            return (
                                                <div key={qIdx} className="flex flex-col items-center py-4 gap-2">
                                                    <div className="flex items-center w-full">
                                                        <div className="flex-1 border-t border-white/10"></div>
                                                        <span className="px-6 py-2 bg-black/60 rounded-full font-bold text-gray-400 tracking-widest uppercase text-sm border border-white/5">OR</span>
                                                        <div className="flex-1 border-t border-white/10"></div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 italic">You can choose to answer either Set A or Set B (not both required)</p>
                                                </div>
                                            );
                                        }

                                        const isSetB = q.text && (q.text.includes('Set B') || q.text.includes('SET B'));
                                        const answerText = getAnswerText(q.text);
                                        const isEmpty = !answerText || answerText.trim().length === 0;

                                        return (
                                            <div key={qIdx} className="flex flex-col gap-3">
                                                <div className="flex justify-between items-start gap-4">
                                                    <span className="text-lg leading-relaxed text-gray-200">{q.text}</span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isSetB && isEmpty && (
                                                            <span className="text-xs text-gray-500 italic">(Optional)</span>
                                                        )}
                                                        <span className="text-sm font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg outline outline-1 outline-indigo-500/30">[{q.marks}M]</span>
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={answerText}
                                                    onChange={(e) => updateAnswer(q.text, e.target.value)}
                                                    placeholder={isSetB
                                                        ? `(Optional) Type your answer for Set B question here, or leave blank if you answered Set A...`
                                                        : `Type your detailed answer for the ${q.marks} mark question here...`}
                                                    className="select-text w-full h-40 bg-black/50 border border-white/10 hover:border-white/20 focus:border-indigo-500 rounded-xl p-4 text-gray-300 resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                                    spellCheck={false}
                                                    onCopy={(e) => e.preventDefault()}
                                                    onPaste={(e) => e.preventDefault()}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

            </main>

            {/* Security Warning Overlay */}
            {securityWarning && (
                <div className="fixed inset-0 z-[9999] bg-red-950/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-2xl">
                    <AlertTriangle className="text-red-500 w-32 h-32 mb-8 animate-pulse" />
                    <h2 className="text-5xl font-extrabold text-white mb-6 tracking-tight">SECURITY WARNING</h2>
                    <p className="text-2xl text-red-200 mb-12 max-w-3xl leading-relaxed">{securityWarning}</p>

                    {warnings < maxWarnings && (
                        <button
                            onClick={() => {
                                setSecurityWarning(null);
                                if (!document.fullscreenElement) {
                                    document.documentElement.requestFullscreen().catch(() => { });
                                }
                            }}
                            className="px-10 py-5 bg-white text-red-900 font-bold text-2xl rounded-2xl hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                        >
                            Acknowledge & Return to Fullscreen
                        </button>
                    )}
                    {warnings >= maxWarnings && (
                        <p className="text-xl text-red-400 font-mono animate-pulse">Auto-submitting test...</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Test;
