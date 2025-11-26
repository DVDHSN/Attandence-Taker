import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, Menu, X } from 'lucide-react';
import { Student, ClassSession } from './types';
import { saveStudents, getStudents, saveSessions, getSessions, saveClasses, getClasses } from './services/storageService';
import { StudentManager } from './components/StudentManager';
import { AttendanceTaker } from './components/AttendanceTaker';
import { Dashboard } from './components/Dashboard';

type View = 'dashboard' | 'attendance' | 'students';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [editingSession, setEditingSession] = useState<ClassSession | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Initial Load
    const loadedStudents = getStudents();
    const loadedClasses = getClasses();
    
    // Sync logic: Ensure any class assigned to a student exists in the master list
    const studentClasses = new Set(loadedStudents.map(s => s.className).filter((c): c is string => !!c));
    const allClasses = Array.from(new Set([...loadedClasses, ...studentClasses])).sort();
    
    setStudents(loadedStudents);
    setSessions(getSessions());
    setClasses(allClasses);
  }, []);

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
  };

  const handleUpdateClasses = (newClasses: string[]) => {
    setClasses(newClasses);
    saveClasses(newClasses);
  };

  const handleSaveSession = (newSession: ClassSession) => {
    // Check if updating an existing session or creating a new one
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

  const handleEditSession = (session: ClassSession) => {
    setEditingSession(session);
    setCurrentView('attendance');
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        if (view === 'attendance') setEditingSession(undefined); // Reset edit state when manually navigating
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        currentView === view 
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-[#0d1117] sticky top-0 z-20">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Attendance Taker
        </h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-[#0d1117] border-r border-gray-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hidden md:block">
            Attendance Taker
          </h1>
          <p className="text-xs text-gray-500 mt-2 hidden md:block">Class Attendance Tracker</p>
        </div>

        <nav className="px-4 mt-4">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="attendance" icon={ClipboardCheck} label="Take Attendance" />
          <NavItem view="students" icon={Users} label="Student Roster" />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
           <div className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-500 border border-gray-800">
              <p>v1.1.0</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentView === 'dashboard' && 'Class Overview'}
              {currentView === 'attendance' && (editingSession ? 'Edit Attendance' : 'Mark Attendance')}
              {currentView === 'students' && 'Manage Roster'}
            </h2>
            <p className="text-gray-400">
              {currentView === 'dashboard' && 'Summary of your class activity and trends.'}
              {currentView === 'attendance' && (editingSession ? 'Update details for this past session.' : 'Record who is present today.')}
              {currentView === 'students' && 'Add or remove students from your class list.'}
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
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;