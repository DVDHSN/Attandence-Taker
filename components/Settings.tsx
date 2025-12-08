
import React, { useRef, useState } from 'react';
import { Button } from './Button';
import { Download, Upload, AlertTriangle, Database, FileJson, Layout, Maximize, Minimize, Skull, ShieldAlert, X } from 'lucide-react';
import { Density } from '../types';

interface SettingsProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
  density: Density;
  onUpdateDensity: (density: Density) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onExport, onImport, onReset, density, onUpdateDensity }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  const handleExecuteReset = () => {
    if (resetConfirmText !== 'DELETE') return;
    setIsPurging(true);
    // Give the user 800ms to see the "PURGING..." state for better UX feedback
    setTimeout(() => {
        onReset();
    }, 800);
  };

  const DensityButton = ({ mode, label, icon: Icon }: { mode: Density, label: string, icon: React.ElementType }) => (
      <button
        onClick={() => onUpdateDensity(mode)}
        className={`flex-1 p-4 border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 group relative overflow-hidden active:scale-95 ${
            density === mode 
            ? 'bg-white text-black border-white shadow-[4px_4px_0px_0px_#000] translate-x-[-2px] translate-y-[-2px]' 
            : 'bg-zinc-900 text-zinc-400 border-zinc-600 hover:border-primary-500 hover:text-white hover:shadow-[4px_4px_0px_0px_#ef4444] hover:translate-x-[-2px] hover:translate-y-[-2px]'
        }`}
      >
          <Icon className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${density === mode ? 'text-black' : 'group-hover:text-primary-500'}`} />
          <span className="font-bold uppercase text-xs tracking-wider font-mono">{label}</span>
      </button>
  );

  return (
    <div className="space-y-12 animate-slide-up">
      {/* Appearance Settings */}
      <div className="bg-zinc-800 p-8 border-2 border-zinc-700 shadow-brutal hover:border-white transition-colors duration-300">
          <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-zinc-900 border-2 border-zinc-600 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                  <Layout className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Interface Density</h3>
                  <p className="text-zinc-400 font-mono text-xs mt-1 border-l-2 border-zinc-600 pl-2">Adjust visual compression protocols.</p>
              </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
              <DensityButton mode="spacious" label="Spacious" icon={Maximize} />
              <DensityButton mode="default" label="Default" icon={Layout} />
              <DensityButton mode="compact" label="Compact" icon={Minimize} />
          </div>
      </div>

      {/* Backup & Restore Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Card */}
        <div className="bg-zinc-800 p-8 border-2 border-zinc-700 shadow-brutal flex flex-col items-start hover:border-white transition-all duration-300 hover:shadow-brutal-lg hover:-translate-y-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileJson className="w-32 h-32 text-white transform rotate-12 translate-x-8 -translate-y-8" />
          </div>
          <div className="w-16 h-16 bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:border-primary-500 group-hover:bg-zinc-950 z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Download className="w-8 h-8 text-white group-hover:text-primary-500 transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase mb-2 tracking-tighter z-10">Export DB</h3>
          <p className="text-zinc-400 font-mono text-xs mb-8 leading-relaxed flex-1 border-l-2 border-zinc-600 pl-3 z-10">
            >> GENERATE FULL JSON DUMP.<br/>
            >> ARCHIVE ALL SYSTEM DATA.
          </p>
          <Button onClick={onExport} className="w-full z-10">
            <FileJson className="w-4 h-4 mr-2" />
            DOWNLOAD JSON
          </Button>
        </div>

        {/* Import Card */}
        <div className="bg-zinc-800 p-8 border-2 border-zinc-700 shadow-brutal flex flex-col items-start hover:border-white transition-all duration-300 hover:shadow-brutal-lg hover:-translate-y-1 group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database className="w-32 h-32 text-blue-500 transform -rotate-6 translate-x-8 -translate-y-8" />
          </div>
          <div className="w-16 h-16 bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:border-blue-500 group-hover:bg-zinc-950 z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Upload className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase mb-2 tracking-tighter z-10">Import DB</h3>
          <p className="text-zinc-400 font-mono text-xs mb-8 leading-relaxed flex-1 border-l-2 border-zinc-600 pl-3 z-10">
            >> RESTORE FROM BACKUP.<br/>
            >> INTELLIGENT MERGE ACTIVE.
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleFileChange}
            onClick={(e) => (e.currentTarget.value = '')}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full z-10 hover:border-blue-500 hover:text-blue-500">
            <Database className="w-4 h-4 mr-2" />
            SELECT FILE
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-red-600/10 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
        <div className="bg-zinc-900 p-8 border-4 border-red-600 shadow-[8px_8px_0px_0px_#dc2626] transition-transform duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_#dc2626] relative z-10">
            <div className="absolute top-0 right-0 p-2">
                <Skull className="w-24 h-24 text-red-900/20 group-hover:text-red-600/20 transition-colors rotate-12" />
            </div>
            
            <div className="flex flex-col sm:flex-row items-start gap-8 relative z-20">
            <div className="p-4 bg-red-600 border-4 border-black flex-shrink-0 shadow-[4px_4px_0px_0px_#000] animate-pulse-slow group-hover:animate-shake">
                <AlertTriangle className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1">
                <h3 className="text-3xl font-black text-white uppercase mb-2 tracking-tighter flex items-center gap-2">
                    Danger Zone
                    <span className="text-xs bg-red-600 text-black px-2 py-0.5 font-mono tracking-widest">LEVEL 5</span>
                </h3>
                <p className="text-zinc-400 font-mono text-sm mb-6 border-l-4 border-red-900 pl-4 py-2 bg-black/30">
                WARNING: SYSTEM RESET WILL PURGE ALL LOCAL DATA STORAGE.<br/>
                ACTION IS IRREVERSIBLE. PROCEED WITH EXTREME CAUTION.
                </p>
                <Button variant="danger" onClick={() => { setResetConfirmText(''); setShowResetModal(true); }} className="bg-red-600 text-black border-black hover:bg-white hover:text-red-600 w-full sm:w-auto font-black text-lg py-4 px-8 tracking-widest">
                INITIATE RESET PROTOCOL
                </Button>
            </div>
            </div>
        </div>
      </div>

      {/* Brutalist Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-black border-4 border-red-500 shadow-[20px_20px_0px_0px_#ef4444] p-8 flex flex-col relative animate-scale-in overflow-hidden">
                {/* Background Noise/Glitch effect simulation */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                
                {!isPurging && (
                    <button onClick={() => setShowResetModal(false)} className="absolute top-4 right-4 text-red-500 hover:text-white transition-colors">
                        <X className="w-8 h-8" />
                    </button>
                )}

                <div className="flex justify-center mb-6">
                    <ShieldAlert className={`w-20 h-20 text-red-500 ${isPurging ? 'animate-spin' : 'animate-pulse-fast'}`} />
                </div>

                <h2 className={`text-4xl font-black text-red-500 text-center uppercase tracking-tighter mb-2 ${isPurging ? 'animate-glitch' : ''}`} style={{textShadow: '2px 2px 0px white'}}>
                    {isPurging ? 'PURGING DATA...' : 'SYSTEM PURGE'}
                </h2>
                <div className="h-1 w-full bg-red-900 mb-6 flex">
                    <div className="h-full bg-red-500 w-2/3 animate-pulse"></div>
                    <div className="h-full bg-white w-1/3"></div>
                </div>

                <p className="text-white font-mono text-sm text-center mb-8 uppercase leading-relaxed border-2 border-red-900 bg-red-950/30 p-4">
                    <span className="text-red-400 font-bold">>> ALERT:</span> You are about to destroy all locally stored records.<br/><br/>
                    This process involves:<br/>
                    [1] Deletion of Student Database<br/>
                    [2] Erasure of Session Logs<br/>
                    [3] Factory Reset of Configuration<br/><br/>
                    <span className="text-white font-bold bg-red-600 px-1 text-black">THIS CANNOT BE UNDONE.</span>
                </p>

                {!isPurging && (
                    <div className="space-y-4 relative z-10">
                        <label className="block text-red-500 text-xs font-bold uppercase tracking-widest mb-2 text-center">
                            Type "DELETE" to confirm
                        </label>
                        <input 
                            type="text" 
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value.toUpperCase().trim())}
                            className="w-full bg-zinc-900 border-2 border-red-500 text-white text-center text-xl font-black p-4 outline-none focus:bg-black focus:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all font-mono placeholder-red-900"
                            placeholder="DELETE"
                            autoFocus
                        />
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Button 
                                variant="ghost" 
                                onClick={() => setShowResetModal(false)}
                                className="border-2 border-zinc-700 text-zinc-400 hover:text-white hover:border-white py-4"
                            >
                                ABORT
                            </Button>
                            <Button 
                                variant="danger" 
                                disabled={resetConfirmText !== 'DELETE'}
                                onClick={handleExecuteReset}
                                className="bg-red-600 text-black border-2 border-white hover:bg-white hover:text-red-600 py-4 shadow-[4px_4px_0px_0px_#fff]"
                            >
                                EXECUTE
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
