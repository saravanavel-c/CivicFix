import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Bell, 
  User,
  Users,
  MapPin,
  TrendingUp,
  Wrench,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';

export const MobileNavigation = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState('citizen');
  const location = useLocation();

  useEffect(() => {
    const fetchRoleAndUnread = async () => {
      const currentRole = await userService.getCurrentRole();
      setRole(currentRole);

      if (location.pathname.startsWith('/admin')) {
        setRole('admin');
      } else if (location.pathname.startsWith('/department')) {
        setRole('department');
      } else if (location.pathname.startsWith('/worker')) {
        setRole('worker');
      } else if (location.pathname.startsWith('/citizen') || location.pathname === '/report' || location.pathname === '/nearby' || location.pathname === '/complaints') {
        setRole('citizen');
      }

      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    };

    fetchRoleAndUnread();
  }, [location.pathname]);

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Users', icon: Users },
          { to: '/login', label: 'Login Roles', icon: ShieldCheck },
          { to: '/profile', label: 'Profile', icon: User }
        ];
      case 'department':
        return [
          { to: '/department/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/department/heatmap', label: 'Heatmap', icon: MapPin },
          { to: '/department/prediction', label: 'Predict', icon: TrendingUp },
          { to: '/profile', label: 'Profile', icon: User }
        ];
      case 'worker':
        return [
          { to: '/worker/dashboard', label: 'Tasks', icon: Wrench },
          { to: '/login', label: 'Roles', icon: ShieldCheck },
          { to: '/profile', label: 'Profile', icon: User }
        ];
      case 'citizen':
      default:
        return [
          { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
          { to: '/complaints', label: 'Complaints', icon: FileText },
          { to: '/report', label: 'Report', icon: Plus, isAction: true },
          { to: '/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
          { to: '/profile', label: 'Profile', icon: User }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around pb-safe-bottom">
      {navItems.map((item, index) => {
        const Icon = item.icon;

        if (item.isAction) {
          return (
            <NavLink
              key={index}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center -mt-6 bg-primary-600 hover:bg-primary-700 text-white h-13 w-13 rounded-full shadow-lg shadow-primary-500/35 border-4 border-white transition-all transform active:scale-95 z-50 ${
                  isActive ? 'scale-105' : ''
                }`
              }
              aria-label="Report issue"
            >
              <Icon className="h-6.5 w-6.5 stroke-[2.5]" />
            </NavLink>
          );
        }

        return (
          <NavLink
            key={index}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-3 text-slate-500 rounded-xl transition-all relative ${
                isActive ? 'text-primary-600 font-semibold' : 'hover:text-slate-700'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] tracking-wide">{item.label}</span>
            
            {item.badge > 0 && (
              <span className="absolute top-1.5 right-3.5 h-4 min-w-4 px-1 flex items-center justify-center bg-rose-500 text-white rounded-full text-[8px] font-bold border border-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
