import { getFromStorage, saveToStorage } from './storage';
import { mockAdminStatsPreset } from '../data/mockUsers';

const delay = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

export const userService = {
  // Current active role tracking (citizen, department, worker, admin)
  async getCurrentRole() {
    await delay(50);
    return getFromStorage('ROLE') || 'citizen';
  },

  async setCurrentRole(role) {
    await delay(100);
    saveToStorage('ROLE', role);
    return role;
  },

  async getUserProfile() {
    await delay(150);
    const role = getFromStorage('ROLE') || 'citizen';
    
    if (role === 'admin') {
      return {
        id: 'USR-A001',
        name: 'System Admin',
        username: 'admin_civicfix',
        email: 'admin@civicfix.gov.in',
        phone: '+91 98000 00000',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Admin',
        department: 'Central Administration'
      };
    } else if (role === 'department') {
      const deptUsers = getFromStorage('DEPT_USERS') || [];
      return deptUsers[0] || {
        id: 'USR-D001',
        name: 'Ravi Kumar',
        username: 'ravikumar_road',
        email: 'ravi.kumar@civicfix.gov.in',
        phone: '+91 98450 12345',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Department',
        department: 'Road Maintenance'
      };
    } else if (role === 'worker') {
      const workers = getFromStorage('WORKERS') || [];
      return workers[0] || {
        id: 'WRK-001',
        name: 'Arun Kumar',
        username: 'arun_wrk01',
        email: 'arun.k@civicfix.gov.in',
        phone: '+91 91234 56789',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        role: 'Worker',
        department: 'Road Maintenance'
      };
    }

    // Default Citizen profile
    return getFromStorage('USER');
  },

  async updateUserProfile(profileData) {
    await delay(300);
    const role = getFromStorage('ROLE') || 'citizen';
    
    if (role === 'citizen') {
      const user = getFromStorage('USER');
      const updatedUser = { ...user, ...profileData };
      saveToStorage('USER', updatedUser);
      return updatedUser;
    } else if (role === 'department') {
      const deptUsers = getFromStorage('DEPT_USERS') || [];
      if (deptUsers.length > 0) {
        deptUsers[0] = { ...deptUsers[0], ...profileData };
        saveToStorage('DEPT_USERS', deptUsers);
        return deptUsers[0];
      }
    } else if (role === 'worker') {
      const workers = getFromStorage('WORKERS') || [];
      if (workers.length > 0) {
        workers[0] = { ...workers[0], ...profileData };
        saveToStorage('WORKERS', workers);
        return workers[0];
      }
    }
    
    return profileData;
  },

  // Admin User Management Services
  async getAdminStats() {
    await delay(100);
    const workers = getFromStorage('WORKERS') || [];
    const deptUsers = getFromStorage('DEPT_USERS') || [];
    const citizens = getFromStorage('CITIZENS') || [];

    return {
      workersCount: Math.max(mockAdminStatsPreset.workersCount, workers.length + 18),
      deptUsersCount: Math.max(mockAdminStatsPreset.deptUsersCount, deptUsers.length),
      citizensCount: Math.max(mockAdminStatsPreset.citizensCount, citizens.length + 1279)
    };
  },

  async getUsersByTab(tab) {
    await delay(150);
    if (tab === 'department') {
      return getFromStorage('DEPT_USERS') || [];
    } else if (tab === 'worker') {
      return getFromStorage('WORKERS') || [];
    } else if (tab === 'citizen') {
      return getFromStorage('CITIZENS') || [];
    }
    return [];
  },

  async createUser(roleType, userData) {
    await delay(350);
    if (roleType === 'department' || roleType === 'Department User') {
      const deptUsers = getFromStorage('DEPT_USERS') || [];
      const idNum = String(deptUsers.length + 1).padStart(3, '0');
      const newId = userData.id || `USR-D${idNum}`;
      const newUser = {
        ...userData,
        id: newId,
        role: 'Department'
      };
      deptUsers.unshift(newUser);
      saveToStorage('DEPT_USERS', deptUsers);
      return newUser;
    } else if (roleType === 'worker' || roleType === 'Worker') {
      const workers = getFromStorage('WORKERS') || [];
      const idNum = String(workers.length + 1).padStart(3, '0');
      const newId = userData.id || `WRK-${idNum}`;
      const newWorker = {
        ...userData,
        id: newId,
        role: 'Worker',
        status: 'Active'
      };
      workers.unshift(newWorker);
      saveToStorage('WORKERS', workers);
      return newWorker;
    }
    throw new Error("Citizens register themselves");
  },

  async updateUser(roleType, userId, updatedData) {
    await delay(300);
    if (roleType === 'department' || roleType === 'Department Users') {
      let deptUsers = getFromStorage('DEPT_USERS') || [];
      deptUsers = deptUsers.map(u => u.id === userId ? { ...u, ...updatedData, id: userId } : u);
      saveToStorage('DEPT_USERS', deptUsers);
      return deptUsers.find(u => u.id === userId);
    } else if (roleType === 'worker' || roleType === 'Workers') {
      let workers = getFromStorage('WORKERS') || [];
      workers = workers.map(w => w.id === userId ? { ...w, ...updatedData, id: userId } : w);
      saveToStorage('WORKERS', workers);
      return workers.find(w => w.id === userId);
    } else if (roleType === 'citizen' || roleType === 'Citizens') {
      let citizens = getFromStorage('CITIZENS') || [];
      citizens = citizens.map(c => c.id === userId ? { ...c, ...updatedData, id: userId } : c);
      saveToStorage('CITIZENS', citizens);
      return citizens.find(c => c.id === userId);
    }
  },

  async deleteUser(roleType, userId) {
    await delay(250);
    if (roleType === 'department' || roleType === 'Department Users') {
      let deptUsers = getFromStorage('DEPT_USERS') || [];
      deptUsers = deptUsers.filter(u => u.id !== userId);
      saveToStorage('DEPT_USERS', deptUsers);
      return true;
    } else if (roleType === 'worker' || roleType === 'Workers') {
      let workers = getFromStorage('WORKERS') || [];
      workers = workers.filter(w => w.id !== userId);
      saveToStorage('WORKERS', workers);
      return true;
    } else if (roleType === 'citizen' || roleType === 'Citizens') {
      let citizens = getFromStorage('CITIZENS') || [];
      citizens = citizens.filter(c => c.id !== userId);
      saveToStorage('CITIZENS', citizens);
      return true;
    }
    return false;
  },

  async getAllWorkers(department = null) {
    await delay(150);
    const workers = getFromStorage('WORKERS') || [];
    if (department) {
      return workers.filter(w => w.department.toLowerCase() === department.toLowerCase());
    }
    return workers;
  }
};
