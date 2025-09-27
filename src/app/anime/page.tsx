// src/app/anime/page.tsx
'use client';

import withSubscription from '../../components/withSubscription';

function AnimePage() {
  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Welcome to the Anime Section</h1>
      <p className="text-gray-400 mb-8">
        This is the exclusive content area for subscribers. The list of anime will appear here soon.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Placeholder for anime cards */}
        <div className="bg-card-dark aspect-[2/3] rounded-lg p-4 text-center flex items-center justify-center">Coming Soon</div>
        <div className="bg-card-dark aspect-[2/3] rounded-lg p-4 text-center flex items-center justify-center">Coming Soon</div>
        <div className="bg-card-dark aspect-[2/3] rounded-lg p-4 text-center flex items-center justify-center">Coming Soon</div>
        <div className="bg-card-dark aspect-[2/3] rounded-lg p-4 text-center flex items-center justify-center">Coming Soon</div>
      </div>
    </div>
  );
}

// Wrap the page with our subscription checker
export default withSubscription(AnimePage);