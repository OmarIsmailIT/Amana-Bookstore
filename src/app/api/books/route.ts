// src/app/api/books/route.ts
import { NextResponse } from "next/server";
import { books } from "../../data/books";
import { Book } from "../../types";

// src/app/api/books/route.ts
import { getAllBooks, createBook } from "../../lib/services/books";

// GET /api/books - Return all books from MongoDB
export async function GET() {
  try {
    const books = await getAllBooks(); // Calls the MONGODB function to fetch all the books
    console.log("BOOKS API CALLED !!!!!!!");
    console.log("Books:", books);
    return NextResponse.json(books);
  } catch (err) {
    console.error("Error fetching books:", err);
    // It's good practice to not expose detailed error messages to the client
    return NextResponse.json(
      { error: "An error occurred while fetching books." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requiredFields: (keyof Omit<Book, "id">)[] = [
      "title",
      "author",
      "description",
      "price",
      "image",
      "isbn",
      "genre",
      "tags",
      "datePublished",
      "pages",
      "language",
      "publisher",
      "rating",
      "reviewCount",
      "inStock",
      "featured",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    // In a real application, this would add a new book to the database
    console.log("Adding book:", body);
    const newBook = await createBook(body); // Calls the MONGODB function to add a new book
    console.log("Book added successfully");
    return NextResponse.json({
      message: "Book added successfully",
      newBook: newBook,
    });
  } catch (err) {
    console.error("Error inserting book:", err);
    return NextResponse.json(
      { error: "An error occurred while inserting the book." },
      { status: 500 }
    );
  }
}

// Note: You can now implement POST, PUT, DELETE handlers here as well,
// using the createBook, updateBook, and deleteBook functions.

// GET /api/books - Return all books -- OLD route with filesystem Data
// export async function GET() {
//   try {
//     return NextResponse.json(books);
//   } catch (err) {
//     console.error('Error fetching books:', err);
//     return NextResponse.json(
//       { error: 'Failed to fetch books' },
//       { status: 500 }
//     );
//   }
// }

// Future implementation notes:
// - Connect to a database (e.g., PostgreSQL, MongoDB)
// - Add authentication middleware for admin operations
// - Implement pagination for large datasets
// - Add filtering and search query parameters
// - Include proper error handling and logging
// - Add rate limiting for API protection
// - Implement caching strategies for better performance

// Example future database integration:
// import { db } from '@/lib/database';
//
// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const page = parseInt(searchParams.get('page') || '1');
//   const limit = parseInt(searchParams.get('limit') || '10');
//   const genre = searchParams.get('genre');
//
//   try {
//     const books = await db.books.findMany({
//       where: genre ? { genre: { contains: genre } } : {},
//       skip: (page - 1) * limit,
//       take: limit,
//     });
//
//     return NextResponse.json(books);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Database connection failed' },
//       { status: 500 }
//     );
//   }
// }
