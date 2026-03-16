import { prisma } from '@/lib/db';
import BookCard from '@/components/BookCard';
import AddBookButton from '@/components/AddBookButton';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const books = await prisma.book.findMany({ orderBy: { addedAt: 'desc' } });

  const recentlyRead = books.filter((b) => b.lastReadAt).sort(
    (a, b) => new Date(b.lastReadAt!).getTime() - new Date(a.lastReadAt!).getTime()
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h1 className="text-lg font-bold leading-none">Boipoka</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {books.length} {books.length === 1 ? 'book' : 'books'}
              </p>
            </div>
          </div>
          <AddBookButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {books.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-4xl">
              📖
            </div>
            <div>
              <p className="text-lg font-semibold">Your shelf is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first PDF to get started
              </p>
            </div>
            <AddBookButton />
          </div>
        ) : (
          <>
            {/* Continue reading */}
            {recentlyRead.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Continue Reading
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recentlyRead.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </section>
            )}

            {/* All books */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                All Books
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
