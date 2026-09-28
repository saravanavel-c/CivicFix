import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Image as ImageIcon, 
  Check, 
  X, 
  Building,
  Phone,
  MessageSquare
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { userService } from '../services/userService';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { LoadingState } from '../components/common/LoadingState';

export const DepartmentComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Assign worker modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const c = await complaintService.getComplaintById(id);
      setComplaint(c);

      if (c) {
        setSelectedWorkerIds(c.workerIds || []);
        // Fetch all workers matching department
        const workers = await userService.getAllWorkers(c.assignedDepartment);
        setAvailableWorkers(workers);
      }
    } catch (err) {
      console.error("Failed to load complaint details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleWorker = (wId) => {
    if (selectedWorkerIds.includes(wId)) {
      setSelectedWorkerIds(selectedWorkerIds.filter(i => i !== wId));
    } else {
      setSelectedWorkerIds([...selectedWorkerIds, wId]);
    }
  };

  const handleSaveAssignments = async () => {
    try {
      await complaintService.assignWorkerToComplaint(id, selectedWorkerIds);
      setToastType('success');
      setToastMessage('Workers assigned successfully to complaint.');
      setIsAssignModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to assign workers.');
    }
  };

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  if (!complaint) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Complaint Not Found</h2>
        <p className="text-xs text-slate-400">The requested complaint ID {id} could not be located.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/department/dashboard')}>
          Return to Department Dashboard
        </Button>
      </div>
    );
  }

  const timelineSteps = ['Submitted', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved'];
  const currentStepIndex = timelineSteps.indexOf(complaint.status);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Navigation Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/department/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Active Complaints</span>
        </button>

        <span className="text-xs font-mono font-bold text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1 rounded-xl">
          ID: {complaint.id}
        </span>
      </div>

      {/* =========================================================================
          SECTION 1 — COMPLAINT INFORMATION
         ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white bg-primary-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {complaint.category}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                complaint.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {complaint.priority} Priority
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                ● {complaint.status}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
              {complaint.description.slice(0, 90)}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-700">{complaint.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Reported on {complaint.dateReported}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1 Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Description */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Complaint Summary & Details</h3>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                {complaint.description}
              </p>
            </div>

            {/* Map Placeholder Location Visual */}
            <div className="bg-slate-100 border border-slate-200/80 rounded-2xl p-4 h-48 relative overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="absolute inset-0 bg-slate-50 opacity-90">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e2e8f0" strokeWidth="24" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#e2e8f0" strokeWidth="24" />
                </svg>
              </div>
              <div className="relative z-10 space-y-1">
                <div className="h-10 w-10 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">{complaint.location}</p>
                <p className="text-[10px] font-mono text-slate-500">Coordinates: {complaint.latitude}, {complaint.longitude}</p>
              </div>
            </div>
          </div>

          {/* Evidence Image */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Evidence Image</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50 h-56 relative group">
              <img
                src={complaint.image}
                alt="Complaint Evidence"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm">
                Photo Evidence Attached
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2 — ASSIGNED WORKERS
         ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-violet-100">
              Field Execution
            </span>
            <h2 className="text-base font-bold text-slate-900 font-display mt-1">
              SECTION 2 — Assigned Workers
            </h2>
            <p className="text-xs text-slate-400">
              Department ground crew allocated to inspect and resolve this complaint.
            </p>
          </div>

          <Button
            onClick={() => setIsAssignModalOpen(true)}
            variant="primary"
            icon={UserPlus}
            size="sm"
          >
            Assign Worker
          </Button>
        </div>

        {/* Workers Grid */}
        {complaint.assignedWorkers && complaint.assignedWorkers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaint.assignedWorkers.map((worker) => (
              <div
                key={worker.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-100/70 px-1.5 py-0.5 rounded">
                      {worker.id}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">{worker.name}</h4>
                    <p className="text-[10px] text-slate-400">{worker.department}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[11px] font-medium">{worker.phone}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    ● Working
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <Users className="h-8 w-8 text-slate-300 mx-auto" />
            <div>
              <p className="text-xs font-bold text-slate-700">No Workers Assigned Yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Assign Worker" above to dispatch field crew to this site.</p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 3 — WORK STATUS & TIMELINE
         ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-primary-100">
            Progress Tracking
          </span>
          <h2 className="text-base font-bold text-slate-900 font-display mt-1">
            SECTION 3 — Work Status & Execution Updates
          </h2>
          <p className="text-xs text-slate-400">
            Current stage in the resolution lifecycle and log of ground worker updates.
          </p>
        </div>

        {/* Status Timeline */}
        <div className="py-2">
          <div className="grid grid-cols-5 gap-2 text-center relative">
            {timelineSteps.map((step, idx) => {
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step} className="space-y-2 relative">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                    isPassed
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {isPassed ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <p className={`text-[11px] font-semibold ${isCurrent ? 'text-primary-600 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Worker Logs Display */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <span>Latest Worker Updates & Remarks</span>
          </h3>

          {complaint.workerUpdates && complaint.workerUpdates.length > 0 ? (
            <div className="space-y-3">
              {complaint.workerUpdates.map((upd, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{upd.workerName || 'Worker'}</span>
                      <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                        {upd.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{upd.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    "{upd.remarks}"
                  </p>

                  {upd.image && (
                    <div className="pt-2">
                      <img
                        src={upd.image}
                        alt="Worker Update Proof"
                        className="h-28 rounded-xl border border-slate-200 object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500">
              <strong>Latest Update:</strong> {complaint.authorityUpdate || "Field inspection crew dispatched to site location."}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL: ASSIGN WORKER --- */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Assign Workers to Complaint</h3>
                <p className="text-xs text-slate-400">Select department staff to allocate to {complaint.id}</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {availableWorkers.map((w) => {
                const isSelected = selectedWorkerIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    onClick={() => handleToggleWorker(w.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-500/10'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 shrink-0">
                        <img src={w.avatar} alt={w.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{w.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{w.id}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{w.department}</p>
                      </div>
                    </div>

                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsAssignModalOpen(false)}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAssignments}
                fullWidth
              >
                Confirm Assignment ({selectedWorkerIds.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};

export default DepartmentComplaintDetails;
