import * as XLSX from 'xlsx';
import type { Application } from './types';
import { STATUS_LABELS } from './constants';

function formatGenres(genres: string[]): string {
  return genres.join(', ');
}

function formatSocialLink(handle: string | null, platform: 'instagram' | 'tiktok' | 'youtube' | 'other'): string {
  if (!handle) return '';
  const trimmed = handle.trim();
  if (trimmed.startsWith('http')) return trimmed;
  switch (platform) {
    case 'instagram': return `https://instagram.com/${trimmed.replace('@', '')}`;
    case 'tiktok': return `https://tiktok.com/@${trimmed.replace('@', '')}`;
    case 'youtube': return `https://youtube.com/@${trimmed.replace('@', '')}`;
    default: return trimmed;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildRow(app: Application): Record<string, string | number> {
  return {
    'Timestamp': formatDate(app.created_at),
    'Application ID': app.reference,
    'Full Name': app.full_name,
    'DJ Name': app.dj_name,
    'Gender': app.gender || '',
    'Age': app.age ?? '',
    'Location': app.location || '',
    'Phone': app.phone || '',
    'Email': app.email,
    'Instagram': formatSocialLink(app.instagram, 'instagram'),
    'TikTok': formatSocialLink(app.tiktok, 'tiktok'),
    'YouTube': formatSocialLink(app.youtube, 'youtube'),
    'Other Link': app.other_social || '',
    'Experience': app.years_experience || '',
    'Genres': formatGenres(app.genres),
    'DJ Style': app.style || '',
    'Previous Events': app.previous_venues || '',
    'Why Select Me?': app.why_select || '',
    'Showcase': app.video_url || '',
    'Status': STATUS_LABELS[app.status as keyof typeof STATUS_LABELS] || app.status,
    'Rating': app.rating,
    'Tags': (app.tags || []).join(', '),
  };
}

export function exportToExcel(applications: Application[], filename: string) {
  const rows = applications.map(buildRow);
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 12 },
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 24 },
    { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 24 },
    { wch: 24 }, { wch: 24 }, { wch: 30 }, { wch: 30 }, { wch: 14 },
    { wch: 8 }, { wch: 20 },
  ];

  ws['!freeze'] = { ySplit: 1 };

  ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_cell({ r: 0, c: 21 })}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Responses');

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportToCSV(applications: Application[], filename: string) {
  const rows = applications.map(buildRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
