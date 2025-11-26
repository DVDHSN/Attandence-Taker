import { Student, ClassSession, ClassConfig } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'sundaykeep_students',
  SESSIONS: 'sundaykeep_sessions',
  CLASSES: 'sundaykeep_classes',
  CLASS_CONFIGS: 'sundaykeep_class_configs',
};

export const saveStudents = (students: Student[]) => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!data) return [];
  
  const parsed = JSON.parse(data);
  
  // Migration: If existing data has 'group' but not 'className', map it.
  // This ensures users don't lose their assignments when the variable name changes.
  return parsed.map((s: any) => {
    const student = { ...s };
    if (student.group && !student.className) {
      student.className = student.group;
      delete student.group;
    }
    return student as Student;
  });
};

export const saveSessions = (sessions: ClassSession[]) => {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const getSessions = (): ClassSession[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const saveClasses = (classes: string[]) => {
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
};

export const getClasses = (): string[] => {
  // Try to get new key first
  const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
  if (data) return JSON.parse(data);

  // Fallback to legacy key if new key doesn't exist
  const legacyData = localStorage.getItem('sundaykeep_groups');
  return legacyData ? JSON.parse(legacyData) : [];
};

export const saveClassConfigs = (configs: Record<string, ClassConfig>) => {
  localStorage.setItem(STORAGE_KEYS.CLASS_CONFIGS, JSON.stringify(configs));
};

export const getClassConfigs = (): Record<string, ClassConfig> => {
  const data = localStorage.getItem(STORAGE_KEYS.CLASS_CONFIGS);
  return data ? JSON.parse(data) : {};
};

// Helper to escape CSV fields (handle commas, quotes, newlines)
const escapeCsvField = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const exportToCSV = (sessions: ClassSession[], students: Student[]) => {
  // Create Header Row
  const headers = [
    'Date', 
    'Topic', 
    'Total Present', 
    'Total Absent', 
    ...students.map(s => {
      const parts = [
        s.name,
        s.className ? `(${s.className})` : '',
        s.birthday ? `[DOB: ${s.birthday}]` : '',
        s.guardianContact ? `- ${s.guardianContact}` : '',
        s.address ? `[Addr: ${s.address}]` : ''
      ].filter(Boolean).join(' ');
      return parts;
    })
  ].map(escapeCsvField);
  
  const rows = sessions.map(session => {
    const presentCount = session.records.filter(r => r.status === 'present').length;
    const absentCount = session.records.filter(r => r.status === 'absent').length;
    
    const studentAttendance = students.map(student => {
      const record = session.records.find(r => r.studentId === student.id);
      return record ? (record.status === 'present' ? 'Present' : 'Absent') : '-';
    });

    return [
      session.date,
      session.topic || '',
      presentCount,
      absentCount,
      ...studentAttendance
    ].map(escapeCsvField).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};