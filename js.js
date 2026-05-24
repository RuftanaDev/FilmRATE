//hämtar alla element med klassen .offWhenSearched(trending,action, horror, comedy och footer)
const offWhen = document.querySelectorAll(".offWhenSearched");
//logo-div klick på logon återställer sidan till startsidan
const logo = document.getElementById("logo");
//sökfälter där användaren skriver ett filmnamn
const searchInput = document.getElementById("searchInput");
//wrappern som visar sökresultaten
const searchResults = document.getElementById("searchResults");
// inre listan som fylls med sökkort av JS
const searchLists = document.getElementById("searchLists");
/* filter och sökfält är dolda i CSS(display:none)
JS gör dem synliga här om JS är avstängt syns de aldrig 
och sidan fungerar ändå(utan sökning och filter)
*/
document.getElementById("unseenable").style.display="block";
document.getElementById("searchInput").style.display="block";
/*filmlistor som är hårdkodade movielist innehåller titlar för varje genre
    De används för att hämta filmpostrar från 
    IMDb api'et och fylla boxarna på start sidan
*/
const movielist = {
    trending: ["The Devil Wears Prada 2", "Backrooms", "The Mandalorian & Grogu", "Mortal Kombat II", "I Love Boosters", "The Breadwinner", "The Sheep Detectives", "Hokum", "Obsession", "Animal Farm"],
    action: ["The Dark Knight", "Mad Max: Fury Road", "Die Hard", "The Matrix", "John Wick", "Terminator 2: Judgment Day", "The Raid: Redemption", "Inception", "Mission: Impossible – Fallout", "Gladiator"],
    horror: ["The Exorcist", "The Shining", "Hereditary", "The Conjuring", "Get Out", "A Nightmare on Elm Street", "Psycho", "The Thing", "The Babadook", "It Follows"],
    comedy: ["Airplane!", "The Hangover", "Superbad", "Anchorman: The Legend of Ron Burgundy", "Bridesmaids", "Step Brothers", "21 Jump Street", "Deadpool", "Monty Python and the Holy Grail", "Groundhog Day"]
};

// i den här function hämtar man poster, år, IMDb id för att visas för movielist
//asyn funktionen körs asynkront (väntar på svar utan att frysa sidan)
async function fetchPoster(title) {
    //bygger url:en encodeURIComponent gör titeln URL-säker (t.ex mellanslag - %20)
    //lsn = 1 begränsar till 1 resultat per sökning
    const url = `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(title)}&tt=&lsn=1&v=1`;
    try {
        //skickar HTTP anropet till API:et
        const response = await fetch(url);
        //Om HTTP. statuskoden inte är 200 OK- kasta ett fel m
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        //omvandlar svart till ett javascript-objekt (JSON)
        const data = await response.json();
        //om API:et returnerade mist ett resultat
        if (data.description && data.description.length > 0) {
            const movie = data.description[0];
            //returnera ett objekt med det vi behöver 
            // || title /"" /null = fallback-värde om fältet saknas 
            return {
                title: movie["#TITLE"] || title,
                year: movie["#YEAR"] || "",
                poster: movie["#IMG_POSTER"] || null,
                imdbId: movie["#IMDB_ID"] || ""
            };
        }
    } catch (error) {
        //loggar felet i konsolen men kraschar inte hela sidan
        console.error(`Kan inte fetcha poster för "${title}"`, error);
    }
    //om något gick fel eller inga resultat hittades - -returnera null
    return null;
}
/*funktion fillSection(sectionId, titles) 
hämtar postrar för alla filmer i en genre och sätter dem i rätt filmboxar
i HTML:en. Promise.all = alla hämtningar sker parallellt(snabbar än att hämta en i taget)*/
async function fillSection(sectionId, titles) {
    //hämtar alla filmboxar för denna sektion och trending har ett annat klassnamn än övriga genrer
    const filmBoxes = sectionId === "trending"?
        document.querySelectorAll(`#trending_list .films_boxes`):
        document.querySelectorAll(`#${sectionId}_list .films_boxes_${sectionId}`);
    //hämtar data för alla titlar parallellt och vänta tills alla är klara
    const movies = await Promise.all(titles.map(fetchPoster)); // FIX 1: updated name here too
    //gå igenom värje film och uppdatera motsvarande box i HTML
    movies.forEach((movie, index) => {
        if (!filmBoxes[index]) return; //hoppa över om det inte finns en box
        const imgEl = filmBoxes[index].querySelector("img");
        if (!imgEl) return;

        if (movie && movie.poster) {
            //sätt postern och tillgänglighets-alt-texten
            imgEl.src = movie.poster;
            imgEl.alt = `${movie.title} (${movie.year}) poster`;
            //tips vid hover
            filmBoxes[index].title = `${movie.title} (${movie.year})`;
            //spara IMDb-ID och title som data attributpå boxen(används av openTrailer)
            filmBoxes[index].dataset.imdbId = movie.imdbId;
            filmBoxes[index].dataset.movieTitle = movie.title;
            //visa hand-cursor -signalerar att boxen är klickbar
            filmBoxes[index].style.cursor = "pointer";
            //klick öppnar trailermodalen för denna film
            filmBoxes[index].addEventListener("click", () => {
                openTrailer(movie.imdbId, `${movie.title} (${movie.year})`);
            });
        } else {
            //ingen poster hittades sätt en förklarande alt-text
            imgEl.alt = "Postern är inte tillgängligt";
        }
    });
}
//startar laddning av alla fyra genrer parallellt när sidan öppnas
async function loadAllSection() {
    await Promise.all([
        fillSection("trending", movielist.trending),
        fillSection("action", movielist.action),
        fillSection("horror", movielist.horror),
        fillSection("comedy", movielist.comedy)
    ]);
    console.log("All posters loaded!"); //bekräftelse i konsolen för mig om allt har laddat
}
//anropar funktionen direkt laddning börjar när JS filen körs 
loadAllSection();
/*lyssnar på enter tangenten vilken triggas när användaren trycker Enter
 i sökfältet. Kör bara om fältet inte är tomt*/
searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        const query = searchInput.value.trim();
        if (query !== "") {
            //dölja alla genresektioner under sökning
            offWhen.forEach(el => el.style.display = "none");
            searchAndDisplay(query);
        }
    }
});
//söker i IMDb api:et och visar upp till 10 träffar i sökresultat rutan
async function searchAndDisplay(query) {
    searchLists.innerHTML = "<p>Söker...</p>";
    searchResults.style.display = "block";
    //lsn = 5 betyder att API:et returnerar fler resultat per sida
    const url = `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}&tt=&lsn=5&v=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();
        searchLists.innerHTML = ""; //Rensa "söker ..."  texten

        if (data.description && data.description.length > 0) {
            //begränsa till max 10 resultat
            const top10 = data.description.slice(0, 10);

            top10.forEach(movie => {
                //plocka ut relevant data - fallback om fältet saknas
                const title = movie["#TITLE"] || "Okänd titel";
                const år = movie["#YEAR"] || "?";
                const poster = movie["#IMG_POSTER"] || "";
                const id = movie["#IMDB_ID"] || "";
                //skapar ett nytt HTML-element för varje sökresultat
                const box = document.createElement("div");
                box.classList.add("search_boxes");
                //fyller boxen med bild, textinfo genom innerHTML
                box.innerHTML = `
                    <img src="${poster}" alt="${title} poster">
                    <div class="search_boxes_info">
                        <h3>${title}</h3>
                        <p>${år}</p>
                        <p>${id}</p>
                    </div>
                `;
                //lägg till boxen i DOM:en
                searchLists.appendChild(box);
                box.style.cursor = "pointer";
                //klick på sökresultat öpnnar trailermodalen
                box.addEventListener("click", () => {
                    openTrailer(id, `${title} (${år})`);
                });
            });
        } else {
            searchLists.innerHTML = "<p>Inga resultat hittades.</p>";
        }
    } catch (error) {
        //visar ett felmeddelande för användaren om något gick fel
        searchLists.innerHTML = "<p>Något gick fel.</p>";
        console.error("Search error:", error);
    }
}
//logo klick = återgå till startsidan och rensar sökning
logo.addEventListener("click", function () {
    offWhen.forEach(el => el.style.display = "block"); //visa tillbaka trending, action osv.
    searchResults.style.display = "none";//göm sökresultaten
    searchLists.innerHTML = "";//rensa söklistan
    searchInput.value = "";//töm sökfältet
});
//youtube sökning länk för filmen.
async function openTrailer(imdbId, title) {
    const modal = document.getElementById("trailerModal");
    const trailerContent = document.getElementById("trailerContent");
    const trailerTitle = document.getElementById("trailerTitle");
    //sätt filmtiteln i modalen
    trailerTitle.textContent = title;
    //visa modalen
    modal.style.display = "block";
    //bygger en Youtube söklän för en trailer
    const searchQuery = encodeURIComponent(`${title} official trailer`);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    //visar en klickbar youtube länk i modalen
    trailerContent.innerHTML = `
        <div class="trailer_fallback">
            <p>Klicka för att se trailern på YouTube</p>
            <a href="${youtubeUrl}" target="_blank" class="trailer_btn">
                ▶ Se Trailer
            </a>
        </div>
    `;
}
//stäng modal genom att klick på X eller genom att klicka på mörka bakgrund
document.getElementById("close").addEventListener("click", closeModal);
document.getElementById("trailerOverlay").addEventListener("click", closeModal);

function closeModal() {
    document.getElementById("trailerModal").style.display = "none";
    document.getElementById("trailerContent").innerHTML = ""; //rensa innehållet
}
//togglar filtermenyn med display flex/none
const filterBtn = document.getElementById("filter");
const filterMenu = document.getElementById("filterMenu");

// Öppna/stäng filtermenyn
filterBtn.addEventListener("click", function () {
    const isOpen = filterMenu.style.display === "flex";
    filterMenu.style.display = isOpen ? "none" : "flex"; //växla öppen/stängd
});

// filtrera knappar- varje knapp har data section ="genre" i HTML
//om "all" väljs visas alla annars bara vald
document.querySelectorAll(".filterBtn").forEach(btn => {
    btn.addEventListener("click", function () {

        // ta bort active klass från alla knappar, lägg till på den klickade
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