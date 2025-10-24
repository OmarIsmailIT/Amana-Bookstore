// src/app/scripts/seed.ts
import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import { books as localBooks } from "../data/books";
import { reviews as localReviews } from "../data/reviews";
import { Book, Review } from "../types";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "";
const DATABASE_NAME = "amana-bookstore";

// Collection names
const COLLECTIONS = {
  BOOKS: "books",
  REVIEWS: "reviews",
  CART: "cart",
};

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

// ==================== SEED FUNCTIONS ====================

/**
 * Seed the books collection
 * - Clears existing data
 * - Removes 'id' field (MongoDB uses _id)
 * - Inserts fresh book data
 * - Returns mapping of old IDs to new MongoDB ObjectIds
 */
async function seedBooks(db: Db): Promise<Map<string, ObjectId>> {
  console.log("\n📚 SEEDING BOOKS COLLECTION...");
  console.log("═".repeat(50));

  const booksCollection = db.collection(COLLECTIONS.BOOKS);
  const idMapping = new Map<string, ObjectId>();

  try {
    // Step 1: Clear existing books
    console.log("🗑️  Clearing existing books...");
    const deleteResult = await booksCollection.deleteMany({});
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} existing books`);

    // Step 2: Transform books data and track old IDs
    console.log("🔄 Transforming book data...");
    const booksToInsert = localBooks.map((book: Book) => {
      const { id, ...bookWithoutId } = book;
      return { oldId: id, ...bookWithoutId };
    });
    console.log(`   ✅ Transformed ${booksToInsert.length} books`);

    // Step 3: Insert books
    console.log(`📥 Inserting ${booksToInsert.length} books into database...`);
    const insertResult = await booksCollection.insertMany(booksToInsert);
    console.log(
      `   ✅ Successfully inserted ${insertResult.insertedCount} books!`
    );

    // Step 4: Create mapping from old IDs to new MongoDB ObjectIds
    console.log("🗺️  Creating ID mapping...");
    for (let i = 0; i < booksToInsert.length; i++) {
      const oldId = booksToInsert[i].oldId;
      const newId = insertResult.insertedIds[i];
      idMapping.set(oldId, newId);
    }
    console.log(`   ✅ Created mapping for ${idMapping.size} books`);

    // Step 5: Remove the temporary oldId field from all books
    await booksCollection.updateMany({}, { $unset: { oldId: "" } });
    console.log("   ✅ Cleaned up temporary oldId field");

    console.log(
      `   📊 Inserted IDs: ${
        Object.keys(insertResult.insertedIds).length
      } documents`
    );
    
    return idMapping;
  } catch (err) {
    console.error("❌ Error seeding books:", err);
    throw err;
  }
}

/**
 * Seed the reviews collection
 * - Clears existing reviews
 * - Removes 'id' field (MongoDB uses _id)
 * - Maps old bookId to new MongoDB ObjectIds
 * - Inserts fresh review data with correct bookId references
 */
async function seedReviews(
  db: Db,
  bookIdMapping: Map<string, ObjectId>
): Promise<void> {
  console.log("\n⭐ SEEDING REVIEWS COLLECTION...");
  console.log("═".repeat(50));

  const reviewsCollection = db.collection(COLLECTIONS.REVIEWS);

  try {
    // Step 1: Clear existing reviews
    console.log("🗑️  Clearing existing reviews...");
    const deleteResult = await reviewsCollection.deleteMany({});
    console.log(`   ✅ Deleted ${deleteResult.deletedCount} existing reviews`);

    // Step 2: Transform reviews data with new bookId references
    console.log("🔄 Transforming review data and mapping bookIds...");
    const reviewsToInsert = localReviews.map((review: Review) => {
      const { id, bookId, ...reviewWithoutId } = review;
      
      // Map old bookId to new MongoDB ObjectId
      const newBookId = bookIdMapping.get(bookId);
      
      if (!newBookId) {
        console.warn(`   ⚠️  Warning: No mapping found for bookId: ${bookId}`);
        return null;
      }
      
      return {
        ...reviewWithoutId,
        bookId: newBookId, // Use the new MongoDB ObjectId
      };
    }).filter(review => review !== null); // Remove any reviews with invalid bookIds

    console.log(`   ✅ Transformed ${reviewsToInsert.length} reviews`);

    // Step 3: Insert reviews
    console.log(
      `📥 Inserting ${reviewsToInsert.length} reviews into database...`
    );
    const insertResult = await reviewsCollection.insertMany(reviewsToInsert);
    console.log(
      `   ✅ Successfully inserted ${insertResult.insertedCount} reviews!`
    );

    // Step 4: Show review stats
    const reviewStats = localReviews.reduce((acc, review) => {
      acc[review.bookId] = (acc[review.bookId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(
      `   📊 Reviews distributed across ${
        Object.keys(reviewStats).length
      } books`
    );
  } catch (err) {
    console.error("❌ Error seeding reviews:", err);
    throw err;
  }
}

/**
 * Initialize the cart collection
 * - Creates an empty collection (no pre-seed data)
 * - Cart items are added by users through the application
 * - Creates collection if it doesn't exist
 */
async function initializeCart(db: Db): Promise<void> {
  console.log("\n🛒 INITIALIZING CART COLLECTION...");
  console.log("═".repeat(50));

  try {
    const collections = await db.listCollections().toArray();
    const cartExists = collections.some((col) => col.name === COLLECTIONS.CART);

    if (!cartExists) {
      console.log("🔨 Cart collection does not exist, creating...");
      await db.createCollection(COLLECTIONS.CART);
      console.log("   ✅ Cart collection created successfully!");
    } else {
      console.log("   ℹ️  Cart collection already exists");
    }

    // Show cart collection status
    const cartCollection = db.collection(COLLECTIONS.CART);
    const cartCount = await cartCollection.countDocuments();
    console.log(
      `   📊 Cart collection has ${cartCount} items (will be populated by users)`
    );
  } catch (err) {
    console.error("❌ Error initializing cart:", err);
    throw err;
  }
}

/**
 * Main seed function
 * - Orchestrates all seeding operations
 * - Handles connection lifecycle
 * - Provides comprehensive logging
 */
async function seedDatabase() {
  console.log("\n" + "╔".repeat(50));
  console.log("🚀 AMANA BOOKSTORE DATABASE SEEDER");
  console.log("╚".repeat(50));

  const client = new MongoClient(MONGODB_URI);

  try {
    // Connection Phase
    console.log("\n🔗 CONNECTION PHASE");
    console.log("═".repeat(50));
    console.log("Connecting to MongoDB...");
    console.log(`   📍 Database: ${DATABASE_NAME}`);

    await client.connect();
    console.log("   ✅ Connected successfully!");

    const db = client.db(DATABASE_NAME);

    // Seeding Phase
    console.log("\n" + "╔".repeat(50));
    console.log("🌱 SEEDING PHASE");
    console.log("╚".repeat(50));

    // Seed collections in order - books first to get ID mapping
    const bookIdMapping = await seedBooks(db);
    await seedReviews(db, bookIdMapping);
    await initializeCart(db);

    // Summary Phase
    console.log("\n" + "╔".repeat(50));
    console.log("📊 SEEDING SUMMARY");
    console.log("╚".repeat(50));

    const booksCollection = db.collection(COLLECTIONS.BOOKS);
    const reviewsCollection = db.collection(COLLECTIONS.REVIEWS);
    const cartCollection = db.collection(COLLECTIONS.CART);

    const bookCount = await booksCollection.countDocuments();
    const reviewCount = await reviewsCollection.countDocuments();
    const cartCount = await cartCollection.countDocuments();

    console.log(`📚 Books: ${bookCount} documents`);
    console.log(`⭐ Reviews: ${reviewCount} documents`);
    console.log(`🛒 Cart: ${cartCount} documents (empty, ready for users)`);
  } catch (err) {
    console.error("\n❌ SEEDING FAILED!");
    console.error("Error Details:", err);
    process.exit(1);
  } finally {
    // Cleanup Phase
    console.log("\n" + "╔".repeat(50));
    console.log("🔌 CLEANUP PHASE");
    console.log("╚".repeat(50));
    console.log("Closing database connection...");
    await client.close();
    console.log("   ✅ Connection closed.");
    console.log("\n" + "╔".repeat(50));
    console.log("✨ SEEDING COMPLETED SUCCESSFULLY!");
    console.log("╚".repeat(50) + "\n");
  }
}

// Run the seed function
seedDatabase();