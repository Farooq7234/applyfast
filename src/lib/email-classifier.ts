interface Contact {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  title?: string;
  position?: string;
  confidence?: number;
  source: string;
}

interface ClassifiedContact {
  name: string;
  email: string;
  title: string;
  category: "founder" | "engineering" | "recruiter" | "hr" | "people_ops" | "other";
  priorityScore: number;
  confidence?: number;
  source: string;
}

export function classifyContacts(contacts: Contact[]): ClassifiedContact[] {
  const classified: ClassifiedContact[] = [];
  const seenEmails = new Set<string>();

  // First deduplicate by email (prefer hunter for duplicates since it has confidence)
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.source === "hunter" && b.source !== "hunter") return -1;
    if (b.source === "hunter" && a.source !== "hunter") return 1;
    return 0;
  });

  for (const contact of sortedContacts) {
    if (seenEmails.has(contact.email)) continue;
    seenEmails.add(contact.email);

    const name =
      contact.name ||
      (contact.firstName || contact.lastName
        ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
        : "Unknown");

    const title = contact.title || contact.position || "";
    const lowerTitle = title.toLowerCase();

    let category: ClassifiedContact["category"] = "other";
    let priorityScore = 0;

    // Founder checks (highest priority)
    if (
      lowerTitle.includes("founder") ||
      lowerTitle.includes("ceo") ||
      lowerTitle.includes("owner") ||
      lowerTitle.includes("managing director")
    ) {
      category = "founder";
      priorityScore = 100;
    }
    // Engineering leadership checks
    else if (lowerTitle.includes("cto") || lowerTitle.includes("chief technology officer")) {
      category = "engineering";
      priorityScore = 95;
    } else if (
      lowerTitle.includes("vp engineering") ||
      lowerTitle.includes("vp of engineering") ||
      lowerTitle.includes("head of engineering")
    ) {
      category = "engineering";
      priorityScore = 94;
    } else if (
      lowerTitle.includes("director of engineering") ||
      lowerTitle.includes("engineering director")
    ) {
      category = "engineering";
      priorityScore = 93;
    } else if (
      lowerTitle.includes("engineering manager") ||
      lowerTitle.includes("software engineering manager")
    ) {
      category = "engineering";
      priorityScore = 92;
    } else if (
      lowerTitle.includes("technical lead") ||
      lowerTitle.includes("tech lead")
    ) {
      category = "engineering";
      priorityScore = 90;
    } else if (lowerTitle.includes("lead engineer")) {
      category = "engineering";
      priorityScore = 89;
    } else if (
      lowerTitle.includes("staff engineer") ||
      lowerTitle.includes("principal engineer")
    ) {
      category = "engineering";
      priorityScore = 88;
    }
    // Recruiting checks
    else if (
      lowerTitle.includes("head of talent") ||
      lowerTitle.includes("head of recruitment")
    ) {
      category = "recruiter";
      priorityScore = 85;
    } else if (lowerTitle.includes("talent acquisition manager")) {
      category = "recruiter";
      priorityScore = 82;
    } else if (lowerTitle.includes("talent acquisition partner")) {
      category = "recruiter";
      priorityScore = 81;
    } else if (lowerTitle.includes("talent acquisition specialist")) {
      category = "recruiter";
      priorityScore = 80;
    } else if (lowerTitle.includes("technical recruiter")) {
      category = "recruiter";
      priorityScore = 78;
    } else if (lowerTitle.includes("recruiter")) {
      category = "recruiter";
      priorityScore = 75;
    } else if (lowerTitle.includes("campus recruiter")) {
      category = "recruiter";
      priorityScore = 72;
    }
    // HR & People checks
    else if (lowerTitle.includes("hr manager") || lowerTitle.includes("human resources manager")) {
      category = "hr";
      priorityScore = 70;
    } else if (lowerTitle.includes("hr business partner")) {
      category = "hr";
      priorityScore = 68;
    } else if (lowerTitle.includes("hr generalist")) {
      category = "hr";
      priorityScore = 66;
    } else if (lowerTitle.includes("hr executive")) {
      category = "hr";
      priorityScore = 64;
    } else if (lowerTitle.includes("people operations")) {
      category = "people_ops";
      priorityScore = 62;
    } else if (lowerTitle.includes("people partner")) {
      category = "people_ops";
      priorityScore = 60;
    }

    // Only keep if priorityScore > 0
    if (priorityScore > 0) {
      classified.push({
        name,
        email: contact.email,
        title,
        category,
        priorityScore,
        confidence: contact.confidence,
        source: contact.source,
      });
    }
  }

  // Sort by priorityScore descending
  return classified.sort((a, b) => b.priorityScore - a.priorityScore);
}
