function renderProfile(user) {
  const container = document.getElementById('profile');
  // Vulnerable to XSS
  container.innerHTML = "<h1>Welcome " + user.name + "</h1>";
}
