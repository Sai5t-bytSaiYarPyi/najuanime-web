// app.js

const animeGrid = document.getElementById('anime-grid');
const movieCount = document.getElementById('movieCount');

// Search Bar အသစ် (၂) ခုကို လှမ်းချိတ်ခြင်း
const searchInputDesktop = document.getElementById('searchInputDesktop');
const searchInputMobile = document.getElementById('searchInputMobile');

// ဇာတ်ကားများကို Website ပေါ်တွင် ပြသသည့် Function
function displayAnimes(animes) {
    animeGrid.innerHTML = ''; 
    movieCount.innerText = `(စုစုပေါင်း - ${animes.length} ကား)`; 

    if(animes.length === 0) {
        animeGrid.innerHTML = `<p class="text-gray-400 col-span-full text-center py-10">ရှာဖွေထားသော ဇာတ်ကား မတွေ့ရှိပါ။</p>`;
        return;
    }

    animes.forEach(anime => {
        const card = `
            <div class="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 border border-gray-700 flex flex-col relative group">
                
                <span class="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-lg z-10">
                    ${anime.year}
                </span>
                
                <div class="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-900">
                    <img src="${anime.image}" alt="${anime.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:opacity-75">
                    
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <svg class="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                    </div>
                </div>
                
                <div class="p-3 md:p-4 flex-grow flex flex-col justify-between bg-gray-800 relative z-20">
                    <div>
                        <h3 class="font-bold text-sm md:text-base line-clamp-2 mb-3 text-gray-100 group-hover:text-blue-400 transition-colors" title="${anime.title}">${anime.title}</h3>
                    </div>
                    
                    <div class="flex gap-2 mt-auto pt-3 border-t border-gray-700">
                        <a href="review.html?id=${anime.id}" 
                           class="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold py-1.5 md:py-2 text-xs sm:text-sm rounded-lg transition-colors border border-gray-600">
                            📝 Review
                        </a>
                        <a href="${anime.link}" target="_blank" 
                           class="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 md:py-2 text-xs sm:text-sm rounded-lg transition-colors shadow-md">
                            ▶ ကြည့်ရန်
                        </a>
                    </div>
                </div>
            </div>
        `;
        animeGrid.innerHTML += card;
    });
}

// Search ရှာသည့်အခါ အလုပ်လုပ်မည့် အပိုင်း
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // ဖုန်းနဲ့ ကွန်ပျူတာ Search Bar နှစ်ခုလုံးမှာ စာတူတူပေါ်နေအောင် ညှိပေးခြင်း
    if(searchInputDesktop && e.target !== searchInputDesktop) searchInputDesktop.value = e.target.value;
    if(searchInputMobile && e.target !== searchInputMobile) searchInputMobile.value = e.target.value;

    const filteredAnimes = animeData.filter(anime => 
        anime.title.toLowerCase().includes(searchTerm) || 
        anime.year.includes(searchTerm)
    );
    displayAnimes(filteredAnimes);
}

// Search Bar ရှိနေခဲ့ရင် Event လေးတွေ တပ်ပေးခြင်း
if (searchInputDesktop) {
    searchInputDesktop.addEventListener('input', handleSearch);
}
if (searchInputMobile) {
    searchInputMobile.addEventListener('input', handleSearch);
}

// Website စပွင့်တာနဲ့ Data တွေကို အရင်ဆုံး ပြပေးမည်
displayAnimes(animeData);
