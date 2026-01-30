import React from 'react';

export const Logo = ({ className, size = 40, showText = true, textClassName = "" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-md"
                >
                    <defs>
                        <linearGradient id="logo_grad_1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#8b5cf6" /> {/* violet-500 */}
                            <stop offset="100%" stopColor="#6d28d9" /> {/* violet-700 */}
                        </linearGradient>
                        <linearGradient id="logo_grad_2" x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#a78bfa" /> {/* violet-400 */}
                            <stop offset="100%" stopColor="#7c3aed" /> {/* violet-600 */}
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Abstract Hexagon/Stack Shape */}
                    <path
                        d="M20 2L36 11V29L20 38L4 29V11L20 2Z"
                        fill="url(#logo_grad_1)"
                        opacity="0.2"
                    />

                    {/* Stylized 'S' / Dynamic Curve components */}
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M20 8C13.3726 8 8 13.3726 8 20C8 26.6274 13.3726 32 20 32C26.6274 32 32 26.6274 32 20C32 13.3726 26.6274 8 20 8ZM11 20C11 15.0294 15.0294 11 20 11V20H29C29 24.9706 24.9706 29 20 29C15.0294 29 11 24.9706 11 20Z"
                        fill="url(#logo_grad_2)"
                    />
                    <path
                        d="M20 11L29 20H20V11Z"
                        fill="#ddd6fe"
                    />
                </svg>
            </div>

            {showText && (
                <div className={`flex flex-col ${textClassName}`}>
                    <span className="font-bold text-xl tracking-tight leading-none text-gray-900 font-display">
                        SKP
                    </span>
                    <span className="text-[9px] font-bold text-primary tracking-[0.2em] uppercase mt-0.5">
                        E-Kinerja
                    </span>
                </div>
            )}
        </div>
    );
};
