import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  TEMPLATE_HIRING_NAME,
  TEMPLATE_HIRING_SUBJECT,
  TEMPLATE_HIRING_BODY,
  TEMPLATE_COLD_NAME,
  TEMPLATE_COLD_SUBJECT,
  TEMPLATE_COLD_BODY,
} from "../src/lib/email";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const users = await db.user.findMany({ select: { id: true } });
  console.log(`Processing ${users.length} user(s)...`);

  for (const user of users) {
    const existing = await db.template.findMany({ where: { userId: user.id } });
    const names = existing.map((t) => t.name);

    // Replace stale default templates with the hiring template
    const staleDefaults = existing.filter(
      (t) => t.isDefault && t.name !== TEMPLATE_HIRING_NAME
    );
    for (const stale of staleDefaults) {
      await db.template.update({
        where: { id: stale.id },
        data: {
          name: TEMPLATE_HIRING_NAME,
          subject: TEMPLATE_HIRING_SUBJECT,
          body: TEMPLATE_HIRING_BODY,
          isDefault: true,
        },
      });
      console.log(`  Updated stale default template for user ${user.id}`);
    }

    // Add cold outreach template if missing
    if (!names.includes(TEMPLATE_COLD_NAME)) {
      await db.template.create({
        data: {
          userId: user.id,
          name: TEMPLATE_COLD_NAME,
          subject: TEMPLATE_COLD_SUBJECT,
          body: TEMPLATE_COLD_BODY,
          isDefault: false,
        },
      });
      console.log(`  Added "${TEMPLATE_COLD_NAME}" for user ${user.id}`);
    }
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => pool.end());
