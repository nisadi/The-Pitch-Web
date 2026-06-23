/**
 * Test script to trigger sendBookingConfirmationEmail via Next.js API route.
 * Usage: node scripts/send-test-email.mjs [email] [location]
 */
import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = resolve(root, ".env.local");
if (existsSync(envLocal)) dotenv.config({ path: envLocal });

const email = process.argv[2] || "rwsandaru8@gmail.com";
const location = process.argv[3] || "Attidiya";

const payload = {
  email,
  fullName: "Michael Jude Shanujan",
  booking: {
    ref: "BK-859172",
    sport: "Cricket",
    location: location,
    date: "Fri, Jun 12, 2026",
    time: "4:00 PM - 5:00 PM",
    amount: 2850,
  }
};

async function testEmail() {
  const ports = [3000, 3001, 3002];
  let response = null;
  let portUsed = null;

  for (const port of ports) {
    try {
      console.log(`Trying to send test email request to http://localhost:${port}/api/send-booking-email...`);
      const res = await fetch(`http://localhost:${port}/api/send-booking-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      response = res;
      portUsed = port;
      break;
    } catch (err) {
      // Continue to next port
    }
  }

  if (!response) {
    console.error("Error: Could not connect to the local dev server on ports 3000, 3001, or 3002. Please ensure Next.js is running.");
    process.exit(1);
  }

  const result = await response.json();
  console.log(`[Response from Port ${portUsed}] Status:`, response.status);
  console.log("Result:", JSON.stringify(result, null, 2));

  if (response.ok && result.success) {
    console.log("SUCCESS! Test email sent successfully.");
    process.exit(0);
  } else {
    console.error("FAILED to send test email.");
    process.exit(1);
  }
}

testEmail();
