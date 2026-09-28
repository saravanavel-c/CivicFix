import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  Check, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { userService } from '../services/userService';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { LoadingState } from '../components/common/LoadingState';

export const WorkerDashboard = () => {
  const [workerProfile, setWorkerProfile] = useState(null);
  const [allocatedWorks, setAllocatedWorks] = useState([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [workStatus, setWorkStatus] = useState('In Progress');
  const [remarks, setRemarks] = useState('');
  const [completionImage, setCompletionImage] = useState('https://images.unsplash.com/photo-1605281317010-fe5fed77a941?w=600&auto=format&fit=crop&q=80');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadWorkerData = async () => {
    setIsLoading(true);
    try {
      const u = await userService.getUserProfile();
      setWorkerProfile(u);

      const works = await complaintService.getWorkerAllocatedComplaints(u?.id || 'WRK-001');
      setAllocatedWorks(works);

      if (works.length > 0) {
        setSelectedComplaintId(works[0].id);
        const fullDetails = await complaintService.getComplaintById(works[0].id);
        setSelectedComplaint(fullDetails);
      }
    } catch (err) {
      console.error("Failed to load worker allocated works:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerData();
  }, []);

  const handleSelectChange = async (e) => {
    const cId = e.target.value;
    setSelectedComplaintId(cId);
    if (cId) {
      const fullDetails = await complaintService.getComplaintById(cId);
      setSelectedComplaint(fullDetails);
    } else {
      setSelectedComplaint(null);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    setIsSubmitting(true);
    try {
      await complaintService.updateWorkByWorker(selectedComplaintId, {
        workerId: workerProfile?.id || 'WRK-001',
        workerName: workerProfile?.name || 'Arun Kumar',
        status: workStatus,
        remarks: remarks,
        image: completionImage
      });

      setToastType('success');
      setToastMessage('Work update submitted successfully.');
      setRemarks('');
      
      // Reload list to update status & pending count
      loadWorkerData();
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to submit work update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingWorksCount = allocatedWorks.filter(w => w.status !== 'Resolved').length;

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
            Field Worker Portal
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight mt-1">
            Worker Task Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <strong>{workerProfile?.name || 'Arun Kumar'}</strong> ({workerProfile?.department || 'Road Maintenance'}).
          </p>
        </div>
      </div>

      {/* 1. Pending Works Count Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Works</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-extrabold text-slate-900 font-display">{pendingWorksCount}</p>
            <span className="text-xs text-slate-400">allocated work orders remaining</span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium">Assigned by Department Lead</p>
        </div>
        <div className="h-14 w-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
          <Wrench className="h-7 w-7" />
        </div>
      </div>

      {/* 2. Update Work Form Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 font-display">Update Work Order Status</h2>
          <p className="text-xs text-slate-400">Select an assigned complaint to record inspection progress or submit completion proof.</p>
        </div>

        <form onSubmit={handleUpdateSubmit} className="space-y-6">
          {/* Select Allocated Work Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Allocated Work
            </label>
            <div className="relative">
              <select
                value={selectedComplaintId}
                onChange={handleSelectChange}
                required
                className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium text-slate-800 appearance-none cursor-pointer"
              >
                {allocatedWorks.length === 0 ? (
                  <option value="">No works currently allocated</option>
                ) : (
                  allocatedWorks.map((work) => (
                    <option key={work.id} value={work.id}>
                      {work.id} - {work.description.slice(0, 50)}... ({work.status})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Selected Complaint Details Display Card */}
          {selectedComplaint && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded">
                    {selectedComplaint.id}
                  </span>
                  <span className="text-xs font-bold text-white bg-slate-700 px-2.5 py-0.5 rounded-full">
                    {selectedComplaint.category}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedComplaint.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {selectedComplaint.priority} Priority
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">{selectedComplaint.description}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedComplaint.location}</span>
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/40">
                <span className="text-slate-400">Current Work Status:</span>
                <span className="font-bold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-100">
                  ● {selectedComplaint.status}
                </span>
              </div>
            </div>
          )}

          {/* 3. Work Update Input Fields */}
          {selectedComplaint && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Work Status Choice */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Update Work Status
                  </label>
                  <select
                    value={workStatus}
                    onChange={(e) => setWorkStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
                  >
                    <option value="In Progress">In Progress (Execution Started)</option>
                    <option value="Completed">Completed (Work Finished)</option>
                  </select>
                </div>

                {/* Completion Image Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Upload Completion Proof Image URL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={completionImage}
                      onChange={(e) => setCompletionImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Work Description / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work Description / Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe repair actions performed, materials applied, or site condition..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 leading-relaxed font-medium"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  icon={CheckCircle2}
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting Work Update...' : 'Update Work'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>

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

export default WorkerDashboard;
