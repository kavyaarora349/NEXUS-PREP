import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid
} from 'recharts';
import {
    TrendingUp, Activity, Award, Loader2, AlertCircle
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';

interface AnalyticsProps {
    user: { email: string; name: string } | null;
}

const Analytics: React.FC<AnalyticsProps> = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!user?.email) return;

        const loadData = async () => {
            try {
                setLoading(true);
                const result = await fetchAnalytics(user.email);
                setData(result);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-indigo-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-medium animate-pulse">Crunching your study numbers...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-400">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="font-medium">{error || 'No analytics data available yet.'}</p>
                <p className="text-sm text-red-400/60 mt-2">Take somewhat graded tests to generate charts.</p>
            </div>
        );
    }

    const { overview, timeline, subjectPerformance } = data;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <header>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Activity className="text-indigo-400 w-8 h-8" />
                    Performance Analytics
                </h1>
                <p className="text-gray-400 mt-2">
                    Track your progress and identify areas for improvement.
                </p>
            </header>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-blue-400" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-400">Total Exams Taken</h3>
                    </div>
                    <p className="text-4xl font-bold">{overview.totalTests}</p>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award className="w-24 h-24 text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-400">Average Score</h3>
                    </div>
                    <p className="text-4xl font-bold">{overview.avgScore}%</p>
                </motion.div>

                <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award className="w-24 h-24 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
                            <Award className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-400">Highest Score</h3>
                    </div>
                    <p className="text-4xl font-bold">{overview.highestScore}%</p>
                </motion.div>
            </div>

            {timeline.length === 0 ? (
                <motion.div variants={itemVariants} className="glass-card p-12 rounded-3xl border border-dashed border-white/10 text-center">
                    <Activity className="w-12 h-12 text-gray-700 mb-4 mx-auto" />
                    <p className="text-gray-500">Take your first exam to see your timeline and charts!</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Line Chart: Progress Over Time */}
                    <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5">
                        <h3 className="text-xl font-bold mb-6">Score Progression</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#ffffff40"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#ffffff40"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0b101c', borderColor: '#ffffff20', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#818cf8"
                                        strokeWidth={4}
                                        dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 8, fill: '#4f46e5' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Bar Chart: Subject Comparison */}
                    <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl border border-white/5">
                        <h3 className="text-xl font-bold mb-6">Subject Averages</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectPerformance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#ffffff40"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                                    />
                                    <YAxis
                                        stroke="#ffffff40"
                                        tick={{ fill: '#888', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0b101c', borderColor: '#ffffff20', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Bar
                                        dataKey="avgScore"
                                        fill="#34d399"
                                        radius={[6, 6, 0, 0]}
                                        barSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default Analytics;
