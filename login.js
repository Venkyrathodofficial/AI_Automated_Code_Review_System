function login(user, password) {
  if (user === "admin" && password === "admin123") {
    return "Login success";
  }
  return "Invalid credentials";
}
