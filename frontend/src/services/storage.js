import { mockComplaints, mockNotifications, mockNearbyIssues, mockUser } from '../data/mockData';
import { initialDepartmentUsers, initialWorkers, initialCitizens } from '../data/mockUsers';

const KEYS = {
  COMPLAINTS: 'civicfix_complaints',
  NOTIFICATIONS: 'civicfix_notifications',
  NEARBY: 'civicfix_nearby',
  USER: 'civicfix_user',
  DEPT_USERS: 'civicfix_dept_users',
  WORKERS: 'civicfix_workers',
  CITIZENS: 'civicfix_citizens',
  ROLE: 'civicfix_role',
  WORKER_ASSIGNMENTS: 'civicfix_worker_assignments'
};

export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.COMPLAINTS)) {
    localStorage.setItem(KEYS.COMPLAINTS, JSON.stringify(mockComplaints));
  }
  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(mockNotifications));
  }
  if (!localStorage.getItem(KEYS.NEARBY)) {
    localStorage.setItem(KEYS.NEARBY, JSON.stringify(mockNearbyIssues));
  }
  if (!localStorage.getItem(KEYS.USER)) {
    localStorage.setItem(KEYS.USER, JSON.stringify(mockUser));
  }
  if (!localStorage.getItem(KEYS.DEPT_USERS)) {
    localStorage.setItem(KEYS.DEPT_USERS, JSON.stringify(initialDepartmentUsers));
  }
  if (!localStorage.getItem(KEYS.WORKERS)) {
    localStorage.setItem(KEYS.WORKERS, JSON.stringify(initialWorkers));
  }
  if (!localStorage.getItem(KEYS.CITIZENS)) {
    localStorage.setItem(KEYS.CITIZENS, JSON.stringify(initialCitizens));
  }
  if (!localStorage.getItem(KEYS.ROLE)) {
    localStorage.setItem(KEYS.ROLE, JSON.stringify('citizen'));
  }
  if (!localStorage.getItem(KEYS.WORKER_ASSIGNMENTS)) {
    // Initial mock assignments: CIV-1024 assigned to WRK-001 (Arun Kumar) and WRK-002 (Senthil Nathan)
    const initialAssignments = {
      "CIV-1024": {
        workerIds: ["WRK-001", "WRK-002"],
        updates: [
          {
            workerId: "WRK-001",
            workerName: "Arun Kumar",
            status: "In Progress",
            remarks: "Inspection completed. Asphalt patch materials are being arranged for on-site repair.",
            timestamp: "Aug 16, 2026, 11:30 AM",
            image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=80"
          }
        ]
      },
      "CIV-1011": {
        workerIds: ["WRK-005"],
        updates: [
          {
            workerId: "WRK-005",
            workerName: "Dinesh Babu",
            status: "In Progress",
            remarks: "De-clogging vehicle on site. High-pressure jet stream applied.",
            timestamp: "Aug 14, 2026, 11:00 AM",
            image: null
          }
        ]
      }
    };
    localStorage.setItem(KEYS.WORKER_ASSIGNMENTS, JSON.stringify(initialAssignments));
  }
};

// Auto run on load to initialize mock database
initializeStorage();

export const getFromStorage = (key) => {
  const actualKey = KEYS[key];
  if (!actualKey) return null;
  const item = localStorage.getItem(actualKey);
  return item ? JSON.parse(item) : null;
};

export const saveToStorage = (key, data) => {
  const actualKey = KEYS[key];
  if (!actualKey) return;
  localStorage.setItem(actualKey, JSON.stringify(data));
};

