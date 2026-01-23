// src/hooks/useSkpDraft.js
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const STORAGE_KEY_PREFIX = 'skp_draft_';

export const useSkpDraft = (initialData) => {
    const { user } = useAuth();
    const [data, setData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Initial Load
    useEffect(() => {
        if (!user) return;
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + user.id);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData(parsed);
                toast.info("Draft restored from last session");
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        } else {
            // If no draft, ensure we have the structure but don't overwrite if initialData provided meaningful defaults?
            // Actually initialData usually has structure.
            setData(initialData);
        }
    }, [user]);

    // Save Logic
    const saveToStorage = useCallback(
        debounce((dataToSave, userId) => {
            if (!userId) return;
            localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(dataToSave));
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
            saveToStorage(newData, user?.id);
            return newData;
        });
    };

    const clearDraft = () => {
        if (user) {
            localStorage.removeItem(STORAGE_KEY_PREFIX + user.id);
        }
    };

    return {
        data,
        updateSection,
        isSaving,
        lastSaved,
        clearDraft,
        setData
    };
};
