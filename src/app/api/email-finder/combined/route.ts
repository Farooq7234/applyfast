import { NextRequest, NextResponse } from "next/server";
import { findEmailsByDomain as findHunterEmails } from "@/lib/services/hunter";
import { findEmailsByDomain as findSnovEmails } from "@/lib/services/snov";
import { classifyContacts } from "@/lib/email-classifier";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const domain = body.domain?.trim();

    if (!domain) {
      return NextResponse.json(
        { success: false, message: "Domain is required" },
        { status: 400 }
      );
    }

    // Fetch from both providers in parallel
    const [hunterResult, snovResult] = await Promise.allSettled([
      findHunterEmails(domain),
      findSnovEmails(domain),
    ]);

    // Combine results
    const allEmails = [];

    if (hunterResult.status === "fulfilled") {
      allEmails.push(...hunterResult.value);
    }

    if (snovResult.status === "fulfilled") {
      allEmails.push(...snovResult.value);
    }

    // Classify and filter
    const classifiedEmails = classifyContacts(allEmails);

    return NextResponse.json({
      success: true,
      total: classifiedEmails.length,
      emails: classifiedEmails,
    });
  } catch (error) {
    console.error("Combined Email Finder Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
