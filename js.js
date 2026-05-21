const offWhen = document.querySelectorAll(".offWhenSearched");
const logo = document.getElementById("logo");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchLists = document.getElementById("searchLists");
document.getElementById("filter").style.display="block";
document.getElementById("searchInput").style.display="block";
const movielist = {
    trending: ["The Devil Wears Prada 2", "Backrooms", "The Mandalorian & Grogu", "Mortal Kombat II", "I Love Boosters", "The Breadwinner", "The Sheep Detectives", "Hokum", "Obsession", "Animal Farm"],
    action: ["The Dark Knight", "Mad Max: Fury Road", "Die Hard", "The Matrix", "John Wick", "Terminator 2: Judgment Day", "The Raid: Redemption", "Inception", "Mission: Impossible – Fallout", "Gladiator"],
    horror: ["The Exorcist", "The Shining", "Hereditary", "The Conjuring", "Get Out", "A Nightmare on Elm Street", "Psycho", "The Thing", "The Babadook", "It Follows"],
    comedy: ["Airplane!", "The Hangover", "Superbad", "Anchorman: The Legend of Ron Burgundy", "Bridesmaids", "Step Brothers", "21 Jump Street", "Deadpool", "Monty Python and the Holy Grail", "Groundhog Day"]
};

// FIX 1: fixed typo fectchPoster → fetchPoster
async function fetchPoster(title) {
    const url = `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(title)}&tt=&lsn=1&v=1`;
    try {
        const response = await fetch(url);
        // FIX 2: was single quotes so ${} didn't work, changed to backticks
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        if (data.description && data.description.length > 0) {
            const movie = data.description[0];
            return {
                title: movie["#TITLE"] || title,
                year: movie["#YEAR"] || "",
                poster: movie["#IMG_POSTER"] || null,
                imdbId: movie["#IMDB_ID"] || ""
            };
        }
    } catch (error) {
        console.error(`Kan inte fetcha poster för "${title}"`, error);
    }
    return null;
}

async function fillSection(sectionId, titles) {
    const filmBoxes = sectionId === "trending"?
        document.querySelectorAll(`#trending_list .films_boxes`):
        document.querySelectorAll(`#${sectionId}_list .films_boxes_${sectionId}`);

    const movies = await Promise.all(titles.map(fetchPoster)); // FIX 1: updated name here too

    movies.forEach((movie, index) => {
        if (!filmBoxes[index]) return;
        const imgEl = filmBoxes[index].querySelector("img");
        if (!imgEl) return;

        if (movie && movie.poster) {
            imgEl.src = movie.poster;
            imgEl.alt = `${movie.title} (${movie.year}) poster`;
            filmBoxes[index].title = `${movie.title} (${movie.year})`;
            filmBoxes[index].dataset.imdbId = movie.imdbId;
            filmBoxes[index].dataset.movieTitle = movie.title;
            filmBoxes[index].style.cursor = "pointer";
            filmBoxes[index].addEventListener("click", () => {
                openTrailer(movie.imdbId, `${movie.title} (${movie.year})`);
            });
        } else {
            imgEl.alt = "Postern är inte tillgängligt";
        }
    });
}

async function loadAllSection() {
    await Promise.all([
        fillSection("trending", movielist.trending),
        fillSection("action", movielist.action),
        fillSection("horror", movielist.horror),
        fillSection("comedy", movielist.comedy)
    ]);
    console.log("All posters loaded!");
}
loadAllSection();

searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        const query = searchInput.value.trim();
        if (query !== "") {
            offWhen.forEach(el => el.style.display = "none");
            searchAndDisplay(query);
        }
    }
});

async function searchAndDisplay(query) {
    searchLists.innerHTML = "<p>Söker...</p>";
    searchResults.style.display = "block";

    const url = `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}&tt=&lsn=5&v=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        searchLists.innerHTML = "";

        if (data.description && data.description.length > 0) {
            const top5 = data.description.slice(0, 5);

            top5.forEach(movie => {
                const title = movie["#TITLE"] || "Okänd titel";
                const år = movie["#YEAR"] || "?";
                const poster = movie["#IMG_POSTER"] || "";
                const id = movie["#IMDB_ID"] || "";

                const box = document.createElement("div");
                box.classList.add("search_boxes");
                box.innerHTML = `
                    <img src="${poster}" alt="${title} poster">
                    <div class="search_boxes_info">
                        <h3>${title}</h3>
                        <p>${år}</p>
                        <p>${id}</p>
                    </div>
                `;
                searchLists.appendChild(box);
                box.style.cursor = "pointer";
                box.addEventListener("click", () => {
                    openTrailer(id, `${title} (${år})`);
                });
            });
        } else {
            searchLists.innerHTML = "<p>Inga resultat hittades.</p>";
        }

    } catch (error) {
        searchLists.innerHTML = "<p>Något gick fel.</p>";
        console.error("Search error:", error);
    }
}

logo.addEventListener("click", function () {
    offWhen.forEach(el => el.style.display = "block");
    searchResults.style.display = "none";
    searchLists.innerHTML = "";
    searchInput.value = "";
});

async function openTrailer(imdbId, title) {
    const modal = document.getElementById("trailerModal");
    const trailerContent = document.getElementById("trailerContent");
    const trailerTitle = document.getElementById("trailerTitle");

    trailerTitle.textContent = title;
    modal.style.display = "block";

    const searchQuery = encodeURIComponent(`${title} official trailer`);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

    trailerContent.innerHTML = `
        <div class="trailer_fallback">
            <p>Klicka för att se trailern på YouTube</p>
            <a href="${youtubeUrl}" target="_blank" class="trailer_btn">
                ▶ Se Trailer
            </a>
        </div>
    `;
}
document.getElementById("close").addEventListener("click", closeModal);
document.getElementById("trailerOverlay").addEventListener("click", closeModal);

function closeModal() {
    document.getElementById("trailerModal").style.display = "none";
    document.getElementById("trailerContent").innerHTML = "";
}
const filterBtn = document.getElementById("filter");
const filterMenu = document.getElementById("filterMenu");

// Öppna/stäng filtermenyn
filterBtn.addEventListener("click", function () {
    const isOpen = filterMenu.style.display === "flex";
    filterMenu.style.display = isOpen ? "none" : "flex";
});

// filtrera sektioner
document.querySelectorAll(".filterBtn").forEach(btn => {
    btn.addEventListener("click", function () {

        // markera aktiv knapp
        document.querySelectorAll(".filterBtn").forEach(b => b.classList.remove("active"));
        this.classList.add("active");

        const section = this.dataset.section;
        const sections = ["trending", "action", "horror", "comedy"];

        if (section === "all") {
            // Visa alla
            sections.forEach(s => {
                document.getElementById(s).style.display = "block";
            });
        } else {
            // Visa bara den valda, göm resten
            sections.forEach(s => {
                document.getElementById(s).style.display = s === section ? "block" : "none";
            });
        }

        // Stäng menyn efter val
        filterMenu.style.display = "none";
    });
});

// Stäng filtermenyn om man klickar utanför
document.addEventListener("click", function (e) {
    if (!filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
        filterMenu.style.display = "none";
    }
}); 