import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Building, 
  Clock, 
  Star, 
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { StatusBadge } from '../components/common/StatusBadge';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { LoadingState } from '../components/common/LoadingState';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feedback Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const navigate = useNavigate();

  const loadComplaintDetails = async () => {
    setIsLoading(true);
    try {
      const details = await complaintService.getComplaintById(id);
      setComplaint(details);
    } catch (err) {
      console.error("Failed to load complaint detail:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaintDetails();
  }, [id]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      const updated = await complaintService.submitFeedback(id, {
        rating,
        comments: feedbackText
      });
      setComplaint(updated);
      setShowToast(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  if (!complaint) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl animate-fade-in space-y-4 max-w-md mx-auto mt-10">
        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Complaint Not Found</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          We couldn't find a report with ticket ID {id}. It may have been archived.
        </p>
        <Button onClick={() => navigate('/complaints')} variant="primary" size="sm">
          Go to My Complaints
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back to Complaints Link */}
      <div className="flex items-center gap-2">
        <Link 
          to="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Complaints
        </Link>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details Area: Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Complaint Card Overview */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary-600 bg-primary-50 border border-primary-100/50 px-3 py-1 rounded-lg font-display">
                  {complaint.id}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {complaint.category}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <div className="relative w-full h-64 md:h-80 rounded-2xl bg-slate-100 overflow-hidden border border-slate-150">
              <img 
                src={complaint.image} 
                alt={complaint.category} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-3 left-3 bg-slate-900/60 text-white rounded-lg px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                Before Repair
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Description</h3>
                <p className="text-sm text-slate-700 mt-1.5 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">Location</p>
                    <p className="mt-0.5">{complaint.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">Date Reported</p>
                    <p className="mt-0.5">{complaint.dateReported}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Information & Authority Updates */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-display">Authority Assignment & Updates</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <Building className="h-4.5 w-4.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{complaint.assignedDepartment}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latest Action Update</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  "{complaint.authorityUpdate}"
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Details Section */}
          {complaint.status === 'Resolved' && complaint.resolution && (
            <div className="bg-emerald-50/20 border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-5 animate-scale-up">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-emerald-800 font-display">Resolution Details</h3>
              </div>

              {/* Before/After slider mock layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reported Condition (Before)</span>
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-150">
                    <img src={complaint.resolution.beforeImage} alt="Before" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Resolved Condition (After)</span>
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-100 border border-emerald-100">
                    <img src={complaint.resolution.afterImage} alt="After" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-semibold text-emerald-800">Resolution Description</p>
                <p className="text-slate-600 leading-relaxed p-3.5 bg-white rounded-xl border border-emerald-100/50">
                  {complaint.resolution.description}
                </p>
                <p className="text-slate-400 pt-1">Resolved on: {complaint.resolution.resolvedDate}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Timeline Panel & Citizen Feedback: Right Column */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 font-display">Status Timeline</h3>
            <div className="relative pl-6 space-y-6 border-l border-slate-150">
              {complaint.timeline.map((item, index) => {
                const isCompleted = item.completed;
                const isCurrent = complaint.status === item.status;
                
                return (
                  <div key={index} className="relative">
                    {/* Ring indicator */}
                    <span className={`absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 bg-white transition-all duration-300 ${
                      isCompleted 
                        ? 'border-primary-500 ring-4 ring-primary-50' 
                        : 'border-slate-300'
                    }`}></span>

                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold leading-tight ${
                        isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {item.status}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.timestamp ? item.timestamp : 'Pending update'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Citizen Feedback Star ratings */}
          {complaint.status === 'Resolved' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">Citizen Feedback</h3>
              
              {complaint.feedback ? (
                // Render already submitted feedback
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < complaint.feedback.rating 
                            ? 'text-amber-400 fill-amber-400' 
                            : 'text-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Feedback Details</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      "{complaint.feedback.comments}"
                    </p>
                  </div>
                </div>
              ) : (
                // Render feedback input form
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rating</label>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starValue = i + 1;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRating(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star 
                              className={`h-6 w-6 transition-colors ${
                                starValue <= (hoverRating || rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="comments" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments</label>
                    <textarea
                      id="comments"
                      rows={3}
                      placeholder="Help us improve. Rate the quality of cleanup/repairs..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500/10 resize-none font-medium text-slate-700"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    isLoading={isSubmittingFeedback} 
                    variant="primary" 
                    size="sm"
                    fullWidth
                  >
                    Submit Feedback
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <Toast 
          message="Feedback submitted successfully! Thank you for helping improve the community."
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};
export default ComplaintDetail;
