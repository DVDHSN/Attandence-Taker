
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, ClassSession, ClassConfig, Density } from '../types';
import { Button } from './Button';
import { Trash2, UserPlus, Users, Search, FolderPlus, Edit2, Check, X, ChevronDown, ChevronUp, Phone, FileText, User, PieChart, GraduationCap, Cake, Camera, Upload, Sparkles, AlertTriangle, FileUp, Download, MapPin, Trophy, TrendingDown, Star, ScrollText, Calendar, Minus, AlertOctagon, CheckCircle2, ArrowUpDown } from 'lucide-react';
import { exportStudentHistoryToCSV } from '../services/storageService';

interface StudentManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  classes: string[];
  onUpdateClasses: (classes: string[]) => void;
  classConfigs: Record<string, ClassConfig>;
  onUpdateClassConfigs: (configs: Record<string, ClassConfig>) => void;
  sessions: ClassSession[];
  onUpdateSessions: (sessions: ClassSession[]) => void;
  density: Density;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ 
    students, 
    onUpdateStudents, 
    classes, 
    onUpdateClasses,
    classConfigs,
    onUpdateClassConfigs,
    sessions,
    onUpdateSessions,
    density
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
  const [sortBy, setSortBy] = useState<'name' | 'className' | 'guardian' | 'guardianContact' | 'address'>('name');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkClassId, setBulkClassId] = useState('');

  const [isClassMgrOpen, setIsClassMgrOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  const [viewingClass, setViewingClass] = useState<string | null>(null);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editClassMinAge, setEditClassMinAge] = useState<string>('');
  const [editClassMaxAge, setEditClassMaxAge] = useState<string>('');

  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editFormData, setEditFormData] = useState<Student | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const fileImportRef = useRef<HTMLInputElement>(null);

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

  const s = useMemo(() => {
    switch (density) {
        case 'compact':
            return {
                gap: 'gap-4',
                space: 'space-y-4',
                p: 'p-4',
                listP: 'py-2 px-4',
                headerP: 'px-4 py-4',
                gridGap: 'gap-4',
                input: 'py-2 px-3 text-xs'
            };
        case 'spacious':
            return {
                gap: 'gap-8',
                space: 'space-y-12',
                p: 'p-10',
                listP: 'py-6 px-8',
                headerP: 'px-8 py-8',
                gridGap: 'gap-8',
                input: 'py-4 px-4 text-sm'
            };
        default:
            return {
                gap: 'gap-6',
                space: 'space-y-8',
                p: 'p-8',
                listP: 'py-4 px-6',
                headerP: 'px-8 py-6',
                gridGap: 'gap-6',
                input: 'py-3 px-3 text-sm'
            };
    }
  }, [density]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = useMemo(() => {
    // 1. Filter
    const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.className && student.className.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 2. Sort
    return filtered.sort((a, b) => {
        const getVal = (s: Student) => (s[sortBy] || '').toString().toLowerCase();
        const valA = getVal(a);
        const valB = getVal(b);
        
        // Push empty values to the bottom
        if (valA === valB) return 0;
        if (valA === '') return 1; 
        if (valB === '') return -1;
        
        return valA.localeCompare(valB);
    });
  }, [students, searchTerm, sortBy]);

  const studentCounts = students.reduce((acc, student) => {
    if (student.className) {
      acc[student.className] = (acc[student.className] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // --- STATS CALCULATION FOR INSIGHTS ---
  const studentStats = useMemo(() => {
    return students.map(student => {
      let present = 0;
      let total = 0;
      sessions.forEach(session => {
        const record = session.records.find(r => r.studentId === student.id);
        if (record) {
          total++;
          if (record.status === 'present') present++;
        }
      });
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { ...student, percentage, totalSessions: total };
    });
  }, [students, sessions]);

  const topStudents = useMemo(() => {
    return [...studentStats]
      .filter(s => s.totalSessions > 0)
      .sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 3);
  }, [studentStats]);

  const atRiskStudents = useMemo(() => {
    return studentStats
      .filter(s => s.totalSessions > 0 && s.percentage < 30)
      .sort((a, b) => a.percentage - b.percentage); // Lowest first
  }, [studentStats]);

  // --- END STATS ---

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

  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_SIZE = 150;
          let width = img.width;
          let height = img.height;
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

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        e.target.value = '';
    }
  };

  const downloadTemplate = () => {
      const headers = "Name,Class,Guardian,Contact,Birthday (YYYY-MM-DD),Address";
      const example = "John Doe,Junior,Jane Doe,555-0123,2015-05-20,123 Main St";
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

  const parseImportDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const clean = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
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
        const lower = line.toLowerCase();
        // Simple header detection
        if (index === 0 && (lower.includes('name') && (lower.includes('class') || lower.includes('guardian') || lower.includes('birthday')))) {
            return null;
        }
        
        // Handle CSV splitting including quoted values
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.trim().replace(/^"|"$/g, ''));
        
        let student: Partial<Student> = {};
        if (parts.length > 1) {
            const [name, rawClass, guardian, contact, rawBirthday, address] = parts;
            if (!name) return null;
            
            const birthday = parseImportDate(rawBirthday);
            let className = rawClass || undefined;
            
            // Auto-assign class based on age if birthday is provided and class is missing
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
                address: address || undefined 
            };
        } else {
            // Simple line with just a name
            if (!line.trim()) return null;
            student = { name: line.trim() };
        }
        
        return { id: crypto.randomUUID(), ...student } as Student;
    }).filter((s): s is Student => s !== null);
  }, [importText, classConfigs]);

  const handleImportSubmit = () => {
    if (parsedImportData.length === 0) return;
    const importedClasses = new Set(parsedImportData.map(s => s.className).filter(Boolean) as string[]);
    const newClasses = Array.from(importedClasses).filter(c => !classes.includes(c));
    if (newClasses.length > 0) {
        onUpdateClasses([...classes, ...newClasses].sort());
    }
    onUpdateStudents([...students, ...parsedImportData]);
    setIsImportModalOpen(false);
    setImportText('');
  };

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
      title: 'DELETE_STUDENT',
      message: 'This action is permanent.',
      onConfirm: () => {
        onUpdateStudents(students.filter(s => s.id !== id));
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
    const updatedStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    onUpdateStudents(updatedStudents);
    setViewingStudent(updatedStudent);
    setIsEditingDetails(false);
  };

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
      title: 'BULK_DELETE',
      message: `Deleting ${selectedIds.size} records.`,
      onConfirm: () => {
        onUpdateStudents(students.filter(s => !selectedIds.has(s.id)));
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
        ? `Removes assignment from ${count} students.`
        : `Delete class "${className}"?`;
    setConfirmation({
      isOpen: true,
      title: `DELETE CLASS`,
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

  // Detailed Student Stats for Report Card
  const detailedStats = useMemo(() => {
    if (!viewingStudent) return null;
    let present = 0;
    let absent = 0;
    let fluent = 0;
    let attempted = 0;
    let failed = 0;
    
    // Get all sessions where this student has a record
    const history = sessions
        .filter(session => session.records.some(r => r.studentId === viewingStudent.id))
        .map(session => {
            const record = session.records.find(r => r.studentId === viewingStudent.id)!;
            if (record.status === 'present') present++;
            else absent++;
            
            if (record.memoryVerseStatus === 'fluent') fluent++;
            else if (record.memoryVerseStatus === 'attempted') attempted++;
            else if (record.memoryVerseStatus === 'failed') failed++;

            return {
                id: session.id,
                date: session.date,
                topic: session.topic,
                memoryVerse: session.memoryVerse,
                status: record.status,
                verseStatus: record.memoryVerseStatus
            };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = present + absent;
    const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { 
        present, absent, total, attendancePct, 
        fluent, attempted, failed, history 
    };
  }, [viewingStudent, sessions]);

  // Updated Input Style for more brutalist look: Thick borders, sharp focus, black background
  const InputStyle = `w-full bg-black border-[3px] border-zinc-700 text-white ${s.input} focus:border-white focus:shadow-[4px_4px_0px_0px_#fff] focus:outline-none transition-all duration-150 placeholder-zinc-600 font-mono focus:-translate-y-1`;

  return (
    <div className={`${s.space} relative`}>
      
      {/* Top Section */}
      <div className={`grid grid-cols-1 xl:grid-cols-3 ${s.gridGap} animate-fade-in`}>
        
        {/* Add Student Form */}
        <div className={`xl:col-span-2 bg-zinc-800 ${s.p} border-[3px] border-zinc-600 shadow-brutal hover:border-white transition-all duration-300 hover:shadow-brutal-lg group`}>
            <div className={`flex justify-between items-start mb-6 border-b-[3px] border-zinc-600 pb-4`}>
                <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                  <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  New Recruit
                </h3>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setIsImportModalOpen(true)}
                    className="gap-2"
                >
                    <FileUp className="w-4 h-4" />
                    <span className="hidden sm:inline">BULK IMPORT</span>
                </Button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-6">
                <div className={`flex flex-col sm:flex-row ${s.gap}`}>
                  {/* Photo Upload */}
                  <div className="flex-shrink-0">
                    <div 
                      className={`w-24 h-24 bg-zinc-900 border-[3px] border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors duration-300 overflow-hidden relative group/photo active:scale-95 transition-transform`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {newPhoto ? (
                        <img src={newPhoto} alt="Preview" className="w-full h-full object-cover grayscale" />
                      ) : (
                        <Camera className="w-8 h-8 text-zinc-600 group-hover/photo:text-primary-500 transition-colors group-hover/photo:scale-110" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handlePhotoSelect(e)}
                    />
                    <p className="text-[10px] text-center text-zinc-500 font-mono mt-2 uppercase">PHOTO (OPT)</p>
                  </div>

                  <div className={`flex-1 ${s.space}`}>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${s.gap}`}>
                      <input
                        type="text"
                        placeholder="FULL NAME *"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className={InputStyle}
                      />
                       <div className="flex gap-2">
                          <div className="relative w-full group">
                              <select
                                  value={newClass}
                                  onChange={(e) => setNewClass(e.target.value)}
                                  className={`${InputStyle} appearance-none pr-8 cursor-pointer`}
                              >
                                  <option value="">SELECT CLASS...</option>
                                  {classes.map(g => (
                                      <option key={g} value={g}>{g}</option>
                                  ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:translate-y-0 transition-transform" />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setAutoClass(!autoClass)}
                            className={`p-3 border-[3px] transition-all duration-200 flex-shrink-0 active:scale-95 ${
                                autoClass 
                                ? 'bg-primary-900/20 border-primary-500 text-primary-500 shadow-[2px_2px_0px_0px_#ef4444]' 
                                : 'bg-black border-zinc-600 text-zinc-600 hover:border-white'
                            }`}
                            title="Auto-Assign"
                          >
                            <Sparkles className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                    
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${s.gap}`}>
                         <input
                          type="date"
                          value={newBirthday}
                          onChange={(e) => setNewBirthday(e.target.value)}
                          className={InputStyle}
                        />
                         <input
                          type="text"
                          placeholder="GUARDIAN NAME"
                          value={newGuardian}
                          onChange={(e) => setNewGuardian(e.target.value)}
                          className={InputStyle}
                        />
                    </div>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 ${s.gap}`}>
                        <input
                            type="text"
                            placeholder="CONTACT INFO"
                            value={newGuardianContact}
                            onChange={(e) => setNewGuardianContact(e.target.value)}
                            className={InputStyle}
                        />
                        <input
                            type="text"
                            placeholder="ADDRESS"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            className={InputStyle}
                        />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={!newName.trim()} className="w-full sm:w-auto">
                      Confirm Entry
                    </Button>
                </div>
            </form>
        </div>

        {/* Class Manager */}
        <div className="bg-zinc-800 border-[3px] border-zinc-600 shadow-brutal flex flex-col h-full hover:border-white transition-colors duration-300">
             <div 
                className={`p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-700 transition-colors border-b-[3px] border-zinc-600`}
                onClick={() => setIsClassMgrOpen(!isClassMgrOpen)}
             >
                <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                    <FolderPlus className="w-6 h-6" />
                    Classes
                </h3>
                <button className="text-white border-2 border-zinc-600 p-1 hover:bg-white hover:text-black transition-colors duration-200 active:scale-95">
                    {isClassMgrOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
             </div>
             
             <div className={`px-6 flex-1 flex flex-col transition-all duration-300 ${isClassMgrOpen ? 'pb-6 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
                 <form onSubmit={handleCreateClass} className="flex gap-2 pt-6 mb-4">
                    <input 
                        type="text" 
                        placeholder="CLASS NAME" 
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="flex-1 bg-black border-2 border-zinc-600 text-white px-3 py-2 focus:border-white outline-none text-sm font-mono placeholder-zinc-600 transition-all focus:shadow-[2px_2px_0px_0px_#fff]"
                    />
                    <Button type="submit" disabled={!newClassName.trim()} size="sm" variant="secondary">ADD</Button>
                 </form>
                 
                 <div className="overflow-y-auto space-y-2 max-h-[250px] custom-scrollbar pr-1">
                    {classes.map((className, idx) => {
                        const count = studentCounts[className] || 0;
                        const config = classConfigs[className];
                        return (
                            <div 
                                key={className} 
                                onClick={() => handleClassClick(className)}
                                className="group flex items-center justify-between p-3 border-2 border-zinc-700 bg-black hover:border-white hover:bg-zinc-900 cursor-pointer transition-colors duration-200 hover:translate-x-1 animate-slide-up opacity-0"
                                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-white text-sm font-bold uppercase truncate group-hover:text-white transition-colors">
                                        {className}
                                    </span>
                                    {config && (
                                        <span className="text-[10px] font-mono text-zinc-500 border border-zinc-700 px-1 group-hover:text-zinc-300 group-hover:border-zinc-500">
                                            {config.minAge}-{config.maxAge}Y
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-zinc-500">
                                      {count}
                                  </span>
                                  <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        );
                    })}
                 </div>
             </div>
        </div>
      </div>
      
      {/* Performance Insights Row */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${s.gap}`}>
          {/* Top Performers */}
          <div className={`bg-zinc-800 border-[3px] border-zinc-600 shadow-brutal ${s.p} hover:border-white transition-all duration-300 group`}>
              <div className="flex items-center justify-between mb-4 border-b border-zinc-700 pb-2">
                  <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500 group-hover:animate-bounce" />
                      Top Performers
                  </h3>
              </div>
              {topStudents.length > 0 ? (
                  <div className="space-y-2">
                      {topStudents.map((s, idx) => (
                          <div key={s.id} className="flex items-center gap-3 p-2 bg-black border border-zinc-800 hover:border-yellow-500 transition-all duration-200 group/item hover:translate-x-1">
                              <div className={`w-6 h-6 flex items-center justify-center font-black text-xs text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-zinc-300' : 'bg-orange-700 text-white'}`}>
                                  {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-white font-bold text-xs truncate uppercase group-hover/item:text-yellow-500 transition-colors">{s.name}</p>
                              </div>
                              <div className="text-right">
                                  <span className="text-sm font-black text-white block">{s.percentage}%</span>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-4 text-zinc-500 font-mono text-xs border border-dashed border-zinc-800">
                      NO_DATA
                  </div>
              )}
          </div>

          {/* At Risk */}
          <div className={`bg-zinc-800 border-[3px] border-zinc-600 shadow-brutal ${s.p} hover:border-white transition-all duration-300 group`}>
              <div className="flex items-center justify-between mb-4 border-b border-zinc-700 pb-2">
                  <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 text-red-500 group-hover:animate-pulse" />
                      Needs Attention
                  </h3>
                  <span className="text-[10px] bg-red-600 text-black px-1.5 py-0.5 border border-red-900 font-mono font-bold">{'<'}30%</span>
              </div>
              {atRiskStudents.length > 0 ? (
                  <div className="overflow-y-auto max-h-[140px] custom-scrollbar pr-1 space-y-2">
                      {atRiskStudents.map((s) => (
                          <div key={s.id} className="flex items-center justify-between bg-red-950 p-2 border-l-4 border-red-500 hover:bg-red-900 transition-colors hover:pl-3">
                              <div>
                                  <p className="text-white font-bold text-xs uppercase">{s.name}</p>
                              </div>
                              <span className="text-red-500 font-black font-mono text-xs">{s.percentage}%</span>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-4 border border-dashed border-zinc-800 bg-zinc-900/50">
                      <div className="w-8 h-8 rounded-full bg-green-900/20 flex items-center justify-center mb-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-zinc-500 font-mono text-xs uppercase">All Clear</span>
                  </div>
              )}
          </div>
      </div>

      {/* Roster List */}
      <div className="bg-zinc-800 border-[3px] border-zinc-600 shadow-brutal hover:border-white transition-colors duration-300 animate-slide-up">
        <div className={`${s.headerP} border-b-[3px] border-zinc-600 flex flex-col md:flex-row justify-between items-center gap-6`}>
            <h3 className="text-xl font-black text-white uppercase">
                Personnel <span className="text-zinc-500 font-mono text-lg">[{students.length}]</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {/* Sort Dropdown */}
                 <div className="relative group w-full sm:w-48">
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                         <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase">Sort:</span>
                     </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-black border-2 border-zinc-600 text-sm text-white pl-12 pr-8 py-3 focus:border-white outline-none font-mono uppercase transition-colors appearance-none cursor-pointer focus:shadow-[2px_2px_0px_0px_#fff]"
                    >
                        <option value="name">Name</option>
                        <option value="className">Class</option>
                        <option value="guardian">Guardian</option>
                        <option value="guardianContact">Contact</option>
                        <option value="address">Address</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:text-white" />
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <input 
                        type="text" 
                        placeholder="SEARCH..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border-2 border-zinc-600 text-sm text-white pl-12 pr-4 py-3 focus:border-white outline-none font-mono placeholder-zinc-600 uppercase transition-colors focus:shadow-[2px_2px_0px_0px_#fff]"
                    />
                </div>
            </div>
        </div>

        <div className={`${s.listP} bg-zinc-900 border-b-[3px] border-zinc-600 min-h-[52px] flex items-center`}>
            {selectedIds.size > 0 ? (
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 animate-fade-in">
                    <div className="flex items-center gap-4">
                         <span className="text-white font-bold font-mono text-sm uppercase border border-primary-500 bg-primary-600 px-2 py-1 animate-pulse-slow shadow-[2px_2px_0px_0px_#000]">{selectedIds.size} SELECTED</span>
                         <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-zinc-500 hover:text-white underline decoration-zinc-600 hover:decoration-white uppercase"
                         >
                            Clear
                         </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <select
                            value={bulkClassId}
                            onChange={(e) => setBulkClassId(e.target.value)}
                            className="bg-black border-2 border-zinc-600 text-xs text-white px-2 py-2 outline-none cursor-pointer hover:border-white uppercase transition-colors"
                        >
                            <option value="">MOVE TO...</option>
                            {classes.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        <Button size="sm" onClick={handleBulkAssignClass} disabled={!bulkClassId} variant="secondary">
                            APPLY
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                            DEL
                        </Button>
                    </div>
                 </div>
            ) : (
                <div className="flex items-center gap-3 animate-fade-in">
                     <input
                        id="select-all"
                        type="checkbox"
                        checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id))}
                        onChange={handleSelectAll}
                        className="w-4 h-4 border-2 border-zinc-600 bg-black checked:bg-white checked:border-white focus:ring-0 rounded-none cursor-pointer transition-colors"
                     />
                     <label htmlFor="select-all" className="text-xs font-bold uppercase text-zinc-500 cursor-pointer hover:text-white transition-colors">
                        Select All
                     </label>
                </div>
            )}
        </div>

        <ul className="divide-y-2 divide-zinc-700">
          {filteredStudents.length === 0 ? (
            <li className={`${s.listP} text-center text-zinc-500 font-mono text-sm uppercase`}>
              NO_RECORDS_FOUND
            </li>
          ) : (
            filteredStudents.map((student, idx) => {
              const isSelected = selectedIds.has(student.id);
              const age = student.birthday ? getAge(student.birthday) : null;
              
              return (
                <li 
                    key={student.id} 
                    className={`
                        ${s.listP} flex items-center justify-between transition-all duration-200 group animate-slide-up opacity-0
                        ${isSelected ? 'bg-zinc-800 border-l-4 border-primary-500' : 'hover:bg-zinc-800 hover:pl-10'}
                    `}
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(student.id)}
                      className="w-4 h-4 border-2 border-zinc-600 bg-black checked:bg-white checked:border-white rounded-none cursor-pointer transition-colors"
                    />
                    
                    <div className="w-12 h-12 bg-black border-2 border-zinc-600 flex items-center justify-center flex-shrink-0 transition-colors group-hover:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-0.5 group-hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        ) : (
                            <User className="w-6 h-6 text-zinc-600 group-hover:text-white" />
                        )}
                    </div>

                    <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleStudentClick(student)}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                          <p className={`font-black text-lg uppercase transition-colors ${isSelected ? 'text-primary-500' : 'text-white group-hover:text-primary-500'}`}>
                            {student.name}
                          </p>
                          {age !== null && (
                            <span className="text-xs text-zinc-500 font-mono">
                                {age}Y
                            </span>
                          )}
                          {student.className && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-black text-zinc-400 px-1 border border-zinc-700 transition-colors group-hover:border-white group-hover:text-white">
                                {student.className}
                            </span>
                          )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-500 mt-1">
                            {(student.guardian) && (
                                <span className="uppercase flex items-center gap-1" title="Guardian">
                                    <Users className="w-3 h-3" />
                                    {student.guardian}
                                </span>
                            )}
                            {(student.guardianContact) && (
                                <span className="flex items-center gap-1" title="Contact">
                                    <Phone className="w-3 h-3" />
                                    {student.guardianContact}
                                </span>
                            )}
                             {(student.address) && (
                                <span className="flex items-center gap-1 uppercase truncate max-w-[200px]" title="Address">
                                    <MapPin className="w-3 h-3" />
                                    {student.address}
                                </span>
                            )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleRemoveStudent(student.id, e)}
                    className="p-2 text-zinc-600 hover:text-red-500 hover:bg-black border-2 border-transparent hover:border-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 focus:opacity-100 focus:translate-x-0 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Class Modal - Brutalist */}
      {viewingClass && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setViewingClass(null)}>
              <div 
                  className="bg-zinc-900 w-full max-w-lg border-4 border-white shadow-brutal-white flex flex-col max-h-[90vh] animate-slam" 
                  onClick={e => e.stopPropagation()}
              >
                  {/* ... Header and Content Implementation similar logic but brutalist styles ... */}
                  {(() => {
                      const stats = getClassStats(viewingClass);
                      return (
                          <>
                            <div className="px-6 py-6 border-b-4 border-white bg-white flex justify-between items-center">
                                <h3 className="text-2xl font-black text-black uppercase flex items-center gap-3">
                                    {isEditingClass ? 'EDIT CONFIG' : viewingClass}
                                </h3>
                                <button onClick={() => setViewingClass(null)} className="text-black border-2 border-black hover:bg-black hover:text-white p-1 transition-colors active:scale-95">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto space-y-8 bg-zinc-900 text-white">
                                {isEditingClass ? (
                                    <div className="space-y-6 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Class Name</label>
                                            <input
                                                type="text"
                                                value={editClassName}
                                                onChange={(e) => setEditClassName(e.target.value)}
                                                className={InputStyle}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Min Age</label>
                                                <input
                                                    type="number"
                                                    value={editClassMinAge}
                                                    onChange={(e) => setEditClassMinAge(e.target.value)}
                                                    className={InputStyle}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Max Age</label>
                                                <input
                                                    type="number"
                                                    value={editClassMaxAge}
                                                    onChange={(e) => setEditClassMaxAge(e.target.value)}
                                                    className={InputStyle}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-800 border-2 border-zinc-600 p-4 text-center hover:border-white transition-colors duration-300 group">
                                                 <span className="text-4xl font-black text-white block group-hover:scale-110 transition-transform">{stats.studentCount}</span>
                                                 <span className="text-xs font-mono uppercase text-zinc-500">Enrolled</span>
                                            </div>
                                            <div className="bg-zinc-800 border-2 border-zinc-600 p-4 text-center hover:border-white transition-colors duration-300 group">
                                                 <span className={`text-4xl font-black block group-hover:scale-110 transition-transform ${stats.percentage > 80 ? 'text-green-500' : 'text-white'}`}>{stats.percentage}%</span>
                                                 <span className="text-xs font-mono uppercase text-zinc-500">Avg. Attendance</span>
                                            </div>
                                        </div>

                                        {stats.config && (
                                            <div className="text-center border border-zinc-700 py-2">
                                                <span className="text-xs font-mono text-zinc-400 uppercase">Target: {stats.config.minAge}-{stats.config.maxAge} YRS</span>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 border-b border-zinc-800 pb-1">Manifest</h4>
                                            <div className="border-2 border-zinc-700 max-h-48 overflow-y-auto bg-black custom-scrollbar">
                                                <ul className="divide-y divide-zinc-700">
                                                    {stats.students.map((s, idx) => (
                                                        <li key={s.id} className="px-4 py-2 text-sm text-zinc-300 flex justify-between items-center font-mono hover:bg-zinc-800 transition-colors animate-fade-in-up" style={{ animationDelay: idx * 30 + 'ms', animationFillMode: 'forwards' }}>
                                                            <span>{s.name}</span>
                                                            {s.birthday && <span className="text-xs text-zinc-600">{getAge(s.birthday)}Y</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="px-6 py-6 bg-zinc-900 border-t-2 border-zinc-700 flex justify-end gap-3">
                                {isEditingClass ? (
                                    <>
                                        <Button variant="ghost" onClick={() => setIsEditingClass(false)}>CANCEL</Button>
                                        <Button onClick={handleSaveClassEdit}>SAVE</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="danger" onClick={() => handleDeleteClass(viewingClass)} className="mr-auto">DELETE</Button>
                                        <Button variant="secondary" onClick={handleStartEditClass}>EDIT</Button>
                                    </>
                                )}
                            </div>
                          </>
                      );
                  })()}
              </div>
           </div>
      )}

      {/* Student Detail Modal - Brutalist */}
      {viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setViewingStudent(null)}>
              <div 
                  className="bg-zinc-900 w-full max-w-2xl border-4 border-white shadow-brutal-white flex flex-col max-h-[90vh] animate-slam" 
                  onClick={e => e.stopPropagation()}
              >
                  <div className="px-6 py-6 border-b-4 border-white bg-white flex justify-between items-center">
                      <h3 className="text-xl font-black text-black uppercase">
                          {isEditingDetails ? 'EDIT RECORD' : 'PERSONNEL FILE'}
                      </h3>
                      <button onClick={() => setViewingStudent(null)} className="text-black border-2 border-black hover:bg-black hover:text-white p-1 transition-colors active:scale-95">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto bg-zinc-900 custom-scrollbar">
                     {isEditingDetails && editFormData ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-center">
                                <div 
                                    className="w-32 h-32 bg-black border-[3px] border-dashed border-zinc-600 flex items-center justify-center cursor-pointer hover:border-white relative group transition-colors hover:scale-105 active:scale-95"
                                    onClick={() => editFileInputRef.current?.click()}
                                >
                                    {editFormData.photo ? (
                                        <img src={editFormData.photo} alt="Preview" className="w-full h-full object-cover grayscale" />
                                    ) : (
                                        <User className="w-10 h-10 text-zinc-600" />
                                    )}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoSelect(e, true)} />
                            </div>

                            {/* Edit Fields - Brutalist Inputs */}
                            <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className={InputStyle} placeholder="NAME" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={editFormData.className || ''} onChange={(e) => setEditFormData({...editFormData, className: e.target.value || undefined})} className={InputStyle}>
                                    <option value="">NO CLASS</option>
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input type="date" value={editFormData.birthday || ''} onChange={(e) => setEditFormData({...editFormData, birthday: e.target.value})} className={InputStyle} />
                            </div>
                            <input type="text" value={editFormData.guardian || ''} onChange={(e) => setEditFormData({...editFormData, guardian: e.target.value})} className={InputStyle} placeholder="GUARDIAN" />
                            <input type="text" value={editFormData.guardianContact || ''} onChange={(e) => setEditFormData({...editFormData, guardianContact: e.target.value})} className={InputStyle} placeholder="CONTACT" />
                            <textarea rows={3} value={editFormData.notes || ''} onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})} className={InputStyle} placeholder="NOTES" />
                        </div>
                     ) : detailedStats ? (
                         <div className="space-y-8 animate-fade-in">
                            <div className="flex items-start gap-6">
                                <div className="w-24 h-24 bg-black border-2 border-zinc-700 shadow-brutal flex-shrink-0 group hover:scale-105 transition-transform">
                                    {viewingStudent.photo ? (
                                        <img src={viewingStudent.photo} alt={viewingStudent.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                            <User className="w-8 h-8 text-zinc-600 group-hover:text-white transition-colors" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                                                {viewingStudent.name}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className="px-2 py-1 text-xs font-bold uppercase bg-black text-white border border-zinc-500">
                                                    {viewingStudent.className || 'UNASSIGNED'}
                                                </span>
                                                {viewingStudent.birthday && (
                                                    <span className="text-sm font-mono text-zinc-400">
                                                        {getAge(viewingStudent.birthday)} YRS
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => exportStudentHistoryToCSV(viewingStudent, detailedStats.history)}>
                                            <Download className="w-4 h-4 mr-2" />
                                            Report Card
                                        </Button>
                                    </div>
                                    {(viewingStudent.guardian || viewingStudent.guardianContact) && (
                                        <div className="mt-3 text-xs font-mono text-zinc-500 border-l-2 border-zinc-700 pl-3">
                                            {viewingStudent.guardian && <p className="uppercase">{viewingStudent.guardian}</p>}
                                            {viewingStudent.guardianContact && <p>{viewingStudent.guardianContact}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Report Card Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-zinc-800 border-2 border-zinc-700 p-3 flex flex-col items-center justify-center hover:border-white transition-colors group">
                                    <span className={`text-2xl font-black group-hover:scale-110 transition-transform ${detailedStats.attendancePct >= 80 ? 'text-green-500' : detailedStats.attendancePct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {detailedStats.attendancePct}%
                                    </span>
                                    <span className="text-[10px] font-mono uppercase text-zinc-500">Attendance</span>
                                </div>
                                <div className="bg-zinc-800 border-2 border-zinc-700 p-3 flex flex-col items-center justify-center hover:border-white transition-colors group">
                                    <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">{detailedStats.total}</span>
                                    <span className="text-[10px] font-mono uppercase text-zinc-500">Sessions</span>
                                </div>
                                <div className="bg-zinc-800 border-2 border-zinc-700 p-3 flex flex-col items-center justify-center hover:border-white transition-colors group">
                                    <span className="text-2xl font-black text-purple-500 group-hover:scale-110 transition-transform">{detailedStats.fluent}</span>
                                    <span className="text-[10px] font-mono uppercase text-zinc-500">Completed</span>
                                </div>
                                <div className="bg-zinc-800 border-2 border-zinc-700 p-3 flex flex-col items-center justify-center hover:border-white transition-colors group">
                                    <span className="text-2xl font-black text-blue-500 group-hover:scale-110 transition-transform">{detailedStats.attempted}</span>
                                    <span className="text-[10px] font-mono uppercase text-zinc-500">Partial</span>
                                </div>
                            </div>
                            
                            {/* Notes Section */}
                            {viewingStudent.notes && (
                                <div className="bg-black/50 p-4 border border-zinc-700 text-zinc-400 text-xs font-mono">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">NOTES</span>
                                    {viewingStudent.notes}
                                </div>
                            )}

                            {/* Full History Log */}
                            <div>
                                <h3 className="text-sm font-bold uppercase text-zinc-500 mb-3 flex items-center gap-2 border-b border-zinc-700 pb-2">
                                    <Calendar className="w-4 h-4" />
                                    Session History
                                </h3>
                                <div className="border-2 border-zinc-700 max-h-60 overflow-y-auto bg-black custom-scrollbar">
                                    {detailedStats.history.length > 0 ? (
                                        <table className="w-full text-left text-xs font-mono">
                                            <thead className="bg-zinc-900 sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-3 font-bold text-zinc-400 border-b border-zinc-700">DATE</th>
                                                    <th className="p-3 font-bold text-zinc-400 border-b border-zinc-700">TOPIC/ASSIGNMENT</th>
                                                    <th className="p-3 font-bold text-zinc-400 text-right border-b border-zinc-700">STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-700">
                                                {detailedStats.history.map((record, idx) => (
                                                    <tr key={record.id} className="hover:bg-zinc-900 transition-colors animate-fade-in-up opacity-0" style={{ animationDelay: idx * 30 + 'ms', animationFillMode: 'forwards' }}>
                                                        <td className="p-3 text-zinc-300 whitespace-nowrap">
                                                            {new Date(record.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short'})}
                                                        </td>
                                                        <td className="p-3 text-zinc-400">
                                                            <div className="flex flex-col">
                                                                <span className="text-zinc-300 font-bold uppercase truncate max-w-[150px]">{record.topic || '-'}</span>
                                                                {record.memoryVerse && (
                                                                    <span className="text-[10px] text-yellow-600/80 flex items-center gap-1">
                                                                        <ScrollText className="w-3 h-3" />
                                                                        {record.memoryVerse}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className={`px-1.5 py-0.5 font-bold uppercase ${record.status === 'present' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                                                                    {record.status === 'present' ? 'PRS' : 'ABS'}
                                                                </span>
                                                                {record.verseStatus && (
                                                                     <span className={`px-1.5 py-0.5 text-[10px] uppercase flex items-center gap-1 ${
                                                                         record.verseStatus === 'fluent' ? 'text-purple-400' : 
                                                                         record.verseStatus === 'attempted' ? 'text-blue-400' : 'text-red-400'
                                                                     }`}>
                                                                         {record.verseStatus === 'fluent' && <Star className="w-3 h-3 fill-current" />}
                                                                         {record.verseStatus === 'attempted' && <Minus className="w-3 h-3" />}
                                                                         {record.verseStatus}
                                                                     </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 text-center text-zinc-500">NO HISTORY RECORDED</div>
                                    )}
                                </div>
                            </div>
                         </div>
                     ) : null}
                  </div>

                  <div className="px-6 py-6 bg-zinc-900 border-t-2 border-zinc-700 flex justify-end gap-3">
                     {isEditingDetails ? (
                         <>
                            <Button variant="ghost" onClick={handleCancelEdit}>CANCEL</Button>
                            <Button onClick={handleSaveEdit}>SAVE</Button>
                         </>
                     ) : viewingStudent ? (
                         <>
                            <Button variant="danger" onClick={() => handleRemoveStudent(viewingStudent.id)} className="mr-auto">DELETE</Button>
                            <Button variant="secondary" onClick={handleStartEdit}>EDIT</Button>
                         </>
                     ) : null}
                  </div>
              </div>
          </div>
      )}

      {/* Bulk Import Modal - Improved */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setIsImportModalOpen(false)}>
            <div 
                className="bg-zinc-900 w-full max-w-2xl border-4 border-white shadow-brutal-white flex flex-col max-h-[90vh] animate-slam" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-6 border-b-4 border-white bg-white flex justify-between items-center">
                    <h3 className="text-xl font-black text-black uppercase flex items-center gap-3">
                        <FileUp className="w-6 h-6" />
                        Bulk Import
                    </h3>
                    <button onClick={() => setIsImportModalOpen(false)} className="text-black border-2 border-black hover:bg-black hover:text-white p-1 transition-colors active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto bg-zinc-900 custom-scrollbar space-y-8">
                    {/* Step 1: Template */}
                    <div className="bg-zinc-800 p-4 border-[3px] border-zinc-600">
                        <h4 className="text-white font-bold uppercase mb-2">1. Get the Template</h4>
                        <p className="text-zinc-400 text-xs font-mono mb-4">Download the CSV template to ensure your data is formatted correctly.</p>
                        <Button size="sm" variant="secondary" onClick={downloadTemplate} className="w-full sm:w-auto">
                            <Download className="w-4 h-4 mr-2" />
                            Download Template.csv
                        </Button>
                    </div>

                    {/* Step 2: Input */}
                    <div className="space-y-4">
                         <h4 className="text-white font-bold uppercase">2. Upload Data</h4>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                                className="border-[3px] border-dashed border-zinc-600 hover:border-white hover:bg-zinc-800 transition-all p-6 flex flex-col items-center justify-center cursor-pointer min-h-[150px] group"
                                onClick={() => fileImportRef.current?.click()}
                            >
                                <Upload className="w-8 h-8 text-zinc-500 group-hover:text-white mb-2 transition-colors group-hover:scale-110" />
                                <span className="text-zinc-400 font-mono text-xs uppercase group-hover:text-white">Click to Upload CSV</span>
                                <input 
                                    type="file" 
                                    ref={fileImportRef} 
                                    className="hidden" 
                                    accept=".csv,.txt"
                                    onChange={handleImportFile}
                                />
                            </div>
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                className="w-full h-full min-h-[150px] bg-black border-[3px] border-zinc-600 text-white p-3 font-mono text-xs focus:border-white outline-none resize-none placeholder-zinc-600 focus:shadow-[4px_4px_0px_0px_#fff] transition-all"
                                placeholder={`Paste CSV data here...\n\nExample:\nJohn Doe,Junior,Jane Doe,555-1234`}
                            />
                         </div>
                    </div>

                    {/* Step 3: Preview */}
                    {parsedImportData.length > 0 && (
                        <div className="animate-fade-in">
                            <h4 className="text-white font-bold uppercase mb-4 flex justify-between items-center">
                                <span>3. Preview</span>
                                <span className="text-green-500 text-xs font-mono bg-green-900/20 px-2 py-1 border border-green-900 animate-pulse-slow">
                                    {parsedImportData.length} Valid Records
                                </span>
                            </h4>
                            <div className="border-[3px] border-zinc-600 max-h-48 overflow-y-auto bg-black">
                                 <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-zinc-900 sticky top-0">
                                        <tr>
                                            <th className="p-2 text-zinc-500 border-b border-zinc-700">Name</th>
                                            <th className="p-2 text-zinc-500 border-b border-zinc-700">Class</th>
                                            <th className="p-2 text-zinc-500 border-b border-zinc-700">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-700">
                                        {parsedImportData.map((s, i) => (
                                            <tr key={i} className="animate-fade-in-up" style={{ animationDelay: i * 30 + 'ms', animationFillMode: 'forwards' }}>
                                                <td className="p-2 text-white">{s.name}</td>
                                                <td className="p-2 text-zinc-400">{s.className || '-'}</td>
                                                <td className="p-2 text-zinc-500">
                                                    {[s.guardian, s.birthday].filter(Boolean).join(' | ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                 </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-6 bg-zinc-900 border-t-2 border-zinc-700 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>CANCEL</Button>
                    <Button onClick={handleImportSubmit} disabled={parsedImportData.length === 0}>
                        IMPORT {parsedImportData.length > 0 && `(${parsedImportData.length})`}
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Confirmation Modal - Brutalist */}
      {confirmation.isOpen && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
            onClick={closeConfirmation}
        >
            <div 
                className="bg-red-900 w-full max-w-sm border-4 border-red-500 shadow-brutal p-6 animate-slam"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 mb-4">
                    <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                    <div>
                        <h3 className="text-xl font-black text-white uppercase">{confirmation.title}</h3>
                        <p className="text-red-200 text-sm font-mono mt-2">{confirmation.message}</p>
                    </div>
                </div>
                <div className="flex gap-4 justify-end">
                    <Button variant="ghost" onClick={closeConfirmation} className="text-red-200 hover:text-white hover:bg-red-800">CANCEL</Button>
                    <Button variant="danger" onClick={confirmation.onConfirm} className="bg-white text-red-900 border-white hover:bg-zinc-200">CONFIRM</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
