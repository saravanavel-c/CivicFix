/**
 * notificationService.js
 *
 * In-app notification management.
 * Stored in localStorage for now; Supabase Realtime integration is deferred (P2).
 */
import { getFromStorage, saveToStorage } from './storage';

export const notificationService = {

  async getNotifications() {
    return getFromStorage('NOTIFICATIONS') || [];
  },

  async markAsRead(notifId) {
    const notifications = getFromStorage('NOTIFICATIONS') || [];
    const idx = notifications.findIndex(n => n.id === notifId);
    if (idx !== -1) {
      notifications[idx].read = true;
      saveToStorage('NOTIFICATIONS', notifications);
    }
    return notifications;
  },

  async markAllAsRead() {
    const notifications = (getFromStorage('NOTIFICATIONS') || []).map(n => ({ ...n, read: true }));
    saveToStorage('NOTIFICATIONS', notifications);
    return notifications;
  },

  async getUnreadCount() {
    const notifications = getFromStorage('NOTIFICATIONS') || [];
    return notifications.filter(n => !n.read).length;
  },

  /**
   * Add a notification programmatically (used by complaintService after submission).
   */
  async addNotification({ complaintId, title, message, type = 'info' }) {
    const notifications = getFromStorage('NOTIFICATIONS') || [];
    const newNotif = {
      id:          `notif-${Date.now()}`,
      complaintId,
      title,
      message,
      type,
      timestamp:   'Just now',
      read:        false,
    };
    notifications.unshift(newNotif);
    saveToStorage('NOTIFICATIONS', notifications);
    return newNotif;
  },
};
