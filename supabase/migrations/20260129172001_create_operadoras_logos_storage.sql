/*
  # Create Storage Bucket for Operadora Logos

  1. Storage
    - Create a public storage bucket called `operadoras-logos` for storing company logos
    - Set up RLS policies to allow:
      - Public read access (anyone can view the logos)
      - Authenticated users can upload/update logos (admin only)
      - Authenticated users can delete logos (admin only)

  2. Security
    - Enable RLS on the storage bucket
    - Public read access for logo images
    - Restricted write/delete access to authenticated users only
*/

-- Create the storage bucket for operadora logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'operadoras-logos',
  'operadoras-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to logo files
CREATE POLICY "Public can view operadora logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'operadoras-logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload operadora logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'operadoras-logos');

-- Allow authenticated users to update logos
CREATE POLICY "Authenticated users can update operadora logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'operadoras-logos')
  WITH CHECK (bucket_id = 'operadoras-logos');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete operadora logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'operadoras-logos');