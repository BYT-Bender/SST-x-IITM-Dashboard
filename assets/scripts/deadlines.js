const SUPABASE_URL = "https://fvvfmyizwilosmbhtlhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmZteWl6d2lsb3NtYmh0bGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTg2MTAsImV4cCI6MjA3Njc5NDYxMH0._dPnV9wgBZZKvFR-zSZPp_FFQJ5Rf1akuMiS8maRhIs";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "auth.html";
});

const deadlinesContainer = document.getElementById("deadline-wrapper");

async function loadDeadlines() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    const { data: userData, error: userError } = await client
        .from('users')
        .select('current_courses')
        .eq('sst_email', user.email)
        .maybeSingle();

    if (userError || !userData) {
        console.error(userError);
        deadlinesContainer.innerHTML = "<p>Failed to load deadlines.</p>";
        return;
    }

    const userCourses = userData.current_courses || [];

    const { data: deadlines, deadlinesError } = await client
        .from('deadlines')
        .select('*')
        .order('deadline', { ascending: true });

    if (deadlinesError) {
        console.error(deadlinesError);
        deadlinesContainer.innerHTML = "<p>Failed to load deadlines.</p>";
        return;
    }

    const now = new Date();

    const visibleDeadlines = deadlines.filter(dl => {
        if (!dl.target_courses || dl.target_courses.length === 0) return true;
        return dl.target_courses.some(courseId => userCourses.includes(courseId));
    });

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
    switch (priority.toLowerCase()) {
        case 'high': return 'red';
        case 'medium': return 'yellow';
        case 'low': return 'green';
        default: return 'gray';
    }
}

window.addEventListener("DOMContentLoaded", loadDeadlines);
