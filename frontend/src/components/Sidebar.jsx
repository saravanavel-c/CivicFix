import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  MapPin, 
  Bell, 
  User, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

export const Sidebar = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    };
    fetchUnread();

    const interval = setInterval(fetchUnread, 1500);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/report', label: 'Report Issue', icon: PlusCircle },
    { to: '/complaints', label: 'My Complaints', icon: FileText },
    { to: '/nearby', label: 'Nearby Issues', icon: MapPin },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-200/40 flex items-center gap-2.5 select-none">
        <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-primary-500/20">
          <span className="font-display font-bold text-lg">C</span>
        </div>
        <span className="font-display font-bold text-lg text-slate-800 tracking-tight">
          Civic<span className="text-primary-600">Fix</span>
        </span>
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
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
