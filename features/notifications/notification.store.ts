import { create } from 'zustand';
import { initialNotifications } from './notification.data';
import { NotificationItem, NotificationCategory } from './notification.types';

interface NotificationState {
  notifications: NotificationItem[];
  filterTab: "All" | NotificationCategory;
  showUnreadOnly: boolean;
  
  setFilterTab: (tab: "All" | NotificationCategory) => void;
  toggleShowUnreadOnly: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  filterTab: "All",
  showUnreadOnly: false,

  setFilterTab: (tab) => set({ filterTab: tab }),
  
  toggleShowUnreadOnly: () => set((state) => ({ showUnreadOnly: !state.showUnreadOnly })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => 
      n.id === id ? { ...n, isRead: true, isNew: false } : n
    )
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true, isNew: false }))
  })),
}));