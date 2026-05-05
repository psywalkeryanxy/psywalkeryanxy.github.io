// GoatCounter view counter for xinyuanyan.goatcounter.com
(function () {
  var GC_CODE = 'xinyuanyan';

  function loadViewCount() {
    var path = location.pathname || '/';
    var url = 'https://' + GC_CODE + '.goatcounter.com/counter/'
              + encodeURIComponent(path) + '.json';

    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var count = data && (data.count_unique || data.count) || '0';
        var n = parseInt(String(count).replace(/,/g, ''), 10) || 0;
        document.querySelectorAll('.gcvc-views-p').forEach(function (el) {
          el.textContent = n.toLocaleString();
        });
      })
      .catch(function () {
        document.querySelectorAll('.gcvc-views-p').forEach(function (el) {
          el.textContent = '—';
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadViewCount);
  } else {
    loadViewCount();
  }
})();