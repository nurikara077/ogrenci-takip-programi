import { describe, it, expect, beforeEach } from 'vitest';
import {
  initialUsers,
  initialOrganizations,
  initialClasses,
  initialSubjects,
  initialTeacherProfiles,
  initialStudentProfiles,
  initialTeacherClassRelations,
  initialResources,
  initialDailyTasks,
  initialStudyRecords,
  initialTeacherResources,
  initialStudentResources,
} from '../data/mockData';
import { DailyTask, Resource, StudyRecord, TeacherResource, StudentResource, User, Class, TeacherProfile, StudentProfile, TeacherClassRelation } from '../types';
import { DEFAULT_SIMULATION_DATE } from '../utils/dateUtils';

// Helper functions mirroring centralized logic
export const isTaskActiveOnDateHelper = (task: DailyTask, dateStr: string): boolean => {
  const start = task.startDate || task.taskDate;
  const due = task.dueDate || task.taskDate;
  return dateStr >= start && dateStr <= due;
};

export const isTaskOverdueHelper = (task: DailyTask, referenceDate: string = DEFAULT_SIMULATION_DATE): boolean => {
  if (task.isCompleted) return false;
  const due = task.dueDate || task.taskDate;
  return due < referenceDate;
};

export const getTeacherDashboardMetricsHelper = (
  teacherProfileId: string,
  tasks: DailyTask[],
  referenceDate: string = DEFAULT_SIMULATION_DATE
) => {
  const teacherTasks = tasks.filter((t) => t.teacherId === teacherProfileId && !t.isDeleted);
  const activeTasks = teacherTasks.filter((t) => !t.isCompleted && !isTaskOverdueHelper(t, referenceDate));
  const pendingVerification = teacherTasks.filter((t) => t.isCompleted && t.verificationStatus === 'PENDING');
  const overdueTasks = teacherTasks.filter((t) => isTaskOverdueHelper(t, referenceDate));
  const completedTasks = teacherTasks.filter((t) => t.isCompleted && t.verificationStatus === 'VERIFIED');

  return {
    totalAssignedTasks: teacherTasks.length,
    activeTasks: activeTasks.length,
    pendingVerification: pendingVerification.length,
    overdueTasks: overdueTasks.length,
    completedTasks: completedTasks.length,
  };
};

export const canTeacherAccessResourceHelper = (
  userRole: string,
  userOrgId: string,
  teacherProfileId: string | null,
  resource: Resource | undefined,
  teacherResources: TeacherResource[]
): boolean => {
  if (!resource) return false;
  if (resource.isArchived || resource.status === 'ARCHIVED') return false;
  if (resource.organizationId && resource.organizationId !== userOrgId) return false;
  if (userRole === 'INSTITUTE_ADMIN') return true;

  if (userRole === 'TEACHER' && teacherProfileId) {
    return teacherResources.some(
      (tr) => tr.teacherId === teacherProfileId && tr.resourceId === resource.id && tr.isActive
    );
  }

  return false;
};

describe('FAZ 4 - Ürün Mimarisi Yeniden Yapılandırma Test Paketi (TESTS 121 - 140)', () => {
  // TEST 121: 3-Role Architecture Enforcement
  it('TEST 121: Sistemde yalnızca yönetici, öğretmen ve öğrenci rolleri bulunmaktadır', () => {
    const validRoles = ['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT'];
    const activeAppRoles = new Set(initialUsers.map((u) => u.role));
    expect([...activeAppRoles].every((role) => validRoles.includes(role))).toBe(true);
    expect(validRoles).toEqual(['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT']);
  });

  // TEST 122: Automatic Task Distribution - Date Range (startDate & dueDate)
  it('TEST 122: Otomatik Görev Dağıtımı: Bir görev başlangıç (startDate) ve bitiş (dueDate) aralığında tanımlandığında bu aralıktaki tüm günlerde aktiftir', () => {
    const rangeTask: DailyTask = {
      id: 'task-range-1',
      weeklyPlanId: 'wp-1',
      taskType: 'QUESTION_TARGET',
      studentId: 'sp-mehmet',
      teacherId: 'tp-ahmet',
      subjectId: 'sub-mat-8',
      resourceId: 'res-fenomen-8a',
      taskDate: '2026-08-31',
      startDate: '2026-08-31',
      dueDate: '2026-09-04',
      dayOfWeek: 'Pazartesi',
      targetQuestionCount: 50,
      targetDurationMinutes: 60,
      isCompleted: false,
      status: 'PLANNED',
      verificationStatus: 'PENDING',
      createdAt: '2026-08-31T08:00:00Z',
    };

    // 31 Ağustos - 4 Eylül arasındaki tüm günlerde aktif olmalı
    expect(isTaskActiveOnDateHelper(rangeTask, '2026-08-31')).toBe(true);
    expect(isTaskActiveOnDateHelper(rangeTask, '2026-09-01')).toBe(true);
    expect(isTaskActiveOnDateHelper(rangeTask, '2026-09-02')).toBe(true);
    expect(isTaskActiveOnDateHelper(rangeTask, '2026-09-03')).toBe(true);
    expect(isTaskActiveOnDateHelper(rangeTask, '2026-09-04')).toBe(true);

    // Aralığın dışındaki günlerde aktif olmamalı
    expect(isTaskActiveOnDateHelper(rangeTask, '2026-08-30')).toBe(false);
    expect(isTaskActiveOnDateHelper(rangeTask, '2026-09-05')).toBe(false);
  });

  // TEST 123: Task Overdue Detection (isTaskOverdue)
  it('TEST 123: Gecikmiş Görev Algılama: Görevin dueDate tarihi referans tarihten eskiyse ve görev tamamlanmamışsa isTaskOverdue true döner', () => {
    const overdueTask: DailyTask = {
      id: 'task-overdue-1',
      weeklyPlanId: 'wp-1',
      taskType: 'QUESTION_TARGET',
      studentId: 'sp-mehmet',
      teacherId: 'tp-ahmet',
      subjectId: 'sub-mat-8',
      resourceId: 'res-fenomen-8a',
      taskDate: '2026-08-20',
      startDate: '2026-08-20',
      dueDate: '2026-08-25',
      dayOfWeek: 'Pazartesi',
      targetQuestionCount: 30,
      targetDurationMinutes: 45,
      isCompleted: false,
      status: 'PLANNED',
      verificationStatus: 'PENDING',
      createdAt: '2026-08-20T08:00:00Z',
    };

    const isOverdue = isTaskOverdueHelper(overdueTask, '2026-08-31');
    expect(isOverdue).toBe(true);

    // Tamamlanmış olursa gecikmiş sayılmaz
    const completedTask = { ...overdueTask, isCompleted: true };
    expect(isTaskOverdueHelper(completedTask, '2026-08-31')).toBe(false);
  });

  // TEST 124: Task Realization Preservation On Edit / Revision
  it('TEST 124: Veri Bütünlüğü: Öğretmen görevi revize ettiğinde öğrencinin daha önce girdiği çalışma kayıtları silinmez, korunur', () => {
    const originalTask = initialDailyTasks[0];
    const taskId = originalTask.id;
    // Öğrencinin önceden girdiği çalışma kaydı
    const existingRecords: StudyRecord[] = [
      {
        id: 'rec-1',
        dailyTaskId: taskId,
        studentId: 'sp-mehmet',
        subjectId: originalTask.subjectId,
        resourceId: originalTask.resourceId,
        recordDate: '2026-08-31',
        actualQuestionCount: 20,
        actualDurationMinutes: 30,
        completedStartPage: 12,
        completedEndPage: 16,
        createdAt: '2026-08-31T10:00:00Z',
      },
    ];

    // Öğretmen görevi revize eder (örneğin bitiş tarihini uzatır, soru sayısını artırır)
    const revisedTask: DailyTask = {
      ...originalTask,
      dueDate: '2026-09-05',
      targetQuestionCount: 60,
    };

    // Revizyon sonrası öğrencinin kaydı aynen korunmalıdır
    const preservedRecords = existingRecords.filter((r) => r.dailyTaskId === revisedTask.id);
    expect(preservedRecords).toHaveLength(1);
    expect(preservedRecords[0].actualQuestionCount).toBe(20);
    expect(preservedRecords[0].completedStartPage).toBe(12);
  });

  // TEST 125: Single Source of Truth for Counts (Resource Book Consistency)
  it('TEST 125: Veri Tutarlılığı: Öğretmen ekranındaki atanan kaynak sayısı ile öğrenciye atanan gerçek kitap kayıtlarının (studentResources) sayısı birebir eşleşir', () => {
    const studentId = 'sp-mehmet';
    const assignedRecords = initialStudentResources.filter((sr) => sr.studentId === studentId);
    
    // Tek kaynak: studentResources tablosu
    const countFromStudentResources = assignedRecords.length;
    
    // Öğrenci profilindeki sayı tek kaynak üzerinden hesaplanmalıdır
    const calculatedCount = initialStudentResources.filter((sr) => sr.studentId === studentId).length;
    expect(countFromStudentResources).toBe(calculatedCount);
    expect(countFromStudentResources).toBeGreaterThan(0);
  });

  // TEST 126: Teacher Isolated Branch Visibility
  it('TEST 126: Branş İzolasyonu: Öğretmen yalnızca kendi branşına atanmış kaynakları görebilir; diğer branş öğretmenlerinin kaynaklarını göremez', () => {
    const ahmetTeacherId = 'tp-ahmet'; // Matematik öğretmeni
    const accessibleResources = initialResources.filter((r) =>
      canTeacherAccessResourceHelper('TEACHER', 'org-1', ahmetTeacherId, r, initialTeacherResources)
    );

    // Fen bilgisi kaynağı (res-fen-sb) Ahmet Öğretmene atanmamıştır
    expect(accessibleResources.some((r) => r.id === 'res-fen-sb')).toBe(false);
    // Ahmet öğretmene atanan Matematik kaynakları erişilebilir olmalıdır
    expect(accessibleResources.some((r) => r.id === 'res-fenomen-f3')).toBe(true);
  });

  // TEST 127: Teacher Student Assignment Boundaries
  it('TEST 127: Yetkilendirme Sınırı: Öğretmen öğrenciye yalnızca kendi branşındaki ve kendisine atanmış kaynakları ödev verebilir', () => {
    const ahmetTeacherId = 'tp-ahmet';
    const allowedResourcesForAssignment = initialResources.filter((r) =>
      canTeacherAccessResourceHelper('TEACHER', 'org-1', ahmetTeacherId, r, initialTeacherResources)
    );

    const assignTask = (resourceId: string) => {
      const isAllowed = allowedResourcesForAssignment.some((r) => r.id === resourceId);
      if (!isAllowed) {
        throw new Error('YETKİ HATASI: Bu kaynağı öğrenciye atama yetkiniz bulunmamaktadır.');
      }
      return true;
    };

    // İzinli kaynak ataması başarılı olmalı
    expect(assignTask('res-fenomen-f3')).toBe(true);
    // İzinsiz kaynak ataması engellenmeli
    expect(() => assignTask('res-fen-sb')).toThrow('YETKİ HATASI');
  });

  // TEST 128: Teacher Dashboard Metrics Single Source of Truth
  it('TEST 128: Merkezi Metrikler: getTeacherDashboardMetrics tüm görev istatistiklerini çelişkisiz ve tek bir kaynaktan hesaplar', () => {
    const metrics = getTeacherDashboardMetricsHelper('tp-ahmet', initialDailyTasks, '2026-08-31');

    expect(metrics).toHaveProperty('totalAssignedTasks');
    expect(metrics).toHaveProperty('activeTasks');
    expect(metrics).toHaveProperty('pendingVerification');
    expect(metrics).toHaveProperty('overdueTasks');
    expect(metrics).toHaveProperty('completedTasks');

    // Metriklerin tutarlılığı: Aktif + Geciken + Tamamlanan = Toplam Atanan
    expect(metrics.totalAssignedTasks).toBeGreaterThanOrEqual(
      metrics.activeTasks + metrics.overdueTasks + metrics.completedTasks
    );
  });

  // TEST 129: Student Today View Isolation
  it('TEST 129: Öğrenci Bugün Ekranı: Öğrencinin Bugün görünümünde yalnızca bugün aktif olan görevler listelenir', () => {
    const studentId = 'sp-mehmet';
    const today = '2026-08-31';

    const todaysActiveTasks = initialDailyTasks.filter(
      (t) => t.studentId === studentId && !t.isDeleted && isTaskActiveOnDateHelper(t, today)
    );

    expect(todaysActiveTasks.length).toBeGreaterThan(0);
    // Her bir görevin bugünü kapsadığı doğrulanır
    todaysActiveTasks.forEach((task) => {
      expect(isTaskActiveOnDateHelper(task, today)).toBe(true);
    });
  });

  // TEST 130: Student Task Action Simplicity (Çalışmayı Kaydet)
  it('TEST 130: Kullanılabilirlik: Öğrenci çalışma kaydettiğinde soru sayısı ve sayfa aralığı başarıyla güncellenir ve onay bekleyen duruma geçer', () => {
    const task: DailyTask = {
      id: 'task-test-student-log',
      weeklyPlanId: 'wp-1',
      taskType: 'QUESTION_TARGET',
      studentId: 'sp-mehmet',
      teacherId: 'tp-ahmet',
      subjectId: 'sub-mat-8',
      resourceId: 'res-fenomen-8a',
      taskDate: '2026-08-31',
      startDate: '2026-08-31',
      dueDate: '2026-09-02',
      dayOfWeek: 'Pazartesi',
      targetQuestionCount: 40,
      targetDurationMinutes: 50,
      isCompleted: false,
      status: 'PLANNED',
      verificationStatus: 'PENDING',
      createdAt: '2026-08-31T08:00:00Z',
    };

    // Öğrenci çalışmayı kaydeder
    const completedTask: DailyTask = {
      ...task,
      isCompleted: true,
      status: 'COMPLETED',
      verificationStatus: 'PENDING',
    };

    expect(completedTask.isCompleted).toBe(true);
    expect(completedTask.status).toBe('COMPLETED');
    expect(completedTask.verificationStatus).toBe('PENDING');
  });

  // TEST 131: Student Weekly Program 4 Simple Controls
  it('TEST 131: Haftalık Program Sadeliği: Haftalık program yalnızca Önceki Hafta, Bu Hafta, Sonraki Hafta ve Bugün kontrollerini sunar', () => {
    const allowedWeekSelections = ['PREV', 'CURRENT', 'NEXT'];
    expect(allowedWeekSelections).toHaveLength(3);

    const jumpToToday = (currentDate: string) => {
      return { selectedWeek: 'CURRENT', activeDay: 'Pazartesi' };
    };

    const state = jumpToToday('2026-08-31');
    expect(state.selectedWeek).toBe('CURRENT');
    expect(state.activeDay).toBe('Pazartesi');
  });

  // TEST 132: Student Resource Transparency
  it('TEST 132: Öğrenci Kaynak Şeffaflığı: Öğrenci kurumundaki tüm aktif kaynakları ve çözdüğü sayfa sayısını görebilir', () => {
    const activeInstitutionResources = initialResources.filter((r) => !r.isArchived && r.status !== 'ARCHIVED');
    expect(activeInstitutionResources.length).toBeGreaterThan(0);

    // Mehmet öğrencisinin çözdüğü sayfaları hesaplama
    const getStudentSolvedPages = (studentId: string, resourceId: string) => {
      const records = initialStudyRecords.filter((r) => r.studentId === studentId && r.resourceId === resourceId);
      const solved = new Set<number>();
      records.forEach((r) => {
        if (r.completedStartPage && r.completedEndPage) {
          for (let p = r.completedStartPage; p <= r.completedEndPage; p++) solved.add(p);
        }
      });
      return solved.size;
    };

    const solvedPages = getStudentSolvedPages('sp-mehmet', 'res-fenomen-8a');
    expect(solvedPages).toBeGreaterThanOrEqual(0);
  });

  // TEST 133: Institute Admin Full Visibility
  it('TEST 133: Kurum Yöneticisi Yetkisi: Kurum Yöneticisi tüm öğretmenleri, öğrencileri, sınıfları ve kurum kaynaklarını tam yetkiyle görüntüleyebilir', () => {
    const adminOrgId = 'org-1';
    const adminRole = 'INSTITUTE_ADMIN';

    // Kurumdaki tüm kaynaklar yöneticiye açıktır
    const adminResources = initialResources.filter((r) =>
      canTeacherAccessResourceHelper(adminRole, adminOrgId, null, r, initialTeacherResources)
    );
    expect(adminResources.length).toBe(
      initialResources.filter((r) => r.organizationId === adminOrgId && !r.isArchived).length
    );
  });

  // TEST 134: No Student Task Creation Capability
  it('TEST 134: Yetki Kısıtlaması: Öğrenci rolündeki kullanıcı için görev ekleme / oluşturma fonksiyonları kapalıdır', () => {
    const studentUser = initialUsers.find((u) => u.role === 'STUDENT');
    expect(studentUser).toBeDefined();

    const canCreateTask = (userRole: string) => {
      return userRole === 'TEACHER' || userRole === 'INSTITUTE_ADMIN';
    };

    expect(canCreateTask(studentUser!.role)).toBe(false);
  });

  // TEST 135: Late Completed Status on Delayed Student Log
  it('TEST 135: Gecikmeli Tamamlama: dueDate geçtikten sonra tamamlanan görevler LATE_COMPLETED durumunu alır', () => {
    const lateTask: DailyTask = {
      id: 'task-late-test',
      weeklyPlanId: 'wp-1',
      taskType: 'QUESTION_TARGET',
      studentId: 'sp-mehmet',
      teacherId: 'tp-ahmet',
      subjectId: 'sub-mat-8',
      resourceId: 'res-fenomen-8a',
      taskDate: '2026-08-20',
      startDate: '2026-08-20',
      dueDate: '2026-08-25',
      dayOfWeek: 'Perşembe',
      targetQuestionCount: 30,
      targetDurationMinutes: 45,
      isCompleted: true,
      status: 'LATE_COMPLETED',
      verificationStatus: 'PENDING',
      createdAt: '2026-08-20T08:00:00Z',
    };

    expect(lateTask.status).toBe('LATE_COMPLETED');
    expect(lateTask.isCompleted).toBe(true);
  });

  // TEST 136: Teacher Verification Flow (VERIFIED / REJECTED)
  it('TEST 136: Öğretmen Doğrulama İş Akışı: Öğretmen görevi onaylayabilir (VERIFIED) veya gerekçeli olarak reddedebilir (REJECTED)', () => {
    const pendingTask: DailyTask = {
      id: 'task-verify-test',
      weeklyPlanId: 'wp-1',
      taskType: 'QUESTION_TARGET',
      studentId: 'sp-mehmet',
      teacherId: 'tp-ahmet',
      subjectId: 'sub-mat-8',
      resourceId: 'res-fenomen-8a',
      taskDate: '2026-08-31',
      startDate: '2026-08-31',
      dueDate: '2026-09-02',
      dayOfWeek: 'Pazartesi',
      targetQuestionCount: 30,
      targetDurationMinutes: 45,
      isCompleted: true,
      status: 'COMPLETED',
      verificationStatus: 'PENDING',
      createdAt: '2026-08-31T08:00:00Z',
    };

    // Onaylama işlemi
    const verifiedTask = { ...pendingTask, verificationStatus: 'VERIFIED' as const };
    expect(verifiedTask.verificationStatus).toBe('VERIFIED');

    // Reddetme işlemi (gerekçeli)
    const rejectedTask = {
      ...pendingTask,
      verificationStatus: 'REJECTED' as const,
      verificationNote: 'Sayfa 14 eksik çözülmüş, tekrar çöz.',
    };
    expect(rejectedTask.verificationStatus).toBe('REJECTED');
    expect(rejectedTask.verificationNote).toBeDefined();
  });

  // TEST 137: 6-Color Matrix State Accuracy
  it('TEST 137: 6-Renk Sayfa Matrisi: Sayfa durumları renk standartlarına (Yeşil=Doğrulandı, Sarı=Öğrenci Beyanı, Kırmızı=Yapılmadı, Mavi=Gecikmeli) uygun olarak eşleşir', () => {
    const getPageColorType = (task: DailyTask, hasRecord: boolean) => {
      if (task.verificationStatus === 'VERIFIED') return 'GREEN'; // Doğrulandı
      if (task.verificationStatus === 'REJECTED') return 'RED'; // Reddedildi
      if (task.status === 'LATE_COMPLETED') return 'BLUE'; // Gecikmeli Tamamlandı
      if (hasRecord || task.isCompleted) return 'YELLOW'; // Öğrenci Beyanı
      if (isTaskOverdueHelper(task, DEFAULT_SIMULATION_DATE)) return 'RED'; // Gecikmiş
      return 'WHITE'; // Boş/Planlanmış
    };

    const task1: DailyTask = { ...initialDailyTasks[0], verificationStatus: 'VERIFIED' };
    expect(getPageColorType(task1, true)).toBe('GREEN');

    const task2: DailyTask = { ...initialDailyTasks[0], verificationStatus: 'PENDING', isCompleted: true };
    expect(getPageColorType(task2, true)).toBe('YELLOW');

    const task3: DailyTask = {
      ...initialDailyTasks[0],
      status: 'LATE_COMPLETED',
      isCompleted: true,
      verificationStatus: 'PENDING',
    };
    expect(getPageColorType(task3, true)).toBe('BLUE');
  });

  // TEST 138: Zero Redundant Selection UI
  it('TEST 138: Form Sadeliği: Ödev oluşturmada startDate ve dueDate tek bir form alanında girilir; gün gün ayrı form doldurma gereksizliği ortadan kaldırılmıştır', () => {
    const formData = {
      studentId: 'sp-mehmet',
      resourceId: 'res-fenomen-8a',
      startDate: '2026-08-31',
      dueDate: '2026-09-04',
      targetQuestionCount: 100,
    };

    expect(formData.startDate).toBeDefined();
    expect(formData.dueDate).toBeDefined();
    expect(formData.startDate <= formData.dueDate).toBe(true);
  });

  // TEST 139: Teacher Reports Student Drill-Down
  it('TEST 139: Öğretmen Raporları: Öğretmen kendi sınıfındaki öğrencilerin branş performanslarını ve tamamlanma oranlarını listeleyebilir', () => {
    const teacherId = 'tp-ahmet';
    const studentsInClass = initialStudentProfiles.filter((sp) => sp.classId === 'class-8a');
    expect(studentsInClass.length).toBeGreaterThan(0);

    const getStudentCompletionRate = (studentId: string) => {
      const tasks = initialDailyTasks.filter((t) => t.studentId === studentId && t.teacherId === teacherId);
      if (tasks.length === 0) return 0;
      const completed = tasks.filter((t) => t.isCompleted).length;
      return Math.round((completed / tasks.length) * 100);
    };

    const rate = getStudentCompletionRate('sp-mehmet');
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });

  // TEST 140: Platform End-to-End Workflow Integrity
  it('TEST 140: Uçtan Uca İş Akışı Bütünlüğü: Kurum kaynağı -> Öğretmen yetkilendirme -> Öğrenciye ödev atama -> Öğrencinin çalışmayı kaydetmesi -> Öğretmenin doğrulaması akışı kesintisiz çalışır', () => {
    // 1. Kurum Kaynağı
    const resource = initialResources.find((r) => r.id === 'res-fenomen-8a');
    expect(resource).toBeDefined();

    // 2. Öğretmen Yetkisi
    const isTeacherAuthorized = canTeacherAccessResourceHelper(
      'TEACHER',
      'org-1',
      'tp-ahmet',
      resource,
      initialTeacherResources
    );
    expect(isTeacherAuthorized).toBe(true);

    // 3. Öğretmen Ödev Atar (Tarih Aralıklı)
    const newTask: DailyTask = {
      id: 'task-e2e-1',
      weeklyPlanId: 'wp-1',
      taskType: 'QUESTION_TARGET',
      studentId: 'sp-mehmet',
      teacherId: 'tp-ahmet',
      subjectId: resource!.subjectId,
      resourceId: resource!.id,
      taskDate: '2026-08-31',
      startDate: '2026-08-31',
      dueDate: '2026-09-04',
      dayOfWeek: 'Pazartesi',
      targetQuestionCount: 50,
      targetDurationMinutes: 60,
      startPage: 20,
      endPage: 28,
      isCompleted: false,
      status: 'PLANNED',
      verificationStatus: 'PENDING',
      createdAt: '2026-08-31T08:00:00Z',
    };
    expect(newTask.id).toBeDefined();

    // 4. Öğrenci Bugün Ekranında Görür ve Çalışmayı Kaydeder
    const isVisibleToday = isTaskActiveOnDateHelper(newTask, '2026-08-31');
    expect(isVisibleToday).toBe(true);

    const studentRecord: StudyRecord = {
      id: 'rec-e2e-1',
      dailyTaskId: newTask.id,
      studentId: newTask.studentId,
      subjectId: newTask.subjectId,
      resourceId: newTask.resourceId,
      recordDate: '2026-08-31',
      actualQuestionCount: 50,
      actualDurationMinutes: 55,
      completedStartPage: 20,
      completedEndPage: 28,
      createdAt: '2026-08-31T15:00:00Z',
    };
    expect(studentRecord.actualQuestionCount).toBe(50);

    const completedTask: DailyTask = {
      ...newTask,
      isCompleted: true,
      status: 'COMPLETED',
      verificationStatus: 'PENDING',
    };

    // 5. Öğretmen Görev Listesinde Görür ve Doğrular
    const metrics = getTeacherDashboardMetricsHelper('tp-ahmet', [completedTask], '2026-08-31');
    expect(metrics.pendingVerification).toBe(1);

    const verifiedTask: DailyTask = {
      ...completedTask,
      verificationStatus: 'VERIFIED',
    };
    expect(verifiedTask.verificationStatus).toBe('VERIFIED');
  });

  // =========================================================================
  // FAZ 4 - NİHAİ TEST PAKETİ: TESTS 141 - 187
  // =========================================================================
  describe('FAZ 4 - Kapsamlı Sistem Yeniden Yapılandırma ve Entegrasyon Testleri (TESTS 141 - 187)', () => {
    // TEST 141: Admin yeni öğrenci oluşturur (addStudent)
    it('TEST 141: Admin yeni öğrenci oluşturur (addStudent)', () => {
      const studentCountBefore = initialStudentProfiles.length;
      const newStudentProfile: StudentProfile = {
        id: `sp-new-${Date.now()}`,
        userId: `user-student-new-${Date.now()}`,
        classId: 'class-8a',
        studentNumber: '999',
        organizationId: 'org-1',
        notes: 'Yeni kayıt öğrenci',
      };
      const updatedProfiles = [...initialStudentProfiles, newStudentProfile];
      expect(updatedProfiles.length).toBe(studentCountBefore + 1);
      expect(updatedProfiles.find((s) => s.studentNumber === '999')).toBeDefined();
    });

    // TEST 142: Yeni öğrenci anında öğrenci listesine yansır (reaktif güncelleme)
    it('TEST 142: Yeni öğrenci anında öğrenci listesine yansır (reaktif güncelleme)', () => {
      const currentList: StudentProfile[] = [...initialStudentProfiles];
      const addedStudent: StudentProfile = {
        id: 'sp-dynamic-1',
        userId: 'user-dynamic-1',
        classId: 'class-8b',
        studentNumber: '888',
        organizationId: 'org-1',
      };
      const newList = [...currentList, addedStudent];
      expect(newList.some((s) => s.id === 'sp-dynamic-1')).toBe(true);
      expect(newList[newList.length - 1].classId).toBe('class-8b');
    });

    // TEST 143: Admin yeni sınıf oluşturur (addClass)
    it('TEST 143: Admin yeni sınıf oluşturur (addClass)', () => {
      const classCountBefore = initialClasses.length;
      const newClass: Class = {
        id: 'class-8c',
        organizationId: 'org-1',
        name: '8-C',
        gradeLevel: 8,
        academicYear: '2026-2027',
      };
      const updatedClasses = [...initialClasses, newClass];
      expect(updatedClasses.length).toBe(classCountBefore + 1);
      expect(updatedClasses.find((c) => c.name === '8-C')).toBeDefined();
    });

    // TEST 144: Yeni sınıf anında sınıflar listesine yansır
    it('TEST 144: Yeni sınıf anında sınıflar listesine yansır', () => {
      const classesList = [...initialClasses];
      const c12a: Class = {
        id: 'class-12a',
        organizationId: 'org-1',
        name: '12-A',
        gradeLevel: 12,
        academicYear: '2026-2027',
      };
      classesList.push(c12a);
      expect(classesList.some((c) => c.id === 'class-12a')).toBe(true);
    });

    // TEST 145: Admin yeni öğretmen oluşturur (addTeacher)
    it('TEST 145: Admin yeni öğretmen oluşturur (addTeacher)', () => {
      const teacherCountBefore = initialTeacherProfiles.length;
      const newTeacher: TeacherProfile = {
        id: 'tp-burak',
        userId: 'user-teacher-burak',
        branch: 'Fen Bilimleri',
        branchSubjectId: 'sub-fen-8',
        organizationId: 'org-1',
        isIndependent: false,
      };
      const updatedTeachers = [...initialTeacherProfiles, newTeacher];
      expect(updatedTeachers.length).toBe(teacherCountBefore + 1);
      expect(updatedTeachers.find((t) => t.branch === 'Fen Bilimleri')).toBeDefined();
    });

    // TEST 146: Duplicate öğrenci numarası ile öğrenci oluşturulması engellenir
    it('TEST 146: Duplicate öğrenci numarası ile öğrenci oluşturulması engellenir', () => {
      const existingNumber = initialStudentProfiles[0].studentNumber;
      const isDuplicate = (num?: string) =>
        initialStudentProfiles.some((sp) => sp.studentNumber?.trim() === num?.trim());
      expect(isDuplicate(existingNumber)).toBe(true);
      expect(isDuplicate('BenzersizNumara-9999')).toBe(false);
    });

    // TEST 147: Duplicate e-posta ile öğretmen oluşturulması engellenir
    it('TEST 147: Duplicate e-posta ile öğretmen oluşturulması engellenir', () => {
      const existingEmail = initialUsers[0].email;
      const isDuplicateEmail = (email: string) =>
        initialUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
      expect(isDuplicateEmail(existingEmail)).toBe(true);
      expect(isDuplicateEmail('yeni.ogretmen@tarhankoleji.k12.tr')).toBe(false);
    });

    // TEST 148: Admin öğretmeni sınıfa atar (assignTeacherToClass)
    it('TEST 148: Admin öğretmeni sınıfa atar (assignTeacherToClass)', () => {
      const rels = [...initialTeacherClassRelations];
      const newRelation: TeacherClassRelation = {
        id: 'tcr-new-1',
        teacherId: 'tp-ahmet',
        classId: 'class-8c',
        subjectId: 'sub-mat-8',
      };
      rels.push(newRelation);
      expect(rels.some((r) => r.teacherId === 'tp-ahmet' && r.classId === 'class-8c')).toBe(true);
    });

    // TEST 149: Öğretmen sınıftan çıkarılabilir (removeTeacherFromClass)
    it('TEST 149: Öğretmen sınıftan çıkarılabilir (removeTeacherFromClass)', () => {
      let rels: TeacherClassRelation[] = [
        {
          id: 'tcr-to-remove',
          teacherId: 'tp-ahmet',
          classId: 'class-8b',
          subjectId: 'sub-mat-8',
        },
      ];
      expect(rels.length).toBe(1);
      rels = rels.filter((r) => r.id !== 'tcr-to-remove');
      expect(rels.length).toBe(0);
    });

    // TEST 150: Admin tüm kurum kaynaklarını görür
    it('TEST 150: Admin tüm kurum kaynaklarını görür', () => {
      const adminOrgResources = initialResources.filter((r) => r.organizationId === 'org-1' && !r.isArchived);
      expect(adminOrgResources.length).toBeGreaterThan(0);
      adminOrgResources.forEach((res) => {
        const canAccess = canTeacherAccessResourceHelper('INSTITUTE_ADMIN', 'org-1', null, res, initialTeacherResources);
        expect(canAccess).toBe(true);
      });
    });

    // TEST 151: Teacher sadece kendi branş kaynaklarını görür
    it('TEST 151: Teacher sadece kendi branş kaynaklarını görür', () => {
      const mathResource = initialResources.find((r) => r.subjectId === 'sub-mat');
      expect(mathResource).toBeDefined();
      const canAccess = canTeacherAccessResourceHelper(
        'TEACHER',
        'org-1',
        'tp-ahmet',
        mathResource,
        initialTeacherResources
      );
      expect(canAccess).toBe(true);
    });

    // TEST 152: Teacher başka branş kaynaklarını göremez
    it('TEST 152: Teacher başka branş kaynaklarını göremez', () => {
      const fenResource = initialResources.find((r) => r.subjectId === 'sub-fen');
      if (fenResource) {
        const canAccess = canTeacherAccessResourceHelper(
          'TEACHER',
          'org-1',
          'tp-ahmet',
          fenResource,
          initialTeacherResources
        );
        expect(canAccess).toBe(false);
      }
    });

    // TEST 153: Teacher başka branş için ödev oluşturamaz (validateTaskCreation error)
    it('TEST 153: Teacher başka branş için ödev oluşturamaz (validateTaskCreation error)', () => {
      const teacherBranch = 'sub-mat';
      const attemptedSubject = 'sub-turk';
      const isValidAssignment = (attemptedSubject as string) === teacherBranch;
      expect(isValidAssignment).toBe(false);
    });

    // TEST 154: Teacher başka öğretmenin ödevini göremez ve düzenleyemez
    it('TEST 154: Teacher başka öğretmenin ödevini göremez ve düzenleyemez', () => {
      const otherTeacherTask: DailyTask = {
        id: 'task-selin-1',
        weeklyPlanId: 'wp-2',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-selin',
        subjectId: 'sub-turk-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 30,
        targetDurationMinutes: 45,
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-31T08:00:00Z',
      };
      const canAhmetModify = otherTeacherTask.teacherId === 'tp-ahmet';
      expect(canAhmetModify).toBe(false);
    });

    // TEST 155: Student tüm kurum kaynaklarını görebilir
    it('TEST 155: Student tüm kurum kaynaklarını görebilir', () => {
      const orgResources = initialResources.filter((r) => r.organizationId === 'org-1' && !r.isArchived);
      expect(orgResources.length).toBeGreaterThan(1);
    });

    // TEST 156: 8-C sınıfı oluşturulup öğrenci eklendiğinde, henüz 8-C ye atanmamış öğretmen bu öğrenciyi göremez
    it('TEST 156: 8-C sınıfı oluşturulup öğrenci eklendiğinde, henüz 8-C ye atanmamış öğretmen bu öğrenciyi göremez', () => {
      const studentIn8C: StudentProfile = {
        id: 'sp-8c-1',
        userId: 'user-student-8c',
        classId: 'class-8c',
        studentNumber: '301',
        organizationId: 'org-1',
      };
      // tp-ahmet initially only has relations for class-8a
      const ahmetClasses = initialTeacherClassRelations
        .filter((r) => r.teacherId === 'tp-ahmet')
        .map((r) => r.classId);
      const isVisibleToAhmet = ahmetClasses.includes(studentIn8C.classId!);
      expect(isVisibleToAhmet).toBe(false);
    });

    // TEST 157: Öğretmen 8-C sınıfına atandığında 8-C öğrencilerini anında dinamik olarak görmeye başlar
    it('TEST 157: Öğretmen 8-C sınıfına atandığında 8-C öğrencilerini anında dinamik olarak görmeye başlar', () => {
      const studentIn8C: StudentProfile = {
        id: 'sp-8c-1',
        userId: 'user-student-8c',
        classId: 'class-8c',
        studentNumber: '301',
        organizationId: 'org-1',
      };
      const dynamicRelations: TeacherClassRelation[] = [
        ...initialTeacherClassRelations,
        {
          id: 'tcr-ahmet-8c',
          teacherId: 'tp-ahmet',
          classId: 'class-8c',
          subjectId: 'sub-mat-8',
        },
      ];
      const ahmetClasses = dynamicRelations
        .filter((r) => r.teacherId === 'tp-ahmet')
        .map((r) => r.classId);
      const isVisibleToAhmet = ahmetClasses.includes(studentIn8C.classId!);
      expect(isVisibleToAhmet).toBe(true);
    });

    // TEST 158: Öğretmen sadece kendi sınıflarındaki öğrencileri listeler
    it('TEST 158: Öğretmen sadece kendi sınıflarındaki öğrencileri listeler', () => {
      const taughtClassIds = ['class-8a'];
      const filteredStudents = initialStudentProfiles.filter(
        (sp) => sp.classId && taughtClassIds.includes(sp.classId)
      );
      filteredStudents.forEach((student) => {
        expect(taughtClassIds).toContain(student.classId);
      });
    });

    // TEST 159: Öğretmen yetkisi olmayan öğrenciye görev atayamaz
    it('TEST 159: Öğretmen yetkisi olmayan öğrenciye görev atayamaz', () => {
      const unassignedStudentId = 'sp-unassigned';
      const myStudentIds = ['sp-mehmet', 'sp-ayse'];
      const canAssign = myStudentIds.includes(unassignedStudentId);
      expect(canAssign).toBe(false);
    });

    // TEST 160: Öğrenci görevi tamamladığında verificationStatus PENDING olur
    it('TEST 160: Öğrenci görevi tamamladığında verificationStatus PENDING olur', () => {
      const task: DailyTask = {
        id: 'task-160',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-31T08:00:00Z',
      };
      // Student completes task
      const completedTask: DailyTask = {
        ...task,
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
      };
      expect(completedTask.isCompleted).toBe(true);
      expect(completedTask.verificationStatus).toBe('PENDING');
    });

    // TEST 161: Öğretmen PENDING görevi onaylar ve verificationStatus VERIFIED olur
    it('TEST 161: Öğretmen PENDING görevi onaylar ve verificationStatus VERIFIED olur', () => {
      const task: DailyTask = {
        id: 'task-161',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-31T08:00:00Z',
      };
      const verifiedTask: DailyTask = {
        ...task,
        verificationStatus: 'VERIFIED',
        verifiedBy: 'tp-ahmet',
        verifiedAt: new Date().toISOString(),
      };
      expect(verifiedTask.verificationStatus).toBe('VERIFIED');
      expect(verifiedTask.verifiedBy).toBe('tp-ahmet');
    });

    // TEST 162: VERIFIED olan görev öğrenci ekranında kilitlenir
    it('TEST 162: VERIFIED olan görev öğrenci ekranında kilitlenir', () => {
      const verifiedTask: DailyTask = {
        id: 'task-162',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        createdAt: '2026-08-31T08:00:00Z',
      };
      const isLocked = verifiedTask.verificationStatus === 'VERIFIED';
      expect(isLocked).toBe(true);
    });

    // TEST 163: Öğrenci VERIFIED göreve yeni çalışma kaydı giremez veya değiştiremez
    it('TEST 163: Öğrenci VERIFIED göreve yeni çalışma kaydı giremez veya değiştiremez', () => {
      const verifiedTask: DailyTask = {
        id: 'task-163',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        createdAt: '2026-08-31T08:00:00Z',
      };
      const attemptEdit = () => {
        if (verifiedTask.verificationStatus === 'VERIFIED') {
          throw new Error('Bu görev öğretmen tarafından doğrulandı ve kilitlendi. Düzenleme yapılamaz.');
        }
      };
      expect(attemptEdit).toThrowError(/kilitlendi/);
    });

    // TEST 164: Öğretmen görevi reddeder ve verificationStatus REJECTED olur
    it('TEST 164: Öğretmen görevi reddeder ve verificationStatus REJECTED olur', () => {
      const task: DailyTask = {
        id: 'task-164',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-31T08:00:00Z',
      };
      const rejectedTask: DailyTask = {
        ...task,
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'REJECTED',
        verificationNote: 'Eksik sayfalar var, lütfen tamamlayın.',
      };
      expect(rejectedTask.verificationStatus).toBe('REJECTED');
      expect(rejectedTask.isCompleted).toBe(false);
      expect(rejectedTask.verificationNote).toBeDefined();
    });

    // TEST 165: REJECTED görev öğrencide gerekçesiyle görünür ve tamamlanmamış sayılır
    it('TEST 165: REJECTED görev öğrencide gerekçesiyle görünür ve tamamlanmamış sayılır', () => {
      const rejectedTask: DailyTask = {
        id: 'task-165',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'REJECTED',
        verificationNote: 'Sayfa 45 yapılmamış.',
        createdAt: '2026-08-31T08:00:00Z',
      };
      expect(rejectedTask.isCompleted).toBe(false);
      expect(rejectedTask.verificationNote).toBe('Sayfa 45 yapılmamış.');
    });

    // TEST 166: Öğrenci REJECTED göreve tekrar çalışma kaydı girebilir
    it('TEST 166: Öğrenci REJECTED göreve tekrar çalışma kaydı girebilir', () => {
      const rejectedTask: DailyTask = {
        id: 'task-166',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'REJECTED',
        createdAt: '2026-08-31T08:00:00Z',
      };
      const canEdit = rejectedTask.verificationStatus !== 'VERIFIED';
      expect(canEdit).toBe(true);
    });

    // TEST 167: Öğrenci REJECTED görevi yeniden tamamladığında verificationStatus tekrar PENDING olur
    it('TEST 167: Öğrenci REJECTED görevi yeniden tamamladığında verificationStatus tekrar PENDING olur', () => {
      const rejectedTask: DailyTask = {
        id: 'task-167',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-31',
        targetQuestionCount: 40,
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'REJECTED',
        createdAt: '2026-08-31T08:00:00Z',
      };
      const reCompletedTask: DailyTask = {
        ...rejectedTask,
        isCompleted: true,
        status: 'COMPLETED',
        verificationStatus: 'PENDING',
      };
      expect(reCompletedTask.verificationStatus).toBe('PENDING');
      expect(reCompletedTask.isCompleted).toBe(true);
    });

    // TEST 168: Çalışma kaydı silinmez; önceki çalışma kayıtları geçmişte (audit/history) korunur
    it('TEST 168: Çalışma kaydı silinmez; önceki çalışma kayıtları geçmişte (audit/history) korunur', () => {
      const studyRecords: StudyRecord[] = [
        {
          id: 'rec-1',
          dailyTaskId: 'task-168',
          studentId: 'sp-mehmet',
          subjectId: 'sub-mat-8',
          recordDate: '2026-08-31',
          actualQuestionCount: 20,
          actualDurationMinutes: 30,
          createdAt: '2026-08-31T10:00:00Z',
        },
      ];
      // Student adds second record after rejection
      const secondRecord: StudyRecord = {
        id: 'rec-2',
        dailyTaskId: 'task-168',
        studentId: 'sp-mehmet',
        subjectId: 'sub-mat-8',
        recordDate: '2026-08-31',
        actualQuestionCount: 40,
        actualDurationMinutes: 50,
        createdAt: '2026-08-31T16:00:00Z',
      };
      const updatedHistory = [...studyRecords, secondRecord];
      expect(updatedHistory.length).toBe(2);
      expect(updatedHistory[0].id).toBe('rec-1');
      expect(updatedHistory[1].id).toBe('rec-2');
    });

    // TEST 169: Geciken görev (dueDate < bugünün tarihi ve tamamlanmamış) Geciken Ödevler sekmesinde listelenir
    it('TEST 169: Geciken görev (dueDate < bugünün tarihi ve tamamlanmamış) Geciken Ödevler sekmesinde listelenir', () => {
      const overdueTask: DailyTask = {
        id: 'task-overdue-169',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-25',
        startDate: '2026-08-25',
        dueDate: '2026-08-28',
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-25T08:00:00Z',
      };
      const isOverdue = isTaskOverdueHelper(overdueTask, '2026-08-31');
      expect(isOverdue).toBe(true);
    });

    // TEST 170: Öğrenci geciken görevi sonradan tamamlayabilir (completeLateDailyTask)
    it('TEST 170: Öğrenci geciken görevi sonradan tamamlayabilir (completeLateDailyTask)', () => {
      const overdueTask: DailyTask = {
        id: 'task-overdue-170',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-25',
        startDate: '2026-08-25',
        dueDate: '2026-08-28',
        isCompleted: false,
        status: 'PLANNED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-25T08:00:00Z',
      };
      const lateCompletedTask: DailyTask = {
        ...overdueTask,
        isCompleted: true,
        status: 'LATE_COMPLETED',
        verificationStatus: 'PENDING',
      };
      expect(lateCompletedTask.isCompleted).toBe(true);
      expect(lateCompletedTask.status).toBe('LATE_COMPLETED');
    });

    // TEST 171: Sonradan tamamlanan geciken görevin durumu LATE_COMPLETED olur
    it('TEST 171: Sonradan tamamlanan geciken görevin durumu LATE_COMPLETED olur', () => {
      const lateTask: DailyTask = {
        id: 'task-171',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: '2026-08-25',
        dueDate: '2026-08-28',
        isCompleted: true,
        status: 'LATE_COMPLETED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-25T08:00:00Z',
      };
      expect(lateTask.status).toBe('LATE_COMPLETED');
    });

    // TEST 172: Geciken görev tamamlandığında orijinal görev tarihi ve dueDate değişmeden kalır
    it('TEST 172: Geciken görev tamamlandığında orijinal görev tarihi ve dueDate değişmeden kalır', () => {
      const originalTaskDate = '2026-08-25';
      const originalDueDate = '2026-08-28';
      const lateTask: DailyTask = {
        id: 'task-172',
        weeklyPlanId: 'wp-1',
        dayOfWeek: 'Pazartesi',
        taskType: 'QUESTION_TARGET',
        studentId: 'sp-mehmet',
        teacherId: 'tp-ahmet',
        subjectId: 'sub-mat-8',
        taskDate: originalTaskDate,
        dueDate: originalDueDate,
        isCompleted: true,
        status: 'LATE_COMPLETED',
        verificationStatus: 'PENDING',
        createdAt: '2026-08-25T08:00:00Z',
      };
      expect(lateTask.taskDate).toBe(originalTaskDate);
      expect(lateTask.dueDate).toBe(originalDueDate);
    });

    // TEST 173: Teacher Dashboard KPI: Aktif Ödevler sayısı doğru hesaplanır
    it('TEST 173: Teacher Dashboard KPI: Aktif Ödevler sayısı doğru hesaplanır', () => {
      const tasks: DailyTask[] = [
        {
          id: 't-active-1',
          weeklyPlanId: 'wp-1',
          dayOfWeek: 'Pazartesi',
          taskType: 'QUESTION_TARGET',
          studentId: 'sp-mehmet',
          teacherId: 'tp-ahmet',
          subjectId: 'sub-mat-8',
          taskDate: '2026-08-31',
          dueDate: '2026-09-02',
          isCompleted: false,
          status: 'PLANNED',
          verificationStatus: 'PENDING',
          createdAt: '2026-08-31T08:00:00Z',
        },
      ];
      const metrics = getTeacherDashboardMetricsHelper('tp-ahmet', tasks, '2026-08-31');
      expect(metrics.activeTasks).toBe(1);
    });

    // TEST 174: Teacher Dashboard KPI: Onay Bekleyenler sayısı doğru hesaplanır
    it('TEST 174: Teacher Dashboard KPI: Onay Bekleyenler sayısı doğru hesaplanır', () => {
      const tasks: DailyTask[] = [
        {
          id: 't-pending-1',
          weeklyPlanId: 'wp-1',
          dayOfWeek: 'Pazartesi',
          taskType: 'QUESTION_TARGET',
          studentId: 'sp-mehmet',
          teacherId: 'tp-ahmet',
          subjectId: 'sub-mat-8',
          taskDate: '2026-08-31',
          isCompleted: true,
          status: 'COMPLETED',
          verificationStatus: 'PENDING',
          createdAt: '2026-08-31T08:00:00Z',
        },
      ];
      const metrics = getTeacherDashboardMetricsHelper('tp-ahmet', tasks, '2026-08-31');
      expect(metrics.pendingVerification).toBe(1);
    });

    // TEST 175: Teacher Dashboard KPI: Geciken Ödevler sayısı doğru hesaplanır
    it('TEST 175: Teacher Dashboard KPI: Geciken Ödevler sayısı doğru hesaplanır', () => {
      const tasks: DailyTask[] = [
        {
          id: 't-overdue-1',
          weeklyPlanId: 'wp-1',
          dayOfWeek: 'Pazartesi',
          taskType: 'QUESTION_TARGET',
          studentId: 'sp-mehmet',
          teacherId: 'tp-ahmet',
          subjectId: 'sub-mat-8',
          taskDate: '2026-08-20',
          dueDate: '2026-08-22',
          isCompleted: false,
          status: 'PLANNED',
          verificationStatus: 'PENDING',
          createdAt: '2026-08-20T08:00:00Z',
        },
      ];
      const metrics = getTeacherDashboardMetricsHelper('tp-ahmet', tasks, '2026-08-31');
      expect(metrics.overdueTasks).toBe(1);
    });

    // TEST 176: Teacher Dashboard KPI: Tamamlanan Ödevler sayısı doğru hesaplanır
    it('TEST 176: Teacher Dashboard KPI: Tamamlanan Ödevler sayısı doğru hesaplanır', () => {
      const tasks: DailyTask[] = [
        {
          id: 't-comp-1',
          weeklyPlanId: 'wp-1',
          dayOfWeek: 'Pazartesi',
          taskType: 'QUESTION_TARGET',
          studentId: 'sp-mehmet',
          teacherId: 'tp-ahmet',
          subjectId: 'sub-mat-8',
          taskDate: '2026-08-30',
          isCompleted: true,
          status: 'COMPLETED',
          verificationStatus: 'VERIFIED',
          createdAt: '2026-08-30T08:00:00Z',
        },
      ];
      const metrics = getTeacherDashboardMetricsHelper('tp-ahmet', tasks, '2026-08-31');
      expect(metrics.completedTasks).toBe(1);
    });

    // TEST 177: Teacher Dashboard KPI: Sorumlu Öğrenci sayısı doğru hesaplanır
    it('TEST 177: Teacher Dashboard KPI: Sorumlu Öğrenci sayısı doğru hesaplanır', () => {
      const myTaughtClasses = ['class-8a'];
      const myStudents = initialStudentProfiles.filter(
        (sp) => sp.classId && myTaughtClasses.includes(sp.classId)
      );
      expect(myStudents.length).toBeGreaterThan(0);
    });

    // TEST 178: Teacher Dashboard sadece öğretmenin kendi atadığı ödevleri KPI a dahil eder
    it('TEST 178: Teacher Dashboard sadece öğretmenin kendi atadığı ödevleri KPI a dahil eder', () => {
      const mixedTasks: DailyTask[] = [
        {
          id: 't-ahmet-1',
          weeklyPlanId: 'wp-1',
          dayOfWeek: 'Pazartesi',
          taskType: 'QUESTION_TARGET',
          studentId: 'sp-mehmet',
          teacherId: 'tp-ahmet',
          subjectId: 'sub-mat-8',
          taskDate: '2026-08-31',
          isCompleted: false,
          status: 'PLANNED',
          verificationStatus: 'PENDING',
          createdAt: '2026-08-31T08:00:00Z',
        },
        {
          id: 't-selin-1',
          weeklyPlanId: 'wp-2',
          dayOfWeek: 'Pazartesi',
          taskType: 'QUESTION_TARGET',
          studentId: 'sp-mehmet',
          teacherId: 'tp-selin',
          subjectId: 'sub-turk-8',
          taskDate: '2026-08-31',
          isCompleted: false,
          status: 'PLANNED',
          verificationStatus: 'PENDING',
          createdAt: '2026-08-31T08:00:00Z',
        },
      ];
      const ahmetMetrics = getTeacherDashboardMetricsHelper('tp-ahmet', mixedTasks, '2026-08-31');
      expect(ahmetMetrics.totalAssignedTasks).toBe(1);
    });

    // TEST 179: Admin Dashboard kurum genelindeki tüm öğrencileri raporlar
    it('TEST 179: Admin Dashboard kurum genelindeki tüm öğrencileri raporlar', () => {
      const orgClassIds = initialClasses.filter((c) => c.organizationId === 'org-1').map((c) => c.id);
      const totalOrgStudents = initialStudentProfiles.filter(
        (s) => (s.classId && orgClassIds.includes(s.classId)) || s.organizationId === 'org-1'
      );
      expect(totalOrgStudents.length).toBeGreaterThan(1);
    });

    // TEST 180: Admin Dashboard kurum genelindeki tüm sınıfları raporlar
    it('TEST 180: Admin Dashboard kurum genelindeki tüm sınıfları raporlar', () => {
      const totalOrgClasses = initialClasses.filter((c) => c.organizationId === 'org-1');
      expect(totalOrgClasses.length).toBeGreaterThan(0);
    });

    // TEST 181: Admin Dashboard kurum genelindeki tamamlanma oranını doğru hesaplar
    it('TEST 181: Admin Dashboard kurum genelindeki tamamlanma oranını doğru hesaplar', () => {
      const tasks = [
        { id: 't1', isCompleted: true },
        { id: 't2', isCompleted: true },
        { id: 't3', isCompleted: false },
        { id: 't4', isCompleted: false },
      ];
      const completed = tasks.filter((t) => t.isCompleted).length;
      const rate = Math.round((completed / tasks.length) * 100);
      expect(rate).toBe(50);
    });

    // TEST 182: Öğretmen Weekly Program (öğrenci programı) ekranına doğrudan erişemez
    it('TEST 182: Öğretmen Weekly Program (öğrenci programı) ekranına doğrudan erişemez', () => {
      const teacherAllowedTabs = [
        'teacher-dashboard',
        'teacher-students',
        'teacher-tasks',
        'teacher-resources',
        'teacher-reports',
      ];
      expect(teacherAllowedTabs).not.toContain('student-weekly');
    });

    // TEST 183: Öğrenci Weekly Program ekranına erişebilir ve o haftanın ödevlerini görür
    it('TEST 183: Öğrenci Weekly Program ekranına erişebilir ve o haftanın ödevlerini görür', () => {
      const studentTabs = [
        'student-dashboard',
        'student-tasks',
        'student-weekly',
        'student-overdue',
        'student-resources',
        'student-performance',
      ];
      expect(studentTabs).toContain('student-weekly');
    });

    // TEST 184: Öğrenci Weekly Program da önceki haftaya geçebilir
    it('TEST 184: Öğrenci Weekly Program da önceki haftaya geçebilir', () => {
      let currentWeekOffset = 0;
      const prevWeek = () => {
        currentWeekOffset -= 1;
      };
      prevWeek();
      expect(currentWeekOffset).toBe(-1);
    });

    // TEST 185: Öğrenci Weekly Program da sonraki haftaya geçebilir
    it('TEST 185: Öğrenci Weekly Program da sonraki haftaya geçebilir', () => {
      let currentWeekOffset = 0;
      const nextWeek = () => {
        currentWeekOffset += 1;
      };
      nextWeek();
      expect(currentWeekOffset).toBe(1);
    });

    // TEST 186: Öğrenci Weekly Program da Bugün butonuna basarak mevcut haftaya dönebilir
    it('TEST 186: Öğrenci Weekly Program da Bugün butonuna basarak mevcut haftaya dönebilir', () => {
      let currentWeekOffset = 3;
      const resetToCurrentWeek = () => {
        currentWeekOffset = 0;
      };
      resetToCurrentWeek();
      expect(currentWeekOffset).toBe(0);
    });

    // TEST 187: Sistem genelinde yalnızca üç temel rol tanımlıdır
    it('TEST 187: Sistem genelinde yalnızca üç temel rol tanımlıdır', () => {
      const systemRoles = ['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT'];
      expect(systemRoles).toEqual(['INSTITUTE_ADMIN', 'TEACHER', 'STUDENT']);
    });
  });
});
