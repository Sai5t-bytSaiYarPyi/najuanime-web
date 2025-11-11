// src/app/admin/anime/[animeId]/characters/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../../lib/supabaseClient';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Modal, { Styles } from 'react-modal';
import { User, Search, Plus, XCircle, Trash2, Loader, ArrowLeft } from 'lucide-react';

// --- Types ---
type AnimeSeries = {
  id: string;
  title_english: string;
  // MyAnimeList ID ကိုပါ ဆွဲထုတ်လာဖို့ လိုအပ်
  mal_id: number | null; 
};

// Jikan API ကနေ ပြန်လာမယ့် Character Data Type
type JikanCharacter = {
  character: {
    mal_id: number;
    images: {
      jpg: { image_url: string };
    };
    name: string;
  };
  role: string;
};

// Database ကနေ ဆွဲထုတ်မယ့် Linked Character Data Type
type LinkedCharacter = {
  id: string; // anime_characters table ရဲ့ id
  role: string;
  characters: { // characters table က data
    id: string;
    name: string;
    image_url: string | null;
  } | null;
};

// Modal Styles (ရှိပြီးသား)
const customModalStyles: Styles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%',
    transform: 'translate(-50%, -50%)', backgroundColor: '#1F2937', color: 'white',
    border: '1px solid #374151', borderRadius: '0.5rem', width: '90%',
    maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
};
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}
// --- End Types & Modal ---


export default function ManageCharactersPage() {
  const params = useParams();
  const animeId = params.animeId as string;

  const [series, setSeries] = useState<AnimeSeries | null>(null);
  const [linkedCharacters, setLinkedCharacters] = useState<LinkedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [jikanCharacters, setJikanCharacters] = useState<JikanCharacter[]>([]);
  const [isImporting, setIsImporting] = useState<number | null>(null); // mal_id ကို မှတ်ထားရန်

  // Admin check (ရှိပြီးသား)
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    if (!animeId) return;
    setLoading(true);

    // 1. Admin ဟုတ်မဟုတ် စစ်ဆေး
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('roles').eq('id', session.user.id).single();
        if (profile && profile.roles && Array.isArray(profile.roles) && profile.roles.includes('admin')) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false); setLoading(false); return;
        }
    } else {
        setIsAdmin(false); setLoading(false); return;
    }

    // 2. Anime Series data ကို fetch လုပ် (mal_id အပါအဝင်)
    const { data: seriesData } = await supabase
      .from('anime_series')
      .select('id, title_english, mal_id')
      .eq('id', animeId)
      .single();
    setSeries(seriesData as AnimeSeries);

    // 3. ချိတ်ဆက်ပြီးသား Character တွေကို fetch လုပ်
    const { data: charactersData, error: charactersError } = await supabase // <-- error ကိုပါ ဖမ်း
      .from('anime_characters')
      .select(`
        id,
        role,
        characters ( id, name, image_url )
      `)
      .eq('anime_id', animeId)
      .order('created_at', { ascending: true });

    // --- START: Build Error Fix (TypeScript Type Inference) ---
    if (charactersError) {
        console.error("Error fetching linked characters:", charactersError);
        setLoading(false);
        return;
    }

    // Vercel build မှာ TypeScript က `characters` property ကို object[] (array) 
    // पण ဖြစ်နိုင်တယ်လို့ မှားယွင်းစွာ ကောက်ချက်ဆွဲ (infer) နေပါတယ်။
    // ကျွန်တော်တို့ရဲ့ schema အရ (character_id FK) က object | null ပဲ 
    // ပြန်လာမှာ သေချာတဲ့အတွက်၊ data ကို manually map လုပ်ပြီး type ကို ရှင်းလင်းပေးပါမယ်။
    
    const processedData = (charactersData || []).map(link => {
        // `characters` property က array ဖြစ်ပြီး ပါလာခဲ့ရင် (မဖြစ်နိုင်ပေမယ့်) ပထမဆုံး item ကို ယူပါ။
        // ပုံမှန် object (သို့) null အတိုင်း ပါလာရင် သူ့အတိုင်း ထားပါ။
        const characterObject = Array.isArray(link.characters) 
            ? (link.characters[0] || null) 
            : (link.characters || null);
            
        return {
            id: link.id,
            role: link.role,
            characters: characterObject
        };
    });
    
    // Type ရှင်းလင်းပြီးသား data ကိုမှ state ထဲ ထည့်ပါ။
    // ဒီနေရာမှာ (as LinkedCharacter[]) cast လုပ်လို့ အဆင်ပြေသွားပါပြီ။
    setLinkedCharacters((processedData as LinkedCharacter[]) || []);
    // --- END: Build Error Fix ---
    
    setLoading(false);
  }, [animeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Modal Functions ---
  const openSearchModal = async () => {
    if (!series || !series.mal_id) {
      alert("This anime does not have a MyAnimeList ID (mal_id) linked. Cannot search for characters.");
      return;
    }
    setIsModalOpen(true);
    setIsSearching(true);
    setJikanCharacters([]);
    try {
      const response = await fetch(`/api/jikan/characters?animeId=${series.mal_id}`);
      if (!response.ok) throw new Error('Failed to fetch from Jikan API');
      const result = await response.json();
      // 'Main' role characters တွေကို အရင်၊ ပြီးမှ 'Supporting'
      const sortedData = (result.data || []).sort((a: JikanCharacter, b: JikanCharacter) => {
          if (a.role === 'Main' && b.role !== 'Main') return -1;
          if (a.role !== 'Main' && b.role === 'Main') return 1;
          if (a.role === 'Supporting' && b.role !== 'Supporting') return -1;
          if (a.role !== 'Supporting' && b.role === 'Supporting') return 1;
          return 0;
      });
      setJikanCharacters(sortedData);
    } catch (error: any) {
      alert(`Error fetching characters: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setJikanCharacters([]);
  };

  // --- Character Action Functions ---
  const handleImportCharacter = async (char: JikanCharacter) => {
    setIsImporting(char.character.mal_id);
    try {
      const { error } = await supabase.functions.invoke('import-anime-character', {
        body: {
          anime_id: animeId,
          character_mal_id: char.character.mal_id,
          name: char.character.name,
          image_url: char.character.images.jpg.image_url,
          role: char.role // 'Main' or 'Supporting' from Jikan
        },
      });
      if (error) throw error;
      
      // အောင်မြင်ရင် Character list ကို refresh လုပ်
      await fetchData(); 
    } catch (error: any) {
      alert(`Error importing character: ${error.message}`);
    } finally {
      setIsImporting(null);
    }
  };

  const handleUnlinkCharacter = async (linkId: string, charName: string) => {
    if (window.confirm(`Are you sure you want to unlink "${charName}" from this anime?`)) {
      setLoading(true);
      // RLS Policy က admin ကို delete ခွင့်ပြုထားရပါမယ် (ဒါမှမဟုတ် service_role function သုံးရပါမယ်)
      // လောလောဆယ် client-side ကနေ admin အနေနဲ့ delete လုပ်ပါမယ်
      const { error } = await supabase
        .from('anime_characters')
        .delete()
        .eq('id', linkId);

      if (error) {
        alert(`Error unlinking character: ${error.message}`);
      } else {
        // List ကို refresh လုပ်
        setLinkedCharacters(prev => prev.filter(c => c.id !== linkId));
      }
      setLoading(false);
    }
  };
  
  // --- Render Functions ---
  if (loading && !series) { return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><Loader className="animate-spin" /></div>; }
  if (!isAdmin) { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Access Denied.</div>; }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href={`/admin/anime/${animeId}`} className="text-blue-400 hover:underline mb-6 block flex items-center gap-1">
        <ArrowLeft size={16} /> Back to Episode Management
      </Link>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Characters</h1>
          <p className="text-gray-400">For: {series?.title_english}</p>
        </div>
        <button 
          onClick={openSearchModal} 
          disabled={!series?.mal_id}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
          title={!series?.mal_id ? "This anime has no mal_id, cannot search." : "Add characters from MyAnimeList"}
        >
          <Plus size={20} /> Add Character (from MAL)
        </button>
      </div>

      {/* Linked Characters List */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Linked Characters</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {linkedCharacters.length > 0 ? (
            linkedCharacters.map(link => link.characters && (
              <div key={link.id} className="bg-gray-700 rounded-lg shadow-md overflow-hidden relative group">
                <Image
                  src={link.characters.image_url || 'https://via.placeholder.com/150x225'}
                  alt={link.characters.name}
                  width={150}
                  height={225}
                  className="w-full h-auto aspect-[2/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
                  <p className="text-white font-bold text-sm line-clamp-2">{link.characters.name}</p>
                  <p className="text-xs text-gray-300">{link.role}</p>
                </div>
                <button 
                  onClick={() => handleUnlinkCharacter(link.id, link.characters!.name)}
                  className="absolute top-1 right-1 bg-red-600/80 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Unlink this character"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 col-span-full">No characters have been linked to this anime yet.</p>
          )}
        </div>
      </div>

      {/* Jikan Search Modal */}
      <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={customModalStyles} contentLabel="Add New Character from MyAnimeList">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Add Character (from MAL)</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-white"><XCircle size={24} /></button>
          </div>
          
          <div className="flex-grow overflow-y-auto space-y-2 pr-2">
            {isSearching ? (
              <div className="flex justify-center items-center h-40"><Loader className="animate-spin" /></div>
            ) : jikanCharacters.length > 0 ? (
              jikanCharacters.map(item => (
                <div 
                  key={item.character.mal_id} 
                  className="p-2 flex gap-3 rounded-md bg-gray-700"
                >
                  <Image src={item.character.images.jpg.image_url} alt={item.character.name} width={50} height={75} className="w-12 h-auto rounded object-cover"/>
                  <div className="flex-grow">
                    <p className="font-bold">{item.character.name}</p>
                    <p className="text-sm text-gray-400">{item.role}</p>
                  </div>
                  <button 
                    onClick={() => handleImportCharacter(item)}
                    disabled={isImporting === item.character.mal_id || linkedCharacters.some(lc => lc.characters?.name === item.character.name)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    {isImporting === item.character.mal_id ? <Loader size={16} className="animate-spin"/> : (linkedCharacters.some(lc => lc.characters?.name === item.character.name) ? 'Linked' : 'Link')}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-10">No characters found on MAL for this anime.</p>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
}