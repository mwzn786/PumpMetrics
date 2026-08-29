import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// tsx does not read env files the way Next.js does, so load them here.
for (const file of [".env", ".env.local"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      process.env[match[1]] ??= value;
    }
  } catch {
    // file is optional
  }
}

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@pumpmetrics.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const name = process.env.SEED_ADMIN_NAME ?? "Super Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "super_admin",
    },
  });

  console.log(`Created super admin: ${email}`);
  console.log(`Default password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
