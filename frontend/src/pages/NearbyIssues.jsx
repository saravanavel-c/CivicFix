import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  ThumbsUp, 
  AlertCircle, 
  Map,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { nearbyService } from '../services/nearbyService';
import useGeolocation from '../hooks/useGeolocation';
import { LoadingState } from '../components/common/LoadingState';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';

const categoryColors = {
  Road: 'bg-blue-500 border-blue-600',
  Sanitation: 'bg-emerald-500 border-emerald-600',
  Water: 'bg-sky-500 border-sky-600',
  Drainage: 'bg-amber-500 border-amber-600',
  Electricity: 'bg-purple-500 border-purple-600'
};

export const NearbyIssues = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadNearby = async () => {
    setIsLoading(true);
    try {
      const list = await nearbyService.getNearbyIssues();
      setIssues(list);
      // Auto select first issue as default preview
      if (list.length > 0) {
        setSelectedIssue(list[0]);
      }
    } catch (err) {
      console.error("Failed to load nearby issues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNearby();
  }, []);

  const { position, getCurrent, startWatching, stopWatching, watching } = useGeolocation();

  useEffect(() => {
    // Attempt to get a snapshot and then watch for position changes for live display
    getCurrent();
    startWatching();
    return () => stopWatching();
  }, []);

  const handleUpvote = async (id) => {
    try {
      const updated = await nearbyService.upvoteIssue(id);
      
      // Update local state
      setIssues(prev => prev.map(item => item.id === id ? updated : item));
      
      // Update selected preview
      if (selectedIssue && selectedIssue.id === id) {
        setSelectedIssue(updated);
      }

      if (updated.userUpvoted) {
        setToastType('success');
        setToastMessage(`You verified and upvoted: "${updated.title}". This increases department priority.`);
      } else {
        setToastType('info');
        setToastMessage(`Removed your upvote for: "${updated.title}".`);
      }
    } catch (err) {
      console.error("Failed to register upvote:", err);
    }
  };

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight">
          Nearby Civic Issues
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          See reports filed by other citizens in your neighborhood. Confirm and upvote issues to accelerate department processing.
        </p>
      </div>

      {/* Map Layout Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Map Visual Area: Column 1 & 2 */}
        <div className="lg:col-span-2 relative h-[380px] lg:h-[480px] bg-slate-100 border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col items-center justify-center">
          
          {/* Map Grid Mockup */}
          <div className="absolute inset-0 bg-slate-50 opacity-95">
            {/* Roads Layout mock */}
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 select-none pointer-events-none">
              {/* Green Park Area */}
              <rect x="5%" y="10%" width="30%" height="25%" fill="#f0fdf4" rx="20" stroke="#dcfce7" strokeWidth="2" />
              <text x="20%" y="22%" fill="#15803d" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">GANDHI PARK</text>
              
              {/* Hospital Area */}
              <rect x="65%" y="60%" width="25%" height="25%" fill="#f0f7ff" rx="16" stroke="#e0effe" strokeWidth="2" />
              <text x="77%" y="72%" fill="#1d4ed8" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">GP HOSPITAL</text>

              {/* Main Roads */}
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e2e8f0" strokeWidth="32" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 8" />
              <text x="50%" y="51%" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">MAIN SATHY ROAD (2-LANE)</text>

              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#e2e8f0" strokeWidth="32" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 8" />
              <text x="51%" y="85%" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" transform="rotate(-90, 51, 85)">CROSS CUT ROAD</text>
            </svg>
          </div>

          {/* Map Pins markers */}
          {issues.map((issue) => {
            const isSelected = selectedIssue && selectedIssue.id === issue.id;
            const colorClass = categoryColors[issue.category] || 'bg-slate-500';
            
            return (
              <button
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none"
                style={{ left: `${issue.coordinates.x}%`, top: `${issue.coordinates.y}%` }}
              >
                <div className="relative">
                  {/* Pulse Effect for Selected */}
                  {isSelected && (
                    <span className="absolute -inset-2.5 bg-primary-500/30 rounded-full animate-ping pointer-events-none"></span>
                  )}
                  
                  {/* Pin Circle */}
                  <div className={`h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md transition-all group-hover:scale-115 ${colorClass} ${
                    isSelected ? 'ring-4 ring-primary-500/20 scale-110' : ''
                  }`}>
                    <MapPin className="h-4 w-4 fill-white/20" />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Compass overlay */}
          <div className="absolute top-4 right-4 bg-white/80 border border-slate-200/50 p-2.5 rounded-2xl shadow-sm backdrop-blur-sm flex items-center gap-2 pointer-events-none text-slate-500">
            <Map className="h-4.5 w-4.5 text-slate-400" />
            <div className="text-[10px] font-bold uppercase tracking-wider">
              <div>Map Live (Coimbatore)</div>
              {position ? (
                <div className="text-[10px] font-normal text-slate-400 mt-0.5">{`You: ${position.lat.slice(0,8)}, ${position.lng.slice(0,8)}`}</div>
              ) : (
                <div className="text-[10px] font-normal text-slate-400 mt-0.5">Locating…</div>
              )}
            </div>
            {watching && (
              <div className="ml-3 bg-white/90 text-[10px] text-rose-600 px-2 py-1 rounded-full font-semibold">Live</div>
            )}
          </div>
        </div>

        {/* Selected Issue Preview Card: Column 3 */}
        <div className="lg:col-span-1">
          {selectedIssue ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-5 animate-scale-up h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    categoryColors[selectedIssue.category] || 'bg-slate-500'
                  }`}>
                    {selectedIssue.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedIssue.location.split('(')[1]?.replace(')', '') || 'Nearby'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mt-4 leading-tight">
                  {selectedIssue.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedIssue.location.split('(')[0]}
                </p>

                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-4 leading-relaxed font-medium">
                  {selectedIssue.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Affected</p>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{selectedIssue.citizensAffected} citizens</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 shrink-0">
                      <ThumbsUp size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upvotes</p>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{selectedIssue.upvotes}</p>
                    </div>
                  </div>
                </div>

                {/* AI duplicate check display */}
                <div className="p-3.5 bg-violet-50/40 border border-violet-100/50 rounded-2xl flex gap-2.5 items-start mt-5">
                  <Sparkles className="h-4.5 w-4.5 text-violet-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] font-bold text-violet-800 uppercase tracking-wider">Clustering Active</h4>
                    <p className="text-[9px] text-violet-500 leading-relaxed">
                      CivicFix AI will group multiple reports on this coordinate to raise priority.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 border-t border-slate-100 flex gap-2.5 mt-5">
                <Button
                  onClick={() => handleUpvote(selectedIssue.id)}
                  variant={selectedIssue.userUpvoted ? 'success' : 'outline'}
                  size="md"
                  icon={ThumbsUp}
                  fullWidth
                >
                  {selectedIssue.userUpvoted ? 'Upvoted / Verified' : 'Upvote Report'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm text-center py-16 flex flex-col justify-center items-center h-full">
              <Info className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Select an Issue Pin</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                Click a location marker on the map to view details.
              </p>
            </div>
          )}
        </div>
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
export default NearbyIssues;
