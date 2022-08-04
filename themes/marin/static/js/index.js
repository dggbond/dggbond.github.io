function toggleTheme () {
  if (document.body.classList.contains('theme-light')) {
    document.body.classList.replace('theme-light', 'theme-dark')
  } else {
    document.body.classList.replace('theme-dark', 'theme-light')
  }
}
