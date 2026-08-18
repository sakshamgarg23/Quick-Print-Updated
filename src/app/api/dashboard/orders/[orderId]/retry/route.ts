import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { attemptDelivery } from '@/lib/delivery';

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = await params;
  const order = await db.printOrder.findUnique({ where: { id: orderId }, include: { printer: true } });
  if (!order || order.printer.ownerId !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.paymentStatus !== 'paid') {
    return NextResponse.json({ error: 'Order has not been paid for' }, { status: 400 });
  }

  const result = await attemptDelivery(orderId);
  return NextResponse.json(result);
}
