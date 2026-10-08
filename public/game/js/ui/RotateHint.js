// Phones play in landscape only. On a phone held upright a full-screen
// prompt asks the player to rotate; tablets and laptops are unaffected.
(function(){
  if (typeof document === 'undefined' || document.getElementById('ws-rotate-hint')) return;
  var css = document.createElement('style');
  css.textContent =
    '#ws-rotate-hint{display:none;position:fixed;inset:0;z-index:99999;background:#fffbf1;color:#173b40;' +
    'flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;font-family:"DM Sans",Arial,sans-serif}' +
    '#ws-rotate-hint .ph{width:56px;height:92px;border:4px solid #296b72;border-radius:12px;margin-bottom:22px;animation:wsRot 2.4s ease-in-out infinite}' +
    '#ws-rotate-hint b{font:700 22px "Space Grotesk",sans-serif;margin-bottom:8px}' +
    '@keyframes wsRot{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}' +
    '@media (orientation:portrait) and (max-width:820px) and (pointer:coarse){#ws-rotate-hint{display:flex}}';
  document.head.appendChild(css);
  var el = document.createElement('div');
  el.id = 'ws-rotate-hint';
  var de = (typeof window.currentLang !== 'undefined' && window.currentLang === 'de');
  el.innerHTML = '<div class="ph"></div><b>' + (de ? 'Bitte Gerät drehen' : 'Please rotate your device') + '</b><span>' +
    (de ? 'WealthSim wird auf dem Handy im Querformat gespielt.' : 'WealthSim is played in landscape on phones.') + '</span>';
  (document.body || document.documentElement).appendChild(el);
  // Where the browser allows it (installed / full-screen), lock landscape.
  try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function(){}); } catch(e) {}
})();
