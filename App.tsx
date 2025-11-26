import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, Menu, X, BookOpenCheck } from 'lucide-react';
import { Student, ClassSession, ClassConfig } from './types';
import { 
  saveStudents, getStudents, 
  saveSessions, getSessions, 
  saveClasses, getClasses,
  saveClassConfigs, getClassConfigs
} from './services/storageService';
import { StudentManager } from './components/StudentManager';
import { AttendanceTaker } from './components/AttendanceTaker';
import { Dashboard } from './components/Dashboard';

type View = 'dashboard' | 'attendance' | 'students';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [classConfigs, setClassConfigs] = useState<Record<string, ClassConfig>>({});
  const [editingSession, setEditingSession] = useState<ClassSession | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Initial Load
    const loadedStudents = getStudents();
    let loadedClasses = getClasses();
    let loadedConfigs = getClassConfigs();
    
    if (loadedStudents.length === 0 && loadedClasses.length === 0) {
        loadedClasses = ['Kindy', 'Junior', 'Intermediate', 'Senior'];
        loadedConfigs = {
            'Kindy': { minAge: 4, maxAge: 6 },
            'Junior': { minAge: 7, maxAge: 9 },
            'Intermediate': { minAge: 10, maxAge: 12 },
            'Senior': { minAge: 13, maxAge: 15 },
        };
        saveClasses(loadedClasses);
        saveClassConfigs(loadedConfigs);
    }

    const studentClasses = new Set(loadedStudents.map(s => s.className).filter((c): c is string => !!c));
    const allClasses = Array.from(new Set([...loadedClasses, ...studentClasses])).sort();
    
    setStudents(loadedStudents);
    setSessions(getSessions());
    setClasses(allClasses);
    setClassConfigs(loadedConfigs);
  }, []);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
  };

  const handleUpdateClasses = (newClasses: string[]) => {
    setClasses(newClasses);
    saveClasses(newClasses);
  };

  const handleUpdateClassConfigs = (newConfigs: Record<string, ClassConfig>) => {
    setClassConfigs(newConfigs);
    saveClassConfigs(newConfigs);
  };

  const handleSaveSession = (newSession: ClassSession) => {
    const existingIndex = sessions.findIndex(s => s.id === newSession.id);
    let updatedSessions;
    
    if (existingIndex >= 0) {
      updatedSessions = [...sessions];
      updatedSessions[existingIndex] = newSession;
    } else {
      updatedSessions = [...sessions, newSession];
    }

    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setEditingSession(undefined);
    setCurrentView('dashboard');
  };

  const handleUpdateSessions = (newSessions: ClassSession[]) => {
    setSessions(newSessions);
    saveSessions(newSessions);
  };

  const handleEditSession = (session: ClassSession) => {
    setEditingSession(session);
    setCurrentView('attendance');
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        if (view === 'attendance') setEditingSession(undefined);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 group ${
        currentView === view 
          ? 'bg-primary-500/10 text-primary-400 shadow-none font-semibold border border-primary-500/20' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium'
      }`}
    >
      <Icon className={`w-5 h-5 transition-colors ${currentView === view ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row font-sans selection:bg-primary-500/30 selection:text-primary-200">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white shadow-glow">
                <BookOpenCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-100 tracking-tight">
            Attendance
            </h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-72 bg-gray-900/95 border-r border-gray-800 transform transition-transform duration-300 ease-in-out backdrop-blur-xl md:backdrop-blur-none md:bg-gray-900
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-glow flex items-center justify-center text-white">
                <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-100 tracking-tight leading-none">
                    Attendance
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-1 tracking-wide uppercase">Class Manager</p>
            </div>
          </div>
        </div>

        <nav className="px-6 space-y-2">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="attendance" icon={ClipboardCheck} label="Attendance" />
          <NavItem view="students" icon={Users} label="Students" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-900">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          
          <header className="mb-10 max-w-4xl">
            <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
              {currentView === 'dashboard' && 'Overview'}
              {currentView === 'attendance' && (editingSession ? 'Edit Session' : 'Take Attendance')}
              {currentView === 'students' && 'Student Roster'}
            </h2>
            <p className="text-lg text-gray-400 font-light">
              {currentView === 'dashboard' && 'Welcome back. Here is your class activity summary.'}
              {currentView === 'attendance' && (editingSession ? 'Updating records for a past session.' : 'Select students to mark them as present.')}
              {currentView === 'students' && 'Manage your students, guardians, and class assignments.'}
            </p>
          </header>

          <div className="animate-fade-in-up">
            {currentView === 'dashboard' && (
              <Dashboard 
                sessions={sessions} 
                students={students} 
                onEditSession={handleEditSession}
              />
            )}
            
            {currentView === 'attendance' && (
              <AttendanceTaker 
                students={students} 
                sessions={sessions}
                onSaveSession={handleSaveSession} 
                existingSession={editingSession}
              />
            )}
            
            {currentView === 'students' && (
              <StudentManager 
                students={students} 
                onUpdateStudents={handleUpdateStudents}
                classes={classes}
                onUpdateClasses={handleUpdateClasses}
                classConfigs={classConfigs}
                onUpdateClassConfigs={handleUpdateClassConfigs}
                sessions={sessions}
                onUpdateSessions={handleUpdateSessions}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;