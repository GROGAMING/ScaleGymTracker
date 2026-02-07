import "./globals.css";
import NavWrapper from "@/components/NavWrapper";
import { Analytics } from "@vercel/analytics/react";
import DevBanner from "@/components/DevBanner";
import AuthGate from "@/components/AuthGate";

export const metadata = { title: "Gym Tracker" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavWrapper />
        <DevBanner />
        <AuthGate>
          {children}
        </AuthGate>
        <Analytics />
      </body>
    </html>
  );
}
