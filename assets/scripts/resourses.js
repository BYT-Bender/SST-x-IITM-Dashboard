document.addEventListener("DOMContentLoaded", () => {
    
    const searchInput = document.querySelector(".search-input");
    const tagWrapper = document.querySelector(".tag-wrapper");
    const documentWrapper = document.querySelector(".document-card-wrapper");

    let activeTag = null;
    let searchTerm = "";

    async function loadResources() {
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.location.href = "auth.html";
            return;
        }

        try {
            const { data: userData, error: userError } = await client
                .from("users")
                .select("current_courses")
                .eq("sst_email", user.email)
                .maybeSingle();

            if (userError) throw userError;
            
            if (!userData) {
                console.warn("Access Denied", user.email);
                await client.auth.signOut();
                window.location.href = "access_denied.html";
                return;
            }
            const userCourses = userData.current_courses || [];

            const { data: resources, error: resourcesError } = await client
                .from("resources")
                .select("*")
                .order("created_at", { ascending: false });
            
            if (resourcesError) throw resourcesError;

            const validDocuments = resources.filter(res => {
                const isPublic = !res.target_courses || res.target_courses.length === 0;
                const isEnrolled = res.target_courses && res.target_courses.some(courseId => userCourses.includes(courseId));
                return isPublic || isEnrolled;
            });

            renderDynamicTags(validDocuments);
            renderAllDocuments(validDocuments);

            if (window.SvgLoader) window.SvgLoader.load();

        } catch (error) {
            console.error("Error loading resources:", error.message);
            documentWrapper.innerHTML = `<div class="no-data-found">Failed to load resources.</div>`;
        }
    }

    function renderDynamicTags(documents) {
        const allTags = new Set(documents.flatMap(doc => doc.tags || []));
        tagWrapper.innerHTML = [...allTags]
            .sort()
            .map(tag => `<span>${tag}</span>`)
            .join('');
    }

    function renderAllDocuments(documents) {
        if (documents.length === 0) {
            documentWrapper.innerHTML = `<div class="no-data-found">No resources available.</div>`;
            return;
        }

        const cardsHtml = documents.map(doc => {
            const displayDate = new Date(doc.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
            
            const tagsHtml = (doc.tags || []).map(tag => `<span>${tag}</span>`).join('');
            
            const tagsString = (doc.tags || []).join(',').toLowerCase();
            const titleString = doc.title.toLowerCase();

            return `
                <a href="${doc.redirect_link || '#'}" target="_blank" 
                   class="document-card-link" 
                   data-title="${titleString}" 
                   data-tags="${tagsString}">
                   
                    <div class="document-card">
                        <svg class="file-icon" data-src="assets/icons/${doc.file_icon || 'filetype-doc'}.svg"></svg>
                        <div class="document-info">
                            <div class="row">
                                <div class="title">${doc.title}</div>
                            </div>
                            <div class="row">
                                <div class="date-added">${displayDate}</div>
                            </div>
                        </div>
                        <div class="tags">
                            ${tagsHtml}
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        const noResultsHtml = `<div id="no-results-msg" class="no-resources-found hide">No resources found matching your criteria.</div>`;
        
        documentWrapper.innerHTML = cardsHtml + noResultsHtml;
    }

    function filterDocuments() {
        const cards = documentWrapper.querySelectorAll('.document-card-link');
        const noResultsMsg = document.getElementById('no-results-msg');
        let visibleCount = 0;

        cards.forEach(card => {
            // Retrieve data from DOM attributes
            const cardTitle = card.getAttribute('data-title');
            const cardTags = card.getAttribute('data-tags');

            const matchesSearch = !searchTerm || cardTitle.includes(searchTerm);
            
            const matchesTag = !activeTag || (cardTags && cardTags.split(',').includes(activeTag));

            if (matchesSearch && matchesTag) {
                card.classList.remove('hide');
                visibleCount++;
            } else {
                card.classList.add('hide');
            }
        });

        if (visibleCount === 0) {
            if(noResultsMsg) noResultsMsg.classList.remove('hide');
        } else {
            if(noResultsMsg) noResultsMsg.classList.add('hide');
        }
    }

    searchInput.addEventListener("input", (e) => {
        searchTerm = e.target.value.toLowerCase().trim();
        filterDocuments();
    });

    tagWrapper.addEventListener("click", (e) => {
        if (e.target.tagName === 'SPAN') {
            const tagButton = e.target;
            const tag = tagButton.textContent.toLowerCase(); 

            if (tagButton.classList.contains("active")) {
                tagButton.classList.remove("active");
                activeTag = null;
            } else {
                tagWrapper.querySelectorAll('span').forEach(btn => btn.classList.remove("active"));
                tagButton.classList.add("active");
                activeTag = tag;
            }
            
            filterDocuments();
        }
    });

    loadResources();
});
