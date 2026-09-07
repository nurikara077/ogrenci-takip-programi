import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentList } from './components/teacher/StudentList';
import { StudentDetail } from './components/teacher/StudentDetail';
import { WeeklyPlanner } from './components/teacher/WeeklyPlanner';
import { ResourcesView } from './components/teacher/ResourcesView';
import { TeacherReports } from './components/teacher/TeacherReports';
import { ClassAnalytics } from './components/teacher/ClassAnalytics';
import { TeacherTasksView } from './components/teacher/TeacherTasksView';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentTasksView } from './components/student/StudentTasksView';
import { StudentWeeklyProgram } from './components/student/StudentWeeklyProgram';
import { StudentResourcesView } from './components/student/StudentResourcesView';
import { StudentPerformanceView } from './components/student/StudentPerformanceView';
import { StudentOverdueTasksView } from './components/student/StudentOverdueTasksView';
import { InstituteDashboard } from './components/admin/InstituteDashboard';
import { AdminTeachersView } from './components/admin/AdminTeachersView';
import { AdminClassesView } from './components/admin/AdminClassesView';
import { ClassDetailView } from './components/admin/ClassDetailView';
import { NotificationsModal } from './components/common/NotificationsModal';
import { LoginView } from './components/auth/LoginView';

function MainAppContent() {
  const { currentUser, isAuthenticated } = useApp();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('teacher-dashboard');

  // Drill-down states
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Sync default tab when user switches role or logs in
  useEffect(() => {
    if (currentUser?.role === 'TEACHER') {
      setActiveTab('teacher-dashboard');
    } else if (currentUser?.role === 'STUDENT') {
      setActiveTab('student-dashboard');
    } else if (currentUser?.role === 'INSTITUTE_ADMIN') {
      setActiveTab('admin-dashboard');
    }
    setSelectedStudentId(null);
    setSelectedClassId(null);
  }, [currentUser?.id, currentUser?.role]);

  // If user is not authenticated, display LoginView
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        <LoginView />
      </div>
    );
  }

  const handleSelectStudent = (sId: string) => {
    setSelectedStudentId(sId);
    setActiveTab('student-detail');
  };

  const handleOpenPlannerForStudent = (sId: string) => {
    setSelectedStudentId(sId);
    setActiveTab('teacher-planner');
  };

  const handleSelectClass = (cId: string) => {
    setSelectedClassId(cId);
    setActiveTab('admin-class-detail');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'student-detail') setSelectedStudentId(null);
          if (tab !== 'admin-class-detail') setSelectedClassId(null);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* TEACHER VIEWS */}
        {activeTab === 'teacher-dashboard' && (
          <TeacherDashboard
            onSelectStudent={handleSelectStudent}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'teacher-tasks' && (
          <TeacherTasksView onSelectStudent={handleSelectStudent} />
        )}

        {activeTab === 'teacher-students' && (
          <StudentList
            onSelectStudent={handleSelectStudent}
            onOpenPlannerForStudent={handleOpenPlannerForStudent}
          />
        )}

        {activeTab === 'student-detail' && selectedStudentId && (
          <StudentDetail
            studentId={selectedStudentId}
            onBack={() => setActiveTab('teacher-students')}
            onOpenPlanner={handleOpenPlannerForStudent}
            onOpenAssignResource={(sId) => {
              setSelectedStudentId(sId);
              setActiveTab('teacher-resources');
            }}
          />
        )}

        {activeTab === 'teacher-planner' && (
          <WeeklyPlanner initialStudentId={selectedStudentId || undefined} />
        )}

        {activeTab === 'teacher-resources' && (
          <ResourcesView initialSelectedStudentId={selectedStudentId || undefined} />
        )}

        {activeTab === 'teacher-reports' && (
          <TeacherReports onSelectStudent={handleSelectStudent} />
        )}

        {activeTab === 'teacher-analytics' && (
          <ClassAnalytics onSelectStudent={handleSelectStudent} />
        )}

        {/* STUDENT VIEWS */}
        {activeTab === 'student-dashboard' && (
          <StudentDashboard onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'student-tasks' && (
          <StudentTasksView />
        )}

        {activeTab === 'student-weekly' && (
          <StudentWeeklyProgram />
        )}

        {activeTab === 'student-resources' && (
          <StudentResourcesView />
        )}

        {activeTab === 'student-overdue' && (
          <StudentOverdueTasksView onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'student-performance' && (
          <StudentPerformanceView />
        )}

        {/* INSTITUTE ADMIN VIEWS */}
        {activeTab === 'admin-dashboard' && (
          <InstituteDashboard
            onSelectClass={handleSelectClass}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'admin-teachers' && (
          <AdminTeachersView onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'admin-classes' && (
          <AdminClassesView onSelectClass={handleSelectClass} />
        )}

        {activeTab === 'admin-students' && (
          <StudentList
            onSelectStudent={handleSelectStudent}
            onOpenPlannerForStudent={handleOpenPlannerForStudent}
          />
        )}

        {activeTab === 'admin-resources' && (
          <ResourcesView initialSelectedStudentId={selectedStudentId || undefined} />
        )}

        {activeTab === 'admin-tasks' && (
          <TeacherTasksView onSelectStudent={handleSelectStudent} />
        )}

        {activeTab === 'admin-progress' && (
          <ClassDetailView
            classId={selectedClassId || 'class-8a'}
            onBack={() => setActiveTab('admin-dashboard')}
            onSelectStudent={handleSelectStudent}
          />
        )}

        {activeTab === 'admin-reports' && (
          <TeacherReports onSelectStudent={handleSelectStudent} />
        )}

        {activeTab === 'admin-class-detail' && (
          <ClassDetailView
            classId={selectedClassId || 'class-8a'}
            onBack={() => setActiveTab('admin-dashboard')}
            onSelectStudent={handleSelectStudent}
          />
        )}
      </main>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Öğrenci Takip Platformu © 2026 • MVP Sürümü</span>
          <span className="text-slate-400">
            Tarhan Koleji & Bireysel Özel Ders Entegrasyonu • 31 Ağustos - 6 Eylül 2026
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
