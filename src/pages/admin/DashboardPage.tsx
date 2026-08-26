import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import type { Application, AdminNote } from '@/lib/types';
import {
  STATUS_FLOW,
  STATUS_LABELS,
  STATUS_COLORS,
  GENRES,
  GENDER_OPTIONS,
  EXPERIENCE_OPTIONS,
} from '@/lib/constants';
import type { ApplicationStatus } from '@/lib/constants';
import { exportToExcel, exportToCSV } from '@/lib/export';
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  ExternalLink,
  FileVideo,
  Loader2,
  Tag,
  Plus,
} from 'lucide-react';

type SortField = 'created_at' | 'full_name' | 'rating' | 'years_experience' | 'location';
type SortDir = 'asc' | 'desc';

interface Filters {
  gender: string;
  location: string;
  genre: string;
  experience: string;
  status: string;
  rating: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: Filters = {
  gender: '',
  location: '',
  genre: '',
  experience: '',
  status: '',
  rating: '',
  dateFrom: '',
  dateTo: '',
};

export function DashboardPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast('Failed to load applications', 'error');
    } else if (data) {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Get unique locations for filter dropdown
  const locations = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => { if (a.location) set.add(a.location); });
    return Array.from(set).sort();
  }, [applications]);

  // Apply search + filters
  const filtered = useMemo(() => {
    let result = [...applications];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.full_name?.toLowerCase().includes(q) ||
        a.dj_name?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.instagram?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filters.gender) result = result.filter((a) => a.gender === filters.gender);
    if (filters.location) result = result.filter((a) => a.location === filters.location);
    if (filters.genre) result = result.filter((a) => a.genres?.includes(filters.genre));
    if (filters.experience) result = result.filter((a) => a.years_experience === filters.experience);
    if (filters.status) result = result.filter((a) => a.status === filters.status);
    if (filters.rating) result = result.filter((a) => a.rating === parseInt(filters.rating));
    if (filters.dateFrom) result = result.filter((a) => new Date(a.created_at) >= new Date(filters.dateFrom));
    if (filters.dateTo) result = result.filter((a) => new Date(a.created_at) <= new Date(filters.dateTo + 'T23:59:59'));

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'full_name':
          cmp = a.full_name.localeCompare(b.full_name);
          break;
        case 'rating':
          cmp = a.rating - b.rating;
          break;
        case 'years_experience':
          cmp = (a.years_experience || '').localeCompare(b.years_experience || '');
          break;
        case 'location':
          cmp = (a.location || '').localeCompare(b.location || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [applications, search, filters, sortField, sortDir]);

  // Counts for dashboard
  const counts = useMemo(() => {
    const c: Record<string, number> = { total: applications.length };
    STATUS_FLOW.forEach((s) => { c[s] = applications.filter((a) => a.status === s).length; });
    return c;
  }, [applications]);

  const activeFilterCount = Object.values(filters).filter((v) => v).length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'created_at' ? 'desc' : 'asc');
    }
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (error) {
      toast('Failed to update status', 'error');
    } else {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      setSelectedApp((prev) => prev ? { ...prev, status } : null);
      toast('Status updated');
    }
  };

  const updateRating = async (id: string, rating: number) => {
    const { error } = await supabase.from('applications').update({ rating }).eq('id', id);
    if (error) {
      toast('Failed to update rating', 'error');
    } else {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, rating } : a));
      setSelectedApp((prev) => prev ? { ...prev, rating } : null);
    }
  };

  const updateTags = async (id: string, tags: string[]) => {
    const { error } = await supabase.from('applications').update({ tags }).eq('id', id);
    if (error) {
      toast('Failed to update tags', 'error');
    } else {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, tags } : a));
      setSelectedApp((prev) => prev ? { ...prev, tags } : null);
    }
  };

  const handleExport = (format: 'excel' | 'csv', all: boolean) => {
    setExporting(true);
    const data = all ? applications : filtered;
    const name = `vybe-select-responses-${new Date().toISOString().slice(0, 10)}`;
    try {
      if (format === 'excel') exportToExcel(data, name);
      else exportToCSV(data, name);
      toast(`Exported ${data.length} applications`);
    } catch {
      toast('Export failed', 'error');
    }
    setExporting(false);
    setExportOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Responses</h1>
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="btn-primary"
          >
            <Download className="w-4 h-4" />
            Export Responses
            <ChevronDown className="w-4 h-4" />
          </button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Export {filtered.length} filtered results
                </div>
                <button
                  onClick={() => handleExport('excel', false)}
                  disabled={exporting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                  Download Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport('csv', false)}
                  disabled={exporting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                  Download CSV (.csv)
                </button>
                <div className="border-t border-gray-100 my-1" />
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Export all {applications.length} applications
                </div>
                <button
                  onClick={() => handleExport('excel', true)}
                  disabled={exporting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                  Export All (Excel)
                </button>
                <button
                  onClick={() => handleExport('csv', true)}
                  disabled={exporting}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                  Export All (CSV)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dashboard counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        <StatCard label="Total" value={counts.total} active={filters.status === ''} onClick={() => setFilters((f) => ({ ...f, status: '' }))} />
        {STATUS_FLOW.map((s) => (
          <StatCard
            key={s}
            label={STATUS_LABELS[s]}
            value={counts[s] || 0}
            active={filters.status === s}
            onClick={() => setFilters((f) => ({ ...f, status: f.status === s ? '' : s }))}
          />
        ))}
      </div>

      {/* Search + Filters toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search applications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary whitespace-nowrap"
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-accent text-white text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters(emptyFilters)}
            className="btn-ghost whitespace-nowrap"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <FilterSelect label="Gender" value={filters.gender} onChange={(v) => setFilters((f) => ({ ...f, gender: v }))} options={GENDER_OPTIONS as unknown as string[]} />
          <FilterSelect label="Location" value={filters.location} onChange={(v) => setFilters((f) => ({ ...f, location: v }))} options={locations} />
          <FilterSelect label="Genre" value={filters.genre} onChange={(v) => setFilters((f) => ({ ...f, genre: v }))} options={GENRES as unknown as string[]} />
          <FilterSelect label="Experience" value={filters.experience} onChange={(v) => setFilters((f) => ({ ...f, experience: v }))} options={EXPERIENCE_OPTIONS as unknown as string[]} />
          <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} options={STATUS_FLOW.map((s) => STATUS_LABELS[s])} rawValues={STATUS_FLOW as unknown as string[]} />
          <FilterSelect label="Rating" value={filters.rating} onChange={(v) => setFilters((f) => ({ ...f, rating: v }))} options={['1', '2', '3', '4', '5']} />
          <div>
            <label className="label-text">Date From</label>
            <input type="date" className="input-field" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
          </div>
          <div>
            <label className="label-text">Date To</label>
            <input type="date" className="input-field" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-3">
        Showing {filtered.length} of {applications.length} applications
      </p>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            No applications found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                    <span className="flex items-center gap-1">Timestamp {sortField === 'created_at' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">App ID</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-100" onClick={() => handleSort('full_name')}>
                    <span className="flex items-center gap-1">Name {sortField === 'full_name' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">DJ Name</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Gender</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Age</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-100" onClick={() => handleSort('location')}>
                    <span className="flex items-center gap-1">Location {sortField === 'location' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Phone</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Email</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Genres</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Experience</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-100" onClick={() => handleSort('rating')}>
                    <span className="flex items-center gap-1">Rating {sortField === 'rating' && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}</span>
                  </th>
                  <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                      {new Date(app.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600 whitespace-nowrap">{app.reference}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">{app.full_name}</td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{app.dj_name}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{app.gender || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{app.age ?? '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{app.location || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{app.phone || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{app.email}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap max-w-[150px] truncate">{app.genres?.join(', ') || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{app.years_experience || '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StarRating value={app.rating} onChange={() => {}} readonly size="sm" />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={app.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <AppDetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdateStatus={updateStatus}
          onUpdateRating={updateRating}
          onUpdateTags={updateTags}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-xl border transition-all ${
        active
          ? 'bg-accent/5 border-accent/30'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500">{label}</p>
    </button>
  );
}

function FilterSelect({ label, value, onChange, options, rawValues }: { label: string; value: string; onChange: (v: string) => void; options: string[]; rawValues?: string[] }) {
  return (
    <div>
      <label className="label-text">{label}</label>
      <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((opt, i) => (
          <option key={opt} value={rawValues ? rawValues[i] : opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function StarRating({ value, onChange, readonly, size = 'md' }: { value: number; onChange: (v: number) => void; readonly?: boolean; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={(e) => { e.stopPropagation(); if (!readonly) onChange(n); }}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star className={`${starSize} ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusKey = status as ApplicationStatus;
  const colorClass = STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-600 border-gray-200';
  const label = STATUS_LABELS[statusKey] || status;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

function AppDetailModal({
  app,
  onClose,
  onUpdateStatus,
  onUpdateRating,
  onUpdateTags,
}: {
  app: Application;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onUpdateRating: (id: string, rating: number) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
}) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [notesLoading, setNotesLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    supabase
      .from('admin_notes')
      .select('*')
      .eq('application_id', app.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotes((data as AdminNote[]) || []);
        setNotesLoading(false);
      });
  }, [app.id]);

  useEffect(() => {
    if (app.video_file_path) {
      setLoadingVideo(true);
      supabase.storage
        .from('dj-videos')
        .createSignedUrl(app.video_file_path, 3600)
        .then(({ data }) => {
          setVideoUrl(data?.signedUrl || null);
          setLoadingVideo(false);
        });
    } else if (app.video_url) {
      setVideoUrl(app.video_url);
    }
  }, [app.video_file_path, app.video_url]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data, error } = await supabase
      .from('admin_notes')
      .insert({ application_id: app.id, content: newNote.trim() })
      .select()
      .single();
    if (error) {
      toast('Failed to add note', 'error');
    } else {
      setNotes((prev) => [data as AdminNote, ...prev]);
      setNewNote('');
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('admin_notes').delete().eq('id', id);
    if (error) {
      toast('Failed to delete note', 'error');
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    if (app.tags?.includes(tag)) return;
    onUpdateTags(app.id, [...(app.tags || []), tag]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    onUpdateTags(app.id, (app.tags || []).filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{app.full_name}</h2>
            <p className="text-sm text-gray-500">{app.dj_name} · {app.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + Rating controls */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Status</label>
              <select
                className="input-field"
                value={app.status}
                onChange={(e) => onUpdateStatus(app.id, e.target.value as ApplicationStatus)}
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Rating</label>
              <div className="py-2">
                <StarRating value={app.rating} onChange={(v) => onUpdateRating(app.id, v)} />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label-text">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(app.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(app.tags || []).length === 0 && (
                <span className="text-sm text-gray-400">No tags yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag…"
              />
              <button onClick={addTag} className="btn-secondary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Personal Info */}
          <div>
            <h3 className="section-title">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <DetailItem label="Full Name" value={app.full_name} />
              <DetailItem label="DJ Name" value={app.dj_name} />
              <DetailItem label="Gender" value={app.gender} />
              <DetailItem label="Age" value={app.age?.toString()} />
              <DetailItem label="Location" value={app.location} />
              <DetailItem label="Phone" value={app.phone} />
              <DetailItem label="Email" value={app.email} />
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="section-title">Social Media</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <DetailItem label="Instagram" value={app.instagram} link={app.instagram ? `https://instagram.com/${app.instagram.replace('@', '')}` : null} />
              <DetailItem label="TikTok" value={app.tiktok} link={app.tiktok ? `https://tiktok.com/@${app.tiktok.replace('@', '')}` : null} />
              <DetailItem label="YouTube" value={app.youtube} link={app.youtube} />
              <DetailItem label="Other" value={app.other_social} link={app.other_social} />
            </div>
          </div>

          {/* DJ Info */}
          <div>
            <h3 className="section-title">DJ Information</h3>
            <div className="space-y-3 text-sm">
              <DetailItem label="Experience" value={app.years_experience} />
              <DetailItem label="Genres" value={app.genres?.join(', ')} />
              <DetailItem label="Previous Events" value={app.previous_venues} multiline />
              <DetailItem label="DJ Style" value={app.style} multiline />
              <DetailItem label="Why Select Me?" value={app.why_select} multiline />
            </div>
          </div>

          {/* Showcase */}
          <div>
            <h3 className="section-title">Talent Showcase</h3>
            {loadingVideo ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading video…
              </div>
            ) : videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 text-accent-700 border border-accent/20 font-medium text-sm hover:bg-accent/15 transition-colors"
              >
                <FileVideo className="w-4 h-4" />
                View Showcase
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-sm text-gray-400">No showcase video provided</p>
            )}
          </div>

          {/* Admin Notes */}
          <div>
            <h3 className="section-title">Private Notes</h3>
            <div className="flex gap-2 mb-3">
              <input
                className="input-field flex-1"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNote())}
                placeholder="Add a private note…"
              />
              <button onClick={addNote} className="btn-primary">
                Add
              </button>
            </div>
            {notesLoading ? (
              <p className="text-sm text-gray-400">Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-gray-400">No notes yet</p>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="flex-1 text-sm text-gray-700">{note.content}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-gray-400 hover:text-rose-600 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, link, multiline }: { label: string; value: string | null | undefined; link?: string | null; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      {value ? (
        link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className={`text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
        )
      ) : (
        <p className="text-gray-300">—</p>
      )}
    </div>
  );
}
