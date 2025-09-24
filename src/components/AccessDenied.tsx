// src/components/AccessDenied.tsx
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white text-center p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
      <p className="mb-6">You need an active subscription to view this page.</p>
      <Link href="/" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">
        Go to Homepage
      </Link>
    </div>
  );
}