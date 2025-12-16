
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ClassSession, Student, Density } from '../types';
import { Button } from './Button';
import { exportToCSV } from '../services/storageService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import { FileDown, TrendingUp, Users, CalendarDays, Cake, User, ChevronDown, Filter, CheckSquare, Edit, ScrollText, Star, Activity, Sparkles } from 'lucide-react';

interface DashboardProps {
  sessions: ClassSession[];
  students: Student[];
  classes: string[];
  onEditSession: (session: ClassSession) => void;
  density: Density;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border-2 border-white p-3 shadow-brutal min-w-[150px] animate-scale-in z-50">
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

export const Dashboard: React.FC<DashboardProps> = ({ sessions, students, onEditSession, density }) => {
  
  const s = useMemo(() => {
    switch (density) {
        case 'compact':
            return {
                gap: 'gap-2',
                space: 'space-y-2',
                p: 'p-3',
                headerP: 'p-2',
                cardH: 'h-20',
                statVal: 'text-2xl',
                gridGap: 'gap-2',
                iconSize: 'w-5 h-5'
            };
        case 'spacious':
            return {
                gap: 'gap-8',
                space: 'space-y-8',
                p: 'p-8',
                headerP: 'p-6',
                cardH: 'h-32',
                statVal: 'text-5xl',
                gridGap: 'gap-8',
                iconSize: 'w-8 h-8'
            };
        default:
            return {
                gap: 'gap-4',
                space: 'space-y-4',
                p: 'p-5',
                headerP: 'p-4',
                cardH: 'h-24',
                statVal: 'text-3xl',
                gridGap: 'gap-4',
                iconSize: 'w-6 h-6'
            };
    }
  }, [density]);

  // Global Statistics Calculation
  const totalSessions = sessions.length;
  const totalStudents = students.length;

  const totalAttendance = sessions.reduce((acc, session) => {
    return acc + session.records.filter(r => r.status === 'present').length;
  }, 0);

  // Memory Verse Stats (now Assignment Stats)
  const verseStats = useMemo(() => {
    let totalVerses = 0;
    let fluentCount = 0;
    let attemptedCount = 0;
    
    sessions.forEach(session => {
        session.records.forEach(r => {
            if (r.memoryVerseStatus === 'fluent') {
                fluentCount++;
                totalVerses++;
            } else if (r.memoryVerseStatus === 'attempted') {
                attemptedCount++;
                totalVerses++;
            } else if (r.memoryVerseStatus === 'failed') {
                totalVerses++;
            }
        });
    });
    
    const rate = totalVerses > 0 ? Math.round((fluentCount / totalVerses) * 100) : 0;
    return { rate, fluentCount, attemptedCount, totalVerses };
  }, [sessions]);

  // Average attendance per session
  const averageAttendance = totalSessions > 0 ? (totalAttendance / totalSessions).toFixed(1) : '0';

  // Chart Data Preparation
  const sortedSessions = useMemo(() => 
    [...sessions]
        .filter(session => session.date) // Ensure date exists
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [sessions]);

  const availableMonths = useMemo(() => {
    return Array.from<string>(new Set(sortedSessions.map(session => session.date.substring(0, 7))))
      .sort((a, b) => b.localeCompare(a));
  }, [sortedSessions]);

  const [selectedMonths, setSelectedMonths] = useState<string[] | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const [chartView, setChartView] = useState<'present' | 'absent' | 'both'>('present');
  const [sessionToEdit, setSessionToEdit] = useState<ClassSession | null>(null);

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
    return sortedSessions.filter(session => selectedMonths.includes(session.date.substring(0, 7)));
  }, [sortedSessions, selectedMonths]);

  const chartData = sessionsToDisplay.map(session => {
      const present = session.records.filter(r => r.status === 'present').length;
      const absent = session.records.filter(r => r.status === 'absent').length;
      return {
        date: new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        present,
        absent,
      };
  });

  // Chart Key for Animation Trigger
  const chartKey = useMemo(() => {
    return `chart-${chartView}-${selectedMonths ? selectedMonths.join('-') : 'all'}-${chartData.length}`;
  }, [chartView, selectedMonths, chartData.length]);

  // Birthday Logic
  const [selectedBirthdayMonth, setSelectedBirthdayMonth] = useState<number>(new Date().getMonth());
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const birthdays = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return students.filter(student => {
        if (!student.birthday) return false;
        const dob = new Date(student.birthday);
        return dob.getMonth() === selectedBirthdayMonth;
    }).map(student => {
        const dob = new Date(student.birthday!);
        const day = dob.getDate();
        const turningAge = currentYear - dob.getFullYear();
        return { ...student, day, turningAge };
    }).sort((a, b) => a.day - b.day);
  }, [students, selectedBirthdayMonth]);

  const formatMonthLabel = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  const handleMonthToggle = (month: string) => {
    if (selectedMonths === null) {
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

  const StatCard = ({ label, value, icon: Icon, colorClass, gradient, delay }: any) => (
      <div 
        className={`relative overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow-brutal flex items-center justify-between group hover:border-white transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-brutal-lg cursor-default ${s.cardH} ${s.p} animate-slide-up opacity-0`}
        style={{ animationDelay: delay, animationFillMode: 'forwards' }}
      >
          {/* Subtle gradient background */}
          <div className={`absolute top-0 right-0 w-24 h-full bg-gradient-to-l ${gradient} opacity-10 transform skew-x-12 translate-x-4 group-hover:translate-x-0 transition-transform duration-500`} />
          
          <div className="z-10">
              <p className="text-zinc-500 font-mono text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300 group-hover:text-black">{label}</p>
              <h3 className={`${s.statVal} font-black text-white group-hover:text-black transition-colors duration-300 group-hover:animate-shake`}>{value}</h3>
          </div>
          <div className={`z-10 p-2 border-2 border-transparent group-hover:border-black transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-6 bg-zinc-900/50 group-hover:bg-transparent rounded-none`}>
              <Icon className={`${s.iconSize} ${colorClass.replace('bg-', 'text-')} group-hover:text-black transition-colors duration-300`} />
          </div>
      </div>
  );

  return (
    <div className={`${s.space} flex flex-col md:h-[calc(100vh-160px)]`}>
      
      {/* Top Stats Row */}
      <div className={`flex-none grid grid-cols-2 lg:grid-cols-4 ${s.gridGap}`}>
        <StatCard 
            label="Total Personnel" 
            value={totalStudents} 
            icon={Users} 
            colorClass="text-blue-500" 
            gradient="from-blue-500 to-transparent"
            delay="0ms"
        />
        <StatCard 
            label="Sessions Logged" 
            value={totalSessions} 
            icon={CalendarDays} 
            colorClass="text-purple-500" 
            gradient="from-purple-500 to-transparent"
            delay="50ms"
        />
        <StatCard 
            label="Avg. Attendance" 
            value={averageAttendance} 
            icon={Activity} 
            colorClass="text-green-500" 
            gradient="from-green-500 to-transparent"
            delay="100ms"
        />
        <StatCard 
            label="Assignment Avg" 
            value={`${verseStats.rate}%`} 
            icon={Sparkles} 
            colorClass="text-yellow-500" 
            gradient="from-yellow-500 to-transparent"
            delay="150ms"
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 ${s.gridGap} pb-1`}>
          
          {/* Left Col: Trends Chart */}
          <div className="lg:col-span-2 bg-zinc-800 border-2 border-zinc-700 shadow-brutal flex flex-col hover:border-white transition-all duration-300 hover:shadow-brutal-lg relative z-20 overflow-hidden h-96 lg:h-auto group animate-slide-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            
            {/* Chart Header */}
            <div className={`flex-none ${s.headerP} border-b-2 border-zinc-700 flex justify-between items-center gap-4 bg-zinc-800/50 backdrop-blur-sm`}>
                <div className="flex items-center gap-2">
                    <div className="bg-zinc-700 p-1.5 border border-zinc-600 group-hover:border-white group-hover:bg-white transition-colors">
                        <TrendingUp className="w-4 h-4 text-white group-hover:text-black" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-primary-500 transition-colors">Attendance Trends</h3>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex bg-zinc-900 border border-zinc-600 p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <button 
                            onClick={() => setChartView('present')}
                            className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${chartView === 'present' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Pres
                        </button>
                        <div className="w-px bg-zinc-700 mx-0.5"></div>
                        <button 
                            onClick={() => setChartView('absent')}
                            className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${chartView === 'absent' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Abs
                        </button>
                        <div className="w-px bg-zinc-700 mx-0.5"></div>
                        <button 
                            onClick={() => setChartView('both')}
                            className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${chartView === 'both' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            All
                        </button>
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative" ref={filterRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 bg-zinc-900 border ${isFilterOpen ? 'border-primary-500 text-white' : 'border-zinc-600 text-zinc-400'} hover:border-white hover:text-white text-[10px] font-mono uppercase tracking-wide px-3 py-1.5 transition-colors duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]`}
                        >
                            <Filter className="w-3 h-3" />
                            <span>Filter</span>
                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border-4 border-primary-500 shadow-brutal z-50 animate-slam origin-top-right">
                                <div className="p-2 border-b-2 border-zinc-800 flex gap-2">
                                    <button 
                                        onClick={() => setSelectedMonths(null)}
                                        className="flex-1 bg-zinc-800 text-[10px] text-white py-1 hover:bg-primary-600 border border-transparent hover:border-black uppercase font-mono transition-colors"
                                    >
                                        Reset
                                    </button>
                                    <button 
                                        onClick={() => setSelectedMonths([])}
                                        className="flex-1 bg-zinc-800 text-[10px] text-zinc-400 py-1 hover:bg-red-900 hover:text-white border border-transparent hover:border-red-500 uppercase font-mono transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                    {availableMonths.map(month => {
                                        const isSelected = isMonthSelected(month);
                                        return (
                                            <div 
                                                key={month} 
                                                onClick={() => handleMonthToggle(month)}
                                                className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 cursor-pointer group select-none transition-colors"
                                            >
                                                <div className={`w-3 h-3 border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-primary-600 border-primary-600 scale-100' : 'border-zinc-600 group-hover:border-white scale-90'}`}>
                                                    {isSelected && <CheckSquare className="w-2 h-2 text-white" />}
                                                </div>
                                                <span className={`text-[10px] font-mono uppercase transition-all duration-200 ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                                                    {formatMonthLabel(month)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className={`flex-1 w-full min-h-0 ${s.p}`}>
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart key={chartKey} data={chartData} barSize={density === 'spacious' ? 40 : 20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      fontFamily="monospace"
                    />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-10}
                      fontFamily="monospace"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#27272a', opacity: 0.5}} />
                    <Legend verticalAlign="top" height={36} iconType="square" wrapperStyle={{fontSize: '10px'}}/>
                    
                    {(chartView === 'present' || chartView === 'both') && (
                        <Bar dataKey="present" name="Present" fill="#10b981" radius={[2, 2, 0, 0]} animationDuration={1000} animationEasing="ease-out" />
                    )}
                    {(chartView === 'absent' || chartView === 'both') && (
                        <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[2, 2, 0, 0]} animationDuration={1000} animationEasing="ease-out" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-sm border-2 border-dashed border-zinc-700/50 m-4 bg-zinc-900/50">
                  <Activity className="w-8 h-8 mb-2 opacity-50" />
                  NO_DATA_AVAILABLE
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Stacked Birthdays & History */}
          <div className={`flex flex-col ${s.gap} h-full min-h-0`}>
             
             {/* Birthday Card */}
             <div className={`flex-none bg-zinc-800 border-2 border-zinc-700 shadow-brutal ${s.p} flex flex-col hover:border-white transition-all duration-300 max-h-[40%] group hover:-translate-y-1 hover:shadow-brutal-lg animate-slide-up opacity-0`} style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
                <div className="flex-none flex items-center justify-between mb-3 border-b border-zinc-700 pb-2">
                     <h3 className="text-sm font-black text-white uppercase flex items-center gap-2 group-hover:text-primary-500 transition-colors">
                        <Cake className="w-4 h-4 text-primary-500 group-hover:animate-bounce" />
                        Birthdays
                    </h3>
                    <div className="relative group/select">
                        <select
                            value={selectedBirthdayMonth}
                            onChange={(e) => setSelectedBirthdayMonth(parseInt(e.target.value))}
                            className="bg-zinc-900 border border-zinc-600 text-white text-[10px] font-mono rounded-none focus:border-primary-500 block pl-2 pr-6 py-0.5 outline-none appearance-none cursor-pointer transition-colors group-hover/select:border-white uppercase"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none group-hover/select:translate-y-0 transition-transform" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                    {birthdays.length > 0 ? (
                        <ul className="space-y-2">
                            {birthdays.map((student, idx) => (
                                <li key={student.id} 
                                    className="flex items-center gap-3 bg-zinc-900 p-2 border border-zinc-800 hover:border-primary-500 transition-all duration-200 hover:translate-x-1 group/item cursor-default animate-fade-in-up opacity-0"
                                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                                >
                                    <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700 group-hover/item:border-primary-500 transition-colors">
                                         {student.photo ? (
                                            <img src={student.photo} className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-500" alt="" />
                                         ) : (
                                            <User className="w-4 h-4 text-zinc-500 group-hover/item:text-white" />
                                         )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-xs truncate uppercase group-hover/item:text-primary-500 transition-colors">{student.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono">Turning {student.turningAge}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-primary-600 flex items-center justify-center border border-white shadow-[2px_2px_0px_0px_#fff]">
                                         <span className="text-white font-black text-xs">{student.day}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-xs border border-dashed border-zinc-700 bg-zinc-900/50">
                            NO BIRTHDAYS
                        </div>
                    )}
                </div>
             </div>

             {/* History List */}
             <div className="flex-1 bg-zinc-800 border-2 border-zinc-700 shadow-brutal flex flex-col hover:border-white transition-all duration-300 min-h-0 group hover:-translate-y-1 hover:shadow-brutal-lg animate-slide-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <div className={`flex-none ${s.headerP} border-b border-zinc-700 flex justify-between items-center bg-zinc-800`}>
                  <h3 className="text-sm font-black text-white uppercase group-hover:text-primary-500 transition-colors">History</h3>
                  <Button size="sm" variant="outline" onClick={() => exportToCSV(sessions, students)} className="px-2 py-1 hover:bg-white hover:text-black">
                    <FileDown className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <ul className="divide-y divide-zinc-700">
                    {sessions.slice().reverse().map((session, idx) => {
                      const presentCount = session.records.filter(r => r.status === 'present').length;
                      const sessionTotal = session.records.length;
                      
                      const dateObj = new Date(session.date);
                      return (
                        <li key={session.id} 
                            className={`${density === 'compact' ? 'p-2' : 'p-3'} hover:bg-zinc-700/50 transition-all duration-200 group/item cursor-pointer animate-slide-up opacity-0`}
                            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-zinc-900 flex flex-col items-center justify-center border border-zinc-600 transition-colors group-hover/item:border-primary-500 group-hover/item:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover/item:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover/item:-translate-y-0.5">
                                  <span className="text-[8px] font-bold text-zinc-400 uppercase">{dateObj.toLocaleDateString('en-US', {month: 'short'})}</span>
                                  <span className="text-sm font-black text-white">{dateObj.getDate()}</span>
                              </div>
                              <div className="min-w-0">
                                  <p className="font-bold text-white text-xs uppercase truncate max-w-[120px] group-hover/item:text-primary-500 transition-colors">{session.topic || 'Regular Session'}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                                    {dateObj.toLocaleDateString('en-US', {weekday: 'short'})}
                                    {session.memoryVerse && (
                                        <span className="flex items-center gap-1 text-yellow-500/80 truncate max-w-[80px]">
                                            <ScrollText className="w-3 h-3" />
                                            {session.memoryVerse}
                                        </span>
                                    )}
                                  </p>
                              </div>
                            </div>
                            <button 
                                onClick={() => handleEditClick(session)}
                                className="text-zinc-500 hover:text-white transition-colors hover:scale-110 active:scale-95"
                              >
                                <Edit className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="pl-[52px]">
                              <div className="w-full bg-zinc-900 h-1.5 border border-zinc-700 mb-1">
                                  <div 
                                    className="bg-primary-600 h-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${sessionTotal > 0 ? (presentCount / sessionTotal) * 100 : 0}%` }}
                                  ></div>
                              </div>
                              <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-400">
                                  <span>{presentCount} / {sessionTotal} PRS</span>
                              </div>
                          </div>
                        </li>
                      );
                    })}
                    {sessions.length === 0 && (
                      <li className="p-8 text-center text-zinc-500 font-mono text-xs">
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
                className="bg-zinc-900 w-full max-w-sm border-4 border-primary-600 shadow-brutal p-6 animate-slam"
                onClick={e => e.stopPropagation()}
            >
               <h3 className="text-xl font-black text-white uppercase mb-2">Edit Record?</h3>
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
