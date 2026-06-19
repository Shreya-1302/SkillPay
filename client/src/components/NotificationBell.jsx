import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import { markAsRead, markAllRead, clearAll } from '../api/notification.api';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead: storeMarkAll, setNotifications } = useNotificationStore();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    // Mark top notifications as read when opening
    if (!isOpen && unreadCount > 0) {
      notifications.forEach(async (notif) => {
        if (!notif.read && notif._id?.length > 15) {
          try {
            await markAsRead(notif._id);
            markRead(notif._id);
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      storeMarkAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAll();
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  const timeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClearAll}
                  title="Clear all"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <p className="text-sm text-foreground">{notif.message}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {timeAgo(notif.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
