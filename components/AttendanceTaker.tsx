import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassSession, AttendanceRecord } from '../types';
import { Button } from './Button';
import { Check, Calendar, BookOpen, Save, AlertCircle, User, ChevronDown, X } from 'lucide-react';

interface AttendanceTakerProps {
  students: Student[];
  sessions: ClassSession[];
  onSaveSession: (session: ClassSession) => void;
  existingSession?: ClassSession; // For editing
}

type SortOption = 'name' | 'class_alpha' | 'class_age';

export const AttendanceTaker: React.FC<AttendanceTakerProps> = ({ 
  students, 
  sessions,
  onSaveSession,
  existingSession 
}) => {
  const [date, setDate] = useState('');
  const [topic, setTopic] = useState('');
  const [records, setRecords] = useState<Record<string, 'present' | 'absent'>>({});
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('class_alpha');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const initialRecords: Record<string, 'present' | 'absent'> = {};
    if (existingSession) {
      setDate(existingSession.date);
      setTopic(existingSession.topic || '');
      existingSession.records.forEach(r => {
        initialRecords[r.studentId] = r.status;
      });
    } else {
      setDate(''); 
    }
    setRecords(initialRecords);
    setError(null);
  }, [existingSession]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      
      // Primary Sort: Class Name
      const classA = a.className || 'zzzz'; // Put no class at end
      const classB = b.className || 'zzzz';
      
      if (classA !== classB) {
        return classA.localeCompare(classB);
      }

      // Secondary Sort
      if (sortBy === 'class_age') {
        // Sort by birthday (Oldest first -> smaller date string)
        if (!a.birthday && !b.birthday) return a.name.localeCompare(b.name);
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return a.birthday.localeCompare(b.birthday);
      }
      
      // Default Secondary: Name
      return a.name.localeCompare(b.name);
    });
  }, [students, sortBy]);

  const toggleStatus = (studentId: string) => {
    setRecords(prev => {
      const current = prev[studentId];
      // Cycle: Unmarked -> Present -> Absent -> Unmarked
      if (current === 'present') {
        return { ...prev, [studentId]: 'absent' };
      } else if (current === 'absent') {
        const next = { ...prev };
        delete next[studentId]; // Reset to undefined (Grey)
        return next;
      } else {
        return { ...prev, [studentId]: 'present' };
      }
    });
  };

  const markAll = (status: 'present' | 'absent') => {
    const newRecords: Record<string, 'present' | 'absent'> = {};
    students.forEach(s => newRecords[s.id] = status);
    setRecords(newRecords);
  };

  const handleSaveClick = () => {
    setError(null);
    if (students.length === 0) {
      setError("Cannot save empty attendance list.");
      return;
    }
    if (!date) {
        setError("Please select a date for this session.");
        return;
    }
    const isDuplicate = sessions.some(s => s.date === date && s.id !== existingSession?.id);
    if (isDuplicate) {
        setError("An attendance record for this date already exists.");
        return;
    }
    
    // Check for unmarked students
    const unmarkedCount = students.filter(s => !records[s.id]).length;
    if (unmarkedCount > 0) {
        setError(`You have ${unmarkedCount} unmarked student(s). All students must be marked Present or Absent.`);
        return;
    }

    setShowConfirm(true);
  };

  const executeSave = () => {
    const finalRecords: AttendanceRecord[] = students.map(s => ({
      studentId: s.id,
      // Records should be populated now due to check in handleSaveClick
      status: records[s.id] || 'absent' 
    }));

    const session: ClassSession = {
      id: existingSession?.id || crypto.randomUUID(),
      date,
      topic: topic.trim() || undefined,
      records: finalRecords
    };

    onSaveSession(session);
    
    if (!existingSession) {
      setTopic('');
      setDate('');
      setRecords({});
    }
    setShowConfirm(false);
  };

  // Helper to calculate age
  const getAge = (birthday: string) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700">
           <User className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-lg font-medium text-gray-400">No students found.</p>
        <p className="text-sm">Please add students in the roster first.</p>
      </div>
    );
  }

  const presentCount = Object.values(records).filter(s => s === 'present').length;
  // Absent count includes explicit absent
  const absentCount = Object.values(records).filter(s => s === 'absent').length;
  // Unmarked count
  const unmarkedCount = students.length - presentCount - absentCount;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {error && (
        <div className="bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Session Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-800 p-6 rounded-2xl shadow-soft border border-gray-700">
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Class Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary-900 focus:border-primary-500 outline-none transition-all placeholder-gray-500 font-medium"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-400 mb-2">Lesson Topic <span className="text-gray-600 font-normal">(Optional)</span></label>
          <div className="relative">
            <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="e.g. Noah's Ark"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary-900 focus:border-primary-500 outline-none transition-all placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Control Bar - Sticky on Desktop */}
      <div className="md:sticky md:top-2 z-20 flex flex-col xl:flex-row justify-between items-center gap-4 bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-soft">
        
        {/* Left Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" variant="secondary" onClick={() => markAll('present')} className="flex-1 sm:flex-none">All Present</Button>
            <Button size="sm" variant="secondary" onClick={() => markAll('absent')} className="flex-1 sm:flex-none">All Absent</Button>
          </div>
          
          <div className="h-px w-full sm:w-px sm:h-8 bg-gray-700 hidden sm:block"></div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Sort by:</span>
              <div className="relative w-full sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full appearance-none bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-primary-900 outline-none cursor-pointer hover:border-gray-600 transition-colors"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="class_alpha">Class (Alphabetical)</option>
                  <option value="class_age">Class (Age)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
          </div>
        </div>

        {/* Right Stats & Save */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-4 border-t xl:border-t-0 border-gray-800 pt-4 xl:pt-0 w-full xl:w-auto justify-end">
          <div className="flex items-center gap-4 text-sm font-medium justify-between sm:justify-end w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               <span className="text-gray-300">{presentCount} Present</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-red-500"></div>
               <span className="text-gray-500">{absentCount} Absent</span>
            </div>
            {unmarkedCount > 0 && (
              <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  <span className="text-gray-500">{unmarkedCount} Unmarked</span>
              </div>
            )}
          </div>

          <Button onClick={handleSaveClick} className="w-full sm:w-auto shadow-lg shadow-primary-500/20">
              <Save className="w-4 h-4 mr-2" />
              Save
          </Button>
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedStudents.map(student => {
          const status = records[student.id]; // 'present' | 'absent' | undefined
          const isPresent = status === 'present';
          const isAbsent = status === 'absent';
          const age = student.birthday ? getAge(student.birthday) : null;

          return (
            <div 
              key={student.id}
              onClick={() => toggleStatus(student.id)}
              className={`
                cursor-pointer p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 select-none group
                ${isPresent 
                  ? 'bg-gray-800 border-green-900/50 shadow-md shadow-green-900/10' 
                  : isAbsent
                  ? 'bg-gray-800 border-red-900/50 shadow-md shadow-red-900/10'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'}
              `}
            >
              <div className={`relative w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border ${
                  isPresent ? 'border-green-800' : isAbsent ? 'border-red-800' : 'border-gray-700'
              }`}>
                   {student.photo ? (
                       <img src={student.photo} alt="" className="w-full h-full object-cover" />
                   ) : (
                       <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-500">
                           <User className="w-6 h-6" />
                       </div>
                   )}
                   
                   {/* Overlay for Present */}
                   <div className={`
                       absolute inset-0 flex items-center justify-center transition-opacity duration-200
                       ${isPresent ? 'opacity-100 bg-green-900/60 backdrop-blur-[1px]' : 'opacity-0'}
                   `}>
                       <Check className="w-6 h-6 text-white" />
                   </div>

                   {/* Overlay for Absent */}
                   <div className={`
                       absolute inset-0 flex items-center justify-center transition-opacity duration-200
                       ${isAbsent ? 'opacity-100 bg-red-900/60 backdrop-blur-[1px]' : 'opacity-0'}
                   `}>
                       <X className="w-6 h-6 text-white" />
                   </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate transition-colors ${
                    isPresent ? 'text-white' : isAbsent ? 'text-gray-400' : 'text-gray-300'
                }`}>
                  {student.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    {student.className && (
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700/50">
                            {student.className}
                        </span>
                    )}
                    {age !== null && sortBy === 'class_age' && (
                        <span className="text-[10px] text-gray-500">
                            {age} yrs
                        </span>
                    )}
                </div>
              </div>
              
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border
                ${isPresent 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : isAbsent
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-500 group-hover:border-gray-600'}
              `}>
                {isPresent && <Check className="w-3.5 h-3.5" />}
                {isAbsent && <X className="w-3.5 h-3.5" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowConfirm(false)}
        >
            <div 
                className="bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-700 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
                    <div className="p-3 bg-primary-900/20 rounded-full flex-shrink-0">
                        <Save className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Confirm Save</h3>
                        <p className="text-gray-400 text-xs">Please review session details.</p>
                    </div>
                </div>
                
                <div className="space-y-3 py-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="text-gray-200 font-medium">{new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Topic</span>
                        <span className="text-gray-200 font-medium truncate max-w-[180px]">{topic || 'No topic'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Attendance</span>
                        <div className="flex gap-3">
                            <span className="text-green-500 font-medium">{presentCount} Present</span>
                            <span className="text-red-400 font-medium">{absentCount} Absent</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-gray-700">
                    <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
                    <Button onClick={executeSave}>Confirm & Save</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};