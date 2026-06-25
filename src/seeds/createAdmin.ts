import "dotenv/config";
import { DataSource } from "typeorm";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/User";
import bcrypt from "bcrypt";

export async function ensureAdminExists(ds?: DataSource) {
  const dataSource = ds ?? AppDataSource;
  let initializedHere = false;
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
    initializedHere = true;
  }

  const userRepo = dataSource.getRepository(User);
  const email = "admin@gmail.com";
  const password = "12345678";

  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    const hashed = await bcrypt.hash(password, 12);

    existing.name = existing.name || email;
    existing.password = hashed;
    existing.role = UserRole.ADMIN;
    existing.isActive = true;

    await userRepo.save(existing);
    console.log("Ensured admin user:", email);
    if (initializedHere) await dataSource.destroy();
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = userRepo.create({
    name: email,
    email,
    password: hashed,
    role: UserRole.ADMIN,
    isActive: true,
  });

  await userRepo.save(user);
  console.log("Created admin user:", email);

  if (initializedHere) await dataSource.destroy();
}

// Allow running as a standalone script: `ts-node src/seeds/createAdmin.ts`
if (require.main === module) {
  ensureAdminExists()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
