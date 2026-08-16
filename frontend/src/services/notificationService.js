import { getFromStorage, saveToStorage } from './storage';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const notificationService = {
  async getNotifications() {
    await delay();
    return getFromStorage('NOTIFICATIONS');
  },

  async markAsRead(id) {
    await delay(100);
    const notifications = getFromStorage('NOTIFICATIONS');
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      saveToStorage('NOTIFICATIONS', notifications);
    }
    return notifications;
  },

  async markAllAsRead() {
    await delay(200);
    const notifications = getFromStorage('NOTIFICATIONS');
    notifications.forEach(n => n.read = true);
    saveToStorage('NOTIFICATIONS', notifications);
    return notifications;
  },

  async getUnreadCount() {
    const notifications = getFromStorage('NOTIFICATIONS') || [];
    return notifications.filter(n => !n.read).length;
  }
};
