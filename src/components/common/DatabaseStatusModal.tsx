import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MigrationService, MigrationSummary, BackupData } from '../../services/migrationService';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  UploadCloud, 
  RotateCcw, 
  ShieldCheck, 
  Server, 
  FileText,
  X,
  RefreshCw,
  Building2,
  Lock
} from 'lucide-react';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    classes, 
    resources, 
    dailyTasks, 
    studyRecords, 
    users 
  } = useApp();

  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'migration' | 'backup' | 'multitenant'>('status');
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  // RBAC Kontrolü: Yalnızca INSTITUTE_ADMIN (veya sistem geliştirici) bu ekrana erişebilir
  if (currentUser?.role !== 'INSTITUTE_ADMIN') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 text-center animate-in fade-in zoom-in duration-200">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Yetkisiz Erişim Engellendi</h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Veritabanı, PostgreSQL migration ve multi-tenant teknik yönetim ekranına yalnızca <strong>Kurum Yöneticisi (INSTITUTE_ADMIN)</strong> erişebilir.
          </p>
          <div className="mt-5">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Anladım, Kapat
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRunMigration = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = MigrationService.migrateLocalStorageToProduction();
      setMigrationSummary(result.summary);
      setIsRunning(false);
    }, 400);
  };

  const handleExportBackup = () => {
    const backup = MigrationService.createSafetyBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ogrenci_takip_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = () => {
    const success = MigrationService.restoreSafetyBackup();
    if (success) {
      alert('Güvenlik yedeği başarıyla geri yüklendi. Sayfa yenileniyor...');
      window.location.reload();
    } else {
      alert('Geri yüklenebilecek bir yedek snapshot bulunamadı.');
    }
  };

  const handleTestTenantIsolation = () => {
    // Attempt cross-tenant check between Tarhan Koleji (org-1) and Izmir Fen Akademi (org-2)
    const result = MigrationService.verifyMultiTenantIsolation(currentUser.organizationId || 'org-1', 'org-2');
    if (!result.isAllowed) {
      setTestResult(`GÜVENLİK TESTİ BAŞARILI (KORUNDU): ${result.error}`);
    } else {
      setTestResult('İzolasyon hatası: Farklı kuruma izin verildi!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Production Veritabanı & Mimari Paneli</h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  PostgreSQL Hazır
                </span>
              </div>
              <p className="text-xs text-slate-500">FAZ 4 • Multi-Tenant, RBAC & Kalıcı Veri Altyapısı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'status' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sistem & Tablo Durumu
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'migration' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            LocalStorage Migration
          </button>
          <button
            onClick={() => setActiveTab('multitenant')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'multitenant' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Multi-Tenant İzolasyon Testi
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'backup' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Yedekleme & Geri Dönüş
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block mb-1">Kurum (Tenant)</span>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    {currentUser.organizationId === 'org-2' ? 'İzmir Fen Akademi' : 'Tarhan Koleji'}
                  </span>
                  <span className="text-[10px] text-slate-400">ID: {currentUser.organizationId || 'org-1'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block mb-1">Aktif Görevler</span>
                  <span className="text-sm font-bold text-slate-900 block">{dailyTasks.length} Kayıt</span>
                  <span className="text-[10px] text-emerald-600">Soft delete korumalı</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block mb-1">Gerçekleşmeler</span>
                  <span className="text-sm font-bold text-slate-900 block">{studyRecords.length} Kayıt</span>
                  <span className="text-[10px] text-blue-600">Reaktif yayın devrede</span>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-500 block mb-1">Kaynak Havuzu</span>
                  <span className="text-sm font-bold text-slate-900 block">{resources.length} Kaynak</span>
                  <span className="text-[10px] text-purple-600">Arşiv korumalı</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                  <Server className="w-4 h-4 text-blue-700" />
                  PostgreSQL / Supabase Tablo Eşleşmesi (18 Tablo DDL)
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Veritabanı şeması <code>src/db/schema.sql</code> üzerinde normalize edilmiş 18 ilişkisel tablo ile oluşturulmuştur:
                  <code> institutions, users, teachers, classes, students, subjects, resources, resource_topics, student_resources, daily_tasks, task_realizations, student_completed_pages, audit_logs</code>.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Aktif Güvenlik ve RBAC Kuralları
                </h4>
                <ul className="space-y-1.5 text-slate-600 pl-4 list-disc">
                  <li><strong>Öğretmen:</strong> Yalnızca kendi öğrencilerine ve branş derslerine görev atayabilir, arşivlenmiş kaynak kullanamaz.</li>
                  <li><strong>Öğrenci:</strong> Yalnızca kendi görevlerini görür ve kendi gerçekleşmelerini kaydeder.</li>
                  <li><strong>Multi-Tenant:</strong> Farklı kurumlara (institution_id) ait hiçbir veri çapraz görüntülenemez.</li>
                  <li><strong>Duplicate Realization Koruması:</strong> Aynı görev için mükerrer gerçekleşme gönderimi engellenir.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900">LocalStorage &rarr; Production Veritabanı Aktarımı</h4>
                  <p className="text-amber-800 text-xs">
                    Mevcut tarayıcı depolamasındaki tüm öğrenci ilişkileri, kaynaklar, haftalık planlar ve gerçekleşme kayıtları doğrulanarak normalize edilmiş PostgreSQL şemasına haritalanır.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunMigration}
                  disabled={isRunning}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                  {isRunning ? 'Veriler Normalize Ediliyor...' : 'Migration Çalıştır & Doğrula'}
                </button>
              </div>

              {migrationSummary && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Migration Raporu</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      {migrationSummary.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block">Kurumlar:</span>
                      <span className="font-bold text-slate-800">{migrationSummary.counts.institutions}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block">Kullanıcılar:</span>
                      <span className="font-bold text-slate-800">{migrationSummary.counts.users}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block">Görevler:</span>
                      <span className="font-bold text-slate-800">{migrationSummary.counts.dailyTasks}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block">Gerçekleşmeler:</span>
                      <span className="font-bold text-slate-800">{migrationSummary.counts.taskRealizations}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block">Kaynaklar:</span>
                      <span className="font-bold text-slate-800">{migrationSummary.counts.resources}</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500 block">Sınıflar:</span>
                      <span className="font-bold text-slate-800">{migrationSummary.counts.classes}</span>
                    </div>
                  </div>
                  {migrationSummary.validationErrors.length === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-700 text-xs pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Tüm yabancı anahtar (FK) ilişkileri ve gerçekleşme kayıtları eksiksiz doğrulandı.
                    </div>
                  ) : (
                    <div className="p-2 bg-rose-50 text-rose-800 text-[11px] rounded space-y-1">
                      {migrationSummary.validationErrors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'multitenant' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Multi-Tenant Kurum İzolasyonu Kuralı (TEST 11)
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Her kullanıcı bir <code>institution_id</code> üzerinden kendi kurumuna bağlanır. Bir kurumun kullanıcısı başka kurumun verisini göremez, düzenleyemez ve kopyalayamaz.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Mevcut Oturum Açmış Kurum:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {currentUser.organizationId === 'org-2' ? 'İzmir Fen Akademi (org-2)' : 'Tarhan Koleji (org-1)'}
                    </span>
                  </div>
                  <button
                    onClick={handleTestTenantIsolation}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Çapraz İzolasyon Testini Çalıştır
                  </button>
                </div>

                {testResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{testResult}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  Veri Kaybı Önleme ve Geri Alma (Rollback Snapshot)
                </div>
                <p className="text-slate-600 text-xs">
                  Büyük değişiklikler öncesinde veya sonrasında tüm durumun tam bir JSON yedeğini alabilir, gerektiğinde tek tıkla geri yükleyebilirsiniz.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 text-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  JSON Snapshot İndir
                </button>
                <button
                  onClick={handleRestoreBackup}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium flex items-center gap-2 text-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  Son Snapshot'a Geri Dön (Rollback)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-medium text-xs transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
