import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { LIBRARY_DIR } from '@/lib/paths';
import fs from 'fs';
import path from 'path';

export const GET = async (_: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id: Number(id) } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const filepath = path.join(LIBRARY_DIR, book.filename);

  let stat;
  try {
    stat = fs.statSync(filepath);
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stream = fs.createReadStream(filepath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', (err) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': stat.size.toString(),
      'Content-Disposition': `inline; filename="${book.filename}"`,
    },
  });
};
