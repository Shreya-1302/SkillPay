import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.read).length
  }),
  
  addNotification: (notification) => set((state) => {
    const exists = state.notifications.some(n => n._id === notification._id);
    if (exists) return state;
    
    return {
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1)
    };
  }),
  
  markRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n._id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),

  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),
}));

export default useNotificationStore;
