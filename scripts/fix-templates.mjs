// Run with: node --env-file=.env scripts/fix-templates.mjs
import pg from "pg";

const { Pool } = pg;

const HIRING_BODY = `Hi {{recruiter_name}},

I came across your opening for the {{role}} role and wanted to reach out.

Resumes tell you what someone knows. Projects tell you how they think.

Before anything else, I would love for you to take a quick look at my work:

Portfolio: {{portfolio}}
Resume: {{resume}}

I believe great software is built by people who care about the details. That is the mindset I bring to every project, whether I am designing the user experience, building backend systems, or solving problems that make a product better.

If my work resonates with what your team is looking for, I would be grateful for the opportunity to chat.

Thank you for your time, and I look forward to hearing from you.

Best regards,

{{name}}`;

const COLD_BODY = `Hi {{recruiter_name}},

I know you may not have an active opening right now, but I wanted to reach out anyway.

Resumes tell you what someone knows. Projects tell you how they think.

Before anything else, I would love for you to take a quick look at my work:

Portfolio: {{portfolio}}
Resume: {{resume}}

I enjoy building polished, production-ready web applications using React, Next.js, Node.js, TypeScript, and PostgreSQL. I care about writing clean code, shipping reliable features, and creating products that people enjoy using.

If my work resonates with what your team values, I would be grateful to be kept in mind for future opportunities or to have a quick chat.

Thank you for your time, and I look forward to hearing from you.

Best regards,

{{name}}`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const hiringResult = await pool.query(
  `UPDATE "Template" SET subject = $1, body = $2, "isDefault" = true WHERE name = 'Active Opening'`,
  ["Application for {{role}} at {{company}}", HIRING_BODY]
);

const coldResult = await pool.query(
  `UPDATE "Template" SET subject = $1, body = $2, "isDefault" = false WHERE name = 'Cold Outreach'`,
  ["Would Love to Build With Your Team", COLD_BODY]
);

console.log(`Updated ${hiringResult.rowCount} "Active Opening" template(s)`);
console.log(`Updated ${coldResult.rowCount} "Cold Outreach" template(s)`);

await pool.end();
