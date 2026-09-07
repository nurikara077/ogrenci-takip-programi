import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentList } from './components/teacher/StudentList';
import { StudentDetail } from './components/teacher/StudentDetail';
import { WeeklyPlanner } from './components/teacher/WeeklyPlanner';
import { ResourcesView } from './components/teacher/ResourcesView';
import { TeacherTasksView } from './components/teacher/TeacherTasksView';
import { StudentTasksView } from './components/student/StudentTasksView';
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
      setActiveTab('student-tasks');
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

        {/* STUDENT VIEWS */}
        {activeTab === 'student-tasks' && (
          <StudentTasksView />
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
