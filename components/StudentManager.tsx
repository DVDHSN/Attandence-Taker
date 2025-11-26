import React, { useState } from 'react';
import { Student, ClassSession } from '../types';
import { Button } from './Button';
import { Trash2, UserPlus, Users, Search, FolderPlus, Edit2, Check, X, ChevronDown, ChevronUp, Phone, FileText, User, PieChart, GraduationCap } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  classes: string[];
  onUpdateClasses: (classes: string[]) => void;
  sessions: ClassSession[];
}

export const StudentManager: React.FC<StudentManagerProps> = ({ students, onUpdateStudents, classes, onUpdateClasses, sessions }) => {
  const [newName, setNewName] = useState('');
  const [newGuardian, setNewGuardian] = useState('');
  const [newGuardianContact, setNewGuardianContact] = useState('');
  const [newClass, setNewClass] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkClassId, setBulkClassId] = useState('');

  // Class Management State
  const [isClassMgrOpen, setIsClassMgrOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // Class Modal State
  const [viewingClass, setViewingClass] = useState<string | null>(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editClassName, setEditClassName] = useState('');

  // Student Modal State
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState<Student | null>(null);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate student counts per class
  const studentCounts = students.reduce((acc, student) => {
    if (student.className) {
      acc[student.className] = (acc[student.className] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // --- Student Actions ---

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      guardian: newGuardian.trim() || undefined,
      guardianContact: newGuardianContact.trim() || undefined,
      className: newClass || undefined,
    };

    onUpdateStudents([...students, newStudent]);
    setNewName('');
    setNewGuardian('');
    setNewGuardianContact('');
    setNewClass('');
  };

  const handleRemoveStudent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure? This will remove the student from future lists.')) {
      onUpdateStudents(students.filter(s => s.id !== id));
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
      if (viewingStudent?.id === id) {
        setViewingStudent(null);
      }
    }
  };

  // --- Modal Actions (Student) ---

  const handleStudentClick = (student: Student) => {
    setViewingStudent(student);
    setIsEditingDetails(false);
    setEditFormData(null);
  };

  const handleStartEdit = () => {
    if (viewingStudent) {
      setEditFormData({ ...viewingStudent });
      setIsEditingDetails(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDetails(false);
    setEditFormData(null);
  };

  const handleSaveEdit = () => {
    if (!editFormData || !viewingStudent) return;
    
    if (!editFormData.name.trim()) {
        alert("Student name is required");
        return;
    }

    const updatedStudent: Student = {
        ...editFormData,
        name: editFormData.name.trim(),
        guardian: editFormData.guardian?.trim() || undefined,
        guardianContact: editFormData.guardianContact?.trim() || undefined,
        notes: editFormData.notes?.trim() || undefined,
        className: editFormData.className || undefined
    };

    // Update master list
    const updatedStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    onUpdateStudents(updatedStudents);

    // Update view
    setViewingStudent(updatedStudent);
    setIsEditingDetails(false);
  };

  // --- Bulk Actions ---

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    // Check if all *currently visible* students are selected
    const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));

    const newSelected = new Set(selectedIds);
    
    if (allVisibleSelected) {
      // Deselect visible
      filteredStudents.forEach(s => newSelected.delete(s.id));
    } else {
      // Select visible
      filteredStudents.forEach(s => newSelected.add(s.id));
    }
    
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} students?`)) {
      onUpdateStudents(students.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
    }
  };

  const handleBulkAssignClass = () => {
    if (!bulkClassId) return;
    
    const updatedStudents = students.map(s => {
      if (selectedIds.has(s.id)) {
        return { ...s, className: bulkClassId };
      }
      return s;
    });

    onUpdateStudents(updatedStudents);
    setBulkClassId('');
    // Optional: clear selection after action
    // setSelectedIds(new Set()); 
  };

  // --- Class Management Actions ---

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    if (classes.includes(trimmed)) {
        alert('Class already exists');
        return;
    }
    onUpdateClasses([...classes, trimmed].sort());
    setNewClassName('');
  };

  const handleClassClick = (className: string) => {
    setViewingClass(className);
    setIsEditingClass(false);
    setEditClassName('');
  };

  const handleStartEditClass = () => {
    if (viewingClass) {
        setEditClassName(viewingClass);
        setIsEditingClass(true);
    }
  };

  const handleSaveClassEdit = () => {
    if (!viewingClass) return;
    const trimmed = editClassName.trim();
    
    if (!trimmed) {
        alert("Class name cannot be empty");
        return;
    }

    if (trimmed !== viewingClass && classes.includes(trimmed)) {
        alert('A class with this name already exists.');
        return;
    }

    // Update list
    const updatedClasses = classes.map(g => g === viewingClass ? trimmed : g).sort();
    onUpdateClasses(updatedClasses);

    // Update students
    const updatedStudents = students.map(s => {
        if (s.className === viewingClass) {
            return { ...s, className: trimmed };
        }
        return s;
    });
    onUpdateStudents(updatedStudents);

    setViewingClass(trimmed);
    setIsEditingClass(false);
  };

  const handleDeleteClass = (className: string) => {
    const count = studentCounts[className] || 0;
    const confirmMessage = count > 0 
        ? `Delete class "${className}"? This will remove the class assignment from ${count} student(s).`
        : `Delete class "${className}"?`;

    if (confirm(confirmMessage)) {
        // Remove from list
        onUpdateClasses(classes.filter(g => g !== className));

        // Clear from students
        const updatedStudents = students.map(s => {
            if (s.className === className) {
                return { ...s, className: undefined };
            }
            return s;
        });
        onUpdateStudents(updatedStudents);
        
        if (viewingClass === className) {
            setViewingClass(null);
        }
    }
  };
  
  // Calculate stats for viewed student
  const getStudentStats = (studentId: string) => {
    let present = 0;
    let absent = 0;
    
    sessions.forEach(session => {
        const record = session.records.find(r => r.studentId === studentId);
        if (record) {
            if (record.status === 'present') present++;
            else absent++;
        }
    });
    
    const total = present + absent;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { present, absent, total, percentage };
  };

  // Calculate stats for viewed class
  const getClassStats = (className: string) => {
      const classStudents = students.filter(s => s.className === className);
      const studentIds = new Set(classStudents.map(s => s.id));
      
      let present = 0;
      let absent = 0;

      sessions.forEach(session => {
          session.records.forEach(record => {
              if (studentIds.has(record.studentId)) {
                  if (record.status === 'present') present++;
                  else absent++;
              }
          });
      });

      const total = present + absent;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return { present, absent, total, percentage, studentCount: classStudents.length, students: classStudents };
  };


  return (
    <div className="space-y-6">
      
      {/* Top Section: Add Student & Manage Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Add Student Form */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            Add New Student
            </h3>
            <form onSubmit={handleAddStudent} className="space-y-4 flex-1">
                <div>
                    <input
                    type="text"
                    placeholder="Student Name *"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <select
                        value={newClass}
                        onChange={(e) => setNewClass(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                    >
                        <option value="">No Class</option>
                        {classes.map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <input
                        type="text"
                        placeholder="Guardian Name"
                        value={newGuardian}
                        onChange={(e) => setNewGuardian(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div>
                         <input
                        type="text"
                        placeholder="Guardian Contact"
                        value={newGuardianContact}
                        onChange={(e) => setNewGuardianContact(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="pt-2 mt-auto">
                    <Button type="submit" disabled={!newName.trim()} className="w-full">
                    Add Student
                    </Button>
                </div>
            </form>
        </div>

        {/* Class Management */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg flex flex-col overflow-hidden">
             <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setIsClassMgrOpen(!isClassMgrOpen)}
             >
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-purple-400" />
                    Manage Classes
                </h3>
                <button className="text-gray-400">
                    {isClassMgrOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
             </div>
             
             {isClassMgrOpen && (
                 <div className="px-6 pb-6 border-t border-gray-700 animate-in slide-in-from-top-2 duration-200">
                     <form onSubmit={handleCreateClass} className="flex gap-2 mb-4 pt-4">
                        <input 
                            type="text" 
                            placeholder="New Class Name" 
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <Button type="submit" disabled={!newClassName.trim()} size="sm">Create</Button>
                     </form>
                     
                     <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {classes.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No classes created yet.</p>}
                        {classes.map(className => {
                            const count = studentCounts[className] || 0;
                            return (
                                <div 
                                    key={className} 
                                    onClick={() => handleClassClick(className)}
                                    className="flex items-center justify-between p-2 rounded border border-gray-700/50 bg-gray-900/50 hover:bg-gray-800 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        <span className="text-gray-200 text-sm font-medium truncate" title={className}>
                                            {className}
                                        </span>
                                        {count > 0 && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700" title={`${count} students in this class`}>
                                                <Users className="w-3 h-3 mr-1" />
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-gray-500">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                 </div>
             )}
        </div>
      </div>

      {/* Roster List */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        {/* Header / Search / Bulk Actions Toolbar */}
        <div className="flex flex-col">
            {/* Top Bar: Title & Search */}
            <div className="px-6 py-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 whitespace-nowrap">
                    <Users className="w-5 h-5 text-gray-400" />
                    Class Roster ({students.length})
                </h3>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search name or class..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Action Bar: Bulk Actions OR Select All */}
            <div className="px-6 py-3 bg-gray-750/30 border-b border-gray-700 min-h-[50px] flex items-center">
                {selectedIds.size > 0 ? (
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-3">
                             <span className="text-white font-medium whitespace-nowrap text-sm">{selectedIds.size} Selected</span>
                             <button 
                                onClick={() => setSelectedIds(new Set())}
                                className="text-xs text-gray-400 hover:text-white underline"
                             >
                                Clear
                             </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                             <select
                                value={bulkClassId}
                                onChange={(e) => setBulkClassId(e.target.value)}
                                className="bg-gray-900 border border-gray-600 text-xs rounded px-2 py-1.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-32 h-8"
                            >
                                <option value="">Select Class...</option>
                                {classes.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <Button size="sm" onClick={handleBulkAssignClass} disabled={!bulkClassId} className="text-xs py-1 px-2 h-8">
                                Set Class
                            </Button>
                            <div className="w-px h-5 bg-gray-600 mx-1 hidden sm:block"></div>
                            <Button size="sm" variant="danger" onClick={handleBulkDelete} className="text-xs py-1 px-2 h-8">
                                Delete
                            </Button>
                        </div>
                     </div>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                         <input
                            id="select-all"
                            type="checkbox"
                            checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id))}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700 cursor-pointer transition-colors"
                         />
                         <label 
                            htmlFor="select-all" 
                            className="text-sm text-gray-400 cursor-pointer select-none hover:text-gray-300"
                         >
                            Select All {searchTerm && '(Visible)'}
                         </label>
                    </div>
                )}
            </div>
        </div>

        <ul className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              {students.length === 0 ? "No students in the roster yet. Add one above!" : "No students match your search."}
            </li>
          ) : (
            filteredStudents.map(student => {
              const isSelected = selectedIds.has(student.id);
              return (
                <li 
                    key={student.id} 
                    className={`
                        px-6 py-4 flex items-center justify-between transition-colors group
                        ${isSelected ? 'bg-indigo-900/20 hover:bg-indigo-900/30' : 'hover:bg-gray-750'}
                    `}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(student.id)}
                      className="w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700 cursor-pointer"
                    />
                    <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleStudentClick(student)}
                    >
                      <div className="flex items-center gap-2">
                          <p className={`font-medium hover:text-indigo-400 transition-colors ${isSelected ? 'text-indigo-200' : 'text-white'}`}>
                            {student.name}
                          </p>
                          {student.className && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300 border border-gray-600">
                                {student.className}
                            </span>
                          )}
                      </div>
                      {(student.guardian || student.guardianContact) && (
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            {student.guardian && (
                                <span>Guardian: {student.guardian}</span>
                            )}
                            {student.guardianContact && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-gray-500" />
                                    {student.guardianContact}
                                </span>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleRemoveStudent(student.id, e)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remove Student"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Class Details Modal */}
      {viewingClass && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setViewingClass(null)}>
              <div 
                  className="bg-gray-800 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
                  onClick={e => e.stopPropagation()}
              >
                  {(() => {
                      const stats = getClassStats(viewingClass);
                      return (
                          <>
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {isEditingClass ? <Edit2 className="w-5 h-5 text-indigo-400"/> : <GraduationCap className="w-6 h-6 text-purple-400"/>}
                                    {isEditingClass ? 'Edit Class' : viewingClass}
                                </h3>
                                <button onClick={() => setViewingClass(null)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto space-y-6">
                                {isEditingClass ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Class Name</label>
                                        <input
                                            type="text"
                                            value={editClassName}
                                            onChange={(e) => setEditClassName(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            autoFocus
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Renaming will update the class for all {stats.studentCount} student(s) in this class.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Class Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-750/50 rounded-lg p-3 border border-gray-700 flex flex-col items-center justify-center text-center">
                                                 <Users className="w-5 h-5 text-indigo-400 mb-1" />
                                                 <span className="text-2xl font-bold text-white">{stats.studentCount}</span>
                                                 <span className="text-xs text-gray-400">Students Enrolled</span>
                                            </div>
                                            <div className="bg-gray-750/50 rounded-lg p-3 border border-gray-700 flex flex-col items-center justify-center text-center">
                                                 <PieChart className="w-5 h-5 text-green-400 mb-1" />
                                                 <span className="text-2xl font-bold text-white">{stats.percentage}%</span>
                                                 <span className="text-xs text-gray-400">Avg. Attendance</span>
                                            </div>
                                        </div>

                                        {/* Student List */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 text-gray-400">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm font-medium uppercase">Students in {viewingClass}</span>
                                            </div>
                                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                                                {stats.students.length > 0 ? (
                                                    <ul className="divide-y divide-gray-800">
                                                        {stats.students.map(s => (
                                                            <li key={s.id} className="px-3 py-2 text-sm text-gray-300 flex justify-between">
                                                                <span>{s.name}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="p-4 text-center text-sm text-gray-500 italic">No students assigned to this class yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/30 flex justify-end gap-3">
                                {isEditingClass ? (
                                    <>
                                        <Button variant="ghost" onClick={() => setIsEditingClass(false)}>Cancel</Button>
                                        <Button onClick={handleSaveClassEdit}>
                                            <Check className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="secondary" onClick={() => handleDeleteClass(viewingClass)} className="mr-auto text-red-400 hover:text-white hover:bg-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Class
                                        </Button>
                                        <Button onClick={handleStartEditClass}>
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Rename
                                        </Button>
                                    </>
                                )}
                            </div>
                          </>
                      );
                  })()}
              </div>
           </div>
      )}

      {/* Student Detail/Edit Modal */}
      {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setViewingStudent(null)}>
              <div 
                  className="bg-gray-800 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
                  onClick={e => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {isEditingDetails ? <Edit2 className="w-5 h-5 text-indigo-400"/> : <User className="w-5 h-5 text-indigo-400"/>}
                          {isEditingDetails ? 'Edit Student' : 'Student Details'}
                      </h3>
                      <button onClick={() => setViewingStudent(null)} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 overflow-y-auto">
                     {isEditingDetails && editFormData ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Class</label>
                                <select
                                    value={editFormData.className || ''}
                                    onChange={(e) => setEditFormData({...editFormData, className: e.target.value || undefined})}
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                                >
                                    <option value="">No Class</option>
                                    {classes.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Guardian Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.guardian || ''}
                                        onChange={(e) => setEditFormData({...editFormData, guardian: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Guardian Contact</label>
                                    <input
                                        type="text"
                                        value={editFormData.guardianContact || ''}
                                        onChange={(e) => setEditFormData({...editFormData, guardianContact: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
                                <textarea
                                    rows={4}
                                    value={editFormData.notes || ''}
                                    onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                    placeholder="Medical needs, learning preferences, etc."
                                />
                            </div>
                        </div>
                     ) : (
                         <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{viewingStudent.name}</h2>
                                    {viewingStudent.className ? (
                                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-sm font-medium bg-indigo-900 text-indigo-200 border border-indigo-700">
                                            {viewingStudent.className}
                                        </span>
                                    ) : (
                                        <span className="inline-block mt-2 text-sm text-gray-500 italic">No Class Assigned</span>
                                    )}
                                </div>
                            </div>

                            {/* Attendance Stats Card */}
                            {(() => {
                                const stats = getStudentStats(viewingStudent.id);
                                return (
                                    <div className="bg-gray-750/50 rounded-lg p-4 border border-gray-700">
                                        <div className="flex items-center gap-2 mb-3">
                                            <PieChart className="w-4 h-4 text-indigo-400" />
                                            <span className="text-xs text-gray-400 uppercase font-semibold">Attendance Overview</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2
                                                    ${stats.percentage >= 80 ? 'border-green-500 text-green-400' : 
                                                      stats.percentage >= 50 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'}
                                                `}>
                                                    {stats.percentage}%
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-300 font-medium">Attendance Rate</span>
                                                    <span className="text-xs text-gray-500">Based on {stats.total} sessions</span>
                                                </div>
                                            </div>
                                            <div className="h-8 w-px bg-gray-700 hidden sm:block"></div>
                                            <div className="text-sm hidden sm:block">
                                                <div className="text-green-400"><span className="font-bold">{stats.present}</span> Present</div>
                                                <div className="text-red-400"><span className="font-bold">{stats.absent}</span> Absent</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="bg-gray-750/50 rounded-lg p-4 space-y-3 border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Guardian</p>
                                        <p className="text-gray-200">{viewingStudent.guardian || 'Not recorded'}</p>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-gray-700/50"></div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Contact</p>
                                        <p className="text-gray-200">{viewingStudent.guardianContact || 'Not recorded'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2 text-gray-400">
                                    <FileText className="w-4 h-4" />
                                    <span className="text-sm font-medium uppercase">Notes</span>
                                </div>
                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-gray-300 text-sm min-h-[80px]">
                                    {viewingStudent.notes ? (
                                        <p className="whitespace-pre-wrap">{viewingStudent.notes}</p>
                                    ) : (
                                        <p className="text-gray-600 italic">No notes available.</p>
                                    )}
                                </div>
                            </div>
                         </div>
                     )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/30 flex justify-end gap-3">
                     {isEditingDetails ? (
                         <>
                            <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                            <Button onClick={handleSaveEdit}>
                                <Check className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                         </>
                     ) : (
                         <>
                            <Button variant="secondary" onClick={() => handleRemoveStudent(viewingStudent.id)} className="mr-auto text-red-400 hover:text-white hover:bg-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Student
                            </Button>
                            <Button onClick={handleStartEdit}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                         </>
                     )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};