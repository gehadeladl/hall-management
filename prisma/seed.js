const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        username: "superadmin",
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    console.log("✅ Super Admin created successfully.");
  } else {
    console.log("⚡ Super Admin already exists.");
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
