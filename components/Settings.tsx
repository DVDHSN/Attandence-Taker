
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
    <div className="space-y-12">
      {/* Backup & Restore Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Card */}
        <div className="bg-zinc-800 p-8 border-2 border-zinc-700 shadow-brutal flex flex-col items-start hover:border-white transition-all duration-300 hover:shadow-brutal-lg hover:-translate-y-2 group">
          <div className="w-16 h-16 bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:border-primary-500 group-hover:bg-zinc-800">
            <Download className="w-8 h-8 text-white group-hover:text-primary-500 transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase mb-2">Export DB</h3>
          <p className="text-zinc-400 font-mono text-xs mb-8 leading-relaxed flex-1">
            >> GENERATE FULL JSON DUMP.<br/>
            >> INCLUDES PROFILES, LOGS, CONFIGS.
          </p>
          <Button onClick={onExport} className="w-full">
            <FileJson className="w-4 h-4 mr-2" />
            DOWNLOAD JSON
          </Button>
        </div>

        {/* Import Card */}
        <div className="bg-zinc-800 p-8 border-2 border-zinc-700 shadow-brutal flex flex-col items-start hover:border-white transition-all duration-300 hover:shadow-brutal-lg hover:-translate-y-2 group">
          <div className="w-16 h-16 bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:border-blue-500 group-hover:bg-zinc-800">
            <Upload className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase mb-2">Import DB</h3>
          <p className="text-zinc-400 font-mono text-xs mb-8 leading-relaxed flex-1">
            >> RESTORE FROM BACKUP FILE.<br/>
            >> SMART MERGE ACTIVE.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleFileChange} 
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
            <Database className="w-4 h-4 mr-2" />
            SELECT FILE
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/10 p-8 border-4 border-red-600 shadow-[8px_8px_0px_0px_#dc2626] transition-transform duration-300 hover:scale-[1.01] hover:animate-shake">
        <div className="flex flex-col sm:flex-row items-start gap-8">
          <div className="p-4 bg-red-600 border-2 border-black flex-shrink-0 animate-pulse-slow">
            <AlertTriangle className="w-8 h-8 text-black" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase mb-2 tracking-tighter">Danger Zone</h3>
            <p className="text-zinc-400 font-mono text-sm mb-6 max-w-2xl border-l-2 border-red-800 pl-4">
              WARNING: SYSTEM RESET WILL PURGE ALL LOCAL DATA.
              <br/>ACTION IS IRREVERSIBLE WITHOUT BACKUP.
            </p>
            <Button variant="danger" onClick={onReset} className="bg-red-600 text-black border-black hover:bg-white">
              INITIATE RESET PROTOCOL
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
