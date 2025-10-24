// src/app/api/books/[id]/route.ts
import { NextResponse } from "next/server";
import { updateBook, getBookById, deleteBook } from "@/app/lib/services/books";

export async function GET( req: Request,{ params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    const book = await getBookById(id);
    if (!book) {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }
    return NextResponse.json({ book }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while fetching the book." },
      { status: 500 }
    );
  }
}

// PUT /api/books/:id - Update a book by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await req.json();

    const updated = await updateBook(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: "Book not found or invalid ID" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Book updated successfully",
      book: updated,
    });
  } catch (err) {
    console.error("Error updating book:", err);
    return NextResponse.json(
      { error: "An error occurred while updating the book." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("delete function");

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    const book = await getBookById(id);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const deleted = await deleteBook(id);
    if (deleted) {
      return NextResponse.json(
        { message: "Book deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to delete book" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while deleting the book." },
      { status: 500 }
    );
  }
}
