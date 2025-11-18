const upcomingContainer = document.querySelector(".assignments-wrapper");
const overlay = document.querySelector(".overlay-wrapper");
const confirmBtn = overlay.querySelector(".agree");
const cancelBtn = overlay.querySelector(".disagree");

let solutionLinkToOpen = null;
let assignmentIdToLog = null;
let currentUserId = null;

async function loadAssignments() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
        window.location.href = "auth.html";
        return;
    }
    currentUserId = user.id;

    try {
        const { data: userData, error: userError } = await client
            .from("users")
            .select("current_courses")
            .eq("sst_email", user.email)
            .single();

        if (userError) throw userError;
        const userCourses = userData.current_courses || [];

        const { data: coursesData, error: coursesError } = await client
            .from("courses")
            .select("course_id, course_name");
        
        if (coursesError) throw coursesError;
        
        const courseNameMap = new Map();
        coursesData.forEach(course => {
            courseNameMap.set(course.course_id, course.course_name);
        });

        const { data: assignments, error: assignmentsError } = await client
            .from("assignments")
            .select("*")
            .order("deadline", { ascending: true });

        if (assignmentsError) throw assignmentsError;

        const now = new Date();
        const upcomingAssignments = assignments.filter(asg => {
            const isUpcoming = new Date(asg.deadline) > now;
            const isRelevant = userCourses.includes(asg.subject_code);
            return isUpcoming && isRelevant;
        });

        if (upcomingAssignments.length === 0) {
            upcomingContainer.innerHTML = `<div class="no-data-found">No upcoming assignments found.</div>`;
        } else {
            upcomingContainer.innerHTML = upcomingAssignments.map(asg => 
                renderAssignmentCard(asg, courseNameMap)
            ).join('');
        }

        setupSolutionButtonListeners();

    } catch (error) {
        console.error("Error loading assignments:", error.message);
        upcomingContainer.innerHTML = `<div class="no-data-found">Failed to load assignments.</div>`;
    }
}

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

function setupSolutionButtonListeners() {
    upcomingContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.view-solution-btn');
        if (button) {
            solutionLinkToOpen = button.getAttribute('data-ref-link');
            assignmentIdToLog = button.getAttribute('data-assignment-id');
            overlay.classList.add('show');
        }
    });
}

confirmBtn.addEventListener('click', async () => {
    
    if (solutionLinkToOpen && assignmentIdToLog && currentUserId) {
        
        try {
            const { error } = await client
                .from('solution_views')
                .insert({ 
                    user_id: currentUserId, 
                    assignment_id: parseInt(assignmentIdToLog, 10) 
                });

            if (error) {
                throw error;
            }
            
            window.open(solutionLinkToOpen, '_blank');

        } catch (error) {
            console.error("Error logging solution view:", error.message);
            window.open(solutionLinkToOpen, '_blank');
        } finally {
            solutionLinkToOpen = null;
            assignmentIdToLog = null;
            overlay.classList.remove('show');
        }
    } else {
        overlay.classList.remove('show');
    }
});

cancelBtn.addEventListener('click', () => {
    solutionLinkToOpen = null;
    assignmentIdToLog = null;
    overlay.classList.remove('show');
});

window.addEventListener("DOMContentLoaded", loadAssignments);
