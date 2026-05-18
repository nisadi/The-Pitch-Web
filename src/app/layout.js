import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "The Pitch Indoor Stadium | Premium Sports & Appointment Booking",
  description: "Book your favorite sports slots at The Pitch Indoor Stadium. Premium facilities, memberships, and events.",
  keywords: ["indoor stadium", "sports booking", "football", "cricket", "The Pitch"],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ paddingTop: '80px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}


