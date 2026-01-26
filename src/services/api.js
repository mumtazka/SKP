import { INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_SKPS, INITIAL_STUDY_PROGRAMS } from '@/utils/mockData';

const COLLECTION_KEYS = {
    USERS: 'skp_users',
    SKPS: 'skp_skps',
    DEPARTMENTS: 'skp_departments',
    STUDY_PROGRAMS: 'skp_study_programs',
    SESSION: 'skp_session',
    NOTIFICATIONS: 'skp_notifications',
    VERSION: 'skp_data_version'
};

const CURRENT_DATA_VERSION = 'v4'; // Increment this to force refresh mock data

// Initialize Mock Data if empty or version mismatch
const initializeData = () => {
    const savedVersion = localStorage.getItem(COLLECTION_KEYS.VERSION);

    if (savedVersion !== CURRENT_DATA_VERSION) {
        // Force refresh if version changed
        localStorage.setItem(COLLECTION_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        localStorage.setItem(COLLECTION_KEYS.SKPS, JSON.stringify(INITIAL_SKPS));
        localStorage.setItem(COLLECTION_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
        localStorage.setItem(COLLECTION_KEYS.STUDY_PROGRAMS, JSON.stringify(INITIAL_STUDY_PROGRAMS));
        localStorage.setItem(COLLECTION_KEYS.VERSION, CURRENT_DATA_VERSION);
        console.log(`[API] Data refreshed to version ${CURRENT_DATA_VERSION}`);
    } else {
        if (!localStorage.getItem(COLLECTION_KEYS.USERS)) {
            localStorage.setItem(COLLECTION_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        } else {
            // Ensure all existing users have raters field (backward compatibility)
            const users = JSON.parse(localStorage.getItem(COLLECTION_KEYS.USERS));
            let updated = false;
            const updatedUsers = users.map(user => {
                if (user.role === 'dosen' && !user.hasOwnProperty('raters')) {
                    console.log(`[API] Adding raters field to user: ${user.fullName}`);
                    updated = true;
                    return { ...user, raters: null };
                }
                return user;
            });
            if (updated) {
                localStorage.setItem(COLLECTION_KEYS.USERS, JSON.stringify(updatedUsers));
                console.log('[API] Users updated with raters field');
            }
        }
        if (!localStorage.getItem(COLLECTION_KEYS.SKPS)) {
            localStorage.setItem(COLLECTION_KEYS.SKPS, JSON.stringify(INITIAL_SKPS));
        }
        if (!localStorage.getItem(COLLECTION_KEYS.DEPARTMENTS)) {
            localStorage.setItem(COLLECTION_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
        }
        if (!localStorage.getItem(COLLECTION_KEYS.STUDY_PROGRAMS)) {
            localStorage.setItem(COLLECTION_KEYS.STUDY_PROGRAMS, JSON.stringify(INITIAL_STUDY_PROGRAMS));
        }
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

// Helper to get department name by ID
const getDepartmentName = (departmentId) => {
    const departments = getCollection(COLLECTION_KEYS.DEPARTMENTS);
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : null;
};

// Helper to get study program name by ID
const getStudyProgramName = (studyProgramId) => {
    const programs = getCollection(COLLECTION_KEYS.STUDY_PROGRAMS);
    const prog = programs.find(p => p.id === studyProgramId);
    return prog ? prog.name : null;
};

export const api = {
    notifications: {
        getAll: async (userId, role) => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const notes = getCollection(COLLECTION_KEYS.NOTIFICATIONS);
            // Return notifications for this specific user OR targeted to their role
            return notes.filter(n =>
                n.targetUserId === userId ||
                (n.targetRole && role === n.targetRole)
            ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },
        create: async (notification) => {
            const notes = getCollection(COLLECTION_KEYS.NOTIFICATIONS);
            const newNote = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                read: false,
                createdAt: new Date().toISOString(),
                ...notification
            };
            setCollection(COLLECTION_KEYS.NOTIFICATIONS, [...notes, newNote]);
            return newNote;
        },
        markAsRead: async (notificationId) => {
            const notes = getCollection(COLLECTION_KEYS.NOTIFICATIONS);
            const updated = notes.map(n => n.id === notificationId ? { ...n, read: true } : n);
            setCollection(COLLECTION_KEYS.NOTIFICATIONS, updated);
        },
        getUnreadCount: async (userId, role) => {
            const notes = getCollection(COLLECTION_KEYS.NOTIFICATIONS);
            return notes.filter(n =>
                (n.targetUserId === userId || (n.targetRole && role === n.targetRole)) &&
                !n.read
            ).length;
        },
        delete: async (notificationId) => {
            const notes = getCollection(COLLECTION_KEYS.NOTIFICATIONS);
            const filtered = notes.filter(n => n.id !== notificationId);
            setCollection(COLLECTION_KEYS.NOTIFICATIONS, filtered);
        },
        deleteAll: async (userId, role) => {
            const notes = getCollection(COLLECTION_KEYS.NOTIFICATIONS);
            const remaining = notes.filter(n =>
                n.targetUserId !== userId &&
                (!n.targetRole || role !== n.targetRole)
            );
            setCollection(COLLECTION_KEYS.NOTIFICATIONS, remaining);
        }
    },

    auth: {
        login: async (username, password, rememberMe = false) => {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
            const users = getCollection(COLLECTION_KEYS.USERS);
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                if (!user.status) throw new Error("Account is inactive");

                const expiry = Date.now() + 86400000; // 24 hours
                const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: expiry }));
                const sessionUser = { ...user };
                delete sessionUser.password;

                // Add resolved department and study program names
                sessionUser.departmentName = getDepartmentName(user.departmentId);
                sessionUser.studyProgramName = getStudyProgramName(user.studyProgramId);

                const sessionData = { token, user: sessionUser, exp: expiry };

                if (rememberMe) {
                    localStorage.setItem(COLLECTION_KEYS.SESSION, JSON.stringify(sessionData));
                    sessionStorage.removeItem(COLLECTION_KEYS.SESSION);
                } else {
                    sessionStorage.setItem(COLLECTION_KEYS.SESSION, JSON.stringify(sessionData));
                    localStorage.removeItem(COLLECTION_KEYS.SESSION);
                }

                return { token, user: sessionUser };
            }
            throw new Error("Invalid credentials");
        },
        logout: async () => {
            localStorage.removeItem(COLLECTION_KEYS.SESSION);
            sessionStorage.removeItem(COLLECTION_KEYS.SESSION);
        },
        getSession: () => {
            const session = sessionStorage.getItem(COLLECTION_KEYS.SESSION) || localStorage.getItem(COLLECTION_KEYS.SESSION);
            return session ? JSON.parse(session) : null;
        },
        updateProfile: async (userId, updates) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getCollection(COLLECTION_KEYS.USERS);
            const index = users.findIndex(u => u.id === userId);
            if (index === -1) throw new Error("User not found");

            // Only allow updating certain fields
            const allowedUpdates = ['email', 'phoneNumber', 'address', 'photo'];
            const filteredUpdates = {};
            for (const key of allowedUpdates) {
                if (updates[key] !== undefined) {
                    filteredUpdates[key] = updates[key];
                }
            }
            filteredUpdates.updatedAt = new Date().toISOString();

            users[index] = { ...users[index], ...filteredUpdates };
            setCollection(COLLECTION_KEYS.USERS, users);

            // Update session
            const session = JSON.parse(localStorage.getItem(COLLECTION_KEYS.SESSION));
            if (session && session.user.id === userId) {
                const updatedUser = { ...users[index] };
                delete updatedUser.password;
                updatedUser.departmentName = getDepartmentName(updatedUser.departmentId);
                updatedUser.studyProgramName = getStudyProgramName(updatedUser.studyProgramId);
                session.user = updatedUser;
                localStorage.setItem(COLLECTION_KEYS.SESSION, JSON.stringify(session));
            }

            const { password, ...rest } = users[index];
            return rest;
        },
        changePassword: async (userId, currentPassword, newPassword) => {
            await new Promise(resolve => setTimeout(resolve, 800));
            const users = getCollection(COLLECTION_KEYS.USERS);
            const index = users.findIndex(u => u.id === userId);

            if (index === -1) throw new Error("User not found");
            if (users[index].password !== currentPassword) throw new Error("Current password is incorrect");

            users[index].password = newPassword;
            users[index].updatedAt = new Date().toISOString();
            setCollection(COLLECTION_KEYS.USERS, users);

            return true;
        }
    },

    users: {
        getAll: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return getCollection(COLLECTION_KEYS.USERS).map(u => {
                const { password, ...rest } = u;
                rest.departmentName = getDepartmentName(rest.departmentId);
                rest.studyProgramName = getStudyProgramName(rest.studyProgramId);
                return rest;
            });
        },
        getById: async (id) => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const users = getCollection(COLLECTION_KEYS.USERS);
            const user = users.find(u => u.id == id);
            if (!user) throw new Error("User not found");
            const { password, ...rest } = user;
            rest.departmentName = getDepartmentName(rest.departmentId);
            rest.studyProgramName = getStudyProgramName(rest.studyProgramId);
            return rest;
        },
        create: async (userData) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getCollection(COLLECTION_KEYS.USERS);
            if (users.find(u => u.username === userData.username)) throw new Error("Username already exists");
            if (users.find(u => u.email === userData.email)) throw new Error("Email already exists");

            const newUser = {
                id: 'u-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                username: userData.username,
                password: userData.password,
                email: userData.email,
                fullName: userData.fullName,
                identityNumber: userData.identityNumber || null,
                role: userData.role,
                departmentId: userData.departmentId || null,
                studyProgramId: userData.studyProgramId || null,
                phoneNumber: userData.phoneNumber || null,
                address: userData.address || null,
                attachments: userData.attachments || null,
                isHomebase: userData.isHomebase || false,
                jabatan: userData.jabatan || null,
                status: userData.status !== undefined ? userData.status : true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                photo: userData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=random&color=fff`
            };
            users.push(newUser);
            setCollection(COLLECTION_KEYS.USERS, users);

            const { password, ...rest } = newUser;
            rest.departmentName = getDepartmentName(rest.departmentId);
            rest.studyProgramName = getStudyProgramName(rest.studyProgramId);
            return rest;
        },
        update: async (id, updates) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getCollection(COLLECTION_KEYS.USERS);
            const index = users.findIndex(u => u.id == id);
            if (index === -1) throw new Error("User not found");

            console.log(`[API] Updating user ${id}:`, updates);
            users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
            setCollection(COLLECTION_KEYS.USERS, users);
            console.log(`[API] User ${id} updated successfully. New data:`, users[index]);

            const { password, ...rest } = users[index];
            rest.departmentName = getDepartmentName(rest.departmentId);
            rest.studyProgramName = getStudyProgramName(rest.studyProgramId);
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
            // Enrich with user info
            const skps = getCollection(COLLECTION_KEYS.SKPS);
            const users = getCollection(COLLECTION_KEYS.USERS);
            return skps.map(s => ({
                ...s,
                user: users.find(u => u.id === s.userId)
            }));
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

            // Notify Staff (Kepegawaian)
            // We target the role 'kepegawaian'
            api.notifications.create({
                targetRole: 'kepegawaian',
                title: 'New SKP Submission',
                message: 'A new SKP has been submitted and is pending review.',
                type: 'info',
                link: '/kepegawaian/dashboard'
            });

            return newSkp;
        },
        update: async (id, updates) => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const skps = getCollection(COLLECTION_KEYS.SKPS);
            const index = skps.findIndex(s => s.id === id);
            if (index === -1) throw new Error("SKP not found");

            skps[index] = { ...skps[index], ...updates, updatedAt: new Date().toISOString() };
            setCollection(COLLECTION_KEYS.SKPS, skps);

            // If status changed to Approved, notify user
            if (updates.status === 'Approved') {
                api.notifications.create({
                    targetUserId: skps[index].userId,
                    title: 'SKP Approved',
                    message: 'Your SKP submission has been approved.',
                    type: 'success',
                    link: '/dosen/progress'
                });
            } else if (updates.status === 'Rejected') {
                api.notifications.create({
                    targetUserId: skps[index].userId,
                    title: 'SKP Needs Revision',
                    message: 'Your SKP submission was rejected. Please review comments and resubmit.',
                    type: 'error',
                    link: '/dosen/skp/submit' // Assuming this is where they edit
                });
            }

            return skps[index];
        }
    },

    departments: {
        getAll: async () => {
            return getCollection(COLLECTION_KEYS.DEPARTMENTS);
        },
        getById: async (id) => {
            const departments = getCollection(COLLECTION_KEYS.DEPARTMENTS);
            return departments.find(d => d.id === id);
        }
    },

    studyPrograms: {
        getAll: async () => {
            return getCollection(COLLECTION_KEYS.STUDY_PROGRAMS);
        },
        getByDepartment: async (departmentId) => {
            const programs = getCollection(COLLECTION_KEYS.STUDY_PROGRAMS);
            return programs.filter(p => p.departmentId === departmentId);
        },
        getById: async (id) => {
            const programs = getCollection(COLLECTION_KEYS.STUDY_PROGRAMS);
            return programs.find(p => p.id === id);
        }
    }
};
