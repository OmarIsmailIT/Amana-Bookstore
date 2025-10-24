// src/app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useState, useEffect } from 'react';
import { CartItem } from '../types';

const Navbar: React.FC = () => {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

    async function fetchCartCount() {
    try {
      setLoading(true);
      const res = await fetch('/api/cart');
      if (!res.ok) {
        console.error('Failed to fetch cart count', res.status);
        setCartItemCount(0);
        return;
      }
      const data = await res.json();
      // data expected: array of cart items [{ id, bookId, quantity, ...}, ...]
      const total = Array.isArray(data) ? data.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0) : 0;
      setCartItemCount(total);
    } catch (err) {
      console.error('Error fetching cart', err);
      setCartItemCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCartCount();
    const handler = () => fetchCartCount();
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, []);
  
  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800 cursor-pointer">
          Amana Bookstore
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/" className={`text-gray-600 hover:text-blue-500 cursor-pointer ${pathname === '/' ? 'text-blue-500 font-semibold' : ''}`}>
            Home
          </Link>
          <Link href="/cart" className={`text-gray-600 hover:text-blue-500 flex items-center cursor-pointer ${pathname === '/cart' ? 'text-blue-500 font-semibold' : ''}`}>
            My Cart
            {cartItemCount > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
