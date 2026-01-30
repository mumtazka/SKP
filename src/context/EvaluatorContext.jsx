import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const EvaluatorContext = createContext();

export const useEvaluator = () => {
    const context = useContext(EvaluatorContext);
    if (!context) {
        throw new Error('useEvaluator must be used within EvaluatorProvider');
    }
    return context;
};

export const EvaluatorProvider = ({ children }) => {
    const { user } = useAuth();
    const [selectedEvaluatorId, setSelectedEvaluatorId] = useState(null);
    const [selectedEvaluator, setSelectedEvaluator] = useState(null);

    // Auto-select user jika role kepegawaian
    useEffect(() => {
        if (user?.role === 'kepegawaian') {
            setSelectedEvaluatorId(user.id);
            setSelectedEvaluator(user);
        }
    }, [user]);

    // Reset saat logout atau user berubah
    useEffect(() => {
        if (!user) {
            setSelectedEvaluatorId(null);
            setSelectedEvaluator(null);
        }
    }, [user]);

    const value = {
        selectedEvaluatorId,
        selectedEvaluator,
        setSelectedEvaluatorId,
        setSelectedEvaluator,
    };

    return (
        <EvaluatorContext.Provider value={value}>
            {children}
        </EvaluatorContext.Provider>
    );
};

export default EvaluatorContext;
