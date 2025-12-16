
import React, { useState, useMemo } from 'react';
import { ClassSession, Student, Density } from '../types';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { 
  Trophy, TrendingUp, Users, Star, ChevronDown, 
  Calendar, Award, Target, BookOpenCheck, Medal, BrainCircuit, Activity, Zap 
} from 'lucide-react';

interface AnalyticsProps {
  sessions: ClassSession[];
  students: Student[];
  classes: string[];
  density: Density;
}

const COLORS = {
  primary: '#ef4444', // Red (Failed)
  success: '#10b981', // Green (Fluent)
  warning: '#eab308', // Yellow (Attempted)
  info: '#3b82f6',
  zinc: '#71717a',
  dark: '#18181b'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border-2 border-white p-3 shadow-brutal min-w-[150px] z-50 animate-slam">
        <p className="text-white font-mono text-xs font-bold mb-2 uppercase border-b border-zinc-700 pb-1">{label}</p>
        <div className="space-y-1">
            {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between text-xs font-mono uppercase">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ backgroundColor: entry.fill || entry.color }} />
                    <span className="text-zinc-400">{entry.name}:</span>
                </div>
                <span className="text-white font-bold">{entry.value}</span>
            </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
};

export const Analytics: React.FC<AnalyticsProps> = ({ sessions, students, classes, density }) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [assignmentSort, setAssignmentSort] = useState<'score' | 'completed' | 'partial'>('score');

  const s = useMemo(() => {
    switch (density) {
        case 'compact':
            return {
                gap: 'gap-4',
                space: 'space-y-4',
                p: 'p-4',
                gridGap: 'gap-4',
                cardVal: 'text-2xl',
                chartH: 'h-[300px]',
                iconSize: 'w-6 h-6'
            };
        case 'spacious':
            return {
                gap: 'gap-10',
                space: 'space-y-16',
                p: 'p-10',
                gridGap: 'gap-10',
                cardVal: 'text-6xl',
                chartH: 'h-[550px]',
                iconSize: 'w-10 h-10'
            };
        default:
            return {
                gap: 'gap-6',
                space: 'space-y-8',
                p: 'p-6',
                gridGap: 'gap-6',
                cardVal: 'text-4xl',
                chartH: 'h-[400px]',
                iconSize: 'w-8 h-8'
            };
    }
  }, [density]);

  // --- Filtering Logic ---
  
  const filteredStudents = useMemo(() => {
    if (selectedClass === 'ALL') return students;
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const filteredStudentIds = useMemo(() => new Set(filteredStudents.map(s => s.id)), [filteredStudents]);

  const relevantSessions = useMemo(() => {
    return sessions.filter(session => 
      selectedClass === 'ALL' || session.records.some(r => filteredStudentIds.has(r.studentId))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, selectedClass, filteredStudentIds]);

  // --- Statistics Calculations ---

  // 1. Overview Stats
  const overviewStats = useMemo(() => {
    let totalAttendance = 0;
    let totalCapacity = 0;
    let totalVersesFluent = 0;
    let totalVersesAttempted = 0;
    let totalVersesFailed = 0;

    relevantSessions.forEach(session => {
        const relevantRecords = session.records.filter(r => filteredStudentIds.has(r.studentId));
        totalCapacity += filteredStudents.length; 
        totalAttendance += relevantRecords.filter(r => r.status === 'present').length;
        
        relevantRecords.forEach(r => {
            if (r.memoryVerseStatus === 'fluent') totalVersesFluent++;
            if (r.memoryVerseStatus === 'attempted') totalVersesAttempted++;
            if (r.memoryVerseStatus === 'failed') totalVersesFailed++;
        });
    });

    const avgAttendance = totalCapacity > 0 ? Math.round((totalAttendance / totalCapacity) * 100) : 0;
    
    const totalVersesRecorded = totalVersesFluent + totalVersesAttempted + totalVersesFailed;
    // Success Rate = Fluent / Total Recorded
    const successRate = totalVersesRecorded > 0 
        ? Math.round((totalVersesFluent / totalVersesRecorded) * 100) 
        : 0;

    return { totalAttendance, avgAttendance, totalVersesFluent, successRate, totalVersesRecorded };
  }, [relevantSessions, filteredStudents, filteredStudentIds]);

  // 2. Timeline Data (Attendance & Verse Mastery Breakdown)
  const timelineData = useMemo(() => {
    return relevantSessions.map(session => {
        const relevantRecords = session.records.filter(r => filteredStudentIds.has(r.studentId));
        const present = relevantRecords.filter(r => r.status === 'present').length;
        const total = filteredStudents.length; 
        const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
        
        const fluent = relevantRecords.filter(r => r.memoryVerseStatus === 'fluent').length;
        const tried = relevantRecords.filter(r => r.memoryVerseStatus === 'attempted').length;
        const failed = relevantRecords.filter(r => r.memoryVerseStatus === 'failed').length;
        
        const sessionTotalVerses = fluent + tried + failed;
        const sessionSuccessRate = sessionTotalVerses > 0 ? Math.round((fluent / sessionTotalVerses) * 100) : 0;

        return {
            date: new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            attendance: attendanceRate,
            successRate: sessionSuccessRate,
            Complete: fluent,
            Partial: tried,
            Missing: failed
        };
    });
  }, [relevantSessions, filteredStudents, filteredStudentIds]);

  // 3. Leaderboards
  const studentPerformance = useMemo(() => {
    return filteredStudents.map(student => {
        let present = 0;
        let fluent = 0;
        let attempted = 0;
        let totalSessions = 0;

        relevantSessions.forEach(session => {
            const record = session.records.find(r => r.studentId === student.id);
            if (record) { 
                totalSessions++;
                if (record.status === 'present') present++;
                if (record.memoryVerseStatus === 'fluent') fluent++;
                if (record.memoryVerseStatus === 'attempted') attempted++;
            }
        });

        const attendanceRate = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;
        return { 
            ...student, 
            present, 
            totalSessions, 
            attendanceRate, 
            fluent, 
            attempted,
            verseScore: (fluent * 2) + attempted
        };
    });
  }, [filteredStudents, relevantSessions]);

  const topAttendance = useMemo(() => {
    return [...studentPerformance]
    .filter(s => s.totalSessions > 0)
    .sort((a, b) => b.attendanceRate - a.attendanceRate || b.present - a.present)
    .slice(0, 5);
  }, [studentPerformance]);

  const topVerses = useMemo(() => {
    return [...studentPerformance]
    .filter(s => s.fluent > 0 || s.attempted > 0)
    .sort((a, b) => {
        if (assignmentSort === 'completed') return b.fluent - a.fluent || b.verseScore - a.verseScore;
        if (assignmentSort === 'partial') return b.attempted - a.attempted || b.verseScore - a.verseScore;
        // Default 'score'
        return b.verseScore - a.verseScore || b.fluent - a.fluent;
    })
    .slice(0, 5);
  }, [studentPerformance, assignmentSort]);

  // 4. Class Comparison
  const classComparisonData = useMemo(() => {
    if (selectedClass !== 'ALL') return [];
    
    return classes.map(cls => {
        const clsStudents = students.filter(s => s.className === cls);
        const clsIds = new Set(clsStudents.map(s => s.id));
        let totalAtt = 0;
        let capacity = 0;
        let fluentVerses = 0;
        let totalVerses = 0;

        relevantSessions.forEach(s => {
            capacity += clsStudents.length;
            s.records.forEach(r => {
                if (clsIds.has(r.studentId)) {
                    if (r.status === 'present') totalAtt++;
                    if (r.memoryVerseStatus === 'fluent') fluentVerses++;
                    if (r.memoryVerseStatus) totalVerses++;
                }
            });
        });

        return {
            name: cls,
            attendance: capacity > 0 ? Math.round((totalAtt / capacity) * 100) : 0,
            verseSuccess: totalVerses > 0 ? Math.round((fluentVerses / totalVerses) * 100) : 0
        };
    });
  }, [selectedClass, classes, students, relevantSessions]);

  // 5. Verse Distribution
  const verseDistData = useMemo(() => {
    let f = 0, a = 0, x = 0;
    relevantSessions.forEach(s => {
        s.records.forEach(r => {
            if (filteredStudentIds.has(r.studentId)) {
                if (r.memoryVerseStatus === 'fluent') f++;
                else if (r.memoryVerseStatus === 'attempted') a++;
                else if (r.memoryVerseStatus === 'failed') x++;
            }
        });
    });
    return [
        { name: 'Complete', value: f, color: COLORS.success },
        { name: 'Partial', value: a, color: COLORS.warning },
        { name: 'Missing', value: x, color: COLORS.primary }
    ].filter(d => d.value > 0);
  }, [relevantSessions, filteredStudentIds]);

  // Chart Key for Animation Replay
  const animationKey = `analytics-${selectedClass}`;

  const StatCard = ({ label, value, sub, icon: Icon, color, gradient, delay }: any) => (
    <div className={`relative overflow-hidden bg-zinc-800 ${s.p} border-2 border-zinc-700 shadow-brutal flex items-start justify-between group hover:border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-brutal-lg animate-slide-up opacity-0`} style={{ animationDelay: delay, animationFillMode: 'forwards' }}>
        {/* Subtle gradient background */}
        <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${gradient} opacity-5 transform skew-x-12 translate-x-8 transition-opacity group-hover:opacity-10`} />
        
        <div className="z-10">
            <p className="text-zinc-500 font-mono text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-zinc-300 transition-colors">{label}</p>
            <h3 className={`${s.cardVal} font-black ${color} mb-1 tracking-tighter`}>{value}</h3>
            <p className="text-zinc-400 text-xs font-mono border-l-2 border-zinc-700 pl-2 group-hover:border-zinc-500 transition-colors">{sub}</p>
        </div>
        <div className={`p-3 bg-zinc-900 border-2 border-zinc-700 group-hover:border-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className={`${s.iconSize} ${color.replace('text-', 'text-')}`} />
        </div>
    </div>
  );

  return (
    <div className={`${s.space} animate-fade-in pb-12`}>
      {/* Controls */}
      <div className={`flex justify-between items-center bg-zinc-800 ${s.p} border-2 border-zinc-700 shadow-brutal sticky top-0 z-40`}>
        <div className="flex items-center gap-3">
            <div className="bg-primary-600 p-2 border border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
                <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-white uppercase tracking-tighter hidden sm:inline">Analytics<span className="text-primary-500">.Console</span></span>
        </div>
        <div className="relative group w-48 sm:w-64">
            <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-zinc-900 border-2 border-zinc-600 text-white pl-4 pr-10 py-3 uppercase font-bold tracking-wide outline-none appearance-none cursor-pointer hover:border-primary-500 focus:border-primary-500 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
            >
                <option value="ALL">All Classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:text-white" />
        </div>
      </div>

      {/* Overview Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${s.gridGap}`}>
        <StatCard 
            label="Avg. Attendance" 
            value={`${overviewStats.avgAttendance}%`} 
            sub="Session participation"
            icon={Users} 
            color="text-blue-500" 
            gradient="from-blue-500 to-transparent"
            delay="0ms"
        />
        <StatCard 
            label="Assgn Success" 
            value={`${overviewStats.successRate}%`} 
            sub={`Based on ${overviewStats.totalVersesRecorded} records`}
            icon={Target} 
            color="text-green-500" 
            gradient="from-green-500 to-transparent"
            delay="50ms"
        />
        <StatCard 
            label="Completed Assgns" 
            value={overviewStats.totalVersesFluent} 
            sub="Marked as Complete"
            icon={BookOpenCheck} 
            color="text-purple-500" 
            gradient="from-purple-500 to-transparent"
            delay="100ms"
        />
        <StatCard 
            label="Total Activity" 
            value={overviewStats.totalVersesRecorded} 
            sub="Assignments partial/missing"
            icon={Activity} 
            color="text-yellow-500" 
            gradient="from-yellow-500 to-transparent"
            delay="150ms"
        />
      </div>

      {/* Main Charts Row 1 */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 ${s.gap} ${s.chartH}`}>
         {/* Attendance Trend */}
         <div className={`bg-zinc-800 border-2 border-zinc-700 shadow-brutal ${s.p} flex flex-col hover:border-white transition-all duration-300 group animate-slide-up opacity-0`} style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="flex justify-between items-center mb-6 border-b border-zinc-700 pb-4">
                <h3 className="font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    Attendance Trend
                </h3>
            </div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart key={`${animationKey}-area`} data={timelineData}>
                        <defs>
                            <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dx={-10} unit="%" fontFamily="monospace" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" animationDuration={1500} animationEasing="ease-out" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Assignment Breakdown Stacked Bar */}
         <div className={`bg-zinc-800 border-2 border-zinc-700 shadow-brutal ${s.p} flex flex-col hover:border-white transition-all duration-300 group animate-slide-up opacity-0`} style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <div className="flex justify-between items-center mb-6 border-b border-zinc-700 pb-4">
                <h3 className="font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                    Assignment Breakdown
                </h3>
            </div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart key={`${animationKey}-bar`} data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dx={-10} fontFamily="monospace" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontFamily: 'monospace' }} />
                        <Bar dataKey="Complete" stackId="a" fill={COLORS.success} animationDuration={1200} animationEasing="ease-out" />
                        <Bar dataKey="Partial" stackId="a" fill={COLORS.warning} animationDuration={1200} animationEasing="ease-out" />
                        <Bar dataKey="Missing" stackId="a" fill={COLORS.primary} animationDuration={1200} animationEasing="ease-out" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Secondary Charts & Leaderboards */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 ${s.gap}`}>
          
          {/* Assignment Distribution Pie */}
          <div className={`bg-zinc-800 border-2 border-zinc-700 shadow-brutal ${s.p} flex flex-col hover:border-white transition-all duration-300 group animate-slide-up opacity-0`} style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
             <h3 className="font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2 border-b border-zinc-700 pb-2">
                <Target className="w-5 h-5 text-primary-500 group-hover:rotate-45 transition-transform" />
                Assignment Status Dist.
             </h3>
             <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={`${animationKey}-pie`}>
                        <Pie
                            data={verseDistData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            animationDuration={1000}
                            animationEasing="ease-out"
                        >
                            {verseDistData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="square" formatter={(val) => <span className="text-zinc-400 font-mono text-xs uppercase">{val}</span>} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                     <span className="text-3xl font-black text-white">{overviewStats.totalVersesRecorded}</span>
                     <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Recs</span>
                </div>
             </div>
          </div>

          {/* Top Attendance Leaderboard */}
          <div className={`bg-zinc-800 border-2 border-zinc-700 shadow-brutal ${s.p} flex flex-col hover:border-white transition-all duration-300 animate-slide-up opacity-0`} style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
             <h3 className="font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2 border-b border-zinc-700 pb-2">
                <Trophy className="w-5 h-5 text-green-500" />
                Top Attendance
             </h3>
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {topAttendance.length > 0 ? topAttendance.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-700 hover:border-green-500 transition-colors group cursor-default hover:translate-x-1 animate-slide-up opacity-0" style={{ animationDelay: `${400 + (idx * 50)}ms`, animationFillMode: 'forwards' }}>
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center text-xs font-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-zinc-700 text-white'}`}>
                                {idx + 1}
                            </div>
                            <span className="text-sm font-bold text-white uppercase truncate max-w-[120px] group-hover:text-green-500 transition-colors">{s.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm font-black text-green-500">{s.attendanceRate}%</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{s.present} Sessions</span>
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-zinc-500 py-8 font-mono text-sm border-2 border-dashed border-zinc-700">NO DATA</div>
                )}
             </div>
          </div>

          {/* Top Assignments Leaderboard - ENHANCED */}
          <div className={`bg-zinc-800 border-2 border-zinc-700 shadow-brutal ${s.p} flex flex-col hover:border-white transition-all duration-300 animate-slide-up opacity-0`} style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
             <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
                <h3 className="font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <Medal className="w-5 h-5 text-purple-500" />
                    Leaders
                </h3>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setAssignmentSort('score')} 
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border-2 transition-all active:scale-95 ${assignmentSort === 'score' ? 'bg-purple-500 text-white border-purple-500' : 'text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'}`}
                        title="Combined Score"
                    >
                        ALL
                    </button>
                    <button 
                        onClick={() => setAssignmentSort('completed')} 
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border-2 transition-all active:scale-95 ${assignmentSort === 'completed' ? 'bg-green-600 text-white border-green-600' : 'text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'}`}
                        title="Sort by Completed"
                    >
                        CMP
                    </button>
                    <button 
                        onClick={() => setAssignmentSort('partial')} 
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border-2 transition-all active:scale-95 ${assignmentSort === 'partial' ? 'bg-blue-600 text-white border-blue-600' : 'text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'}`}
                        title="Sort by Partial"
                    >
                        PRT
                    </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {topVerses.length > 0 ? topVerses.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-700 hover:border-purple-500 transition-colors group cursor-default hover:translate-x-1 animate-slide-up opacity-0" style={{ animationDelay: `${450 + (idx * 50)}ms`, animationFillMode: 'forwards' }}>
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 flex items-center justify-center text-xs font-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-zinc-700 text-white'}`}>
                                {idx + 1}
                            </div>
                            <span className="text-sm font-bold text-white uppercase truncate max-w-[90px] group-hover:text-purple-500 transition-colors">{s.name}</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            {assignmentSort === 'score' && (
                                <>
                                    <div className="flex gap-2 text-[10px] font-mono uppercase leading-none mb-1">
                                        <span className="text-green-500 font-bold">{s.fluent} CMP</span>
                                        <span className="text-zinc-600">/</span>
                                        <span className="text-blue-500 font-bold">{s.attempted} PRT</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono">Score: {s.verseScore}</span>
                                </>
                            )}
                            {assignmentSort === 'completed' && (
                                <>
                                    <span className="block text-sm font-black text-green-500">{s.fluent}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Completed</span>
                                </>
                            )}
                            {assignmentSort === 'partial' && (
                                <>
                                    <span className="block text-sm font-black text-blue-500">{s.attempted}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Partial</span>
                                </>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-zinc-500 py-8 font-mono text-sm border-2 border-dashed border-zinc-700">NO DATA</div>
                )}
             </div>
          </div>
      </div>

      {/* Class Comparison (Only Visible on ALL) */}
      {selectedClass === 'ALL' && classComparisonData.length > 0 && (
          <div className={`bg-zinc-800 border-2 border-zinc-700 shadow-brutal ${s.p} hover:border-white transition-all duration-300 group animate-slide-up opacity-0`} style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
             <h3 className="font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2 border-b border-zinc-700 pb-4">
                <Award className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                Class Comparison
             </h3>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart key={`${animationKey}-compare`} data={classComparisonData} barSize={density === 'spacious' ? 60 : 40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} fontFamily="monospace" />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} dx={-10} unit="%" fontFamily="monospace" />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#27272a'}} />
                        <Legend iconType="square" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontFamily: 'monospace' }} />
                        <Bar dataKey="attendance" name="Attendance %" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
                        <Bar dataKey="verseSuccess" name="Assignment %" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
      )}
    </div>
  );
};
