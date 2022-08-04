const THEME_STORAGE_KEY = "theme"

function toggleCSS(el, firstCSS, secondCSS = "") {
  if (el.classList.contains(firstCSS)) {
    el.classList.replace(firstCSS, secondCSS)
  } else {
    el.classList.remove(secondCSS)
    el.classList.add(firstCSS)
  }
}

let theme = "light"
function toggleTheme () {
  theme = theme == "light" ? "dark" : "light"

  const icon = document.querySelector('#theme-toggle i')

  toggleCSS(document.body, "theme-light", "theme-dark")
  toggleCSS(icon, "fa-moon-o", "fa-sun-o")

  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

function initTheme() {
  if (localStorage.getItem(THEME_STORAGE_KEY) == "dark") {
    toggleTheme()
  }
}
initTheme()
