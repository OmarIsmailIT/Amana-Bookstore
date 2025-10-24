// src/app/api/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import {
  getReviewById,
  updateReview,
  deleteReview,
} from "@/app/lib/services/reviews";

// GET /api/reviews/:id - Get a single review by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    const review = await getReviewById(id);
    if (!review) {
      return NextResponse.json({ message: "Review not found" }, { status: 404 });
    }
    return NextResponse.json({ review }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while fetching the review." },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/:id - Update a review by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await req.json();

    const updated = await updateReview(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: "Review not found or invalid ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Review updated successfully",
      review: updated,
    });
  } catch (err) {
    console.error("Error updating review:", err);
    return NextResponse.json(
      { error: "An error occurred while updating the review." },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/:id - Delete a review by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    
    const deleted = await deleteReview(id);
    
    if (deleted) {
      return NextResponse.json(
        { message: "Review deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Review not found or failed to delete" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while deleting the review." },
      { status: 500 }
    );
  }
}
