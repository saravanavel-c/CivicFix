/**
 * userService.js
 *
 * Authentication and user profile management via Supabase Auth.
 * Falls back to localStorage mock data when Supabase is unavailable,
 * so the demo/offline experience is preserved for presentations.
 */
import { supabase, getCurrentUser, getUserProfile } from '../lib/supabaseClient';
import { getFromStorage, saveToStorage }            from './storage';

// Role → route mapping used by Login redirect
export const ROLE_HOME = {
  citizen:    '/dashboard',
  officer:    '/department/dashboard',
  admin:      '/admin/dashboard',
  worker:     '/worker/dashboard',
  department: '/department/dashboard',
};

// ─────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────

/**
 * Sign up a new citizen account.
 * The database trigger auto-creates a `profiles` row with role = 'citizen'.
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || 'Citizen' },
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Sign in with email + password.
 * Returns { user, profile, redirectPath }.
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const profile = await getUserProfile(data.user.id);
  const role    = profile?.role || 'citizen';

  // Persist role in localStorage for UI components that read it synchronously
  saveToStorage('ROLE', role);

  return {
    user:         data.user,
    profile,
    role,
    redirectPath: ROLE_HOME[role] || '/dashboard',
  };
}

/**
 * Sign out the current session.
 */
export async function signOut() {
  await supabase.auth.signOut();
  saveToStorage('ROLE', 'citizen');
}

/**
 * Returns the current Supabase session, or null.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─────────────────────────────────────────────────────────────
// Legacy userService object — keeps the shape the pages expect
// ─────────────────────────────────────────────────────────────
export const userService = {

  async getCurrentRole() {
    // Try Supabase first for the authoritative role
    try {
      const user    = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        if (profile?.role) {
          saveToStorage('ROLE', profile.role);
          return profile.role;
        }
      }
    } catch { /* fall through */ }
    return getFromStorage('ROLE') || 'citizen';
  },

  async setCurrentRole(role) {
    saveToStorage('ROLE', role);
    return role;
  },

  async getUserProfile() {
    try {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getUserProfile(user.id);
        if (profile) {
          return {
            id:         user.id,
            name:       profile.full_name,
            email:      user.email,
            phone:      user.phone || '',
            avatar:     profile.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profile.full_name)}`,
            role:       capitalize(profile.role),
            department: roleDept(profile.role),
          };
        }
      }
    } catch { /* fall through */ }

    // Offline / demo fallback
    const role = getFromStorage('ROLE') || 'citizen';
    return getMockProfile(role);
  },

  async updateUserProfile(profileData) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name:  profileData.name  || profileData.full_name,
            avatar_url: profileData.avatar || null,
            // role is intentionally excluded — prevent self-escalation
          })
          .eq('id', user.id);
        if (!error) return { ...profileData };
      }
    } catch { /* fall through */ }

    // localStorage fallback
    const stored = getFromStorage('USER');
    const updated = { ...stored, ...profileData };
    saveToStorage('USER', updated);
    return updated;
  },

  // ── Admin helpers (localStorage, unchanged) ──

  async getAdminStats() {
    const workers  = getFromStorage('WORKERS')   || [];
    const deptUsers = getFromStorage('DEPT_USERS') || [];
    const citizens = getFromStorage('CITIZENS')  || [];

    // Try Supabase count
    try {
      const { count: citizenCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'citizen');
      return {
        workersCount:   Math.max(18, workers.length + 18),
        deptUsersCount: Math.max(6,  deptUsers.length),
        citizensCount:  Math.max(citizenCount || 0, citizens.length + 1279),
      };
    } catch { /* fall through */ }

    return {
      workersCount:   Math.max(18, workers.length + 18),
      deptUsersCount: Math.max(6,  deptUsers.length),
      citizensCount:  Math.max(1280, citizens.length + 1279),
    };
  },

  async getUsersByTab(tab) {
    const keyMap = { department: 'DEPT_USERS', worker: 'WORKERS', citizen: 'CITIZENS' };
    return getFromStorage(keyMap[tab] || 'CITIZENS') || [];
  },

  async createUser(roleType, userData) {
    if (roleType === 'department' || roleType === 'Department User') {
      const list  = getFromStorage('DEPT_USERS') || [];
      const newId = userData.id || `USR-D${String(list.length + 1).padStart(3,'0')}`;
      const entry = { ...userData, id: newId, role: 'Department' };
      list.unshift(entry);
      saveToStorage('DEPT_USERS', list);
      return entry;
    }
    if (roleType === 'worker' || roleType === 'Worker') {
      const list  = getFromStorage('WORKERS') || [];
      const newId = userData.id || `WRK-${String(list.length + 1).padStart(3,'0')}`;
      const entry = { ...userData, id: newId, role: 'Worker', status: 'Active' };
      list.unshift(entry);
      saveToStorage('WORKERS', list);
      return entry;
    }
    throw new Error('Citizens register themselves via signUp()');
  },

  async updateUser(roleType, userId, updatedData) {
    const keyMap = { 'department': 'DEPT_USERS', 'Department Users': 'DEPT_USERS',
                     'worker': 'WORKERS', 'Workers': 'WORKERS',
                     'citizen': 'CITIZENS', 'Citizens': 'CITIZENS' };
    const key  = keyMap[roleType];
    if (!key) return null;
    const list = getFromStorage(key) || [];
    const updated = list.map(u => u.id === userId ? { ...u, ...updatedData, id: userId } : u);
    saveToStorage(key, updated);
    return updated.find(u => u.id === userId);
  },

  async deleteUser(roleType, userId) {
    const keyMap = { 'department': 'DEPT_USERS', 'Department Users': 'DEPT_USERS',
                     'worker': 'WORKERS', 'Workers': 'WORKERS',
                     'citizen': 'CITIZENS', 'Citizens': 'CITIZENS' };
    const key  = keyMap[roleType];
    if (!key) return false;
    const list    = getFromStorage(key) || [];
    const filtered = list.filter(u => u.id !== userId);
    saveToStorage(key, filtered);
    return true;
  },

  async getAllWorkers(department = null) {
    const workers = getFromStorage('WORKERS') || [];
    if (department) return workers.filter(w => w.department?.toLowerCase() === department.toLowerCase());
    return workers;
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function roleDept(role) {
  return { officer: 'Road Maintenance', admin: 'Central Administration', worker: 'Road Maintenance' }[role] || '';
}

function getMockProfile(role) {
  const profiles = {
    admin: {
      id: 'USR-A001', name: 'System Admin', email: 'admin@civicfix.gov.in',
      phone: '+91 98000 00000', role: 'Admin', department: 'Central Administration',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Admin',
    },
    department: {
      id: 'USR-D001', name: 'Ravi Kumar', email: 'ravi.kumar@civicfix.gov.in',
      phone: '+91 98450 12345', role: 'Department', department: 'Road Maintenance',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Ravi',
    },
    worker: {
      id: 'WRK-001', name: 'Arun Kumar', email: 'arun.k@civicfix.gov.in',
      phone: '+91 91234 56789', role: 'Worker', department: 'Road Maintenance',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Arun',
    },
    citizen: {
      id: 'USR-C001', name: 'Saravanavel', email: 'saravana.vel@civicfix.gov.in',
      phone: '+91 98765 43210', role: 'Citizen', department: '',
      avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=Saravanavel',
    },
  };
  return getFromStorage('USER') || profiles[role] || profiles.citizen;
}
