import { useState } from 'react';
import { Link, useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import {
  GENRES,
  GENDER_OPTIONS,
  EXPERIENCE_OPTIONS,
  generateReference,
} from '@/lib/constants';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Upload,
  Link2,
  Loader2,
} from 'lucide-react';

interface FormData {
  full_name: string;
  dj_name: string;
  gender: string;
  age: string;
  location: string;
  phone: string;
  email: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  other_social: string;
  years_experience: string;
  genres: string[];
  style: string;
  previous_venues: string;
  why_select: string;
  video_type: 'upload' | 'link' | '';
  video_url: string;
  video_file: File | null;
  confirm: boolean;
}

const emptyForm: FormData = {
  full_name: '',
  dj_name: '',
  gender: '',
  age: '',
  location: '',
  phone: '',
  email: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  other_social: '',
  years_experience: '',
  genres: [],
  style: '',
  previous_venues: '',
  why_select: '',
  video_type: '',
  video_url: '',
  video_file: null,
  confirm: false,
};

export function ApplicationFormPage() {
  const { navigate } = useRouter();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const update = (field: keyof FormData, value: string | string[] | File | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleGenre = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const validate = (): string | null => {
    if (!form.full_name.trim()) return 'Please enter your full name';
    if (!form.dj_name.trim()) return 'Please enter your DJ / stage name';
    if (!form.email.trim()) return 'Please enter your email address';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return 'Please enter a valid email address';
    if (form.video_type === 'link' && !form.video_url.trim())
      return 'Please provide a video link';
    if (form.video_type === 'upload' && !form.video_file)
      return 'Please upload a video file';
    if (!form.confirm)
      return 'Please confirm the information is accurate';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError(null);

    let videoFilePath: string | null = null;

    if (form.video_type === 'upload' && form.video_file) {
      const file = form.video_file;
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress('Uploading video…');

      const { error: uploadError } = await supabase.storage
        .from('dj-videos')
        .upload(fileName, file);

      if (uploadError) {
        setError('Failed to upload video. Please try again or use a link instead.');
        setSubmitting(false);
        setUploadProgress(null);
        return;
      }
      videoFilePath = fileName;
    }

    setUploadProgress('Submitting application…');
    const ref = generateReference();

    const { error: insertError } = await supabase.from('applications').insert({
      reference: ref,
      full_name: form.full_name.trim(),
      dj_name: form.dj_name.trim(),
      gender: form.gender || null,
      age: form.age ? parseInt(form.age) : null,
      location: form.location.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim(),
      instagram: form.instagram.trim() || null,
      tiktok: form.tiktok.trim() || null,
      youtube: form.youtube.trim() || null,
      other_social: form.other_social.trim() || null,
      years_experience: form.years_experience || null,
      genres: form.genres,
      style: form.style.trim() || null,
      previous_venues: form.previous_venues.trim() || null,
      why_select: form.why_select.trim() || null,
      video_type: form.video_type || null,
      video_url: form.video_type === 'link' ? form.video_url.trim() : null,
      video_file_path: videoFilePath,
      status: 'new',
    });

    setSubmitting(false);
    setUploadProgress(null);

    if (insertError) {
      if (insertError.code === '23505') {
        return submit();
      }
      setError('Something went wrong submitting your application. Please try again.');
      return;
    }

    setReference(ref);
  };

  if (reference) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Application Received</h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Thank you for applying to VYBE SELECT. Your application has been
            successfully received. We will contact you if you are shortlisted.
          </p>

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <p className="text-sm text-gray-500 mb-2">Your application ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-xl font-bold text-accent tracking-wider">
                {reference}
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(reference)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Save this reference — you may be asked for it in future communications.
            </p>
          </div>

          <Link to="/" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">VYBE SELECT</span>
          </Link>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Back to site
          </Link>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            VYBE SELECT DJ Application
          </h1>
          <p className="text-gray-600">
            Tell us about yourself and show us what you can do.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* Personal Information */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="section-title">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Full Name <span className="text-accent">*</span></label>
                <input
                  className="input-field"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="label-text">DJ / Stage Name <span className="text-accent">*</span></label>
                <input
                  className="input-field"
                  value={form.dj_name}
                  onChange={(e) => update('dj_name', e.target.value)}
                  placeholder="DJ Vybe"
                />
              </div>
              <div>
                <label className="label-text">Gender</label>
                <select
                  className="input-field"
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                >
                  <option value="">Select…</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-text">Age</label>
                <input
                  type="number"
                  min="13"
                  max="100"
                  className="input-field"
                  value={form.age}
                  onChange={(e) => update('age', e.target.value)}
                  placeholder="25"
                />
              </div>
              <div>
                <label className="label-text">Location</label>
                <input
                  className="input-field"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="Nairobi, Kenya"
                />
              </div>
              <div>
                <label className="label-text">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+254 700 000 000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label-text">Email Address <span className="text-accent">*</span></label>
                <input
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          </section>

          {/* Social Media */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="section-title">Social Media</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Instagram</label>
                <input
                  className="input-field"
                  value={form.instagram}
                  onChange={(e) => update('instagram', e.target.value)}
                  placeholder="@djvybe"
                />
              </div>
              <div>
                <label className="label-text">TikTok</label>
                <input
                  className="input-field"
                  value={form.tiktok}
                  onChange={(e) => update('tiktok', e.target.value)}
                  placeholder="@djvybe"
                />
              </div>
              <div>
                <label className="label-text">YouTube</label>
                <input
                  className="input-field"
                  value={form.youtube}
                  onChange={(e) => update('youtube', e.target.value)}
                  placeholder="@djvybe or channel link"
                />
              </div>
              <div>
                <label className="label-text">Other Link</label>
                <input
                  className="input-field"
                  value={form.other_social}
                  onChange={(e) => update('other_social', e.target.value)}
                  placeholder="SoundCloud, Mixcloud, etc."
                />
              </div>
            </div>
          </section>

          {/* DJ Information */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="section-title">DJ Information</h2>
            <div className="space-y-4">
              <div>
                <label className="label-text">Years of DJ Experience</label>
                <select
                  className="input-field"
                  value={form.years_experience}
                  onChange={(e) => update('years_experience', e.target.value)}
                >
                  <option value="">Select…</option>
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">Genres Played</label>
                <p className="text-xs text-gray-500 mb-2">Select all that apply</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => {
                    const selected = form.genres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          selected
                            ? 'bg-accent text-white border-accent'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label-text">Previous Events / Venues</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  value={form.previous_venues}
                  onChange={(e) => update('previous_venues', e.target.value)}
                  placeholder="List notable events or venues you've played at…"
                />
              </div>

              <div>
                <label className="label-text">Describe Your DJ Style</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  value={form.style}
                  onChange={(e) => update('style', e.target.value)}
                  placeholder="What makes your sets unique?"
                />
              </div>

              <div>
                <label className="label-text">Why Should We Select You?</label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  value={form.why_select}
                  onChange={(e) => update('why_select', e.target.value)}
                  placeholder="Tell us what sets you apart…"
                />
              </div>
            </div>
          </section>

          {/* Talent Showcase */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="section-title">Talent Showcase</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload a short video (max 5 minutes) or paste a link to your performance.
            </p>

            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => update('video_type', 'upload')}
                className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-all flex items-center justify-center gap-2 ${
                  form.video_type === 'upload'
                    ? 'border-accent bg-accent/5 text-accent-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload Video
              </button>
              <button
                type="button"
                onClick={() => update('video_type', 'link')}
                className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-all flex items-center justify-center gap-2 ${
                  form.video_type === 'link'
                    ? 'border-accent bg-accent/5 text-accent-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Link2 className="w-4 h-4" /> Paste Link
              </button>
            </div>

            {form.video_type === 'upload' && (
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) update('video_file', file);
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2.5 file:px-4 file:rounded-lg
                    file:border-0 file:text-sm file:font-medium
                    file:bg-gray-100 file:text-gray-700
                    hover:file:bg-gray-200 file:cursor-pointer file:transition-colors"
                />
                {form.video_file && (
                  <p className="mt-2 text-sm text-emerald-600">
                    Selected: {form.video_file.name} ({(form.video_file.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>
            )}

            {form.video_type === 'link' && (
              <div>
                <input
                  className="input-field"
                  value={form.video_url}
                  onChange={(e) => update('video_url', e.target.value)}
                  placeholder="https://youtube.com/watch?v=… or Google Drive link"
                />
              </div>
            )}
          </section>

          {/* Consent */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.confirm}
                onChange={(e) => update('confirm', e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent/20"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I confirm that the information I have provided is accurate and I
                agree to be contacted regarding DJ opportunities.
              </span>
            </label>
          </section>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn-primary flex-1 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadProgress || 'Submitting…'}
                </>
              ) : (
                'SUBMIT APPLICATION'
              )}
            </button>
            <Link to="/" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
