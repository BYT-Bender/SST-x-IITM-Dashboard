const SUPABASE_URL = "https://fvvfmyizwilosmbhtlhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmZteWl6d2lsb3NtYmh0bGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTg2MTAsImV4cCI6MjA3Njc5NDYxMH0._dPnV9wgBZZKvFR-zSZPp_FFQJ5Rf1akuMiS8maRhIs";

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getStatusClass(status) {
    if (!status) return 'gray';
    switch (status.toLowerCase()) {
        case 'upcoming': return 'yellow';
        case 'overdue': return 'red';
        default: return 'gray';
    }
}

function getPriorityClass(priority) {
    if (!priority) return 'gray';
    switch (priority.toLowerCase()) {
        case 'high': return 'red';
        case 'medium': return 'yellow';
        case 'low': return 'green';
        default: return 'gray';
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-list').forEach(list => list.classList.remove('show'));
    document.querySelectorAll('.dropdown').forEach(drop => drop.classList.remove('open'));
}

function initializeDropdowns() {
    window.addEventListener('click', closeAllDropdowns);

    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-btn');
        const text = dropdown.querySelector('.dropdown-text');
        const list = dropdown.querySelector('.dropdown-list');
        const placeholder = dropdown.getAttribute('data-placeholder');

        if (!btn || !text || !list) return;

        let selectedValue = btn.dataset.value || null;

        if (!selectedValue) {
            text.textContent = placeholder || 'Select an option';
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = list.classList.contains('show');
            closeAllDropdowns();
            if (!isOpen) {
                list.classList.add('show');
                dropdown.classList.add('open');
            } else {
                dropdown.classList.remove('open');
            }
        });

        list.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('li');
            if (!item) return;

            const value = item.getAttribute('data-value');

            if (selectedValue === value) {
                list.classList.remove('show');
                dropdown.classList.remove('open');
                return;
            }

            selectedValue = value;
            text.textContent = item.textContent;
            btn.dataset.value = value;

            list.classList.remove('show');
            dropdown.classList.remove('open');

            const changeEvent = new CustomEvent('change', {
                bubbles: true,
                detail: {
                    value: value,
                    text: item.textContent,
                    placeholder: placeholder
                }
            });
            dropdown.dispatchEvent(changeEvent);
        });
    });
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await client.auth.signOut();
            window.location.href = "auth.html";
        });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    setupLogoutButton();
    initializeDropdowns();
});
