import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckSquare, 
  Info, 
  AlertTriangle, 
  PlayCircle,
  Eye,
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';

const iconConfig = {
  info: {
    icon: Info,
    color: 'bg-blue-50 text-blue-600 border-blue-100'
  },
  success: {
    icon: CheckCircle2,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  },
  progress: {
    icon: PlayCircle,
    color: 'bg-amber-50 text-amber-600 border-amber-100'
  },
  error: {
    icon: AlertTriangle,
    color: 'bg-rose-50 text-rose-600 border-rose-100'
  }
};

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const updated = await notificationService.markAsRead(id);
      setNotifications([...updated]);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const updated = await notificationService.markAllAsRead();
      setNotifications([...updated]);
      setShowToast(true);
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleNotificationClick = (item) => {
    handleMarkRead(item.id);
    if (item.complaintId) {
      navigate(`/complaints/${item.complaintId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Stay updated on the progress of your submitted complaints and regional maintenance.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={handleMarkAllRead}
            variant="outline"
            size="sm"
            icon={Check}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState 
          title="You're all caught up"
          description="There are no notifications for your account currently."
          icon={Bell}
        />
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {notifications.map((item) => {
            const config = iconConfig[item.type] || iconConfig.info;
            const Icon = config.icon;
            
            return (
              <div 
                key={item.id}
                className={`p-4 md:p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer group ${
                  !item.read ? 'bg-primary-50/20' : ''
                }`}
                onClick={() => handleNotificationClick(item)}
              >
                {/* Status Indicator Icon */}
                <div className={`p-2.5 rounded-xl border shrink-0 ${config.color} group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="h-5 w-5 stroke-[2]" />
                </div>

                {/* Message Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className={`text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5`}>
                      {item.title}
                      {!item.read && (
                        <span className="h-2 w-2 rounded-full bg-primary-600 animate-pulse"></span>
                      )}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {item.message}
                  </p>
                  
                  {item.complaintId && (
                    <div className="pt-1.5 flex items-center gap-1 text-[10px] font-bold text-primary-600 group-hover:underline">
                      <Eye size={12} />
                      Track ticket {item.complaintId}
                    </div>
                  )}
                </div>

                {/* Inline Mark read button */}
                {!item.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 shrink-0 transition-all cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showToast && (
        <Toast 
          message="All notifications marked as read."
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};
export default Notifications;
