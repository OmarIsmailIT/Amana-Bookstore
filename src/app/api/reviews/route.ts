// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import {
  getAllReviews,
  getReviewsByBookId,
  createReview,
} from "../../lib/services/reviews";
import { Review } from "../../types";

// GET /api/reviews - Get all reviews or reviews for a specific book
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  try {
    if (bookId) {
      // Get reviews for a specific book
      const reviews = await getReviewsByBookId(bookId);
      if (reviews === null) {
        return NextResponse.json(
          { error: "Invalid Book ID format" },
          { status: 400 }
        );
      }
      return NextResponse.json(reviews);
    } else {
      // Get all reviews
      const reviews = await getAllReviews();
      return NextResponse.json(reviews);
    }
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json(
      { error: "An error occurred while fetching reviews." },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    const requiredFields: (keyof Omit<Review, "id" | "timestamp" | "verified">)[] = [
      "bookId",
      "author",
      "rating",
      "title",
      "comment",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Add default values for non-required fields if not provided
    const reviewData: Omit<Review, 'id'> = {
      ...body,
      timestamp: new Date().toISOString(),
      verified: body.verified || false, // Default verified to false
    };

    const newReview = await createReview(reviewData);
    
    return NextResponse.json({
      message: "Review added successfully",
      review: newReview,
    }, { status: 201 });

  } catch (err) {
    console.error("Error creating review:", err);
    return NextResponse.json(
      { error: "An error occurred while creating the review." },
      { status: 500 }
    );
  }
}
