import { useState, useCallback, useEffect } from 'react';
import type { IdeaCategory, MessageCategory } from '../types';

const MAX_LIMIT_PER_DAY = 10;

export const useLimiter = (category: IdeaCategory | MessageCategory, userId: string, limit: number = MAX_LIMIT_PER_DAY) => {
    const key = `beautyflow_usage_${userId}_${category}`;
    
    const getUsage = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem(key);
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) {
                return data.count;
            }
        }
        return 0; // No usage today
    }, [key]);

    const [usage, setUsage] = useState(getUsage);

    useEffect(() => {
        setUsage(getUsage());
    }, [getUsage, category, userId]);

    const recordUsage = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const currentCount = getUsage();
        if (currentCount < limit) {
            const newCount = currentCount + 1;
            localStorage.setItem(key, JSON.stringify({ date: today, count: newCount }));
            setUsage(newCount);
            return true;
        }
        return false;
    }, [getUsage, key, limit]);

    return { usage, recordUsage, isLimited: usage >= limit };
};
