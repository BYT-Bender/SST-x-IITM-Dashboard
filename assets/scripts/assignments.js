// --- Supabase Client ---
const SUPABASE_URL = "https://fvvfmyizwilosmbhtlhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmZteWl6d2lsb3NtYmh0bGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTg2MTAsImV4cCI6MjA3Njc5NDYxMH0._dPnV9wgBZZKvFR-zSZPp_FFQJ5Rf1akuMiS8maRhIs";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const upcomingContainer = document.querySelector(".assignments-wrapper");
const logoutBtn = document.getElementById("logout");
const overlay = document.querySelector(".overlay-wrapper");
const confirmBtn = overlay.querySelector(".agree");
const cancelBtn = overlay.querySelector(".disagree");

let solutionLinkToOpen = null; // Variable to store the link when a user clicks
let assignmentIdToLog = null; // 🔽 ADDED: Variable to store the assignment ID
let currentUserId = null; // 🔽 ADDED: Variable to store the user's ID

// --- Logout ---
logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "auth.html";
});

// --- Main Function: Load Assignments ---
async function loadAssignments() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
        window.location.href = "auth.html";
        return;
    }
    currentUserId = user.id; // 🔽 ADDED: Store the user's ID globally

    try {
        // 1. Get user's enrolled courses (e.g., ['BSMA1001', 'BSCS1001'])
        const { data: userData, error: userError } = await client
            .from("users")
            .select("current_courses")
            .eq("sst_email", user.email)
            .single();

        if (userError) throw userError;
        const userCourses = userData.current_courses || [];

        // 2. Get all course details (to map 'BSMA1001' -> 'Mathematics for Data Science I')
        const { data: coursesData, error: coursesError } = await client
            .from("courses")
            .select("course_id, course_name");
        
        if (coursesError) throw coursesError;
        
        // Create a simple lookup map for course names
        const courseNameMap = new Map();
        coursesData.forEach(course => {
            courseNameMap.set(course.course_id, course.course_name);
        });

        // 3. Get all assignments
        const { data: assignments, error: assignmentsError } = await client
            .from("assignments")
            .select("*")
            .order("deadline", { ascending: true }); // Get soonest first

        if (assignmentsError) throw assignmentsError;

        // 4. Filter for upcoming and relevant assignments
        const now = new Date();
        const upcomingAssignments = assignments.filter(asg => {
            const isUpcoming = new Date(asg.deadline) > now;
            const isRelevant = userCourses.includes(asg.subject_code);
            return isUpcoming && isRelevant;
        });

        // 5. Render assignments
        if (upcomingAssignments.length === 0) {
            upcomingContainer.innerHTML = `<div class="no-lectures">No upcoming assignments found.</div>`;
        } else {
            upcomingContainer.innerHTML = upcomingAssignments.map(asg => 
                renderAssignmentCard(asg, courseNameMap)
            ).join('');
        }

        // 6. Add listeners for the new "View Solution" buttons
        setupSolutionButtonListeners();

    } catch (error) {
        console.error("Error loading assignments:", error.message);
        upcomingContainer.innerHTML = `<div class="no-lectures">Failed to load assignments.</div>`;
    }
}

// --- Helper: Render Card HTML ---
function renderAssignmentCard(asg, courseNameMap) {
    const subjectName = courseNameMap.get(asg.subject_code) || asg.subject_code;
    const deadline = new Date(asg.deadline);
    const formattedDeadline = deadline.toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(',', ', ');

    // Determine color for assignment type
    const typeClass = asg.assignment_type.toLowerCase().includes('graded') ? 'yellow' : 'blue';

    return `
        <div class="assignment-card">
            <div class="info-wrapper">
                <div class="subject">${subjectName}</div>
                <div class="tags">
                    ${asg.week ? `<div class="chip">Week ${asg.week}</div>` : ''}
                    <div class="chip ${typeClass}">${asg.assignment_type}</div>
                </div>
                <div class="description">
                    <p>${asg.description}</p>
                </div>
                <div class="deadline">
                    <svg data-src="assets/icons/stopwatch.svg"></svg>
                    <span>${formattedDeadline} IST</span>
                </div>
            </div>
            <div class="view-btn-wrapper">
                ${asg.ref_link ? 
                    `<button class="view-solution-btn" data-ref-link="${asg.ref_link}" data-assignment-id="${asg.id}">View Solution</button>` // 🔼 MODIFIED: Added data-assignment-id
                    : ''
                }
            </div>
            ${asg.week ? `<div class="week-number">${asg.week}</div>` : ''}
        </div>
    `;
}

// --- Helper: Setup Listeners ---
function setupSolutionButtonListeners() {
    // Use event delegation on the container
    upcomingContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.view-solution-btn');
        if (button) {
            solutionLinkToOpen = button.getAttribute('data-ref-link');
            assignmentIdToLog = button.getAttribute('data-assignment-id'); // 🔽 ADDED: Get the assignment ID
            overlay.classList.add('show');
        }
    });
}

// --- Overlay Listeners ---
confirmBtn.addEventListener('click', async () => { // 🔼 MODIFIED: Made function async
    
    // 🔽 ADDED: Check if we have all the data needed to log
    if (solutionLinkToOpen && assignmentIdToLog && currentUserId) {
        
        try {
            // 1. Log the view to Supabase
            const { error } = await client
                .from('solution_views')
                .insert({ 
                    user_id: currentUserId, 
                    assignment_id: parseInt(assignmentIdToLog, 10) 
                });

            if (error) {
                throw error; // Throw error to be caught below
            }
            
            // 2. Open the link (only after successful logging)
            window.open(solutionLinkToOpen, '_blank');

        } catch (error) {
            console.error("Error logging solution view:", error.message);
            // Failsafe: Still open the link even if logging fails
            // so the user experience isn't broken.
            window.open(solutionLinkToOpen, '_blank');
        } finally {
            // 3. Reset and close
            solutionLinkToOpen = null;
            assignmentIdToLog = null; // 🔽 ADDED: Reset the ID
            overlay.classList.remove('show');
        }
    } else {
        // Failsafe if data is missing, just close
        overlay.classList.remove('show');
    }
});

cancelBtn.addEventListener('click', () => {
    solutionLinkToOpen = null;
    assignmentIdToLog = null; // 🔽 ADDED: Reset the ID
    overlay.classList.remove('show');
});

// --- Initial Load ---
window.addEventListener("DOMContentLoaded", loadAssignments);