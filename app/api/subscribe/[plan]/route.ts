import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/subscription';

export async function GET(_req: Request, { params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL!;
    const session = await createCheckoutSession(
      plan as any,
      `${base}/subscribe/success`,
      `${base}/subscribe/pricing`,
      14
    );
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
