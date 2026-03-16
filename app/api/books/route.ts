import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { LIBRARY_DIR } from '@/lib/paths';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const GET = async () => {
  const books = await prisma.book.findMany({ orderBy: { addedAt: 'desc' } });
  return NextResponse.json(books);
};

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    await fs.mkdir(LIBRARY_DIR, { recursive: true });

    const filename = `${randomUUID()}.pdf`;
    const filepath = path.join(LIBRARY_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filepath, buffer);

    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        filename,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};
