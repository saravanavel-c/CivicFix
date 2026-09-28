import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, Settings, HelpCircle, LogOut, ChevronDown, RefreshCw } from 'lucide-react';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';

export const Header = () => {
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const u = await userService.getUserProfile();
        setProfile(u);
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to load header details:", err);
      }
    };

    fetchHeaderData();

    const interval = setInterval(async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    }, 2000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchRole = () => {
    setDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo - Mobile visible or fallback */}
      <div className="flex items-center gap-2">
        <Link to="/login" className="flex items-center gap-2 select-none group">
          <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <span className="font-display font-bold text-lg">C</span>
          </div>
          <span className="font-display font-bold text-lg text-slate-800 tracking-tight">
            Civic<span className="text-primary-600">Fix</span>
          </span>
        </Link>
      </div>

      {/* Action Indicators */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Pill Quick Link */}
        <button
          onClick={() => navigate('/login')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100/80 border border-primary-200/70 rounded-xl transition-all cursor-pointer"
          title="Switch logged-in role"
        >
          <RefreshCw className="h-3.5 w-3.5 text-primary-600" />
          <span>Switch Role</span>
        </button>

        {/* Notification Bell */}
        <Link 
          to="/notifications" 
          className="relative p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-xl transition-all"
          aria-label="View notifications"
        >
          <Bell className="h-5.5 w-5.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 flex items-center justify-center bg-rose-500 text-white rounded-full text-[9px] font-bold border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Info & Dropdown */}
        {profile && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-xl transition-all focus:outline-none cursor-pointer"
            >
              <div className="h-8.5 w-8.5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                <img 
                  src={profile.avatar || "https://randomuser.me/api/portraits/men/32.jpg"} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-700 leading-tight">
                  {profile.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {profile.role ? `${profile.role} Account` : 'Citizen Account'}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Items */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-scale-up">
                <div className="px-4 py-2 border-b border-slate-50 pb-2 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</p>
                  <p className="text-xs font-medium text-slate-800 truncate mt-0.5">{profile.email}</p>
                  {profile.id && (
                    <span className="inline-block mt-1 text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      ID: {profile.id}
                    </span>
                  )}
                </div>

                <Link 
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </Link>

                <Link 
                  to="/profile?tab=security"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </Link>

                <Link 
                  to="/profile?tab=help"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                  Help & Support
                </Link>

                <div className="border-t border-slate-50 my-1 pt-1">
                  <button
                    onClick={handleSwitchRole}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-primary-600 hover:bg-primary-50/50 transition-colors text-left font-medium cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Switch Role / Login
                  </button>
                  <button
                    onClick={handleSwitchRole}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50/50 transition-colors text-left font-medium cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
