import Link from 'next/link';

type Book = {
  id: number;
  title: string;
  author: string | null;
  lastPage: number;
  totalPages: number | null;
  lastReadAt: Date | null;
};

const COVER_COLORS = [
  'from-blue-900 to-blue-700',
  'from-violet-900 to-violet-700',
  'from-emerald-900 to-emerald-700',
  'from-rose-900 to-rose-700',
  'from-amber-900 to-amber-700',
  'from-cyan-900 to-cyan-700',
  'from-pink-900 to-pink-700',
  'from-indigo-900 to-indigo-700',
];

const colorFor = (id: number) => COVER_COLORS[id % COVER_COLORS.length];

export default function BookCard({ book }: { book: Book }) {
  const progress =
    book.totalPages && book.lastPage > 1
      ? Math.round((book.lastPage / book.totalPages) * 100)
      : null;

  return (
    <Link href={`/reader/${book.id}`} className="group flex flex-col gap-2">
      <div
        className={`relative w-full aspect-[2/3] rounded-lg bg-gradient-to-br ${colorFor(book.id)} flex flex-col items-center justify-center p-4 shadow-lg group-hover:scale-[1.03] transition-transform`}
      >
        <p className="text-white font-semibold text-sm text-center leading-snug line-clamp-4">
          {book.title}
        </p>
        {book.author && (
          <p className="text-white/60 text-xs text-center mt-2 line-clamp-2">{book.author}</p>
        )}
        {progress !== null && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/70 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="text-neutral-200 text-xs font-medium truncate">{book.title}</p>
        {book.author && (
          <p className="text-neutral-500 text-xs truncate">{book.author}</p>
        )}
      </div>
    </Link>
  );
}
