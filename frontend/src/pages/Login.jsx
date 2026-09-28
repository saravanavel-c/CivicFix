import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Building2, 
  Wrench, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MapPin,
  FileText
} from 'lucide-react';
import { userService } from '../services/userService';

export const Login = () => {
  const navigate = useNavigate();

  const handleRoleLogin = async (role, route) => {
    await userService.setCurrentRole(role);
    navigate(route);
  };

  const roles = [
    {
      id: 'citizen',
      title: 'Citizen Login',
      roleName: 'Citizen',
      subtitle: 'Report civic issues, track real-time resolution, and upvote neighborhood concerns.',
      icon: User,
      color: 'bg-primary-600',
      badgeBg: 'bg-primary-50 text-primary-700 border-primary-100',
      route: '/citizen/dashboard',
      tag: 'Public Access'
    },
    {
      id: 'department',
      title: 'Department Login',
      roleName: 'Department User',
      subtitle: 'Manage department complaints, allocate ground workers, and monitor heatmaps.',
      icon: Building2,
      color: 'bg-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      route: '/department/dashboard',
      tag: 'Municipal Authority'
    },
    {
      id: 'worker',
      title: 'Worker Login',
      roleName: 'Worker',
      subtitle: 'View allocated work orders, submit execution updates, and upload completion proof.',
      icon: Wrench,
      color: 'bg-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      route: '/worker/dashboard',
      tag: 'Field Staff'
    },
    {
      id: 'admin',
      title: 'Admin Login',
      roleName: 'Admin',
      subtitle: 'Manage system users, oversee department personnel, and audit civic platform activity.',
      icon: ShieldCheck,
      color: 'bg-violet-600',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-100',
      route: '/admin/dashboard',
      tag: 'System Admin'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-primary-500/25">
            <span className="font-display font-bold text-xl">C</span>
          </div>
          <span className="font-display font-bold text-2xl text-slate-800 tracking-tight">
            Civic<span className="text-primary-600">Fix</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/70 shadow-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Role-Based Portal Access</span>
        </div>
      </div>

      {/* Main Hero & Role Selection */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8 space-y-8 animate-fade-in">
        {/* Title Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
            Civic Grievance & Resolution Platform
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
            Select Your Account Role
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-normal">
            Welcome to CivicFix. Choose your portal to access specialized dashboards for issue reporting, department assignments, and resolution tracking.
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                      {item.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-display group-hover:text-primary-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleRoleLogin(item.id, item.route)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-primary-600 text-white rounded-2xl font-semibold text-xs transition-all shadow-sm group-hover:shadow-md cursor-pointer"
                  >
                    <span>Enter as {item.roleName}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Feature Badges */}
        <div className="pt-6 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Instant Role Navigation</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
            <span>Area Heatmaps & Location Tracking</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <FileText className="h-4 w-4 text-violet-500 shrink-0" />
            <span>Real-time Work Order Status</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center py-4 border-t border-slate-200/40 text-xs text-slate-400">
        © 2026 CivicFix Municipal Governance System. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
