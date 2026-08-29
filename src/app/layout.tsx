import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapInit from "@/components/BootstrapInit";

export const metadata: Metadata = {
  title: "PumpMetrics — Gas Station Dashboard",
  description: "Fuel pump management, daily readings, and sales reporting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BootstrapInit />
        {children}
      </body>
    </html>
  );
}
