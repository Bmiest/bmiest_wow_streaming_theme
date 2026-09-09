/* Alert-wachtrij. Eén tegelijk, netjes achter elkaar.
   Zet StreamElements' eigen alert-overlay uit als je deze gebruikt,
   anders krijg je alles dubbel. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG, R = window.Ribbon;
var TEST = /[?&]test=1/.test(location.search);

(function(){
  var stage = document.getElementById('stage');
  var dw = CFG.designWidth || 2560;
  stage.style.width  = dw + 'px';
  stage.style.height = (CFG.alertHeight || 1072) + 'px';
  stage.style.transform = 'scale(' + ((CFG.outputWidth || dw) / dw) + ')';
})();

var LABEL = {
  follow:'new follower', sub:'subscriber', cheer:'bits',
  tip:'tip', raid:'raid'
};

var HOLD  = 5200;
var box   = document.getElementById('alertHost');
var queue = [], busy = false;

function render(e){
  var node = U.el('div','alert');
  node.style.setProperty('--acc', R.TINT[e.kind] || R.TINT.follow);

  node.appendChild(R.make(e.kind, LABEL[e.kind] || e.kind, e.who));
  if(e.extra)   node.appendChild(U.el('div','alert__meta', e.extra));
  if(e.message) node.appendChild(U.el('div','alert__msg',  e.message));

  box.appendChild(node);
  void node.offsetWidth;
  node.classList.add('in');

  setTimeout(function(){
    node.classList.remove('in');
    node.classList.add('out');
    setTimeout(function(){
      if(node.parentNode) node.parentNode.removeChild(node);
      busy = false;
      next();
    }, 320);
  }, HOLD);
}

function next(){
  if(busy || !queue.length) return;
  busy = true;
  render(queue.shift());
}

function push(e){
  queue.push(e);
  if(queue.length > 12) queue.shift();   // bij een giftbom niet oneindig stapelen
  next();
}

window.SE.start(push);

/* alerts.html?test=1 -- loopt door alle types zodat je kan uitlijnen */
if(TEST){
  var demo = [
    {kind:'follow', who:'joesswow'},
    {kind:'sub',    who:'vassham',    extra:'T2 · 14 mo',
     message:'blijf lekker pushen die keys, we kijken mee'},
    {kind:'cheer',  who:'TheNoremac', extra:'184 bits'},
    {kind:'raid',   who:'Amphroxia',  extra:'42 viewers'},
    {kind:'tip',    who:'xxmaebeexx', extra:'EUR 5,00', message:'voor de guildbank'}
  ];
  var i = 0;
  (function loop(){
    push(demo[i++ % demo.length]);
    setTimeout(loop, 6400);
  })();
}
})();
