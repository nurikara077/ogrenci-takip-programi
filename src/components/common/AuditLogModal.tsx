import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  History, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  FileText 
} from 'lucide-react';
import { AuditLog } from '../../types';
import { formatDateTR } from '../../utils/dateUtils';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskIdFilter?: string;
  studentIdFilter?: string;
  title?: string;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  taskIdFilter,
  studentIdFilter,
  title = 'İşlem ve Değişiklik Geçmişi (Audit Logs)',
}) => {
  const { auditLogs, users, dailyTasks } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    if (taskIdFilter && log.targetId !== taskIdFilter) return false;
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNote = log.note?.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchActor = log.actorName?.toLowerCase().includes(q);
      const matchTarget = log.targetId.toLowerCase().includes(q);
      if (!matchNote && !matchAction && !matchActor && !matchTarget) {
        return false;
      }
    }
    return true;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'VERIFY_TASK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Öğretmen Doğruladı (VERIFIED)
          </span>
        );
      case 'REJECT_TASK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Yapılmadı İşaretlendi (REJECTED)
          </span>
        );
      case 'COMPLETE_LATE_TASK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Gecikmeli Tamamlandı (LATE_COMPLETED)
          </span>
        );
      case 'COPY_TASK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            Yeni Güne Kopyalandı (COPY_TASK)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500">
                Tüm doğrulama, reddetme, geç tamamlama ve kopyalama denetim izleri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Not, işlem veya aktör ara..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-auto"
            >
              <option value="ALL">Tüm İşlemler ({auditLogs.length})</option>
              <option value="VERIFY_TASK">Doğrulama (VERIFY_TASK)</option>
              <option value="REJECT_TASK">Yapılmadı (REJECT_TASK)</option>
              <option value="COMPLETE_LATE_TASK">Geç Tamamlama (COMPLETE_LATE_TASK)</option>
              <option value="COPY_TASK">Kopyalama (COPY_TASK)</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Kayıt Bulunamadı</h4>
              <p className="text-xs text-slate-500">
                Seçilen filtrelere veya göreve ait henüz denetim kaydı bulunmuyor.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const task = dailyTasks.find((t) => t.id === log.targetId);
              return (
                <div
                  key={log.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 transition-all hover:border-slate-300"
                >
                  {/* Top line: Badge & Timestamp */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      {task && (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Görev #{log.targetId.slice(-6)} • {task.dayOfWeek} ({task.taskDate})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(log.timestamp).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>

                  {/* Actor and Target info */}
                  <div className="text-xs text-slate-700 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-900">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      İşlemi Yapan: {log.actorName || log.actorId}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">
                      Hedef: <strong>{log.targetType}</strong> ({log.targetId})
                    </span>
                  </div>

                  {/* Previous -> New values transition */}
                  {(log.previousValue !== undefined || log.newValue !== undefined) && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] font-mono flex items-center gap-2">
                      <span className="text-slate-500 font-sans">Değişim:</span>
                      <span className="text-rose-600 line-through font-semibold">
                        {log.previousValue || '(boş)'}
                      </span>
                      <span className="text-slate-400">➔</span>
                      <span className="text-emerald-700 font-bold">
                        {log.newValue || '(boş)'}
                      </span>
                    </div>
                  )}

                  {/* Note / Explanation if provided */}
                  {log.note && (
                    <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-[11px] text-amber-900 uppercase tracking-wide">
                          Açıklama / Sebep Notu:
                        </span>
                        <p className="font-medium italic leading-relaxed">"{log.note}"</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Toplam {filteredLogs.length} denetim kaydı listelendi.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
