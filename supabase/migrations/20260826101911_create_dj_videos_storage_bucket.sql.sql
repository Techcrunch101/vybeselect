/*
# Create storage bucket for DJ video uploads

## Overview
Creates a public storage bucket `dj-videos` where DJs can upload their
showcase videos as part of the application form. The bucket is public-read
so admins can view/download videos, but only allows uploads via the
storage policies.

## Changes
1. Create bucket `dj-videos` (public = false for security — we'll use
   signed URLs for admin access).
2. Storage policies:
   - Allow anon + authenticated to INSERT (upload) into dj-videos.
   - Allow authenticated (admins) to SELECT (read) objects in dj-videos.
   - Allow authenticated to DELETE objects in dj-videos.
   - Anon cannot SELECT/DELETE — only upload.

## Security
- Public DJs can upload videos but cannot list or download other videos.
- Only authenticated admins can read and delete videos.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('dj-videos', 'dj-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone (anon + authenticated) to upload to dj-videos
DROP POLICY IF EXISTS "anon_upload_dj_videos" ON storage.objects;
CREATE POLICY "anon_upload_dj_videos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'dj-videos');

-- Allow only authenticated admins to read/download videos
DROP POLICY IF EXISTS "admin_read_dj_videos" ON storage.objects;
CREATE POLICY "admin_read_dj_videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dj-videos');

-- Allow only authenticated admins to delete videos
DROP POLICY IF EXISTS "admin_delete_dj_videos" ON storage.objects;
CREATE POLICY "admin_delete_dj_videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'dj-videos');
