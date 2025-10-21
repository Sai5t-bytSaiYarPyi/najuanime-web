// src/app/terms/page.tsx
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="bg-card-dark p-6 rounded-lg space-y-4 text-gray-300">
          <p>
            Welcome to NajuAnime+! By using our service, you agree to these terms. Please read them carefully.
          </p>
          <p>
            [Placeholder: Detailed terms and conditions regarding account usage, subscriptions, content policy, intellectual property, disclaimers, etc., will be added here.]
          </p>
          <p>
            Content provided on NajuAnime+ is for personal, non-commercial use only. You agree not to archive, reproduce, distribute, modify, display, perform, publish, license, create derivative works from, offer for sale, or use content and information contained on or obtained from or through the NajuAnime+ service.
          </p>
          <p>
            We may update these terms from time to time. We will notify you of any changes by posting the new Terms of Service on this page.
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