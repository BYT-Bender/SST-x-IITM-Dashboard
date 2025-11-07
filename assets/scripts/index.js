const SUPABASE_URL = "https://fvvfmyizwilosmbhtlhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmZteWl6d2lsb3NtYmh0bGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTg2MTAsImV4cCI6MjA3Njc5NDYxMH0._dPnV9wgBZZKvFR-zSZPp_FFQJ5Rf1akuMiS8maRhIs";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const coursesContainer = document.getElementById("course-card-wrapper");
const deadlinesContainer = document.getElementById("deadline-wrapper");

const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "auth.html";
});

async function loadDashboard() {
    const { data: { user } } = await client.auth.getUser();

    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    let userData;
    try {
        const { data, error } = await client
            .from("users") // Your 'allowlist' table
            .select("current_courses")
            .eq("sst_email", user.email)
            .maybeSingle(); // Returns null if not found

        if (error) {
            throw new Error(`Allowlist check failed: ${error.message}`);
        }

        if (!data) {
            // User is authenticated but NOT on the allowlist.
            console.warn("Access Denied: User not in allowlist.", user.email);
            await client.auth.signOut(); // Log them out
            window.location.href = "access_denied.html"; // Redirect to denied page
            return; // Stop executing
        }
        userData = data; // Store the approved user's data

    } catch (error) {
        console.error(error.message);
        coursesContainer.innerHTML = "<p>Failed to load courses.</p>";
        deadlinesContainer.innerHTML = "<p>Failed to load deadlines.</p>";
        await client.auth.signOut();
        return;
    }

    const userCourses = userData.current_courses || [];

    if (userCourses.length === 0) {
        coursesContainer.innerHTML = "No courses enrolled.";
        return;
    }

    const { data: courses, error: courseError } = await client
        .from("courses")
        .select("course_id, course_name, type, credits, redirect_link")
        .in("course_id", userCourses);

    if (courseError) {
        console.error(courseError);
        coursesContainer.innerHTML = "<p>Failed to load courses.</p>";
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
        deadlinesContainer.innerHTML = "<p>Failed to load deadlines.</p>";
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
        .slice(0, 3);

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
                <a class="link" href="${dl.redirect_link || '#'}">
                    <span>Open</span>
                    <svg data-src="assets/icons/box-arrow-up-right.svg"></svg>
                </a>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'upcoming': return 'yellow';
        case 'overdue': return 'red';
        default: return 'gray';
    }
}

function getPriorityClass(priority) {
    if (!priority) return "gray";
    switch (priority.toLowerCase()) {
        case 'high': return 'red';
        case 'medium': return 'yellow';
        case 'low': return 'green';
        default: return 'gray';
    }
}

window.addEventListener("DOMContentLoaded", loadDashboard);
