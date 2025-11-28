import React, { useState, useMemo } from 'react';
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
import { FileDown, TrendingUp, Users, CalendarDays, Download, Edit, ArrowUpRight, Cake, User, ChevronDown } from 'lucide-react';

interface DashboardProps {
  sessions: ClassSession[];
  students: Student[];
  onEditSession: (session: ClassSession) => void;
}

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
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const availableMonths = Array.from(new Set(sortedSessions.map(s => s.date.substring(0, 7))))
    .sort((a, b) => b.localeCompare(a));

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [chartView, setChartView] = useState<'present' | 'absent' | 'both'>('present');
  
  const sessionsToDisplay = selectedMonth === 'all' 
    ? sortedSessions 
    : sortedSessions.filter(s => s.date.startsWith(selectedMonth));

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

  const downloadChart = () => {
    const chartContainer = document.querySelector('.recharts-wrapper');
    if (!chartContainer) return;
    
    const svg = chartContainer.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const width = svg.clientWidth || 600;
    const height = svg.clientHeight || 300;
    
    canvas.width = width;
    canvas.height = height;

    img.onload = () => {
        if(ctx) {
            ctx.fillStyle = '#18181b'; // Dark background for exported image
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            
            try {
                const pngUrl = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `attendance_chart_${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            } catch (e) {
                console.error("Download failed", e);
            }
        }
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
  };

  const formatMonthLabel = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-soft flex items-start justify-between group hover:border-gray-500 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 cursor-default">
          <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1 transition-colors group-hover:text-gray-400">{label}</p>
              <h3 className="text-3xl font-bold text-gray-100 group-hover:text-white transition-colors">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20 group-hover:scale-110 group-hover:bg-opacity-30 transition-all duration-300`}>
              <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Students" value={totalStudents} icon={Users} colorClass="bg-blue-500" />
        <StatCard label="Total Sessions" value={totalSessions} icon={CalendarDays} colorClass="bg-purple-500" />
        <StatCard label="Avg. Attendance" value={averageAttendance} icon={TrendingUp} colorClass="bg-orange-500" />
        <StatCard label="Attendance Rate" value={`${attendancePercentage}%`} icon={ArrowUpRight} colorClass="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-soft h-[450px] lg:h-auto flex flex-col hover:border-gray-600 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-100">Attendance Trends</h3>
                    <p className="text-sm text-gray-400">Overview of student presence over time</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* View Selector */}
                    <div className="relative group">
                        <select 
                            value={chartView}
                            onChange={(e) => setChartView(e.target.value as any)}
                            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-primary-900 focus:border-primary-500 block pl-3 pr-8 py-2 outline-none appearance-none font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <option value="present">Present Only</option>
                            <option value="absent">Absent Only</option>
                            <option value="both">Combined</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
                    </div>

                    {/* Month Selector */}
                    <div className="relative group">
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-primary-900 focus:border-primary-500 block pl-3 pr-8 py-2 outline-none appearance-none font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            {availableMonths.map(month => (
                            <option key={month} value={month}>{formatMonthLabel(month)}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
                    </div>
                    {sessions.length > 0 && (
                        <button onClick={downloadChart} className="p-2 text-gray-500 hover:text-white transition-all rounded-lg hover:bg-gray-700 active:scale-95">
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={40}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#52525b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{fill: '#27272a', opacity: 0.5}}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontWeight: 600 }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle"/>
                    
                    {(chartView === 'present' || chartView === 'both') && (
                        <Bar 
                            dataKey="present" 
                            name="Present"
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]}
                            animationDuration={1500}
                        />
                    )}
                    {(chartView === 'absent' || chartView === 'both') && (
                        <Bar 
                            dataKey="absent" 
                            name="Absent"
                            fill="#ef4444" 
                            radius={[4, 4, 0, 0]}
                            animationDuration={1500}
                        />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  No attendance data available yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 flex flex-col">
             {/* Birthday Card */}
             <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-soft p-6 flex flex-col hover:border-gray-600 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <Cake className="w-5 h-5 text-primary-500 animate-pulse-slow" />
                        Birthdays
                    </h3>
                    <div className="relative group">
                        <select
                            value={selectedBirthdayMonth}
                            onChange={(e) => setSelectedBirthdayMonth(parseInt(e.target.value))}
                            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg focus:ring-primary-900 focus:border-primary-500 block pl-2 pr-7 py-1.5 outline-none appearance-none font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
                    </div>
                </div>

                {birthdays.length > 0 ? (
                    <div className="overflow-y-auto max-h-[200px] custom-scrollbar pr-2">
                        <ul className="space-y-3">
                            {birthdays.map((s, idx) => (
                                <li key={s.id} 
                                    className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-gray-700/50 hover:border-primary-500/30 hover:bg-gray-800 transition-all duration-200"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-700">
                                         {s.photo ? (
                                            <img src={s.photo} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" alt="" />
                                         ) : (
                                            <User className="w-5 h-5 text-gray-500" />
                                         )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-200 font-medium text-sm truncate">{s.name}</p>
                                        <p className="text-xs text-gray-500">Turning {s.turningAge}</p>
                                    </div>
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex-shrink-0 shadow-inner-light">
                                         <span className="text-primary-400 font-bold text-sm">{s.day}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-700/50 rounded-xl">
                        <Cake className="w-8 h-8 text-gray-700 mb-2 opacity-50" />
                        No birthdays in {months[selectedBirthdayMonth]}.
                    </div>
                )}
             </div>

             {/* History List */}
             <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-soft overflow-hidden flex flex-col flex-1 h-[400px] hover:border-gray-600 transition-colors duration-300">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                  <h3 className="text-lg font-bold text-gray-100">Recent Sessions</h3>
                  <Button size="sm" variant="ghost" onClick={() => exportToCSV(sessions, students)} className="text-gray-400 hover:text-white">
                    <FileDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <ul className="divide-y divide-gray-700">
                    {sessions.slice().reverse().map((session, idx) => {
                      const presentCount = session.records.filter(r => r.status === 'present').length;
                      const dateObj = new Date(session.date);
                      return (
                        <li key={session.id} 
                            className="p-5 hover:bg-gray-700/30 transition-all duration-200 group cursor-default hover:pl-6"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-900 flex flex-col items-center justify-center border border-gray-700 group-hover:border-primary-500/30 transition-colors">
                                  <span className="text-xs font-bold text-gray-500 uppercase group-hover:text-primary-400 transition-colors">{dateObj.toLocaleDateString('en-US', {month: 'short'})}</span>
                                  <span className="text-sm font-bold text-gray-200">{dateObj.getDate()}</span>
                              </div>
                              <div>
                                  <p className="font-semibold text-gray-200 text-sm group-hover:text-white transition-colors">{session.topic || 'Regular Session'}</p>
                                  <p className="text-xs text-gray-500">{dateObj.toLocaleDateString('en-US', {weekday: 'long'})}</p>
                              </div>
                            </div>
                            <button 
                                onClick={() => onEditSession(session)}
                                className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-primary-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                              >
                                <Edit className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="pl-[52px]">
                              <div className="w-full bg-gray-900 rounded-full h-1.5 mb-1.5 overflow-hidden">
                                  <div 
                                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${(presentCount / Math.max(students.length, 1)) * 100}%` }}
                                  ></div>
                              </div>
                              <div className="flex justify-between text-xs">
                                  <span className="text-gray-400 font-medium">{presentCount} attended</span>
                                  <span className="text-gray-500">Total {students.length}</span>
                              </div>
                          </div>
                        </li>
                      );
                    })}
                    {sessions.length === 0 && (
                      <li className="p-8 text-center text-gray-500 text-sm">
                        No history found.
                      </li>
                    )}
                  </ul>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};