function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-list').forEach(list => list.classList.remove('show'));
    document.querySelectorAll('.dropdown').forEach(drop => drop.classList.remove('open'));
}
window.addEventListener('click', closeAllDropdowns);

document.querySelectorAll('.dropdown').forEach(dropdown => {
    const btn = dropdown.querySelector('.dropdown-btn');
    const text = dropdown.querySelector('.dropdown-text');
    const list = dropdown.querySelector('.dropdown-list');
    const placeholder = dropdown.getAttribute('data-placeholder');

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
