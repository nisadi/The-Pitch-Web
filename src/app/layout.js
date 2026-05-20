import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "The Pitch Indoor Stadium | Premium Sports & Appointment Booking",
  description:
    "Book your favorite sports slots at The Pitch Indoor Stadium. Premium facilities, memberships, and events.",
  keywords: [
    "indoor stadium",
    "sports booking",
    "football",
    "cricket",
    "futsal",
    "cricksal",
    "The Pitch",
  ],

  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}


