import { useState, useCallback } from 'react';

const useHistory = (initialState) => {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentState = history[currentIndex];

    const pushState = useCallback((newState) => {
        setHistory((prev) => {
            const newHistory = prev.slice(0, currentIndex + 1);
            // Limit history size to 50
            if (newHistory.length >= 50) {
                return [...newHistory.slice(1), newState];
            }
            return [...newHistory, newState];
        });
        setCurrentIndex((prev) => {
            const newHistoryLen = prev < 50 ? prev + 1 : 49; // Keep index at end if maxed?
            // Actually if we shifted history (slice(1)), current index shifts?
            // If we slice(1), index 50 becomes 49?
            // Wait.
            // If history had 50 items (0-49). Current is 49.
            // We add 1. New history has 51 items. We slice(1), so it has 50 items.
            // The old 0 is gone. The new 0 is old 1.
            // The new item is at 49.
            return prev < 49 ? prev + 1 : 49;
        });
    }, [currentIndex]);

    const undo = useCallback(() => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    }, []);

    const redo = useCallback(() => {
        setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
    }, [history.length]);

    const reset = useCallback((newState) => {
        setHistory([newState]);
        setCurrentIndex(0);
    }, []);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    return {
        state: currentState,
        pushState,
        undo,
        redo,
        reset,
        canUndo,
        canRedo
    };
};

export default useHistory;
