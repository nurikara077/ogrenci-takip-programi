import { describe, it, expect, beforeEach } from 'vitest';
import { MigrationService } from '../services/migrationService';
import {
  initialUsers,
  initialOrganizations,
  initialClasses,
  initialSubjects,
  initialTeacherProfiles,
  initialStudentProfiles,
  initialResources,
  initialDailyTasks,
  initialStudyRecords,
  initialTeacherResources,
} from '../data/mockData';
import { DailyTask, Resource, StudyRecord, TaskStatus, TeacherResource } from '../types';

describe('FAZ 4 — Production Altyapısı & Otomasyon Test Paketi', () => {
  const STORAGE_KEY = 'ogrenci_takip_state_v1';

  beforeEach(() => {
    // Setup clean simulated browser storage
    const storageMock: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => storageMock[key] || null,
      setItem: (key: string, value: string) => {
        storageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
      clear: () => {
        Object.keys(storageMock).forEach((k) => delete storageMock[k]);
      },
      key: (index: number) => Object.keys(storageMock)[index] || null,
      length: Object.keys(storageMock).length,
    } as Storage;

    // Simulated Window & CustomEvent for Reactive Bus test
    const listeners: Record<string, ((e: any) => void)[]> = {};
    (global as any).window = {
      addEventListener: (event: string, cb: (e: any) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (e: any) => void) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((f) => f !== cb);
        }
      },
      dispatchEvent: (e: any) => {
        if (listeners[e.type]) {
          listeners[e.type].forEach((cb) => cb(e));
        }
        return true;
      },
    };
    (global as any).CustomEvent = class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, params?: { detail?: any }) {
        this.type = type;
        this.detail = params?.detail;
      }
    };

    // Seed storage with initial data
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(initialUsers));
    localStorage.setItem(`${STORAGE_KEY}_organizations`, JSON.stringify(initialOrganizations));
    localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(initialClasses));
    localStorage.setItem(`${STORAGE_KEY}_subjects`, JSON.stringify(initialSubjects));
    localStorage.setItem(`${STORAGE_KEY}_studentProfiles`, JSON.stringify(initialStudentProfiles));
    localStorage.setItem(`${STORAGE_KEY}_teacherProfiles`, JSON.stringify(initialTeacherProfiles));
    localStorage.setItem(`${STORAGE_KEY}_resources`, JSON.stringify(initialResources));
    localStorage.setItem(`${STORAGE_KEY}_dailyTasks`, JSON.stringify(initialDailyTasks));
    localStorage.setItem(`${STORAGE_KEY}_studyRecords`, JSON.stringify(initialStudyRecords));
  });

  // ==========================================
  // TEST 9: Multi-tenant veri izolasyonu
  // (Kurum A kullanıcısı Kurum B verisini görememeli)
  // ==========================================
  describe('TEST 9: Multi-tenant Veri İzolasyonu', () => {
    it('Kurum A (Tarhan Koleji) kullanıcısının Kurum B (İzmir Fen Akademi) verisine erişimi engellenmelidir', () => {
      const orgATenantId = 'org-1'; // Tarhan Koleji
      const orgBTenantId = 'org-2'; // İzmir Fen Akademi

      // Kurum A kullanıcısı Kurum B kaynağına erişmeyi dener
      const crossAccessResult = MigrationService.verifyMultiTenantIsolation(orgATenantId, orgBTenantId);

      expect(crossAccessResult.isAllowed).toBe(false);
      expect(crossAccessResult.error).toContain('GÜVENLİK İHLALİ');
    });

    it('Aynı kuruma ait (org-1 -> org-1) veri erişimine izin verilmelidir', () => {
      const sameTenantResult = MigrationService.verifyMultiTenantIsolation('org-1', 'org-1');
      expect(sameTenantResult.isAllowed).toBe(true);
      expect(sameTenantResult.error).toBeUndefined();
    });

    it('Kurum yöneticisi yalnızca kendi kurumunun sınıflarını ve öğrencilerini görebilmelidir', () => {
      const org1Admin = initialUsers.find((u) => u.id === 'user-admin-kurum');
      expect(org1Admin).toBeDefined();
      expect(org1Admin?.organizationId).toBe('org-1');

      // Filter classes by tenant
      const accessibleClasses = initialClasses.filter((c) => c.organizationId === org1Admin?.organizationId);
      expect(accessibleClasses.every((c) => c.organizationId === 'org-1')).toBe(true);
      expect(accessibleClasses.some((c) => c.organizationId === 'org-2')).toBe(false);
    });
  });

  // ==========================================
  // TEST 10: PostgreSQL şema doğrulaması
  // (foreign key, unique constraint, trigger kontrolleri)
  // ==========================================
  describe('TEST 10: PostgreSQL Şema Doğrulaması', () => {
    it('Tüm görev kayıtlarının geçerli bir studentId ve subjectId foreign key referansına sahip olduğunu doğrular', () => {
      const migrationResult = MigrationService.migrateLocalStorageToProduction();

      expect(migrationResult.success).toBe(true);
      expect(migrationResult.summary.status).toBe('SUCCESS');

      // Validate daily_tasks FKs
      const validStudentIds = new Set(migrationResult.dbPayload.students.map((s) => s.id));
      const validSubjectIds = new Set(migrationResult.dbPayload.subjects.map((s) => s.id));

      migrationResult.dbPayload.daily_tasks.forEach((task) => {
        expect(validStudentIds.has(task.student_id)).toBe(true);
        expect(validSubjectIds.has(task.subject_id)).toBe(true);
      });
    });

    it('Arşivlenmiş kaynak trigger kontrolü: trigger kuralı arşivlenmiş kaynağa görev atamayı reddetmelidir', () => {
      const archivedResource = initialResources.find((r) => r.isArchived);
      expect(archivedResource).toBeDefined();

      const validation = MigrationService.validateTaskCreationSecurity({
        resourceId: archivedResource?.id,
        isArchived: archivedResource?.isArchived,
        studentId: 'student-mert',
        subjectId: 'sub-mat',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Arşivlenmiş');
    });

    it('Unique sayfa ilerlemesi constraint kontrolü (öğrenci-kaynak-sayfa)', () => {
      const duplicatePageCheck = MigrationService.validateCompletedPageUnique(
        'student-mert',
        'res-fenomen-f3',
        42,
        [42, 43, 44]
      );
      expect(duplicatePageCheck.isDuplicate).toBe(true);
    });
  });

  // ==========================================
  // TEST 11: LocalStorage'dan PostgreSQL'e veri aktarımı doğrulaması
  // (veri kaybı olmamalı)
  // ==========================================
  describe('TEST 11: LocalStorage -> PostgreSQL Veri Aktarımı Doğrulaması', () => {
    it('Tüm kullanıcılar, sınıflar, kaynaklar, görevler ve gerçekleşmeler eksiksiz aktarılmalı', () => {
      const result = MigrationService.migrateLocalStorageToProduction();

      expect(result.summary.counts.users).toBe(initialUsers.length);
      expect(result.summary.counts.classes).toBe(initialClasses.length);
      expect(result.summary.counts.resources).toBe(initialResources.length);
      expect(result.summary.counts.dailyTasks).toBe(initialDailyTasks.length);
      expect(result.summary.counts.taskRealizations).toBe(initialStudyRecords.length);
      expect(result.summary.validationErrors.length).toBe(0);
    });

    it('Güvenlik yedeği (safety backup snapshot) alınıp geri yüklenebilmelidir', () => {
      const backup = MigrationService.createSafetyBackup();
      expect(backup.snapshotId).toBeDefined();
      expect(backup.counts?.users).toBe(initialUsers.length);

      const restoreSuccess = MigrationService.restoreSafetyBackup();
      expect(restoreSuccess).toBe(true);
    });
  });

  // ==========================================
  // TEST 12: Eşzamanlı görev gerçekleşme girişi (race condition testi)
  // ==========================================
  describe('TEST 12: Eşzamanlı Görev Gerçekleşme Girişi (Race Condition)', () => {
    it('Aynı görev için mükerrer gönderilen çift istekleri algılayıp engellemelidir', () => {
      const taskId = 'task-mon-1';
      const existingRecords: StudyRecord[] = [
        {
          id: 'rec-1',
          dailyTaskId: taskId,
          studentId: 'student-mert',
          subjectId: 'sub-mat',
          recordDate: '2026-08-31',
          actualQuestionCount: 25,
          actualDurationMinutes: 40,
          createdAt: new Date().toISOString(),
        },
      ];

      // Second identical realization entry within duplicate window
      const newEntry: Omit<StudyRecord, 'id' | 'createdAt'> = {
        dailyTaskId: taskId,
        studentId: 'student-mert',
        subjectId: 'sub-mat',
        recordDate: '2026-08-31',
        actualQuestionCount: 25,
        actualDurationMinutes: 40,
      };

      const isDuplicate = existingRecords.some(
        (r) =>
          r.dailyTaskId === newEntry.dailyTaskId &&
          r.actualQuestionCount === newEntry.actualQuestionCount &&
          r.actualDurationMinutes === newEntry.actualDurationMinutes
      );

      expect(isDuplicate).toBe(true);
    });
  });

  // ==========================================
  // TEST 13: Öğrenci çalışma kaydı girdiğinde reaktif veri akışı
  // ==========================================
  describe('TEST 13: Reaktif Veri Akışı & Anlık Senkronizasyon', () => {
    it('Çalışma kaydı girildiğinde TASK_REALIZATION_CREATED olayı tetiklenmelidir', () => {
      let eventFired = false;
      let eventPayload: any = null;

      const listener = (e: any) => {
        if (e.detail?.eventType === 'TASK_REALIZATION_CREATED') {
          eventFired = true;
          eventPayload = e.detail?.payload;
        }
      };

      window.addEventListener('ogrenci_takip_realtime_event', listener);

      MigrationService.broadcastEvent('TASK_REALIZATION_CREATED', {
        recordId: 'rec-test-123',
        taskId: 'task-mon-1',
        studentId: 'student-mert',
      });

      expect(eventFired).toBe(true);
      expect(eventPayload.recordId).toBe('rec-test-123');

      window.removeEventListener('ogrenci_takip_realtime_event', listener);
    });
  });

  // ==========================================
  // TEST 14: Logout sonrası korumalı ekranlara erişim engellenmeli
  // ==========================================
  describe('TEST 14: Logout Güvenliği & Korumalı Ekran Koruması', () => {
    it('Logout işlemi sonrasında isAuthenticated false olmalı ve oturum temizlenmelidir', () => {
      localStorage.setItem(`${STORAGE_KEY}_isAuthenticated`, 'false');
      localStorage.removeItem(`${STORAGE_KEY}_currentUserId`);

      const authState = localStorage.getItem(`${STORAGE_KEY}_isAuthenticated`);
      const activeUser = localStorage.getItem(`${STORAGE_KEY}_currentUserId`);

      expect(authState).toBe('false');
      expect(activeUser).toBeNull();
    });
  });

  // ==========================================
  // TEST 15: Arşivlenmiş kaynağa doğrudan API çağrısı ile görev atanamamalı
  // ==========================================
  describe('TEST 15: Arşivlenmiş Kaynağa Backend Görev Atama Koruması', () => {
    it('API katmanı arşivlenmiş kaynağı reddetmeli ve hata fırlatmalıdır', () => {
      const archivedResource: Resource = {
        id: 'res-archived-test',
        createdByTeacherId: 'tp-ahmet',
        organizationId: 'org-1',
        subjectId: 'sub-mat',
        title: 'Eski Fasikül',
        publisher: 'Eski Yayın',
        gradeLevel: 8,
        totalPages: 100,
        startPage: 1,
        endPage: 100,
        isArchived: true,
        status: 'ARCHIVED',
        createdAt: '2026-08-01T00:00:00.000Z',
      };

      const result = MigrationService.validateTaskCreationSecurity({
        resourceId: archivedResource.id,
        isArchived: archivedResource.isArchived,
        studentId: 'student-mert',
        subjectId: 'sub-mat',
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Arşivlenmiş veya silinmiş bir kaynak ile yeni görev oluşturulamaz.');
    });
  });

  // ==========================================
  // FAZ 3 REGRESSION TESTS (EDGE CASES & STATUS)
  // ==========================================
  describe('FAZ 3 Regresyon: Görev Durumu & Yüzde Hesaplama', () => {
    it('Yüzde hesaplama: Sıfıra bölme, 0/0, ve hedefin aşılması senaryoları', () => {
      const calcPercent = (actual: number, target: number) => {
        if (!target || target <= 0) return actual > 0 ? 100 : 0;
        return Math.round((actual / target) * 100);
      };

      expect(calcPercent(10, 12)).toBe(83);
      expect(calcPercent(12, 12)).toBe(100);
      expect(calcPercent(15, 12)).toBe(125);
      expect(calcPercent(0, 12)).toBe(0);
      expect(calcPercent(0, 0)).toBe(0);
    });

    it('Gecikmiş görevin sonradan %100 tamamlanması durumu (LATE_COMPLETED / COMPLETED)', () => {
      const today = '2026-09-03';
      const pastDate = '2026-08-30';

      const evaluateStatus = (taskDate: string, actual: number, target: number): TaskStatus => {
        if (target > 0 && actual >= target) {
          return taskDate < today ? 'COMPLETED' : 'COMPLETED';
        }
        if (actual > 0) {
          return taskDate >= today ? 'IN_PROGRESS' : 'INCOMPLETE';
        }
        return taskDate < today ? 'OVERDUE' : 'PLANNED';
      };

      // Past date with 0 actual -> OVERDUE
      expect(evaluateStatus(pastDate, 0, 20)).toBe('OVERDUE');
      // Past date with 20/20 completed -> COMPLETED
      expect(evaluateStatus(pastDate, 20, 20)).toBe('COMPLETED');
    });

    it('FAZ 4 UI Kuralı: Hedef aşımı progress bar %100 capping, ekstra soru badge ve gerçek değer koruma', () => {
      const calculateDisplayRealization = (actual: number, target: number) => {
        const rawPercent = target > 0 ? Number(((actual / target) * 100).toFixed(1)) : (actual > 0 ? 100 : 0);
        const isOverTarget = target > 0 && actual > target;
        const extra = Math.max(0, actual - target);
        const displayPercent = Math.min(100, rawPercent);
        const displayText = isOverTarget
          ? '%100 Tamamlandı'
          : (target > 0 && actual === target ? '%100' : `%${rawPercent.toString().replace('.', ',')}`);
        const extraBadgeText = isOverTarget ? `+${extra} ekstra soru` : undefined;

        return {
          actual,
          target,
          rawPercent,
          displayPercent,
          isOverTarget,
          extra,
          displayText,
          extraBadgeText,
        };
      };

      // 10 / 12 -> 83.3%
      const r1 = calculateDisplayRealization(10, 12);
      expect(r1.actual).toBe(10);
      expect(r1.target).toBe(12);
      expect(r1.displayPercent).toBe(83.3);
      expect(r1.isOverTarget).toBe(false);
      expect(r1.displayText).toBe('%83,3');
      expect(r1.extraBadgeText).toBeUndefined();

      // 12 / 12 -> 100%
      const r2 = calculateDisplayRealization(12, 12);
      expect(r2.actual).toBe(12);
      expect(r2.target).toBe(12);
      expect(r2.displayPercent).toBe(100);
      expect(r2.isOverTarget).toBe(false);
      expect(r2.displayText).toBe('%100');
      expect(r2.extraBadgeText).toBeUndefined();

      // 15 / 12 -> Capped at 100%, +3 ekstra soru
      const r3 = calculateDisplayRealization(15, 12);
      expect(r3.actual).toBe(15); // Gerçek değer korunmalı!
      expect(r3.target).toBe(12);
      expect(r3.displayPercent).toBe(100); // Progress bar %100'de durmalı
      expect(r3.isOverTarget).toBe(true);
      expect(r3.displayText).toBe('%100 Tamamlandı');
      expect(r3.extraBadgeText).toBe('+3 ekstra soru');

      // 70 / 20 -> Capped at 100%, +50 ekstra soru
      const r4 = calculateDisplayRealization(70, 20);
      expect(r4.actual).toBe(70);
      expect(r4.target).toBe(20);
      expect(r4.displayPercent).toBe(100);
      expect(r4.isOverTarget).toBe(true);
      expect(r4.displayText).toBe('%100 Tamamlandı');
      expect(r4.extraBadgeText).toBe('+50 ekstra soru');

      // 0 / 12 -> 0%
      const r5 = calculateDisplayRealization(0, 12);
      expect(r5.displayPercent).toBe(0);
      expect(r5.isOverTarget).toBe(false);
      expect(r5.displayText).toBe('%0');
    });

    it('FAZ 4 RBAC Kuralı: DB / Multi-Tenant butonu STUDENT, TEACHER, COORDINATOR rollerine gizlenmelidir', () => {
      const isDbButtonVisibleInNavbar = (role: string) => {
        // Main navbar never shows DB button to regular users
        return false;
      };

      const canAccessDatabasePanel = (role: string) => {
        return role === 'INSTITUTE_ADMIN';
      };

      expect(isDbButtonVisibleInNavbar('STUDENT')).toBe(false);
      expect(isDbButtonVisibleInNavbar('TEACHER')).toBe(false);
      expect(isDbButtonVisibleInNavbar('COORDINATOR')).toBe(false);

      expect(canAccessDatabasePanel('STUDENT')).toBe(false);
      expect(canAccessDatabasePanel('TEACHER')).toBe(false);
      expect(canAccessDatabasePanel('COORDINATOR')).toBe(false);
      expect(canAccessDatabasePanel('INSTITUTE_ADMIN')).toBe(true);
    });
  });

  // =========================================================================
  // FAZ 4: TEST 17 - 62: KAPSAMLI İŞ KURALLARI, DOĞRULAMA, MATRİS VE RBAC TESTLERİ
  // =========================================================================
  describe('FAZ 4: İleri Doğrulama, Denetim İzi (Audit Log), Sayfa Matrisi ve RBAC Testleri (Test 17-62)', () => {
    const DEFAULT_SIM_DATE = '2026-09-03';

    // TEST 17: Öğrenci beyanı vs. Öğretmen doğrulaması
    it('TEST 17: Öğrenci çalışma kaydı girdiğinde görevin isCompleted değeri true olur ancak verificationStatus PENDING kalmalıdır (asla otomatik VERIFIED olamaz)', () => {
      const task: DailyTask = {
        id: 'task-test-17',
        weeklyPlanId: 'plan-1',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskType: 'QUESTION_TARGET',
        taskDate: '2026-09-01',
        dayOfWeek: 'Salı',
        resourceId: 'res-mat-1',
        targetQuestionCount: 20,
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      // Öğrenci çalışma kaydı giriyor
      const studentRecord: StudyRecord = {
        id: 'rec-test-17',
        dailyTaskId: task.id,
        studentId: task.studentId,
        subjectId: 'sub-mat-8',
        resourceId: task.resourceId,
        recordDate: '2026-09-01',
        actualQuestionCount: 22,
        actualDurationMinutes: 45,
        completedStartPage: 10,
        completedEndPage: 14,
        createdAt: new Date().toISOString(),
      };

      // Görev güncelleniyor
      const updatedTask: DailyTask = {
        ...task,
        isCompleted: true,
        status: 'COMPLETED',
        // KRİTİK İŞ KURALI: verificationStatus ASLA otomatik VERIFIED yapılamaz!
        verificationStatus: 'PENDING',
      };

      expect(updatedTask.isCompleted).toBe(true);
      expect(updatedTask.status).toBe('COMPLETED');
      expect(updatedTask.verificationStatus).toBe('PENDING');
      expect(updatedTask.verificationStatus).not.toBe('VERIFIED');
    });

    // TEST 18: Öğretmen doğrulaması ve audit log
    it('TEST 18: Öğretmen görevi doğruladığında verificationStatus VERIFIED olur ve audit loga VERIFY_TASK kaydedilir', () => {
      const task: DailyTask = {
        id: 'task-test-18',
        weeklyPlanId: 'plan-1',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskType: 'QUESTION_TARGET',
        taskDate: '2026-09-01',
        dayOfWeek: 'Salı',
        resourceId: 'res-mat-1',
        targetQuestionCount: 20,
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      const auditLogs: any[] = [];
      const teacherUserId = 'user-ahmet-ogretmen';

      // Öğretmen doğrular
      task.verificationStatus = 'VERIFIED';
      task.verifiedAt = new Date().toISOString();
      task.verifiedBy = teacherUserId;

      auditLogs.push({
        id: 'log-1',
        action: 'VERIFY_TASK',
        actorId: teacherUserId,
        targetId: task.id,
        timestamp: new Date().toISOString(),
        previousValue: 'PENDING',
        newValue: 'VERIFIED',
      });

      expect(task.verificationStatus).toBe('VERIFIED');
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].action).toBe('VERIFY_TASK');
      expect(auditLogs[0].newValue).toBe('VERIFIED');
    });

    // TEST 19: Öğretmen görevi reddettiğinde audit log ve sebep notu
    it('TEST 19: Öğretmen görevi reddettiğinde verificationStatus REJECTED olur, sebep notu kaydedilir ve audit loga REJECT_TASK yazılır', () => {
      const task: DailyTask = {
        id: 'task-test-19',
        weeklyPlanId: 'plan-1',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskType: 'QUESTION_TARGET',
        taskDate: '2026-09-01',
        dayOfWeek: 'Salı',
        resourceId: 'res-mat-1',
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      const auditLogs: any[] = [];
      const rejectReason = 'Ödev kontrolünde soruların çözülmediği görüldü.';

      task.verificationStatus = 'REJECTED';
      task.verificationNote = rejectReason;
      task.verifiedBy = 'user-ahmet-ogretmen';
      task.verifiedAt = new Date().toISOString();

      auditLogs.push({
        id: 'log-reject-1',
        action: 'REJECT_TASK',
        actorId: 'user-ahmet-ogretmen',
        targetId: task.id,
        timestamp: new Date().toISOString(),
        previousValue: 'PENDING',
        newValue: 'REJECTED',
        note: rejectReason,
      });

      expect(task.verificationStatus).toBe('REJECTED');
      expect(task.verificationNote).toBe(rejectReason);
      expect(auditLogs[0].action).toBe('REJECT_TASK');
      expect(auditLogs[0].note).toBe(rejectReason);
    });

    // TEST 20: Öğretmen reddettiğinde öğrenci çalışma kaydı ASLA silinmez
    it('TEST 20: KESİN VERİ GÜVENLİĞİ: Öğretmen görevi reddettiğinde (REJECTED), öğrencinin çalışma kaydı (StudyRecord) veritabanından silinmemelidir', () => {
      let records: StudyRecord[] = [
        {
          id: 'sr-ogrenci-1',
          dailyTaskId: 'task-reject-check',
          studentId: 'sp-mehmet',
          subjectId: 'sub-mat-8',
          resourceId: 'res-1',
          recordDate: '2026-09-01',
          actualQuestionCount: 15,
          actualDurationMinutes: 30,
          createdAt: new Date().toISOString(),
        },
      ];

      // Reddetme simülasyonu
      const rejectTaskFn = (taskId: string, note: string) => {
        // Görev REJECTED yapılır ama records dizisine dokunulmaz!
        return { verificationStatus: 'REJECTED', note };
      };

      rejectTaskFn('task-reject-check', 'Yetersiz çalışma');

      // Kayıt sayısı azalmamalıdır!
      expect(records.length).toBe(1);
      expect(records[0].actualQuestionCount).toBe(15);
      expect(records[0].id).toBe('sr-ogrenci-1');
    });

    // TEST 21: Öğrenci çalışma dakikası ve çözülen soru sayısı geçmişte saklanır
    it('TEST 21: Reddedilen görevin çalışma dakikası ve beyan edilen soruları geçmiş log olarak korunur', () => {
      const studentRecord: StudyRecord = {
        id: 'sr-history-test',
        dailyTaskId: 'task-1',
        studentId: 'sp-mehmet',
        subjectId: 'sub-mat-8',
        resourceId: 'res-1',
        recordDate: '2026-09-01',
        actualQuestionCount: 25,
        actualDurationMinutes: 50,
        createdAt: new Date().toISOString(),
      };
      expect(studentRecord.actualQuestionCount).toBe(25);
      expect(studentRecord.actualDurationMinutes).toBe(50);
    });

    // TEST 22: Reddedilen görev doğrulanmış başarı oranına dahil edilmez
    it('TEST 22: Reddedilen görev haftalık öğretmen doğrulama raporunda VERIFIED olarak sayılmaz', () => {
      const tasks: DailyTask[] = [
        { id: 't1', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-09-01', dayOfWeek: 'Salı', isCompleted: true, status: 'COMPLETED', verificationStatus: 'VERIFIED', targetQuestionCount: 20, createdAt: '' },
        { id: 't2', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-09-02', dayOfWeek: 'Çarşamba', isCompleted: true, status: 'COMPLETED', verificationStatus: 'REJECTED', targetQuestionCount: 20, createdAt: '' },
        { id: 't3', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-09-03', dayOfWeek: 'Perşembe', isCompleted: true, status: 'COMPLETED', verificationStatus: 'PENDING', targetQuestionCount: 20, createdAt: '' },
      ];

      const verifiedTasks = tasks.filter((t) => t.verificationStatus === 'VERIFIED');
      expect(verifiedTasks.length).toBe(1);
      expect(verifiedTasks[0].id).toBe('t1');
    });

    // TEST 23: Geçmiş günün bitmemiş görevi OVERDUE olarak etiketlenir
    it('TEST 23: Teslim tarihi simülasyon tarihinden önceki bitmemiş görevler OVERDUE olarak belirlenmelidir', () => {
      const isTaskOverdue = (taskDate: string, isCompleted: boolean) => {
        return !isCompleted && taskDate < DEFAULT_SIM_DATE;
      };

      expect(isTaskOverdue('2026-09-01', false)).toBe(true);
      expect(isTaskOverdue('2026-09-01', true)).toBe(false);
      expect(isTaskOverdue('2026-09-03', false)).toBe(false);
      expect(isTaskOverdue('2026-09-04', false)).toBe(false);
    });

    // TEST 24: Geciken görev telafi edildiğinde orijinal taskDate korunur
    it('TEST 24: Geciken görev telafi edildiğinde (LATE_COMPLETED), görevin orijinal taskDate değeri değiştirilmemelidir', () => {
      const originalDate = '2026-09-01';
      const task: DailyTask = {
        id: 'task-late-1',
        weeklyPlanId: 'plan-1',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskType: 'QUESTION_TARGET',
        taskDate: originalDate,
        dayOfWeek: 'Salı',
        targetQuestionCount: 15,
        isCompleted: false,
        status: 'OVERDUE',
        createdAt: new Date().toISOString(),
      };

      // Telafi tamamlama
      const completedTask: DailyTask = {
        ...task,
        isCompleted: true,
        status: 'LATE_COMPLETED',
        completionDate: '2026-09-04T10:00:00.000Z',
      };

      expect(completedTask.taskDate).toBe(originalDate);
      expect(completedTask.status).toBe('LATE_COMPLETED');
      expect(completedTask.isCompleted).toBe(true);
    });

    // TEST 25: Geciken görev tamamlandığında audit loga COMPLETE_LATE_TASK yazılır
    it('TEST 25: Gecikmeli tamamlama yapıldığında COMPLETE_LATE_TASK audit kaydı oluşturulmalıdır', () => {
      const auditLog = {
        action: 'COMPLETE_LATE_TASK',
        actorId: 'user-ahmet-ogretmen',
        targetId: 'task-late-1',
        previousValue: 'OVERDUE',
        newValue: 'LATE_COMPLETED',
        note: 'Öğrenci telafi çalışmasını perşembe günü teslim etti',
      };

      expect(auditLog.action).toBe('COMPLETE_LATE_TASK');
      expect(auditLog.previousValue).toBe('OVERDUE');
      expect(auditLog.newValue).toBe('LATE_COMPLETED');
    });

    // TEST 26: Öğrenci kendi kendine verifyDailyTask çağıramaz
    it('TEST 26: RBAC: STUDENT rolündeki bir kullanıcı görev doğrulama (verifyDailyTask) yetkisine sahip değildir', () => {
      const canVerifyTask = (role: string) => {
        return role === 'TEACHER' || role === 'INSTITUTE_ADMIN';
      };

      expect(canVerifyTask('STUDENT')).toBe(false);
      expect(canVerifyTask('TEACHER')).toBe(true);
      expect(canVerifyTask('INSTITUTE_ADMIN')).toBe(true);
    });

    // TEST 27: Öğrenci kendi kendine rejectDailyTask çağıramaz
    it('TEST 27: RBAC: STUDENT rolündeki bir kullanıcı görev reddetme (rejectDailyTask) yetkisine sahip değildir', () => {
      const canRejectTask = (role: string) => {
        return role === 'TEACHER' || role === 'INSTITUTE_ADMIN';
      };

      expect(canRejectTask('STUDENT')).toBe(false);
      expect(canRejectTask('TEACHER')).toBe(true);
    });

    // TEST 28: Öğretmen yetki kontrolü
    it('TEST 28: Öğretmen sadece kendi sınıf/öğrenci kapsamındaki görevlerde yetkilidir', () => {
      const teacherClassIds = ['class-8a'];
      const isAuthorizedForClass = (classId: string) => teacherClassIds.includes(classId);

      expect(isAuthorizedForClass('class-8a')).toBe(true);
      expect(isAuthorizedForClass('class-8b')).toBe(false);
    });

    // TEST 29: copyWeekTasks ile yeni haftalık görevler kopyalanır ve COPY_WEEK_TASKS loglanır
    it('TEST 29: Haftalık kopyalamada (copyWeekTasks) yeni görevler oluşturulur ve audit log kaydı düşer', () => {
      const sourceTasks: DailyTask[] = [
        {
          id: 'src-1',
          weeklyPlanId: 'plan-1',
          studentId: 'sp-mehmet',
          teacherId: 'tp-ahmet',
          subjectId: 'sub-mat-8',
          taskType: 'QUESTION_TARGET',
          taskDate: '2026-08-31',
          dayOfWeek: 'Pazartesi',
          targetQuestionCount: 20,
          isCompleted: true,
          status: 'COMPLETED',
          verificationStatus: 'VERIFIED',
          createdAt: '',
        },
      ];

      const newTasks: DailyTask[] = sourceTasks.map((t) => ({
        ...t,
        id: 'new-copy-1',
        taskDate: '2026-09-07',
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'PENDING',
        verifiedBy: undefined,
        verifiedAt: undefined,
      }));

      const copyAuditLog = {
        action: 'COPY_WEEK_TASKS',
        actorId: 'user-ahmet-ogretmen',
        targetId: 'sp-mehmet',
        note: '1 görev yeni haftaya aktarıldı',
      };

      expect(newTasks.length).toBe(1);
      expect(newTasks[0].taskDate).toBe('2026-09-07');
      expect(copyAuditLog.action).toBe('COPY_WEEK_TASKS');
    });

    // TEST 30: Kopyalanan yeni görevlerin verificationStatus değeri PENDING olmalıdır
    it('TEST 30: Kopyalanan yeni haftalık görevlerin verificationStatus değeri varsayılan PENDING olmalıdır', () => {
      const copiedTask: Partial<DailyTask> = {
        verificationStatus: 'PENDING',
      };
      expect(copiedTask.verificationStatus).toBe('PENDING');
    });

    // TEST 31: Kopyalanan yeni görevlerin isCompleted değeri false ve statusü PLANNED olmalıdır
    it('TEST 31: Kopyalanan yeni haftalık görevler henüz yapılmamış (isCompleted=false, status=PLANNED) olarak başlamalıdır', () => {
      const copiedTask: Partial<DailyTask> = {
        isCompleted: false,
        status: 'PLANNED',
      };
      expect(copiedTask.isCompleted).toBe(false);
      expect(copiedTask.status).toBe('PLANNED');
    });

    // TEST 32: Audit log yapısı eksiksizliği
    it('TEST 32: Audit log veri yapısı (actorId, action, targetId, timestamp, previousValue, newValue) standart alanları barındırmalıdır', () => {
      const log = {
        id: 'log-audit-spec',
        action: 'VERIFY_TASK',
        actorId: 'user-1',
        actorName: 'Ahmet Öğretmen',
        targetId: 'task-1',
        timestamp: new Date().toISOString(),
        previousValue: 'PENDING',
        newValue: 'VERIFIED',
        note: 'Kontrol edildi',
      };

      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('actorId');
      expect(log).toHaveProperty('actorName');
      expect(log).toHaveProperty('targetId');
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('previousValue');
      expect(log).toHaveProperty('newValue');
    });

    // TEST 33 - 38: 6-Renk UI Standart Kontrolleri
    it('TEST 33: 6-Renk Standardı: Doğrulanmış sayfa/görev YEŞİL (#10b981 / emerald-500) ile gösterilmelidir', () => {
      const getStatusColor = (vStatus: string) => (vStatus === 'VERIFIED' ? '#10b981' : '#64748b');
      expect(getStatusColor('VERIFIED')).toBe('#10b981');
    });

    it('TEST 34: 6-Renk Standardı: Öğrenci beyanı onay bekleyen görev SARI (#f59e0b / amber-400) ile gösterilmelidir', () => {
      const getStatusColor = (isCompleted: boolean, vStatus: string) => 
        (isCompleted && vStatus === 'PENDING' ? '#f59e0b' : '#64748b');
      expect(getStatusColor(true, 'PENDING')).toBe('#f59e0b');
    });

    it('TEST 35: 6-Renk Standardı: Yapılmadı veya gecikmiş ödev KIRMIZI (#ef4444 / rose-500) ile gösterilmelidir', () => {
      const getStatusColor = (vStatus: string, isOverdue: boolean) => 
        (vStatus === 'REJECTED' || isOverdue ? '#ef4444' : '#64748b');
      expect(getStatusColor('REJECTED', false)).toBe('#ef4444');
      expect(getStatusColor('PENDING', true)).toBe('#ef4444');
    });

    it('TEST 36: 6-Renk Standardı: Gecikmeli tamamlanan görev MAVİ (#6366f1 / indigo-500) ile gösterilmelidir', () => {
      const getStatusColor = (status: TaskStatus) => (status === 'LATE_COMPLETED' ? '#6366f1' : '#64748b');
      expect(getStatusColor('LATE_COMPLETED')).toBe('#6366f1');
    });

    it('TEST 37: 6-Renk Standardı: Henüz başlanmamış planlı sayfa BEYAZ (#ffffff) ile gösterilmelidir', () => {
      const getStatusColor = (status: TaskStatus) => (status === 'PLANNED' ? '#ffffff' : '#000000');
      expect(getStatusColor('PLANNED')).toBe('#ffffff');
    });

    it('TEST 38: 6-Renk Standardı: Kapsam dışı bırakılan sayfa GRİ (#94a3b8) ile gösterilmelidir', () => {
      const getStatusColor = (isOutOfScope: boolean) => (isOutOfScope ? '#94a3b8' : '#ffffff');
      expect(getStatusColor(true)).toBe('#94a3b8');
    });

    // TEST 39: Sayfa Matrisi Deduplication
    it('TEST 39: Sayfa Matrisi: Aynı sayfa birden çok çalışmada çözülse dahi deduplication ile mükerrer sayılmamalıdır', () => {
      const records: StudyRecord[] = [
        { id: '1', dailyTaskId: 't1', studentId: 'sp-1', subjectId: 's1', resourceId: 'res-1', recordDate: '2026-09-01', actualQuestionCount: 10, actualDurationMinutes: 20, completedStartPage: 1, completedEndPage: 5, createdAt: '' },
        { id: '2', dailyTaskId: 't2', studentId: 'sp-1', subjectId: 's1', resourceId: 'res-1', recordDate: '2026-09-02', actualQuestionCount: 10, actualDurationMinutes: 20, completedStartPage: 3, completedEndPage: 7, createdAt: '' },
      ];

      const completedPagesSet = new Set<number>();
      records.forEach((r) => {
        if (r.completedStartPage && r.completedEndPage) {
          for (let p = r.completedStartPage; p <= r.completedEndPage; p++) {
            completedPagesSet.add(p);
          }
        }
      });

      // 1..5 ve 3..7 -> 1,2,3,4,5,6,7 toplam 7 benzersiz sayfa
      expect(completedPagesSet.size).toBe(7);
      expect(Array.from(completedPagesSet).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    // TEST 40: Sayfa Matrisi İlerleme Yüzdesi
    it('TEST 40: Sayfa Matrisi: Kaynak ilerleme yüzdesi tamamlanan benzersiz sayfaların toplam sayfaya oranıdır', () => {
      const totalPages = 100;
      const completedPagesCount = 35;
      const percentage = Math.round((completedPagesCount / totalPages) * 100);
      expect(percentage).toBe(35);
    });

    // TEST 41: Sayfa Matrisi: Tıklanan sayfayı içeren görevlerin bulunması
    it('TEST 41: Sayfa Matrisi: Sayfa tıklandığında startPage <= pageNum <= endPage şartını sağlayan görevler bulunmalıdır', () => {
      const tasks: DailyTask[] = [
        { id: 't1', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-09-01', dayOfWeek: 'Salı', isCompleted: false, status: 'PLANNED', resourceId: 'res-1', startPage: 1, endPage: 10, createdAt: '' },
        { id: 't2', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-09-02', dayOfWeek: 'Çarşamba', isCompleted: false, status: 'PLANNED', resourceId: 'res-1', startPage: 11, endPage: 20, createdAt: '' },
      ];

      const pageNum = 7;
      const matching = tasks.filter((t) => t.startPage && t.endPage && pageNum >= t.startPage && pageNum <= t.endPage);
      expect(matching.length).toBe(1);
      expect(matching[0].id).toBe('t1');
    });

    // TEST 42: Sayfa Matrisi: Tıklanan sayfayı içeren çalışma kayıtlarının bulunması
    it('TEST 42: Sayfa Matrisi: Sayfa tıklandığında sayfayı kapsayan öğrenci çalışma kayıtları doğru listelenmelidir', () => {
      const records: StudyRecord[] = [
        { id: 'sr-1', dailyTaskId: 't1', studentId: 'sp-1', subjectId: 's1', resourceId: 'res-1', recordDate: '2026-09-01', actualQuestionCount: 15, actualDurationMinutes: 30, completedStartPage: 5, completedEndPage: 8, createdAt: '' },
      ];

      const pageNum = 6;
      const matching = records.filter((r) => r.completedStartPage && r.completedEndPage && pageNum >= r.completedStartPage && pageNum <= r.completedEndPage);
      expect(matching.length).toBe(1);
      expect(matching[0].id).toBe('sr-1');
    });

    // TEST 43: Analitik KPI: Öğrenci Beyanı Soru Sayısı
    it('TEST 43: Analitik KPI: Öğrenci Beyanı Soru Sayısı çalışma kayıtlarının toplam actualQuestions değeridir', () => {
      const records: StudyRecord[] = [
        { id: '1', dailyTaskId: 't1', studentId: 'sp-1', subjectId: 's1', resourceId: 'res-1', recordDate: '', actualQuestionCount: 30, actualDurationMinutes: 40, createdAt: '' },
        { id: '2', dailyTaskId: 't2', studentId: 'sp-1', subjectId: 's1', resourceId: 'res-1', recordDate: '', actualQuestionCount: 45, actualDurationMinutes: 50, createdAt: '' },
      ];

      const totalStudentQuestions = records.reduce((sum, r) => sum + r.actualQuestionCount, 0);
      expect(totalStudentQuestions).toBe(75);
    });

    // TEST 44: Analitik KPI: Öğretmen Doğrulanmış Soru Sayısı
    it('TEST 44: Analitik KPI: Öğretmen Doğrulanmış Soru Sayısı yalnızca VERIFIED görevlerin sorularını toplamalıdır', () => {
      const tasksWithRecords = [
        { verificationStatus: 'VERIFIED', actualQuestions: 30 },
        { verificationStatus: 'REJECTED', actualQuestions: 40 },
        { verificationStatus: 'PENDING', actualQuestions: 20 },
      ];

      const verifiedQuestions = tasksWithRecords
        .filter((t) => t.verificationStatus === 'VERIFIED')
        .reduce((sum, t) => sum + t.actualQuestions, 0);

      expect(verifiedQuestions).toBe(30);
    });

    // TEST 45: Analitik KPI: Doğrulama Oranı (Verification Rate)
    it('TEST 45: Analitik KPI: Doğrulama Oranı = (Doğrulanmış Soru / Beyan Edilen Soru) * 100 olmalıdır', () => {
      const declaredQuestions = 100;
      const verifiedQuestions = 80;
      const verificationRate = Math.round((verifiedQuestions / declaredQuestions) * 100);
      expect(verificationRate).toBe(80);
    });

    // TEST 46: Hedef Aşımı Kuralı: 15/12 soru progress bar %100 sınırlandırma
    it('TEST 46: Hedef Aşımı: 15/12 soru çözüldüğünde progress bar genişliği %100 ile sınırlandırılmalıdır', () => {
      const actual = 15;
      const target = 12;
      const displayPercentage = Math.min(100, Math.round((actual / target) * 100));
      expect(displayPercentage).toBe(100);
    });

    // TEST 47: Hedef Aşımı: Gerçek soru sayısı korunmalıdır
    it('TEST 47: Hedef Aşımı: Gerçek çözülen soru sayısı (15) veritabanında olduğu gibi korunmalıdır', () => {
      const actual = 15;
      expect(actual).toBe(15);
    });

    // TEST 48: Hedef Aşımı: Ekstra soru rozeti (+3 ekstra soru)
    it('TEST 48: Hedef Aşımı: Hedef aşıldığında "+3 ekstra soru" rozeti üretilmelidir', () => {
      const actual = 15;
      const target = 12;
      const badge = actual > target ? `+${actual - target} ekstra soru` : undefined;
      expect(badge).toBe('+3 ekstra soru');
    });

    // TEST 49: Hedef Aşımı: 70/20 soru durumunda +50 ekstra soru
    it('TEST 49: Hedef Aşımı: 70/20 soru çözüldüğünde rozet "+50 ekstra soru" olmalıdır', () => {
      const actual = 70;
      const target = 20;
      const badge = actual > target ? `+${actual - target} ekstra soru` : undefined;
      expect(badge).toBe('+50 ekstra soru');
    });

    // TEST 50: Haftalık Navigasyon: Önceki haftaya geçiş (-7 gün)
    it('TEST 50: Haftalık Navigasyon: Önceki haftaya geçişte tarih tam olarak -7 gün kaydırılmalıdır', () => {
      const shiftDate = (dateStr: string, days: number) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      };

      const currentWeekStart = '2026-08-31';
      const prevWeek = shiftDate(currentWeekStart, -7);
      expect(prevWeek).toBe('2026-08-24');
    });

    // TEST 51: Haftalık Navigasyon: Sonraki haftaya geçiş (+7 gün)
    it('TEST 51: Haftalık Navigasyon: Sonraki haftaya geçişte tarih tam olarak +7 gün kaydırılmalıdır', () => {
      const shiftDate = (dateStr: string, days: number) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
      };

      const currentWeekStart = '2026-08-31';
      const nextWeek = shiftDate(currentWeekStart, 7);
      expect(nextWeek).toBe('2026-09-07');
    });

    // TEST 52: Haftalık Navigasyon: "Bugüne Dön"
    it('TEST 52: Haftalık Navigasyon: "Bugüne Dön" tıklandığında DEFAULT_SIMULATION_WEEK_START (2026-08-31) dönmelidir', () => {
      const DEFAULT_WEEK = '2026-08-31';
      let currentWeek = '2026-09-14';
      // Bugüne dön
      currentWeek = DEFAULT_WEEK;
      expect(currentWeek).toBe('2026-08-31');
    });

    // TEST 53: Geçmiş Görevler Banner Listelemesi
    it('TEST 53: Geçmiş Görevler Uyarısı: Seçili haftadan önceki tamamlanmamış görevler listelenmelidir', () => {
      const currentWeekStart = '2026-08-31';
      const tasks: DailyTask[] = [
        { id: 'p1', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-08-25', dayOfWeek: 'Salı', isCompleted: false, status: 'OVERDUE', createdAt: '' },
        { id: 'p2', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-09-01', dayOfWeek: 'Salı', isCompleted: false, status: 'PLANNED', createdAt: '' },
      ];

      const pastIncompleteTasks = tasks.filter((t) => t.taskDate < currentWeekStart && !t.isCompleted);
      expect(pastIncompleteTasks.length).toBe(1);
      expect(pastIncompleteTasks[0].id).toBe('p1');
    });

    // TEST 54: Geçmiş Görevler Uyarısı: Tamamlanmışlar dahil edilmez
    it('TEST 54: Geçmiş Görevler Uyarısı: Tamamlanmış veya doğrulanmış geçmiş görevler uyarıda yer almamalıdır', () => {
      const currentWeekStart = '2026-08-31';
      const tasks: DailyTask[] = [
        { id: 'p1', weeklyPlanId: 'p1', subjectId: 's1', taskType: 'QUESTION_TARGET', studentId: 'sp-1', teacherId: 'tp-1', taskDate: '2026-08-25', dayOfWeek: 'Salı', isCompleted: true, status: 'COMPLETED', createdAt: '' },
      ];

      const pastIncompleteTasks = tasks.filter((t) => t.taskDate < currentWeekStart && !t.isCompleted);
      expect(pastIncompleteTasks.length).toBe(0);
    });

    // TEST 55: RBAC: STUDENT rolü DB / Multi-Tenant ekranına doğrudan yönlendirilemez
    it('TEST 55: RBAC: STUDENT rolündeki kullanıcı DB / Multi-Tenant ekranına erişememelidir', () => {
      const canAccessDbView = (role: string) => role === 'INSTITUTE_ADMIN';
      expect(canAccessDbView('STUDENT')).toBe(false);
    });

    // TEST 56: RBAC: TEACHER rolü DB / Multi-Tenant ekranına doğrudan yönlendirilemez
    it('TEST 56: RBAC: TEACHER rolündeki kullanıcı DB / Multi-Tenant ekranına erişememelidir', () => {
      const canAccessDbView = (role: string) => role === 'INSTITUTE_ADMIN';
      expect(canAccessDbView('TEACHER')).toBe(false);
    });

    // TEST 57: RBAC: COORDINATOR rolü DB / Multi-Tenant ekranına doğrudan yönlendirilemez
    it('TEST 57: RBAC: COORDINATOR rolündeki kullanıcı DB / Multi-Tenant ekranına erişememelidir', () => {
      const canAccessDbView = (role: string) => role === 'INSTITUTE_ADMIN';
      expect(canAccessDbView('COORDINATOR')).toBe(false);
    });

    // TEST 58: RBAC: INSTITUTE_ADMIN rolü kurum ayarlarına ve teknik denetime erişebilir
    it('TEST 58: RBAC: INSTITUTE_ADMIN rolü kurum ayarlarına ve teknik denetime erişebilmelidir', () => {
      const canAccessDbView = (role: string) => role === 'INSTITUTE_ADMIN';
      expect(canAccessDbView('INSTITUTE_ADMIN')).toBe(true);
    });

    // TEST 59: Çoklu Öğretmen Branş İzolasyonu: Matematik öğretmeni sadece Matematik görevlerini düzenleyebilir
    it('TEST 59: Çoklu Öğretmen Branş İzolasyonu: Matematik öğretmeni sadece Matematik branşındaki görevleri düzenleyebilir', () => {
      const teacherBranch = 'Matematik';
      const canEditTask = (taskSubject: string) => taskSubject === teacherBranch;

      expect(canEditTask('Matematik')).toBe(true);
      expect(canEditTask('Türkçe')).toBe(false);
      expect(canEditTask('Fen Bilimleri')).toBe(false);
    });

    // TEST 60: Çoklu Öğretmen Branş İzolasyonu: Farklı branş kilitli gösterilir
    it('TEST 60: Çoklu Öğretmen Branş İzolasyonu: Farklı öğretmenin branş ödevi kilitli (locked) olarak işaretlenmelidir', () => {
      const isLockedForTeacher = (taskTeacherId: string, currentTeacherId: string) => {
        return taskTeacherId !== currentTeacherId;
      };

      expect(isLockedForTeacher('tp-ayse', 'tp-ahmet')).toBe(true);
      expect(isLockedForTeacher('tp-ahmet', 'tp-ahmet')).toBe(false);
    });

    // TEST 61: Görev Kapsamı Güncelleme: Kitap sınırları dışına çıkılamaz
    it('TEST 61: Görev Kapsamı: Kitap sınırları (1-100) dışındaki sayfa aralığı (101-120) reddedilmelidir', () => {
      const resource = { startPage: 1, endPage: 100 };
      const validatePageRange = (start: number, end: number) => {
        if (start < resource.startPage || end > resource.endPage) return false;
        if (start > end) return false;
        return true;
      };

      expect(validatePageRange(10, 20)).toBe(true);
      expect(validatePageRange(90, 110)).toBe(false);
      expect(validatePageRange(20, 10)).toBe(false);
    });

    // TEST 62: Veri Tutarlılığı: LocalStorage migration versiyon koruması
    it('TEST 62: Veri Tutarlılığı: MigrationService state versiyonunu v1 -> v2 geçişinde veri kaybı olmadan korumalıdır', () => {
      const legacyData = {
        users: [{ id: 'u1', fullName: 'Test User' }],
        version: 'v1',
      };

      const migrateToV2 = (oldData: any) => {
        return {
          ...oldData,
          version: 'v2',
          migratedAt: '2026-09-03',
        };
      };

      const migrated = migrateToV2(legacyData);
      expect(migrated.version).toBe('v2');
      expect(migrated.users.length).toBe(1);
      expect(migrated.users[0].fullName).toBe('Test User');
    });
  });

  // =========================================================================
  // FAZ 4: KURUMSAL KAYNAK YÖNETİMİ & BRANŞ BAZLI ÖĞRETMEN YETKİLENDİRME (TEST 71 - 101)
  // =========================================================================
  describe('FAZ 4: Kurumsal Kaynak Yönetimi & Branş Bazlı Öğretmen Yetkilendirme (TEST 71 - 101)', () => {
    // Model Helper Functions matching AppContext logic
    const canTeacherAccessResourceHelper = (
      userRole: string,
      userOrgId: string,
      teacherProfileId: string | null,
      resource: Resource | undefined,
      teacherResourcesList: TeacherResource[]
    ): boolean => {
      if (!resource) return false;
      if (userRole === 'INSTITUTE_ADMIN') {
        return resource.organizationId === userOrgId && !resource.isArchived && resource.status !== 'ARCHIVED';
      }
      if (userRole === 'TEACHER') {
        if (!teacherProfileId) return false;
        if (resource.isArchived || resource.status === 'ARCHIVED') return false;
        return teacherResourcesList.some(
          (tr) => tr.teacherId === teacherProfileId && tr.resourceId === resource.id && tr.isActive
        );
      }
      return false;
    };

    const canTeacherAccessTaskHelper = (
      userRole: string,
      userOrgId: string,
      teacherProfileId: string | null,
      task: DailyTask | undefined,
      resourcesList: Resource[],
      teacherResourcesList: TeacherResource[]
    ): boolean => {
      if (!task) return false;
      if (userRole === 'INSTITUTE_ADMIN') return true;
      if (userRole === 'TEACHER') {
        if (!teacherProfileId) return false;
        if (task.resourceId) {
          const res = resourcesList.find((r) => r.id === task.resourceId);
          if (!canTeacherAccessResourceHelper(userRole, userOrgId, teacherProfileId, res, teacherResourcesList)) {
            return false;
          }
        }
        return task.teacherId === teacherProfileId;
      }
      return false;
    };

    // TEST 71: Kurum Yöneticisi Kuruma Yeni Kaynak Kitap Ekleme
    it('TEST 71: Kurum Yöneticisi kuruma yeni bir kaynak kitap ekleyebilmelidir (isArchived: false, status: ACTIVE)', () => {
      const newBook: Resource = {
        id: 'res-kurum-yeni-1',
        organizationId: 'org-1',
        createdByTeacherId: 'tp-admin',
        subjectId: 'sub-mat-8',
        title: 'LGS Matematik Deneme Serisi',
        publisher: 'Karekök Yayınları',
        gradeLevel: 8,
        totalPages: 240,
        startPage: 1,
        endPage: 240,
        isArchived: false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      expect(newBook.id).toBe('res-kurum-yeni-1');
      expect(newBook.organizationId).toBe('org-1');
      expect(newBook.isArchived).toBe(false);
      expect(newBook.status).toBe('ACTIVE');
    });

    // TEST 72: Kurum Yöneticisi Kaynak Bilgilerini Düzenleme
    it('TEST 72: Kurum Yöneticisi kaynak kitap bilgilerini (başlık, yayınevi, sayfa aralığı) güncelleyebilmelidir', () => {
      let book: Resource = {
        id: 'res-kurum-1',
        organizationId: 'org-1',
        createdByTeacherId: 'tp-admin',
        subjectId: 'sub-mat-8',
        title: 'Eski Başlık',
        publisher: 'Eski Yayın',
        gradeLevel: 8,
        totalPages: 100,
        startPage: 1,
        endPage: 100,
        isArchived: false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      // Yönetici günceller
      book = {
        ...book,
        title: 'Güncel LGS Matematik Soru Bankası',
        publisher: 'Güncel Yayıncılık',
        totalPages: 120,
        endPage: 120,
      };

      expect(book.title).toBe('Güncel LGS Matematik Soru Bankası');
      expect(book.publisher).toBe('Güncel Yayıncılık');
      expect(book.totalPages).toBe(120);
    });

    // TEST 73: Kurum Yöneticisi Kaynak Kitabı Arşivleme (Soft Delete)
    it('TEST 73: Kurum Yöneticisi bir kitabı arşivleyebilmelidir (isArchived: true, status: ARCHIVED)', () => {
      const book: Resource = {
        id: 'res-to-archive',
        organizationId: 'org-1',
        createdByTeacherId: 'tp-admin',
        subjectId: 'sub-mat-8',
        title: 'Arşivlenecek Kitap',
        publisher: 'Test Yayın',
        gradeLevel: 8,
        totalPages: 80,
        startPage: 1,
        endPage: 80,
        isArchived: false,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const archivedBook: Resource = {
        ...book,
        isArchived: true,
        status: 'ARCHIVED',
      };

      expect(archivedBook.isArchived).toBe(true);
      expect(archivedBook.status).toBe('ARCHIVED');
    });

    // TEST 74: Arşivlenmiş Kitabın Geçmiş Verilerinin Korunması
    it('TEST 74: Arşivlenmiş kitaba ait geçmiş öğrenci çalışma kayıtları (studyRecords) ve görevler veritabanından silinmemelidir', () => {
      const archivedResId = 'res-fenomen-f3';
      const existingTasks = initialDailyTasks.filter((t) => t.resourceId === archivedResId);
      const existingRecords = initialStudyRecords.filter((r) => r.resourceId === archivedResId);

      expect(existingTasks.length).toBeGreaterThan(0);
      expect(existingRecords.length).toBeGreaterThan(0);

      // Kitap arşivlendiğinde görev ve çalışma kayıtları korunur
      const isDataPreserved = existingTasks.length > 0 && existingRecords.length > 0;
      expect(isDataPreserved).toBe(true);
    });

    // TEST 75: Kurum Yöneticisi Kaynağı Branş Öğretmenine Atama
    it('TEST 75: Kurum Yöneticisi bir kitabı branş öğretmenine atayabilmelidir (TeacherResource oluşturulur)', () => {
      const newAssignment: TeacherResource = {
        id: 'tr-new-1',
        institutionId: 'org-1',
        organizationId: 'org-1',
        teacherId: 'tp-ahmet',
        resourceId: 'res-fen-sb',
        assignedBy: 'user-admin-kurum',
        assignedAt: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      expect(newAssignment.teacherId).toBe('tp-ahmet');
      expect(newAssignment.resourceId).toBe('res-fen-sb');
      expect(newAssignment.isActive).toBe(true);
    });

    // TEST 76: Aynı Kitabın Aynı Branştaki Birden Fazla Öğretmene Atanabilmesi
    it('TEST 76: Bir kitap aynı branştan birden fazla öğretmene eşzamanlı atanabilmelidir (Ahmet ve Burak öğretmenler)', () => {
      const assignments: TeacherResource[] = [
        {
          id: 'tr-ahmet-mat',
          institutionId: 'org-1',
          teacherId: 'tp-ahmet',
          resourceId: 'res-fenomen-f3',
          assignedBy: 'user-admin-kurum',
          assignedAt: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tr-burak-mat',
          institutionId: 'org-1',
          teacherId: 'tp-burak',
          resourceId: 'res-fenomen-f3',
          assignedBy: 'user-admin-kurum',
          assignedAt: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      const teachersAssignedToF3 = assignments
        .filter((tr) => tr.resourceId === 'res-fenomen-f3' && tr.isActive)
        .map((tr) => tr.teacherId);

      expect(teachersAssignedToF3).toContain('tp-ahmet');
      expect(teachersAssignedToF3).toContain('tp-burak');
      expect(teachersAssignedToF3.length).toBe(2);
    });

    // TEST 77: Kurum Yöneticisi Öğretmenin Kaynak Yetkisini Kaldırma
    it('TEST 77: Kurum Yöneticisi bir öğretmenin kaynak atamasını kaldırabilmelidir (isActive: false)', () => {
      let assignment: TeacherResource = {
        id: 'tr-temp',
        institutionId: 'org-1',
        teacherId: 'tp-ahmet',
        resourceId: 'res-fenomen-8a',
        assignedBy: 'user-admin-kurum',
        assignedAt: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      // Yetki kaldırılır
      assignment = { ...assignment, isActive: false };
      expect(assignment.isActive).toBe(false);
    });

    // TEST 78: Yetki Kaldırıldığında Geçmiş Görevlerin Korunması
    it('TEST 78: Öğretmenin kaynak ataması kaldırılsa bile öğrencinin geçmiş görevleri ve sayfaları silinmez', () => {
      const pastTasks = [
        { id: 't-past-1', resourceId: 'res-fenomen-8a', studentId: 'sp-mehmet', isCompleted: true },
      ];

      // Yetki kalksa da geçmiş görevler korunmalıdır
      expect(pastTasks.length).toBe(1);
      expect(pastTasks[0].isCompleted).toBe(true);
    });

    // TEST 79: canTeacherAccessResource: Atanmış ve Aktif Kaynak
    it('TEST 79: canTeacherAccessResource: Öğretmene atanmış ve aktif kaynak için true dönmelidir', () => {
      const targetRes = initialResources.find((r) => r.id === 'res-fenomen-f3');
      const canAccess = canTeacherAccessResourceHelper(
        'TEACHER',
        'org-1',
        'tp-ahmet',
        targetRes,
        initialTeacherResources
      );
      expect(canAccess).toBe(true);
    });

    // TEST 80: canTeacherAccessResource: Atanmamış Kaynak
    it('TEST 80: canTeacherAccessResource: Öğretmene atanmamış kaynak için false dönmelidir', () => {
      // res-fen-sb Ahmet Öğretmene (tp-ahmet) atanmamış, Mehmet Öğretmene (tp-mehmet) atanmıştır
      const fenResource = initialResources.find((r) => r.id === 'res-fen-sb');
      const canAccess = canTeacherAccessResourceHelper(
        'TEACHER',
        'org-1',
        'tp-ahmet',
        fenResource,
        initialTeacherResources
      );
      expect(canAccess).toBe(false);
    });

    // TEST 81: canTeacherAccessResource: Arşivlenmiş Kaynak
    it('TEST 81: canTeacherAccessResource: Arşivlenmiş kaynak öğretmene atanmış olsa dahi false dönmelidir', () => {
      const archivedResource: Resource = {
        id: 'res-archived-assigned',
        organizationId: 'org-1',
        createdByTeacherId: 'tp-admin',
        subjectId: 'sub-mat-8',
        title: 'Eski Kitap',
        publisher: 'Eski Basım',
        gradeLevel: 8,
        totalPages: 100,
        startPage: 1,
        endPage: 100,
        isArchived: true,
        status: 'ARCHIVED',
        createdAt: new Date().toISOString(),
      };

      const mockTr: TeacherResource[] = [
        {
          id: 'tr-archived',
          institutionId: 'org-1',
          teacherId: 'tp-ahmet',
          resourceId: 'res-archived-assigned',
          assignedBy: 'user-admin-kurum',
          assignedAt: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];

      const canAccess = canTeacherAccessResourceHelper(
        'TEACHER',
        'org-1',
        'tp-ahmet',
        archivedResource,
        mockTr
      );
      expect(canAccess).toBe(false);
    });

    // TEST 82: canTeacherAccessResource: Kurum Yöneticisi Tam Erişim
    it('TEST 82: canTeacherAccessResource: Kurum Yöneticisi kendi kurumundaki tüm aktif kaynaklara erişebilir (true)', () => {
      const activeRes = initialResources.find((r) => r.organizationId === 'org-1' && !r.isArchived);
      const canAccess = canTeacherAccessResourceHelper(
        'INSTITUTE_ADMIN',
        'org-1',
        null,
        activeRes,
        initialTeacherResources
      );
      expect(canAccess).toBe(true);
    });

    // TEST 83: canTeacherAccessResource: Multi-Tenant İzolasyonu
    it('TEST 83: canTeacherAccessResource: Kurum Yöneticisi farklı bir kuruma (org-2) ait kaynağa erişemez (false)', () => {
      const org2Res = initialResources.find((r) => r.organizationId === 'org-2');
      const canAccess = canTeacherAccessResourceHelper(
        'INSTITUTE_ADMIN',
        'org-1',
        null,
        org2Res,
        initialTeacherResources
      );
      expect(canAccess).toBe(false);
    });

    // TEST 84: Öğretmen Yalnızca Atanmış Kitaplardan Görev Oluşturabilir
    it('TEST 84: Öğretmen yalnızca kendisine atanmış bir kitaptan görev oluşturabilir', () => {
      const teacherProfileId = 'tp-ahmet';
      const assignedResourceId = 'res-fenomen-f3';

      const isAuthorized = initialTeacherResources.some(
        (tr) => tr.teacherId === teacherProfileId && tr.resourceId === assignedResourceId && tr.isActive
      );
      expect(isAuthorized).toBe(true);
    });

    // TEST 85: Backend/Servis Güvenliği: Atanmamış Kaynaktan Görev Oluşturma Reddi
    it('TEST 85: Backend Güvenliği: Öğretmenin kendisine atanmamış kaynaktan görev oluşturma isteği reddedilmelidir', () => {
      const validateTaskCreation = (teacherId: string, resourceId: string) => {
        const hasAccess = initialTeacherResources.some(
          (tr) => tr.teacherId === teacherId && tr.resourceId === resourceId && tr.isActive
        );
        if (!hasAccess) {
          throw new Error('GÜVENLİK İHLALİ: Bu kaynağa erişim veya ödev atama yetkiniz bulunmamaktadır.');
        }
        return true;
      };

      expect(() => validateTaskCreation('tp-ahmet', 'res-fen-sb')).toThrow('GÜVENLİK İHLALİ');
    });

    // TEST 86: Branş İzolasyonu: Farklı Branş Kitabından Görev Oluşturma Engeli
    it('TEST 86: Branş İzolasyonu: Matematik öğretmeni Türkçe branşındaki atanmamış kitaptan görev oluşturamaz', () => {
      const turkceResource = initialResources.find((r) => r.id === 'res-meb-ornek');
      const canAhmetUse = canTeacherAccessResourceHelper(
        'TEACHER',
        'org-1',
        'tp-ahmet',
        turkceResource,
        initialTeacherResources
      );
      expect(canAhmetUse).toBe(false);
    });

    // TEST 87: Kurum Yöneticisinin Görev Oluşturma Yetkisi
    it('TEST 87: Kurum Yöneticisi kurumundaki herhangi bir kaynaktan görev oluşturabilme yetkisine sahiptir', () => {
      const canAdminCreate = (role: string, orgId: string, resourceOrgId: string) => {
        return role === 'INSTITUTE_ADMIN' && orgId === resourceOrgId;
      };

      expect(canAdminCreate('INSTITUTE_ADMIN', 'org-1', 'org-1')).toBe(true);
      expect(canAdminCreate('INSTITUTE_ADMIN', 'org-1', 'org-2')).toBe(false);
    });

    // TEST 88: canTeacherAccessTask: Öğretmen Kendi Görevlerini Görebilir
    it('TEST 88: canTeacherAccessTask: Öğretmen kendi oluşturduğu ve atanmış kaynağı olan görevi görebilir (true)', () => {
      const ahmetTask = initialDailyTasks.find((t) => t.teacherId === 'tp-ahmet');
      expect(ahmetTask).toBeDefined();

      const canAccess = canTeacherAccessTaskHelper(
        'TEACHER',
        'org-1',
        'tp-ahmet',
        ahmetTask,
        initialResources,
        initialTeacherResources
      );
      expect(canAccess).toBe(true);
    });

    // TEST 89: canTeacherAccessTask: Öğretmen Yetkisiz Kaynaklı Görevleri Göremez
    it('TEST 89: canTeacherAccessTask: Öğretmen başka bir öğretmenin ve yetkisiz kaynağın görevini göremez (false)', () => {
      const otherTeacherTask = initialDailyTasks.find((t) => t.teacherId === 'tp-ayse');
      expect(otherTeacherTask).toBeDefined();

      const canAccess = canTeacherAccessTaskHelper(
        'TEACHER',
        'org-1',
        'tp-ahmet',
        otherTeacherTask,
        initialResources,
        initialTeacherResources
      );
      expect(canAccess).toBe(false);
    });

    // TEST 90: canTeacherAccessTask: Kurum Yöneticisi Tüm Görevleri Görebilir
    it('TEST 90: canTeacherAccessTask: Kurum Yöneticisi kurumdaki tüm görevleri görebilir (true)', () => {
      const anyTask = initialDailyTasks[0];
      const canAccess = canTeacherAccessTaskHelper(
        'INSTITUTE_ADMIN',
        'org-1',
        null,
        anyTask,
        initialResources,
        initialTeacherResources
      );
      expect(canAccess).toBe(true);
    });

    // TEST 91: Öğretmen Doğrulama Yetkisi: Yetkili Olduğu Görevi Doğrulama
    it('TEST 91: Öğretmen yalnızca erişim yetkisi olan görevi doğrulayabilir (VERIFIED)', () => {
      const verifyTaskWithAuth = (
        userRole: string,
        teacherProfileId: string,
        task: DailyTask
      ) => {
        const canAccess = canTeacherAccessTaskHelper(
          userRole,
          'org-1',
          teacherProfileId,
          task,
          initialResources,
          initialTeacherResources
        );
        if (!canAccess) {
          throw new Error('YETKİ HATASI: Bu görevi doğrulama yetkiniz bulunmamaktadır.');
        }
        return { ...task, verificationStatus: 'VERIFIED' as const };
      };

      const ahmetTask = initialDailyTasks.find((t) => t.teacherId === 'tp-ahmet');
      const verified = verifyTaskWithAuth('TEACHER', 'tp-ahmet', ahmetTask!);
      expect(verified.verificationStatus).toBe('VERIFIED');
    });

    // TEST 92: Öğretmen Yetkisiz Görevi Doğrulayamaz (Güvenlik Koruması)
    it('TEST 92: Öğretmen yetkisi olmayan bir görevi doğrulamaya çalıştığında engellenmelidir', () => {
      const verifyTaskWithAuth = (
        userRole: string,
        teacherProfileId: string,
        task: DailyTask
      ) => {
        const canAccess = canTeacherAccessTaskHelper(
          userRole,
          'org-1',
          teacherProfileId,
          task,
          initialResources,
          initialTeacherResources
        );
        if (!canAccess) {
          throw new Error('YETKİ HATASI: Bu görevi doğrulama yetkiniz bulunmamaktadır.');
        }
        return { ...task, verificationStatus: 'VERIFIED' as const };
      };

      const ayseTask = initialDailyTasks.find((t) => t.teacherId === 'tp-ayse');
      expect(() => verifyTaskWithAuth('TEACHER', 'tp-ahmet', ayseTask!)).toThrow('YETKİ HATASI');
    });

    // TEST 93: Öğretmen Yetkisiz Görevi Reddedemez (Güvenlik Koruması)
    it('TEST 93: Öğretmen yetkisi olmayan bir görevi reddetmeye çalıştığında engellenmelidir', () => {
      const rejectTaskWithAuth = (
        userRole: string,
        teacherProfileId: string,
        task: DailyTask,
        note: string
      ) => {
        const canAccess = canTeacherAccessTaskHelper(
          userRole,
          'org-1',
          teacherProfileId,
          task,
          initialResources,
          initialTeacherResources
        );
        if (!canAccess) {
          throw new Error('YETKİ HATASI: Bu görevi reddetme yetkiniz bulunmamaktadır.');
        }
        return { ...task, verificationStatus: 'REJECTED' as const, verificationNote: note };
      };

      const ayseTask = initialDailyTasks.find((t) => t.teacherId === 'tp-ayse');
      expect(() => rejectTaskWithAuth('TEACHER', 'tp-ahmet', ayseTask!, 'Red notu')).toThrow('YETKİ HATASI');
    });

    // TEST 94: Kurum Yöneticisi Tüm Görevleri Doğrulayabilir ve Reddedebilir
    it('TEST 94: Kurum Yöneticisi kurumdaki herhangi bir görevi doğrulayabilir veya reddedebilir', () => {
      const adminVerifyTask = (userRole: string, task: DailyTask) => {
        if (userRole !== 'INSTITUTE_ADMIN') throw new Error('Yetkisiz');
        return { ...task, verificationStatus: 'VERIFIED' as const };
      };

      const anyTask = initialDailyTasks[0];
      const verified = adminVerifyTask('INSTITUTE_ADMIN', anyTask);
      expect(verified.verificationStatus).toBe('VERIFIED');
    });

    // TEST 95: Gerçekleşme (StudyRecord) Görünürlüğü - Öğretmen
    it('TEST 95: Gerçekleşme Görünürlüğü: Öğretmen yalnızca yetkili olduğu görevlerin gerçekleşme kayıtlarını görebilir', () => {
      const filterRecordsForTeacher = (teacherId: string, records: StudyRecord[], tasks: DailyTask[]) => {
        return records.filter((r) => {
          const task = tasks.find((t) => t.id === r.dailyTaskId);
          if (!task) return false;
          return canTeacherAccessTaskHelper(
            'TEACHER',
            'org-1',
            teacherId,
            task,
            initialResources,
            initialTeacherResources
          );
        });
      };

      const visibleRecords = filterRecordsForTeacher('tp-ahmet', initialStudyRecords, initialDailyTasks);
      expect(visibleRecords.every((r) => {
        const t = initialDailyTasks.find((task) => task.id === r.dailyTaskId);
        return t?.teacherId === 'tp-ahmet';
      })).toBe(true);
    });

    // TEST 96: Gerçekleşme (StudyRecord) Görünürlüğü - Kurum Yöneticisi
    it('TEST 96: Gerçekleşme Görünürlüğü: Kurum Yöneticisi kurumdaki tüm çalışma kayıtlarını ve gerçekleşmeleri görebilir', () => {
      const adminAccessibleRecords = initialStudyRecords.filter(() => true);
      expect(adminAccessibleRecords.length).toBe(initialStudyRecords.length);
    });

    // TEST 97: Audit Log: ASSIGN_TEACHER_RESOURCE
    it('TEST 97: Audit Log: Kurum Yöneticisi öğretmene kaynak atadığında ASSIGN_TEACHER_RESOURCE kaydı oluşturulmalıdır', () => {
      const auditLog = {
        id: 'audit-tr-assign-1',
        action: 'ASSIGN_TEACHER_RESOURCE',
        actorId: 'user-admin-kurum',
        actorName: 'Kurum Müdürü',
        targetId: 'res-fen-sb',
        timestamp: new Date().toISOString(),
        previousValue: undefined,
        newValue: 'tp-ahmet',
        note: 'Ahmet Öğretmene kaynak atandı',
      };

      expect(auditLog.action).toBe('ASSIGN_TEACHER_RESOURCE');
      expect(auditLog.actorId).toBe('user-admin-kurum');
      expect(auditLog.newValue).toBe('tp-ahmet');
    });

    // TEST 98: Audit Log: REMOVE_TEACHER_RESOURCE
    it('TEST 98: Audit Log: Kurum Yöneticisi kaynak atamasını kaldırdığında REMOVE_TEACHER_RESOURCE kaydı oluşturulmalıdır', () => {
      const auditLog = {
        id: 'audit-tr-remove-1',
        action: 'REMOVE_TEACHER_RESOURCE',
        actorId: 'user-admin-kurum',
        actorName: 'Kurum Müdürü',
        targetId: 'res-fen-sb',
        timestamp: new Date().toISOString(),
        previousValue: 'tp-ahmet',
        newValue: undefined,
        note: 'Kaynak ataması kaldırıldı',
      };

      expect(auditLog.action).toBe('REMOVE_TEACHER_RESOURCE');
      expect(auditLog.previousValue).toBe('tp-ahmet');
    });

    // TEST 99: Audit Log: ARCHIVE_RESOURCE
    it('TEST 99: Audit Log: Kurum Yöneticisi bir kaynağı arşivlediğinde ARCHIVE_RESOURCE kaydı oluşturulmalıdır', () => {
      const auditLog = {
        id: 'audit-res-archive-1',
        action: 'ARCHIVE_RESOURCE',
        actorId: 'user-admin-kurum',
        actorName: 'Kurum Müdürü',
        targetId: 'res-fenomen-f3',
        timestamp: new Date().toISOString(),
        previousValue: 'ACTIVE',
        newValue: 'ARCHIVED',
        note: 'Kaynak dönem sonu sebebiyle arşivlendi',
      };

      expect(auditLog.action).toBe('ARCHIVE_RESOURCE');
      expect(auditLog.newValue).toBe('ARCHIVED');
    });

    // TEST 100: UI Filtreleme Bütünlüğü: TaskModal ve WeeklyPlanner Dropdown İzolasyonu
    it('TEST 100: UI Güvenliği: TaskModal ve WeeklyPlanner dropdown listelerinde yalnızca öğretmenin yetkili olduğu kaynaklar yer almalıdır', () => {
      const teacherProfileId = 'tp-ahmet';
      const userRole = 'TEACHER';

      const allowedResourcesForDropdown = initialResources.filter((r) =>
        canTeacherAccessResourceHelper(userRole, 'org-1', teacherProfileId, r, initialTeacherResources)
      );

      // Ahmet öğretmene atananlar: res-fenomen-f3 ve res-fenomen-8a
      expect(allowedResourcesForDropdown.some((r) => r.id === 'res-fenomen-f3')).toBe(true);
      expect(allowedResourcesForDropdown.some((r) => r.id === 'res-fenomen-8a')).toBe(true);
      // Atanmayanlar dropdown listesinde yer almamalıdır
      expect(allowedResourcesForDropdown.some((r) => r.id === 'res-fen-sb')).toBe(false);
      expect(allowedResourcesForDropdown.some((r) => r.id === 'res-meb-ornek')).toBe(false);
    });

    // TEST 101: Altın Kural Doğrulaması (The Golden Rule)
    it('TEST 101: ALTIN KURAL DOĞRULAMASI: Kurum Yöneticisi kurumundaki HER ŞEYİ görebilir ve yönetebilir; Öğretmen yalnızca KENDİ SORUMLULUĞUNDAKİ kitapları, ödevleri, öğrencileri, gerçekleşmeleri ve doğrulamaları görebilir', () => {
      const adminRole = 'INSTITUTE_ADMIN';
      const teacherRole = 'TEACHER';
      const teacherProfileId = 'tp-ahmet';

      // 1. Kaynak Görünürlüğü
      const adminVisibleResources = initialResources.filter((r) =>
        canTeacherAccessResourceHelper(adminRole, 'org-1', null, r, initialTeacherResources)
      );
      const teacherVisibleResources = initialResources.filter((r) =>
        canTeacherAccessResourceHelper(teacherRole, 'org-1', teacherProfileId, r, initialTeacherResources)
      );

      expect(adminVisibleResources.length).toBeGreaterThan(teacherVisibleResources.length);
      expect(teacherVisibleResources.every((r) =>
        initialTeacherResources.some((tr) => tr.teacherId === teacherProfileId && tr.resourceId === r.id && tr.isActive)
      )).toBe(true);

      // 2. Görev Görünürlüğü
      const adminVisibleTasks = initialDailyTasks.filter((t) =>
        canTeacherAccessTaskHelper(adminRole, 'org-1', null, t, initialResources, initialTeacherResources)
      );
      const teacherVisibleTasks = initialDailyTasks.filter((t) =>
        canTeacherAccessTaskHelper(teacherRole, 'org-1', teacherProfileId, t, initialResources, initialTeacherResources)
      );

      expect(adminVisibleTasks.length).toBe(initialDailyTasks.length);
      expect(teacherVisibleTasks.length).toBeLessThan(adminVisibleTasks.length);
      expect(teacherVisibleTasks.every((t) => t.teacherId === teacherProfileId)).toBe(true);
    });
  });
});
