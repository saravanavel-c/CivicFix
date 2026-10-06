import { getFromStorage, saveToStorage } from './storage';

// Helper to simulate network latency
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Department category mapping
const categoryDeptMap = {
  'Road': 'Road Maintenance',
  'Sanitation': 'Sanitation',
  'Water': 'Water Supply',
  'Electricity': 'Electrical',
  'Drainage': 'Drainage'
};

export const complaintService = {
  async getMyComplaints() {
    await delay();
    return getFromStorage('COMPLAINTS') || [];
  },

  async getComplaintById(id) {
    await delay();
    const complaints = getFromStorage('COMPLAINTS') || [];
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return null;

    // Attach worker assignments
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};
    const compAssignment = assignments[id] || { workerIds: [], updates: [] };
    const allWorkers = getFromStorage('WORKERS') || [];
    
    const assignedWorkers = allWorkers.filter(w => compAssignment.workerIds.includes(w.id));

    return {
      ...complaint,
      workerIds: compAssignment.workerIds,
      assignedWorkers,
      workerUpdates: compAssignment.updates || []
    };
  },

  async createComplaint(data) {
    await delay(600);
    const complaints = getFromStorage('COMPLAINTS') || [];
    
    const nextNum = complaints.reduce((max, c) => {
      const num = parseInt(c.id.split('-')[1]);
      return num > max ? num : max;
    }, 1025) + 1;
    
    const newId = `CIV-${nextNum}`;
    
    const newComplaint = {
      id: newId,
      category: data.category || 'Road',
      description: data.description,
      location: data.location || 'Coimbatore',
      latitude: data.latitude || '11.0168',
      longitude: data.longitude || '76.9558',
      dateReported: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      priority: data.priority || 'Medium',
      status: 'Submitted',
      assignedDepartment: categoryDeptMap[data.category] || 'Road Maintenance',
      image: data.image || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80',
      // IDs of existing complaints this one was flagged as a possible duplicate of
      // (set by the AI triage step in ReportIssue.jsx) - empty array if none found
      possibleDuplicateOf: data.possibleDuplicateOf || [],
      timeline: [
        { status: 'Submitted', timestamp: new Date().toLocaleString('en-US', { hour12: true }), completed: true },
        { status: 'Acknowledged', timestamp: null, completed: false },
        { status: 'Assigned', timestamp: null, completed: false },
        { status: 'In Progress', timestamp: null, completed: false },
        { status: 'Resolved', timestamp: null, completed: false }
      ],
      authorityUpdate: 'Complaint received and queued for review by municipal authorities.',
      resolution: null,
      feedback: null
    };

    complaints.unshift(newComplaint);
    saveToStorage('COMPLAINTS', complaints);

    const notifications = getFromStorage('NOTIFICATIONS') || [];
    const newNotif = {
      id: `notif-${Date.now()}`,
      complaintId: newId,
      title: "Complaint Submitted Successfully",
      message: `Your complaint ${newId} has been successfully logged.`,
      type: "info",
      timestamp: "Just now",
      read: false
    };
    notifications.unshift(newNotif);
    saveToStorage('NOTIFICATIONS', notifications);

    return newComplaint;
  },

  async submitFeedback(id, feedbackData) {
    await delay();
    const complaints = getFromStorage('COMPLAINTS') || [];
    const index = complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      complaints[index].feedback = {
        rating: feedbackData.rating,
        comments: feedbackData.comments
      };
      saveToStorage('COMPLAINTS', complaints);
      return complaints[index];
    }
    throw new Error('Complaint not found');
  },

  async getDashboardStats() {
    await delay(150);
    const complaints = getFromStorage('COMPLAINTS') || [];
    
    let total = complaints.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;

    complaints.forEach(c => {
      if (c.status === 'Resolved') {
        resolved++;
      } else if (c.status === 'In Progress') {
        inProgress++;
      } else if (['Submitted', 'Acknowledged', 'Assigned'].includes(c.status)) {
        pending++;
      }
    });

    return { total, pending, inProgress, resolved };
  },

  // --- Department User Specific Services ---
  async getDepartmentComplaints(deptName = 'Road Maintenance') {
    await delay(200);
    const complaints = getFromStorage('COMPLAINTS') || [];
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};

    // Filter complaints matching department name or category
    const deptComplaints = complaints.filter(c => {
      if (deptName === 'Road Maintenance' && (c.category === 'Road' || c.assignedDepartment.includes('Road'))) return true;
      if (deptName === 'Sanitation' && (c.category === 'Sanitation' || c.assignedDepartment.includes('Sanitation') || c.assignedDepartment.includes('Waste'))) return true;
      if (deptName === 'Water Supply' && (c.category === 'Water' || c.assignedDepartment.includes('Water'))) return true;
      if (deptName === 'Electrical' && (c.category === 'Electricity' || c.assignedDepartment.includes('Electricity') || c.assignedDepartment.includes('Lighting'))) return true;
      if (deptName === 'Drainage' && (c.category === 'Drainage' || c.assignedDepartment.includes('Sewerage') || c.assignedDepartment.includes('Drainage'))) return true;
      return true; // Default fallback to ensure display
    });

    return deptComplaints.map(c => {
      const compAssignment = assignments[c.id] || { workerIds: [], updates: [] };
      return {
        ...c,
        workersAssignedCount: compAssignment.workerIds.length,
        workerIds: compAssignment.workerIds
      };
    });
  },

  async getDepartmentStats(deptName = 'Road Maintenance') {
    await delay(150);
    const deptComplaints = await this.getDepartmentComplaints(deptName);
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};
    
    const arised = Math.max(48, deptComplaints.length + 40);
    let assigned = 31;
    let resolved = 17;

    deptComplaints.forEach(c => {
      const compAssignment = assignments[c.id];
      if (compAssignment && compAssignment.workerIds.length > 0) {
        assigned++;
      }
      if (c.status === 'Resolved') {
        resolved++;
      }
    });

    return {
      complaintsArised: arised,
      assignedToWorkers: assigned,
      resolved: resolved
    };
  },

  async assignWorkerToComplaint(complaintId, workerIds) {
    await delay(300);
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};
    
    const existing = assignments[complaintId] || { workerIds: [], updates: [] };
    assignments[complaintId] = {
      ...existing,
      workerIds: workerIds
    };
    saveToStorage('WORKER_ASSIGNMENTS', assignments);

    // Update complaint status to Assigned if currently Submitted/Acknowledged
    const complaints = getFromStorage('COMPLAINTS') || [];
    const index = complaints.findIndex(c => c.id === complaintId);
    if (index !== -1) {
      if (['Submitted', 'Acknowledged'].includes(complaints[index].status)) {
        complaints[index].status = 'Assigned';
        const assignedTimeline = complaints[index].timeline.find(t => t.status === 'Assigned');
        if (assignedTimeline) {
          assignedTimeline.completed = true;
          assignedTimeline.timestamp = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
      }
      saveToStorage('COMPLAINTS', complaints);
    }

    return assignments[complaintId];
  },

  // --- Worker Specific Services ---
  async getWorkerAllocatedComplaints(workerId = 'WRK-001') {
    await delay(200);
    const complaints = getFromStorage('COMPLAINTS') || [];
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};

    const allocatedList = [];

    complaints.forEach(c => {
      const compAssignment = assignments[c.id];
      if (compAssignment && compAssignment.workerIds.includes(workerId)) {
        allocatedList.push({
          ...c,
          workerIds: compAssignment.workerIds,
          workerUpdates: compAssignment.updates || []
        });
      }
    });

    // If no assigned complaints found for mock demo, allocate CIV-1024 and CIV-1011 to WRK-001
    if (allocatedList.length === 0 && (workerId === 'WRK-001' || workerId.startsWith('WRK'))) {
      const fallbackIds = ['CIV-1024', 'CIV-1011', 'CIV-1012'];
      return complaints.filter(c => fallbackIds.includes(c.id));
    }

    return allocatedList;
  },

  async updateWorkByWorker(complaintId, { workerId, workerName, status, remarks, image }) {
    await delay(400);
    const complaints = getFromStorage('COMPLAINTS') || [];
    const assignments = getFromStorage('WORKER_ASSIGNMENTS') || {};

    const compIndex = complaints.findIndex(c => c.id === complaintId);
    if (compIndex === -1) throw new Error('Complaint not found');

    const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Update status in complaints state
    const newStatus = status === 'Completed' ? 'Resolved' : 'In Progress';
    complaints[compIndex].status = newStatus;
    complaints[compIndex].authorityUpdate = `Worker Update (${workerName || 'Assigned Worker'}): ${remarks}`;

    // Update timeline
    const inProgressTimeline = complaints[compIndex].timeline.find(t => t.status === 'In Progress');
    if (inProgressTimeline) {
      inProgressTimeline.completed = true;
      inProgressTimeline.timestamp = inProgressTimeline.timestamp || timestamp;
    }

    if (newStatus === 'Resolved') {
      const resolvedTimeline = complaints[compIndex].timeline.find(t => t.status === 'Resolved');
      if (resolvedTimeline) {
        resolvedTimeline.completed = true;
        resolvedTimeline.timestamp = timestamp;
      }
      complaints[compIndex].resolution = {
        beforeImage: complaints[compIndex].image,
        afterImage: image || 'https://images.unsplash.com/photo-1605281317010-fe5fed77a941?w=600&auto=format&fit=crop&q=80',
        description: remarks,
        resolvedDate: timestamp
      };
    }

    saveToStorage('COMPLAINTS', complaints);

    // Record update in worker assignments
    const existingAssignment = assignments[complaintId] || { workerIds: [workerId || 'WRK-001'], updates: [] };
    const newUpdateLog = {
      workerId: workerId || 'WRK-001',
      workerName: workerName || 'Arun Kumar',
      status: status,
      remarks: remarks,
      timestamp: timestamp,
      image: image || null
    };

    assignments[complaintId] = {
      ...existingAssignment,
      updates: [newUpdateLog, ...(existingAssignment.updates || [])]
    };

    saveToStorage('WORKER_ASSIGNMENTS', assignments);

    return complaints[compIndex];
  }
};