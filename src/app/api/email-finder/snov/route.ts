import { findEmailsByDomain } from "@/lib/services/snov";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        {
          message: "Domain is required",
        },
        {
          status: 400,
        }
      );
    }

    const emails = await findEmailsByDomain(domain.trim());

    return NextResponse.json({
      success: true,
      emails,
    });
  } catch (error) {
    console.error("Snov Email Finder Error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}