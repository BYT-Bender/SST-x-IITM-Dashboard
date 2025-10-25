const SUPABASE_URL = "https://fvvfmyizwilosmbhtlhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmZteWl6d2lsb3NtYmh0bGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTg2MTAsImV4cCI6MjA3Njc5NDYxMH0._dPnV9wgBZZKvFR-zSZPp_FFQJ5Rf1akuMiS8maRhIs";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "auth.html";
});

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".search-input");
    const tagButtons = document.querySelectorAll(".tag-wrapper span");
    const documentLinks = document.querySelectorAll(".document-card-wrapper a");
    const documentWrapper = document.querySelector(".document-card-wrapper");
    
    let activeTag = null;
    let searchTerm = "";

    const allDocuments = Array.from(documentLinks).map(link => {
        const card = link.querySelector('.document-card');
        const titleElement = card.querySelector(".document-info .title");
        const tagElements = card.querySelectorAll(".tags span");
        
        const title = titleElement ? titleElement.textContent.toLowerCase() : "";
        const tags = tagElements ? Array.from(tagElements).map(tag => tag.textContent.toLowerCase()) : [];
        
        return {
            element: link,
            title: title,
            tags: tags
        };
    });

    const noResultsMessage = document.createElement("div");
    noResultsMessage.className = "no-lectures";
    noResultsMessage.textContent = "No resources found matching your criteria.";
    noResultsMessage.style.display = "none";
    noResultsMessage.style.width = "100%";
    noResultsMessage.style.textAlign = "center";
    documentWrapper.appendChild(noResultsMessage);

    function filterDocuments() {
        let resultsFound = false;

        allDocuments.forEach(doc => {
            const titleMatch = doc.title.includes(searchTerm);
            const tagMatch = !activeTag || doc.tags.includes(activeTag);

            if (titleMatch && tagMatch) {
                doc.element.style.display = "block";
                resultsFound = true;
            } else {
                doc.element.style.display = "none";
            }
        });

        if (resultsFound) {
            noResultsMessage.style.display = "none";
        } else {
            noResultsMessage.style.display = "block";
        }
    }

    searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value.toLowerCase().trim();
        filterDocuments();
    });

    tagButtons.forEach(tagButton => {
        tagButton.addEventListener("click", () => {
            const tag = tagButton.textContent.toLowerCase();

            if (tagButton.classList.contains("active")) {
                tagButton.classList.remove("active");
                activeTag = null;
            } else {
                tagButtons.forEach(btn => btn.classList.remove("active"));
                tagButton.classList.add("active");
                activeTag = tag;
            }
            
            filterDocuments();
        });
    });
});
