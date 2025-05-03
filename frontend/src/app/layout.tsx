import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yolki & Palki",
  description: "Coding learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="font-bold text-xl">
              Yolki & Palki
            </Link>
            <div className="space-x-4">
              <Link href="/tasks" className="hover:text-gray-300">
                Tasks
              </Link>
              <Link href="/python-code" className="hover:text-gray-300">
                Python Code
              </Link>
              <Link href="/screen-recording" className="hover:text-gray-300">
                Recording
              </Link>
              <Link href="/login" className="hover:text-gray-300">
                Login
              </Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
