(function(){
'use strict';
var S=window.PBT_STORE,META=window.PBT_META,root=document.getElementById('kq');
function h(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){var v=attrs[k];if(v==null||v===false)continue;
  if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v)}
  (kids||[]).forEach(function(c){if(c!=null)e.appendChild(typeof c==='string'?document.createTextNode(c):c)});return e}
function stars(n){return '⭐'.repeat(n)+'☆'.repeat(3-n)}
function render(){
  root.innerHTML='';
  var name=h('input',{id:'kid-name',type:'text',maxlength:'40',autocomplete:'off',placeholder:'Nhập tên bé',value:S.getName(),oninput:function(e){S.setName(e.target.value.trim())}});
  root.appendChild(h('div',{class:'lb-card'},[h('label',{class:'lb-name',for:'kid-name'},['Họ tên bé: ',name]),
    h('p',{class:'hint',text:'Kết quả chỉ lưu trên máy/trình duyệt này, không gửi đi đâu.'})]));
  if(!S.ok)root.appendChild(h('p',{class:'lb-card warn',text:'Trình duyệt đang chặn lưu dữ liệu (chế độ ẩn danh?), nên không xem được kết quả.'}));
  var any=false,totalDone=0,totalAttempts=0;
  META.order.forEach(function(slug){
    var g=META.groups[slug],rows=[];
    for(var so=1;so<=g.count;so++){
      var hist=S.hist(slug,so);if(!hist.length)continue;
      totalDone++;totalAttempts+=hist.length;
      var best=S.best(slug,so);
      var list=h('ol',{class:'hist',reversed:true});
      hist.slice().reverse().forEach(function(e){list.appendChild(h('li',{},[h('span',{class:'hs',text:stars(e.stars)}),h('b',{text:' '+e.score+'/'+e.total}),h('span',{class:'ht',text:' • '+S.fmt(e.at)})]))});
      rows.push(h('div',{class:'kq-sheet'},[
        h('div',{class:'kq-head'},[h('h3',{text:g.label+' số '+so}),h('span',{class:'status st-done',text:'⭐'.repeat(S.stars(best.score,best.total))+' '+best.score+'/'+best.total}),
          h('a',{class:'btn btn-do btn-sm',href:'../lam-bai/?bo='+slug+'&so='+so},['✏️ Làm lại'])]),
        h('p',{class:'hint',text:hist.length+' lần làm • cao nhất '+best.score+'/'+best.total}),list]));
    }
    if(rows.length){any=true;root.appendChild(h('section',{class:'lb-card kq-group',style:'--c:'+g.color},[h('h2',{},[g.emoji+' '+g.title]),h('div',{},rows)]))}
  });
  if(!any)root.appendChild(h('div',{class:'lb-card empty-kq'},[h('p',{class:'big',text:'🐣 Bé chưa làm phiếu nào.'}),h('p',{text:'Chọn một phiếu rồi bấm ✏️ Làm bài nhé!'}),h('a',{class:'btn btn-all',href:'../'},['📚 Chọn phiếu'])]));
  else root.insertBefore(h('p',{class:'kq-sum',text:'Bé đã làm '+totalDone+' phiếu, tổng '+totalAttempts+' lần.'}),root.children[1]);
  root.appendChild(h('div',{class:'lb-card danger'},[h('h2',{text:'Xóa dữ liệu'}),h('p',{class:'hint',text:'Xóa toàn bộ kết quả, bài đang làm dở và tên bé trên máy này.'}),
    h('button',{type:'button',class:'btn btn-danger',id:'btn-clear',onclick:function(){if(confirm('Xóa toàn bộ kết quả và bài đang làm của bé trên máy này? Không thể khôi phục.')){S.clearAll();render()}}},['🗑️ Xóa toàn bộ dữ liệu'])]));
}
render();
})();
