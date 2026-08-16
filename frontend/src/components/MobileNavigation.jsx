import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Bell, 
  User 
} from 'lucide-react';
import { notificationService } from '../services/notificationService';

export const MobileNavigation = () => {
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
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/complaints', label: 'Complaints', icon: FileText },
    { to: '/report', label: 'Report', icon: Plus, isAction: true },
    { to: '/notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
    { to: '/profile', label: 'Profile', icon: User }
  ];

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
