// app.js

document.addEventListener('DOMContentLoaded', () => {


  // ====== DOM REFERENCES ======
  // Gallery + filters
  const galleryEl      = document.querySelector('.gallery');
  const filtersEl      = document.getElementById('filters');

// User inputs
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

  const backBtn        = document.getElementById('modal-back');
  const galleryScreen  = document.getElementById('modal-gallery');
  const thumbsWrap     = document.getElementById('thumbs');
  const openAddBtn     = document.getElementById('open-add-photo');
  const addScreen      = document.getElementById('modal-add');

  const loginLink      = document.getElementById('login-link');
  const logoutLink     = document.getElementById('logout-link');

  // ====
  let allWorks = [];
  let allCategories = [];

  // ====
  function clearGallery() { if (galleryEl) galleryEl.innerHTML = ''; }
  function clearFilters() { if (filtersEl) filtersEl.innerHTML = ''; }
  function clearAll() { clearGallery(); clearFilters(); }

  // Login/Logout, Edit button, and Filters
  function updateAuthLinks() {
    const token = localStorage.getItem('token');

    if (loginLink)  loginLink.style.display  = token ? 'none'  : 'inline';
    if (logoutLink) logoutLink.style.display = token ? 'inline': 'none';
    if (editBtn)    editBtn.style.display    = token ? 'inline-block' : 'none';
    if (filtersEl)  filtersEl.style.display  = token ? 'none' : 'flex';
  }

  // ====== API CALLS ======
async function fetchWorks() {
  try {
    const res = await fetch(`${API_BASE}/works`);
    if (!res.ok) {
      throw new Error('GET /works failed: ' + res.status);
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching works:', err);
    return [];
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) {
      throw new Error('GET /categories failed: ' + res.status);
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

  // ====== GALLERY ======

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

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'All';
    allBtn.classList.add('active');
    allBtn.addEventListener('click', () => {
      setActiveFilterButton(allBtn);
      showWorks(allWorks);
    });
    filtersEl.appendChild(allBtn);

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

  // ====== MODAL ======
  function showGalleryScreen() {
    if (galleryScreen) galleryScreen.hidden = false;
    if (addScreen)     addScreen.hidden     = true;
    buildThumbs();
  }
  function showAddPhotoScreen() {
    if (galleryScreen) galleryScreen.hidden = true;
    if (addScreen)     addScreen.hidden     = false;
  }

  function showPlaceholder() {
    if (uploadPlaceholder) uploadPlaceholder.hidden = false;
    if (previewWrap)       previewWrap.hidden = true;
    if (previewImg)        previewImg.src = '';
  }
  function resetModalForm() {
    if (modalForm) modalForm.reset();
    showPlaceholder();
    if (modalErrorEl) { modalErrorEl.style.display = 'none'; modalErrorEl.textContent = ''; }
    enableSubmitIfValid();
  }

  function openModal() {
    if (!modalEl) return;
    showGalleryScreen();
    resetModalForm();
    populateCategorySelect();
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
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && !modalEl.hasAttribute('hidden')) closeModal();
  });

  // ====== CATEGORY SELECT ======
  function populateCategorySelect() {
    if (!categorySelect) return;
    categorySelect.innerHTML = '<option value="">Select a category…</option>';
    for (let i = 0; i < allCategories.length; i++) {
      const c = allCategories[i];
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name;
      categorySelect.appendChild(opt);
    }
  }

  // ====== IMAGE PREVIEW + FORM GUARD ======
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
        if (previewWrap)       previewWrap.hidden = false;
        enableSubmitIfValid();
      };
      reader.readAsDataURL(file);
    });
  }
  if (titleInput)     titleInput.addEventListener('input',  enableSubmitIfValid);
  if (categorySelect) categorySelect.addEventListener('change', enableSubmitIfValid);

  // ====== SCREEN SWITCHING ======
  if (openAddBtn) {
    openAddBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showAddPhotoScreen();
    });
  }
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showGalleryScreen();
    });
  }

  // ====== THUMBNAILS + DELETE ======
  function buildThumbs() {
    if (!thumbsWrap) return;
    thumbsWrap.innerHTML = '';

    if (!Array.isArray(allWorks) || allWorks.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No photos yet.';
      p.style.textAlign = 'center';
      p.style.color = '#6b7280';
      thumbsWrap.appendChild(p);
      return;
    }

    for (let i = 0; i < allWorks.length; i++) {
      const w = allWorks[i];
      const fig = document.createElement('figure');

      const img = document.createElement('img');
      img.src = w.imageUrl;
      img.alt = w.title || 'Photo';
      fig.appendChild(img);

      const delBtn = document.createElement('button');
      delBtn.className = 'thumb-delete';
      delBtn.type = 'button';
      delBtn.textContent = '×';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', () => deleteWork(w.id));
      fig.appendChild(delBtn);

      thumbsWrap.appendChild(fig);
    }
  }

  async function deleteWork(id) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/works/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert('Delete failed.');
        return;
      }

      allWorks = await fetchWorks();
      showWorks(allWorks);
      buildThumbs();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  // ====== ADD PHOTO SUBMIT ======
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      if (!token) return;

      if (!imageInput.files[0]) return;

      const fd = new FormData();
      fd.append('image', imageInput.files[0]);
      fd.append('title', titleInput.value.trim());
      fd.append('category', categorySelect.value);

      try {
        const res = await fetch(`${API_BASE}/works`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (!res.ok) {
          if (modalErrorEl) {
            modalErrorEl.textContent = 'Upload failed. Please check your inputs.';
            modalErrorEl.style.display = 'block';
          }
          return;
        }

        await res.json();
        allWorks = await fetchWorks();
        showWorks(allWorks);
        buildThumbs();

        resetModalForm();
        showGalleryScreen();
      } catch (err) {
        console.error('Upload error:', err);
        if (modalErrorEl) {
          modalErrorEl.textContent = 'Something went wrong. Try again.';
          modalErrorEl.style.display = 'block';
        }
      }
    });
  }

  // ====== AUTH ======
  updateAuthLinks();

  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      updateAuthLinks();
      window.location.href = 'index.html';
    });
  }

  // ====== INIT ======
  async function init() {
    try {
      clearAll();
      allWorks = await fetchWorks();
      allCategories = await fetchCategories();
      showWorks(allWorks);
      buildFilters(allCategories);
      buildThumbs();
      console.log('Init done:', { works: allWorks.length, categories: allCategories.length });
    } catch (err) {
      console.error('Init failed:', err);
      if (galleryEl) galleryEl.textContent = 'Failed to load projects.';
    }
  }

  init();
});