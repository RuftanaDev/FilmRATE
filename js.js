const offWhen = document.querySelectorAll(".offWhenSearched");
const logo = document.getElementById("logo");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const searchLists = document.getElementById("searchLists");
const movielist = {
    trending:[ "Deadpool & Wolverine", "The Fantastic Four: First Steps", "Superman", "Oppenheimer","Poor Things","Killers of the Flower Moon", "The Zone of Interest", "All of Us Strangers", "Society of the Snow","American Fiction"],

    action:["Terminator 2: Judgment Day", "Die Hard", "The Matrix", "The Dark Knight", "Top Gun: Maverick", "Hard Boiled", "John Wick", "Raiders of the Lost Ark", "Mad Max: Fury Road", "The Raid Redmention"], 
    
    horror:["The Exorcist", "The Shining", "Alien", "Hereditary", "The Conjuring", "IT", "Psycho", "Halloween", "Get Out", "A Nightmare on Elm Street"],

    comedy:["Airplane!", "Superbad", "Up", "Anchorman: The Legend of Ron Burgundy", "The Hangover", "Dumb and Dumber", "Bridesmaids", "Shaun of the Dead", "Step Brothers", "Caddyshack"]
}
async function fectchPoster (title){
    const url = `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(title)}&tt=&lsn=1&v=1`;
    try{
        const response =await fetch(url);
        if(!response. ok) throw new Error('HTTP error: ${response.status}');

        const data = await response.json();
        //Den första resultat är bästa i flesta fall
        if(data.description && data.description.length > 0){
            const movie  = data.description[0];

            return{
                title : movie["#TITLE"] || title,
                year  : movie["#YEAR"]  || "",
                poster: movie["#IMG_POSTER"] || null,
                imdbId: movie["#IMDB_ID"]|| ""
            };
        }
    }   catch(error){
        console.error(`Kan inte fetcha poster för "${title}`,error);
    }
    return null; // Det här returns null om någonting blir fel
}
async function fillSection(sectionId, title) {
    //hitta alla boxar namn
    const boxes = document.querySelectorAll(`#${sectionId}_list .filmboxes_${sectionId == "trending" ? "": sectionId}`);

    //Om selectorn är  "trending" klassens namn är bara film_boxes ingen mer text
    const filmBoxes = sectionId == "trending"
    ? document.querySelectorAll(`#trending_list .films_boxes`)
    : document.querySelectorAll(`#${sectionId}_list .films_boxes_${sectionId}`);

    //fetcha alla poster från title samtidigt för att det är snabbare
    const movies = await Promise.all (title.map(fectchPoster));

    movies.forEach((movie, index)   => {
        if(!filmBoxes[index]) return; //hoppar över om det finns mer filmar än boxar

        const imgEl = filmBoxes[index].querySelector("img");
        if(!imgEl) return;

        if(movie && movie.poster){
            imgEl.src = movie.poster;
            imgEl.alt = `${movie.title}(${movie.year}) poster`

            //det här visar titlen när man hover
            filmBoxes[index].title = `${movie.title} (${movie.year})`;

        }else {
            imgEl.alt = "Postern är inte tillgängligt";
        }
    });
}
// Ladda allting på en ladd//
async function loadAllSection() {
    await Promise.all([
        fillSection("trending", movielist.trending),
        fillSection("action", movielist.action),
        fillSection("horror", movielist.horror),
        fillSection("comedy", movielist.comedy)
    ])
    console.log("All posters loaded!");  
}
loadAllSection();


searchInput.addEventListener("keydown", function(event){
    
    if(event.key =="Enter"){
        const query = searchInput.value.trim(); //få vad man har sökt för
        if(query !== ""){
            offWhen.forEach(el => el.style.display = "none");
            searchAndDisplay(query);
        }
    }
});
async function searchAndDisplay(query){
    searchLists.innerHTML = "<p>Söker..</p>"; //den här visas en text att det söker

    searchResults.style.display = "block"; //visar resualtets sektion
    
    const url = `https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}&tt=&lsn=5&v=1`;

    try{
        const response = await fetch(url);
        if(!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

        searchLists.innerHTML = ""
        if(data.description && data.description.length> 0){
            const top5 = data.description.slice(0,5); //det har gör att det tar bara den första fem resulterna

            top5.forEach(movie => {
                const title = movie["#TITLE"] || "Okänd titel";
                const år = movie["#YEAR"] || "?";
                const poster = movie["#IMG_POSTER"] || "";
                const id = movie["#IMDB_ID"] || "";
                
                //skapa ett div för var och en

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
                searchLists.appendChild(box); //addera till sidan

            });
        }
            else {
                searchLists.innerHTML = "<p>Inga resultat hittades.</p>"
            
        }

    }   catch (error){
        searchLists.innerHTML = "<p>Något gick fel.</p>";
        console.error("Search error:", error);

    }
}   
logo.addEventListener("click", function(){
    offWhen.forEach(el => el.style.display="block");
    
    searchResults.style.display = "none";
    searchLists.innerHTML = "";
    searchInput.value ="BadMan";
});

