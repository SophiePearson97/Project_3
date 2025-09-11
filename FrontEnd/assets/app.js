
console.log('app.js loaded');
document.addEventListener('DOMContentLoaded', () => console.log('DOM ready'));
const API_BASE = 'http://localhost:5678/api';

// Select DOM elements
const galleryEl = document.querySelector('.gallery');
const filtersEl = document.getElementById('filters');

// Global storage for works
let allWorks = [];

// --- CLEAR FUNCTIONS ---
function clearGallery() {
  galleryEl.innerHTML = '';
}

function clearFilters() {
  filtersEl.innerHTML = '';
}

function clearAll() {
  clearGallery();
  clearFilters();
}

// --- FETCH DATA ---
async function fetchWorks() {
  const response = await fetch('http://localhost:5678/api/works');
  return await response.json();
}

async function fetchCategories() {
  const response = await fetch('http://localhost:5678/api/categories');
  return await response.json();
}

// --- RENDER GALLERY ---
function createFigureFromWork(work) {
  const figure = document.createElement('figure');

  const img = document.createElement('img');
  img.src = work.imageUrl;
  img.alt = work.title || 'Project';

  const caption = document.createElement('figcaption');
  caption.textContent = work.title || 'Untitled';

  figure.appendChild(img);
  figure.appendChild(caption);
  return figure;
}

function showWorks(worksArray) {
  clearGallery();

  if (worksArray.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No projects to display.';
    galleryEl.appendChild(p);
    return;
  }

  for (let i = 0; i < worksArray.length; i++) {
    const work = worksArray[i];
    const figure = createFigureFromWork(work);
    galleryEl.appendChild(figure);
  }
}

// --- RENDER FILTERS ---
function setActiveFilterButton(button) {
  const allButtons = filtersEl.querySelectorAll('button');
  allButtons.forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

function buildFilters(categories) {
  clearFilters();

  // "All" button
  let allBtn = document.createElement('button');
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
    let category = categories[i];
    let btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = category.name;
    btn.addEventListener('click', () => {
      setActiveFilterButton(btn);
      let filtered = allWorks.filter(work => work.categoryId === category.id);
      showWorks(filtered);
    });
    filtersEl.appendChild(btn);
  }
}

// --- INIT APP ---
async function init() {
  clearAll(); 

  // Load data
  allWorks = await fetchWorks();
  const categories = await fetchCategories();

  // Render
  showWorks(allWorks);
  buildFilters(categories);
}

init();