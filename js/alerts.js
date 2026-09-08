/* Alert-wachtrij. Eén tegelijk, netjes achter elkaar.
   Zet StreamElements' eigen alert-overlay uit als je deze gebruikt,
   anders krijg je alles dubbel. */
(function(){
'use strict';
var U = window.U, CFG = U.CFG;
var TEST = /[?&]test=1/.test(location.search);

(function(){
  var stage = document.getElementById('stage');
  var dw = CFG.designWidth || 2560;
  stage.style.width  = dw + 'px';
  stage.style.height = (CFG.alertHeight || 1072) + 'px';
  stage.style.transform = 'scale(' + ((CFG.outputWidth || dw) / dw) + ')';
})();

var SKIN = {
  follow:{ label:'nieuwe volger', acc:'var(--jade)',  glyph:'plus'  },
  sub   :{ label:'subscriber',    acc:'var(--holy)',  glyph:'star'  },
  cheer :{ label:'bits',          acc:'var(--gold)',  glyph:'gem'   },
  tip   :{ label:'tip',           acc:'var(--gold)',  glyph:'gem'   },
  raid  :{ label:'raid',          acc:'var(--jade)',  glyph:'raid'  }
};

var GLYPH = {
  plus:'<path d="M14 4v20M4 14h20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
  star:'<path d="M14 3l3.2 7.2 7.8.8-5.9 5.2 1.7 7.7L14 20l-6.8 3.9 1.7-7.7L3 11l7.8-.8z" fill="currentColor"/>',
  gem :'<path d="M14 3l9 8-9 14-9-14z" fill="currentColor"/>',
  raid:'<path d="M5 7l7 7-7 7M15 7l7 7-7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
};

var HOLD  = 5200;
var box   = document.getElementById('alertHost');
var queue = [], busy = false;

function render(e){
  var skin = SKIN[e.kind] || SKIN.follow;

  var node = U.el('div','alert');
  node.style.setProperty('--acc', skin.acc);

  node.innerHTML =
    '<div class="alert__ring">'+
      '<svg viewBox="0 0 72 72"><circle class="track" cx="36" cy="36" r="33"/>'+
      '<circle class="draw" cx="36" cy="36" r="33"/></svg>'+
      '<div class="alert__glyph"><svg viewBox="0 0 28 28">'+GLYPH[skin.glyph]+'</svg></div>'+
    '</div>'+
    '<div class="alert__txt">'+
      '<div class="alert__kind">'+U.esc(skin.label)+'</div>'+
      '<div class="alert__who">'+U.esc(e.who)+'</div>'+
      '<div class="alert__extra">'+U.esc(e.extra||'')+'</div>'+
      '<div class="alert__msg">'+U.esc(e.message||'')+'</div>'+
    '</div>';

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
  if(queue.length > 12) queue.shift();   // bij een gift-bom niet oneindig opstapelen
  next();
}

window.SE.start(push);

/* alerts.html?test=1 -- loopt door alle types zodat je kan uitlijnen */
if(TEST){
  var demo = [
    {kind:'follow', who:'joesswow',   extra:''},
    {kind:'sub',    who:'vassham',    extra:'T2 \u00b7 14 mnd', message:'blijf lekker pushen die keys'},
    {kind:'cheer',  who:'TheNoremac', extra:'184 bits'},
    {kind:'raid',   who:'Amphroxia',  extra:'42 kijkers'},
    {kind:'tip',    who:'xxmaebeexx', extra:'EUR 5'}
  ];
  var i = 0;
  (function loop(){
    push(demo[i++ % demo.length]);
    setTimeout(loop, 6500);
  })();
}
})();
