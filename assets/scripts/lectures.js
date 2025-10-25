const SUPABASE_URL = "https://fvvfmyizwilosmbhtlhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmZteWl6d2lsb3NtYmh0bGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTg2MTAsImV4cCI6MjA3Njc5NDYxMH0._dPnV9wgBZZKvFR-zSZPp_FFQJ5Rf1akuMiS8maRhIs";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", async () => {
    await client.auth.signOut();
    window.location.href = "auth.html";
});

const lecturesContainer = document.querySelector(".upcoming-lectures-wrapper");
const dateSelector = document.querySelector(".date-selector");

async function loadLectures() {
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
        window.location.href = "auth.html";
        return;
    }

    const { data: userData, error: userError } = await client
        .from("users")
        .select("batch, group, current_courses")
        .eq("sst_email", user.email)
        .maybeSingle();

    if (userError || !userData) {
        console.error(userError);
        lecturesContainer.innerHTML = "<p>Failed to load lectures.</p>";
        return;
    }

    const userBatch = userData.batch || null;
    const userGroup = userData.group || null;
    const userCourses = userData.current_courses || [];

    const { data: lectures, error: lecturesError } = await client
        .from("lectures")
        .select("*")
        .order("start_time", { ascending: true });

    if (lecturesError) {
        console.error(lecturesError);
        lecturesContainer.innerHTML = "<p>Failed to load lectures.</p>";
        return;
    }

    const now = new Date();

    const upcomingLectures = lectures.filter(lec => {
        const start = new Date(lec.start_time);
        const end = new Date(lec.end_time);
        const isUpcoming = end > now;

        if (!isUpcoming) return false;

        const subjectAllowed = !lec.subject || userCourses.includes(lec.subject);
        const batchAllowed = !lec.target_batch == [] || lec.target_batch === userBatch;
        const groupAllowed = !lec.target_group == [] || lec.target_group === userGroup;

        return subjectAllowed && batchAllowed && groupAllowed;
    });

    const nextThree = upcomingLectures.slice(0, 3);

    const uniqueDates = [...new Set(nextThree.map(l =>
        new Date(l.start_time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    ))];

    dateSelector.innerHTML = uniqueDates
        .map(date => `<div class="item">${date}</div>`)
        .join("");

    const dateItems = dateSelector.querySelectorAll(".item");

    function renderLecturesForDate(selectedDate) {
        const filtered = nextThree.filter(lec => {
            const lecDate = new Date(lec.start_time).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            });
            return lecDate === selectedDate;
        });

        lecturesContainer.innerHTML = filtered.length
            ? filtered.map(lec => {
                const start = new Date(lec.start_time);
                const end = new Date(lec.end_time);

                const formattedStart = start.toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit", hour12: true
                }).replace("am", "AM").replace("pm", "PM");

                const formattedEnd = end.toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit", hour12: true
                }).replace("am", "AM").replace("pm", "PM");

                return `
            <div class="lecture-card">
              <div class="thumbnail-wrapper">
                <img src="${lec.thumbnail || "assets/images/course.png"}" alt="">
              </div>
              <div class="info-wrapper">
                <div class="lecture-title">${lec.title}</div>
                <div class="lecture-info">
                  <div class="time">
                    <div class="start-time">${formattedStart}</div>
                    <div class="separator">-</div>
                    <div class="end-time">${formattedEnd}</div>
                  </div>
                  <div class="external-link">
                    <a href="${lec.redirect_link || "#"}" target="_blank">View Details</a>
                  </div>
                </div>
              </div>
            </div>
          `;
            }).join("")
            : `<div class="no-lectures">No lectures on this date.</div>`;
    }

    dateItems.forEach((item, index) => {
        item.addEventListener("click", () => {
            dateItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            const selectedDate = item.textContent.trim();
            renderLecturesForDate(selectedDate);
        });

        if (index === 0) {
            item.classList.add("active");
            renderLecturesForDate(item.textContent.trim());
        }
    });
}

window.addEventListener("DOMContentLoaded", loadLectures);

async function loadAllLectures() {
    const wrapper = document.querySelector(".all-lectures-wrapper");
    const dropdowns = document.querySelectorAll(".filter-menu .dropdown");
    const filters = { status: "upcoming", subject: "", date: "", mode: "" };

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        const options = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
        };
        return date.toLocaleString("en-GB", options)
            .replace("am", "AM")
            .replace("pm", "PM");
    };

    const subjectMap = {
        BSMA1001: "Maths I",
        BSMA1002: "Stats I",
        BSCS1001: "CT",
        BSHS1001: "English I"
    };

    const displayLectures = (lectures) => {
        wrapper.innerHTML = "";

        if (!lectures.length) {
            wrapper.innerHTML = `<div class="no-lectures">No lectures found.</div>`;
            return;
        }

        lectures.forEach((lec) => {
            const durationHours =
                (new Date(lec.end_time) - new Date(lec.start_time)) /
                (1000 * 60 * 60);

            const readableSubject = lec.subject ? subjectMap[lec.subject] || lec.subject : "General";

            const row = document.createElement("div");
            row.className = "lecture-row";
            row.innerHTML = `
            <div class="title">${lec.title}</div>
            <div class="subject">${readableSubject}</div>
            <div class="time">${formatDateTime(lec.start_time)}</div>
            <div class="duration">${durationHours} hr</div>
            <div class="mode ${lec.mode.toLowerCase() === "online" ? "blue" : "purple"}">
                ${lec.mode}
            </div>
        `;
            wrapper.appendChild(row);
        });
    };

    let allLectures = [];

    const fetchLectures = async () => {
        const { data: { user }, error: userErr } = await client.auth.getUser();
        if (userErr || !user) {
            console.error("User not logged in:", userErr);
            window.location.href = "auth.html";
            return;
        }

        const { data: userData, error: profileErr } = await client
            .from("users")
            .select("batch, group")
            .eq("sst_email", user.email)
            .maybeSingle();

        if (profileErr || !userData) {
            console.error("Error loading user data:", profileErr);
            wrapper.innerHTML = `<div class="no-lectures">Failed to load user data.</div>`;
            return;
        }

        const userBatch = userData.batch;
        const userGroup = userData.group;

        const { data: lectures, error } = await client
            .from("lectures")
            .select("*")
            .order("start_time", { ascending: true });

        if (error) {
            console.error("Error fetching lectures:", error);
            wrapper.innerHTML = `<div class="no-lectures">Failed to load lectures.</div>`;
            return;
        }

        allLectures = lectures.filter((lec) => {
            const batchAllowed =
                !lec.target_batch ||
                lec.target_batch.length === 0 ||
                lec.target_batch.includes(userBatch);

            const groupAllowed =
                !lec.target_group ||
                lec.target_group.length === 0 ||
                lec.target_group.includes(userGroup);

            return batchAllowed && groupAllowed;
        });

        populateDropdowns();
        initializeFilterListeners();
        applyFilters();
    };

    const populateDropdowns = () => {
        const statusList = document.querySelector(".dropdown[data-placeholder='Status'] .dropdown-list");
        const subjectList = document.querySelector(".dropdown[data-placeholder='Subject'] .dropdown-list");
        const dateList = document.querySelector(".dropdown[data-placeholder='Date'] .dropdown-list");
        const modeList = document.querySelector(".dropdown[data-placeholder='Mode'] .dropdown-list");

        const addAllOption = (list, text) => {
            const li = document.createElement("li");
            li.dataset.value = "";
            li.textContent = text;
            list.appendChild(li);
        };

        const statusAllOption = statusList.querySelector('li[data-value=""]');
        if (statusAllOption) {
            statusAllOption.textContent = "Status";
        }

        subjectList.innerHTML = "";
        addAllOption(subjectList, "Subject");

        const uniqueSubjects = [...new Set(
            allLectures.map(lec => lec.subject ? (subjectMap[lec.subject] || lec.subject) : "General")
        )].sort();

        uniqueSubjects.forEach(subject => {
            const li = document.createElement("li");
            li.dataset.value = subject.replace(/\s/g, "").toLowerCase();
            li.textContent = subject;
            subjectList.appendChild(li);
        });

        dateList.innerHTML = "";
        addAllOption(dateList, "Date");

        const dateMap = new Map();
        allLectures.forEach(lec => {
            const d = new Date(lec.start_time);
            const display = d.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
            const value = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
            if (!dateMap.has(value)) {
                dateMap.set(value, { display, value, dateObj: d });
            }
        });
        const uniqueDateObjects = Array.from(dateMap.values()).sort((a, b) => a.dateObj - b.dateObj);

        uniqueDateObjects.forEach(date => {
            const li = document.createElement("li");
            li.dataset.value = date.value;
            li.textContent = date.display;
            dateList.appendChild(li);
        });

        modeList.innerHTML = "";
        addAllOption(modeList, "Mode");

        const uniqueModes = [...new Set(allLectures.map(lec => lec.mode))].sort();

        uniqueModes.forEach(mode => {
            const li = document.createElement("li");
            li.dataset.value = mode.toLowerCase();
            li.textContent = mode;
            modeList.appendChild(li);
        });
    };

    const applyFilters = () => {
        const now = new Date();
        let filtered = [...allLectures];

        if (filters.status) {
            filtered = filtered.filter((l) => {
                const start = new Date(l.start_time);
                return filters.status === "upcoming" ? start >= now : start < now;
            });
        }

        if (filters.subject) {
            filtered = filtered.filter(l => {
                const subj = (l.subject ? subjectMap[l.subject] || l.subject : "General")
                    .replace(/\s/g, "").toLowerCase();
                return subj === filters.subject.toLowerCase();
            });
        }

        if (filters.date) {
            const [day, month, year] = filters.date.split("-");
            const target = new Date(`${year}-${month}-${day}`);
            filtered = filtered.filter(
                (l) =>
                    new Date(l.start_time).toDateString() ===
                    target.toDateString()
            );
        }

        if (filters.mode) {
            filtered = filtered.filter(l => l.mode.toLowerCase() === filters.mode.toLowerCase());
        }

        displayLectures(filtered);
    };

    const initializeFilterListeners = () => {
        dropdowns.forEach((dropdown) => {
            const placeholder = dropdown.getAttribute("data-placeholder");
            const key = placeholder.toLowerCase();
            const btn = dropdown.querySelector(".dropdown-btn");
            const text = dropdown.querySelector(".dropdown-text");
            const list = dropdown.querySelector(".dropdown-list");

            const defaultValue = filters[key] || "";
            const defaultItem = list.querySelector(`li[data-value="${defaultValue}"]`);

            if (defaultItem) {
                text.textContent = defaultItem.textContent;
                btn.dataset.value = defaultValue;
            } else {
                const allItem = list.querySelector(`li[data-value=""]`);
                if (allItem) {
                    text.textContent = allItem.textContent;
                } else {
                    text.textContent = placeholder;
                }
            }

            dropdown.addEventListener('change', (e) => {
                const selectedValue = e.detail.value;
                filters[key] = selectedValue;
                applyFilters();
            });
        });
    };

    fetchLectures();
}


window.addEventListener("DOMContentLoaded", loadAllLectures);
