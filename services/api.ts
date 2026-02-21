import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

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

export const saveUserProfile = async (userId: string, profileData: any) => {
    const res = await fetch(`${API_BASE}/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
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
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
};

export const generatePaper = async (formData: FormData) => {
    const res = await axios.post(`${API_BASE}/generate-paper`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};
