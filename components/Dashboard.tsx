
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ClassSession, Student } from '../types';
import { Button } from './Button';
import { exportToCSV } from '../services/storageService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FileDown, TrendingUp, Users, CalendarDays, ArrowUpRight, Cake, User, ChevronDown, Filter, CheckSquare, Square, X, Edit, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  sessions: ClassSession[];
  students: Student[];
  onEditSession: (session: ClassSession) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border-2 border-white p-3 shadow-brutal min-w-[150px] animate-fade-in">
        <p className="text-white font-mono text-xs font-bold mb-2 uppercase border-b border-zinc-700 pb-1">{label}</p>
        <div className="space-y-1">
            {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center justify-between text-xs font-mono uppercase">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ backgroundColor: entry.fill }} />
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

export const Dashboard: React.FC<DashboardProps> = ({ sessions, students, onEditSession }) => {
  // Statistics
  const totalSessions = sessions.length;
  const totalStudents = students.length;
  const totalAttendance = sessions.reduce((acc, s) => {
    return acc + s.records.filter(r => r.status === 'present').length;
  }, 0);
  const averageAttendance = totalSessions > 0 ? (totalAttendance / totalSessions).toFixed(1) : '0';
  const attendancePercentage = totalSessions > 0 && totalStudents > 0
    ? Math.round((totalAttendance / (totalSessions * totalStudents)) * 100)
    : 0;

  // Chart Data Preparation
  const sortedSessions = useMemo(() => 
    [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [sessions]);

  const availableMonths = useMemo(() => {
    return Array.from(new Set(sortedSessions.map(s => s.date.substring(0, 7))))
      .sort((a, b) => b.localeCompare(a));
  }, [sortedSessions]);

  // Filter State: null means "All Selected", array means specific subset
  const [selectedMonths, setSelectedMonths] = useState<string[] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const [chartView, setChartView] = useState<'present' | 'absent' | 'both'>('present');

  // Edit Confirmation State
  const [sessionToEdit, setSessionToEdit] = useState<ClassSession | null>(null);

  // Handle click outside to close filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const sessionsToDisplay = useMemo(() => {
    if (selectedMonths === null) return sortedSessions;
    return sortedSessions.filter(s => selectedMonths.includes(s.date.substring(0, 7)));
  }, [sortedSessions, selectedMonths]);

  const chartData = sessionsToDisplay.map(s => ({
      date: new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      present: s.records.filter(r => r.status === 'present').length,
      absent: s.records.filter(r => r.status === 'absent').length,
  }));

  // Birthday Logic
  const [selectedBirthdayMonth, setSelectedBirthdayMonth] = useState<number>(new Date().getMonth());
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const birthdays = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return students.filter(s => {
        if (!s.birthday) return false;
        const dob = new Date(s.birthday);
        return dob.getMonth() === selectedBirthdayMonth;
    }).map(s => {
        const dob = new Date(s.birthday!);
        const day = dob.getDate();
        const turningAge = currentYear - dob.getFullYear();
        return { ...s, day, turningAge };
    }).sort((a, b) => a.day - b.day);
  }, [students, selectedBirthdayMonth]);

  const formatMonthLabel = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  const handleMonthToggle = (month: string) => {
    if (selectedMonths === null) {
        // Switching from "All" to "Custom" (unchecking one means selecting all others)
        setSelectedMonths(availableMonths.filter(m => m !== month));
    } else {
        if (selectedMonths.includes(month)) {
            setSelectedMonths(selectedMonths.filter(m => m !== month));
        } else {
            setSelectedMonths([...selectedMonths, month]);
        }
    }
  };

  const isMonthSelected = (month: string) => {
      return selectedMonths === null || selectedMonths.includes(month);
  };

  const handleEditClick = (session: ClassSession) => {
      setSessionToEdit(session);
  };

  const confirmEdit = () => {
      if (sessionToEdit) {
          onEditSession(sessionToEdit);
          setSessionToEdit(null);
      }
  };

  const StatCard = ({ label, value, icon: Icon, colorClass, delay }: any) => (
      <div 
        style={{ animationDelay: delay }}
        className="bg-zinc-800 p-6 border-2 border-zinc-700 shadow-brutal flex items-start justify-between group hover:border-white hover:bg-white hover:text-black transition-all duration-300 ease-out hover:-translate-y-2 hover:rotate-1 hover:shadow-brutal-lg cursor-default animate-fade-in-up"
      >
          <div>
              <p className="text-zinc-500 font-mono text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 group-hover:text-black">{label}</p>
              <h3 className="text-4xl font-black text-white group-hover:text-black transition-colors duration-300">{value}</h3>
          </div>
          <div className={`p-2 border-2 border-transparent group-hover:border-black transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12`}>
              <Icon className={`w-8 h-8 ${colorClass.replace('bg-', 'text-')} group-hover:text-black transition-colors duration-300`} />
          </div>
      </div>
  );

  return (
    <div className="space-y-12">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard label="Students" value={totalStudents} icon={Users} colorClass="text-blue-500" delay="0ms" />
        <StatCard label="Sessions" value={totalSessions} icon={CalendarDays} colorClass="text-purple-500" delay="100ms" />
        <StatCard label="Avg. Attnd" value={averageAttendance} icon={TrendingUp} colorClass="text-orange-500" delay="200ms" />
        <StatCard label="Rate" value={`${attendancePercentage}%`} icon={ArrowUpRight} colorClass="text-green-500" delay="300ms" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-zinc-900 p-8 border-2 border-zinc-700 shadow-brutal flex flex-col hover:border-white transition-all duration-300 hover:shadow-brutal-lg relative z-20 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4 border-b-2 border-zinc-800 pb-4">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Trends</h3>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {/* View Selector */}
                    <div className="relative group">
                        <select 
                            value={chartView}
                            onChange={(e) => setChartView(e.target.value as any)}
                            className="bg-zinc-800 border-2 border-zinc-700 text-white text-xs font-mono uppercase tracking-wide rounded-none pl-4 pr-10 py-2 focus:border-primary-500 outline-none appearance-none cursor-pointer hover:bg-zinc-700 transition-colors duration-200 group-hover:border-white"
                        >
                            <option value="present">Present Only</option>
                            <option value="absent">Absent Only</option>
                            <option value="both">Combined</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:text-white transition-colors" />
                    </div>

                    {/* Multi-Month Selector */}
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 bg-zinc-800 border-2 ${isFilterOpen ? 'border-primary-500' : 'border-zinc-700'} text-white text-xs font-mono uppercase tracking-wide px-4 py-2 hover:bg-zinc-700 hover:border-white transition-colors duration-200 active:scale-95`}
                        >
                            <Filter className="w-3 h-3" />
                            <span>
                                {selectedMonths === null 
                                    ? "ALL MONTHS" 
                                    : `${selectedMonths.length} SELECTED`
                                }
                            </span>
                            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border-4 border-primary-500 shadow-brutal z-50 animate-zoom-in origin-top-right">
                                <div className="p-3 border-b-2 border-zinc-800 flex gap-2">
                                    <button 
                                        onClick={() => setSelectedMonths(null)}
                                        className="flex-1 bg-zinc-800 text-xs text-white py-1 hover:bg-primary-600 hover:font-bold border border-transparent hover:border-black transition-colors uppercase font-mono active:scale-95"
                                    >
                                        Select All
                                    </button>
                                    <button 
                                        onClick={() => setSelectedMonths([])}
                                        className="flex-1 bg-zinc-800 text-xs text-zinc-400 py-1 hover:bg-red-900 hover:text-white border border-transparent hover:border-red-500 transition-colors uppercase font-mono active:scale-95"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {availableMonths.map(month => {
                                        const isSelected = isMonthSelected(month);
                                        return (
                                            <div 
                                                key={month} 
                                                onClick={() => handleMonthToggle(month)}
                                                className="flex items-center gap-3 p-2 hover:bg-zinc-800 cursor-pointer group select-none transition-colors"
                                            >
                                                <div className={`w-4 h-4 border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-primary-600 border-primary-600 scale-100' : 'border-zinc-600 group-hover:border-white scale-90'}`}>
                                                    {isSelected && <CheckSquare className="w-3 h-3 text-white animate-pop" />}
                                                </div>
                                                <span className={`text-xs font-mono uppercase transition-all duration-200 ${isSelected ? 'text-white translate-x-1' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                                    {formatMonthLabel(month)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {availableMonths.length === 0 && (
                                        <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                                            NO DATA
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 w-full min-h-[350px]">
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={24}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      fontFamily="monospace"
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-10}
                      fontFamily="monospace"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#27272a'}} />
                    <Legend verticalAlign="top" height={36} iconType="square"/>
                    
                    {(chartView === 'present' || chartView === 'both') && (
                        <Bar 
                            dataKey="present" 
                            name="Present"
                            fill="#10b981" 
                            radius={[0, 0, 0, 0]}
                            animationDuration={1500}
                        />
                    )}
                    {(chartView === 'absent' || chartView === 'both') && (
                        <Bar 
                            dataKey="absent" 
                            name="Absent"
                            fill="#ef4444" 
                            radius={[0, 0, 0, 0]}
                            animationDuration={1500}
                        />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 font-mono text-sm border-2 border-dashed border-zinc-800 animate-pulse">
                  NO_DATA_AVAILABLE
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 flex flex-col z-10">
             {/* Birthday Card */}
             <div className="bg-zinc-800 border-2 border-zinc-700 shadow-brutal p-6 flex flex-col hover:border-white transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="flex items-center justify-between mb-6 border-b-2 border-zinc-700 pb-4">
                     <h3 className="text-lg font-black text-white uppercase flex items-center gap-3">
                        <Cake className="w-5 h-5 text-primary-500 animate-pulse-slow" />
                        Birthdays
                    </h3>
                    <div className="relative group">
                        <select
                            value={selectedBirthdayMonth}
                            onChange={(e) => setSelectedBirthdayMonth(parseInt(e.target.value))}
                            className="bg-zinc-900 border-2 border-zinc-600 text-white text-xs font-mono rounded-none focus:border-primary-500 block pl-2 pr-7 py-1 outline-none appearance-none cursor-pointer transition-colors group-hover:border-white"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none group-hover:translate-y-0 transition-transform" />
                    </div>
                </div>

                {birthdays.length > 0 ? (
                    <div className="overflow-y-auto max-h-[250px] custom-scrollbar pr-2">
                        <ul className="space-y-4">
                            {birthdays.map((s, idx) => (
                                <li key={s.id} 
                                    className="flex items-center gap-4 bg-zinc-900 p-3 border-2 border-zinc-800 hover:border-primary-500 transition-all duration-200 hover:translate-x-2 group cursor-default animate-slide-in"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center flex-shrink-0 border-2 border-zinc-700 group-hover:border-primary-500 transition-colors">
                                         {s.photo ? (
                                            <img src={s.photo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                                         ) : (
                                            <User className="w-5 h-5 text-zinc-500 group-hover:text-white" />
                                         )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate uppercase group-hover:text-primary-500 transition-colors">{s.name}</p>
                                        <p className="text-xs text-zinc-500 font-mono">Turning {s.turningAge}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-primary-600 flex items-center justify-center border-2 border-white shadow-[2px_2px_0px_0px_#fff] group-hover:scale-110 group-hover:rotate-12 transition-transform">
                                         <span className="text-white font-black text-sm">{s.day}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-600 font-mono text-sm border-2 border-dashed border-zinc-700">
                        NO_BIRTHDAYS
                    </div>
                )}
             </div>

             {/* History List */}
             <div className="bg-zinc-800 border-2 border-zinc-700 shadow-brutal flex flex-col flex-1 max-h-[500px] hover:border-white transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <div className="p-6 border-b-2 border-zinc-700 flex justify-between items-center bg-zinc-800">
                  <h3 className="text-lg font-black text-white uppercase">History</h3>
                  <Button size="sm" variant="outline" onClick={() => exportToCSV(sessions, students)}>
                    <FileDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <ul className="divide-y-2 divide-zinc-700">
                    {sessions.slice().reverse().map((session, idx) => {
                      const presentCount = session.records.filter(r => r.status === 'present').length;
                      const dateObj = new Date(session.date);
                      return (
                        <li key={session.id} 
                            className="p-4 hover:bg-zinc-700/50 transition-all duration-300 group cursor-pointer hover:pl-6"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-zinc-900 flex flex-col items-center justify-center border-2 border-zinc-600 transition-colors group-hover:border-primary-500 group-hover:bg-zinc-800">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{dateObj.toLocaleDateString('en-US', {month: 'short'})}</span>
                                  <span className="text-lg font-black text-white">{dateObj.getDate()}</span>
                              </div>
                              <div>
                                  <p className="font-bold text-white text-sm uppercase group-hover:underline decoration-2 underline-offset-2 decoration-primary-500 transition-all">{session.topic || 'Regular Session'}</p>
                                  <p className="text-xs text-zinc-500 font-mono">{dateObj.toLocaleDateString('en-US', {weekday: 'long'})}</p>
                              </div>
                            </div>
                            <button 
                                onClick={() => handleEditClick(session)}
                                className="text-zinc-500 hover:text-white transition-colors hover:scale-110 active:scale-95"
                              >
                                <Edit className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="pl-[64px]">
                              <div className="w-full bg-zinc-900 h-2 border border-zinc-700 mb-2">
                                  <div 
                                    className="bg-primary-600 h-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${(presentCount / Math.max(students.length, 1)) * 100}%` }}
                                  ></div>
                              </div>
                              <div className="flex justify-between text-xs font-mono uppercase text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                  <span>{presentCount} Present</span>
                                  <span>Total {students.length}</span>
                              </div>
                          </div>
                        </li>
                      );
                    })}
                    {sessions.length === 0 && (
                      <li className="p-8 text-center text-zinc-500 font-mono text-sm">
                        LOG_EMPTY
                      </li>
                    )}
                  </ul>
                </div>
             </div>
          </div>
      </div>

      {/* Edit Confirmation Modal */}
      {sessionToEdit && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in"
            onClick={() => setSessionToEdit(null)}
        >
            <div 
                className="bg-zinc-900 w-full max-w-sm border-4 border-primary-600 shadow-brutal p-6 animate-zoom-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-primary-600 border-2 border-black animate-pulse-slow">
                        <AlertTriangle className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase leading-none mb-2">Edit Record?</h3>
                        <p className="text-zinc-400 text-xs font-mono leading-relaxed">
                            Modifying historical data will alter calculated statistics. This action is tracked in system logs.
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-4 justify-end mt-6">
                    <Button variant="ghost" size="sm" onClick={() => setSessionToEdit(null)} className="flex-1">CANCEL</Button>
                    <Button variant="primary" size="sm" onClick={confirmEdit} className="flex-1">PROCEED</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
