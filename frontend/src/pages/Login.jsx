import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { User, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                navigate('/dashboard');
            }
        } catch (err) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white overflow-hidden">
            {/* Left Side - Form */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-24 relative z-10 bg-white">
                <div className="absolute top-10 left-10 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg text-gray-800 tracking-tight">System logo</span>
                </div>

                <div className="mb-10 mt-16 lg:mt-0">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Welcome to login system</h1>
                    <p className="text-gray-400 text-sm">Sign in by entering the information below</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="relative group">
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${username ? 'text-primary' : 'text-gray-400'}`}>
                                <User size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-purple-50/50 border-none text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all pl-12 pr-4 py-4 placeholder-gray-400"
                                required
                            />
                        </div>

                        <div className="relative group">
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${password ? 'text-primary' : 'text-gray-400'}`}>
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-purple-50/50 border-none text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all pl-12 pr-12 py-4 placeholder-gray-400"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer select-none">Remember me</label>
                        </div>
                        <a href="#" className="text-xs text-gray-400 hover:text-primary transition-colors">Forgot Password?</a>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary hover:bg-purple-700 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-purple-500/30 transition-all transform active:scale-[0.98] text-sm"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="text-sm text-gray-500 font-medium px-2">
                            <span className="sr-only">Or</span>
                        </div>

                        <button
                            type="button"
                            className="bg-transparent hover:bg-gray-50 text-gray-500 font-medium py-3.5 px-6 rounded-xl border border-transparent hover:border-gray-200 transition-colors text-sm"
                        >
                            Sign up
                        </button>
                    </div>
                </form>
            </div>

            {/* Right Side - Unique Curve & Illustration */}
            <div className="hidden lg:flex flex-1 relative bg-white items-center justify-center">
                {/* The Purple Layout with Curve */}
                <div className="absolute top-0 bottom-0 right-0 w-[95%] bg-primary rounded-l-[80px] overflow-hidden">

                    {/* Decorative Circles */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-purple-900/40 to-transparent"></div>

                    {/* Content Container */}
                    <div className="relative w-full h-full flex items-center justify-center p-12">
                        {/* 3D Illustration: Doc Stack Repurposed */}
                        <div className="relative z-10 w-full max-w-md aspect-square transform hover:scale-105 transition-transform duration-500">
                            <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                                <defs>
                                    <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FFFFFF" />
                                        <stop offset="100%" stopColor="#E9D5FF" />
                                    </linearGradient>
                                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="10" dy="10" stdDeviation="5" floodOpacity="0.2" />
                                    </filter>
                                </defs>

                                {/* Document 1 (Bottom) */}
                                <g transform="translate(100, 150) rotate(-10)">
                                    <rect x="0" y="0" width="200" height="260" rx="10" fill="#F3E8FF" filter="url(#shadow)" />
                                    <rect x="20" y="30" width="160" height="10" rx="2" fill="#D8B4FE" />
                                    <rect x="20" y="60" width="120" height="8" rx="2" fill="#E9D5FF" />
                                    <rect x="20" y="80" width="160" height="8" rx="2" fill="#E9D5FF" />
                                </g>

                                {/* Document 2 (Middle) */}
                                <g transform="translate(80, 100) rotate(-5)">
                                    <rect x="0" y="0" width="200" height="260" rx="10" fill="#F3E8FF" filter="url(#shadow)" />
                                    <rect x="20" y="30" width="160" height="10" rx="2" fill="#D8B4FE" />
                                    <rect x="20" y="60" width="100" height="8" rx="2" fill="#E9D5FF" />
                                    <rect x="20" y="80" width="160" height="8" rx="2" fill="#E9D5FF" />
                                </g>

                                {/* Document 3 (Top) */}
                                <g transform="translate(60, 50)">
                                    <rect x="0" y="0" width="200" height="260" rx="10" fill="url(#docGrad)" filter="url(#shadow)" stroke="#FFFFFF" strokeWidth="2" />
                                    <rect x="180" y="20" width="5" height="40" fill="#FBBF24" rx="2" />
                                    <rect x="30" y="40" width="100" height="12" rx="3" fill="#7C3AED" fillOpacity="0.8" />
                                    <rect x="30" y="80" width="140" height="8" rx="2" fill="#CBD5E1" />
                                    <rect x="30" y="100" width="140" height="8" rx="2" fill="#CBD5E1" />
                                    <rect x="30" y="120" width="100" height="8" rx="2" fill="#CBD5E1" />
                                    <circle cx="160" cy="200" r="25" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="2" />
                                    <path d="M148 200 L156 208 L172 192" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <rect x="30" y="160" width="140" height="8" rx="2" fill="#CBD5E1" />
                                    <rect x="30" y="180" width="80" height="8" rx="2" fill="#CBD5E1" />
                                </g>

                                {/* Floating elements */}
                                <circle cx="320" cy="80" r="10" fill="#FBBF24" fillOpacity="0.8" />
                                <rect x="40" y="300" width="20" height="20" rx="4" fill="#7C3AED" transform="rotate(20)" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
