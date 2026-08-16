import { getFromStorage, saveToStorage } from './storage';

// Helper to simulate network latency
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const complaintService = {
  async getMyComplaints() {
    await delay();
    return getFromStorage('COMPLAINTS');
  },

  async getComplaintById(id) {
    await delay();
    const complaints = getFromStorage('COMPLAINTS');
    return complaints.find(c => c.id === id) || null;
  },

  async createComplaint(data) {
    await delay(800); // slightly longer for upload simulation
    const complaints = getFromStorage('COMPLAINTS');
    
    // Generate new ID (CIV-1026, CIV-1027, etc.)
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
      assignedDepartment: 'Department of Public Grievances',
      image: data.image || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80',
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

    // Also trigger a notification for user reporting
    const notifications = getFromStorage('NOTIFICATIONS');
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
    const complaints = getFromStorage('COMPLAINTS');
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
    await delay(200);
    const complaints = getFromStorage('COMPLAINTS');
    
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
  }
};
