import { NextResponse } from 'next/server';
import { syncCatalogAndPendingVerification } from '@/lib/catalog-sync';

export async function GET() {
  try {
    const result = await syncCatalogAndPendingVerification();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Catalog sync GET error:', error);
    return NextResponse.json(
      { error: 'Failed to sync catalog', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const directSubmission =
      body && (body.type === 'roaster' || body.type === 'bean') && body.data
        ? { type: body.type, data: body.data }
        : undefined;

    const result = await syncCatalogAndPendingVerification(directSubmission);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Catalog sync POST error:', error);
    return NextResponse.json(
      { error: 'Failed to sync catalog', details: error?.message },
      { status: 500 }
    );
  }
}
