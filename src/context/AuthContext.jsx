import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = () => {
            try {
                const session = api.auth.getSession();
                if (session && session.token) {
                    const decoded = JSON.parse(atob(session.token));
                    if (decoded.exp > Date.now()) {
                        setUser(session.user);
                    } else {
                        // Token expired
                        api.auth.logout();
                    }
                }
            } catch (error) {
                console.error("Session restoration failed", error);
                api.auth.logout();
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (username, password, rememberMe = false) => {
        try {
            const { user: loggedInUser } = await api.auth.login(username, password, rememberMe);
            setUser(loggedInUser);
            toast.success(`Welcome back, ${loggedInUser.fullName}`);
            return true;
        } catch (error) {
            toast.error(error.message || "Login failed");
            return false;
        }
    };

    const register = async (userData) => {
        try {
            await api.users.create(userData);

            // Auto login after registration
            const success = await login(userData.username, userData.password);
            if (success) {
                toast.success("Account created successfully!");
                return true;
            }
            return false;
        } catch (error) {
            toast.error(error.message || "Registration failed");
            return false;
        }
    };

    const logout = async () => {
        await api.auth.logout();
        setUser(null);
        toast.info("Logged out successfully");
    };

    const hasRole = (requiredRoles) => {
        if (!user) return false;
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(user.role);
        }
        return user.role === requiredRoles;
    };

    // Refresh user profile (useful after profile updates)
    const refreshProfile = async () => {
        if (!user?.id) return;

        try {
            const updatedUser = await api.users.getById(user.id);
            if (updatedUser) {
                setUser(updatedUser);
                // Update session storage
                const session = api.auth.getSession();
                if (session) {
                    session.user = updatedUser;
                    const storage = localStorage.getItem('skp_session') ? localStorage : sessionStorage;
                    storage.setItem('skp_session', JSON.stringify(session));
                }
            }
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            loading,
            hasRole,
            refreshProfile,
            setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
