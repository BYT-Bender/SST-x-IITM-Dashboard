const coursesContainer = document.getElementById("course-card-wrapper");
const deadlinesContainer = document.getElementById("deadline-wrapper");
const overlay = document.querySelector(".overlay-wrapper");
const closeBtn = overlay.querySelector(".close");

async function loadDashboard() {
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
        coursesContainer.innerHTML = `<div class="no-data-found">Failed to load courses.</div>`;
        deadlinesContainer.innerHTML = `<div class="no-data-found">Failed to load deadlines.</div>`;
        await client.auth.signOut();
        return;
    }

    const userCourses = userData.current_courses || [];

    if (userCourses.length === 0) {
        coursesContainer.innerHTML = `<div class="no-data-found">No courses enrolled.</div>`;
        return;
    }

    const { data: courses, error: courseError } = await client
        .from("courses")
        .select("course_id, course_name, type, credits, redirect_link")
        .in("course_id", userCourses);

    if (courseError) {
        console.error(courseError);
        coursesContainer.innerHTML = `<div class="no-data-found">Failed to load courses.</div>`;
        return;
    }

    coursesContainer.innerHTML = courses
        .map(course => `
            <div class="course-card">
                <div class="info">
                    <div class="title">${course.course_name}</div>
                    <div class="course-id">${course.course_id}</div>
                    <div class="row">
                    <div class="type">${course.type}</div>
                    <div class="credits">${course.credits}</div>
                    </div>
                </div>
                <a class="footer" href="${course.redirect_link || '#'}" target="_blank">
                    <span>View Course</span>
                    <svg data-src="assets/icons/chevron-right.svg"></svg>
                </a>
            </div>
        `).join('');

    const { data: deadlines, error: deadlinesError } = await client
        .from('deadlines')
        .select('*')
        .order('deadline', { ascending: true });

    if (deadlinesError) {
        console.error(deadlinesError);
        deadlinesContainer.innerHTML = `<div class="no-data-found">Failed to load deadlines.</div>`;
        return;
    }

    const now = new Date();

    const upcomingDeadlines = deadlines
        .filter(dl => {
            const allowed = !dl.target_courses || dl.target_courses.length === 0 ||
                dl.target_courses.some(courseId => userCourses.includes(courseId));
            const isUpcoming = new Date(dl.deadline) > now;
            return allowed && isUpcoming;
        })
        .slice(0, 4);

    deadlinesContainer.innerHTML = upcomingDeadlines.map(dl => {
        const deadlineTime = new Date(dl.deadline);
        const formattedTime = deadlineTime.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace('am', 'AM').replace('pm', 'PM');

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

window.addEventListener("DOMContentLoaded", loadDashboard);
