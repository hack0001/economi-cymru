/* Applies the saved colour scheme before the page paints, and builds the temporary picker. */
(function () {
  var KEY = 'wee-theme', THEMES = [['forest', '#0e5c4a', 'Forest green'], ['navy', '#1f4e79', 'Navy and gold'], ['welsh', '#b3122b', 'Slate and Welsh red'], ['teal', '#0e6b73', 'Ink and teal']];
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved && saved !== 'forest') document.documentElement.setAttribute('data-theme', saved);
  document.addEventListener('DOMContentLoaded', function () {
    var cy = document.documentElement.lang.indexOf('cy') === 0;
    var box = document.createElement('div'); box.className = 'theme-pick'; box.setAttribute('role', 'group');
    box.setAttribute('aria-label', cy ? 'Cynllun lliw' : 'Colour scheme');
    box.appendChild(document.createTextNode(cy ? 'Lliwiau' : 'Colours'));
    var cur = document.documentElement.getAttribute('data-theme') || 'forest';
    THEMES.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.title = t[2]; b.setAttribute('aria-label', t[2]);
      b.style.background = t[1]; b.setAttribute('aria-pressed', t[0] === cur);
      b.addEventListener('click', function () {
        if (t[0] === 'forest') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t[0]);
        try { localStorage.setItem(KEY, t[0]); } catch (e) {}
        box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        document.dispatchEvent(new CustomEvent('themechange'));
      });
      box.appendChild(b);
    });
    document.body.appendChild(box);
  });
})();
