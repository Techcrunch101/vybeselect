export const GENRES = [
  'Afrobeats',
  'Amapiano',
  'Hip Hop',
  'R&B',
  'House',
  'Techno',
  'EDM',
  'Dancehall',
  'Reggae',
  'Afro House',
  'Gengetone',
  'Gqom',
  'Other',
] as const;

export const GENDER_OPTIONS = [
  'Female',
  'Male',
  'Non-binary',
  'Prefer not to say',
] as const;

export const EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '6–10 years',
  'More than 10 years',
] as const;

export type ApplicationStatus =
  | 'new'
  | 'reviewing'
  | 'shortlisted'
  | 'audition'
  | 'selected'
  | 'rejected'
  | 'talent_pool';

export const STATUS_FLOW: ApplicationStatus[] = [
  'new',
  'reviewing',
  'shortlisted',
  'audition',
  'selected',
  'rejected',
  'talent_pool',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  audition: 'Audition',
  selected: 'Selected',
  rejected: 'Rejected',
  talent_pool: 'Talent Pool',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: 'bg-sky-100 text-sky-700 border-sky-200',
  reviewing: 'bg-amber-100 text-amber-700 border-amber-200',
  shortlisted: 'bg-violet-100 text-violet-700 border-violet-200',
  audition: 'bg-accent/10 text-accent-700 border-accent/20',
  selected: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  talent_pool: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function generateReference(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 89999);
  return `VYS-${year}-${num}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
