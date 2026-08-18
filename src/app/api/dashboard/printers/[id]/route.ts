import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { printerInputSchema } from '@/lib/printerSchema';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const printer = await db.printer.findUnique({ where: { id } });
  if (!printer || printer.ownerId !== user.id) {
    return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
  }

  const parsed = printerInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  if (data.printerEmail !== printer.printerEmail) {
    const existing = await db.printer.findUnique({ where: { printerEmail: data.printerEmail } });
    if (existing) {
      return NextResponse.json({ error: 'A printer with that email is already registered' }, { status: 409 });
    }
  }

  const updated = await db.printer.update({
    where: { id },
    data: {
      printerName: data.printerName,
      printerEmail: data.printerEmail,
      location: data.location || null,
      description: data.description || null,
      status: data.status,
      priceBwSingle: data.priceBwSingle,
      priceBwDouble: data.priceBwDouble,
      priceColorSingle: data.priceColorSingle,
      priceColorDouble: data.priceColorDouble,
      supportsColor: data.supportsColor,
      supportsDoubleSided: data.supportsDoubleSided,
      supportedPageSizes: data.supportedPageSizes,
    },
  });

  return NextResponse.json({ success: true, printer: updated });
}
