// src/hooks/useSkpDraft.js
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const STORAGE_KEY_PREFIX = 'skp_draft_';

export const useSkpDraft = (initialData, uniqueKey = '') => {
    const { user } = useAuth();
    const [data, setData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Initial Load
    useEffect(() => {
        if (!user) return;
        const keySuffix = uniqueKey ? `_${uniqueKey}` : '';
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + user.id + keySuffix);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData(parsed);
                // toast.info("Draft restored from last session"); // Optional: Removed to reduce noise or keep it
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        } else {
            setData(initialData);
        }
    }, [user, uniqueKey, initialData]);

    // Save Logic
    const saveToStorage = useCallback(
        debounce((dataToSave, userId, uKey) => {
            if (!userId) return;
            const keySuffix = uKey ? `_${uKey}` : '';
            localStorage.setItem(STORAGE_KEY_PREFIX + userId + keySuffix, JSON.stringify(dataToSave));
            setLastSaved(new Date());
            setIsSaving(false);
        }, 1500),
        []
    );

    const updateSection = (sectionKey, updateFn) => {
        setIsSaving(true);
        setData(prev => {
            const newData = {
                ...prev,
                [sectionKey]: updateFn(prev[sectionKey])
            };
            saveToStorage(newData, user?.id, uniqueKey);
            return newData;
        });
    };

    const clearDraft = () => {
        if (user) {
            const keySuffix = uniqueKey ? `_${uniqueKey}` : '';
            localStorage.removeItem(STORAGE_KEY_PREFIX + user.id + keySuffix);
            setData(initialData); // Reset data to initial state
        }
    };

    // Auto-save effect
    useEffect(() => {
        if (data && user) {
            setIsSaving(true);
            saveToStorage(data, user.id, uniqueKey);
        }
    }, [data, user, uniqueKey, saveToStorage]);

    return {
        data,
        updateSection,
        isSaving,
        lastSaved,
        clearDraft,
        setData
    };
};
