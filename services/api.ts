/// <reference types="vite/client" />
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export const loginUser = async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Login failed');
    }
    return res.json();
};

export const loginWithGoogle = async (credential?: string, access_token?: string) => {
    const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential ? { credential } : { access_token }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Google Login failed');
    }
    return res.json();
};

export const loginWithGithub = async (code: string) => {
    const res = await fetch(`${API_BASE}/auth/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'GitHub Login failed');
    }
    return res.json();
};

export const registerUser = async (userData: any) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Signup failed');
    }
    return res.json();
};

export const sendPasswordResetOtp = async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
    }
    return data;
};

export const resetPasswordWithOtp = async (payload: { email: string; otp: string; newPassword: string }) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
    }
    return data;
};

export const updatePassword = async (payload: any) => {
    const res = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
    }
    return data;
};

export const saveUserProfile = async (userId: string, profileData: any) => {
    const res = await fetch(`${API_BASE}/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    try {
        return await res.json();
    } catch (e) {
        return null;
    }
};

export const fetchUserProfile = async (userId: string) => {
    const res = await fetch(`${API_BASE}/profile/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
};

export const savePaper = async (paperData: any) => {
    const res = await fetch(`${API_BASE}/papers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paperData),
    });
    if (!res.ok) throw new Error('Failed to save paper');
    return res.json();
};

export const fetchHistory = async (userId: string) => {
    const res = await fetch(`${API_BASE}/papers/${userId}`);
    if (!res.ok) {
        if (res.status === 404) return []; // New users have no history
        throw new Error('Failed to fetch history');
    }
    try {
        return await res.json();
    } catch (e) {
        return [];
    }
};

export const generatePaper = async (formData: FormData) => {
    const res = await axios.post(`${API_BASE}/generate-paper`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

// =====================================
// SECURE TEST MODE APIs
// =====================================

export const startTest = async (payload: { user_id: string, paper_id: string, paper_json: any }) => {
    const res = await axios.post(`${API_BASE}/test/start`, payload);
    return res.data;
};

export const saveTestAnswer = async (payload: { attempt_id: number, answers: any[], selected_sets?: Record<number, 'A' | 'B' | null> }) => {
    const res = await axios.post(`${API_BASE}/test/save-answer`, payload);
    return res.data;
};

export const logTestEvent = async (payload: { user_id: string, paper_id: string, event_type: string }) => {
    const res = await axios.post(`${API_BASE}/test/log-event`, payload);
    return res.data;
};

export const submitTest = async (payload: { attempt_id: number, selected_sets?: Record<number, 'A' | 'B' | null>, strictness?: string }) => {
    const res = await axios.post(`${API_BASE}/test/submit`, payload);
    return res.data;
};

export const fetchTestResult = async (attemptId: string) => {
    const res = await axios.get(`${API_BASE}/test/result/${attemptId}`);
    return res.data;
};

export const fetchAnalytics = async (email: string) => {
    const res = await fetch(`${API_BASE}/analytics?userId=${encodeURIComponent(email)}`);
    if (!res.ok) {
        throw new Error('Failed to fetch analytics data');
    }
    return res.json();
};
