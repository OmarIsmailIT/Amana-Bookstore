// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import BookGrid from './components/BookGrid';
import { Book } from './types';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const fetchBooks = async () => {
      try {
        const res = await fetch('/api/books');
        if (!res.ok) throw new Error(`Failed to fetch books (${res.status})`);
        const data = await res.json();
        // API returns an array of books (or possibly { books } depending on server — handle both)
        const list: Book[] = Array.isArray(data) ? data : data?.books ?? data?.data ?? [];
        if (mounted) setBooks(list);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load books');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchBooks();
    return () => { mounted = false; };
  }, []);

  // Call API to add item to cart
const handleAddToCart = async (bookId: string) => {
  // return the fetch promise so caller can await
  return fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookId, quantity: 1 }),
  }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }));
      throw err;
    }
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    return res.json();
  });
};

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center bg-blue-100 p-8 rounded-lg mb-12 shadow-md">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome to the Amana Bookstore!</h1>
        <p className="text-lg text-gray-600">Your one-stop shop for the best books. Discover new worlds and adventures.</p>
      </section>

      {isLoading ? (
        <div className="text-center py-12">Loading books...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">Error: {error}</div>
      ) : (
        <BookGrid books={books} onAddToCart={handleAddToCart} />
      )}
    </div>
  );
}
