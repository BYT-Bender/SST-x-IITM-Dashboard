const deadlinesContainer = document.getElementById("deadline-wrapper");
const overlay = document.querySelector(".overlay-wrapper");
const closeBtn = overlay.querySelector(".close");

async function loadDeadlines() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    let userData;
    try {
        const { data, error } = await client
            .from("users")
            .select("current_courses")
            .eq("sst_email", user.email)
            .maybeSingle();

        if (error) {
            throw new Error(`Allowlist check failed: ${error.message}`);
        }

        if (!data) {
            console.warn("Access Denied: User not in allowlist.", user.email);
            await client.auth.signOut();
            window.location.href = "access_denied.html";
            return;
        }
        userData = data;

    } catch (error) {
        console.error(error.message);
        deadlinesContainer.innerHTML = `<div class="no-data-found">Failed to load deadlines.</div>`;
        await client.auth.signOut();
        return;
    }   

    const userCourses = userData.current_courses || [];

    const { data: deadlines, error: deadlinesError } = await client
        .from('deadlines')
        .select('*');

    if (deadlinesError) {
        console.error(deadlinesError);
        deadlinesContainer.innerHTML = `<div class="no-data-found">Failed to load deadlines.</div>`;
        return;
    }

    const now = new Date();

    let visibleDeadlines = deadlines.filter(dl => {
        if (!dl.target_courses || dl.target_courses.length === 0) return true;
        return dl.target_courses.some(courseId => userCourses.includes(courseId));
    });

    visibleDeadlines.sort((a, b) => {
        const dateA = new Date(a.deadline);
        const dateB = new Date(b.deadline);
        
        const isUpcomingA = dateA > now;
        const isUpcomingB = dateB > now;

        if (isUpcomingA && !isUpcomingB) return -1;
        if (!isUpcomingA && isUpcomingB) return 1;

        if (isUpcomingA && isUpcomingB) return dateA - dateB;
        if (!isUpcomingA && !isUpcomingB) return dateB - dateA;
        
        return 0;
    });

    if (visibleDeadlines.length === 0) {
        deadlinesContainer.innerHTML = `<div class="no-data-found">No deadlines found.</div>`;
        return;
    }

    deadlinesContainer.innerHTML = visibleDeadlines.map(dl => {
        const deadlineTime = new Date(dl.deadline);
        const formattedTime = deadlineTime.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace('am', 'AM').replace('pm', 'PM');;

        const status = deadlineTime > now ? "Upcoming" : "Overdue";

        const hasLink = dl.redirect_link && dl.redirect_link.trim() !== "";
        const linkHref = hasLink ? dl.redirect_link : "javascript:void(0)";
        const linkClass = hasLink ? "" : "popup-trigger";

        return `
            <div class="deadline-row">
                <div class="completion">
                    <input type="checkbox" name="" id="">
                </div>
                <div class="title">${dl.title}</div>
                <div class="description">${dl.description}</div>
                <div class="time">${formattedTime}</div>
                <div class="status ${getStatusClass(status)}">${status}</div>
                <div class="priority ${getPriorityClass(dl.priority)}">${dl.priority}</div>
                <a class="link ${linkClass}" href="${linkHref}" target="_blank">
                    <span>Open</span>
                    <svg data-src="assets/icons/box-arrow-up-right.svg"></svg>
                </a>
            </div>
        `;
    }).join('');
}

deadlinesContainer.addEventListener('click', (e) => {
    const trigger = e.target.closest('.popup-trigger');
    
    if (trigger) {
        e.preventDefault();
        overlay.classList.add('show');
    }
});

closeBtn.addEventListener('click', () => {
    overlay.classList.remove('show');
});

window.addEventListener("DOMContentLoaded", loadDeadlines);
