require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./src/models/User");
const Role = require("./src/models/Role");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const adminRole = await Role.findOne({ name: "admin" });

    if (!adminRole) {
      console.log("Admin role not found!");
      console.log("Make sure the roles have been seeded first.");
      await mongoose.connection.close();
      return;
    }

    const email = "admin@pharmacy.com";
    const password = "AdminPassword123!";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("An account with this email already exists.");
      await mongoose.connection.close();
      return;
    }

    const passwordHash = await User.hashPassword(password);

    const admin = await User.create({
      name: "System Admin",
      email,
      passwordHash,
      role: adminRole._id,
      roleName: "admin",
      isActive: true,
    });

    console.log("\n================================");
    console.log("ADMIN CREATED SUCCESSFULLY!");
    console.log("================================");
    console.log("Name:", admin.name);
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Role:", admin.roleName);
    console.log("================================\n");

    await mongoose.connection.close();
  } catch (error) {
    console.error("Failed to create admin:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();