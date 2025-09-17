// assets/login.js
console.log('login.js loaded');

const API_BASE = 'http://127.0.0.1:5678/api';
const form = document.getElementById('login-form');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const errorEl = document.getElementById('login-error');
const loginbutton = document.getElementById('submit-button');

loginbutton.addEventListener('click', async (e) => {
  e.preventDefault();
  errorEl.style.display = 'none';


  const email = emailEl.value.trim();
  const password = passwordEl.value;

  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // If error 
    if (!res.ok) {
      errorEl.textContent = 'Invalid email or password.';
      errorEl.style.display = 'block';
      return;
    }

    const data = await res.json(); 
localStorage.setItem('token', data.token);
window.location.href = 'index.html';

    // Admin?
    if (data.isAdmin) {
      localStorage.setItem('role', 'admin');
    } else {
      localStorage.setItem('role', 'user');
    }

    // Redirect to home
    window.location.href = 'index.html';

  } catch (err) {
    console.error('Error during login:', err);
    errorEl.textContent = 'Something went wrong. Please try again later.';
    errorEl.style.display = 'block';
  }
});