import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function uploadFile(buffer: Buffer, fileName: string, contentType: string) {
  const { data, error } = await supabase.storage
    .from('printqr-files')
    .upload(fileName, buffer, { contentType });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('printqr-files')
    .getPublicUrl(fileName);
  
  return publicUrl;
}

export async function downloadFile(url: string) {
  const fileName = url.split('/').pop()!;
  const { data } = await supabase.storage
    .from('printqr-files')
    .download(fileName);
  
  return Buffer.from(await data!.arrayBuffer());
}