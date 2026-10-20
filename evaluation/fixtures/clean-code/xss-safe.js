function renderProfile(user) {
  const container = document.getElementById('profile');
  // Safe - uses textContent
  container.textContent = "Welcome " + user.name;
}
