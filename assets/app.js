(function(){
  var v=document.getElementById('viewer'); if(!v) return;
  var links=[].slice.call(document.querySelectorAll('a.thumb.js-view'));
  var img=document.getElementById('vimg'),t=document.getElementById('vtitle'),dl=document.getElementById('vdl');
  var cur=0,lastFocus=null;
  function show(i){cur=(i+links.length)%links.length;var a=links[cur];
    img.src=a.getAttribute('href');img.alt=a.dataset.title;t.textContent=a.dataset.title;dl.href=a.dataset.pdf;
    v.querySelector('.vimg').scrollTop=0;}
  function open(i,noPush){lastFocus=document.activeElement;show(i);v.hidden=false;document.body.style.overflow='hidden';
    document.getElementById('vclose').focus();if(!noPush&&history.pushState)history.pushState({v:1},'');}
  function close(fromPop){if(v.hidden)return;v.hidden=true;document.body.style.overflow='';img.removeAttribute('src');
    if(lastFocus)lastFocus.focus();if(!fromPop&&history.state&&history.state.v)history.back();}
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.js-view');if(!a)return;
    e.preventDefault();var h=a.getAttribute('href');for(var i=0;i<links.length;i++)if(links[i].getAttribute('href')===h){open(i);return;}});
  document.getElementById('vclose').onclick=function(){close()};
  document.getElementById('vprev').onclick=function(){show(cur-1)};
  document.getElementById('vnext').onclick=function(){show(cur+1)};
  window.addEventListener('popstate',function(){close(true)});
  document.addEventListener('keydown',function(e){if(v.hidden)return;
    if(e.key==='Escape')close();else if(e.key==='ArrowLeft')show(cur-1);else if(e.key==='ArrowRight')show(cur+1);});
  var sx=null,sy=null;
  v.addEventListener('touchstart',function(e){if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY}else sx=null},{passive:true});
  v.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)show(cur+(dx<0?1:-1));sx=null},{passive:true});
  var m=location.hash.match(/^#so-(\d+)$/);if(m){var k=parseInt(m[1],10)-1;if(k>=0&&k<links.length)open(k,true);}
})();
