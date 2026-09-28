import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Wrench, 
  UserCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle, 
  Search,
  ShieldAlert,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { userService } from '../services/userService';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { LoadingState } from '../components/common/LoadingState';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ workersCount: 24, deptUsersCount: 8, citizensCount: 1284 });
  const [activeTab, setActiveTab] = useState('department'); // 'department' | 'worker' | 'citizen'
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Form states
  const [addRoleType, setAddRoleType] = useState('Department User'); // 'Department User' | 'Worker'
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    department: 'Road Maintenance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    password: ''
  });

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const departmentsList = [
    'Road Maintenance',
    'Sanitation',
    'Water Supply',
    'Electrical',
    'Drainage'
  ];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const s = await userService.getAdminStats();
      setStats(s);
      const list = await userService.getUsersByTab(activeTab);
      setUsers(list);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleOpenAddModal = () => {
    const prefix = addRoleType === 'Worker' ? 'WRK' : 'USR-D';
    const randomNum = String(Math.floor(100 + Math.random() * 900));
    setFormData({
      id: `${prefix}-${randomNum}`,
      name: '',
      username: '',
      email: '',
      phone: '',
      department: 'Road Maintenance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      password: 'password123'
    });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser(addRoleType, formData);
      setToastType('success');
      setToastMessage(`${addRoleType} created successfully.`);
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to create user.');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.updateUser(activeTab, editingUser.id, editingUser);
      setToastType('success');
      setToastMessage('User details updated successfully.');
      setEditingUser(null);
      loadData();
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to update user.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await userService.deleteUser(activeTab, deletingUser.id);
      setToastType('success');
      setToastMessage(`User ${deletingUser.name} deleted successfully.`);
      setDeletingUser(null);
      loadData();
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to delete user.');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
            System Administration
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight mt-1">
            Admin User Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create, view, edit, and manage system accounts across departments, workers, and citizens.
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          variant="primary"
          icon={UserPlus}
          size="md"
        >
          Add User
        </Button>
      </div>

      {/* Top 3 Statistics Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Workers Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Workers</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">{stats.workersCount}</p>
            <p className="text-[11px] text-amber-600 font-medium">Field Maintenance Personnel</p>
          </div>
          <div className="h-12 w-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Wrench className="h-6 w-6" />
          </div>
        </div>

        {/* Department Users Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department Users</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">{stats.deptUsersCount}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Municipal Department Leads</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Citizens Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Citizens</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">{stats.citizensCount.toLocaleString()}</p>
            <p className="text-[11px] text-primary-600 font-medium">Self-Registered Public Users</p>
          </div>
          <div className="h-12 w-12 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center text-primary-600 shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* User Directory Panel */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Horizontal Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('department')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'department'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Department Users</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'department' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.deptUsersCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('worker')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'worker'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Workers</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'worker' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.workersCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('citizen')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'citizen'
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Citizens</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'citizen' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.citizensCount}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user ID, name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Tab-specific info banner */}
        {activeTab === 'citizen' && (
          <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-sky-800">
            <UserCheck className="h-5 w-5 text-sky-600 shrink-0" />
            <span>
              <strong>Note:</strong> Citizens register independently via email. As Admin, you can <strong>View</strong>, <strong>Edit</strong>, or <strong>Delete</strong> citizen accounts. Manual creation is restricted to Department Users & Workers.
            </span>
          </div>
        )}

        {/* User Tiles Grid */}
        {isLoading ? (
          <LoadingState type="spinner" className="h-64" />
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        <img
                          src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-md">
                          {user.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight mt-1">
                          {user.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">@{user.username || 'username'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{user.phone || '+91 XXXXX XXXXX'}</span>
                    </div>

                    {user.department && (
                      <div className="flex items-center gap-2 pt-1">
                        <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {user.department}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Edit User</span>
                  </button>

                  <button
                    onClick={() => setDeletingUser(user)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-50 hover:bg-rose-100/70 text-rose-600 rounded-xl text-xs font-semibold border border-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No users found matching "{searchQuery}" in {activeTab} directory.
          </div>
        )}
      </div>

      {/* --- MODAL 1: ADD USER --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Add System User</h3>
                <p className="text-xs text-slate-400">Create Department Lead or Worker account</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Role Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">User Role Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAddRoleType('Department User');
                      setFormData(prev => ({ ...prev, id: `USR-D${Math.floor(100 + Math.random() * 900)}` }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer ${
                      addRoleType === 'Department User'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Department User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAddRoleType('Worker');
                      setFormData(prev => ({ ...prev, id: `WRK-${Math.floor(100 + Math.random() * 900)}` }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer ${
                      addRoleType === 'Worker'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Wrench className="h-4 w-4" />
                    <span>Worker</span>
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">User ID (Auto)</label>
                  <input
                    type="text"
                    value={formData.id}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="ramesh_road"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@civicfix.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Profile Photo URL</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsAddModalOpen(false)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  Create {addRoleType}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: EDIT USER --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Edit User</h3>
                <p className="text-xs text-slate-400">Update information for user {editingUser.id}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">User ID (Read Only)</label>
                  <input
                    type="text"
                    value={editingUser.id}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-400 cursor-not-allowed font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editingUser.username || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                {activeTab !== 'citizen' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                    <select
                      value={editingUser.department || 'Road Maintenance'}
                      onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      {departmentsList.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Profile Photo URL</label>
                <input
                  type="text"
                  value={editingUser.avatar || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, avatar: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setEditingUser(null)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: DELETE CONFIRMATION --- */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-scale-up">
            <div className="h-12 w-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete user <strong className="text-slate-800">{deletingUser.name}</strong> ({deletingUser.id})?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeletingUser(null)}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDeleteConfirm}
                fullWidth
              >
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
