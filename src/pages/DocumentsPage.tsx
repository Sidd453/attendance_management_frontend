import { useEffect, useRef, useState } from 'react';
import { FileText, Download, Upload, Trash2, Receipt, FileSignature, Award, File as FileIcon } from 'lucide-react';
import { Card, Button, Modal, Input, Select, EmptyState, ConfirmDialog, TableSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { isAdminRole } from '@/lib/roles';

interface DocumentItem {
  id: string;
  employeeName: string;
  title: string;
  type: 'payslip' | 'offer-letter' | 'appointment-letter' | 'experience-letter' | 'other';
  period: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: string;
}

interface EmployeeOption {
  id: string;
  employeeId: string;
  name: string;
}

const typeMeta: Record<DocumentItem['type'], { label: string; icon: typeof FileText }> = {
  payslip: { label: 'Payslip', icon: Receipt },
  'offer-letter': { label: 'Offer Letter', icon: FileSignature },
  'appointment-letter': { label: 'Appointment Letter', icon: FileSignature },
  'experience-letter': { label: 'Experience Letter', icon: Award },
  other: { label: 'Other', icon: FileIcon },
};

function formatSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const admin = isAdminRole(user?.role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [form, setForm] = useState({ employeeId: '', title: '', type: 'payslip' as DocumentItem['type'], period: '', file: null as File | null });

  const load = () => {
    setLoading(true);
    api.documents
      .list()
      .then((res) => setDocs((res.data ?? []) as DocumentItem[]))
      .catch(() => toast('Failed to load documents. Is the backend running?', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (admin) {
      api.employees.list({ limit: '1000' }).then((res) => {
        const items = (res.data?.items ?? res.data ?? []) as EmployeeOption[];
        setEmployees(items);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const res = await api.documents.download(doc.id);
      const { fileData, fileName, mimeType } = res.data as { fileData: string; fileName: string; mimeType: string };
      const link = document.createElement('a');
      link.href = `data:${mimeType};base64,${fileData}`;
      link.download = fileName;
      link.click();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Download failed', 'error');
    }
  };

  const handleUpload = async () => {
    if (!form.employeeId || !form.title.trim() || !form.file) {
      toast('Select an employee, title, and file', 'error');
      return;
    }
    setUploading(true);
    try {
      const fileData = await fileToBase64(form.file);
      await api.documents.upload({
        employeeId: form.employeeId,
        title: form.title,
        type: form.type,
        period: form.period,
        fileName: form.file.name,
        mimeType: form.file.type || 'application/pdf',
        fileData,
      });
      setUploadOpen(false);
      setForm({ employeeId: '', title: '', type: 'payslip', period: '', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast('Document uploaded', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.documents.delete(deleteTarget.id);
      toast('Document deleted', 'success');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
            {admin ? 'Documents' : 'My Documents'}
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {admin ? 'Upload and manage payslips, offer letters & other employee documents' : 'Download your payslips, offer letter & other documents'}
          </p>
        </div>
        {admin && <Button onClick={() => setUploadOpen(true)}><Upload className="h-4 w-4" /> Upload Document</Button>}
      </div>

      <Card>
        {loading ? (
          <div className="p-4"><TableSkeleton rows={5} cols={4} /></div>
        ) : docs.length === 0 ? (
          <EmptyState icon={<FileText className="h-7 w-7" />} title="No documents yet" description={admin ? 'Upload a payslip or letter to get started.' : 'Your HR team will add payslips and letters here.'} />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {docs.map((doc) => {
              const meta = typeMeta[doc.type] || typeMeta.other;
              return (
                <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                    <meta.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{doc.title}</p>
                    <p className="text-xs text-ink-400">
                      {meta.label}{doc.period ? ` · ${doc.period}` : ''}{admin ? ` · ${doc.employeeName}` : ''} · {new Date(doc.createdAt).toLocaleDateString()}{doc.fileSizeBytes ? ` · ${formatSize(doc.fileSizeBytes)}` : ''}
                    </p>
                  </div>
                  <button onClick={() => handleDownload(doc)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800" title="Download">
                    <Download className="h-4 w-4" />
                  </button>
                  {admin && (
                    <button onClick={() => setDeleteTarget(doc)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document" description="Add a payslip, offer letter, or other document for an employee" footer={<><Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button><Button onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button></>}>
        <div className="space-y-4">
          <Select label="Employee" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} options={[{ value: '', label: 'Select employee...' }, ...employees.map((e) => ({ value: e.employeeId, label: `${e.name} (${e.employeeId})` }))]} />
          <Select label="Document Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentItem['type'] })} options={Object.entries(typeMeta).map(([value, m]) => ({ value, label: m.label }))} />
          <Input label="Title" placeholder="e.g. Payslip — August 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          {form.type === 'payslip' && (
            <Input label="Pay Period" type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">File (PDF, max 5MB)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-300"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This can't be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
