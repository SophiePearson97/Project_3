console.log("Login JS loaded");

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault(); // stop page refresh
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  console.log("Submitted:", email, password);
  // later you’ll send this to your backend with fetch()
});