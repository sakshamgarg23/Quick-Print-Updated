import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { printerInputSchema } from '@/lib/printerSchema';
import { getBaseUrl } from '@/lib/url';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = printerInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.printer.findUnique({ where: { printerEmail: data.printerEmail } });
  if (existing) {
    return NextResponse.json({ error: 'A printer with that email is already registered' }, { status: 409 });
  }

  const id = randomUUID();
  const baseUrl = await getBaseUrl();
  const printUrl = `${baseUrl}/print/${id}`;

  const printer = await db.printer.create({
    data: {
      id,
      ownerId: user.id,
      printerName: data.printerName,
      printerEmail: data.printerEmail,
      location: data.location || null,
      description: data.description || null,
      status: data.status,
      qrCodeData: printUrl,
      priceBwSingle: data.priceBwSingle,
      priceBwDouble: data.priceBwDouble,
      priceColorSingle: data.priceColorSingle,
      priceColorDouble: data.priceColorDouble,
      supportsColor: data.supportsColor,
      supportsDoubleSided: data.supportsDoubleSided,
      supportedPageSizes: data.supportedPageSizes,
    },
  });

  return NextResponse.json({ success: true, printer });
}
