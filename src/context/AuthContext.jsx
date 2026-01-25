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
                if (session && session.exp > Date.now()) {
                    setUser(session.user);
                } else if (session) {
                    // Token expired
                    api.auth.logout();
                }
            } catch (error) {
                console.error("Session restoration failed", error);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (username, password) => {
        try {
            const { user: loggedInUser } = await api.auth.login(username, password);
            setUser(loggedInUser);
            toast.success(`Welcome back, ${loggedInUser.fullName}`);
            return true;
        } catch (error) {
            toast.error(error.message || "Login failed");
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

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
