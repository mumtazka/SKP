// src/hooks/useSkpDraft.js
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const STORAGE_KEY_PREFIX = 'skp_draft_';

export const useSkpDraft = (initialData, targetUserId = null, uniqueKey = '') => {
    const { user } = useAuth();
    const effectiveUserId = targetUserId || user?.id;

    const [data, setData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Initial Load
    useEffect(() => {
        if (!effectiveUserId) return;
        const keySuffix = uniqueKey ? `_${uniqueKey}` : '';
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + effectiveUserId + keySuffix);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData(parsed);
                // toast.info("Draft restored from last session");
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        } else {
            setData(initialData);
        }
    }, [effectiveUserId, uniqueKey, initialData]);

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
            saveToStorage(newData, effectiveUserId, uniqueKey);
            return newData;
        });
    };

    const clearDraft = () => {
        if (effectiveUserId) {
            const keySuffix = uniqueKey ? `_${uniqueKey}` : '';
            localStorage.removeItem(STORAGE_KEY_PREFIX + effectiveUserId + keySuffix);
            setData(initialData);
        }
    };

    // Auto-save effect (trigger on data change)
    useEffect(() => {
        if (data && effectiveUserId) {
            // Check if data is different from initial? Maybe not needed as debounce handles it.
            // But we need to ensure we don't overwrite with initial on mount.
            // The initial load happens in the first effect.
            // This effect runs on data change.
            // Ideally should check if data !== initialData or similar.
            setIsSaving(true);
            saveToStorage(data, effectiveUserId, uniqueKey);
        }
    }, [data, effectiveUserId, uniqueKey, saveToStorage]);

    return {
        data,
        updateSection,
        isSaving,
        lastSaved,
        clearDraft,
        setData
    };
};
