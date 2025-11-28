import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, ClassSession, ClassConfig } from '../types';
import { Button } from './Button';
import { Trash2, UserPlus, Users, Search, FolderPlus, Edit2, Check, X, ChevronDown, ChevronUp, Phone, FileText, User, PieChart, GraduationCap, Cake, Camera, Upload, Sparkles, AlertTriangle, FileUp, Download, MapPin, Trophy, TrendingDown } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  classes: string[];
  onUpdateClasses: (classes: string[]) => void;
  classConfigs: Record<string, ClassConfig>;
  onUpdateClassConfigs: (configs: Record<string, ClassConfig>) => void;
  sessions: ClassSession[];
  onUpdateSessions: (sessions: ClassSession[]) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ 
    students, 
    onUpdateStudents, 
    classes, 
    onUpdateClasses,
    classConfigs,
    onUpdateClassConfigs,
    sessions,
    onUpdateSessions
}) => {
  const [newName, setNewName] = useState('');
  const [newGuardian, setNewGuardian] = useState('');
  const [newGuardianContact, setNewGuardianContact] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);
  const [autoClass, setAutoClass] = useState(true);
  
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
  const [editClassMinAge, setEditClassMinAge] = useState<string>('');
  const [editClassMaxAge, setEditClassMaxAge] = useState<string>('');

  // Student Modal State
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState<Student | null>(null);

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const fileImportRef = useRef<HTMLInputElement>(null);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // Helper to calculate age
  const getAge = (birthday: string) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Image resize helper
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_SIZE = 150; // Avatar size
          let width = img.width;
          let height = img.height;

          // Square crop calculation
          let sx = 0, sy = 0, sWidth = width, sHeight = height;
          if (width > height) {
             sWidth = height;
             sx = (width - height) / 2;
          } else {
             sHeight = width;
             sy = (height - width) / 2;
          }

          canvas.width = MAX_SIZE;
          canvas.height = MAX_SIZE;
          
          // Draw square crop
          ctx?.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, MAX_SIZE, MAX_SIZE);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      const photoData = await processImage(e.target.files[0]);
      if (isEditMode && editFormData) {
        setEditFormData({ ...editFormData, photo: photoData });
      } else {
        setNewPhoto(photoData);
      }
    }
  };

  const closeConfirmation = () => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  // Auto-assign class based on age
  useEffect(() => {
    if (autoClass && newBirthday) {
        const age = getAge(newBirthday);
        if (age !== null) {
            const match = Object.entries(classConfigs).find(([_, config]) => {
                const c = config as ClassConfig;
                return age >= c.minAge && age <= c.maxAge;
            });
            if (match) {
                setNewClass(match[0]);
            }
        }
    }
  }, [newBirthday, classConfigs, autoClass]);

  // --- Bulk Import Logic ---

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') {
                setImportText(text);
            }
        };
        reader.readAsText(file);
    }
  };

  const parseImportDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const clean = dateStr.trim();
    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    // Check DD/MM/YYYY or DD-MM-YYYY
    const match = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (match) {
        const [_, d, m, y] = match;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return undefined;
  };

  const parsedImportData = useMemo(() => {
    if (!importText.trim()) return [];
    
    return importText.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
        // Skip header row if it contains "Name" and "Class" (common header check)
        if (index === 0 && line.toLowerCase().includes('name') && (line.toLowerCase().includes('class') || line.toLowerCase().includes('guardian'))) {
            return null;
        }

        // CSV Splitting (Handling quoted values roughly)
        // Regex splits by comma only if not followed by an odd number of quotes
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
        
        let student: Partial<Student> = {};

        if (parts.length > 1) {
            // Assume CSV Format: Name, Class, Guardian, Guardian Contact, Birthday, Address
            const [name, rawClass, guardian, contact, rawBirthday, address] = parts;
            if (!name) return null;
            
            const birthday = parseImportDate(rawBirthday);
            let className = rawClass || undefined;

            // Auto-assign class logic for bulk import if class is missing but birthday exists
            if (!className && birthday) {
              const age = getAge(birthday);
              if (age !== null) {
                  const match = Object.entries(classConfigs).find(([_, config]) => {
                      const c = config as ClassConfig;
                      return age >= c.minAge && age <= c.maxAge;
                  });
                  if (match) {
                      className = match[0];
                  }
              }
            }

            student = {
                name,
                className,
                guardian: guardian || undefined,
                guardianContact: contact || undefined,
                birthday,
                address: address || undefined,
            };
        } else {
            // Simple List Format (Name only)
            if (!line.trim()) return null;
            student = { name: line.trim() };
        }

        return {
            id: crypto.randomUUID(),
            ...student
        } as Student;
    }).filter((s): s is Student => s !== null);
  }, [importText, classConfigs]);

  const handleImportSubmit = () => {
    if (parsedImportData.length === 0) return;
    
    // Check for new classes to add
    const importedClasses = new Set(parsedImportData.map(s => s.className).filter(Boolean) as string[]);
    const newClasses = Array.from(importedClasses).filter(c => !classes.includes(c));
    
    if (newClasses.length > 0) {
        onUpdateClasses([...classes, ...newClasses].sort());
    }

    onUpdateStudents([...students, ...parsedImportData]);
    setIsImportModalOpen(false);
    setImportText('');
  };

  const downloadTemplate = () => {
      const headers = "Name,Class,Guardian,Guardian Contact,Birthday,Address,Notes";
      const example = "John Doe,,Jane Doe,555-0123,2015-05-20,123 Main St,Allergies to nuts";
      const content = `${headers}\n${example}`;
      const blob = new Blob([content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- Student Actions ---

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      guardian: newGuardian.trim() || undefined,
      guardianContact: newGuardianContact.trim() || undefined,
      address: newAddress.trim() || undefined,
      className: newClass || undefined,
      birthday: newBirthday || undefined,
      photo: newPhoto,
    };

    onUpdateStudents([...students, newStudent]);
    setNewName('');
    setNewGuardian('');
    setNewGuardianContact('');
    setNewAddress('');
    setNewClass('');
    setNewBirthday('');
    setNewPhoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveStudent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setConfirmation({
      isOpen: true,
      title: 'Delete Student',
      message: 'Are you sure? This will remove the student and all their attendance history. This cannot be undone.',
      onConfirm: () => {
        // Remove from students list
        onUpdateStudents(students.filter(s => s.id !== id));
        
        // Remove from all attendance records
        const updatedSessions = sessions.map(session => ({
            ...session,
            records: session.records.filter(r => r.studentId !== id)
        }));
        onUpdateSessions(updatedSessions);

        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
        if (viewingStudent?.id === id) {
          setViewingStudent(null);
        }
        closeConfirmation();
      }
    });
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
        address: editFormData.address?.trim() || undefined,
        notes: editFormData.notes?.trim() || undefined,
        className: editFormData.className || undefined,
        birthday: editFormData.birthday || undefined,
        photo: editFormData.photo,
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
    const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
    const newSelected = new Set(selectedIds);
    
    if (allVisibleSelected) {
      filteredStudents.forEach(s => newSelected.delete(s.id));
    } else {
      filteredStudents.forEach(s => newSelected.add(s.id));
    }
    
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Multiple Students',
      message: `Are you sure you want to delete ${selectedIds.size} students? This will remove them and all their attendance history.`,
      onConfirm: () => {
        // Remove from students list
        onUpdateStudents(students.filter(s => !selectedIds.has(s.id)));
        
        // Remove from all attendance records
        const updatedSessions = sessions.map(session => ({
            ...session,
            records: session.records.filter(r => !selectedIds.has(r.studentId))
        }));
        onUpdateSessions(updatedSessions);

        setSelectedIds(new Set());
        closeConfirmation();
      }
    });
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
    setEditClassMinAge('');
    setEditClassMaxAge('');
  };

  const handleStartEditClass = () => {
    if (viewingClass) {
        setEditClassName(viewingClass);
        const config = classConfigs[viewingClass];
        setEditClassMinAge(config ? String(config.minAge) : '');
        setEditClassMaxAge(config ? String(config.maxAge) : '');
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

    const updatedClasses = classes.map(g => g === viewingClass ? trimmed : g).sort();
    onUpdateClasses(updatedClasses);

    const newConfigs = { ...classConfigs };
    if (trimmed !== viewingClass) {
        delete newConfigs[viewingClass];
    }
    
    const min = parseInt(editClassMinAge);
    const max = parseInt(editClassMaxAge);

    if (!isNaN(min) && !isNaN(max)) {
        newConfigs[trimmed] = { minAge: min, maxAge: max };
    } else {
        delete newConfigs[trimmed];
    }
    onUpdateClassConfigs(newConfigs);

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
    const message = count > 0 
        ? `This will remove the class assignment from ${count} student(s).`
        : `Are you sure you want to delete the class "${className}"?`;

    setConfirmation({
      isOpen: true,
      title: `Delete Class "${className}"?`,
      message,
      onConfirm: () => {
        onUpdateClasses(classes.filter(g => g !== className));
        const newConfigs = { ...classConfigs };
        delete newConfigs[className];
        onUpdateClassConfigs(newConfigs);
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
        closeConfirmation();
      }
    });
  };
  
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
      const config = classConfigs[className];

      return { present, absent, total, percentage, studentCount: classStudents.length, students: classStudents, config };
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Top Section: Action Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Add Student Card */}
        <div className="xl:col-span-2 bg-gray-800 p-8 rounded-2xl shadow-soft border border-gray-700 transition-colors hover:border-gray-600">
            <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                  <div className="p-2 bg-primary-500/10 rounded-lg">
                    <UserPlus className="w-5 h-5 text-primary-500" />
                  </div>
                  Add New Student
                </h3>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setIsImportModalOpen(true)}
                    className="gap-2 active:scale-95"
                >
                    <FileUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Bulk Import</span>
                </Button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Photo Upload */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-24 h-24 rounded-full bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-all overflow-hidden relative group hover:scale-105"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {newPhoto ? (
                        <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-600 group-hover:text-primary-500 transition-colors" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-5 h-5 text-white animate-fade-in-up" />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e)}
                    />
                    <p className="text-xs text-center text-gray-500 mt-2">Optional Photo</p>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-gray-900 border-b-2 border-gray-700 text-gray-100 px-3 py-2 focus:border-primary-500 focus:outline-none transition-colors placeholder-gray-500 hover:border-gray-600"
                      />
                       <div className="flex gap-2">
                          <div className="relative w-full group">
                              <select
                                  value={newClass}
                                  onChange={(e) => setNewClass(e.target.value)}
                                  className="w-full bg-gray-900 border-b-2 border-gray-700 text-gray-100 px-3 py-2 pr-8 focus:border-primary-500 focus:outline-none appearance-none transition-colors cursor-pointer hover:border-gray-600"
                              >
                                  <option value="">Select Class...</option>
                                  {classes.map(g => (
                                      <option key={g} value={g}>{g}</option>
                                  ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-gray-300 transition-colors" />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setAutoClass(!autoClass)}
                            className={`p-2 rounded-lg border transition-all flex-shrink-0 active:scale-95 ${
                                autoClass 
                                ? 'bg-primary-500/10 border-primary-500/20 text-primary-400' 
                                : 'bg-gray-800 border-gray-700 text-gray-600 hover:text-gray-400'
                            }`}
                            title={autoClass ? "Auto-assignment active" : "Enable auto-assignment"}
                          >
                            <Sparkles className={`w-5 h-5 ${autoClass ? 'animate-pulse-slow' : ''}`} />
                          </button>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <input
                          type="date"
                          title="Birthday"
                          value={newBirthday}
                          onChange={(e) => setNewBirthday(e.target.value)}
                          className="w-full bg-gray-900 border-b-2 border-gray-700 text-gray-100 px-3 py-2 focus:border-primary-500 focus:outline-none text-gray-400 placeholder-gray-500 hover:border-gray-600"
                        />
                         <input
                          type="text"
                          placeholder="Guardian Name"
                          value={newGuardian}
                          onChange={(e) => setNewGuardian(e.target.value)}
                          className="w-full bg-gray-900 border-b-2 border-gray-700 text-gray-100 px-3 py-2 focus:border-primary-500 focus:outline-none placeholder-gray-500 hover:border-gray-600"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Guardian Contact Info"
                            value={newGuardianContact}
                            onChange={(e) => setNewGuardianContact(e.target.value)}
                            className="w-full bg-gray-900 border-b-2 border-gray-700 text-gray-100 px-3 py-2 focus:border-primary-500 focus:outline-none placeholder-gray-500 hover:border-gray-600"
                        />
                        <input
                            type="text"
                            placeholder="Address"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            className="w-full bg-gray-900 border-b-2 border-gray-700 text-gray-100 px-3 py-2 focus:border-primary-500 focus:outline-none placeholder-gray-500 hover:border-gray-600"
                        />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={!newName.trim()} className="w-full sm:w-auto active:scale-95">
                      Add to Roster
                    </Button>
                </div>
            </form>
        </div>

        {/* Class Management Card */}
        <div className="bg-gray-800 rounded-2xl shadow-soft border border-gray-700 flex flex-col overflow-hidden h-full hover:border-gray-600 transition-all duration-300">
             <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 transition-colors border-b border-gray-700"
                onClick={() => setIsClassMgrOpen(!isClassMgrOpen)}
             >
                <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg">
                      <FolderPlus className="w-5 h-5 text-primary-500" />
                    </div>
                    Classes
                </h3>
                <button className="text-gray-400">
                    {isClassMgrOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
             </div>
             
             <div className={`px-6 flex-1 flex flex-col transition-all duration-300 ${isClassMgrOpen ? 'pb-6 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
                 <form onSubmit={handleCreateClass} className="flex gap-2 pt-6 mb-4">
                    <input 
                        type="text" 
                        placeholder="New Class Name" 
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm placeholder-gray-500 hover:border-gray-600 transition-colors"
                    />
                    <Button type="submit" disabled={!newClassName.trim()} size="sm" variant="secondary" className="active:scale-95">Create</Button>
                 </form>
                 
                 <div className="overflow-y-auto pr-2 space-y-2 max-h-[250px] custom-scrollbar">
                    {classes.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No classes defined.</p>}
                    {classes.map(className => {
                        const count = studentCounts[className] || 0;
                        const config = classConfigs[className];
                        return (
                            <div 
                                key={className} 
                                onClick={() => handleClassClick(className)}
                                className="group flex items-center justify-between p-3 rounded-xl border border-gray-700 bg-gray-800 hover:border-primary-500/50 hover:shadow-sm hover:scale-[1.02] cursor-pointer transition-all duration-200"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-gray-300 text-sm font-medium truncate group-hover:text-primary-400 transition-colors">
                                        {className}
                                    </span>
                                    {config && (
                                        <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-700">
                                            {config.minAge}-{config.maxAge} yrs
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {count > 0 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-900 text-gray-400">
                                          {count}
                                      </span>
                                  )}
                                  <Edit2 className="w-3.5 h-3.5 text-gray-600 group-hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" />
                                </div>
                            </div>
                        );
                    })}
                 </div>
             </div>
        </div>
      </div>

      {/* Roster List */}
      <div className="bg-gray-800 rounded-2xl shadow-soft border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Student Roster <span className="text-gray-500 font-normal text-lg">({students.length})</span>
            </h3>
            <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search students..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-sm text-gray-100 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary-900 focus:border-primary-700 outline-none transition-all placeholder-gray-500 hover:bg-gray-800"
                />
            </div>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-3 bg-gray-900 border-b border-gray-700 flex items-center min-h-[52px]">
            {selectedIds.size > 0 ? (
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-3">
                         <span className="text-primary-400 font-medium text-sm bg-primary-900/30 px-3 py-1 rounded-full border border-primary-900 animate-pulse-soft">{selectedIds.size} selected</span>
                         <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-gray-500 hover:text-gray-300 underline decoration-gray-700 hover:decoration-gray-500 underline-offset-2 transition-colors"
                         >
                            Clear Selection
                         </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <select
                            value={bulkClassId}
                            onChange={(e) => setBulkClassId(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-xs rounded-lg px-3 py-2 text-gray-300 focus:ring-2 focus:ring-primary-900 outline-none shadow-sm cursor-pointer hover:bg-gray-700 transition-colors"
                        >
                            <option value="">Move to Class...</option>
                            {classes.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        <Button size="sm" onClick={handleBulkAssignClass} disabled={!bulkClassId} variant="secondary" className="active:scale-95">
                            Apply
                        </Button>
                        <div className="w-px h-6 bg-gray-700 mx-1"></div>
                        <Button size="sm" variant="danger" onClick={handleBulkDelete} className="active:scale-95">
                            Delete
                        </Button>
                    </div>
                 </div>
            ) : (
                <div className="flex items-center gap-3 w-full pl-1">
                     <div className="flex items-center justify-center w-5 h-5">
                       <input
                          id="select-all"
                          type="checkbox"
                          checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id))}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-900 cursor-pointer"
                       />
                     </div>
                     <label 
                        htmlFor="select-all" 
                        className="text-sm font-medium text-gray-500 cursor-pointer select-none hover:text-gray-300 transition-colors"
                     >
                        Select All
                     </label>
                </div>
            )}
        </div>

        {/* List */}
        <ul className="divide-y divide-gray-700">
          {filteredStudents.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-500 flex flex-col items-center animate-fade-in">
              <Users className="w-12 h-12 text-gray-700 mb-3" />
              <p>{students.length === 0 ? "Your roster is empty." : "No matching students found."}</p>
            </li>
          ) : (
            filteredStudents.map((student, idx) => {
              const isSelected = selectedIds.has(student.id);
              const age = student.birthday ? getAge(student.birthday) : null;
              
              return (
                <li 
                    key={student.id} 
                    className={`
                        px-8 py-4 flex items-center justify-between transition-all duration-200 group
                        ${isSelected ? 'bg-primary-900/10' : 'hover:bg-gray-700/30 hover:pl-9'}
                    `}
                    style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <div className="flex items-center gap-5 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(student.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-900 cursor-pointer"
                    />
                    
                    {/* Avatar */}
                    <div className="relative w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600 flex items-center justify-center text-gray-400 group-hover:border-gray-500 transition-colors">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </div>

                    <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleStudentClick(student)}
                    >
                      <div className="flex items-center gap-3">
                          <p className={`font-semibold text-base transition-colors ${isSelected ? 'text-primary-400' : 'text-gray-100 group-hover:text-white'}`}>
                            {student.name}
                          </p>
                          {age !== null && (
                            <span className="text-xs text-gray-500 font-medium">
                                {age} yrs
                            </span>
                          )}
                          {student.className && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-900 text-gray-400 border border-gray-700 group-hover:border-gray-600 transition-colors">
                                {student.className}
                            </span>
                          )}
                      </div>
                      {(student.guardian || student.guardianContact) && (
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
                            {student.guardian && (
                                <span className="truncate max-w-[150px]">{student.guardian}</span>
                            )}
                            {student.guardianContact && (
                                <span className="flex items-center gap-1.5 text-xs bg-gray-900 px-2 py-0.5 rounded text-gray-400">
                                    <Phone className="w-3 h-3" />
                                    {student.guardianContact}
                                </span>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleRemoveStudent(student.id, e)}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                    title="Remove Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Class Details Modal */}
      {viewingClass && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingClass(null)}>
              <div 
                  className="bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200" 
                  onClick={e => e.stopPropagation()}
              >
                  {(() => {
                      const stats = getClassStats(viewingClass);
                      const classPerformance = stats.students.map(s => {
                          const sStats = getStudentStats(s.id);
                          return { ...s, sStats };
                      }).sort((a, b) => b.sStats.percentage - a.sStats.percentage);

                      const topPerformers = classPerformance.slice(0, 3);
                      // Filter for students with < 20% attendance, then sort by lowest first
                      const lowPerformers = classPerformance
                          .filter(s => s.sStats.percentage < 20)
                          .sort((a, b) => a.sStats.percentage - b.sStats.percentage)
                          .slice(0, 3);

                      return (
                          <>
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-gray-700 flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    {isEditingClass ? <Edit2 className="w-6 h-6 text-primary-500"/> : <GraduationCap className="w-7 h-7 text-primary-500"/>}
                                    {isEditingClass ? 'Edit Class' : viewingClass}
                                </h3>
                                <button onClick={() => setViewingClass(null)} className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto space-y-8">
                                {isEditingClass ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-400 mb-2">Class Name</label>
                                            <input
                                                type="text"
                                                value={editClassName}
                                                onChange={(e) => setEditClassName(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-400 mb-2">Min Age</label>
                                                <input
                                                    type="number"
                                                    value={editClassMinAge}
                                                    onChange={(e) => setEditClassMinAge(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-400 mb-2">Max Age</label>
                                                <input
                                                    type="number"
                                                    value={editClassMaxAge}
                                                    onChange={(e) => setEditClassMaxAge(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-primary-900/20 text-primary-300 p-4 rounded-xl text-sm border border-primary-900/50">
                                            Updates will affect age-based auto-assignment for new students. Renaming will update {stats.studentCount} student(s).
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Class Stats */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-gray-700 hover:border-gray-600 transition-colors">
                                                 <span className="text-3xl font-bold text-white mb-1">{stats.studentCount}</span>
                                                 <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Enrolled</span>
                                            </div>
                                            <div className="bg-gray-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-gray-700 hover:border-gray-600 transition-colors">
                                                 <span className={`text-3xl font-bold mb-1 ${stats.percentage > 80 ? 'text-green-500' : 'text-white'}`}>{stats.percentage}%</span>
                                                 <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance</span>
                                            </div>
                                        </div>

                                        {stats.config && (
                                            <div className="flex justify-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-900/20 text-primary-400 border border-primary-900/50">
                                                    Target Age: {stats.config.minAge} - {stats.config.maxAge} Years
                                                </span>
                                            </div>
                                        )}

                                        {/* Attendance Insights */}
                                        {sessions.length > 0 && stats.students.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
                                                {/* Top 3 */}
                                                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-900 transition-colors">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <Trophy className="w-3 h-3 text-yellow-500" /> Top Attendance
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {topPerformers.map((s, i) => (
                                                            <li key={s.id} className="flex items-center justify-between text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[10px] font-mono w-4 h-4 rounded-full flex items-center justify-center ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-500'}`}>
                                                                        {i + 1}
                                                                    </span>
                                                                    <span className="text-gray-300 truncate max-w-[100px]">{s.name}</span>
                                                                </div>
                                                                <span className="text-green-500 font-bold text-xs">{s.sStats.percentage}%</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Bottom 3 - Filtered for < 20% */}
                                                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-900 transition-colors">
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <TrendingDown className="w-3 h-3 text-red-500" /> Needs Attention
                                                    </h4>
                                                    {lowPerformers.length > 0 ? (
                                                        <ul className="space-y-2">
                                                            {lowPerformers.map((s, i) => (
                                                                <li key={s.id} className="flex items-center justify-between text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-4 flex justify-center">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 animate-pulse"></div>
                                                                        </div>
                                                                        <span className="text-gray-300 truncate max-w-[100px]">{s.name}</span>
                                                                    </div>
                                                                    <span className="text-red-400 font-bold text-xs">{s.sStats.percentage}%</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="h-20 flex flex-col items-center justify-center text-gray-500 gap-2">
                                                             <div className="bg-green-500/10 p-2 rounded-full">
                                                                <Check className="w-4 h-4 text-green-500" />
                                                             </div>
                                                             <span className="text-xs">No students under 20%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Student List */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 text-gray-500">
                                                <span className="text-xs font-bold uppercase tracking-wider">Students</span>
                                                <div className="h-px bg-gray-700 flex-1"></div>
                                            </div>
                                            <div className="border border-gray-700 rounded-xl max-h-48 overflow-y-auto">
                                                {stats.students.length > 0 ? (
                                                    <ul className="divide-y divide-gray-700">
                                                        {stats.students.map(s => {
                                                            const age = s.birthday ? getAge(s.birthday) : null;
                                                            return (
                                                                <li key={s.id} className="px-4 py-3 text-sm text-gray-300 flex justify-between items-center hover:bg-gray-700/50 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-6 h-6 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center">
                                                                            {s.photo ? <img src={s.photo} className="w-full h-full object-cover"/> : <User className="w-3 h-3 text-gray-400"/>}
                                                                        </div>
                                                                        <span>{s.name}</span>
                                                                    </div>
                                                                    {age !== null && <span className="text-gray-500 text-xs">{age} yrs</span>}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <p className="p-6 text-center text-sm text-gray-500">No students assigned.</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
                                {isEditingClass ? (
                                    <>
                                        <Button variant="ghost" onClick={() => setIsEditingClass(false)}>Cancel</Button>
                                        <Button onClick={handleSaveClassEdit} className="active:scale-95">
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="danger" onClick={() => handleDeleteClass(viewingClass)} className="mr-auto active:scale-95">
                                            Delete
                                        </Button>
                                        <Button variant="secondary" onClick={handleStartEditClass} className="active:scale-95">
                                            Edit Details
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingStudent(null)}>
              <div 
                  className="bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" 
                  onClick={e => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {isEditingDetails ? 'Edit Student' : 'Student Profile'}
                      </h3>
                      <button onClick={() => setViewingStudent(null)} className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 overflow-y-auto">
                     {isEditingDetails && editFormData ? (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div 
                                    className="w-28 h-28 rounded-full bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-all overflow-hidden relative group hover:scale-105"
                                    onClick={() => editFileInputRef.current?.click()}
                                >
                                    {editFormData.photo ? (
                                        <img src={editFormData.photo} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-600" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 className="w-6 h-6 text-white animate-fade-in-up" />
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={editFileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handlePhotoSelect(e, true)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-semibold text-gray-400 mb-2">Class</label>
                                  <select
                                      value={editFormData.className || ''}
                                      onChange={(e) => setEditFormData({...editFormData, className: e.target.value || undefined})}
                                      className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none appearance-none"
                                  >
                                      <option value="">No Class</option>
                                      {classes.map(c => (
                                          <option key={c} value={c}>{c}</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-semibold text-gray-400 mb-2">Birthday</label>
                                  <input
                                      type="date"
                                      value={editFormData.birthday || ''}
                                      onChange={(e) => setEditFormData({...editFormData, birthday: e.target.value})}
                                      className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                  />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Guardian</label>
                                    <input
                                        type="text"
                                        value={editFormData.guardian || ''}
                                        onChange={(e) => setEditFormData({...editFormData, guardian: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">Contact</label>
                                    <input
                                        type="text"
                                        value={editFormData.guardianContact || ''}
                                        onChange={(e) => setEditFormData({...editFormData, guardianContact: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={editFormData.address || ''}
                                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Notes</label>
                                <textarea
                                    rows={4}
                                    value={editFormData.notes || ''}
                                    onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                     ) : (
                         <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600 shadow-lg">
                                    {viewingStudent.photo ? (
                                        <img src={viewingStudent.photo} alt={viewingStudent.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                            <User className="w-8 h-8 text-gray-500" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {viewingStudent.name}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {viewingStudent.className ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-primary-900/30 text-primary-400 border border-primary-900">
                                                {viewingStudent.className}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-500 italic">No Class</span>
                                        )}
                                        {viewingStudent.birthday && (
                                            <span className="text-sm text-gray-500">
                                                • {getAge(viewingStudent.birthday)} years old
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Stats Card */}
                            {(() => {
                                const stats = getStudentStats(viewingStudent.id);
                                return (
                                    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Attendance</span>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4 transition-all duration-500 hover:scale-110
                                                    ${stats.percentage >= 80 ? 'border-green-900/50 text-green-500' : 
                                                      stats.percentage >= 50 ? 'border-yellow-900/50 text-yellow-500' : 'border-red-900/50 text-red-500'}
                                                `}>
                                                    {stats.percentage}%
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-200 font-semibold">Attendance Rate</span>
                                                    <span className="text-xs text-gray-500">{stats.total} sessions total</span>
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-gray-700 hidden sm:block"></div>
                                            <div className="text-sm hidden sm:block space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="text-gray-400 font-medium">{stats.present} Present</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                    <span className="text-gray-400 font-medium">{stats.absent} Absent</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Guardian</p>
                                        <p className="text-gray-200 font-medium">{viewingStudent.guardian || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Contact</p>
                                        <p className="text-gray-200 font-medium">{viewingStudent.guardianContact || 'N/A'}</p>
                                    </div>
                                </div>
                                {viewingStudent.birthday && (
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                            <Cake className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Birthday</p>
                                            <p className="text-gray-200 font-medium">{new Date(viewingStudent.birthday).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                                {viewingStudent.address && (
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Address</p>
                                            <p className="text-gray-200 font-medium">{viewingStudent.address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {viewingStudent.notes && (
                                <div className="pt-2">
                                    <h4 className="text-sm font-bold text-gray-300 mb-2">Notes</h4>
                                    <div className="bg-gray-900 rounded-xl p-4 text-gray-400 text-sm leading-relaxed border border-gray-700">
                                        {viewingStudent.notes}
                                    </div>
                                </div>
                            )}
                         </div>
                     )}
                  </div>

                  {/* Footer */}
                  <div className="px-8 py-6 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
                     {isEditingDetails ? (
                         <>
                            <Button variant="ghost" onClick={handleCancelEdit}>Cancel</Button>
                            <Button onClick={handleSaveEdit} className="active:scale-95">
                                Save Changes
                            </Button>
                         </>
                     ) : (
                         <>
                            <Button variant="danger" onClick={() => handleRemoveStudent(viewingStudent.id)} className="mr-auto active:scale-95">
                                Delete
                            </Button>
                            <Button variant="secondary" onClick={handleStartEdit} className="active:scale-95">
                                Edit Profile
                            </Button>
                         </>
                     )}
                  </div>
              </div>
          </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsImportModalOpen(false)}>
              <div 
                  className="bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="px-8 py-6 border-b border-gray-700 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">Bulk Import Students</h3>
                        <p className="text-sm text-gray-400 mt-1">Paste names list or upload a CSV file.</p>
                      </div>
                      <button onClick={() => setIsImportModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-8 flex-1 overflow-y-auto">
                      <div className="flex gap-4 mb-4">
                          <div className="flex-1">
                                <input 
                                    type="file" 
                                    ref={fileImportRef} 
                                    className="hidden" 
                                    accept=".csv,.txt"
                                    onChange={handleImportFile}
                                />
                                <div className="flex gap-2">
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={() => fileImportRef.current?.click()}
                                        className="w-full sm:w-auto active:scale-95"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload CSV
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={downloadTemplate}
                                        className="text-gray-500 hover:text-gray-300 active:scale-95"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Template
                                    </Button>
                                </div>
                          </div>
                      </div>

                      <div className="mb-6">
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Enter names (one per line)&#10;OR paste CSV data: Name, Class, Guardian, Contact, Birthday, Address"
                            className="w-full h-48 bg-gray-900 border border-gray-700 text-gray-100 rounded-xl p-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm font-mono placeholder-gray-600 leading-relaxed resize-none hover:border-gray-600 transition-colors"
                        />
                      </div>

                      {parsedImportData.length > 0 && (
                          <div className="space-y-3 animate-fade-in-up">
                              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex justify-between">
                                  <span>Preview ({parsedImportData.length} Students)</span>
                                  <span className="text-primary-400">Ready to Import</span>
                              </h4>
                              <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                  <table className="w-full text-sm text-left">
                                      <thead className="text-xs text-gray-500 uppercase bg-gray-800 sticky top-0">
                                          <tr>
                                              <th className="px-4 py-2">Name</th>
                                              <th className="px-4 py-2">Class</th>
                                              <th className="px-4 py-2">Guardian</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-800">
                                          {parsedImportData.map((s) => (
                                              <tr key={s.id} className="text-gray-300 hover:bg-gray-800 transition-colors">
                                                  <td className="px-4 py-2 font-medium">{s.name}</td>
                                                  <td className="px-4 py-2 text-gray-500">{s.className || '-'}</td>
                                                  <td className="px-4 py-2 text-gray-500">{s.guardian || '-'}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                              <p className="text-xs text-gray-500">
                                  * New classes ({Array.from(new Set(parsedImportData.map(s => s.className).filter(Boolean))).filter(c => !classes.includes(c!)).length}) will be created automatically.
                              </p>
                          </div>
                      )}
                  </div>

                  <div className="px-8 py-6 bg-gray-900 border-t border-gray-700 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleImportSubmit} disabled={parsedImportData.length === 0} className="active:scale-95">
                          Import {parsedImportData.length > 0 ? `${parsedImportData.length} Students` : ''}
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      {confirmation.isOpen && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeConfirmation}
        >
            <div 
                className="bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl border border-gray-700 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-900/20 rounded-full flex-shrink-0 animate-pulse-soft">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">{confirmation.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{confirmation.message}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end mt-2">
                    <Button variant="ghost" onClick={closeConfirmation}>Cancel</Button>
                    <Button variant="danger" onClick={confirmation.onConfirm} className="active:scale-95">Delete</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};