// src/app/lib/services/reviews.ts
import { Collection, ObjectId } from 'mongodb';
import { connectToDatabase } from '../mongodb';
import { Review } from '@/app/types'; // Assuming your type is exported from here

// Define the shape of the review document in the database
// This is separate from the Review type to handle ObjectId
interface ReviewDocument {
  bookId: ObjectId;
  author: string;
  rating: number;
  title: string;
  comment: string;
  timestamp: string;
  verified: boolean;
}

// Helper function to get the 'reviews' collection
async function getReviewsCollection(): Promise<Collection<ReviewDocument>> {
  const { db } = await connectToDatabase();
  return db.collection<ReviewDocument>('reviews');
}

// Helper to map MongoDB's _id to our desired id field
function mapMongoId(doc: any): Review {
  const { _id, ...rest } = doc;
  return { 
    id: _id.toHexString(), 
    ...rest,
    bookId: rest.bookId.toHexString(), // Convert bookId back to string
  } as Review;
}

// READ: Get all reviews
export async function getAllReviews(): Promise<Review[]> {
  const collection = await getReviewsCollection();
  const documents = await collection.find({}).toArray();
  return documents.map(mapMongoId);
}

// READ: Get a single review by its ID
export async function getReviewById(id: string): Promise<Review | null> {
  if (!ObjectId.isValid(id)) {
    return null; // Invalid ID format
  }
  const collection = await getReviewsCollection();
  const document = await collection.findOne({ _id: new ObjectId(id) });
  return document ? mapMongoId(document) : null;
}

// READ: Get all reviews for a specific book
export async function getReviewsByBookId(bookId: string): Promise<Review[] | null> {
  if (!ObjectId.isValid(bookId)) {
    return null; // Invalid bookId format
  }
  const collection = await getReviewsCollection();
  // This query is now valid because the collection is Collection<ReviewDocument>
  const documents = await collection.find({ bookId: new ObjectId(bookId) }).toArray();
  return documents.map(mapMongoId);
}

// CREATE: Add a new review
// The input `reviewData` comes from the API, matching Omit<Review, 'id'> (with bookId: string)
export async function createReview(reviewData: Omit<Review, 'id'>): Promise<Review> {
  const collection = await getReviewsCollection();
  
  // Convert string bookId to ObjectId before insertion
  const reviewDocument: ReviewDocument = {
    ...reviewData,
    bookId: new ObjectId(reviewData.bookId),
    timestamp: new Date().toISOString(), // Ensure timestamp is current
    verified: reviewData.verified || false,
  };

  // This insert is now valid because reviewDocument matches ReviewDocument
  const result = await collection.insertOne(reviewDocument);
  
  // Fetch the newly created document to return it
  const newReview = await collection.findOne({ _id: result.insertedId });
  if (!newReview) {
    throw new Error('Failed to create and retrieve the new review.');
  }
  return mapMongoId(newReview);
}

// UPDATE: Modify an existing review
export async function updateReview(id: string, updates: Partial<Omit<Review, 'id'>>): Promise<Review | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = await getReviewsCollection();
  
  // Destructure bookId (string) from the rest of the updates
  const { bookId, ...restOfUpdates } = updates;

  // Create a DB-compatible update object with all properties EXCEPT bookId
  const dbUpdates: Partial<ReviewDocument> & { [key: string]: any } = { ...restOfUpdates };

  // If bookId was provided and is valid, convert it to ObjectId and add to dbUpdates
  if (bookId && ObjectId.isValid(bookId)) {
    dbUpdates.bookId = new ObjectId(bookId);
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: dbUpdates },
    { returnDocument: 'after' } // Returns the document after the update
  );
  return result ? mapMongoId(result) : null;
}

// DELETE: Remove a review
export async function deleteReview(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  const collection = await getReviewsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

