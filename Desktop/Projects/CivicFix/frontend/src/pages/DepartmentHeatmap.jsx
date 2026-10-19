import React, { useState, useEffect } from 'react';
import { 
  Map, 
  MapPin, 
  Filter, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Building2,
  Info
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { LoadingState } from '../components/common/LoadingState';

const categoryColors = {
  Road: 'bg-blue-500 border-blue-600',
  Sanitation: 'bg-emerald-500 border-emerald-600',
  Water: 'bg-sky-500 border-sky-600',
  Drainage: 'bg-amber-500 border-amber-600',
  Electricity: 'bg-purple-500 border-purple-600'
};

export const DepartmentHeatmap = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Mock spatial coordinates mapped to complaint pins
  const areaCoordinates = [
    { x: 35, y: 35 },
    { x: 62, y: 28 },
    { x: 22, y: 68 },
    { x: 74, y: 64 },
    { x: 48, y: 78 },
    { x: 80, y: 38 },
    { x: 28, y: 25 },
    { x: 55, y: 48 }
  ];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await complaintService.getDepartmentComplaints('Road Maintenance');
      setComplaints(list);
      if (list.length > 0) {
        setSelectedIssue(list[0]);
      }
    } catch (err) {
      console.error("Failed to load heatmap data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredComplaints = complaints.filter(c => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (areaFilter !== 'All' && !c.location.toLowerCase().includes(areaFilter.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-100">
          Spatial Distribution
        </span>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight mt-1">
          Department Area Heatmap
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Visualize complaint density clusters and geographical concentration across municipal zones.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Filter className="h-4 w-4 text-primary-600" />
          <span>Heatmap Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value="All">All Categories</option>
              <option value="Road">Road</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Water">Water</option>
              <option value="Drainage">Drainage</option>
              <option value="Electricity">Electricity</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500"
            >
              <option value="All">All Municipal Areas</option>
              <option value="Gandhipuram">Gandhipuram</option>
              <option value="Cross Cut">Cross Cut Road</option>
              <option value="Park">Gandhi Park</option>
              <option value="Ram Nagar">Ram Nagar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visual & Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Grid Canvas Area */}
        <div className="lg:col-span-2 relative h-[420px] lg:h-[500px] bg-slate-100 border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col items-center justify-center">
          
          {/* Map Grid Mockup */}
          <div className="absolute inset-0 bg-slate-50 opacity-95">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 select-none pointer-events-none">
              {/* Heat Density Gradient Radii */}
              <circle cx="35%" cy="35%" r="65" fill="#f43f5e" opacity="0.15" />
              <circle cx="35%" cy="35%" r="35" fill="#f43f5e" opacity="0.25" />

              <circle cx="62%" cy="28%" r="55" fill="#0284c7" opacity="0.15" />
              <circle cx="22%" cy="68%" r="70" fill="#f59e0b" opacity="0.15" />

              {/* Park & Hospital Zones */}
              <rect x="5%" y="10%" width="30%" height="22%" fill="#f0fdf4" rx="16" stroke="#dcfce7" strokeWidth="2" />
              <text x="20%" y="21%" fill="#15803d" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">GANDHI PARK ZONE</text>
              
              <rect x="65%" y="60%" width="28%" height="25%" fill="#f0f7ff" rx="16" stroke="#e0effe" strokeWidth="2" />
              <text x="79%" y="72%" fill="#1d4ed8" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">GP HOSPITAL ZONE</text>

              {/* Major Roads */}
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e2e8f0" strokeWidth="32" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 8" />
              <text x="50%" y="51%" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">MAIN GANDHIPURAM ARTERIAL ROAD</text>

              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#e2e8f0" strokeWidth="32" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 8" />
            </svg>
          </div>

          {/* Interactive Heatmap Issue Pins */}
          {filteredComplaints.map((c, index) => {
            const coords = areaCoordinates[index % areaCoordinates.length];
            const isSelected = selectedIssue && selectedIssue.id === c.id;
            const colorClass = categoryColors[c.category] || 'bg-slate-500';

            return (
              <button
                key={c.id}
                onClick={() => setSelectedIssue(c)}
                className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              >
                <div className="relative">
                  {isSelected && (
                    <span className="absolute -inset-3 bg-primary-500/30 rounded-full animate-ping pointer-events-none"></span>
                  )}
                  
                  <div className={`h-8.5 w-8.5 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md transition-all group-hover:scale-115 ${colorClass} ${
                    isSelected ? 'ring-4 ring-primary-500/20 scale-110' : ''
                  }`}>
                    <MapPin className="h-4 w-4 fill-white/20" />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Legend Overlay */}
          <div className="absolute top-4 left-4 bg-white/90 border border-slate-200/60 p-3 rounded-2xl shadow-sm backdrop-blur-sm space-y-1 text-slate-700 pointer-events-none text-[10px]">
            <p className="font-bold uppercase tracking-wider text-slate-400">Heat Intensity</p>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500"></span>
              <span>High Density Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-sky-500"></span>
              <span>Moderate Concentration</span>
            </div>
          </div>
        </div>

        {/* Selected Issue Preview Card */}
        <div className="lg:col-span-1">
          {selectedIssue ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-md">
                    {selectedIssue.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedIssue.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {selectedIssue.priority} Priority
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mt-3 leading-snug">
                  {selectedIssue.description.slice(0, 80)}
                </h3>

                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedIssue.location}</span>
                </p>

                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-bold text-slate-700">{selectedIssue.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-emerald-600">{selectedIssue.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date Reported:</span>
                    <span className="font-medium text-slate-700">{selectedIssue.dateReported}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <img
                    src={selectedIssue.image}
                    alt="Location Evidence"
                    className="h-32 w-full object-cover rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href={`/department/complaints/${selectedIssue.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer"
                >
                  Inspect Complaint Details
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm text-center py-16 flex flex-col justify-center items-center h-full">
              <Info className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Select a Location Pin</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                Click a heatmap marker to view localized complaint details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentHeatmap;
