/* Lưu dữ liệu trong trình duyệt (localStorage). Không gửi đi đâu cả. */
window.PBT_STORE=(function(){
  var P='pbt1:',ok=true;
  try{localStorage.setItem(P+'t','1');localStorage.removeItem(P+'t')}catch(e){ok=false}
  function get(k){if(!ok)return null;try{var v=localStorage.getItem(P+k);return v?JSON.parse(v):null}catch(e){return null}}
  function set(k,v){if(!ok)return false;try{localStorage.setItem(P+k,JSON.stringify(v));return true}catch(e){return false}}
  function del(k){if(ok)try{localStorage.removeItem(P+k)}catch(e){}}
  function sk(b,s){return b+':'+s}
  return {
    ok:ok,
    getState:function(b,s){return get('state:'+sk(b,s))},
    setState:function(b,s,v){return set('state:'+sk(b,s),v)},
    clearState:function(b,s){del('state:'+sk(b,s))},
    hist:function(b,s){return get('hist:'+sk(b,s))||[]},
    addHist:function(b,s,e){var h=this.hist(b,s);h.push(e);if(h.length>100)h=h.slice(-100);set('hist:'+sk(b,s),h)},
    getName:function(){return get('name')||''},
    setName:function(n){n?set('name',n):del('name')},
    stars:function(score,total){if(!total)return 1;return score===total?3:(score/total>=0.7?2:1)},
    best:function(b,s){var h=this.hist(b,s),best=null;h.forEach(function(e){if(!best||e.score/e.total>best.score/best.total||(e.score/e.total===best.score/best.total&&e.at>best.at))best=e});return best},
    clearAll:function(){if(!ok)return;var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(P)===0)ks.push(k)}ks.forEach(function(k){localStorage.removeItem(k)})},
    fmt:function(at){try{return new Date(at).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'})}catch(e){return new Date(at).toLocaleString()}}
  };
})();
/* Huy hiệu trên thẻ phiếu và tiến độ ở trang chủ */
(function(){
  var S=window.PBT_STORE;
  function starStr(n){return '⭐'.repeat(n)}
  [].forEach.call(document.querySelectorAll('.status[data-bo]'),function(el){
    var b=el.dataset.bo,s=el.dataset.so,best=S.best(b,s),st=S.getState(b,s);
    if(best){el.className='status st-done';el.textContent=starStr(S.stars(best.score,best.total))+' '+best.score+'/'+best.total;
      el.setAttribute('aria-label','Đã làm, điểm cao nhất '+best.score+' trên '+best.total)}
    else if(st&&st.a&&Object.keys(st.a).length){el.className='status st-doing';el.textContent='✏️ Đang làm'}
    else{el.className='status st-new';el.textContent='Chưa làm'}
  });
  [].forEach.call(document.querySelectorAll('.prog[data-bo]'),function(el){
    var b=el.dataset.bo,n=+el.dataset.n,done=0;for(var i=1;i<=n;i++)if(S.hist(b,i).length)done++;
    if(done){el.hidden=false;el.textContent='✅ Bé đã làm '+done+'/'+n}
  });
})();
