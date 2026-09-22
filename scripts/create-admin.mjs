import "dotenv/config";

import connectDB from "../lib/db.js";
import Admin from "../models/Admin.js";
import { hashPassword } from "../lib/password.js";

async function run() {
  await connectDB();

  const {
    INITIAL_ADMIN_NAME,
    INITIAL_ADMIN_EMAIL,
    INITIAL_ADMIN_USERNAME,
    INITIAL_ADMIN_PASSWORD,
  } = process.env;

  if (
    !INITIAL_ADMIN_EMAIL ||
    !INITIAL_ADMIN_USERNAME ||
    !INITIAL_ADMIN_PASSWORD
  ) {
    console.error(
      "Set INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD in your environment first."
    );
    process.exit(1);
  }

  const email = INITIAL_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(INITIAL_ADMIN_PASSWORD);

  const existing = await Admin.findOne({
    $or: [
      { email },
      { username: INITIAL_ADMIN_USERNAME },
    ],
  });

  if (existing) {
    existing.fullName = INITIAL_ADMIN_NAME || existing.fullName || "Administrator";
    existing.email = email;
    existing.username = INITIAL_ADMIN_USERNAME;
    existing.passwordHash = passwordHash;
    existing.role = "superadmin";

    await existing.save();

    console.log("Existing administrator account updated successfully.");
  } else {
    await Admin.create({
      fullName: INITIAL_ADMIN_NAME || "Administrator",
      email,
      username: INITIAL_ADMIN_USERNAME,
      passwordHash,
      role: "superadmin",
    });

    console.log("Initial administrator account created successfully.");
  }

  console.log("Username:", INITIAL_ADMIN_USERNAME);
  console.log("Email:", email);
  console.log("Password has been set from INITIAL_ADMIN_PASSWORD.");
  console.log("Please change the password after logging in.");

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});