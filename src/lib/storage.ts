import { supabase, STORAGE_BUCKET } from '@/lib/supabase';

export async function createStorageBucket() {
  console.log('=== CHECKING STORAGE BUCKET ===');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Available buckets:', buckets?.map(b => b.name));
  const exists = buckets?.some(b => b.name === STORAGE_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
    });
    if (createError) {
      console.error('Error creating bucket:', createError);
    } else {
      console.log('Created storage bucket:', STORAGE_BUCKET);
    }
  } else {
    console.log('Storage bucket exists:', STORAGE_BUCKET);
  }
}

export async function uploadFile(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name}`;
  console.log('=== UPLOAD FILE ===');
  console.log('File name:', fileName);
  console.log('Bucket:', STORAGE_BUCKET);
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file);

  if (error) {
    console.error('Upload error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return null;
  }

  console.log('Upload success:', data);
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  console.log('Public URL:', publicUrl);
  return publicUrl;
}

export async function deleteFile(filePath: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }
  return true;
}
