import { useEffect, useState } from 'react';
import { FileText, Download, Printer, FileBarChart, CalendarCheck, CalendarDays, Clock, ChevronRight } from 'lucide-react';
import { Card, Button, Input, Select } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const reportCategories = [
  {
    title: 'Attendance Reports',
    icon: CalendarCheck,
    color: 'text-brand-600 bg-brand-50 dark:bg-brand-500/10',
    reports: ['Daily Attendance', 'Weekly Attendance', 'Monthly Attendance', 'Employee Attendance', 'Department Attendance', 'Late Arrival Report', 'Absence Report'],
  },
  {
    title: 'Leave Reports',
    icon: CalendarDays,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
    reports: ['Leave Summary', 'Employee Leave Report', 'Department Leave Report'],
  },
  {
    title: 'Working Hours',
    icon: Clock,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
    reports: ['Daily Working Hours', 'Overtime Report', 'Productivity Report'],
  },
];

interface AttendanceRow {
  employeeName: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hours: number;
  status: string;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const toast = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 86400000 * 30).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [deptFilter, setDeptFilter] = useState('all');
  const [empFilter, setEmpFilter] = useState('all');
  const [exporting, setExporting] = useState<'pdf' | 'csv' | 'print' | null>(null);

  useEffect(() => {
    api.departments.list().then((res) => setDepartments((res.data ?? []) as { id: string; name: string }[])).catch(() => {});
    api.employees.list({ limit: '1000' }).then((res) => {
      const items = (res.data?.items ?? res.data ?? []) as { id: string; name: string }[];
      setEmployees(items);
    }).catch(() => {});
  }, []);

  const fetchReportRows = async (): Promise<AttendanceRow[]> => {
    const deptName = departments.find((d) => d.id === deptFilter)?.name;
    const res = await api.attendance.list({
      startDate,
      endDate,
      limit: '1000',
      page: '1',
      ...(deptFilter !== 'all' && deptName ? { department: deptName } : {}),
      ...(empFilter !== 'all' ? { employeeId: empFilter } : {}),
    });
    return (res.data?.items ?? []) as AttendanceRow[];
  };

  const handleExportCSV = async () => {
    setExporting('csv');
    try {
      const rows = await fetchReportRows();
      if (rows.length === 0) { toast('No records found for the selected filters', 'info'); return; }
      const header = ['Employee', 'Department', 'Date', 'Check In', 'Check Out', 'Hours', 'Status'];
      const lines = [header.join(',')];
      for (const r of rows) {
        lines.push([r.employeeName, r.department, r.date, r.checkIn ?? '—', r.checkOut ?? '—', String(r.hours ?? 0), r.status]
          .map((v) => csvEscape(String(v))).join(','));
      }
      downloadBlob(`${(selected || 'attendance').toLowerCase().replace(/\s+/g, '-')}-${startDate}-to-${endDate}.csv`, lines.join('\n'), 'text/csv');
      toast(`CSV exported — ${rows.length} record${rows.length !== 1 ? 's' : ''}`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to export CSV', 'error');
    } finally {
      setExporting(null);
    }
  };

  const openPrintView = async () => {
    const rows = await fetchReportRows();
    const win = window.open('', '_blank');
    if (!win) { toast('Please allow pop-ups to export as PDF', 'error'); return null; }
    const tableRows = rows.length
      ? rows.map((r) => `<tr><td>${r.employeeName}</td><td>${r.department}</td><td>${r.date}</td><td>${r.checkIn ?? '—'}</td><td>${r.checkOut ?? '—'}</td><td>${r.hours ?? 0}</td><td>${r.status}</td></tr>`).join('')
      : '<tr><td colspan="7" style="text-align:center;color:#888;padding:24px;">No records found for the selected filters</td></tr>';
    win.document.write(`<!doctype html><html><head><title>${selected || 'Report'}</title>
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 32px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 2px; }
        p.sub { color: #666; margin-top: 0; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        th { background: #f5f5f5; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>${selected || 'Attendance Report'}</h1>
      <p class="sub">${startDate} to ${endDate} · Srujan Infotech</p>
      <table><thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
      </body></html>`);
    win.document.close();
    return win;
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const win = await openPrintView();
      if (win) {
        win.onload = () => win.print();
        setTimeout(() => win.print(), 300);
        toast('Opened print dialog — choose "Save as PDF" as the destination', 'info');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to prepare PDF', 'error');
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = async () => {
    setExporting('print');
    try {
      const win = await openPrintView();
      if (win) setTimeout(() => win.print(), 300);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to prepare print view', 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">Reports Center</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Generate and export detailed attendance reports</p>
      </div>

      {/* Report categories */}
      <div className="grid gap-4 lg:grid-cols-3">
        {reportCategories.map((cat) => (
          <Card key={cat.title} className="p-5">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', cat.color)}>
                <cat.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">{cat.title}</h2>
            </div>
            <div className="mt-4 space-y-1">
              {cat.reports.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                    selected === r ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800'
                  )}
                >
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-ink-400" /> {r}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Report configuration */}
      {selected && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">{selected}</h2>
              <p className="text-xs text-ink-500 dark:text-ink-400">Configure and export your report</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Select label="Department" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} options={[{ value: 'all', label: 'All Departments' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} />
            <Select label="Employee" value={empFilter} onChange={(e) => setEmpFilter(e.target.value)} options={[{ value: 'all', label: 'All Employees' }, ...employees.map((e) => ({ value: e.id, label: e.name }))]} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleExportPDF} disabled={exporting !== null}>{exporting === 'pdf' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Download className="h-4 w-4" />} Export PDF</Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={exporting !== null}>{exporting === 'csv' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-ink-600" /> : <Download className="h-4 w-4" />} Export CSV</Button>
            <Button variant="outline" onClick={handlePrint} disabled={exporting !== null}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
