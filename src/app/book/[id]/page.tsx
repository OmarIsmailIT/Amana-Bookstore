// src/app/book/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book, Review } from '../../types';

export default function BookDetailPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [bookReviews, setBookReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useParams() as { id?: string | string[] | undefined };
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? '');

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const fetchBookAndReviews = async () => {
      try {
        setIsLoading(true);
        // fetch book by id
        const bookRes = await fetch(`/api/books/${id}`);
        if (!bookRes.ok) throw new Error(`Failed to fetch book (${bookRes.status})`);
        const bookData = await bookRes.json();
        // server returns { book } in route.ts — handle both shapes
        const fetchedBook: Book = bookData?.book ?? bookData;

        // fetch reviews for this book
        const reviewsRes = await fetch(`/api/reviews?bookId=${encodeURIComponent(id)}`);
        if (!reviewsRes.ok) throw new Error(`Failed to fetch reviews (${reviewsRes.status})`);
        const reviewsData = await reviewsRes.json();

        if (mounted) {
          setBook(fetchedBook || null);
          setBookReviews(Array.isArray(reviewsData) ? reviewsData : []);
        }
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load book');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchBookAndReviews();
    return () => { mounted = false; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!book) return;
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, quantity }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        console.error('Add to cart failed', err);
        return;
      }
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      router.push('/cart');
    } catch (err) {
      console.error('Add to cart error', err);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-yellow-400 ${i <= rating ? 'fill-current' : 'text-gray-300'}`}>★</span>
      );
    }
    return stars;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (error) return (
    <div className="text-center py-10">
      <h1 className="text-2xl font-bold text-red-500">{error}</h1>
      <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">Back to Home</Link>
    </div>
  );
  if (!book) return <div className="text-center py-10">Book not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative h-96 md:h-[600px] w-full shadow-lg rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
          <div className="text-8xl text-gray-400">📚</div>
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

          <div className="flex items-center mb-4">
            {renderStars(book.rating)}
            <span className="text-md text-gray-500 ml-2">({book.reviewCount} reviews)</span>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">{book.description}</p>

          <div className="mb-4">
            {book.genre.map((g) => (
              <span key={g} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{g}</span>
            ))}
          </div>

          <div className="text-3xl font-bold text-blue-600 mb-6">${book.price.toFixed(2)}</div>

          <div className="flex items-center space-x-4 mb-6">
            <label htmlFor="quantity" className="font-semibold">Quantity:</label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button onClick={handleAddToCart} className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors duration-300 text-lg font-semibold">
            Add to Cart
          </button>

          <Link href="/" className="text-blue-500 hover:underline mt-6 text-center">&larr; Back to Home</Link>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>

        {bookReviews.length > 0 ? (
          <div className="space-y-6">
            {bookReviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">{formatDate(review.timestamp)}</span>
                    {review.verified && (
                      <>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified Purchase</span>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{review.title}</h3>
                <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">by {review.author}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No reviews yet. Be the first to review this book!</p>
          </div>
        )}
      </div>
    </div>
  );
}
