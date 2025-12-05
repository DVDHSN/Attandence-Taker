
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ChevronRight, Terminal, HelpCircle } from 'lucide-react';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'dashboard' | 'attendance' | 'students' | 'settings';
}

const tutorialContent = {
  dashboard: {
    title: 'COMMAND CENTER',
    steps: [
      {
        title: 'STATS OVERVIEW',
        text: 'Top row cards show real-time metrics. Track total students, sessions, and attendance rates instantly.'
      },
      {
        title: 'DATA VISUALIZATION',
        text: 'The main chart visualizes attendance trends. Use dropdowns to filter by Month or View (Present/Absent).'
      },
      {
        title: 'QUICK ACTIONS',
        text: 'Check upcoming Birthdays and review Recent Sessions history on the right panel.'
      }
    ]
  },
  attendance: {
    title: 'SESSION PROTOCOL',
    steps: [
      {
        title: 'SETUP SESSION',
        text: 'Mandatory: Select a Date. Optional: Add a Topic. Cannot save duplicates for the same date.'
      },
      {
        title: 'MARKING STATUS',
        text: 'CLICK cards to toggle status. GREEN = Present. RED = Absent. GREY = Unmarked.'
      },
      {
        title: 'COMMIT DATA',
        text: 'Hit SAVE to write to database. All students must be marked before saving.'
      }
    ]
  },
  students: {
    title: 'ROSTER MANAGEMENT',
    steps: [
      {
        title: 'ADD RECRUITS',
        text: 'Use the top form to add single students. Enable "Auto-Assign" to sort into classes based on age.'
      },
      {
        title: 'BULK OPERATIONS',
        text: 'Use "Bulk Import" to upload CSVs. Select multiple students in the list to Delete or Move classes in batches.'
      },
      {
        title: 'CLASS CONFIG',
        text: 'Open the "Classes" panel to add new groups or edit age ranges for auto-assignment.'
      }
    ]
  },
  settings: {
    title: 'DATA CONTROL',
    steps: [
      {
        title: 'EXPORT DATA',
        text: 'Generate a full JSON dump of your database. Keep this safe.'
      },
      {
        title: 'IMPORT DATA',
        text: 'Restore from backup. Smart merge will update existing IDs and add new records.'
      },
      {
        title: 'RESET SYSTEM',
        text: 'The Danger Zone. Wipes local storage completely. Irreversible.'
      }
    ]
  }
};

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose, view }) => {
  if (!isOpen) return null;

  const content = tutorialContent[view];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-zinc-900 border-4 border-primary-500 shadow-[8px_8px_0px_0px_#ef4444] relative flex flex-col animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Brutalist Style */}
        <div className="bg-primary-500 p-4 border-b-4 border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-zinc-900 p-1">
                    <Terminal className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">
                    MANUAL // {content.title}
                </h2>
            </div>
            <button 
                onClick={onClose}
                className="bg-zinc-900 text-white p-1 hover:bg-white hover:text-zinc-900 transition-colors border-2 border-transparent hover:border-zinc-900"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 bg-zinc-900">
            <div className="grid gap-6">
                {content.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-6 group">
                        <div className="flex-shrink-0 w-12 h-12 bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-bold text-primary-500 shadow-[4px_4px_0px_0px_#3f3f46] group-hover:shadow-[4px_4px_0px_0px_#ef4444] group-hover:border-primary-500 group-hover:text-white group-hover:bg-primary-500 transition-all duration-200">
                            {idx + 1}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-1 decoration-primary-500 underline decoration-2 underline-offset-4">
                                {step.title}
                            </h3>
                            <p className="text-zinc-400 font-mono text-sm leading-relaxed">
                                {step.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-4 border-zinc-800 bg-zinc-900/50 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-primary-500 text-white px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-primary-600 hover:shadow-[4px_4px_0px_0px_#ffffff] transition-all active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#ffffff]"
            >
                ACKNOWLEDGED
            </button>
        </div>
      </div>
    </div>
  );
};
