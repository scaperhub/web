import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = await getCurrentUser(token || null);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if Supabase is configured
  const USE_SUPABASE = process.env.USE_SUPABASE === 'true' || 
                       (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  try {
    if (USE_SUPABASE) {
      // Use Supabase Storage
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB
        filter: ({ name, originalFilename, mimetype }) => {
          // Only allow image files
          const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          return validMimeTypes.includes(mimetype || '');
        },
      });

      const [fields, files] = await form.parse(req);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Read file buffer
      const fileBuffer = fs.readFileSync(file.filepath);
      const ext = file.originalFilename?.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${user.id}/${timestamp}-${randomString}.${ext}`;

      // Check if supabaseAdmin is available
      if (!supabaseAdmin) {
        console.error('Supabase admin client not initialized');
        return res.status(500).json({ error: 'Storage service not configured. Please check SUPABASE_SERVICE_ROLE_KEY environment variable.' });
      }

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('uploads')
        .upload(fileName, fileBuffer, {
          contentType: file.mimetype || `image/${ext}`,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        
        // Provide helpful error message for common issues
        if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
          return res.status(500).json({ 
            error: 'Storage bucket not found. Please create an "uploads" bucket in Supabase Storage and make it public.',
            details: 'Go to Supabase Dashboard → Storage → New bucket → Name: "uploads" → Enable "Public bucket"'
          });
        }
        
        if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          return res.status(500).json({ 
            error: 'Row Level Security (RLS) is blocking uploads. Please disable RLS on the "uploads" bucket or create proper policies.',
            details: 'Go to Supabase Dashboard → Storage → Policies → uploads → Disable RLS or create upload policies'
          });
        }
        
        return res.status(500).json({ error: 'Failed to upload to storage: ' + error.message });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // Clean up temp file
      fs.unlinkSync(file.filepath);

      return res.status(200).json({ url: urlData.publicUrl });
    } else {
      // Fallback to local file system (for development)
      const uploadDir = require('path').join(process.cwd(), 'public', 'uploads');
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const form = formidable({
        uploadDir,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        filter: ({ name, originalFilename, mimetype }) => {
          // Only allow image files
          const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          return validMimeTypes.includes(mimetype || '');
        },
      });

      const [fields, files] = await form.parse(req);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const ext = require('path').extname(file.originalFilename || '');
      const newFilename = `${timestamp}-${randomString}${ext}`;
      const newPath = require('path').join(uploadDir, newFilename);

      // Rename/move the file
      fs.renameSync(file.filepath, newPath);

      // Return the URL path
      const url = `/uploads/${newFilename}`;
      
      return res.status(200).json({ url });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
}
