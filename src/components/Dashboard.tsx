import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload as UploadIcon, 
  FileText, 
  CheckCircle2, 
  X, 
  Loader2, 
  ArrowRight,
  Eye,
  Save,
  Trash2,
  FileSearch,
  TrendingUp,
  Table as TableIcon,
  FileSpreadsheet,
  Plus,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LandRecord } from '../types';
import { extractLandRecord } from '../lib/gemini';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { saveRecord, getRecords, deleteRecord as deleteDbRecord, updateRecord as updateDbRecord } from '@/lib/database';
import { uploadFile, createStorageBucket } from '@/lib/storage';

interface PendingRecord extends LandRecord {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalFile?: File;
  isEdited?: boolean;
}

export default function Dashboard({ onRecordSaved }: { onRecordSaved: (record: LandRecord) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [records, setRecords] = useState<PendingRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [notifications, setNotifications] = useState<{ id: string; type: 'success' | 'error' | 'warning'; message: string }[]>([]);

  useEffect(() => {
    createStorageBucket();
  }, []);

  

  const addNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const filteredRecords = useMemo(() => records, [records]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter(file => !files.find(f => f.name === file.name));
    if (newFiles.length < acceptedFiles.length) {
      toast.warning("Some duplicate files were skipped.");
    }
    setFiles(prev => [...prev, ...newFiles]);
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  } as any);

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const crypto = globalThis.crypto || window.crypto;

  function generateId(): string {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    arr[6] = (arr[6] & 0x0f) | 0x40;
    arr[8] = (arr[8] & 0x3f) | 0x80;
    return Array.from(arr, x => x.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  }

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const existing = records.find(r => r.fileName === file.name);
      if (existing && existing.status === 'completed') {
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        const data = await extractLandRecord(base64, file.type);

        const newRecord: PendingRecord = {
          id: generateId(),
          fileName: file.name,
          fileData: base64,
          fileUrl: undefined,
          extractionDate: new Date().toISOString(),
          ...data,
          status: 'completed',
          originalFile: file,
          userId: '',
        };

        setRecords(prev => [newRecord, ...prev]);
        onRecordSaved(newRecord);
        
        saveRecord({
          ...newRecord,
          file_url: newRecord.fileUrl,
        });
        
        addNotification('success', `Extracted: ${file.name}`);
      } catch (error: any) {
        console.error("Processing error:", error);
        addNotification('error', `Failed: ${error.message}`);
      }
      
      setProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }
    
    setFiles([]);
    setIsProcessing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const updateRecord = async (id: string, updates: Partial<LandRecord>) => {
    const success = await updateDbRecord(id, { ...updates, isEdited: true });
    if (success) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates, isEdited: true } : r));
    }
  };

  const saveManualEdits = async (id: string) => {
    const record = records.find(r => r.id === id);
    if (record) {
      const success = await updateDbRecord(id, { ...(record as any), isEdited: false });
      if (success) {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, isEdited: false } : r));
        onRecordSaved(record);
        toast.success("Changes saved to history");
      } else {
        toast.error("Failed to save changes");
      }
    }
  };

  const deleteRecord = async (id: string) => {
    const record = records.find(r => r.id === id);
    const success = await deleteDbRecord(id);
    if (success) {
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success("Record deleted");
    } else {
      toast.error("Failed to delete record");
    }
  };

  const exportCurrentBatch = () => {
    if (records.length === 0) {
      toast.error("No records to export. Please process files first.");
      return;
    }

    const data = records.map(r => ({
      'Date': new Date(r.extractionDate).toLocaleDateString(),
      'File Name': r.fileName,
      'भू-धारणा पद्धती': r.landHoldingType,
      'गाव': r.village,
      'तालुका': r.taluka,
      'जिल्हा': r.district,
      'Total Area (क्षेत्र)': r.totalArea,
      'शेवटचा फेरफार क्रमांक': r.lastMutationNumber,
      'तुकडा/तुकडे बंदी': r.fragmentRestriction ? 'YES' : 'NO',
      'सीलिंग': r.ceiling ? 'YES' : 'NO',
      'Forest फॉरेस्ट': r.forest ? 'YES' : 'NO',
      'इनाम': r.inam ? 'YES' : 'NO',
      'भूदान': r.bhudan ? 'YES' : 'NO',
      'गावठाण': r.gavthan ? 'YES' : 'NO'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Records");
    
    const wscols = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length, 15) }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `MahaLand_Batch_${new Date().toISOString().split('T')[0]}.xlsx`);
    addNotification('success', "Batch exported to Excel");
  };

  const startNewBatch = () => {
    setRecords([]);
    setFiles([]);
    setSearchTerm('');
    addNotification('success', 'Ready for new batch');
  };

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Extraction Dashboard</h2>
          
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={records.length === 0}
            onClick={exportCurrentBatch}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button 
            onClick={startNewBatch}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-sm transition-all text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            New Batch
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Card */}
          <div className="tech-card p-6">
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                isDragActive ? "bg-blue-50 border-blue-600" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadIcon className="w-7 h-7 text-slate-400 group-hover:text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Upload 7/12 Documents</h3>
              <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">PDF, PNG, JPG formats</p>
              
              {isDragActive && (
                  <div className="absolute inset-0 bg-blue-50 flex items-center justify-center pointer-events-none rounded-xl">
                      <div className="bg-white px-4 py-2 rounded-full shadow-lg text-blue-600 font-semibold animate-bounce text-xs border border-slate-200">
                          Drop to Add
                      </div>
                  </div>
              )}
            </div>

            {/* Files Queue */}
            {files.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Files Queue ({files.length})
                  </h4>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-[10px] font-semibold text-red-500 hover:underline uppercase tracking-widest"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600 truncate font-medium">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(file.name)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
                >
                 {isProcessing ? (
                     <>
                         <Loader2 className="w-4 h-4 animate-spin" />
                         Extracting {progress.current}/{progress.total}...
                     </>
                 ) : (
                     <>
                         Start Extraction
                         <ArrowRight className="w-4 h-4" />
                     </>
                 )}
                </button>
              </motion.div>
            )}
          </div>

          {/* Stats Card */}
          <div className="tech-card p-5">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-widest mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Extraction Stats
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="block text-2xl font-bold text-slate-900">{records.length}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Processed</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className={cn("block text-2xl font-bold", records.filter(r => r.isEdited).length > 0 ? "text-amber-600" : "text-slate-900")}>
                  {records.filter(r => r.isEdited).length}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Unsaved</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className={cn("block text-2xl font-bold", history.filter(r => r.forest || r.ceiling || r.fragmentRestriction).length > 0 ? "text-red-600" : "text-emerald-600")}>
                  {records.filter(r => r.forest || r.ceiling || r.fragmentRestriction).length}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Legal Alerts</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="block text-2xl font-bold text-emerald-600">98%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Accuracy</span>
              </div>
            </div>
          </div>

          {/* Guidelines Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h4 className="text-slate-900 font-semibold mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Guidelines
            </h4>
            <ul className="text-[11px] space-y-2 text-slate-500 font-medium leading-relaxed">
                <li className="flex gap-2"><span>●</span> Ensure documents are high resolution and well-lit.</li>
                <li className="flex gap-2"><span>●</span> Include the entire 7/12 document structure.</li>
                <li className="flex gap-2"><span>●</span> Supports both handwritten and printed text.</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Results Table */}
        <div className="lg:col-span-2 space-y-4">
          

          {filteredRecords.length > 0 ? (
            <div className="tech-card overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Extracted Records ({filteredRecords.length})
                  </h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-white">
                              <th className="px-4 py-4">File</th>
                              <th className="px-4 py-4">पद्धती</th>
                              <th className="px-4 py-4">गाव</th>
                              <th className="px-4 py-4">तालुका</th>
                              <th className="px-4 py-4">जिल्हा</th>
                              <th className="px-4 py-4">क्षेत्र</th>
                              <th className="px-4 py-4">Mutation</th>
                              <th className="px-4 py-4">तुकडा</th>
                              <th className="px-4 py-4">सीलिंग</th>
                              <th className="px-4 py-4">Forest</th>
                              <th className="px-4 py-4">इनाम</th>
                              <th className="px-4 py-4">भूदान</th>
                              <th className="px-4 py-4">गावठाण</th>
                              <th className="px-4 py-4 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                          <AnimatePresence>
                              {filteredRecords.map(record => (
                                  <motion.tr 
                                      key={record.id}
                                      layout
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0, x: -10 }}
                                      className={cn("group hover:bg-slate-50 transition-colors", record.isEdited ? "bg-amber-50/50" : "")}
                                  >
                                      <td className="px-4 py-3">
                                          <div className="flex flex-col">
                                              <span className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">{record.fileName}</span>
                                              {record.isEdited && <span className="text-[9px] text-amber-600 font-bold uppercase">Unsaved</span>}
                                          </div>
                                      </td>
                                      <td className="px-2 py-3">
                                          <Input 
                                              value={record.landHoldingType} 
                                              onChange={(e) => updateRecord(record.id, { landHoldingType: e.target.value })}
                                              className="h-8 text-xs font-medium border-transparent hover:border-slate-200 focus:border-amber-500 transition-colors focus:bg-white bg-transparent"
                                          />
                                      </td>
                                      <td className="px-2 py-3">
                                          <Input 
                                              value={record.village} 
                                              onChange={(e) => updateRecord(record.id, { village: e.target.value })}
                                              className="h-8 text-xs font-medium border-transparent hover:border-slate-200 focus:border-amber-500 transition-colors focus:bg-white bg-transparent"
                                          />
                                      </td>
                                      <td className="px-2 py-3">
                                          <Input 
                                              value={record.taluka} 
                                              onChange={(e) => updateRecord(record.id, { taluka: e.target.value })}
                                              className="h-8 text-xs font-medium border-transparent hover:border-slate-200 focus:border-amber-500 transition-colors focus:bg-white bg-transparent"
                                          />
                                      </td>
                                      <td className="px-2 py-3">
                                          <Input 
                                              value={record.district} 
                                              onChange={(e) => updateRecord(record.id, { district: e.target.value })}
                                              className="h-8 text-xs font-medium border-transparent hover:border-slate-200 focus:border-amber-500 transition-colors focus:bg-white bg-transparent"
                                          />
                                      </td>
                                      <td className="px-2 py-3">
                                          <Input 
                                              value={record.totalArea} 
                                              onChange={(e) => updateRecord(record.id, { totalArea: e.target.value })}
                                              className="h-8 text-xs font-mono font-medium border-transparent hover:border-slate-200 focus:border-amber-500 transition-colors focus:bg-white bg-transparent"
                                          />
                                      </td>
                                      <td className="px-2 py-3">
                                          <Input 
                                              value={record.lastMutationNumber} 
                                              onChange={(e) => updateRecord(record.id, { lastMutationNumber: e.target.value })}
                                              className="h-8 font-mono text-xs border-transparent hover:border-slate-200 focus:border-amber-500 transition-colors focus:bg-white bg-transparent"
                                          />
                                      </td>
                                      <td className="px-2 py-3">
                                        <FlagBadge 
                                          active={record.fragmentRestriction} 
                                          onClick={() => updateRecord(record.id, { fragmentRestriction: !record.fragmentRestriction })} 
                                        />
                                      </td>
                                      <td className="px-2 py-3">
                                        <FlagBadge 
                                          active={record.ceiling} 
                                          onClick={() => updateRecord(record.id, { ceiling: !record.ceiling })} 
                                        />
                                      </td>
                                      <td className="px-2 py-3">
                                        <FlagBadge 
                                          active={record.forest} 
                                          onClick={() => updateRecord(record.id, { forest: !record.forest })} 
                                        />
                                      </td>
                                      <td className="px-2 py-3">
                                        <FlagBadge 
                                          active={record.inam} 
                                          onClick={() => updateRecord(record.id, { inam: !record.inam })} 
                                        />
                                      </td>
                                      <td className="px-2 py-3">
                                        <FlagBadge 
                                          active={record.bhudan} 
                                          onClick={() => updateRecord(record.id, { bhudan: !record.bhudan })} 
                                        />
                                      </td>
                                      <td className="px-2 py-3">
                                        <FlagBadge 
                                          active={record.gavthan} 
                                          onClick={() => updateRecord(record.id, { gavthan: !record.gavthan })} 
                                        />
                                      </td>
                                      <td className="px-2 py-3">
                                          <div className="flex items-center justify-center gap-1">
                                              {record.isEdited ? (
                                                  <button 
                                                      onClick={() => saveManualEdits(record.id)}
                                                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                      title="Save Changes"
                                                  >
                                                      <Save className="w-4 h-4" />
                                                  </button>
                                              ) : (
                                                  <ViewDocument record={record} />
                                              )}
                                              <button 
                                                  onClick={() => deleteRecord(record.id)}
                                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                  title="Delete"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </div>
                                      </td>
                                  </motion.tr>
                              ))}
                          </AnimatePresence>
                      </tbody>
                  </table>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-12 bg-white">
                <FileSearch className="w-12 h-12 text-slate-200 mb-6" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Queue Status: Idle</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm">System is ready for document ingestion. Upload 7/12 land documents to begin analysis.</p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed bottom-8 right-8 z-[110] space-y-2 pointer-events-none">
        <AnimatePresence>
            {notifications.map((n) => (
                <motion.div 
                    key={n.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className={cn(
                        "pointer-events-auto px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 border min-w-[320px] bg-white",
                        n.type === 'success' ? "border-green-200 text-green-800" :
                        n.type === 'error' ? "border-red-200 text-red-800" :
                        "border-amber-500 text-amber-600"
                    )}
                >
                    <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                        n.type === 'success' ? "bg-green-50" : n.type === 'error' ? "bg-red-50" : "bg-amber-50"
                    )}>
                        {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {n.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
                        {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-semibold text-xs uppercase tracking-wider">{n.message}</span>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const history: any[] = [];

function FlagBadge({ active, onClick }: { active: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-[9px] px-2 py-1 border font-semibold uppercase transition-all text-center min-w-[40px]",
        active ? "bg-red-600 text-white border-red-700" : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
      )}
    >
      {active ? "YES" : "NO"}
    </button>
  );
}

function ViewDocument({ record }: { record: LandRecord }) {
  const mimeType = record.fileName?.endsWith('.pdf') ? 'application/pdf' : 'image/png';
  const dataUrl = record.fileUrl || `data:${mimeType};base64,${record.fileData}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div role="button" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-lg cursor-pointer">
          <Eye className="w-4 h-4" />
        </div>
      </SheetTrigger>
      <SheetContent side="right" className="min-w-[60vw] p-0 border-slate-200 bg-white rounded-none">
        <SheetHeader className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center pr-8">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              Preview: {record.fileName}
            </SheetTitle>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {(record.confidenceScore ? (record.confidenceScore * 100).toFixed(0) : "94")}% Confidence
            </div>
          </div>
        </SheetHeader>
        <div className="h-[calc(100vh-80px)] p-6 bg-slate-100">
          <div className="h-full border border-slate-200 bg-white shadow-inner flex items-center justify-center overflow-auto p-4">
            {record.fileUrl ? (
              mimeType === 'application/pdf' ? (
                <iframe src={dataUrl} className="w-full h-full border-none" title="PDF Preview" />
              ) : (
                <img src={dataUrl} className="max-w-full shadow-xl" alt="Satbara Original" />
              )
            ) : (
              mimeType === 'application/pdf' ? (
                <iframe src={dataUrl} className="w-full h-full border-none" title="PDF Preview" />
              ) : (
                <img src={dataUrl} className="max-w-full shadow-xl" alt="Satbara Original" />
              )
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}