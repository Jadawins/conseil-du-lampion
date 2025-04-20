document.addEventListener("DOMContentLoaded", () => {
  const lanterneBtn = document.getElementById("theme-toggle");
  const lanterneIcon = document.getElementById("lanterne-icon");

  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.setAttribute("data-theme", savedTheme);
  if (lanterneIcon) {
    lanterneIcon.src = savedTheme === "light"
      ? "assets/img/sombre.png"
      : "assets/img/lumiere.png";
  }

  lanterneBtn.addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    lanterneIcon.src = newTheme === "light"
  ? "assets/img/sombre.png"
  : "assets/img/lumiere.png";
  });
});
