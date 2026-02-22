import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTestResult } from '../services/api';
import { AlertCircle, CheckCircle2, Award, ArrowLeft } from 'lucide-react';
import GlobalLoader from '../components/GlobalLoader';

const Result: React.FC = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadResult = async () => {
            if (!attemptId) return;
            try {
                const res = await fetchTestResult(attemptId);
                if (res.success && res.result) {
                    setResult(res.result);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadResult();
    }, [attemptId]);

    if (loading) return <GlobalLoader isLoading={true} message="Fetching AI Evaluation Results..." subMessage="Connecting to secure database..." />;

    if (!result) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center text-white">
                <div className="text-center font-mono">
                    <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2>Test Result Not Found</h2>
                    <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    // answers: stored as JSON string or array; after grading it's question_scores from AI or fallback
    let questions: any[] = [];
    if (typeof result.answers === 'string') {
        try {
            const parsed = JSON.parse(result.answers);
            questions = Array.isArray(parsed) ? parsed : [];
        } catch (e) { }
    } else if (Array.isArray(result.answers)) {
        questions = result.answers;
    }
    
    // Get selected sets and paper structure
    let selectedSets: Record<number, 'A' | 'B'> = {};
    if (result.selected_sets) {
        if (typeof result.selected_sets === 'string') {
            try {
                selectedSets = JSON.parse(result.selected_sets);
            } catch (e) { }
        } else if (typeof result.selected_sets === 'object') {
            selectedSets = result.selected_sets;
        }
    }
    
    const paperData = result.paper_json || {};
    const sections = paperData.sections || [];
    
    // Helper to determine if a question belongs to Set A or Set B
    const getQuestionSet = (questionText: string): 'A' | 'B' | null => {
        if (!questionText) return null;
        const upperText = questionText.toUpperCase();
        if (upperText.includes('SET A') || upperText.match(/SET\s*A[:\-)]/)) return 'A';
        if (upperText.includes('SET B') || upperText.match(/SET\s*B[:\-)]/)) return 'B';
        return null;
    };
    
    // Filter questions to show only selected sets
    const filteredQuestions = questions.filter((q: any) => {
        const questionSet = getQuestionSet(q.original_question || q.question_text || '');
        // If question has no set label, include it (might be a general question)
        if (!questionSet) return true;
        
        // Find which unit this question belongs to
        for (let unitIdx = 0; unitIdx < sections.length; unitIdx++) {
            const unit = sections[unitIdx];
            const unitQuestions = unit.questions || [];
            const questionExists = unitQuestions.some((uq: any) => 
                uq.text === q.original_question || uq.text === q.question_text
            );
            
            if (questionExists) {
                const selectedSet = selectedSets[unitIdx];
                // If unit has a selected set, only show questions from that set
                if (selectedSet) {
                    return questionSet === selectedSet;
                }
                // If no set selected for unit, show all (backward compatibility)
                return true;
            }
        }
        
        // If question not found in any unit, include it
        return true;
    });
    
    const isFallbackEvaluation = filteredQuestions.some((q: any) => (q.feedback || '').includes('unavailable'));

    return (
        <div className="min-h-screen bg-[#0a0f1c] text-gray-200 p-4 md:p-8 font-sans">

            <button
                onClick={() => navigate('/dashboard')}
                className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Summary */}
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Award className="text-yellow-400" size={32} />
                            AI Test Evaluation
                        </h1>
                        <p className="text-indigo-200">Attempt ID: <span className="font-mono text-white/50">#{result.id}</span></p>
                        <p className="text-sm mt-2 text-gray-400">Status: <span className="uppercase text-green-400 font-bold">{result.status}</span></p>
                    </div>

                    <div className="flex flex-col items-center bg-black/40 border border-white/5 px-8 py-4 rounded-2xl">
                        <span className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Total Score</span>
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600">
                            {result.score ?? 0}
                        </span>
                    </div>
                </div>

                {isFallbackEvaluation && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl text-sm">
                        AI evaluation was not available (e.g. GEMINI_API_KEY not set). Your answers were saved. Scores shown are placeholders.
                    </div>
                )}

                {/* Evaluated Questions List */}
                {filteredQuestions.length === 0 ? (
                    <div className="text-center p-10 text-gray-500 italic border border-white/5 rounded-2xl bg-black/20">
                        No questions were evaluated or the test was blank.
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 sticky top-0 bg-[#0a0f1c] pt-4 z-10">
                            <h2 className="text-xl font-bold">Detailed Question Breakdown</h2>
                            {Object.keys(selectedSets).length > 0 && (
                                <div className="text-sm text-gray-400">
                                    Showing selected sets only
                                </div>
                            )}
                        </div>
                        
                        {/* Group questions by unit */}
                        {sections.map((unit: any, unitIdx: number) => {
                            const unitSelectedSet = selectedSets[unitIdx];
                            const unitQuestions = filteredQuestions.filter((q: any) => {
                                const unitQ = (unit.questions || []).find((uq: any) => 
                                    uq.text === q.original_question || uq.text === q.question_text
                                );
                                return !!unitQ;
                            });
                            
                            if (unitQuestions.length === 0) return null;
                            
                            return (
                                <div key={unitIdx} className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h3 className="text-lg font-bold text-blue-400">{unit.name}</h3>
                                        {unitSelectedSet && (
                                            <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                                                Set {unitSelectedSet} Selected
                                            </span>
                                        )}
                                    </div>
                                    {unitQuestions.map((q: any, idx: number) => (
                                        <div key={idx} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">

                                            {/* Question Target */}
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex gap-4">
                                                    <span className="text-indigo-500 font-mono font-bold mt-1">Q{idx + 1}.</span>
                                                    <h3 className="text-lg leading-relaxed text-gray-100">{q.original_question || q.question_text}</h3>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <span className="font-bold text-lg text-white">{q.marks_awarded ?? 0}</span>
                                                    <span className="text-sm text-gray-500">/ {q.max_marks ?? 0}</span>
                                                </div>
                                            </div>

                                            {/* Student Answer */}
                                            <div className="mt-2 pl-8 border-l-2 border-white/5">
                                                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-2">Student Answer</p>
                                                <div className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed bg-black/40 p-4 rounded-xl font-mono">
                                                    {q.student_answer && q.student_answer.trim() && q.student_answer !== '(blank)' 
                                                        ? q.student_answer 
                                                        : <span className="italic opacity-50">Left Blank</span>}
                                                </div>
                                            </div>

                                            {/* AI Feedback */}
                                            <div className="mt-2 pl-8 border-l-2 border-indigo-500/30">
                                                <p className="text-xs text-indigo-400 font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
                                                    <CheckCircle2 size={14} /> AI Feedback
                                                </p>
                                                <p className="text-indigo-200/80 leading-relaxed text-sm">
                                                    {q.feedback || 'No feedback available.'}
                                                </p>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Result;
