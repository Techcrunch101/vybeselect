/*
# Add video file upload support and tags column

## Overview
Adds a `video_file_path` column to the `applications` table to support
video file uploads via Supabase Storage. Also adds a `tags` text array
column for simple admin tagging without the separate tags join table.

## Changes
1. `applications` table:
   - ADD `video_file_path` text — stores the storage path when a DJ uploads
     a video file instead of providing a URL.
   - ADD `tags` text[] DEFAULT '{}' — simple inline tags for admin use.

## Security
- No RLS policy changes needed; existing policies cover the new columns.
- Storage bucket `dj-videos` will be created separately for file uploads.
  Public upload via anon is allowed; only authenticated admins can read.
*/

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS video_file_path text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
