// src/app/privacy/page.tsx
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="bg-card-dark p-6 rounded-lg space-y-4 text-gray-300">
          <p>
            Your privacy is important to us. This Privacy Policy explains how NajuAnime+ collects, uses, and protects your personal information when you use our service.
          </p>
          <p>
            **Information We Collect:** We may collect information you provide directly to us, such as when you create an account (email, username). We also collect information automatically when you use the service, such as your viewing history and IP address.
          </p>
          <p>
            **How We Use Information:** We use the information we collect to provide, maintain, and improve our services, process transactions, communicate with you, and personalize your experience.
          </p>
           <p>
            [Placeholder: Detailed information regarding data storage, security measures, cookies, third-party services, user rights (access, correction, deletion), data retention, etc., will be added here.]
          </p>
          <p>
            We do not sell your personal information to third parties.
          </p>
          <p>Last updated: October 21, 2025</p>
        </div>
         <div className="mt-6 text-center">
            <Link href="/" className="text-accent-green hover:underline">
                 &larr; Back to Home
            </Link>
        </div>
      </div>
    </div>
  );
}