import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  FileCheck2, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter, 
  ArrowRight,
  MapPin,
  ChevronRight,
  TrendingUp,
  Map
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { userService } from '../services/userService';
import { LoadingState } from '../components/common/LoadingState';

export const DepartmentDashboard = () => {
  const [stats, setStats] = useState({ complaintsArised: 48, assignedToWorkers: 31, resolved: 17 });
  const [complaints, setComplaints] = useState([]);
  const [departmentName, setDepartmentName] = useState('Road Maintenance');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const loadDeptData = async () => {
    setIsLoading(true);
    try {
      const user = await userService.getUserProfile();
      const dept = user?.department || 'Road Maintenance';
      setDepartmentName(dept);

      const s = await complaintService.getDepartmentStats(dept);
      setStats(s);

      const list = await complaintService.getDepartmentComplaints(dept);
      setComplaints(list);
    } catch (err) {
      console.error("Failed to load department dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeptData();
  }, []);

  const filteredComplaints = complaints.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    return true;
  });

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-500 text-white';
      case 'In Progress':
        return 'bg-primary-600 text-white';
      case 'Assigned':
        return 'bg-violet-600 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
            {departmentName} Department
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight mt-1">
            Department Complaints Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active civic complaints classified and assigned to {departmentName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/department/heatmap')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-all"
          >
            <Map className="h-4 w-4 text-primary-600" />
            <span>Area Heatmap</span>
          </button>
          <button
            onClick={() => navigate('/department/prediction')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-800 cursor-pointer transition-all"
          >
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span>Prediction Insights</span>
          </button>
        </div>
      </div>

      {/* Top 3 Department Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Complaints Arised Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Complaints Arised</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">{stats.complaintsArised}</p>
            <p className="text-[11px] text-slate-500 font-medium">Total Received by Department</p>
          </div>
          <div className="h-12 w-12 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center text-sky-600 shrink-0">
            <FileCheck2 className="h-6 w-6" />
          </div>
        </div>

        {/* Assigned to Workers Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned to Workers</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">{stats.assignedToWorkers}</p>
            <p className="text-[11px] text-violet-600 font-medium">Currently Active Ground Orders</p>
          </div>
          <div className="h-12 w-12 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-center text-violet-600 shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Resolved Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved</p>
            <p className="text-3xl font-extrabold text-slate-900 font-display">{stats.resolved}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Successfully Completed</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Active Complaints List Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">Active Complaints</h2>
            <p className="text-xs text-slate-400">Click any card to open detailed complaint inspection and assign field workers.</p>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Complaints Cards Grid */}
        {isLoading ? (
          <LoadingState type="spinner" className="h-64" />
        ) : filteredComplaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/department/complaints/${c.id}`)}
                className="bg-white border border-slate-200/80 hover:border-primary-300 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top ID and Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-lg">
                      {c.id}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(c.priority)}`}>
                        {c.priority} Priority
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(c.status)}`}>
                        ● {c.status}
                      </span>
                    </div>
                  </div>

                  {/* Complaint Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary-600 transition-colors leading-tight">
                      {c.description.length > 70 ? `${c.description.slice(0, 70)}...` : c.description}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{c.location}</span>
                    </p>
                  </div>
                </div>

                {/* Card Footer Info */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>
                      Workers Assigned: <strong className="text-slate-800 font-bold">{c.workersAssignedCount || (c.id === 'CIV-1024' ? 2 : 1)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-primary-600 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Inspect Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No complaints found matching selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentDashboard;
