'use client';

import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          Yolki & Palki
        </Link>
        <div className="space-x-4">
          <Link href="/tasks" className="hover:text-gray-300">
            Tasks
          </Link>
          <Link href="/task-history" className="hover:text-gray-300">
            Task History
          </Link>
          <Link href="/python-code" className="hover:text-gray-300">
            Python Code
          </Link>
          <Link href="/screen-recording" className="hover:text-gray-300">
            Recording
          </Link>
        </div>
      </div>
    </nav>
  );
} 