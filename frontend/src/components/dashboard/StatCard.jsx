import React from 'react';
import { Card, CardContent } from '@/components/ui/card'; // We don't have this yet, let's make a simple one or separate file
import { cn } from '@/lib/utils';
// Inline Card for simplicity since we avoided full shadcn install to keep it clean/manual
const SimpleCard = ({ children, className }) => <div className={cn("bg-white rounded-xl border border-gray-100 shadow-sm", className)}>{children}</div>;

const StatCard = ({ title, value, icon: Icon, description, trend, trendUp, color = "primary" }) => {
    const colorMap = {
        primary: "bg-purple-50 text-purple-600",
        success: "bg-green-50 text-green-600",
        warning: "bg-yellow-50 text-yellow-600",
        danger: "bg-red-50 text-red-600",
        info: "bg-blue-50 text-blue-600"
    };

    return (
        <SimpleCard className="p-6 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mt-1">
                        {value}
                    </h3>
                </div>
                <div className={cn("p-3 rounded-xl", colorMap[color])}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {description && (
                <div className="mt-4 flex items-center text-sm">
                    {trend && (
                        <span className={cn("font-medium mr-2", trendUp ? "text-green-600" : "text-red-600")}>
                            {trendUp ? "+" : ""}{trend}
                        </span>
                    )}
                    <span className="text-gray-400">{description}</span>
                </div>
            )}
        </SimpleCard>
    );
};

export default StatCard;
