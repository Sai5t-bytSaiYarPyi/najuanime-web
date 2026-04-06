// app.js

const animeGrid = document.getElementById('anime-grid');
const movieCount = document.getElementById('movieCount');

const searchInputDesktop = document.getElementById('searchInputDesktop');
const searchInputMobile = document.getElementById('searchInputMobile');

function displayAnimes(animes) {
    animeGrid.innerHTML = '';
    movieCount.innerText = `စုစုပေါင်း ${animes.length} ကား`;

    if (animes.length === 0) {
        animeGrid.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 16px; color: #475569;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <p style="font-size: 15px; font-weight: 600; color: #64748b;">ရှာဖွေထားသော ဇာတ်ကား မတွေ့ရှိပါ</p>
            </div>`;
        return;
    }

    animes.forEach((anime, index) => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.style.animationDelay = `${Math.min(index, 20) * 30}ms`;
        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${anime.image}" alt="${anime.title}" loading="lazy">
                <div class="card-overlay"></div>
                <div class="card-play">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <span class="year-badge">${anime.year}</span>
            </div>
            <div class="card-body">
                <p class="card-title" title="${anime.title}">${anime.title}</p>
                <div class="card-actions">
                    <a href="review.html?id=${anime.id}" class="btn-review">
                        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Review
                    </a>
                    <a href="${anime.link}" target="_blank" class="btn-watch">
                        <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
                        ကြည့်ရန်
                    </a>
                </div>
            </div>
        `;
        animeGrid.appendChild(card);
    });
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    if (searchInputDesktop && e.target !== searchInputDesktop) searchInputDesktop.value = e.target.value;
    if (searchInputMobile && e.target !== searchInputMobile) searchInputMobile.value = e.target.value;
    const filtered = animeData.filter(a =>
        a.title.toLowerCase().includes(term) || a.year.includes(term)
    );
    displayAnimes(filtered);
}

if (searchInputDesktop) searchInputDesktop.addEventListener('input', handleSearch);
if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearch);

displayAnimes(animeData);
