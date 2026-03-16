import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { LIBRARY_DIR } from '@/lib/paths';
import fs from 'fs/promises';
import path from 'path';

export const GET = async (_: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id: Number(id) } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(book);
};

export const PATCH = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await req.json();
  const book = await prisma.book.update({
    where: { id: Number(id) },
    data: {
      ...(body.lastPage !== undefined && { lastPage: body.lastPage }),
      ...(body.totalPages !== undefined && { totalPages: body.totalPages }),
      lastReadAt: new Date(),
    },
  });
  return NextResponse.json(book);
};

export const DELETE = async (_: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id: Number(id) } });
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    await fs.unlink(path.join(LIBRARY_DIR, book.filename));
  } catch {}

  await prisma.book.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
};
