'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Book = {
  id: number;
  title: string;
  author: string | null;
  lastPage: number;
  totalPages: number | null;
  lastReadAt: Date | null;
};

const COVERS = [
  ['from-blue-950 to-blue-800', 'border-blue-700/40'],
  ['from-violet-950 to-violet-800', 'border-violet-700/40'],
  ['from-emerald-950 to-emerald-800', 'border-emerald-700/40'],
  ['from-rose-950 to-rose-800', 'border-rose-700/40'],
  ['from-amber-950 to-amber-800', 'border-amber-700/40'],
  ['from-cyan-950 to-cyan-800', 'border-cyan-700/40'],
  ['from-pink-950 to-pink-800', 'border-pink-700/40'],
  ['from-indigo-950 to-indigo-800', 'border-indigo-700/40'],
];

const coverFor = (id: number) => COVERS[id % COVERS.length];

type MenuPos = { x: number; y: number };

export default function BookCard({ book }: { book: Book }) {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuPos | null>(null);
  const [deleting, setDeleting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const progress =
    book.totalPages && book.lastPage > 1
      ? Math.round((book.lastPage / book.totalPages) * 100)
      : null;

  const [gradient, border] = coverFor(book.id);

  const openMenu = (x: number, y: number) => {
    // Clamp so menu stays within viewport
    const menuW = 140;
    const menuH = 48;
    const cx = Math.min(x, window.innerWidth - menuW - 8);
    const cy = Math.min(y, window.innerHeight - menuH - 8);
    setMenu({ x: cx, y: cy });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    didLongPress.current = false;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      openMenu(touch.clientX, touch.clientY);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = () => cancelLongPress();
  const handleTouchMove = () => cancelLongPress();

  // Intercept link click if long press triggered
  const handleLinkClick = (e: React.MouseEvent) => {
    if (didLongPress.current) {
      e.preventDefault();
      didLongPress.current = false;
    }
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menu) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menu]);

  const handleDelete = async () => {
    setMenu(null);
    setDeleting(true);
    await fetch(`/api/books/${book.id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <>
      <Link
        href={`/reader/${book.id}`}
        className={`group flex flex-col gap-2.5 select-none ${deleting ? 'opacity-40 pointer-events-none' : ''}`}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onClick={handleLinkClick}
      >
        {/* Book cover */}
        <div
          className={`relative w-full aspect-[2/3] rounded-xl bg-gradient-to-b ${gradient} border ${border} flex flex-col items-center justify-center p-4 shadow-lg group-hover:scale-[1.02] group-hover:shadow-xl transition-all duration-200`}
        >
          {/* Spine accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-white/10" />

          <p className="text-white/90 font-semibold text-sm text-center leading-snug line-clamp-4 px-1">
            {book.title}
          </p>
          {book.author && (
            <p className="text-white/50 text-xs text-center mt-2 line-clamp-2">{book.author}</p>
          )}

          {/* Progress bar */}
          {progress !== null && (
            <div className="absolute bottom-3 left-3 right-3 space-y-1">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/50 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress badge */}
          {progress !== null && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-[10px] px-1.5 py-0 h-5 bg-black/30 text-white/70 border-0"
            >
              {progress}%
            </Badge>
          )}
        </div>

        {/* Label */}
        <div className="px-0.5">
          <p className="text-sm font-medium truncate leading-tight">{book.title}</p>
          {book.author && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{book.author}</p>
          )}
        </div>
      </Link>

      {/* Context menu */}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[140px] text-sm"
          style={{ left: menu.x, top: menu.y }}
        >
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors rounded-md mx-0.5"
          >
            <Trash2 className="size-3.5 shrink-0" />
            Delete book
          </button>
        </div>
      )}
    </>
  );
}
