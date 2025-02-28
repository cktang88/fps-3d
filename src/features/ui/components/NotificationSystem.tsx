import { useState, useEffect } from "react";
import { create } from "zustand";

// Types of notifications
export type NotificationType = "info" | "success" | "warning" | "error" | "achievement";

// Notification object
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // in milliseconds
  icon?: string;
  created: number; // timestamp
}

// Store for notifications
interface NotificationStore {
  notifications: Notification[];
  add: (
    message: string,
    type?: NotificationType,
    duration?: number,
    icon?: string
  ) => void;
  remove: (id: string) => void;
  clear: () => void;
}

// Create notification store
export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  
  add: (
    message, 
    type = "info", 
    duration = 3000, 
    icon
  ) => {
    const id = Date.now().toString();
    
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id,
          type,
          message,
          duration,
          icon,
          created: Date.now(),
        },
      ],
    }));
    
    // Auto-remove after duration (if not 0 = permanent)
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },
  
  remove: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clear: () => {
    set({ notifications: [] });
  },
}));

// Notification component
export function NotificationSystem() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.remove);
  
  // Get icon based on notification type
  const getIcon = (type: NotificationType, customIcon?: string) => {
    if (customIcon) return customIcon;
    
    switch (type) {
      case "info":
        return "ℹ️";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "achievement":
        return "🏆";
      default:
        return "";
    }
  };
  
  // Get background color based on notification type
  const getBackgroundColor = (type: NotificationType) => {
    switch (type) {
      case "info":
        return "bg-blue-900 border-blue-700";
      case "success":
        return "bg-green-900 border-green-700";
      case "warning":
        return "bg-yellow-900 border-yellow-700";
      case "error":
        return "bg-red-900 border-red-700";
      case "achievement":
        return "bg-purple-900 border-purple-700";
      default:
        return "bg-gray-900 border-gray-700";
    }
  };

  return (
    <div className="fixed top-4 right-4 flex flex-col items-end space-y-2 z-50 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getBackgroundColor(
            notification.type
          )} border p-3 rounded-lg shadow-lg flex items-center text-white transform transition-all duration-300 ease-in-out animate-slide-in`}
          style={{ maxWidth: "100%" }}
        >
          <span className="mr-2">{getIcon(notification.type, notification.icon)}</span>
          <p className="flex-grow">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-2 text-white opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
