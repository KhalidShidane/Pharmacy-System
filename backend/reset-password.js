const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const email = "YOUR_EMAIL_HERE";
const newPassword = "DevPassword123!";

const resetPassword = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    console.log("User not found");
    await mongoose.connection.close();
    return;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);

  await user.save();

  console.log("Password reset successfully!");
  console.log("Email:", email);
  console.log("Password:", newPassword);

  await mongoose.connection.close();
};

resetPassword().catch((error) => {
  console.error("Reset failed:", error);
  process.exit(1);
});