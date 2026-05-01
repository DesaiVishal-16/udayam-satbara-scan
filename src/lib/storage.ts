import { supabase, STORAGE_BUCKET } from '@/lib/supabase';

export async function createStorageBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  const exists = buckets?.some(b => b.name === STORAGE_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
    });
    if (createError) {
      console.error('Error creating bucket:', createError);
    }
  }
}

export async function uploadFile(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file);

  if (error) {
    console.error('Upload error:', error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteFile(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error.message);
    return false;
  }
  return true;
}