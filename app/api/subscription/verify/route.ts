import { NextResponse } from 'next/server';
import { customerHasActiveSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const res = await customerHasActiveSubscription(email.toLowerCase());
  return NextResponse.json(res);
}
