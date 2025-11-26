import React, { useState } from 'react';
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
  Cell
} from 'recharts';
import { FileDown, TrendingUp, Users, CalendarDays, Download, Edit } from 'lucide-react';

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
  // Sort sessions by date ascending for the chart
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Derive available months from sessions (descending order for the dropdown)
  const availableMonths = Array.from(new Set(sortedSessions.map(s => s.date.substring(0, 7))))
    .sort((a, b) => b.localeCompare(a));

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const sessionsToDisplay = selectedMonth === 'all' 
    ? sortedSessions 
    : sortedSessions.filter(s => s.date.startsWith(selectedMonth));

  const chartData = sessionsToDisplay.map(s => ({
      // dd/mm format for chart
      date: new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
      present: s.records.filter(r => r.status === 'present').length,
      absent: s.records.filter(r => r.status === 'absent').length,
    }));

  const downloadChart = () => {
    const chartContainer = document.querySelector('.recharts-wrapper');
    if (!chartContainer) return;
    
    const svg = chartContainer.querySelector('svg');
    if (!svg) return;

    // Serialize SVG
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Get actual dimensions
    const width = svg.clientWidth || 600;
    const height = svg.clientHeight || 300;
    
    canvas.width = width;
    canvas.height = height;

    img.onload = () => {
        if(ctx) {
            // Fill background with dark theme color
            ctx.fillStyle = '#1f2937'; 
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

    // Encode SVG data to be used as image source
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
  };

  const formatMonthLabel = (monthStr: string) => {
    const [y, m] = monthStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalStudents}</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <CalendarDays className="w-5 h-5" />
            <span className="text-sm font-medium">Total Sessions</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalSessions}</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Avg. Attendance</span>
          </div>
          <p className="text-2xl font-bold text-white">{averageAttendance}</p>
        </div>
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <div className={`w-5 h-5 rounded-full border-2 ${attendancePercentage >= 80 ? 'border-green-500' : 'border-yellow-500'}`} />
            <span className="text-sm font-medium">Attendance Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{attendancePercentage}%</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
          
          {/* Chart */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-white">Attendance Trends</h3>
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
                    >
                        <option value="all">All Time</option>
                        {availableMonths.map(month => (
                          <option key={month} value={month}>{formatMonthLabel(month)}</option>
                        ))}
                    </select>
                    {sessions.length > 0 && (
                        <Button size="sm" variant="ghost" onClick={downloadChart} title="Download Chart">
                            <Download className="w-4 h-4 text-gray-400 hover:text-white" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="h-64 w-full">
              {sessions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30}>
                       {
                          chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.present > 0 ? '#6366f1' : '#374151'} />
                          ))
                        }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No data to display yet.
                </div>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
              <Button size="sm" variant="secondary" onClick={() => exportToCSV(sessions, students)}>
                <FileDown className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <ul className="divide-y divide-gray-700">
                {sessions.slice().reverse().map(session => {
                  const presentCount = session.records.filter(r => r.status === 'present').length;
                  return (
                    <li key={session.id} className="px-6 py-4 hover:bg-gray-750 transition-colors group">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white">
                            {new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-400">{session.topic || 'No topic recorded'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200">
                            {presentCount} / {students.length} Present
                          </span>
                          <button 
                            onClick={() => onEditSession(session)}
                            className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-700 rounded transition-colors"
                            title="Edit Session"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {sessions.length === 0 && (
                  <li className="px-6 py-8 text-center text-gray-500">
                    No history found.
                  </li>
                )}
              </ul>
            </div>
          </div>
      </div>
    </div>
  );
};