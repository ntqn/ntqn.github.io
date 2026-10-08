/* PWA: đăng ký service worker, báo bản mới, gợi ý cài như ứng dụng. */
(function(){
  var standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  if(standalone)document.documentElement.classList.add('is-app');
  function banner(text,btnText,onClick){
    var b=document.createElement('div');b.className='app-banner';b.setAttribute('role','status');
    b.innerHTML='<span></span><button type="button" class="ab-go"></button><button type="button" class="ab-x" aria-label="Đóng">✕</button>';
    b.firstChild.textContent=text;b.querySelector('.ab-go').textContent=btnText;
    b.querySelector('.ab-go').onclick=onClick;b.querySelector('.ab-x').onclick=function(){b.remove()};
    document.body.appendChild(b);return b;
  }
  if('serviceWorker' in navigator){
    var updating=false;
    navigator.serviceWorker.addEventListener('controllerchange',function(){if(updating){updating=false;location.reload()}});
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(function(reg){
        function offer(w){if(!w||!navigator.serviceWorker.controller||document.querySelector('.app-banner'))return;
          banner('🎉 Có bản mới của trang.','Tải lại',function(){updating=true;w.postMessage('SKIP_WAITING')})}
        if(reg.waiting)offer(reg.waiting);
        reg.addEventListener('updatefound',function(){var w=reg.installing;w&&w.addEventListener('statechange',function(){if(w.state==='installed')offer(w)})});
        document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')reg.update().catch(function(){})});
      }).catch(function(){});
    });
  }
  /* Nút cài đặt (chỉ ở trang chủ, chỉ khi chưa cài) */
  var box=document.getElementById('install');
  if(!box||standalone)return;
  var btn=box.querySelector('.inst-btn'),hint=box.querySelector('.inst-hint'),deferred=null;
  var ua=navigator.userAgent,ios=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;box.hidden=false});
  window.addEventListener('appinstalled',function(){box.hidden=true;deferred=null});
  if(ios){box.hidden=false;hint.textContent='Trên iPhone/iPad: mở trang bằng Safari, bấm nút Chia sẻ (ô vuông có mũi tên ↑) rồi chọn “Thêm vào Màn hình chính”.'}
  btn.onclick=function(){
    if(deferred){deferred.prompt();deferred.userChoice.finally(function(){deferred=null;box.hidden=true});return}
    hint.hidden=!hint.hidden;
  };
})();
