import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { User, Lock, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('dosen'); // Default role

    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegister) {
                if (password !== confirmPassword) {
                    toast.error("Passwords do not match");
                    setLoading(false);
                    return;
                }

                const success = await register({
                    username,
                    password,
                    email,
                    fullName,
                    role
                });

                if (success) {
                    navigate('/dashboard');
                }
            } else {
                const success = await login(username, password, rememberMe);
                if (success) {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            // Error handled in context or here
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        // Reset sensitive fields
        setPassword('');
        setConfirmPassword('');
    };

    // Animation variants
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: {
            opacity: 1,
            height: "auto",
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
                duration: 0.3
            }
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                duration: 0.2, // Faster exit
                staggerChildren: 0.02
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        },
        exit: {
            opacity: 0,
            x: 20,
            transition: { duration: 0.2 }
        }
    };

    const titleVariants = {
        hidden: { opacity: 0, y: -20, position: 'absolute' },
        visible: {
            opacity: 1,
            y: 0,
            position: 'relative',
            transition: { duration: 0.3, ease: 'easeOut' }
        },
        exit: {
            opacity: 0,
            y: 20,
            position: 'absolute',
            transition: { duration: 0.2, ease: 'easeIn' }
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white overflow-hidden">
            {/* Left Side - Form */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-24 relative z-10 bg-white">
                <div className="absolute top-8 left-8 sm:top-10 sm:left-10">
                    <Logo size={48} />
                </div>

                <div className="mb-8 mt-16 lg:mt-0 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isRegister ? 'register-title' : 'login-title'}
                            variants={titleVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                                {isRegister ? 'Create an Account' : 'Welcome Back'}
                            </h1>
                            <p className="text-gray-400 text-sm">
                                {isRegister ? 'Enter your details to register' : 'Sign in by entering the information below'}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isRegister ? 'register-form' : 'login-form'}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-4"
                        >
                            {isRegister && (
                                <>
                                    <motion.div variants={itemVariants} className="relative group">
                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fullName ? 'text-primary' : 'text-gray-400'}`}>
                                            <User size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-purple-50/50 border-none text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all pl-12 pr-4 py-4 placeholder-gray-400"
                                            required
                                        />
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="relative group">
                                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${email ? 'text-primary' : 'text-gray-400'}`}>
                                            <Mail size={20} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-purple-50/50 border-none text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all pl-12 pr-4 py-4 placeholder-gray-400"
                                            required
                                        />
                                    </motion.div>
                                </>
                            )}

                            <motion.div variants={itemVariants} className="relative group">
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
                            </motion.div>

                            <motion.div variants={itemVariants} className="relative group">
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
                            </motion.div>

                            {isRegister && (
                                <motion.div variants={itemVariants} className="relative group">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${confirmPassword ? 'text-primary' : 'text-gray-400'}`}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-purple-50/50 border-none text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all pl-12 pr-4 py-4 placeholder-gray-400"
                                        required
                                    />
                                </motion.div>
                            )}

                            {!isRegister && (
                                <motion.div variants={itemVariants} className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="remember"
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                                        />
                                        <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer select-none">Remember me</label>
                                    </div>
                                    <a href="#" className="text-xs text-gray-400 hover:text-primary transition-colors">Forgot Password?</a>
                                </motion.div>
                            )}

                            <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4">
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-primary hover:bg-purple-700 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-purple-500/30 transition-all text-sm"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (isRegister ? 'Creating Account...' : 'Logging in...') : (isRegister ? 'Sign Up' : 'Login')}
                                </motion.button>

                                <div className="text-center px-2">
                                    <span className="text-sm text-gray-500 font-medium">or</span>
                                </div>

                                <motion.button
                                    type="button"
                                    onClick={toggleMode}
                                    className="bg-transparent hover:bg-gray-50 text-gray-500 font-medium py-3.5 px-6 rounded-xl border border-transparent hover:border-gray-200 transition-colors text-sm whitespace-nowrap"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isRegister ? 'Back to Login' : 'Sign up'}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </form>
            </div >

            {/* Right Side - Unique Curve & Illustration */}
            < div className="hidden lg:flex flex-1 relative bg-white items-center justify-center" >
                {/* The Purple Layout with Curve */}
                < motion.div
                    className="absolute top-0 bottom-0 right-0 w-[95%] bg-primary rounded-l-[80px] overflow-hidden"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >

                    {/* Decorative Circles */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-purple-900/40 to-transparent"></div>

                    {/* Content Container */}
                    <div className="relative w-full h-full flex items-center justify-center p-12">
                        {/* 3D Illustration: Doc Stack Repurposed */}
                        <motion.div
                            className="relative z-10 w-full max-w-md aspect-square"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                        >
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
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
