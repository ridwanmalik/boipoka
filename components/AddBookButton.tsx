'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AddBookButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const file = (form.elements.namedItem('pdf') as HTMLInputElement).files?.[0];
    if (!file) { setError('Please select a PDF file.'); return; }

    const data = new FormData(form);
    setLoading(true);
    try {
      const res = await fetch('/api/books', { method: 'POST', body: data });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Upload failed'); }
      setOpen(false);
      formRef.current?.reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-white text-neutral-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
      >
        + Add Book
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Add Book</h2>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-white text-xl leading-none">✕</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">PDF File</label>
                <input
                  name="pdf"
                  type="file"
                  accept="application/pdf"
                  required
                  className="w-full text-sm text-neutral-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-neutral-700 file:text-neutral-200 file:cursor-pointer hover:file:bg-neutral-600 file:transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Title</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Book title"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Author <span className="text-neutral-600">(optional)</span></label>
                <input
                  name="author"
                  type="text"
                  placeholder="Author name"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-white text-neutral-900 font-semibold text-sm py-2 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Uploading…' : 'Add Book'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
