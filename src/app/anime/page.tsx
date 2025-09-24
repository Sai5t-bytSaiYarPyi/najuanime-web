// src/app/anime/page.tsx
'use client';

import withSubscription from '../../components/withSubscription';

function AnimePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, Subscriber!</h1>
      <p className="mb-4">Here is the list of exclusive anime content.</p>

      {/* We will add the list of anime here later */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 aspect-[2/3] rounded-lg p-4 text-center">Anime Poster 1</div>
        <div className="bg-gray-800 aspect-[2/3] rounded-lg p-4 text-center">Anime Poster 2</div>
        <div className="bg-gray-800 aspect-[2/3] rounded-lg p-4 text-center">Anime Poster 3</div>
      </div>
    </div>
  );
}

// Wrap the page with our subscription checker
export default withSubscription(AnimePage);