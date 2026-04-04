        const animeGrid = document.getElementById('anime-grid');
        const searchInput = document.getElementById('searchInput');
        const movieCount = document.getElementById('movieCount');

        // Website ပေါ်တွင် ပြသသည့် Function
        function displayAnimes(animes) {
            animeGrid.innerHTML = ''; 
            movieCount.innerText = `(စုစုပေါင်း - ${animes.length} ကား)`; 

            if(animes.length === 0) {
                animeGrid.innerHTML = `<p class="text-gray-400 col-span-full text-center py-10">ရှာဖွေထားသော ဇာတ်ကား မတွေ့ရှိပါ။</p>`;
                return;
            }

            animes.forEach(anime => {
                const card = `
                    <div class="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 border border-gray-700 flex flex-col relative">
                        <span class="absolute top-2 right-2 bg-blue-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow">
                            ${anime.year}
                        </span>
                        
                        <img src="${anime.image}" alt="${anime.title}" class="w-full h-48 sm:h-56 md:h-64 object-cover">
                        
                        <div class="p-3 md:p-4 flex-grow flex flex-col justify-between">
                            <div>
                                <h3 class="font-bold text-sm md:text-base line-clamp-2 mb-3" title="${anime.title}">${anime.title}</h3>
                            </div>
                            <a href="${anime.link}" target="_blank" 
                               class="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 md:py-2 text-sm rounded-lg transition-colors mt-auto">
                                Telegram တွင် ကြည့်ရန်
                            </a>
                        </div>
                    </div>
                `;
                animeGrid.innerHTML += card;
            });
        }

        // Search Bar အလုပ်လုပ်မည့် အပိုင်း
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredAnimes = animeData.filter(anime => 
                anime.title.toLowerCase().includes(searchTerm) || 
                anime.year.includes(searchTerm)
            );
            displayAnimes(filteredAnimes);
        });

        // Website စပွင့်တာနဲ့ ပြပေးမည်
        displayAnimes(animeData);