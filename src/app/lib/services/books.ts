// src/lib/services/books.ts
import { Collection, ObjectId } from 'mongodb';
import { connectToDatabase } from '../mongodb';
import { Book } from '@/app/types'; // Assuming your type is exported from here

// Helper function to get the 'books' collection
async function getBooksCollection(): Promise<Collection<Omit<Book, 'id'>>> {
  const { db } = await connectToDatabase();
  // We use Omit<Book, 'id'> because MongoDB uses `_id` and we'll map it to `id`
  return db.collection<Omit<Book, 'id'>>('books');
}

// Helper to map MongoDB's _id to our desired id field
function mapMongoId(doc: any): Book {
  const { _id, ...rest } = doc;
  return { id: _id.toHexString(), ...rest } as Book;
}

// READ: Get all books
export async function getAllBooks(): Promise<Book[]> {
  const collection = await getBooksCollection();
  const documents = await collection.find({}).toArray();
  return documents.map(mapMongoId);
}

// READ: Get a single book by its ID
export async function getBookById(id: string): Promise<Book | null> {
  if (!ObjectId.isValid(id)) {
    return null; // Invalid ID format
  }
  const collection = await getBooksCollection();
  const document = await collection.findOne({ _id: new ObjectId(id) });
  return document ? mapMongoId(document) : null;
}

// CREATE: Add a new book
// The input `bookData` should not include an `id`
export async function createBook(bookData: Omit<Book, 'id'>): Promise<Book> {
  const collection = await getBooksCollection();
  const result = await collection.insertOne(bookData);
  
  // Fetch the newly created document to return it
  const newBook = await collection.findOne({ _id: result.insertedId });
  if (!newBook) {
    throw new Error('Failed to create and retrieve the new book.');
  }
  return mapMongoId(newBook);
}

// UPDATE: Modify an existing book
export async function updateBook(id: string, updates: Partial<Omit<Book, 'id'>>): Promise<Book | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = await getBooksCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: 'after' } // Returns the document after the update
  );
  return result ? mapMongoId(result) : null;
}

// DELETE: Remove a book
export async function deleteBook(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const collection = await getBooksCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}