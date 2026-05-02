import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  History as HistoryIcon,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import Dashboard from './components/Dashboard';
import { HistoryView } from './components/History';
import { ViewMode, LandRecord } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { getRecords, deleteRecord as deleteDbRecord } from '@/lib/database';
import { Logo, LogoIcon, SecureBadge } from './components/Branding';

export default function App() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [history, setHistory] = useState<LandRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadInitialRecords();
  }, []);

  const loadInitialRecords = async () => {
    try {
      const records = await getRecords();
      const mapped: LandRecord[] = records.map(r => ({
        id: r.id,
        fileName: r.fileName,
        fileUrl: r.file_url || undefined,
        fileData: r.fileData,
        extractionDate: r.extractionDate,
        landHoldingType: r.landHoldingType,
        village: r.village,
        taluka: r.taluka,
        district: r.district,
        lastMutationNumber: r.lastMutationNumber,
        fragmentRestriction: r.fragmentRestriction,
        ceiling: r.ceiling,
        forest: r.forest,
        inam: r.inam,
        bhudan: r.bhudan,
        gavthan: r.gavthan,
        totalArea: r.totalArea,
        userId: r.userId,
        rawText: r.rawText,
        confidenceScore: r.confidenceScore,
      }));
      setHistory(mapped);
    } catch (err) {
      console.error('Failed to load initial records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = (record: LandRecord) => {
    const recordWithId = { ...record, id: record.id || Date.now().toString() };
    setHistory(prev => {
      const exists = prev.find(r => r.id === recordWithId.id);
      if (exists) return prev.map(r => r.id === recordWithId.id ? recordWithId : r);
      return [recordWithId, ...prev];
    });
  };

  const deleteFromHistory = async (id: string) => {
    const success = await deleteDbRecord(id);
    if (success) {
      setHistory(prev => prev.filter(r => r.id !== id));
      toast.success("Record deleted");
    } else {
      setHistory(prev => prev.filter(r => r.id !== id));
      toast.success("Record removed from view");
    }
  };

  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'Dashboard', labelHi: 'डॅशबोर्ड', icon: LayoutDashboard },
    { id: 'history' as ViewMode, label: 'History', labelHi: 'इतिहास', icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 w-full">
      <Toaster position="top-right" expand={true} richColors />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white text-slate-900 border-r border-slate-200 shadow-sm z-50 flex flex-col transition-transform duration-300",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "lg:w-20" : "lg:w-64",
        "w-64"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          {sidebarCollapsed ? (
            <div className="flex justify-center w-full">
              <LogoIcon className="h-8 w-auto" />
            </div>
          ) : (
            <Logo />
          )}
          <button 
            className="lg:hidden p-1 hover:bg-slate-100 rounded"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setMobileMenuOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                view === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && (
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{item.label}</span>
                  <span className="text-[10px] opacity-70">{item.labelHi}</span>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse Button - Desktop only */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex p-4 border-t border-slate-200 items-center justify-center hover:bg-slate-50 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex flex-col min-h-screen w-full",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 flex-shrink-0">
          <div className="flex justify-between items-center h-[73px] px-4 lg:px-6 w-full">
            <div className="flex items-center gap-3">
              <button 
                className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
                AI Powered Satbara Smart Scan
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Stats in header */}
              <div className="hidden md:flex items-center gap-4 mr-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-center">
                  <span className="block text-lg font-bold text-slate-900">{history.length}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Processed</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <span className={cn("block text-lg font-bold", history.some(r => r.forest || r.ceiling) ? "text-red-600" : "text-emerald-600")}>
                    {history.filter(r => r.forest || r.ceiling || r.fragmentRestriction).length}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Alerts</span>
                </div>
              </div>
              <SecureBadge />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 p-3 lg:p-6 w-full">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full w-full"
              >
                <Dashboard onRecordSaved={saveToHistory} />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full w-full flex flex-col"
              >
                <HistoryView records={history} onDelete={deleteFromHistory} loading={isLoading} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 flex-shrink-0 w-full">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} Udayam AI Labs. All rights reserved.
              </p>
              <a 
                href="https://udayam.co.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
              >
                Powered by Udayam AI Labs
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}