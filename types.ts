export interface Student {
  id: string;
  name: string;
  guardian?: string;
  guardianContact?: string;
  notes?: string;
  className?: string;
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

export interface ClassSession {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  topic?: string;
  records: AttendanceRecord[];
}

export interface AttendanceStats {
  totalSessions: number;
  averageAttendance: number;
  totalStudents: number;
}