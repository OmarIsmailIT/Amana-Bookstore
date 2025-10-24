// src/app/lib/services/cart.ts
import { Collection, ObjectId } from 'mongodb';
import { connectToDatabase } from '../mongodb';
import { CartItem } from '@/app/types'; // Assuming your type is exported from here

// Define the shape of the cart item in the database
// This is separate from the CartItem type to handle ObjectId
interface CartItemDocument {
  bookId: ObjectId; // Store bookId as ObjectId
  quantity: number;
  addedAt: string;
}

// Define the shape of the item returned by the service
// This matches the external CartItem interface
type CartItemWithId = CartItem;

// Helper function to get the 'cart' collection
async function getCartCollection(): Promise<Collection<CartItemDocument>> {
  const { db } = await connectToDatabase();
  return db.collection<CartItemDocument>('cart');
}

// Helper to map MongoDB's _id to our desired id field
function mapMongoId(doc: any): CartItemWithId {
  const { _id, ...rest } = doc;
  return { 
    id: _id.toHexString(), 
    ...rest,
    bookId: rest.bookId.toHexString(), // Convert bookId back to string
  } as CartItemWithId;
}

// READ: Get all cart items
export async function getCart(): Promise<CartItemWithId[]> {
  const collection = await getCartCollection();
  const documents = await collection.find({}).toArray(); // Find all, no userId filter
  return documents.map(mapMongoId);
}

// CREATE: Add an item to the cart, or update quantity if it already exists
export async function addCartItem(itemData: { bookId: string, quantity: number }): Promise<CartItemWithId> {
  if (!ObjectId.isValid(itemData.bookId)) {
    throw new Error('Invalid Book ID');
  }

  const collection = await getCartCollection();
  const bookObjectId = new ObjectId(itemData.bookId);

  // Check if the item already exists in the cart
  const existingItem = await collection.findOne({
    bookId: bookObjectId, // Find by bookId only
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + itemData.quantity;
    const result = await collection.findOneAndUpdate(
      { _id: existingItem._id },
      { $set: { quantity: newQuantity } }, // Removed $setOnInsert, not needed here
      { returnDocument: 'after' }
    );
    if (!result) throw new Error('Failed to update cart item');
    return mapMongoId(result);
  } else {
    // Insert new item
    const newItemDocument: CartItemDocument = {
      bookId: bookObjectId,
      quantity: itemData.quantity,
      addedAt: new Date().toISOString(),
    };
    const result = await collection.insertOne(newItemDocument);
    
    // Fetch and return the new item
    const newItem = await collection.findOne({ _id: result.insertedId });
    if (!newItem) throw new Error('Failed to create and retrieve cart item');
    return mapMongoId(newItem);
  }
}

// UPDATE: Update a cart item's quantity
export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartItemWithId | null> {
  if (!ObjectId.isValid(cartItemId)) {
    return null;
  }
  if (quantity <= 0) {
    // If quantity is 0 or less, remove the item
    await removeCartItem(cartItemId);
    return null;
  }

  const collection = await getCartCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(cartItemId) }, // Find by _id only
    { $set: { quantity: quantity } },
    { returnDocument: 'after' }
  );
  return result ? mapMongoId(result) : null;
}

// DELETE: Remove a specific item from the cart
export async function removeCartItem(cartItemId: string): Promise<boolean> {
  if (!ObjectId.isValid(cartItemId)) {
    return false;
  }
  const collection = await getCartCollection();
  const result = await collection.deleteOne({ 
    _id: new ObjectId(cartItemId), // Delete by _id only
  });
  return result.deletedCount === 1;
}

// DELETE: Clear all items from the cart
export async function clearCart(): Promise<number> {
  const collection = await getCartCollection();
  const result = await collection.deleteMany({}); // Delete all
  return result.deletedCount;
}

