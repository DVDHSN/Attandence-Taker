import React, { useRef } from 'react';
import { Button } from './Button';
import { Download, Upload, AlertTriangle, Database, FileJson } from 'lucide-react';

interface SettingsProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onExport, onImport, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Backup & Restore Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Card */}
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-soft flex flex-col items-start">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6">
            <Download className="w-6 h-6 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Export Data</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed flex-1">
            Download a full backup of your entire database, including student profiles, class lists, attendance history, and configurations.
          </p>
          <Button onClick={onExport} className="w-full sm:w-auto">
            <FileJson className="w-4 h-4 mr-2" />
            Download JSON Backup
          </Button>
        </div>

        {/* Import Card */}
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-soft flex flex-col items-start">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
            <Upload className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Import Data</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed flex-1">
            Restore from a backup file. This will perform a <strong>smart merge</strong>: existing records with matching IDs will be updated, and new records will be added.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleFileChange}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
            <Database className="w-4 h-4 mr-2" />
            Select Backup File
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/10 p-8 rounded-2xl border border-red-900/30">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="p-3 bg-red-900/20 rounded-full flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Danger Zone</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-2xl leading-relaxed">
              Resetting the application will <strong>permanently delete</strong> all students, classes, and attendance records. This action cannot be undone unless you have a backup.
            </p>
            <Button variant="danger" onClick={onReset}>
              Reset All Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
