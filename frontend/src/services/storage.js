import { mockComplaints, mockNotifications, mockNearbyIssues, mockUser } from '../data/mockData';

const KEYS = {
  COMPLAINTS: 'civicfix_complaints',
  NOTIFICATIONS: 'civicfix_notifications',
  NEARBY: 'civicfix_nearby',
  USER: 'civicfix_user'
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
};

// Auto run on load to initialize mock database
initializeStorage();

export const getFromStorage = (key) => {
  const actualKey = KEYS[key];
  if (!actualKey) return null;
  return JSON.parse(localStorage.getItem(actualKey));
};

export const saveToStorage = (key, data) => {
  const actualKey = KEYS[key];
  if (!actualKey) return;
  localStorage.setItem(actualKey, JSON.stringify(data));
};
