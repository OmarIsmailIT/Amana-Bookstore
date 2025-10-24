// src/app/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartItem from '../components/CartItem';
import { Book } from '../types';

type CartApiItem = {
  id: string;        // cart item id
  bookId: string;    // book id
  quantity: number;
  addedAt: string;
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<{ book: Book; quantity: number; cartItemId: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      // fetch cart items from API
      const cartRes = await fetch('/api/cart');
      if (!cartRes.ok) throw new Error(`Failed to fetch cart (${cartRes.status})`);
      const cartData: CartApiItem[] = await cartRes.json();

      // fetch all books and map them by id for quick lookup
      const booksRes = await fetch('/api/books');
      if (!booksRes.ok) throw new Error(`Failed to fetch books (${booksRes.status})`);
      const booksData = await booksRes.json();
      const booksList: Book[] = Array.isArray(booksData) ? booksData : booksData?.books ?? booksData ?? [];
      const byId = new Map(booksList.map(b => [b.id, b] as [string, Book]));

      const combined = cartData.map(ci => {
        const book = byId.get(ci.bookId);
        return book ? { book, quantity: ci.quantity, cartItemId: ci.id } : null;
      }).filter((x): x is { book: Book; quantity: number; cartItemId: string } => x !== null);

      setCartItems(combined);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // update on 'cartUpdated' events (from other pages)
    const handler = () => fetchCart();
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, []);

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId, quantity: newQuantity }),
      });
      if (!res.ok) {
        console.error('Failed to update cart item', await res.json().catch(() => ({})));
        return;
      }
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      await fetchCart();
    } catch (err) {
      console.error('Update quantity error', err);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/cart?cartItemId=${encodeURIComponent(cartItemId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        console.error('Failed to remove item', await res.json().catch(() => ({})));
        return;
      }
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      await fetchCart();
    } catch (err) {
      console.error('Remove item error', err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch(`/api/cart?clear=true`, { method: 'DELETE' });
      if (!res.ok) {
        console.error('Failed to clear cart', await res.json().catch(() => ({})));
        return;
      }
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      await fetchCart();
    } catch (err) {
      console.error('Clear cart error', err);
    }
  };

  const totalPrice = cartItems.reduce((total, item) => total + (item.book.price * item.quantity), 0);

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h2 className="text-xl text-gray-600 mb-4">Your cart is empty</h2>
          <Link href="/" className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md">
            {cartItems.map((item) => (
              <CartItem
                key={item.cartItemId}
                item={{ book: item.book, quantity: item.quantity }}
                onUpdateQuantity={(bookId, qty) => updateQuantity(item.cartItemId, qty)}
                onRemoveItem={() => removeItem(item.cartItemId)}
              />
            ))}
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center text-xl font-bold mb-4 text-gray-800">
              <span>Total: ${totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="flex-1 bg-gray-500 text-white text-center py-3 rounded-md hover:bg-gray-600 transition-colors">Continue Shopping</Link>
              <button onClick={clearCart} className="flex-1 bg-red-500 text-white py-3 rounded-md hover:bg-red-600 transition-colors">Clear Cart</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
