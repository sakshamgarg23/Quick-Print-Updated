import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function uploadToS3(buffer: Buffer, key: string, contentType: string) {
  const { data, error } = await supabase.storage
    .from('printqr-files')
    .upload(key, buffer, { contentType });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('printqr-files')
    .getPublicUrl(key);
  
  return publicUrl;
}

export async function downloadFromS3(url: string) {
  const key = url.split('/').pop()!;
  const { data } = await supabase.storage
    .from('printqr-files')
    .download(key);
  
  return Buffer.from(await data!.arrayBuffer());
}