// API Service - Supabase Implementation (No Auth - Direct Users Table)
import { supabase } from '@/lib/supabase';

// Session storage for current user
const SESSION_KEY = 'skp_session';

// Transform user from DB format to app format
const transformUser = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        identityNumber: user.identity_number,
        role: user.role,
        departmentId: user.department_id,
        departmentName: user.department?.name || null,
        studyProgramId: user.study_program_id,
        studyProgramName: user.study_program?.name || null,
        phoneNumber: user.phone_number,
        address: user.address,
        attachments: user.attachments,
        isHomebase: user.is_homebase,
        jabatan: user.jabatan,
        pangkat: user.pangkat,
        photo: user.photo,
        status: user.status,
        raters: user.raters,
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };
};

// Transform SKP from DB format to app format
const transformSkp = (skp) => {
    if (!skp) return null;
    return {
        id: skp.id,
        userId: skp.user_id,
        userName: skp.user?.full_name || null,
        evaluatorId: skp.evaluator_id,
        year: skp.year,
        period: skp.year, // Alias for compatibility
        activity: skp.activity,
        category: skp.category,
        target: skp.target,
        objectives: skp.objectives,
        output: skp.output,
        startDate: skp.start_date,
        endDate: skp.end_date,
        status: skp.status,
        progress: skp.progress,
        score: skp.score,
        details: skp.details,
        feedback: skp.feedback,
        realisasi: skp.realisasi,
        perilaku: skp.perilaku, // Added perilaku field
        realisasiStatus: skp.realisasi_status,
        realisasiSubmittedAt: skp.realisasi_submitted_at,
        realisasiReviewedAt: skp.realisasi_reviewed_at,
        realisasiReviewerId: skp.realisasi_reviewer_id,
        createdAt: skp.created_at,
        updatedAt: skp.updated_at,
        approvedAt: skp.approved_at,
        evaluatedAt: skp.evaluated_at,
        user: skp.user ? transformUser(skp.user) : null,
        evaluator: skp.evaluator ? transformUser(skp.evaluator) : null
    };
};

export const api = {
    // ==================== REFERENCES (Pangkat, Jabatan) ====================
    references: {
        getPangkats: async () => {
            const { data, error } = await supabase
                .from('pangkats')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        },
        createPangkat: async (data) => {
            const { error } = await supabase.from('pangkats').insert(data);
            if (error) throw error;
        },
        updatePangkat: async (id, data) => {
            const { error } = await supabase.from('pangkats').update(data).eq('id', id);
            if (error) throw error;
        },
        deletePangkat: async (id) => {
            const { error } = await supabase.from('pangkats').delete().eq('id', id);
            if (error) throw error;
        },

        getJabatans: async () => {
            const { data, error } = await supabase
                .from('jabatans')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        },
        createJabatan: async (data) => {
            const { error } = await supabase.from('jabatans').insert(data);
            if (error) throw error;
        },
        updateJabatan: async (id, data) => {
            const { error } = await supabase.from('jabatans').update(data).eq('id', id);
            if (error) throw error;
        },
        deleteJabatan: async (id) => {
            const { error } = await supabase.from('jabatans').delete().eq('id', id);
            if (error) throw error;
        }
    },

    // ==================== NOTIFICATIONS ====================
    notifications: {
        getAll: async (userId, role) => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .or(`target_user_id.eq.${userId},target_role.eq.${role}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Notifications fetch error:', error);
                return [];
            }

            return (data || []).map(n => ({
                id: n.id,
                targetUserId: n.target_user_id,
                targetRole: n.target_role,
                title: n.title,
                message: n.message,
                type: n.type,
                link: n.link,
                read: n.read,
                createdAt: n.created_at
            }));
        },

        create: async (notification) => {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    target_user_id: notification.targetUserId || null,
                    target_role: notification.targetRole || null,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type || 'info',
                    link: notification.link || null,
                    read: false
                })
                .select()
                .single();

            if (error) {
                console.error('Notification create error:', error);
                return null;
            }
            return data;
        },

        markAsRead: async (notificationId) => {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) console.error('Mark as read error:', error);
        },

        getUnreadCount: async (userId, role) => {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .or(`target_user_id.eq.${userId},target_role.eq.${role}`)
                .eq('read', false);

            if (error) return 0;
            return count || 0;
        },

        delete: async (notificationId) => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) console.error('Delete notification error:', error);
        },

        deleteAll: async (userId, role) => {
            await supabase
                .from('notifications')
                .delete()
                .eq('target_user_id', userId);
        }
    },

    // ==================== AUTHENTICATION (Direct Users Table) ====================
    auth: {
        login: async (username, password, rememberMe = false) => {
            // Query users table directly
            const { data: user, error } = await supabase
                .from('users')
                .select(`
                    *,
                    department:departments(id, name, code),
                    study_program:study_programs(id, name, code)
                `)
                .eq('username', username)
                .eq('password', password)
                .maybeSingle();

            if (error || !user) {
                throw new Error('Invalid credentials');
            }

            if (!user.status) {
                throw new Error('Account is inactive');
            }

            const transformedUser = transformUser(user);

            // Create session token
            const expiry = Date.now() + (rememberMe ? 7 * 86400000 : 86400000); // 7 days or 1 day
            const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: expiry }));

            const sessionData = { token, user: transformedUser, exp: expiry };

            // Store session
            if (rememberMe) {
                localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
                sessionStorage.removeItem(SESSION_KEY);
            } else {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
                localStorage.removeItem(SESSION_KEY);
            }

            return { token, user: transformedUser };
        },

        logout: async () => {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
        },

        getSession: () => {
            const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
            if (!session) return null;

            try {
                const parsed = JSON.parse(session);
                // Check expiry
                if (parsed.exp && parsed.exp < Date.now()) {
                    localStorage.removeItem(SESSION_KEY);
                    sessionStorage.removeItem(SESSION_KEY);
                    return null;
                }
                return parsed;
            } catch {
                return null;
            }
        },

        updateProfile: async (userId, updates) => {
            const updateData = {};
            if (updates.email !== undefined) updateData.email = updates.email;
            if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
            if (updates.address !== undefined) updateData.address = updates.address;
            if (updates.photo !== undefined) updateData.photo = updates.photo;
            if (updates.jabatan !== undefined) updateData.jabatan = updates.jabatan;
            if (updates.pangkat !== undefined) updateData.pangkat = updates.pangkat;
            if (updates.identityNumber !== undefined) updateData.identity_number = updates.identityNumber;

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select(`
                    *,
                    department:departments(id, name, code),
                    study_program:study_programs(id, name, code)
                `)
                .single();

            if (error) throw error;

            // Update session
            const session = api.auth.getSession();
            if (session && session.user.id === userId) {
                session.user = transformUser(data);
                const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
                storage.setItem(SESSION_KEY, JSON.stringify(session));
            }

            return transformUser(data);
        },

        changePassword: async (userId, currentPassword, newPassword) => {
            // Verify current password
            const { data: user, error: verifyError } = await supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .eq('password', currentPassword)
                .single();

            if (verifyError || !user) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            const { error } = await supabase
                .from('users')
                .update({ password: newPassword })
                .eq('id', userId);

            if (error) throw error;
            return true;
        }
    },

    // ==================== USERS ====================
    users: {
        getAll: async () => {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    *,
                    department:departments(id, name, code),
                    study_program:study_programs(id, name, code)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data.map(transformUser);
        },

        getById: async (id) => {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    *,
                    department:departments(id, name, code),
                    study_program:study_programs(id, name, code)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return transformUser(data);
        },

        create: async (userData) => {
            // Check if username exists
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('username', userData.username)
                .single();

            if (existing) {
                throw new Error('Username already exists');
            }

            // Check if email exists
            const { data: existingEmail } = await supabase
                .from('users')
                .select('id')
                .eq('email', userData.email)
                .single();

            if (existingEmail) {
                throw new Error('Email already exists');
            }

            const { data, error } = await supabase
                .from('users')
                .insert({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    full_name: userData.fullName,
                    identity_number: userData.identityNumber || null,
                    role: userData.role || 'dosen',
                    department_id: userData.departmentId || null,
                    study_program_id: userData.studyProgramId || null,
                    phone_number: userData.phoneNumber || null,
                    address: userData.address || null,
                    attachments: userData.attachments || null,
                    is_homebase: userData.isHomebase || false,
                    jabatan: userData.jabatan || null,
                    pangkat: userData.pangkat || null,
                    photo: userData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=random&color=fff`,
                    status: userData.status !== undefined ? userData.status : true,
                    raters: userData.raters || null
                })
                .select(`
                    *,
                    department:departments(id, name, code),
                    study_program:study_programs(id, name, code)
                `)
                .single();

            if (error) throw error;
            return transformUser(data);
        },

        update: async (id, updates) => {
            const updateData = {};

            if (updates.username !== undefined) updateData.username = updates.username;
            if (updates.email !== undefined) updateData.email = updates.email;
            if (updates.password !== undefined) updateData.password = updates.password;
            if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
            if (updates.identityNumber !== undefined) updateData.identity_number = updates.identityNumber;
            if (updates.role !== undefined) updateData.role = updates.role;
            if (updates.departmentId !== undefined) updateData.department_id = updates.departmentId;
            if (updates.studyProgramId !== undefined) updateData.study_program_id = updates.studyProgramId;
            if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
            if (updates.address !== undefined) updateData.address = updates.address;
            if (updates.attachments !== undefined) updateData.attachments = updates.attachments;
            if (updates.isHomebase !== undefined) updateData.is_homebase = updates.isHomebase;
            if (updates.jabatan !== undefined) updateData.jabatan = updates.jabatan;
            if (updates.pangkat !== undefined) updateData.pangkat = updates.pangkat;
            if (updates.photo !== undefined) updateData.photo = updates.photo;
            if (updates.status !== undefined) updateData.status = updates.status;
            if (updates.raters !== undefined) updateData.raters = updates.raters;

            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    department:departments(id, name, code),
                    study_program:study_programs(id, name, code)
                `)
                .single();

            if (error) throw error;
            return transformUser(data);
        },

        delete: async (id) => {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        }
    },

    // ==================== SKPS ====================
    skps: {
        getByUser: async (userId) => {
            let query = supabase
                .from('skps')
                .select(`
                    *,
                    user:users!skps_user_id_fkey(id, full_name, email, role)
                `)
                .order('created_at', { ascending: false });

            if (userId) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data.map(transformSkp);
        },

        getAll: async () => {
            const { data, error } = await supabase
                .from('skps')
                .select(`
                    *,
                    user:users!skps_user_id_fkey(
                        id, full_name, email, role, identity_number, jabatan, pangkat,
                        department:departments(id, name, code),
                        study_program:study_programs(id, name, code)
                    ),
                    evaluator:users!skps_evaluator_id_fkey(
                        id, full_name, identity_number, jabatan, pangkat,
                        department:departments(id, name, code)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data.map(transformSkp);
        },

        getById: async (id) => {
            const { data, error } = await supabase
                .from('skps')
                .select(`
                    *,
                    user:users!skps_user_id_fkey(
                        id, full_name, email, role, identity_number, jabatan, pangkat,
                        department:departments(id, name, code),
                        study_program:study_programs(id, name, code)
                    ),
                    evaluator:users!skps_evaluator_id_fkey(
                        id, full_name, identity_number, jabatan, pangkat,
                        department:departments(id, name, code)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return transformSkp(data);
        },

        create: async (skpData) => {
            const { data, error } = await supabase
                .from('skps')
                .insert({
                    user_id: skpData.userId,
                    evaluator_id: skpData.evaluatorId || null,
                    year: skpData.year || skpData.period,
                    activity: skpData.activity || null,
                    category: skpData.category || null,
                    target: skpData.target || null,
                    objectives: skpData.objectives || null,
                    output: skpData.output || null,
                    start_date: skpData.startDate || null,
                    end_date: skpData.endDate || null,
                    status: skpData.status || 'Pending',
                    progress: skpData.progress || 0,
                    score: skpData.score || null,
                    details: skpData.details || null,
                    feedback: skpData.feedback || null
                })
                .select(`
                    *,
                    user:users!skps_user_id_fkey(id, full_name, email, role)
                `)
                .single();

            if (error) throw error;

            // Create notification for staff
            try {
                await api.notifications.create({
                    targetRole: 'penilai',
                    title: 'New SKP Submission',
                    message: 'A new SKP has been submitted and is pending review.',
                    type: 'info',
                    link: '/penilai/dashboard'
                });
            } catch (e) {
                console.warn('Failed to create notification:', e);
            }

            return transformSkp(data);
        },

        update: async (id, updates) => {
            const updateData = {};

            if (updates.status !== undefined) updateData.status = updates.status;
            if (updates.year !== undefined) updateData.year = updates.year;
            if (updates.activity !== undefined) updateData.activity = updates.activity;
            if (updates.category !== undefined) updateData.category = updates.category;
            if (updates.target !== undefined) updateData.target = updates.target;
            if (updates.objectives !== undefined) updateData.objectives = updates.objectives;
            if (updates.output !== undefined) updateData.output = updates.output;
            if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
            if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
            if (updates.progress !== undefined) updateData.progress = updates.progress;
            if (updates.score !== undefined) updateData.score = updates.score;
            if (updates.details !== undefined) updateData.details = updates.details;
            if (updates.feedback !== undefined) updateData.feedback = updates.feedback;
            if (updates.evaluatorId !== undefined) updateData.evaluator_id = updates.evaluatorId;
            if (updates.status === 'Approved') updateData.approved_at = new Date().toISOString();
            if (updates.score !== undefined) updateData.evaluated_at = new Date().toISOString();

            // Realisasi fields
            if (updates.realisasi !== undefined) updateData.realisasi = updates.realisasi;
            if (updates.realisasiStatus !== undefined) updateData.realisasi_status = updates.realisasiStatus;
            if (updates.realisasiSubmittedAt !== undefined) updateData.realisasi_submitted_at = updates.realisasiSubmittedAt;
            if (updates.realisasiReviewedAt !== undefined) updateData.realisasi_reviewed_at = updates.realisasiReviewedAt;
            if (updates.realisasiReviewerId !== undefined) updateData.realisasi_reviewer_id = updates.realisasiReviewerId;

            const { data, error } = await supabase
                .from('skps')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    user:users!skps_user_id_fkey(id, full_name, email, role)
                `)
                .single();

            if (error) throw error;

            // Create notifications based on status change
            try {
                if (updates.status === 'Approved') {
                    await api.notifications.create({
                        targetUserId: data.user_id,
                        title: 'SKP Approved',
                        message: 'Your SKP submission has been approved.',
                        type: 'success',
                        link: '/dosen/dashboard'
                    });
                } else if (updates.status === 'Rejected') {
                    await api.notifications.create({
                        targetUserId: data.user_id,
                        title: 'SKP Needs Revision',
                        message: 'Your SKP submission was rejected. Please review comments and resubmit.',
                        type: 'error',
                        link: '/dosen/skp/submit'
                    });
                }
            } catch (e) {
                console.warn('Failed to create notification:', e);
            }

            return transformSkp(data);
        },

        delete: async (id) => {
            // Get SKP first to notify user
            const { data: skp } = await supabase
                .from('skps')
                .select('user_id')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('skps')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Notify user
            if (skp?.user_id) {
                try {
                    await api.notifications.create({
                        targetUserId: skp.user_id,
                        title: 'SKP Dihapus',
                        message: 'SKP Anda telah dihapus oleh staff. Anda dapat mengajukan SKP baru.',
                        type: 'warning',
                        link: '/dosen/skp/submit'
                    });
                } catch (e) {
                    console.warn('Failed to create notification:', e);
                }
            }

            return true;
        }
    },

    // ==================== DEPARTMENTS ====================
    departments: {
        getAll: async () => {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .order('name');

            if (error) throw error;
            return data.map(d => ({
                id: d.id,
                name: d.name,
                code: d.code,
                head: d.head
            }));
        },

        create: async (data) => {
            const { error } = await supabase.from('departments').insert({
                name: data.name,
                code: data.code,
                head: data.head
            });
            if (error) throw error;
        },

        update: async (id, data) => {
            const { error } = await supabase.from('departments').update({
                name: data.name,
                code: data.code,
                head: data.head
            }).eq('id', id);
            if (error) throw error;
        },

        delete: async (id) => {
            const { error } = await supabase.from('departments').delete().eq('id', id);
            if (error) throw error;
        },

        getById: async (id) => {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return {
                id: data.id,
                name: data.name,
                code: data.code,
                head: data.head
            };
        }
    },

    // ==================== STUDY PROGRAMS ====================
    studyPrograms: {
        getAll: async () => {
            const { data, error } = await supabase
                .from('study_programs')
                .select('*')
                .order('name');

            if (error) throw error;
            return data.map(p => ({
                id: p.id,
                name: p.name,
                code: p.code,
                departmentId: p.department_id
            }));
        },

        getByDepartment: async (departmentId) => {
            const { data, error } = await supabase
                .from('study_programs')
                .select('*')
                .eq('department_id', departmentId)
                .order('name');

            if (error) throw error;
            return data.map(p => ({
                id: p.id,
                name: p.name,
                code: p.code,
                departmentId: p.department_id
            }));
        },

        getById: async (id) => {
            const { data, error } = await supabase
                .from('study_programs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return {
                id: data.id,
                name: data.name,
                code: data.code,
                departmentId: data.department_id
            };
        }
    },

    // ==================== SETTINGS ====================
    settings: {
        get: async (key) => {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', key)
                .maybeSingle();

            if (error) throw error;
            return data?.value || null;
        },

        set: async (key, value) => {
            const { data, error } = await supabase
                .from('settings')
                .upsert(
                    { key, value, updated_at: new Date().toISOString() },
                    { onConflict: 'key' }
                )
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        // Convenience method for period
        getPeriodConfig: async () => {
            const value = await api.settings.get('skp_period');
            if (!value) {
                // Return default: current year annual
                const year = new Date().getFullYear();
                return {
                    type: 'annual',
                    year,
                    startDate: `${year}-01-01`,
                    endDate: `${year}-12-31`
                };
            }
            return value;
        },

        setPeriodConfig: async (config) => {
            return api.settings.set('skp_period', config);
        }
    }
};

export default api;
