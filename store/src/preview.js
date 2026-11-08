// Store screenshots only (never shipped): opens a view based on the URL hash.
window.addEventListener('load', function () {
  setTimeout(function () {
    var h = location.hash;
    if (h === '#rules') document.querySelector('#switcher [data-view="rules"]').click();
    if (h === '#settings') document.getElementById('open-settings').click();
    if (h === '#detail') {
      var cell = document.querySelector('#grid-wrap rect[data-i="' + (18 * 52 + 21) + '"]');
      var r = cell.getBoundingClientRect();
      cell.style.fill = '#525252';
      cell.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
    }
    if (document.activeElement) document.activeElement.blur();
  }, 300);
});
