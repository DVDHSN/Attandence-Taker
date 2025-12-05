
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, Menu, X, BookOpenCheck, Settings as SettingsIcon, HelpCircle, ChevronRight } from 'lucide-react';
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
import { TutorialOverlay } from './components/TutorialOverlay';

type View = 'dashboard' | 'attendance' | 'students' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [classConfigs, setClassConfigs] = useState<Record<string, ClassConfig>>({});
  const [editingSession, setEditingSession] = useState<ClassSession | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

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
          const studentMap = new Map<string, Student>();
          students.forEach(s => studentMap.set(s.id, s));
          (backup.students as Student[]).forEach((s) => studentMap.set(s.id, s));
          
          const sessionMap = new Map<string, ClassSession>();
          sessions.forEach(s => sessionMap.set(s.id, s));
          (backup.sessions as ClassSession[]).forEach((s) => sessionMap.set(s.id, s));
          
          const newClasses = Array.from(new Set([...classes, ...(backup.classes || [])])).sort();
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
      className={`w-full flex items-center gap-3 px-5 py-4 transition-all duration-300 ease-out group border-b-2 border-transparent hover:border-primary-500 rounded-none relative overflow-visible ${
        currentView === view 
          ? 'bg-zinc-800 text-primary-400 font-bold border-l-4 border-l-primary-500 border-b-zinc-800 pl-8 shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 z-10' 
          : 'text-gray-400 hover:bg-zinc-800 hover:text-white font-medium hover:pl-8 hover:-translate-y-1 hover:shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] hover:z-10'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${currentView === view ? 'text-primary-500 scale-110' : 'text-zinc-500 group-hover:text-zinc-300 group-hover:scale-110'}`} />
      <span className="uppercase tracking-widest text-sm relative z-10">{label}</span>
      {currentView === view && <ChevronRight className="w-4 h-4 ml-auto text-primary-500 animate-slide-in-right" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-900 text-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Mobile Header - Brutalist */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-900 border-b-4 border-zinc-800 sticky top-0 z-30 shadow-lg animate-slide-in">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 border-2 border-white flex items-center justify-center text-white shadow-brutal-hover transition-transform active:scale-95">
                <BookOpenCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">
              ATTENDANCE<span className="text-primary-500">.MGR</span>
            </h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 border-2 border-white text-white active:bg-white active:text-black transition-all duration-150 active:scale-95"
        >
            {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation - Brutalist */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-80 bg-zinc-900 border-r-4 border-zinc-800 transform transition-transform duration-500 ease-smooth
        md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 pb-8 border-b-4 border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 bg-primary-600 border-2 border-white shadow-brutal flex items-center justify-center text-white transition-all duration-300 group-hover:shadow-brutal-lg group-hover:-translate-y-1 group-hover:rotate-6">
                <BookOpenCheck className="w-7 h-7" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-white tracking-tighter leading-none uppercase">
                    ATTENDANCE<br/><span className="text-primary-500">.MGR</span>
                </h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 overflow-x-hidden p-2 custom-scrollbar">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="attendance" icon={ClipboardCheck} label="Attendance" />
          <NavItem view="students" icon={Users} label="Students" />
          <div className="my-4 border-t-4 border-zinc-800 mx-4"></div>
          <NavItem view="settings" icon={SettingsIcon} label="Settings" />
        </nav>

        <div className="p-4 border-t-4 border-zinc-800 bg-zinc-950/50">
            <p className="text-xs font-mono text-zinc-600 text-center hover:text-primary-500 transition-colors cursor-default animate-pulse-slow">V1.0.1 // BRUTAL_EDITION</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-zinc-900 relative custom-scrollbar">
        <div className="max-w-8xl mx-auto p-4 md:p-12 pb-24">
          
          <header className="mb-12 border-b-4 border-zinc-800 pb-8 animate-fade-in">
            <h2 key={currentView} className="text-5xl font-black text-white mb-4 tracking-tighter uppercase transition-all duration-300 hover:text-primary-500 cursor-default animate-slide-in-right">
              {currentView === 'dashboard' && 'Status Report'}
              {currentView === 'attendance' && (editingSession ? 'Edit Record' : 'New Session')}
              {currentView === 'students' && 'Roster'}
              {currentView === 'settings' && 'System Config'}
            </h2>
            <div className="inline-block bg-zinc-800 px-3 py-1 border-l-4 border-primary-500 transition-all duration-300 hover:pl-6 hover:bg-zinc-700 hover:border-white">
                <p className="text-sm text-zinc-400 font-mono uppercase tracking-wide">
                    {currentView === 'dashboard' && '// SYSTEM OVERVIEW'}
                    {currentView === 'attendance' && (editingSession ? '// MODIFYING HISTORICAL DATA' : '// MARKING ACTIVE ATTENDANCE')}
                    {currentView === 'students' && '// PERSONNEL MANAGEMENT'}
                    {currentView === 'settings' && '// DATA OPERATIONS'}
                </p>
            </div>
          </header>

          <div className="animate-fade-in-up" key={currentView}>
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
      
      {/* Floating Tutorial Trigger - Bottom Right */}
      <button 
        onClick={() => setIsTutorialOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-primary-600 text-white border-2 border-white w-14 h-14 flex items-center justify-center shadow-brutal hover:-translate-y-1 hover:-translate-x-1 hover:shadow-brutal-lg hover:bg-white hover:text-black hover:border-black transition-all duration-200 group active:scale-95 animate-pop"
        title="Open Manual"
      >
        <HelpCircle className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Tutorial Overlay */}
      <TutorialOverlay 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
        view={currentView} 
      />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-10 md:hidden animate-fade-in backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
