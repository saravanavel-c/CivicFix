import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, Settings, HelpCircle, LogOut, ChevronDown, CheckCircle } from 'lucide-react';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';

export const Header = () => {
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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

    // Listen for updates from other pages reporting issues
    const interval = setInterval(async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo - Mobile visible only since sidebar has desktop logo */}
      <div className="flex items-center gap-2">
        <Link to="/dashboard" className="flex items-center gap-2 select-none group">
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
              <div className="h-8.5 w-8.5 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                <img 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-700 leading-tight">
                  {profile.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  Citizen Account
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 hidden sm:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Items */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-scale-up">
                <div className="px-4 py-2 border-b border-slate-50 pb-2 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logged in as</p>
                  <p className="text-xs font-medium text-slate-800 truncate mt-0.5">{profile.email}</p>
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
                    onClick={handleLogout}
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
