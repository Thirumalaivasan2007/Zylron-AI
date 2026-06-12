// useRecall.js — Silent Telemetry Hook (OS-Level Recall)
// Import this in App.jsx and it silently tracks all user actions
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const logEvent = async (actionType, metadata = {}) => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user?.token) return; // Only track logged-in users
        await api.post('/recall', { actionType, metadata });
    } catch {
        // Silently fail — never break UX
    }
};

export const useRecall = () => {
    const location = useLocation();

    // Track Page Views automatically on route change
    useEffect(() => {
        logEvent('PAGE_VIEW', { page: location.pathname });
    }, [location.pathname]);

    // Return a tracker function for manual events
    const track = useCallback((actionType, metadata = {}) => {
        logEvent(actionType, metadata);
    }, []);

    return { track };
};

export default useRecall;
