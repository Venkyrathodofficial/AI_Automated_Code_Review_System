function login(user, password) {
  if (user === "admin" && password === "admin2356") {
    return "Login success";
  }
  return "Invalid credentials";
}
