import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BUCKET = 'print-files';

export async function uploadFile(buffer: Buffer, fileName: string, contentType: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function downloadFile(url: string) {
  const fileName = url.split('/').pop()!;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(fileName);

  if (error) throw error;
  return Buffer.from(await data!.arrayBuffer());
}

/**
 * Real page count for pricing. PDFs are parsed with pdf-lib; every other
 * accepted type (images) is inherently a single "page".
 */
export async function getPageCount(buffer: Buffer, contentType: string): Promise<number> {
  if (contentType !== 'application/pdf') {
    return 1;
  }

  const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();
  return pageCount > 0 ? pageCount : 1;
}
