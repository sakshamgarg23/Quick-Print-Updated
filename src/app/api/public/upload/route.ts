import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = uuidv4();
    const ext = file.name.split('.').pop();
    const fileName = `uploads/${fileId}.${ext}`;
    
    const url = await uploadFile(buffer, fileName, file.type);

    return NextResponse.json({
      success: true,
      file: {
        id: fileId,
        url,
        name: file.name,
        type: file.type,
        sizeBytes: file.size,
        pageCount: 5,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
export const config = {
  api: {
    bodyParser: false,
  },
};
