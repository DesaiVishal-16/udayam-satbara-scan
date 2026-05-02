import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash,
  Eye, 
  Calendar,
  FileSpreadsheet,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LandRecord } from '../types';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function HistoryView({ records, onDelete, loading }: { 
  records: LandRecord[], 
  onDelete: (id: string) => void,
  loading?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('all');
  const [holdingFilter, setHoldingFilter] = useState('all');
  const [fragmentFilter, setFragmentFilter] = useState('all');
  const [ceilingFilter, setCeilingFilter] = useState('all');
  const [forestFilter, setForestFilter] = useState('all');

  const villages = useMemo(() => {
    const set = new Set(records.map(r => (r.village || '').trim()).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const holdingTypes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const record of records) {
      const val = (record.landHoldingType || '').trim().replace(/\s+/g, ' ');
      const key = val.toLowerCase().replace(/\s+/g, '');
      if (val && !seen.has(key)) {
        seen.set(key, val);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'mr'));
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const v = (record.village || '').toLowerCase();
      const t = (record.taluka || '').toLowerCase();
      const d = (record.district || '').toLowerCase();
      const f = (record.fileName || '').toLowerCase();
      const s = searchTerm.toLowerCase();

      const matchesSearch = v.includes(s) || t.includes(s) || d.includes(s) || f.includes(s);
      const matchesVillage = villageFilter === 'all' || (record.village || '').toLowerCase() === villageFilter.toLowerCase();
      const matchesHolding = holdingFilter === 'all' || ((record.landHoldingType || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/\s+/g, '') === holdingFilter.toLowerCase().replace(/\s+/g, ''));
      const matchesFragment = fragmentFilter === 'all' || (fragmentFilter === 'yes' ? record.fragmentRestriction : !record.fragmentRestriction);
      const matchesCeiling = ceilingFilter === 'all' || (ceilingFilter === 'yes' ? record.ceiling : !record.ceiling);
      const matchesForest = forestFilter === 'all' || (forestFilter === 'yes' ? record.forest : !record.forest);

      return matchesSearch && matchesVillage && matchesHolding && matchesFragment && matchesCeiling && matchesForest;
    });
  }, [records, searchTerm, villageFilter, holdingFilter, fragmentFilter, ceilingFilter, forestFilter]);

  const stats = useMemo(() => ({
    total: records.length,
    withAlerts: records.filter(r => r.forest || r.ceiling || r.fragmentRestriction).length,
    villages: new Set(records.map(r => r.village)).size,
  }), [records]);

  const exportToExcel = () => {
    if (records.length === 0) {
      toast.error("No records to export");
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Land Records");
    
    const wscols = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length, 15) }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `SatbaraScan_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel exported successfully");
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="tech-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Total Records</span>
          </div>
        </div>
        <div className="tech-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-red-600">{stats.withAlerts}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Legal Alerts</span>
          </div>
        </div>
        <div className="tech-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-emerald-600">{stats.total - stats.withAlerts}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Clear Records</span>
          </div>
        </div>
        <div className="tech-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Eye className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <span className="block text-2xl font-bold text-slate-900">{stats.villages}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider">Villages</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Record History</h2>
          <p className="text-slate-500 text-sm mt-1">Browse and manage all extracted land records</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="tech-card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search village, taluka, file..." 
              className="pl-10 h-10 border-slate-200 text-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={villageFilter} onValueChange={setVillageFilter}>
            <SelectTrigger className="w-[160px] h-10 border-slate-200 text-sm">
              <SelectValue placeholder="All Villages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Villages</SelectItem>
              {villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={holdingFilter} onValueChange={setHoldingFilter}>
            <SelectTrigger className="w-[160px] h-10 border-slate-200 text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {holdingTypes.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Filters:</span>
            <Select value={fragmentFilter} onValueChange={setFragmentFilter}>
              <SelectTrigger className="w-[100px] h-9 border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">तुकडा</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ceilingFilter} onValueChange={setCeilingFilter}>
              <SelectTrigger className="w-[100px] h-9 border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सीलिंग</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            <Select value={forestFilter} onValueChange={setForestFilter}>
              <SelectTrigger className="w-[100px] h-9 border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Forest</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="tech-card p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="tech-card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-400 mb-1">No records found</h3>
          <p className="text-sm text-slate-400">Upload and process files first</p>
        </div>
      ) : (
        <div className="tech-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-slate-50">
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
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(record => (
                  <tr key={record.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{record.fileName}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(record.extractionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{record.landHoldingType}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{record.village}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.taluka}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.district}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-700">{record.totalArea}</td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-600">#{record.lastMutationNumber}</td>
                    <td className="px-4 py-3"><StatusBadge active={record.fragmentRestriction} /></td>
                    <td className="px-4 py-3"><StatusBadge active={record.ceiling} /></td>
                    <td className="px-4 py-3"><StatusBadge active={record.forest} /></td>
                    <td className="px-4 py-3"><StatusBadge active={record.inam} /></td>
                    <td className="px-4 py-3"><StatusBadge active={record.bhudan} /></td>
                    <td className="px-4 py-3"><StatusBadge active={record.gavthan} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <ViewDocument record={record} />
                        <button 
                          onClick={() => onDelete(record.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && filteredRecords.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <div className={cn(
      "text-[10px] px-2 py-1 rounded-full font-semibold text-center min-w-[40px]",
      active ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
    )}>
      {active ? "Yes" : "No"}
    </div>
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
              Archive: {record.fileName}
            </SheetTitle>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Extracted {new Date(record.extractionDate).toLocaleDateString()}
            </div>
          </div>
        </SheetHeader>
        <div className="h-[calc(100vh-80px)] p-6 bg-slate-100">
          <div className="h-full border border-slate-200 bg-white shadow-inner flex items-center justify-center overflow-auto p-4">
            {mimeType === 'application/pdf' ? (
              <iframe src={dataUrl} className="w-full h-full border-none" title="PDF Preview" />
            ) : (
              <img src={dataUrl} className="max-w-full shadow-xl" alt="Satbara Archive" />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}