import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { getNotifications } from '../api/notification.api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useSocket = () => {
  const socketRef = useRef(null);
  const { user, token } = useAuthStore();
  const { addNotification, setNotifications } = useNotificationStore();

  useEffect(() => {
    // Only connect if user is logged in
    if (!user || !token) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        if (data.success) {
          setNotifications(data.data);
        }
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };
    fetchNotifications();

    // Connect to Socket.IO
    socketRef.current = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Allow fallback
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected');
      // No need to emit join if server handles it, but let's join just in case 
      // (Actually, the backend might expect a join event or handle it via session cookie)
      // Wait, backend code io.on('connection') just logs it, it doesn't do a join!
      // But wait! In webhook.routes.js I used `io.to(userId.toString()).emit(...)`
      // That means the user's socket MUST join a room with their userId!
      socket.emit('join', user.id);
    });

    socket.on('notification', (notification) => {
      // Add to store
      const newNotif = {
        _id: Date.now().toString(), // temporary id if not from db
        userId: user.id,
        read: false,
        createdAt: new Date().toISOString(),
        ...notification
      };
      addNotification(newNotif);
      
      // Show toast
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-card shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-foreground">
                  New Notification
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      ));
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token, addNotification, setNotifications]);

  return socketRef.current;
};

export default useSocket;
