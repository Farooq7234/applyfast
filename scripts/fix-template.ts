import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const NEW_BODY = `Hi {{recruiter_name}},

I hope you are doing well.

I came across the opening for {{role}} at {{company}} and wanted to express my interest.

I have experience building modern full stack web applications using React, Next.js, Node.js, PostgreSQL, and TypeScript.

Portfolio: {{portfolio}}

Resume: {{resume}}

Thank you for your time and consideration.

Best regards,

{{name}}`;

async function main() {
  const updated = await db.template.updateMany({
    where: { isDefault: true },
    data: { body: NEW_BODY },
  });
  console.log(`Updated ${updated.count} template(s).`);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
