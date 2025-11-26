import React, { useState } from 'react';
import { Student } from '../types';
import { Button } from './Button';
import { Trash2, UserPlus, Users, Search, FolderPlus, Edit2, Check, X, ChevronDown, ChevronUp, Phone } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  classes: string[];
  onUpdateClasses: (classes: string[]) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ students, onUpdateStudents, classes, onUpdateClasses }) => {
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
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editClassValue, setEditClassValue] = useState('');

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

  const handleRemoveStudent = (id: string) => {
    if (confirm('Are you sure? This will remove the student from future lists.')) {
      onUpdateStudents(students.filter(s => s.id !== id));
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
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

  const startEditingClass = (className: string) => {
    setEditingClass(className);
    setEditClassValue(className);
  };

  const handleRenameClass = () => {
    if (!editingClass) return;
    const trimmed = editClassValue.trim();
    
    if (!trimmed) {
        setEditingClass(null);
        return;
    }

    if (trimmed !== editingClass && classes.includes(trimmed)) {
        alert('A class with this name already exists.');
        return;
    }

    // Update list
    const updatedClasses = classes.map(g => g === editingClass ? trimmed : g).sort();
    onUpdateClasses(updatedClasses);

    // Update students
    const updatedStudents = students.map(s => {
        if (s.className === editingClass) {
            return { ...s, className: trimmed };
        }
        return s;
    });
    onUpdateStudents(updatedStudents);

    setEditingClass(null);
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
    }
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
                            const isEditing = editingClass === className;
                            const count = studentCounts[className] || 0;
                            
                            return (
                                <div 
                                    key={className} 
                                    className={`flex items-center justify-between p-2 rounded border transition-colors ${
                                        isEditing 
                                            ? 'bg-indigo-900/30 border-indigo-500/50 shadow-sm' 
                                            : 'bg-gray-900/50 border-gray-700/50 hover:bg-gray-800/50'
                                    }`}
                                >
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 flex-1 mr-2 animate-in fade-in duration-200">
                                            <input 
                                                type="text" 
                                                value={editClassValue}
                                                onChange={(e) => setEditClassValue(e.target.value)}
                                                className="flex-1 bg-gray-900 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-400 outline-none"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameClass();
                                                    if (e.key === 'Escape') setEditingClass(null);
                                                }}
                                            />
                                            <button 
                                                onClick={handleRenameClass} 
                                                className="text-green-400 hover:bg-green-400/10 p-1 rounded transition-colors"
                                                title="Save"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setEditingClass(null)} 
                                                className="text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors"
                                                title="Cancel"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
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
                                    )}
                                    
                                    {!isEditing && (
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => startEditingClass(className)}
                                                className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded transition-colors"
                                                title="Rename Class"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClass(className)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                                                title={count > 0 ? "Delete (Affects Students)" : "Delete Class"}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
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
                        px-6 py-4 flex items-center justify-between transition-colors
                        ${isSelected ? 'bg-indigo-900/20 hover:bg-indigo-900/30' : 'hover:bg-gray-750'}
                    `}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(student.id)}
                      className="w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                          <p className={`font-medium ${isSelected ? 'text-indigo-200' : 'text-white'}`}>
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
                    onClick={() => handleRemoveStudent(student.id)}
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
    </div>
  );
};