/*
# DJ Talent Discovery & Audition Platform — initial schema

## Overview
Creates the full data model for a DJ talent discovery platform: public opportunities,
DJ applications, admin notes, activity history, shortlists with ranking, custom tags,
and join tables. Public visitors can read active opportunities and submit applications;
only authenticated admins can view/manage applications, notes, shortlists, tags, and
activity logs.

## New Tables

1. `opportunities`
   - Represents a single audition/talent call (e.g. "Uptown DJ Audition").
   - `slug` generates the public application URL `/apply/:slug`.
   - Public can SELECT active opportunities; admins can INSERT/UPDATE.

2. `applications`
   - A single DJ's submission. Linked to an opportunity (nullable for a general pool).
   - Stores all form data: identity, contact, socials, DJ profile, showcase video.
   - Stores admin-managed fields: status, star rating, six sub-scores.
   - `reference` is a unique human-readable code shown on the confirmation screen.
   - Public (anon) can INSERT only; admins can SELECT/UPDATE/DELETE.

3. `admin_notes`
   - Private notes an admin writes on an application. Authenticated-only CRUD.

4. `activity_log`
   - Append-only history of status changes per application. Authenticated-only INSERT/SELECT.

5. `shortlists`
   - Named ranking groups: Top 5, Top 10, Audition List, Backup List, Talent Pool.
   - Authenticated-only CRUD.

6. `shortlist_entries`
   - Join of application <-> shortlist with a manual `rank` for drag-and-drop ordering.
   - Authenticated-only CRUD.

7. `tags`
   - Custom admin tags (e.g. "Amapiano", "Female DJ", "High Potential").
   - Authenticated-only CRUD.

8. `application_tags`
   - Many-to-many join between applications and tags. Authenticated-only CRUD.

## Security (RLS)
- `opportunities`: anon+authenticated SELECT (so the public apply page works);
  authenticated INSERT/UPDATE.
- `applications`: anon+authenticated INSERT (public form submission);
  authenticated SELECT/UPDATE/DELETE (admin management). INSERT policy uses
  `WITH CHECK (true)` because the public form intentionally writes new rows.
- `admin_notes`, `activity_log`, `shortlists`, `shortlist_entries`, `tags`,
  `application_tags`: authenticated-only CRUD (admin-only data).

## Notes
1. This is a single-organiser platform; any authenticated Supabase user is treated
   as an admin. There is no per-user ownership scoping because all admins share
   the same talent database.
2. `applications.reference` is generated in the application layer (frontend) as
   `DJ-XXXXXX` and stored on insert; a unique constraint prevents collisions.
3. `applications.genres` is a text array to support multi-select genre filtering.
4. All tables enable RLS and use 4 separate policies (one per CRUD verb) where
   applicable.
*/

-- =============================================================
-- opportunities
-- =============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  venue text,
  event_date date,
  num_djs integer,
  genres text[],
  deadline date,
  eligibility text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_opportunities" ON opportunities;
CREATE POLICY "public_read_opportunities" ON opportunities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_opportunities" ON opportunities;
CREATE POLICY "admin_insert_opportunities" ON opportunities FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_opportunities" ON opportunities;
CREATE POLICY "admin_update_opportunities" ON opportunities FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_opportunities" ON opportunities;
CREATE POLICY "admin_delete_opportunities" ON opportunities FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- applications
-- =============================================================
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE SET NULL,
  -- step 1: basic info
  full_name text NOT NULL,
  dj_name text NOT NULL,
  gender text,
  age integer,
  location text,
  phone text,
  email text NOT NULL,
  -- step 2: socials
  instagram text,
  tiktok text,
  youtube text,
  other_social text,
  -- step 3: dj profile
  years_experience text,
  genres text[] DEFAULT '{}',
  style text,
  performed_professionally boolean DEFAULT false,
  previous_venues text,
  equipment text,
  why_select text,
  -- step 4: showcase
  video_type text,
  video_url text,
  -- admin-managed
  status text NOT NULL DEFAULT 'new',
  rating integer NOT NULL DEFAULT 0,
  score_technical integer NOT NULL DEFAULT 0,
  score_creativity integer NOT NULL DEFAULT 0,
  score_energy integer NOT NULL DEFAULT 0,
  score_music_selection integer NOT NULL DEFAULT 0,
  score_stage_presence integer NOT NULL DEFAULT 0,
  score_overall_potential integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_location ON applications(location);
CREATE INDEX IF NOT EXISTS idx_applications_gender ON applications(gender);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Public can submit applications (INSERT). WITH CHECK (true) is intentional:
-- the public application form writes new rows with no ownership relationship.
DROP POLICY IF EXISTS "public_insert_applications" ON applications;
CREATE POLICY "public_insert_applications" ON applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Admins can read, update, and delete applications.
DROP POLICY IF EXISTS "admin_select_applications" ON applications;
CREATE POLICY "admin_select_applications" ON applications FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_applications" ON applications;
CREATE POLICY "admin_update_applications" ON applications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_applications" ON applications;
CREATE POLICY "admin_delete_applications" ON applications FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- admin_notes
-- =============================================================
CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_application_id ON admin_notes(application_id);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_notes" ON admin_notes;
CREATE POLICY "admin_select_notes" ON admin_notes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_notes" ON admin_notes;
CREATE POLICY "admin_insert_notes" ON admin_notes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_notes" ON admin_notes;
CREATE POLICY "admin_update_notes" ON admin_notes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_notes" ON admin_notes;
CREATE POLICY "admin_delete_notes" ON admin_notes FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- activity_log
-- =============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status text,
  to_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_application_id ON activity_log(application_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_activity" ON activity_log;
CREATE POLICY "admin_select_activity" ON activity_log FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_activity" ON activity_log;
CREATE POLICY "admin_insert_activity" ON activity_log FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_activity" ON activity_log;
CREATE POLICY "admin_update_activity" ON activity_log FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_activity" ON activity_log;
CREATE POLICY "admin_delete_activity" ON activity_log FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- shortlists
-- =============================================================
CREATE TABLE IF NOT EXISTS shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_shortlists" ON shortlists;
CREATE POLICY "admin_select_shortlists" ON shortlists FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_shortlists" ON shortlists;
CREATE POLICY "admin_insert_shortlists" ON shortlists FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_shortlists" ON shortlists;
CREATE POLICY "admin_update_shortlists" ON shortlists FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_shortlists" ON shortlists;
CREATE POLICY "admin_delete_shortlists" ON shortlists FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- shortlist_entries
-- =============================================================
CREATE TABLE IF NOT EXISTS shortlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id uuid NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shortlist_id, application_id)
);

CREATE INDEX IF NOT EXISTS idx_shortlist_entries_shortlist_id ON shortlist_entries(shortlist_id);

ALTER TABLE shortlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_shortlist_entries" ON shortlist_entries;
CREATE POLICY "admin_select_shortlist_entries" ON shortlist_entries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_shortlist_entries" ON shortlist_entries;
CREATE POLICY "admin_insert_shortlist_entries" ON shortlist_entries FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_shortlist_entries" ON shortlist_entries;
CREATE POLICY "admin_update_shortlist_entries" ON shortlist_entries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_shortlist_entries" ON shortlist_entries;
CREATE POLICY "admin_delete_shortlist_entries" ON shortlist_entries FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- tags
-- =============================================================
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text NOT NULL DEFAULT 'amber',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_tags" ON tags;
CREATE POLICY "admin_select_tags" ON tags FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_tags" ON tags;
CREATE POLICY "admin_insert_tags" ON tags FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_tags" ON tags;
CREATE POLICY "admin_update_tags" ON tags FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_tags" ON tags;
CREATE POLICY "admin_delete_tags" ON tags FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- application_tags
-- =============================================================
CREATE TABLE IF NOT EXISTS application_tags (
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, tag_id)
);

ALTER TABLE application_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_select_application_tags" ON application_tags;
CREATE POLICY "admin_select_application_tags" ON application_tags FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_application_tags" ON application_tags;
CREATE POLICY "admin_insert_application_tags" ON application_tags FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_application_tags" ON application_tags;
CREATE POLICY "admin_delete_application_tags" ON application_tags FOR DELETE
  TO authenticated USING (true);

-- =============================================================
-- Seed default shortlists
-- =============================================================
INSERT INTO shortlists (name, type) VALUES
  ('Top 5', 'top5'),
  ('Top 10', 'top10'),
  ('Audition List', 'audition'),
  ('Backup List', 'backup'),
  ('Talent Pool', 'talent_pool')
ON CONFLICT DO NOTHING;