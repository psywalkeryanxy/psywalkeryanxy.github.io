// busuanzi pageview counter
// Loads the busuanzi script and writes the per-page count into .gcvc-views-p
(function () {
  // Load busuanzi
  var s = document.createElement('script');
  s.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  s.async = true;
  document.head.appendChild(s);

  // busuanzi writes the count into elements with id="busuanzi_value_page_pv".
  // We mirror that value into all .gcvc-views-p elements once it appears.
  function mirror() {
    var src = document.getElementById('busuanzi_value_page_pv');
    if (!src) return false;
    var v = (src.textContent || '').trim();
    if (!v) return false;
    document.querySelectorAll('.gcvc-views-p').forEach(function (el) {
      el.textContent = v;
    });
    return true;
  }

  // Poll until busuanzi finishes (up to ~10s), then stop.
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (mirror() || tries > 50) clearInterval(iv);
  }, 200);
})();