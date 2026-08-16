import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, RefreshCw, AlertCircle, Plus } from 'lucide-react';
import { complaintService } from '../services/complaintService';
import { ComplaintCard } from '../components/common/ComplaintCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';

export const ComplaintsList = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [showAdvanceFilters, setShowAdvanceFilters] = useState(false);

  const navigate = useNavigate();

  const loadComplaints = async () => {
    setIsLoading(true);
    try {
      const list = await complaintService.getMyComplaints();
      setComplaints(list);
      setFilteredComplaints(list);
    } catch (err) {
      console.error("Failed to load complaints list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  // Filter and Search logic
  useEffect(() => {
    let result = [...complaints];

    // Filter by Search Query (ID or Description)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        c => c.id.toLowerCase().includes(query) || c.description.toLowerCase().includes(query) || c.location.toLowerCase().includes(query)
      );
    }

    // Filter by Status
    if (selectedStatus !== 'All') {
      result = result.filter(c => c.status === selectedStatus);
    }

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Filter by Priority
    if (selectedPriority !== 'All') {
      result = result.filter(c => c.priority === selectedPriority);
    }

    // Sorting
    if (sortBy === 'latest') {
      // Since date is Mock string, we sort by parsing or just relative order (our mock IDs are sequential)
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.id.localeCompare(b.id));
    }

    setFilteredComplaints(result);
  }, [searchQuery, selectedStatus, selectedCategory, selectedPriority, sortBy, complaints]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedCategory('All');
    setSelectedPriority('All');
    setSortBy('latest');
  };

  const statuses = ['All', 'Submitted', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved'];
  const categories = ['All', 'Road', 'Sanitation', 'Drainage', 'Water', 'Electricity', 'Other'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner and Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight">
            My Complaints
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View, search, and track the status of your reported grievances.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/report')}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          New Complaint
        </Button>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
            <input
              type="text"
              placeholder="Search by Complaint ID, description, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            {/* Advance Filters Toggle */}
            <Button
              onClick={() => setShowAdvanceFilters(!showAdvanceFilters)}
              variant={showAdvanceFilters ? 'primary' : 'outline'}
              size="md"
              icon={SlidersHorizontal}
            >
              Filters
            </Button>
            
            {/* Reset Button */}
            <Button
              onClick={resetFilters}
              variant="secondary"
              size="md"
              aria-label="Reset filters"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Advance Filters details panel */}
        {showAdvanceFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 animate-scale-up">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500/10"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Priority selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500/10"
              >
                {priorities.map(prio => (
                  <option key={prio} value={prio}>{prio}</option>
                ))}
              </select>
            </div>

            {/* Sort Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500/10"
              >
                <option value="latest">Latest Reported</option>
                <option value="oldest">Oldest Reported</option>
              </select>
            </div>
          </div>
        )}

        {/* Status Filters - Tab style */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 no-scrollbar border-t border-slate-50">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer select-none ${
                selectedStatus === status
                  ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                  : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints Feed List */}
      {isLoading ? (
        <LoadingState type="skeleton" count={4} />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState 
          title={searchQuery || selectedStatus !== 'All' || selectedCategory !== 'All' ? "No Matching Grievances" : "No complaints reported"}
          description={
            searchQuery || selectedStatus !== 'All' || selectedCategory !== 'All' 
              ? "Try adjusting your search terms or filters." 
              : "You haven't reported any civic issues yet. Click the button to file one."
          }
          icon={AlertCircle}
          actionLabel={searchQuery || selectedStatus !== 'All' || selectedCategory !== 'All' ? "Clear Filters" : "Report an Issue"}
          onAction={
            searchQuery || selectedStatus !== 'All' || selectedCategory !== 'All' 
              ? resetFilters 
              : () => navigate('/report')
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
};
export default ComplaintsList;
