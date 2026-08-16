import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { StatCard } from '../components/common/StatCard';
import { ComplaintCard } from '../components/common/ComplaintCard';
import { LoadingState } from '../components/common/LoadingState';
import { Button } from '../components/common/Button';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Load stats
        const s = await complaintService.getDashboardStats();
        setStats(s);
        // Load complaints and take the first 3
        const list = await complaintService.getMyComplaints();
        setRecentComplaints(list.slice(0, 3));
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-50 rounded-full filter blur-3xl opacity-60 translate-x-10 -translate-y-10 -z-10"></div>
        
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-800 tracking-tight">
            Good morning, Saravana 👋
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            Help make your community better by reporting local infrastructure and sanitation issues.
          </p>
        </div>

        <Button 
          onClick={() => navigate('/report')}
          variant="primary"
          size="lg"
          icon={PlusCircle}
          className="shadow-md shadow-primary-500/20"
        >
          Report an Issue
        </Button>
      </div>

      {/* Primary CTA and AI highlight Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Big CTA */}
        <div 
          onClick={() => navigate('/report')}
          className="md:col-span-2 group bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-3xl p-6 shadow-md shadow-primary-600/10 flex flex-col justify-between min-h-[160px] cursor-pointer hover:shadow-lg hover:shadow-primary-600/20 transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                Fast Reporting
              </span>
              <h2 className="text-lg font-bold text-white mt-2">See something that needs attention?</h2>
            </div>
            <div className="p-2 bg-white/10 rounded-xl">
              <PlusCircle className="h-6 w-6" />
            </div>
          </div>
          <p className="text-xs text-white/80 max-w-md leading-relaxed mt-2">
            Upload a photo of potholes, garbage, or broken lights. Our AI will automatically categorize and route it to the right department.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/95 mt-4 group-hover:gap-2.5 transition-all">
            <span>Start Report Flow</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* AI Routing Highlight Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Smart Assistant
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mt-3">AI-Assisted Processing</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              CivicFix uses computer vision to detect categories, suggest priorities, and prevent duplicates in nearby areas.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard 
            title="Total Reports" 
            value={stats.total} 
            icon={FileText} 
            scheme="total"
          />
          <StatCard 
            title="Pending" 
            value={stats.pending} 
            icon={Clock} 
            scheme="pending"
          />
          <StatCard 
            title="In Progress" 
            value={stats.inProgress} 
            icon={TrendingUp} 
            scheme="progress"
          />
          <StatCard 
            title="Resolved" 
            value={stats.resolved} 
            icon={CheckCircle} 
            scheme="resolved"
          />
        </div>
      )}

      {/* Recent Complaints Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 font-display">Your Recent Complaints</h2>
          {recentComplaints.length > 0 && (
            <Link 
              to="/complaints" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              <span>View All Complaints</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentComplaints.length === 0 ? (
          <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl">
            <p className="text-sm text-slate-400">You haven't reported any civic issues yet.</p>
            <Button onClick={() => navigate('/report')} variant="primary" size="sm" className="mt-3">
              Report your first issue
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recentComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Dashboard;
