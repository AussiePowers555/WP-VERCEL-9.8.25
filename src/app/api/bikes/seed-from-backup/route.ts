import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function POST(_request: NextRequest) {
  try {
    await ensureDatabaseInitialized();

    // Pick the latest backup file named full_backup_*.json
    const backupsDir = path.resolve(process.cwd(), 'data_backups');
    const entries = await fs.readdir(backupsDir);
    const jsons = entries.filter((f) => f.startsWith('full_backup_') && f.endsWith('.json'));
    if (jsons.length === 0) {
      return NextResponse.json({ success: false, error: 'No backup json found' }, { status: 404 });
    }
    jsons.sort();
    const latest = jsons[jsons.length - 1];
    const raw = await fs.readFile(path.join(backupsDir, latest), 'utf8');
    const parsed = JSON.parse(raw);

    const bikes = Array.isArray(parsed.bikes || parsed.Bikes)
      ? (parsed.bikes || parsed.Bikes)
      : (Array.isArray(parsed) ? parsed : []);

    if (!Array.isArray(bikes) || bikes.length === 0) {
      return NextResponse.json({ success: false, error: 'No bikes in backup' }, { status: 400 });
    }

    // Normalize to DB shape expected by bulkInsertBikes
    const normalized = bikes.map((b: any) => ({
      id: b.id || undefined,
      make: b.make || b.brand || 'Unknown',
      model: b.model || 'Unknown',
      registration: b.registration || b.rego || '',
      registrationExpires: b.registration_expires || b.registrationExpires || null,
      serviceCenter: b.service_center || b.serviceCenter || null,
      deliveryStreet: b.delivery_street || b.deliveryStreet || null,
      deliverySuburb: b.delivery_suburb || b.deliverySuburb || null,
      deliveryState: b.delivery_state || b.deliveryState || null,
      deliveryPostcode: b.delivery_postcode || b.deliveryPostcode || null,
      lastServiceDate: b.last_service_date || b.lastServiceDate || null,
      serviceNotes: b.service_notes || b.serviceNotes || null,
      status: b.status || 'Available',
      location: b.location || '',
      dailyRate: b.daily_rate || b.dailyRate || 0,
      imageUrl: b.image_url || b.imageUrl || null,
      imageHint: b.image_hint || b.imageHint || null,
      assignment: b.assignment || null,
    }));

    await (DatabaseService as any).bulkInsertBikes(normalized);
    return NextResponse.json({ success: true, count: normalized.length });
  } catch (error) {
    console.error('Seed bikes error:', error);
    return NextResponse.json({ success: false, error: 'Failed to seed bikes' }, { status: 500 });
  }
}


