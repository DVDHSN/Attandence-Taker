import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, Menu, X, BookOpenCheck, Settings as SettingsIcon } from 'lucide-react';
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
import { Settings } from './components/Settings';

type View = 'dashboard' | 'attendance' | 'students' | 'settings';

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

  // --- Data Management Functions ---

  const handleExportBackup = () => {
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      students,
      sessions,
      classes,
      classConfigs
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const backup = JSON.parse(json);

        if (!Array.isArray(backup.students) || !Array.isArray(backup.sessions)) {
          alert("Invalid backup file format. Missing students or sessions data.");
          return;
        }

        const confirmMsg = `Found in backup:\n- ${backup.students.length} Students\n- ${backup.sessions.length} Sessions\n\nMerge this data? Existing records with matching IDs will be updated. New records will be added.`;
        
        if (window.confirm(confirmMsg)) {
          // Merge Logic
          const studentMap = new Map<string, Student>();
          students.forEach(s => studentMap.set(s.id, s));
          (backup.students as Student[]).forEach((s) => studentMap.set(s.id, s));
          
          const sessionMap = new Map<string, ClassSession>();
          sessions.forEach(s => sessionMap.set(s.id, s));
          (backup.sessions as ClassSession[]).forEach((s) => sessionMap.set(s.id, s));
          
          // Classes: Union of existing and imported
          const newClasses = Array.from(new Set([...classes, ...(backup.classes || [])])).sort();
          
          // Configs: Merge
          const newConfigs = { ...classConfigs, ...(backup.classConfigs || {}) };

          const mergedStudents = Array.from(studentMap.values());
          const mergedSessions = Array.from(sessionMap.values());

          handleUpdateStudents(mergedStudents);
          handleUpdateSessions(mergedSessions);
          handleUpdateClasses(newClasses);
          handleUpdateClassConfigs(newConfigs);

          alert("Data imported successfully!");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to read backup file. Please ensure it is a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm("ARE YOU SURE? This will delete ALL data. This cannot be undone.")) {
       if (window.confirm("Really delete everything?")) {
          handleUpdateStudents([]);
          handleUpdateSessions([]);
          // We can opt to keep default classes or wipe them. Let's wipe to factory defaults.
          handleUpdateClasses(['Kindy', 'Junior', 'Intermediate', 'Senior']);
          handleUpdateClassConfigs({
            'Kindy': { minAge: 4, maxAge: 6 },
            'Junior': { minAge: 7, maxAge: 9 },
            'Intermediate': { minAge: 10, maxAge: 12 },
            'Senior': { minAge: 13, maxAge: 15 },
          });
          alert("Application has been reset.");
          setCurrentView('dashboard');
       }
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        if (view === 'attendance') setEditingSession(undefined);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
        currentView === view 
          ? 'bg-primary-500/10 text-primary-400 shadow-none font-semibold border border-primary-500/20 translate-x-2' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 font-medium hover:translate-x-2'
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
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white shadow-glow animate-pulse-slow">
                <BookOpenCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-100 tracking-tight">
            Attendance
            </h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors active:scale-95">
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
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-glow flex items-center justify-center text-white animate-pulse-slow">
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
          <div className="pt-4 mt-4 border-t border-gray-800">
            <NavItem view="settings" icon={SettingsIcon} label="Settings" />
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-900 custom-scrollbar">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          
          <header className="mb-10 max-w-4xl animate-fade-in-up">
            <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
              {currentView === 'dashboard' && 'Overview'}
              {currentView === 'attendance' && (editingSession ? 'Edit Session' : 'Take Attendance')}
              {currentView === 'students' && 'Student Roster'}
              {currentView === 'settings' && 'Data Management'}
            </h2>
            <p className="text-lg text-gray-400 font-light">
              {currentView === 'dashboard' && 'Welcome back. Here is your class activity summary.'}
              {currentView === 'attendance' && (editingSession ? 'Updating records for a past session.' : 'Select students to mark them as present.')}
              {currentView === 'students' && 'Manage your students, guardians, and class assignments.'}
              {currentView === 'settings' && 'Backup, restore, or reset your application data.'}
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

            {currentView === 'settings' && (
              <Settings 
                onExport={handleExportBackup}
                onImport={handleImportBackup}
                onReset={handleResetData}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 md:hidden transition-opacity animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;