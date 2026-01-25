import React from 'react';
import { cn } from '@/lib/utils';

const ProgressBar = ({ value, max = 100, className }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={cn("h-2 w-full bg-gray-100 rounded-full overflow-hidden", className)}>
            <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

export default ProgressBar;
