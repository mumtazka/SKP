import { INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_SKPS } from '@/utils/mockData';

const COLLECTION_KEYS = {
    USERS: 'skp_users',
    SKPS: 'skp_skps',
    DEPARTMENTS: 'skp_departments',
    SESSION: 'skp_session'
};

// Initialize Mock Data if empty
const initializeData = () => {
    if (!localStorage.getItem(COLLECTION_KEYS.USERS)) {
        localStorage.setItem(COLLECTION_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(COLLECTION_KEYS.SKPS)) {
        localStorage.setItem(COLLECTION_KEYS.SKPS, JSON.stringify(INITIAL_SKPS));
    }
    if (!localStorage.getItem(COLLECTION_KEYS.DEPARTMENTS)) {
        localStorage.setItem(COLLECTION_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    }
};

initializeData();

const getCollection = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const setCollection = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
    auth: {
        login: async (username, password) => {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
            const users = getCollection(COLLECTION_KEYS.USERS);
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                if (!user.status) throw new Error("Account is inactive");
                const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 }));
                const sessionUser = { ...user };
                delete sessionUser.password;
                localStorage.setItem(COLLECTION_KEYS.SESSION, JSON.stringify({ token, user: sessionUser }));
                return { token, user: sessionUser };
            }
            throw new Error("Invalid credentials");
        },
        logout: async () => {
            localStorage.removeItem(COLLECTION_KEYS.SESSION);
        },
        getSession: () => {
            const session = localStorage.getItem(COLLECTION_KEYS.SESSION);
            return session ? JSON.parse(session) : null;
        }
    },

    users: {
        getAll: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return getCollection(COLLECTION_KEYS.USERS).map(u => {
                const { password, ...rest } = u;
                return rest;
            });
        },
        create: async (userData) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getCollection(COLLECTION_KEYS.USERS);
            if (users.find(u => u.username === userData.username)) throw new Error("Username already exists");

            const newUser = {
                ...userData,
                id: 'u' + Date.now(),
                createdAt: new Date().toISOString(),
                photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=random&color=fff`
            };
            users.push(newUser);
            setCollection(COLLECTION_KEYS.USERS, users);
            return newUser;
        },
        update: async (id, updates) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getCollection(COLLECTION_KEYS.USERS);
            const index = users.findIndex(u => u.id === id);
            if (index === -1) throw new Error("User not found");

            users[index] = { ...users[index], ...updates };
            setCollection(COLLECTION_KEYS.USERS, users);
            const { password, ...rest } = users[index];
            return rest;
        },
        delete: async (id) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            let users = getCollection(COLLECTION_KEYS.USERS);
            users = users.filter(u => u.id !== id);
            setCollection(COLLECTION_KEYS.USERS, users);
            return true;
        }
    },

    skps: {
        getByUser: async (userId) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const skps = getCollection(COLLECTION_KEYS.SKPS);
            if (userId) return skps.filter(s => s.userId === userId);
            return skps;
        },
        getAll: async () => { // For admin/HR
            await new Promise(resolve => setTimeout(resolve, 500));
            return getCollection(COLLECTION_KEYS.SKPS);
        },
        create: async (skpData) => {
            await new Promise(resolve => setTimeout(resolve, 600));
            const skps = getCollection(COLLECTION_KEYS.SKPS);
            const newSkp = {
                ...skpData,
                id: 's' + Date.now(),
                createdAt: new Date().toISOString(),
                status: 'Pending',
                progress: 0
            };
            skps.push(newSkp);
            setCollection(COLLECTION_KEYS.SKPS, skps);
            return newSkp;
        },
        update: async (id, updates) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const skps = getCollection(COLLECTION_KEYS.SKPS);
            const index = skps.findIndex(s => s.id === id);
            if (index === -1) throw new Error("SKP not found");

            skps[index] = { ...skps[index], ...updates, updatedAt: new Date().toISOString() };
            setCollection(COLLECTION_KEYS.SKPS, skps);
            return skps[index];
        }
    },

    departments: {
        getAll: async () => {
            return getCollection(COLLECTION_KEYS.DEPARTMENTS);
        }
    }
};
