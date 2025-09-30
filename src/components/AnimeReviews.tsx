// src/components/AnimeReviews.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import Modal from 'react-modal';

type Review = {
  id: string;
  review_text: string;
  created_at: string;
  profiles: {
    naju_id: string;
  } | null;
};

type Props = {
  animeId: string;
  user: User | null;
};

const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1F2937',
    color: 'white',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '600px',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
};

export default function AnimeReviews({ animeId, user }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('anime_reviews')
      .select('id, review_text, created_at, profiles(naju_id)')
      .eq('anime_id', animeId)
      .order('created_at', { ascending: false });

    if (data) {
      setReviews(data as Review[]);
      if (user) {
        // Check if the current user's review is in the list
        const currentUserReview = await supabase.from('anime_reviews').select('id').eq('anime_id', animeId).eq('user_id', user.id).single();
        setUserHasReviewed(!!currentUserReview.data);
      }
    }
    setLoading(false);
  }, [animeId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmitReview = async () => {
    if (!user || !reviewText.trim()) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('anime_reviews')
      .insert({
        user_id: user.id,
        anime_id: animeId,
        review_text: reviewText.trim(),
      });

    if (error) {
      alert(`Error submitting review: ${error.message}`);
    } else {
      setReviewText('');
      closeModal();
      await fetchReviews(); // Refresh the reviews list
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Reviews</h3>
        {user && !userHasReviewed && (
          <button 
            onClick={openModal} 
            className="bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold rounded-md"
          >
            Write a Review
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-400">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-card-dark p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <p className="font-bold text-gray-200">{review.profiles?.naju_id || 'A user'}</p>
                <p className="text-xs text-gray-400 ml-auto">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{review.review_text}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No reviews yet. Be the first to write one!</p>
        )}
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={customModalStyles} contentLabel="Write a Review">
        <h2 className="text-2xl font-bold mb-4">Write Your Review</h2>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about this anime..."
          className="w-full p-2 rounded bg-gray-800 border border-gray-600 min-h-[150px] mb-4"
          rows={6}
        />
        <div className="flex justify-end gap-4">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
          <button onClick={handleSubmitReview} disabled={isSubmitting || !reviewText.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500">
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </Modal>
    </div>
  );
}