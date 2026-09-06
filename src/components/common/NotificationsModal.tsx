import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, CheckCircle2, AlertTriangle, Info, Calendar } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, currentUser, markNotificationAsRead } = useApp();

  if (!isOpen) return null;

  const myNotifications = notifications.filter((n) => n.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Bildirimler</h3>
              <p className="text-[11px] text-slate-500">{myNotifications.length} bildirim</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {myNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Henüz yeni bir bildiriminiz bulunmuyor.
            </div>
          ) : (
            myNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 transition-colors cursor-pointer text-xs ${
                  notif.isRead ? 'bg-white hover:bg-slate-50 opacity-75' : 'bg-blue-50/50 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-900">{notif.title}</span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-slate-600 mt-1">{notif.message}</p>
                <div className="text-[10px] text-slate-400 mt-2">
                  {new Date(notif.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
