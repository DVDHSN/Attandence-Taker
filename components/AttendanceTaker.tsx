import React, { useState, useEffect } from 'react';
import { Student, ClassSession, AttendanceRecord } from '../types';
import { Button } from './Button';
import { Check, X, Calendar, BookOpen, Save, AlertCircle } from 'lucide-react';

interface AttendanceTakerProps {
  students: Student[];
  sessions: ClassSession[];
  onSaveSession: (session: ClassSession) => void;
  existingSession?: ClassSession; // For editing
}

export const AttendanceTaker: React.FC<AttendanceTakerProps> = ({ 
  students, 
  sessions,
  onSaveSession,
  existingSession 
}) => {
  // Default date to empty string so user selects it manually
  const [date, setDate] = useState('');
  const [topic, setTopic] = useState('');
  const [records, setRecords] = useState<Record<string, 'present' | 'absent'>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize default state
    const initialRecords: Record<string, 'present' | 'absent'> = {};
    if (existingSession) {
      setDate(existingSession.date);
      setTopic(existingSession.topic || '');
      existingSession.records.forEach(r => {
        initialRecords[r.studentId] = r.status;
      });
    } else {
      // Default date to empty if no session is provided, user must pick.
      setDate(''); 
    }
    setRecords(initialRecords);
    setError(null);
  }, [existingSession]);

  const toggleStatus = (studentId: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const markAll = (status: 'present' | 'absent') => {
    const newRecords: Record<string, 'present' | 'absent'> = {};
    students.forEach(s => newRecords[s.id] = status);
    setRecords(newRecords);
  };

  const handleSave = () => {
    setError(null);

    if (students.length === 0) {
      setError("Cannot save empty attendance list.");
      return;
    }
    
    if (!date) {
        setError("Please select a date for this session.");
        return;
    }

    // Check for duplicate date
    const isDuplicate = sessions.some(s => s.date === date && s.id !== existingSession?.id);
    if (isDuplicate) {
        setError("An attendance record for this date already exists.");
        return;
    }

    // Ensure all students have a record, default to absent if skipped
    const finalRecords: AttendanceRecord[] = students.map(s => ({
      studentId: s.id,
      status: records[s.id] || 'absent'
    }));

    const session: ClassSession = {
      id: existingSession?.id || crypto.randomUUID(),
      date,
      topic: topic.trim() || undefined,
      records: finalRecords
    };

    onSaveSession(session);
    
    // Reset if new session
    if (!existingSession) {
      setTopic('');
      setDate('');
      setRecords({});
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No students found. Please add students in the roster first.</p>
      </div>
    );
  }

  const presentCount = Object.values(records).filter(s => s === 'present').length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Class Date <span className="text-red-400">*</span></label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Lesson Topic (Optional)</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="e.g. Noah's Ark"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => markAll('present')}>Mark All Present</Button>
          <Button size="sm" variant="secondary" onClick={() => markAll('absent')}>Mark All Absent</Button>
        </div>
        <div className="text-sm text-gray-400">
          <span className="text-green-400 font-bold">{presentCount}</span> Present &bull; <span className="text-red-400 font-bold">{absentCount}</span> Absent
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(student => {
          const isPresent = records[student.id] === 'present';
          return (
            <div 
              key={student.id}
              onClick={() => toggleStatus(student.id)}
              className={`
                cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center justify-between select-none
                ${isPresent 
                  ? 'bg-indigo-900/30 border-indigo-500/50 hover:bg-indigo-900/50' 
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-750'}
              `}
            >
              <div>
                <p className={`font-medium ${isPresent ? 'text-indigo-200' : 'text-gray-300'}`}>
                  {student.name}
                </p>
              </div>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-colors
                ${isPresent ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-500/50'}
              `}>
                {isPresent ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-6 flex justify-end">
         <Button onClick={handleSave} size="lg" className="shadow-xl">
            <Save className="w-5 h-5 mr-2" />
            Save Attendance
         </Button>
      </div>
    </div>
  );
};