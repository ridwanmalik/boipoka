'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

type Props = {
  bookId: number;
  title: string;
  author: string | null;
  initialPage: number;
  pdfUrl: string;
};

export default function PdfViewer({ bookId, title, author, initialPage, pdfUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(true);
  const renderTaskRef = useRef<any>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load PDF.js from CDN
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      pdfjsLib.getDocument(pdfUrl).promise.then((doc: any) => {
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        // Save total pages
        fetch(`/api/books/${bookId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalPages: doc.numPages }),
        });
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [pdfUrl, bookId]);

  const renderPage = useCallback(async (num: number, doc: any) => {
    if (!doc || !canvasRef.current) return;
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }
    setLoading(true);
    const page = await doc.getPage(num);
    const scale = Math.min(window.innerWidth * 0.9 / page.getViewport({ scale: 1 }).width, 1.8);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const task = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (pdfDoc) renderPage(pageNum, pdfDoc);
  }, [pdfDoc, pageNum, renderPage]);

  // Auto-save last page
  const savePage = useCallback((page: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPage: page }),
      });
    }, 1000);
  }, [bookId]);

  const goTo = (n: number) => {
    if (n < 1 || n > totalPages) return;
    setPageNum(n);
    savePage(n);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(pageNum + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(pageNum - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pageNum, totalPages]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-neutral-400 hover:text-white text-sm transition-colors">← Back</Link>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{title}</p>
          {author && <p className="text-neutral-500 text-xs truncate">{author}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => goTo(pageNum - 1)} disabled={pageNum <= 1 || !pdfDoc} className="px-3 py-1.5 bg-neutral-800 rounded-lg text-sm disabled:opacity-30 hover:bg-neutral-700 transition-colors">←</button>
          <span className="text-neutral-400 text-sm min-w-[70px] text-center">
            {totalPages ? `${pageNum} / ${totalPages}` : '…'}
          </span>
          <button onClick={() => goTo(pageNum + 1)} disabled={pageNum >= totalPages || !pdfDoc} className="px-3 py-1.5 bg-neutral-800 rounded-lg text-sm disabled:opacity-30 hover:bg-neutral-700 transition-colors">→</button>
          <button
            onClick={() => setDark(d => !d)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${dark ? 'bg-neutral-700 text-green-400' : 'bg-neutral-800 text-neutral-400'}`}
          >
            {dark ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-6 px-2 overflow-auto">
        {loading && !pdfDoc && (
          <div className="flex items-center justify-center h-64 text-neutral-500">Loading PDF…</div>
        )}
        <canvas
          ref={canvasRef}
          className="rounded shadow-2xl max-w-full transition-[filter] duration-200"
          style={{ filter: dark ? 'invert(1) hue-rotate(180deg)' : 'none' }}
        />
      </main>
    </div>
  );
}
