import React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, icon: Icon, type, ...props }, ref) => {
    return (
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Icon className="h-5 w-5" />
                </div>
            )}
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    Icon ? "pl-10" : "",
                    className
                )}
                ref={ref}
                {...props}
            />
        </div>
    );
});
Input.displayName = "Input";

export { Input };
