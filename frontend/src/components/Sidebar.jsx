import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  MapPin, 
  Bell, 
  User, 
  HelpCircle, 
  LogOut,
  Users,
  Sparkles,
  Wrench,
  Building2,
  TrendingUp
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';

export const Sidebar = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState('citizen');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchRoleAndUnread = async () => {
      const currentRole = await userService.getCurrentRole();
      setRole(currentRole);

      // Infer role from path if explicitly navigated to role path
      if (location.pathname.startsWith('/admin')) {
        setRole('admin');
        userService.setCurrentRole('admin');
      } else if (location.pathname.startsWith('/department')) {
        setRole('department');
        userService.setCurrentRole('department');
      } else if (location.pathname.startsWith('/worker')) {
        setRole('worker');
        userService.setCurrentRole('worker');
      } else if (location.pathname.startsWith('/citizen') || location.pathname === '/report' || location.pathname === '/nearby' || location.pathname === '/complaints') {
        setRole('citizen');
        userService.setCurrentRole('citizen');
      }

      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    };

    fetchRoleAndUnread();
  }, [location.pathname]);

  const handleLogout = () => {
    userService.setCurrentRole('citizen');
    navigate('/login');
  };

  // Define role-specific navigation items
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'User Management', icon: Users },
          { to: '/profile', label: 'Admin Profile', icon: User }
        ];
      case 'department':
        return [
          { to: '/department/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/department/heatmap', label: 'Area Heatmap', icon: MapPin },
          { to: '/department/prediction', label: 'Prediction', icon: TrendingUp },
          { to: '/profile', label: 'Department Profile', icon: User }
        ];
      case 'worker':
        return [
          { to: '/worker/dashboard', label: 'Work Orders', icon: Wrench },
          { to: '/profile', label: 'Worker Profile', icon: User }
        ];
      case 'citizen':
      default:
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/report', label: 'Report Issue', icon: PlusCircle },
          { to: '/complaints', label: 'My Complaints', icon: FileText },
          { to: '/nearby', label: 'Nearby Issues', icon: MapPin },
          { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
          { to: '/profile', label: 'Profile', icon: User }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-200/40 flex items-center justify-between select-none">
        <NavLink to="/login" className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-primary-500/20">
            <span className="font-display font-bold text-lg">C</span>
          </div>
          <span className="font-display font-bold text-lg text-slate-800 tracking-tight">
            Civic<span className="text-primary-600">Fix</span>
          </span>
        </NavLink>
        
        {role !== 'citizen' && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200/60">
            {role}
          </span>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all group ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 border border-primary-100/50 shadow-sm shadow-primary-500/5'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="h-5 min-w-5 px-1.5 flex items-center justify-center bg-rose-500 text-white rounded-full text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200/40 space-y-1">
        <NavLink
          to="/profile?tab=help"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide transition-all ${
              isActive
                ? 'bg-slate-50 text-slate-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`
          }
        >
          <HelpCircle className="h-4.5 w-4.5 shrink-0 text-slate-400" />
          <span>Help & Support</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium tracking-wide text-rose-500 hover:bg-rose-50/50 transition-all text-left cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span>Switch Role / Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
