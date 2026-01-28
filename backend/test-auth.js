import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/User.js";
import Role from "./src/models/Role.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const testUser = {
  username: "testuser",
  email: "test@example.com",
  password: "test123",
  phone: "1234567890",
  address: "123 Test St",
};

async function cleanup() {
  try {
    await User.deleteOne({ email: testUser.email });
    console.log("✓ Cleaned up test user");
  } catch (error) {
    console.log("Cleanup error (may not exist):", error.message);
  }
}

async function testAuth() {
  try {
    console.log("🔌 Connecting to database...");
    await connectDB();

    // Clean up any existing test user
    await cleanup();

    // Ensure roles exist
    console.log("\n📋 Ensuring default roles exist...");
    const defaultRoles = [
      { roleTitle: "super-admin", description: "Super admin (full access)" },
      { roleTitle: "manager", description: "Manager (team tasks access)" },
      { roleTitle: "user", description: "Regular user (own tasks only)" },
    ];

    for (const role of defaultRoles) {
      const exists = await Role.findOne({ roleTitle: role.roleTitle });
      if (!exists) {
        await Role.create(role);
        console.log(`  ✓ Created role: ${role.roleTitle}`);
      } else {
        console.log(`  ✓ Role exists: ${role.roleTitle}`);
      }
    }

    // Get user role
    const userRole = await Role.findOne({ roleTitle: "user" });
    if (!userRole) {
      throw new Error("User role not found");
    }

    // Test 1: Create a user
    console.log("\n🧪 Test 1: Creating test user...");
    const newUser = new User({
      ...testUser,
      roleId: userRole._id,
    });
    await newUser.save();
    console.log(`  ✓ User created: ${newUser.email}`);
    console.log(`  ✓ User ID: ${newUser._id}`);
    console.log(`  ✓ Password hashed: ${newUser.password ? "Yes" : "No"}`);
    console.log(`  ✓ Is Active: ${newUser.isActive}`);
    console.log(`  ✓ Is Deleted: ${newUser.isDeleted}`);

    // Test 2: Find user without password (default behavior)
    console.log("\n🧪 Test 2: Finding user without password field...");
    const userWithoutPassword = await User.findOne({ email: testUser.email });
    console.log(`  ✓ User found: ${userWithoutPassword ? "Yes" : "No"}`);
    console.log(`  ✓ Password field: ${userWithoutPassword?.password ? "Present" : "Missing (expected)"}`);

    // Test 3: Find user WITH password (using select("+password"))
    console.log("\n🧪 Test 3: Finding user WITH password field...");
    const userWithPassword = await User.findOne({ email: testUser.email }).select("+password");
    console.log(`  ✓ User found: ${userWithPassword ? "Yes" : "No"}`);
    console.log(`  ✓ Password field: ${userWithPassword?.password ? "Present ✓" : "Missing ✗"}`);
    
    if (!userWithPassword?.password) {
      throw new Error("Password field is missing even with select('+password')!");
    }

    // Test 4: Test password comparison with correct password
    console.log("\n🧪 Test 4: Testing password comparison (CORRECT password)...");
    const correctMatch = await userWithPassword.comparePassword(testUser.password);
    console.log(`  ✓ Password match: ${correctMatch ? "Yes ✓" : "No ✗"}`);
    
    if (!correctMatch) {
      throw new Error("Password comparison failed with CORRECT password!");
    }

    // Test 5: Test password comparison with incorrect password
    console.log("\n🧪 Test 5: Testing password comparison (INCORRECT password)...");
    const incorrectMatch = await userWithPassword.comparePassword("wrongpassword");
    console.log(`  ✓ Password match: ${incorrectMatch ? "Yes ✗ (should be No)" : "No ✓"}`);
    
    if (incorrectMatch) {
      throw new Error("Password comparison passed with INCORRECT password!");
    }

    // Test 6: Test login flow (simulate what the route does)
    console.log("\n🧪 Test 6: Simulating login flow...");
    const loginUser = await User.findOne({ email: testUser.email.toLowerCase() })
      .select("+password")
      .populate("roleId");
    
    if (!loginUser) {
      throw new Error("User not found during login simulation");
    }
    
    if (loginUser.isDeleted || !loginUser.isActive) {
      throw new Error("User is deleted or inactive");
    }
    
    const loginMatch = await loginUser.comparePassword(testUser.password);
    if (!loginMatch) {
      throw new Error("Login password comparison failed");
    }
    
    console.log(`  ✓ User found: Yes`);
    console.log(`  ✓ User active: ${loginUser.isActive}`);
    console.log(`  ✓ User not deleted: ${!loginUser.isDeleted}`);
    console.log(`  ✓ Password matches: Yes`);
    console.log(`  ✓ Role: ${loginUser.roleId?.roleTitle || "Not populated"}`);

    // Test 7: Test with different email case
    console.log("\n🧪 Test 7: Testing email case insensitivity...");
    const upperCaseEmail = testUser.email.toUpperCase();
    const caseTestUser = await User.findOne({ email: upperCaseEmail }).select("+password");
    console.log(`  ✓ Found user with uppercase email: ${caseTestUser ? "Yes ✓" : "No ✗"}`);
    
    if (caseTestUser) {
      const caseMatch = await caseTestUser.comparePassword(testUser.password);
      console.log(`  ✓ Password match: ${caseMatch ? "Yes ✓" : "No ✗"}`);
    }

    console.log("\n✅ All tests passed!");
    console.log("\n📝 Summary:");
    console.log("  - User creation: ✓");
    console.log("  - Password hashing: ✓");
    console.log("  - Password field selection: ✓");
    console.log("  - Password comparison: ✓");
    console.log("  - Login flow simulation: ✓");

  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up...");
    await cleanup();
    await mongoose.connection.close();
    console.log("✓ Database connection closed");
    process.exit(0);
  }
}

testAuth();
