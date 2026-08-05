import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Notification } from '../types';
import { fallbackDb } from '../lib/supabase';

interface NotificationBellProps {
  userEmail: string;
}

export default function NotificationBell({ userEmail }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const [notifs, count] = await Promise.all([
      fallbackDb.getNotifications(),
      fallbackDb.getUnreadCount(),
    ]);
    setNotifications(notifs);
    setUnreadCount(count);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [userEmail]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await fallbackDb.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await fallbackDb.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'withdrawal_request': return '💸';
      case 'withdrawal_approved': return '✅';
      case 'withdrawal_rejected': return '❌';
      case 'new_rating': return '⭐';
      case 'new_message': return '💬';
      case 'order_assigned': return '📋';
      case 'payment_approved': return '💰';
      default: return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-amber-500 text-[9px] font-bold text-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-amber-500 hover:text-amber-400 font-bold cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">No notifications yet</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className={`p-3 border-b border-slate-800/50 flex gap-3 cursor-pointer transition-colors ${
                    n.read ? 'opacity-60 hover:bg-slate-800/30' : 'bg-slate-800/20 hover:bg-slate-800/40'
                  }`}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                >
                  <span className="text-lg shrink-0">{getTypeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[9px] text-slate-600 mt-1 font-mono">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
