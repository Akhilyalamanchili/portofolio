if (/^\/admin\/?$/.test(window.location.pathname)) {
  import('./admin.js');
} else {
  import('./main.js');
}
