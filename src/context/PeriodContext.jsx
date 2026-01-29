import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';

const PeriodContext = createContext(null);

// Format date to Indonesian locale
const formatDateId = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const resolveAutoPeriod = (type) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    if (type === 'auto_quarter') {
        let label = '';
        let start = '';
        let end = '';

        if (month < 3) {
            label = `Kuartal 1 (Otomatis)`;
            start = `${year}-01-01`;
            end = `${year}-03-31`;
        } else if (month < 6) {
            label = `Kuartal 2 (Otomatis)`;
            start = `${year}-04-01`;
            end = `${year}-06-30`;
        } else if (month < 9) {
            label = `Kuartal 3 (Otomatis)`;
            start = `${year}-07-01`;
            end = `${year}-09-30`;
        } else {
            label = `Kuartal 4 (Otomatis)`;
            start = `${year}-10-01`;
            end = `${year}-12-31`;
        }
        return { startDate: start, endDate: end, activeLabel: label, year };
    }

    if (type === 'auto_semester') {
        let label = '';
        let start = '';
        let end = '';

        if (month < 6) {
            label = `Semester 1 (Otomatis)`;
            start = `${year}-01-01`;
            end = `${year}-06-30`;
        } else {
            label = `Semester 2 (Otomatis)`;
            start = `${year}-07-01`;
            end = `${year}-12-31`;
        }
        return { startDate: start, endDate: end, activeLabel: label, year };
    }

    // For annual auto, it's just current year
    if (type === 'auto_annual') {
        return {
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            activeLabel: `Tahunan ${year} (Otomatis)`,
            year
        };
    }

    return null;
};

export const PeriodProvider = ({ children }) => {
    const [periodConfig, setPeriodConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPeriodConfig();
    }, []);

    const loadPeriodConfig = async () => {
        try {
            // Config from DB
            const config = await api.settings.getPeriodConfig();

            // Check if it's an auto type
            const autoResolved = resolveAutoPeriod(config.type);

            if (autoResolved) {
                // Merge resolved values but keep original type so admin sees "Auto" selected
                setPeriodConfig({
                    ...config,
                    ...autoResolved
                });
            } else {
                setPeriodConfig(config);
            }
        } catch (error) {
            console.error('Failed to load period config:', error);
            // Fallback to default
            const year = new Date().getFullYear();
            setPeriodConfig({
                type: 'annual',
                year,
                startDate: `${year}-01-01`,
                endDate: `${year}-12-31`
            });
        } finally {
            setLoading(false);
        }
    };

    const updatePeriodConfig = async (newConfig) => {
        try {
            await api.settings.setPeriodConfig(newConfig);
            // Reload to apply auto-resolution logic if needed
            await loadPeriodConfig();
            return true;
        } catch (error) {
            console.error('Failed to update period config:', error);
            return false;
        }
    };

    // Generate period label string
    const periodLabel = periodConfig
        ? periodConfig.activeLabel || `${formatDateId(periodConfig.startDate)} - ${formatDateId(periodConfig.endDate)}`
        : '';

    const value = {
        periodConfig,
        periodLabel,
        loading,
        updatePeriodConfig,
        refreshPeriod: loadPeriodConfig
    };

    return (
        <PeriodContext.Provider value={value}>
            {children}
        </PeriodContext.Provider>
    );
};

export const usePeriod = () => {
    const context = useContext(PeriodContext);
    if (!context) {
        throw new Error('usePeriod must be used within a PeriodProvider');
    }
    return context;
};

export default PeriodContext;
