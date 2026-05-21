/**
 * Quick Dialog eSMS test (loads .env.local).
 * Usage: node scripts/send-test-sms.mjs "+94 757622092" "Your message"
 */
import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = resolve(root, ".env.local");
if (existsSync(envLocal)) dotenv.config({ path: envLocal });

const phone = process.argv[2] ?? "+94 757622092";
const message = process.argv[3] ?? "Test SMS from The Pitch";

const { sendSMS, formatPhoneNumber } = await import("../messenger.js");

try {
  console.log("Formatted:", formatPhoneNumber(phone));
  const result = await sendSMS(phone, message, {
    useGetMethod: Boolean(process.env.ESMS_GET_KEY?.trim()),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
} catch (err) {
  console.error(err.message ?? err);
  process.exit(1);
}
