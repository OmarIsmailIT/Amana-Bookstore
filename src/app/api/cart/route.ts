// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from '../../lib/services/cart';

// GET /api/cart - Get all cart items
export async function GET(request: Request) {
  try {
    const cartItems = await getCart(); // No userId needed
    return NextResponse.json(cartItems);
  } catch (err) {
    console.error('Error fetching cart items:', err);
    return NextResponse.json(
      { error: 'An error occurred while fetching cart items.' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart (or update quantity if exists)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookId, quantity } = body; // No userId needed

    if (!bookId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, quantity' },
        { status: 400 }
      );
    }
    
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    const newItem = await addCartItem({ bookId, quantity }); // No userId needed
    return NextResponse.json({
      message: 'Item added/updated in cart successfully',
      item: newItem,
    }, { status: 201 });

  } catch (err) {
    console.error('Error adding item to cart:', err);
    return NextResponse.json(
      { error: 'An error occurred while adding the item to the cart.' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { cartItemId, quantity } = body; // No userId needed

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: cartItemId, quantity' },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-negative number' },
        { status: 400 }
      );
    }

    const updatedItem = await updateCartItemQuantity(cartItemId, quantity); // No userId needed
    
    if (updatedItem) {
      return NextResponse.json({
        message: 'Cart item updated successfully',
        item: updatedItem,
      });
    } else if (quantity === 0) {
       return NextResponse.json({
        message: 'Cart item removed successfully (quantity set to 0)',
      });
    } else {
       return NextResponse.json(
        { error: 'Failed to update item. Item not found.' },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error('Error updating cart item:', err);
    return NextResponse.json(
      { error: 'An error occurred while updating the cart item.' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart?cartItemId=... - Remove single item
// DELETE /api/cart?clear=true - Clear entire cart
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');
    const clear = searchParams.get('clear');

    if (cartItemId) {
      // Remove a single item
      const deleted = await removeCartItem(cartItemId); // No userId needed
      if (deleted) {
        return NextResponse.json({
          message: 'Item removed from cart successfully',
          cartItemId,
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to remove item. Item not found.' },
          { status: 404 }
        );
      }
    } else if (clear === 'true') {
      // Clear the entire cart
      const deletedCount = await clearCart(); // No userId needed
      return NextResponse.json({
        message: `Cart cleared successfully. ${deletedCount} items removed.`,
        deletedCount,
      });
    } else {
      return NextResponse.json(
        { error: 'Missing cartItemId or clear=true parameter' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('Error removing cart item(s):', err);
    return NextResponse.json(
      { error: 'An error occurred while modifying the cart.' },
      { status: 500 }
    );
  }
}

