/* De versie in de voet van de voorpagina: de bovenste in js/changelog-data.js, dezelfde die
   changelog.html "nu live" noemt. Staat daar niets, dan blijft het label weg. */
(function(){
'use strict';
var last = (window.CHANGELOG || [])[0];
if(!last) return;
Array.prototype.forEach.call(document.querySelectorAll('.js-ver'), function(a){
  a.textContent = 'v' + last.version;
  a.hidden = false;
});
})();
