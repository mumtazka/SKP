import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
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
        <div className="min-h-screen w-full flex bg-background">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10 bg-white">
                <div className="absolute top-8 left-8 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">S</div>
                    <span className="font-bold text-xl tracking-tight">SKP System</span>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to login system</h1>
                    <p className="text-gray-500">Enter your account details</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <Input
                                icon={User}
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <Input
                                    icon={Lock}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600">Remember password</label>
                        </div>
                    </div>

                    <Button
                        variant="gradient"
                        className="w-full py-6 text-lg shadow-lg shadow-purple-500/30"
                        isLoading={loading}
                        type="submit"
                    >
                        Login
                    </Button>

                    <div className="text-center text-sm text-gray-500">
                        Don't have an account?
                        <a href="#" className="ml-1 text-primary hover:underline font-medium">Sign up</a>
                    </div>
                </form>
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-purple-600 to-indigo-600 relative overflow-hidden items-center justify-center p-12">
                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-900/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

                {/* Main Illustration Container */}
                <div className="relative z-10 w-full max-w-lg aspect-square">
                    {/* Custom SVG Illustration: Stack of 3D Documents */}
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

                            {/* Golden Accent */}
                            <rect x="180" y="20" width="5" height="40" fill="#FBBF24" rx="2" />

                            {/* Content Lines */}
                            <rect x="30" y="40" width="100" height="12" rx="3" fill="#7C3AED" fillOpacity="0.8" />
                            <rect x="30" y="80" width="140" height="8" rx="2" fill="#CBD5E1" />
                            <rect x="30" y="100" width="140" height="8" rx="2" fill="#CBD5E1" />
                            <rect x="30" y="120" width="100" height="8" rx="2" fill="#CBD5E1" />

                            {/* Checkmarks / Approval Stamps */}
                            <circle cx="160" cy="200" r="25" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="2" />
                            <path d="M148 200 L156 208 L172 192" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {/* More lines */}
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
    );
};

export default Login;
