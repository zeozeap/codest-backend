import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Admin } from "../models/admin.model";

dotenv.config();

const createAdmin = async (): Promise<void> => {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("Usage: npm run create-admin -- <email> <password> [name]");
    console.log("Example: npm run create-admin -- admin@example.com mypassword123 \"Admin Name\"");
    process.exit(1);
  }

  const [email, password, name = "Admin"] = args;

  if (!email || !password) {
    console.log("Email and password are required");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/codest");

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin with email ${email} already exists`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      email,
      password: hashedPassword,
      name,
    });

    await admin.save();
    console.log(`Admin created successfully: ${email}`);
    console.log(`Name: ${name}`);
  } catch (error) {
    console.error("Error creating admin:", error);
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();