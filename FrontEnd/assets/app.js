// app.js
console.log('app.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready');

  // ====== CONFIG ======
  const API_BASE = 'http://localhost:5678/api';

  // ====== DOM REFERENCES ======
  // Gallery + filters
  const galleryEl      = document.querySelector('.gallery');
  const filtersEl      = document.getElementById('filters');

  // Admin / modal UI
  const editBtn        = document.getElementById('edit-projects-btn');
  const modalEl        = document.getElementById('modal');
  const modalCloseBtn  = document.getElementById('modal-close');
  const modalForm      = document.getElementById('modal-form');

  // Modal inputs
  const imageInput     = document.getElementById('image-input');
  const previewWrap    = document.getElementById('image-preview');
  const previewImg     = document.getElementById('preview-img');
  const titleInput     = document.getElementById('title-input');
  const categorySelect = document.getElementById('category-select');
  const submitBtn      = document.getElementById('modal-submit');
  const modalErrorEl   = document.getElementById('modal-error');
  const uploadPlaceholder = document.getElementById('upload-placeholder');

  // Navbar auth links
  const loginLink  = document.getElementById('login-link');
  const logoutLink = document.getElementById('logout-link');

  // ====== STATE ======
  let allWorks = [];
  let allCategories = [];

  // ====== SMALL HELPERS ======
  function clearGallery() { if (galleryEl) galleryEl.innerHTML = ''; }
  function clearFilters() { if (filtersEl) filtersEl.innerHTML = ''; }
  function clearAll() { clearGallery(); clearFilters(); }

  // Toggle Login/Logout and Edit button based on token in localStorage
  function showEditIfLoggedIn() {
    const token = localStorage.getItem('token');
    if (editBtn) editBtn.style.display = token ? 'inline-block' : 'none';
  }
  function updateAuthLinks() {
    const token = localStorage.getItem('token');
    if (loginLink)  loginLink.style.display  = token ? 'none'  : 'inline';
    if (logoutLink) logoutLink.style.display = token ? 'inline': 'none';
    showEditIfLoggedIn();
  }

  // ====== API CALLS ======
  async function fetchWorks() {
    const res = await fetch(`${API_BASE}/works`);
    if (!res.ok) throw new Error('GET /works failed: ' + res.status);
    return res.json();
  }
  async function fetchCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('GET /categories failed: ' + res.status);
    return res.json();
  }

  // ====== RENDER GALLERY ======
  function createFigureFromWork(work) {
    const figure = document.createElement('figure');

    const img = document.createElement('img');
    img.src = work.imageUrl;
    img.alt = work.title || 'Project';

    const cap = document.createElement('figcaption');
    cap.textContent = work.title || 'Untitled';

    figure.appendChild(img);
    figure.appendChild(cap);
    return figure;
  }

  function showWorks(worksArray) {
    clearGallery();

    if (!Array.isArray(worksArray) || worksArray.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No projects to display.';
      galleryEl.appendChild(p);
      return;
    }

    for (let i = 0; i < worksArray.length; i++) {
      galleryEl.appendChild(createFigureFromWork(worksArray[i]));
    }
  }

  // ====== FILTERS ======
  function setActiveFilterButton(button) {
    const allButtons = filtersEl.querySelectorAll('button');
    allButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  }

  function buildFilters(categories) {
    clearFilters();

    // "All" button
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'All';
    allBtn.classList.add('active');
    allBtn.addEventListener('click', () => {
      setActiveFilterButton(allBtn);
      showWorks(allWorks);
    });
    filtersEl.appendChild(allBtn);

    // Category buttons
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = category.name;
      btn.addEventListener('click', () => {
        setActiveFilterButton(btn);
        const filtered = allWorks.filter(w => w.categoryId === category.id);
        showWorks(filtered);
      });
      filtersEl.appendChild(btn);
    }
  }

  // ====== MODAL: BASIC OPEN/CLOSE ======
  function showPlaceholder() {
    if (uploadPlaceholder) uploadPlaceholder.hidden = false;
    if (previewWrap) previewWrap.hidden = true;
    if (previewImg)  previewImg.src = '';
  }
  function resetModalForm() {
    if (modalForm) modalForm.reset();
    showPlaceholder();
    if (modalErrorEl) { modalErrorEl.style.display = 'none'; modalErrorEl.textContent = ''; }
    enableSubmitIfValid();
  }
  function openModal() {
    if (!modalEl) return;
    resetModalForm();
    populateCategorySelect();          // uses allCategories (same source as filters)
    modalEl.removeAttribute('hidden');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    if (!modalEl) return;
    modalEl.setAttribute('hidden', '');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetModalForm();
  }

  // Open only if logged in
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!localStorage.getItem('token')) return;
      openModal();
    });
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }
  if (modalEl) {
    // click backdrop to close (only if click is exactly the overlay)
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && !modalEl.hasAttribute('hidden')) closeModal();
  });

  // ====== MODAL: CATEGORY SELECT (from same categories used for filters) ======
  function populateCategorySelect() {
    if (!categorySelect) return;
    // keep placeholder
    categorySelect.innerHTML = '<option value="">Select a category…</option>';
    for (let i = 0; i < allCategories.length; i++) {
      const c = allCategories[i];
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    }
  }

  // ====== MODAL: IMAGE PREVIEW + FORM GUARD ======
  function enableSubmitIfValid() {
    const hasFile  = imageInput && imageInput.files && imageInput.files[0];
    const hasTitle = titleInput && titleInput.value.trim().length > 0;
    const hasCat   = categorySelect && categorySelect.value !== '';
    if (submitBtn) submitBtn.disabled = !(hasFile && hasTitle && hasCat);
  }

  if (imageInput) {
    imageInput.addEventListener('change', function () {
      if (!modalErrorEl) return;
      modalErrorEl.style.display = 'none';
      modalErrorEl.textContent = '';

      const file = imageInput.files && imageInput.files[0];
      if (!file) {
        showPlaceholder();
        enableSubmitIfValid();
        return;
      }

      // 4 MB max per brief
      if (file.size > 4 * 1024 * 1024) {
        modalErrorEl.textContent = 'File is too large (max 4 MB).';
        modalErrorEl.style.display = 'block';
        imageInput.value = '';
        showPlaceholder();
        enableSubmitIfValid();
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (previewImg) previewImg.src = ev.target.result;
        if (uploadPlaceholder) uploadPlaceholder.hidden = true;
        if (previewWrap) previewWrap.hidden = false;
        enableSubmitIfValid();
      };
      reader.readAsDataURL(file);
    });
  }
  if (titleInput)     titleInput.addEventListener('input',  enableSubmitIfValid);
  if (categorySelect) categorySelect.addEventListener('change', enableSubmitIfValid);

  // ====== AUTH LINK BEHAVIOUR ======
  updateAuthLinks(); // run once after DOM is ready

  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('role'); // optional, if you set it
      updateAuthLinks();               // hides Edit + shows Login
      window.location.href = 'index.html';
    });
  }

  // ====== INITIAL LOAD ======
  async function init() {
    try {
      clearAll();
      allWorks = await fetchWorks();
      allCategories = await fetchCategories();
      showWorks(allWorks);
      buildFilters(allCategories);
      console.log('Init done:', { works: allWorks.length, categories: allCategories.length });
    } catch (err) {
      console.error('Init failed:', err);
      if (galleryEl) galleryEl.textContent = 'Failed to load projects.';
    }
  }

  init();
});