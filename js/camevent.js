/* Gebeurtenisbalk onder de camera.
   Bij een follow/sub/cheer/tip/raid schuift er een ribbon omhoog over het
   naamplaatje, houdt een paar seconden aan en zakt weer weg. Eén tegelijk,
   netjes achter elkaar. */
(function(){
'use strict';
var U = window.U;

function mount(host, opts){
  opts = opts || {};
  var HOLD  = opts.hold || 4600;
  var size  = opts.size || null;

  var box = U.el('div','camev');
  host.appendChild(box);

  var queue = [], busy = false;

  function render(e){
    box.innerHTML = '';
    box.appendChild(window.Ribbon.make(e.kind, e.word, e.who +
      (e.extra ? '  ·  ' + e.extra : ''), size));
    void box.offsetWidth;
    box.classList.add('on');
    host.classList.add('busy');

    setTimeout(function(){
      box.classList.remove('on');
      host.classList.remove('busy');
      setTimeout(function(){ busy = false; next(); }, 420);
    }, HOLD);
  }

  function next(){
    if(busy || !queue.length) return;
    busy = true;
    render(queue.shift());
  }

  return {
    push: function(e){
      queue.push(e);
      if(queue.length > 8) queue.shift();   // bij een giftbom niet oneindig stapelen
      next();
    }
  };
}

window.CamEvent = { mount:mount };
})();
