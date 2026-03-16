import Link from 'next/link';
import { prisma } from '@/lib/db';
import BookCard from '@/components/BookCard';
import AddBookButton from '@/components/AddBookButton';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const books = await prisma.book.findMany({ orderBy: { addedAt: 'desc' } });

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white">📚 Boipoka</h1>
        <AddBookButton />
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {books.length === 0 ? (
          <div className="text-center py-24 text-neutral-500">
            <p className="text-5xl mb-4">📖</p>
            <p className="text-lg">No books yet. Add your first PDF.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
