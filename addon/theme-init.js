/**
 * Applies the user's saved theme (System/Light/Dark) to <html> as early as
 * possible, before the page's CSS is first painted, to avoid a flash of the
 * wrong theme. Deliberately a plain classic script (not type="module"), so it
 * runs synchronously the moment the parser reaches it in <head> - <html> already
 * exists at that point even though <body> does not.
 *
 * This only decides *which* slds-color-scheme--* class is present; the actual
 * colors come from the light-dark() based SLDS tokens in styles/slds/slds.css,
 * which key off that class (see the .slds-color-scheme--* rules at the end of
 * that file). Keep the storage key ("themeMode") and legacy key
 * ("popupDarkTheme") in sync with Constants.THEME_MODE / THEME_MODE_LEGACY in
 * utils.js if either ever changes.
 *
 * Also listens for localStorage changes so that switching the theme from one
 * extension page (e.g. the popup) is reflected live on any other extension
 * page/tab that happens to be open at the same time (e.g. the Options tab).
 */
(function () {
  var THEME_MODE_KEY = "themeMode";
  var THEME_MODE_LEGACY_KEY = "popupDarkTheme";
  var THEME_MODES = ["system", "light", "dark"];

  function readMode() {
    try {
      var mode = localStorage.getItem(THEME_MODE_KEY);
      if (mode === null) {
        var legacy = localStorage.getItem(THEME_MODE_LEGACY_KEY);
        mode = legacy === "true" ? "dark" : "system";
        localStorage.setItem(THEME_MODE_KEY, mode);
        localStorage.removeItem(THEME_MODE_LEGACY_KEY);
      }
      if (THEME_MODES.indexOf(mode) === -1) {
        try {
          mode = JSON.parse(mode);
        } catch (parseErr) {
          // ignore, falls back to "system" below
        }
      }
      return THEME_MODES.indexOf(mode) !== -1 ? mode : "system";
    } catch (e) {
      // localStorage may be unavailable (e.g. disabled cookies); default to system.
      return "system";
    }
  }

  function apply(mode) {
    var root = document.documentElement;
    for (var i = 0; i < THEME_MODES.length; i++) {
      root.classList.remove("slds-color-scheme--" + THEME_MODES[i]);
    }
    root.classList.add("slds-color-scheme--" + mode);
  }

  apply(readMode());

  window.addEventListener("storage", function (e) {
    if (e.key === THEME_MODE_KEY || e.key === null) {
      apply(readMode());
    }
  });
})();
