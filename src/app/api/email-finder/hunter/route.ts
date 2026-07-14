import { NextRequest, NextResponse } from "next/server";
import { findEmailsByDomain } from "@/lib/services/hunter";
import { classifyContacts } from "@/lib/email-classifier";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const domain = body.domain?.trim();

    if (!domain) {
      return NextResponse.json(
        {
          success: false,
          message: "Domain is required",
        },
        {
          status: 400,
        }
      );
    }

    const emails = await findEmailsByDomain(domain);
    const classifiedEmails = classifyContacts(emails);

    return NextResponse.json({
      success: true,
      provider: "hunter",
      total: classifiedEmails.length,
      emails: classifiedEmails,
    });
  } catch (error) {
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