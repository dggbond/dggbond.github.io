const THEME_STORAGE_KEY = "theme"

function loadGithubMarkdownCSS(theme) {
  const id = "github-markdown-css"
  const href = `https://cdn.jsdelivr.net/npm/github-markdown-css@5.1.0/github-markdown-${theme}.css`

  const existLink = document.querySelector(`#${id}`)

  if (existLink) {
    existLink.href = href
    return
  }

  const link  = document.createElement('link');
  link.id = id
  link.rel  = 'stylesheet';
  link.type = 'text/css';
  link.href = href
  document.head.appendChild(link);
}

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
  loadGithubMarkdownCSS(theme)

  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

function initTheme() {
  if (localStorage.getItem(THEME_STORAGE_KEY) == "dark") {
    toggleTheme()
  }
  loadGithubMarkdownCSS(theme)

  // set transition for theme change
  const style = document.createElement('style')
  document.head.appendChild(style)

  // style will effect immediately without settimeout
  setTimeout(() => {
    style.sheet.insertRule(`* {
      transition-property: color, background-color, border;
      transition-duration: 0.15s;
      transition-timing-function: ease-out;
    }`, 0);
  })
}
initTheme()
