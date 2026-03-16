import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PdfViewer from '@/components/PdfViewerClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id: Number(id) } });
  if (!book) return {};
  return { title: book.author ? `${book.title} — ${book.author}` : book.title };
}

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id: Number(id) } });
  if (!book) notFound();

  return (
    <PdfViewer
      bookId={book.id}
      title={book.title}
      author={book.author}
      initialPage={book.lastPage}
      pdfUrl={`/api/pdf/${book.id}`}
    />
  );
}
