
import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassSession, AttendanceRecord, MemoryVerseStatus, Density } from '../types';
import { Button } from './Button';
import { Check, Calendar, BookOpen, Save, AlertCircle, User, ChevronDown, X, ScrollText, Star, Minus } from 'lucide-react';

interface AttendanceTakerProps {
  students: Student[];
  sessions: ClassSession[];
  onSaveSession: (session: ClassSession) => void;
  existingSession?: ClassSession; // For editing
  density: Density;
}

type SortOption = 'name' | 'class_alpha' | 'class_age';

export const AttendanceTaker: React.FC<AttendanceTakerProps> = ({ 
  students, 
  sessions,
  onSaveSession,
  existingSession,
  density
}) => {
  const [date, setDate] = useState('');
  const [topic, setTopic] = useState('');
  const [memoryVerse, setMemoryVerse] = useState('');
  const [records, setRecords] = useState<Record<string, 'present' | 'absent'>>({});
  const [verseRecords, setVerseRecords] = useState<Record<string, MemoryVerseStatus | undefined>>({});
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('class_alpha');
  const [showConfirm, setShowConfirm] = useState(false);

  const s = useMemo(() => {
    switch (density) {
        case 'compact':
            return {
                gap: 'gap-4',
                space: 'space-y-4',
                p: 'p-4',
                gridGap: 'gap-2',
                cardP: 'p-2',
                iconSize: 'w-10 h-10',
                btnPy: 'py-1'
            };
        case 'spacious':
            return {
                gap: 'gap-8',
                space: 'space-y-12',
                p: 'p-12',
                gridGap: 'gap-6',
                cardP: 'p-6',
                iconSize: 'w-16 h-16',
                btnPy: 'py-3'
            };
        default:
            return {
                gap: 'gap-6',
                space: 'space-y-8',
                p: 'p-8',
                gridGap: 'gap-4',
                cardP: 'p-4',
                iconSize: 'w-14 h-14',
                btnPy: 'py-2'
            };
    }
  }, [density]);

  useEffect(() => {
    const initialRecords: Record<string, 'present' | 'absent'> = {};
    const initialVerseRecords: Record<string, MemoryVerseStatus | undefined> = {};
    
    if (existingSession) {
      setDate(existingSession.date);
      setTopic(existingSession.topic || '');
      setMemoryVerse(existingSession.memoryVerse || '');
      existingSession.records.forEach(r => {
        initialRecords[r.studentId] = r.status;
        initialVerseRecords[r.studentId] = r.memoryVerseStatus;
      });
    } else {
      setDate(''); 
    }
    setRecords(initialRecords);
    setVerseRecords(initialVerseRecords);
    setError(null);
  }, [existingSession]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      const classA = a.className || 'zzzz';
      const classB = b.className || 'zzzz';
      if (classA !== classB) {
        return classA.localeCompare(classB);
      }
      if (sortBy === 'class_age') {
        if (!a.birthday && !b.birthday) return a.name.localeCompare(b.name);
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return a.birthday.localeCompare(b.birthday);
      }
      return a.name.localeCompare(b.name);
    });
  }, [students, sortBy]);

  const toggleStatus = (studentId: string) => {
    setRecords(prev => {
      const current = prev[studentId];
      if (current === 'present') {
        return { ...prev, [studentId]: 'absent' };
      } else if (current === 'absent') {
        const next = { ...prev };
        delete next[studentId];
        return next;
      } else {
        return { ...prev, [studentId]: 'present' };
      }
    });
  };

  const setVerseStatus = (studentId: string, status: MemoryVerseStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerseRecords(prev => {
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
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
    const unmarkedCount = students.filter(s => !records[s.id]).length;
    if (unmarkedCount > 0) {
        setError(`You have ${unmarkedCount} unmarked student(s). All students must be marked Present or Absent.`);
        return;
    }

    // Validation: Memory Verse Status
    // Enforce marking if a verse topic is provided OR if any verse tracking has begun for this session.
    const hasVerseTopic = memoryVerse.trim().length > 0;
    const hasAnyVerseMarked = Object.keys(verseRecords).length > 0;

    if (hasVerseTopic || hasAnyVerseMarked) {
      const presentStudents = students.filter(s => records[s.id] === 'present');
      const unmarkedVerseCount = presentStudents.filter(s => !verseRecords[s.id]).length;
      
      if (unmarkedVerseCount > 0) {
          setError(`${unmarkedVerseCount} present student(s) have no assignment status. Please mark Complete, Partial, or Missing.`);
          return;
      }
    }

    setShowConfirm(true);
  };

  const executeSave = () => {
    const finalRecords: AttendanceRecord[] = students.map(s => ({
      studentId: s.id,
      status: records[s.id] || 'absent',
      memoryVerseStatus: verseRecords[s.id]
    }));

    const session: ClassSession = {
      id: existingSession?.id || crypto.randomUUID(),
      date,
      topic: topic.trim() || undefined,
      memoryVerse: memoryVerse.trim() || undefined,
      records: finalRecords
    };

    onSaveSession(session);
    if (!existingSession) {
      setTopic('');
      setMemoryVerse('');
      setDate('');
      setRecords({});
      setVerseRecords({});
    }
    setShowConfirm(false);
  };

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
      <div className="flex flex-col items-center justify-center py-24 text-zinc-500 animate-fade-in-up border-2 border-dashed border-zinc-800">
        <div className="w-16 h-16 bg-zinc-800 flex items-center justify-center mb-4 border-2 border-zinc-700 animate-bounce">
           <User className="w-8 h-8 text-zinc-600" />
        </div>
        <p className="text-lg font-bold font-mono uppercase">ROSTER_EMPTY</p>
      </div>
    );
  }

  const presentCount = Object.values(records).filter(s => s === 'present').length;
  const absentCount = Object.values(records).filter(s => s === 'absent').length;

  return (
    <div className={`${s.space} relative`}>
      {error && (
        <div className="bg-red-600 text-white p-4 border-4 border-red-900 flex items-center gap-3 animate-shake shadow-brutal sticky top-0 z-30">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="font-bold uppercase tracking-wide">{error}</p>
        </div>
      )}

      {/* Session Info Card */}
      <div className={`bg-zinc-800 ${s.p} border-[3px] border-zinc-600 shadow-brutal transition-all duration-300 hover:border-white hover:shadow-brutal-lg animate-slam`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Class Date *</label>
              <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-hover:text-primary-500 group-hover:scale-110" />
                  <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                      setDate(e.target.value);
                      setError(null);
                  }}
                  className="w-full bg-zinc-900 border-2 border-zinc-600 text-white pl-12 pr-4 py-3 focus:border-white focus:bg-black outline-none font-mono uppercase transition-all duration-200 focus:shadow-[4px_4px_0px_0px_#ef4444]"
                  required
                  />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Lesson Topic</label>
              <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-hover:text-primary-500 group-hover:scale-110" />
                  <input
                  type="text"
                  placeholder="e.g. Noah's Ark"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-zinc-900 border-2 border-zinc-600 text-white pl-12 pr-4 py-3 focus:border-white focus:bg-black outline-none font-medium placeholder-zinc-600 uppercase transition-all duration-200 focus:shadow-[4px_4px_0px_0px_#ef4444]"
                  />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Assignment</label>
              <div className="relative group">
                  <ScrollText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors group-hover:text-primary-500 group-hover:scale-110" />
                  <input
                  type="text"
                  placeholder="e.g. Workbook Page 42"
                  value={memoryVerse}
                  onChange={(e) => setMemoryVerse(e.target.value)}
                  className="w-full bg-zinc-900 border-2 border-zinc-600 text-white pl-12 pr-4 py-3 focus:border-white focus:bg-black outline-none font-medium placeholder-zinc-600 uppercase transition-all duration-200 focus:shadow-[4px_4px_0px_0px_#ef4444]"
                  />
              </div>
            </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-20 flex flex-col xl:flex-row justify-between items-center gap-4 bg-zinc-900 p-4 border-[3px] border-zinc-600 shadow-brutal transition-all duration-300 animate-slide-in-right" style={{ animationDelay: '100ms' }}>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button size="sm" variant="secondary" onClick={() => markAll('present')} className="flex-1">ALL PRES</Button>
            <Button size="sm" variant="secondary" onClick={() => markAll('absent')} className="flex-1">ALL ABS</Button>
          </div>
          
          <div className="h-8 w-px bg-zinc-600 hidden sm:block"></div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase text-zinc-500">Sort:</span>
              <div className="relative w-full sm:w-48 group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full appearance-none bg-zinc-800 border-2 border-zinc-600 text-white text-xs font-mono uppercase pl-3 pr-8 py-2 focus:border-white focus:bg-black outline-none cursor-pointer transition-colors group-hover:border-zinc-400 focus:shadow-[2px_2px_0px_0px_#ef4444]"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="class_alpha">Class (A-Z)</option>
                  <option value="class_age">Class (Age)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:translate-y-0 transition-transform" />
              </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-6 w-full xl:w-auto justify-end">
          <div className="flex items-center gap-6 text-sm font-bold uppercase font-mono w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 group">
               <div className="w-4 h-4 bg-green-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] group-hover:scale-125 transition-transform"></div>
               <span className="text-zinc-300 transition-all group-hover:text-white">{presentCount} PRES</span>
            </div>
            <div className="flex items-center gap-2 group">
               <div className="w-4 h-4 bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] group-hover:scale-125 transition-transform"></div>
               <span className="text-zinc-500 transition-all group-hover:text-white">{absentCount} ABS</span>
            </div>
          </div>

          <Button onClick={handleSaveClick} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Save Record
          </Button>
        </div>
      </div>

      {/* Student Grid - Brutalist Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${s.gridGap}`}>
        {sortedStudents.map((student, idx) => {
          const status = records[student.id]; 
          const isPresent = status === 'present';
          const isAbsent = status === 'absent';
          const verseStatus = verseRecords[student.id];
          const age = student.birthday ? getAge(student.birthday) : null;

          // Staggered Delay for grid
          const delayStyle = { animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' };

          return (
            <div 
              key={student.id}
              onClick={() => toggleStatus(student.id)}
              style={delayStyle}
              className={`
                cursor-pointer border-[3px] transition-all duration-100 ease-out flex flex-col select-none group relative overflow-hidden animate-slide-up opacity-0
                ${isPresent 
                  ? 'bg-green-600 border-green-400 shadow-[4px_4px_0px_0px_#10b981] translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none z-10' 
                  : isAbsent
                  ? 'bg-red-600 border-red-400 shadow-[4px_4px_0px_0px_#ef4444] translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none z-10'
                  : 'bg-zinc-900 border-zinc-600 hover:border-white hover:bg-zinc-800 hover:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-0 active:translate-y-0 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
              `}
            >
              {/* Main Attendance Section */}
              <div className={`${s.cardP} flex items-center gap-4 flex-1`}>
                <div className={`relative ${s.iconSize} flex-shrink-0 border-[3px] transition-colors duration-200 bg-zinc-800 ${
                    isPresent ? 'border-black bg-green-500' : isAbsent ? 'border-black bg-red-500' : 'border-zinc-500 group-hover:border-white'
                }`}>
                    {student.photo ? (
                        <img src={student.photo} alt="" className={`w-full h-full object-cover transition-all duration-300 ${isPresent || isAbsent ? 'grayscale-0 mix-blend-multiply' : 'grayscale'}`} />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isPresent || isAbsent ? 'text-black' : 'text-zinc-500'}`}>
                            <User className="w-6 h-6" />
                        </div>
                    )}
                    
                    {/* Status Icons Overlay */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-150 ${isPresent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                        <Check className="w-8 h-8 text-black stroke-[4] animate-slam" />
                    </div>
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-150 ${isAbsent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                        <X className="w-8 h-8 text-black stroke-[4] animate-slam" />
                    </div>
                </div>
                
                <div className="flex-1 min-w-0 z-10">
                  <p className={`font-black uppercase truncate transition-colors duration-200 text-lg tracking-tight ${
                      isPresent ? 'text-white drop-shadow-md' : isAbsent ? 'text-white drop-shadow-md' : 'text-white group-hover:text-primary-500'
                  }`}>
                    {student.name}
                  </p>
                  <div className="flex flex-col gap-1 mt-1">
                      {student.className && (
                          <span className={`text-[10px] font-bold font-mono uppercase px-1 border w-fit transition-colors ${
                              isPresent || isAbsent 
                                ? 'bg-black text-white border-black' 
                                : 'bg-zinc-950 text-zinc-400 border-zinc-700 group-hover:border-zinc-500'
                          }`}>
                              {student.className}
                          </span>
                      )}
                      {age !== null && sortBy === 'class_age' && (
                          <span className={`text-[10px] font-mono font-bold ${isPresent || isAbsent ? 'text-white/80' : 'text-zinc-500'}`}>
                              {age} YRS
                          </span>
                      )}
                  </div>
                </div>
              </div>
              
              {/* Memory Verse Controls */}
              <div className={`
                flex border-t-[3px] divide-x-[3px] transition-colors duration-200
                ${isPresent ? 'border-green-800 divide-green-800 bg-green-700' : isAbsent ? 'border-red-800 divide-red-800 bg-red-700' : 'border-zinc-700 divide-zinc-700 bg-zinc-900'}
              `}>
                  <button 
                    onClick={(e) => setVerseStatus(student.id, 'failed', e)}
                    className={`flex-1 ${s.btnPy} flex items-center justify-center hover:bg-black/20 transition-colors group/btn active:bg-black/40 ${verseStatus === 'failed' ? 'bg-black text-red-500' : isPresent || isAbsent ? 'text-black/50 hover:text-white' : 'text-zinc-600 hover:text-red-500'}`}
                    title="Missing / Incomplete"
                  >
                     <X className={`w-4 h-4 stroke-[3] ${verseStatus === 'failed' ? 'animate-pop' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => setVerseStatus(student.id, 'attempted', e)}
                    className={`flex-1 ${s.btnPy} flex items-center justify-center hover:bg-black/20 transition-colors group/btn active:bg-black/40 ${verseStatus === 'attempted' ? 'bg-black text-blue-400' : isPresent || isAbsent ? 'text-black/50 hover:text-white' : 'text-zinc-600 hover:text-blue-500'}`}
                    title="Partial / Attempted"
                  >
                     <Minus className={`w-4 h-4 stroke-[3] ${verseStatus === 'attempted' ? 'animate-pop' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => setVerseStatus(student.id, 'fluent', e)}
                    className={`flex-1 ${s.btnPy} flex items-center justify-center hover:bg-black/20 transition-colors group/btn active:bg-black/40 ${verseStatus === 'fluent' ? 'bg-black text-yellow-400' : isPresent || isAbsent ? 'text-black/50 hover:text-white' : 'text-zinc-600 hover:text-yellow-500'}`}
                    title="Complete / Perfect"
                  >
                     <Star className={`w-4 h-4 stroke-[3] ${verseStatus === 'fluent' ? 'fill-yellow-400 animate-pop' : ''}`} />
                  </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal - Brutalist */}
      {showConfirm && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
            onClick={() => setShowConfirm(false)}
        >
            <div 
                className="bg-zinc-900 w-full max-w-md border-4 border-primary-600 shadow-brutal-white p-0 flex flex-col animate-slam"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-primary-600 p-6 border-b-4 border-white">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter animate-pulse-slow">Confirm Submission</h3>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center border-b-2 border-zinc-700 pb-2">
                        <span className="text-zinc-500 font-mono text-xs uppercase">Date</span>
                        <span className="text-white font-black text-lg uppercase">{new Date(date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b-2 border-zinc-700 pb-2">
                        <span className="text-zinc-500 font-mono text-xs uppercase">Topic</span>
                        <span className="text-white font-bold uppercase truncate max-w-[200px]">{topic || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b-2 border-zinc-700 pb-2">
                        <span className="text-zinc-500 font-mono text-xs uppercase">Assignment</span>
                        <span className="text-white font-bold uppercase truncate max-w-[200px]">{memoryVerse || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-zinc-500 font-mono text-xs uppercase">Stats</span>
                        <div className="flex gap-4 font-mono font-black text-xl">
                            <span className="text-green-500">{presentCount} PRS</span>
                            <span className="text-red-500">{absentCount} ABS</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex gap-4">
                    <Button variant="ghost" onClick={() => setShowConfirm(false)} className="flex-1 border-2 border-zinc-600">Back</Button>
                    <Button onClick={executeSave} className="flex-1 bg-white text-black border-black hover:bg-zinc-200 hover:border-black shadow-brutal hover:shadow-brutal-lg">Confirm</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
