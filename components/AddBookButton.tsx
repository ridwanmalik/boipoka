'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      <Button onClick={() => setOpen(true)} size="lg">
        + Add Book
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Book</DialogTitle>
          </DialogHeader>

          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5 mt-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pdf">PDF File</Label>
              <Input
                id="pdf"
                name="pdf"
                type="file"
                accept="application/pdf"
                required
                className="cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" type="text" required placeholder="Book title" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="author">
                Author{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input id="author" name="author" type="text" placeholder="Author name" />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Uploading…' : 'Add Book'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
