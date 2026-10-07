/* Trang làm bài trực tuyến: hiển thị phiếu bằng HTML, bàn phím số cho bé, chấm điểm ngay. */
(function(){
'use strict';
var D=window.PBT_DATA,META=window.PBT_META,S=window.PBT_STORE;
var root=document.getElementById('lb'),bar=document.getElementById('lb-bar');
var A='../assets/';
var qs=new URLSearchParams(location.search);
var bo=qs.get('bo'),so=parseInt(qs.get('so')||'1',10);
var group=D.groups[bo],meta=META.groups[bo];
if(!group||!meta){root.innerHTML='<div class="lb-card"><h1>🙈 Không tìm thấy phiếu</h1><p><a class="btn btn-all" href="../">← Về trang chủ</a></p></div>';bar.hidden=true;return}
var sheet=group.filter(function(s){return s.so===so})[0];
if(!sheet){sheet=group[0];so=sheet.so}
var LAB=meta.label;
document.title=meta.title+' – '+LAB+' số '+so+' – Làm bài';

/* ---------- helpers ---------- */
function h(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){var v=attrs[k];if(v==null||v===false)continue;
  if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k==='html')e.innerHTML=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v)}
  (kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==='string'?document.createTextNode(c):c)});return e}
function icon(kind,name,cls,alt){return h('img',{src:A+D.icons[kind][name],alt:alt||'',class:cls||'',width:'100',height:'100',draggable:'false'})}

/* ---------- state ---------- */
var st,items,activeId=null,fresh=true;
function load(){st=S.getState(bo,so)||{};st.a=st.a||{};st.m=st.m||[];st.g=st.g||null}
function save(){S.setState(bo,so,st)}
function nAnswered(){return items.filter(function(it){return st.a[it.id]!=null}).length}

/* ---------- top header ---------- */
function header(){
  var idx=group.indexOf(sheet),prev=group[idx-1],next=group[idx+1];
  var name=h('input',{id:'kid-name',type:'text',autocomplete:'off',maxlength:'40',placeholder:'Nhập tên bé',value:S.getName(),
    oninput:function(e){S.setName(e.target.value.trim())}});
  return h('div',{},[
    h('nav',{class:'lb-nav','aria-label':'Điều hướng'},[
      h('a',{class:'pill',href:'../'+bo+'/'},['← '+meta.emoji+' '+meta.title]),
      h('a',{class:'pill',href:'../'+bo+'/pdf/'+meta.prefix+'-so-'+String(so).padStart(2,'0')+'.pdf',target:'_blank',rel:'noopener'},['📄 PDF']),
      h('a',{class:'pill',href:'../ket-qua/'},['🏆 Kết quả'])
    ]),
    h('header',{class:'lb-head'},[
      h('div',{class:'lb-title'},[h('h1',{text:sheet.title}),h('p',{text:sheet.sub})]),
      h('label',{class:'lb-name',for:'kid-name'},['Họ tên bé: ',name])
    ]),
    h('div',{class:'lb-sheetnav'},[
      prev?h('a',{class:'pill',href:'?bo='+bo+'&so='+prev.so},['‹ '+LAB+' '+prev.so]):h('span'),
      h('strong',{text:LAB+' số '+so+'/'+group.length}),
      next?h('a',{class:'pill',href:'?bo='+bo+'&so='+next.so},[LAB+' '+next.so+' ›']):h('span')
    ])
  ]);
}

/* ---------- answer controls ---------- */
function slot(id,ans,label,extraCls){
  var b=h('button',{type:'button',class:'slot'+(extraCls?' '+extraCls:''),'data-id':id,'aria-haspopup':'true',onclick:function(){activate(id)}});
  items.push({id:id,ans:ans,type:'slot',ctl:b,label:label});
  return b;
}
function choices(id,ans,list,label){
  var g=h('div',{class:'choices',role:'radiogroup','aria-label':label});
  list.forEach(function(v){
    g.appendChild(h('button',{type:'button',role:'radio',class:'choice'+(v===ans?' is-correct':''),'data-v':v,'aria-checked':'false','aria-label':'Số '+v,
      onclick:function(){if(st.g)return;st.a[id]=v;save();refresh()}},[String(v)]));
  });
  items.push({id:id,ans:ans,type:'mc',ctl:g,label:label});
  return g;
}
function markWrap(el,id,ans){ /* container receiving ok/bad + ✓/✗ */
  el.setAttribute('data-q',id);
  el.appendChild(h('span',{class:'mark','aria-hidden':'true'}));
  el.appendChild(h('span',{class:'ans-hint',text:'Đáp án: '+ans}));
  return el;
}
function toggleMark(mid,btn){var i=st.m.indexOf(mid);if(i<0)st.m.push(mid);else st.m.splice(i,1);btn.setAttribute('aria-pressed',i<0?'true':'false');save()}
function markBtn(mid,cls,content,label){
  var b=h('button',{type:'button',class:cls,'aria-pressed':st.m.indexOf(mid)>=0?'true':'false','aria-label':label,onclick:function(){toggleMark(mid,b)}},content);
  return b;
}
function secHead(num,title,instr){return [h('h2',{class:'sec-title'},[h('span',{class:'bnum',text:String(num)}),title]),instr?h('p',{class:'instr',text:instr}):null]}

/* ---------- counting sheets ---------- */
function keyView(type,key,label){
  if(type==='letter')return h('span',{class:'key key-letter','aria-hidden':'true',text:key});
  return h('span',{class:'key key-animal','aria-hidden':'true'},[icon('animal',key),h('small',{text:label})]);
}
function renderCount(){
  var ex=sheet.example,frag=[];
  frag.push(h('p',{class:'instr big',text:sheet.instr}));
  if(sheet.hint)frag.push(h('p',{class:'hint',text:'💡 '+sheet.hint}));
  var exItems=[];for(var i=0;i<ex.n;i++)exItems.push(ex.type==='letter'?h('span',{class:'ex-l',text:ex.key}):h('span',{class:'ex-a'},[icon('animal',ex.key)]));
  var exName=ex.type==='letter'?'chữ '+ex.key:'con '+ex.label;
  frag.push(h('div',{class:'example'},[h('b',{text:'Ví dụ:'}),h('span',{class:'ex-row'},exItems),h('span',{class:'arrow',text:'→'}),
    keyView(ex.type,ex.key,''),h('span',{class:'slot slot-ex',text:String(ex.n)}),h('span',{class:'ex-note',text:'(có '+ex.n+' '+exName+' nên bé điền số '+ex.n+')'})]));
  sheet.boards.forEach(function(bd,bi){
    var g=h('div',{class:'cgrid cgrid-'+bd.type,role:'group','aria-label':'Bảng '+(bi+1)+': chạm để đánh dấu đã đếm'});
    bd.grid.forEach(function(row,r){row.forEach(function(k,c){
      var lbl=bd.type==='letter'?'chữ '+k:D.names[k];
      g.appendChild(markBtn('c'+bi+'-'+r+'-'+c,'cell',[bd.type==='letter'?k:icon('animal',k)],lbl+', hàng '+(r+1)+' cột '+(c+1)));
    })});
    var pairs=h('div',{class:'pairs'});
    bd.items.forEach(function(it){
      var id='b'+bi+'-'+it.key,lbl=(bd.type==='letter'?'chữ '+it.key:it.label);
      pairs.appendChild(markWrap(h('div',{class:'pair q'},[keyView(bd.type,it.key,it.label),h('span',{class:'arrow','aria-hidden':'true',text:'→'}),
        slot(id,it.ans,'Số '+lbl)]),id,it.ans));
    });
    frag.push(h('section',{class:'lb-card board'},secHead(bi+1,bd.label,null).concat([
      h('div',{class:'board-body'},[g,pairs]),
      h('button',{type:'button',class:'link-btn',onclick:function(){bd.grid.forEach(function(row,r){row.forEach(function(k,c){var m='c'+bi+'-'+r+'-'+c,i=st.m.indexOf(m);if(i>=0)st.m.splice(i,1)})});save();render()}},['🧽 Xóa dấu đánh dấu'])
    ])));
  });
  return frag;
}

/* ---------- math sheets ---------- */
function shapes(kind,shape,n,opts){
  opts=opts||{};var box=h('div',{class:'shapes'+(opts.cls?' '+opts.cls:''),role:opts.tap?'group':'img','aria-label':opts.label||(n+' hình')});
  for(var i=0;i<n;i++){
    var crossed=opts.crossed&&i>=n-opts.crossed;
    if(opts.tap)box.appendChild(markBtn(opts.tap+'-'+i,'shape-btn',[icon(kind,shape)],'Hình '+(i+1)+', chạm để gạch'));
    else box.appendChild(h('span',{class:'shape'+(crossed?' crossed':'')},[icon(kind,shape)]));
  }
  return box;
}
var SHAPE_VN={apple:'quả táo',star:'ngôi sao',flower:'bông hoa',fish:'con cá',balloon:'quả bóng'};
function renderMath(){
  var frag=[],kind=bo==='toan-be-4-tuoi'?'shape4':'shape5';
  sheet.sections.forEach(function(sec,si){
    var card=h('section',{class:'lb-card sec sec-'+sec.type},secHead(sec.num,sec.title,sec.instr));
    var list=h('div',{class:'qlist'});
    sec.items.forEach(function(it,ii){
      var id='s'+si+'-'+ii,q,qn=h('span',{class:'qn',text:(ii+1)+'.'}),lbl='Câu '+(ii+1);
      switch(sec.type){
        case 'pic-add':
          q=h('div',{class:'q q-col'},[h('div',{class:'q-row'},[qn,shapes(kind,it.shape,it.a),h('span',{class:'op',text:'+'}),shapes(kind,it.shape,it.b)]),h('div',{class:'q-row eq'},[h('span',{class:'expr',text:'='}),slot(id,it.ans,lbl+': '+it.a+' cộng '+it.b+' hình')])]);break;
        case 'pic-sub':
          q=h('div',{class:'q q-col'},[h('div',{class:'q-row'},[qn,shapes(kind,it.shape,it.n,{tap:'x'+si+'-'+ii,label:it.n+' '+SHAPE_VN[it.shape]+', chạm để gạch'})]),
            h('div',{class:'q-row eq'},[h('span',{class:'expr',text:it.n+' − '+it.k+' ='}),slot(id,it.ans,lbl+': '+it.n+' trừ '+it.k)])]);break;
        case 'calc':
          q=h('div',{class:'q q-calc'},[h('span',{class:'expr',text:it.a+' '+it.op+' '+it.b+' ='}),slot(id,it.ans,it.a+(it.op==='+'?' cộng ':' trừ ')+it.b,'slot-sm')]);break;
        case 'missing':
          var row=[qn];it.tokens.forEach(function(t){row.push(t===null?slot(id,it.ans,lbl+': số còn thiếu'):h('span',{class:'expr',text:t}))});
          q=h('div',{class:'q q-row'},row);break;
        case 'match':
          q=h('div',{class:'q q-row'},[h('span',{class:'expr-box',text:it.expr}),h('span',{class:'arrow',text:'→'}),choices(id,it.ans,it.choices,it.expr+' bằng mấy')]);break;
        case 'count-mc':
          q=h('div',{class:'q q-mc'},[qn,shapes(kind,it.shape,it.n,{label:'Đếm '+SHAPE_VN[it.shape]}),choices(id,it.ans,it.choices,lbl+': có mấy '+SHAPE_VN[it.shape])]);break;
        case 'pic-add-mc':
          q=h('div',{class:'q q-col'},[h('div',{class:'q-row'},[qn,shapes(kind,it.shape,it.a),h('span',{class:'op',text:'+'}),shapes(kind,it.shape,it.b)]),
            h('div',{class:'q-row eq'},[h('span',{class:'cap',text:it.a+' + '+it.b+' = ?'}),choices(id,it.ans,it.choices,lbl+': '+it.a+' cộng '+it.b)])]);break;
        case 'pic-sub-mc':
          q=h('div',{class:'q q-col'},[h('div',{class:'q-row'},[qn,shapes(kind,it.shape,it.n,{crossed:it.k,label:it.n+' hình, '+it.k+' hình bị gạch'})]),
            h('div',{class:'q-row eq'},[h('span',{class:'cap',text:it.n+' − '+it.k+' = ?'}),choices(id,it.ans,it.choices,lbl+': '+it.n+' trừ '+it.k)])]);break;
        case 'num-mc':
          q=h('div',{class:'q q-row'},[qn,h('span',{class:'expr big',text:it.a+' '+it.op+' '+it.b+' ='}),choices(id,it.ans,it.choices,it.a+(it.op==='+'?' cộng ':' trừ ')+it.b)]);break;
      }
      list.appendChild(markWrap(q,id,it.ans));
    });
    if(sec.type==='calc'){ /* 2 nhóm: phép cộng / phép trừ như trên phiếu */
      var half=sec.items.length/2,kids=[].slice.call(list.children),cols=h('div',{class:'calc-cols'});
      [0,1].forEach(function(c){var col=h('div',{class:'calc-col'},[h('h3',{text:sec.cols[c]})]),gr=h('div',{class:'calc-grid'});kids.slice(c*half,(c+1)*half).forEach(function(k){gr.appendChild(k)});col.appendChild(gr);cols.appendChild(col)});
      list=cols;
    }
    card.appendChild(list);
    if(sec.example)card.appendChild(h('p',{class:'hint',text:'Ví dụ: '+sec.example}));
    if(sec.type==='count-mc')card.insertBefore(h('div',{class:'example'},[h('b',{text:'Ví dụ:'}),shapes(kind,'apple',3),h('span',{class:'arrow',text:'→'}),
      h('span',{class:'choices'},[2,3,4].map(function(v){return h('span',{class:'choice'+(v===3?' ex-on':''),text:String(v)})})),h('span',{class:'ex-note',text:'(có 3 quả táo nên chọn số 3)'})]),list);
    frag.push(card);
  });
  return frag;
}

/* ---------- number pad ---------- */
var pad=document.getElementById('pad'),padLabel=document.getElementById('pad-label'),padVal=document.getElementById('pad-val');
function itemById(id){for(var i=0;i<items.length;i++)if(items[i].id===id)return items[i]}
function activate(id){
  if(st.g)return;var it=itemById(id);if(!it)return;
  if(activeId){var p=itemById(activeId);p&&p.ctl.classList.remove('active')}
  activeId=id;fresh=true;it.ctl.classList.add('active');
  padLabel.textContent=it.label;padVal.textContent=st.a[id]!=null?st.a[id]:'';
  pad.hidden=false;document.body.classList.add('pad-open');
  setTimeout(function(){it.ctl.scrollIntoView({block:'center',behavior:'smooth'})},30);
  pad.querySelector('[data-k="1"]').focus({preventScroll:true});
}
function closePad(){if(activeId){var p=itemById(activeId);p&&p.ctl.classList.remove('active');var c=p&&p.ctl;activeId=null;pad.hidden=true;document.body.classList.remove('pad-open');c&&c.focus({preventScroll:true})}}
function press(k){
  if(!activeId)return;var cur=st.a[activeId]!=null?String(st.a[activeId]):'';
  if(k==='del'){cur=fresh?'':cur.slice(0,-1)}
  else if(k==='ok'){nextSlot();return}
  else{cur=(fresh||cur.length>=2||cur==='0')?k:cur+k}
  fresh=false;
  if(cur==='')delete st.a[activeId];else st.a[activeId]=parseInt(cur,10);
  padVal.textContent=cur;save();refresh();
}
function nextSlot(){
  var slots=items.filter(function(it){return it.type==='slot'}),i=slots.map(function(s){return s.id}).indexOf(activeId);
  for(var j=1;j<=slots.length;j++){var s=slots[(i+j)%slots.length];if(st.a[s.id]==null&&s.id!==activeId){activate(s.id);return}}
  closePad();
}
pad.addEventListener('click',function(e){var b=e.target.closest('[data-k]');if(b)press(b.dataset.k)});
document.getElementById('pad-close').onclick=closePad;
document.addEventListener('keydown',function(e){
  if(!activeId||e.target.id==='kid-name')return;
  if(/^[0-9]$/.test(e.key)){press(e.key);e.preventDefault()}
  else if(e.key==='Backspace'){press('del');e.preventDefault()}
  else if(e.key==='Enter'){press('ok');e.preventDefault()}
  else if(e.key==='Escape')closePad();
});
document.addEventListener('click',function(e){if(activeId&&!pad.contains(e.target)&&!e.target.closest('.slot'))closePad()});

/* ---------- refresh UI from state ---------- */
function refresh(){
  items.forEach(function(it){
    var v=st.a[it.id];
    if(it.type==='slot'){it.ctl.textContent=v!=null?v:'';it.ctl.classList.toggle('filled',v!=null);it.ctl.setAttribute('aria-label',it.label+': '+(v!=null?v:'chưa điền'));it.ctl.disabled=!!st.g}
    else [].forEach.call(it.ctl.children,function(b){b.setAttribute('aria-checked',String(+b.dataset.v===v));b.disabled=!!st.g});
  });
  var n=nAnswered();
  document.getElementById('bar-prog').textContent=st.g?('Điểm: '+st.g.score+'/'+st.g.total):('Đã làm '+n+'/'+items.length+' câu');
  document.getElementById('bar-fill').style.width=(100*n/items.length)+'%';
  document.getElementById('btn-grade').hidden=!!st.g;
  document.getElementById('btn-reset-bar').hidden=!st.g;
}

/* ---------- grading ---------- */
var MSG={3:['Tuyệt vời! Bé làm đúng hết rồi! 🎉','Giỏi quá! Bé là siêu sao! 🌟'],2:['Giỏi lắm! Còn vài câu nữa thôi, bé thử lại nhé! 💪','Bé làm tốt lắm! Cố thêm chút nữa là đúng hết! 👏'],1:['Bé đã cố gắng rồi! Mình đếm lại thật chậm và thử lại nhé! 🌱','Không sao đâu! Làm lại lần nữa bé sẽ giỏi hơn! 🤗']};
function applyGrade(){
  var score=0;
  items.forEach(function(it){
    var el=root.querySelector('[data-q="'+it.id+'"]'),ok=st.a[it.id]===it.ans;if(ok)score++;
    el.classList.toggle('ok',ok);el.classList.toggle('bad',!ok);el.classList.toggle('empty',st.a[it.id]==null);
    el.querySelector('.mark').textContent=ok?'✓':'✗';
  });
  return score;
}
function grade(){
  closePad();
  var score=applyGrade(),total=items.length,stars=S.stars(score,total),at=Date.now();
  st.g={score:score,total:total,stars:stars,at:at};save();
  S.addHist(bo,so,{at:at,score:score,total:total,stars:stars});
  refresh();showResult(true);
}
function showResult(anim){
  var g=st.g,empty=items.length-nAnswered();
  var box=document.getElementById('result');
  var m=MSG[g.stars][g.at%2];
  box.innerHTML='';box.hidden=false;
  box.appendChild(h('div',{class:'stars','aria-label':g.stars+' sao'},[1,2,3].map(function(i){return h('span',{class:i<=g.stars?'on':'off',text:'★'})})));
  box.appendChild(h('p',{class:'score'},[h('b',{text:g.score+'/'+g.total}),' câu đúng']));
  box.appendChild(h('p',{class:'msg',text:m}));
  if(empty)box.appendChild(h('p',{class:'hint',text:'Còn '+empty+' câu bé chưa làm.'}));
  var name=S.getName();if(name)box.appendChild(h('p',{class:'hint',text:'Bé '+name+' • '+S.fmt(g.at)}));
  var idx=group.indexOf(sheet),next=group[idx+1];
  box.appendChild(h('div',{class:'res-btns'},[
    g.score<g.total?h('button',{type:'button',class:'btn btn-view',id:'btn-show',onclick:function(e){var on=root.classList.toggle('show-ans');e.currentTarget.textContent=on?'🙈 Ẩn đáp án':'👀 Xem đáp án'}},['👀 Xem đáp án']):null,
    h('button',{type:'button',class:'btn btn-print',id:'btn-reset',onclick:reset},['🔁 Làm lại']),
    next?h('a',{class:'btn btn-dl',href:'?bo='+bo+'&so='+next.so},['➡️ '+LAB+' tiếp theo']):h('a',{class:'btn btn-dl',href:'../'+bo+'/'},['📚 Chọn phiếu khác'])
  ]));
  if(anim){box.scrollIntoView({behavior:'smooth',block:'center'});if(g.stars===3)confetti()}
  box.focus({preventScroll:true});
}
function reset(){st={a:{},m:[],g:null};S.clearState(bo,so);root.classList.remove('show-ans');render();window.scrollTo({top:0,behavior:'smooth'})}
function confetti(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var cols=['#ff8a00','#2e9c5a','#4A90D9','#e8483b','#ffcf33','#bba6f0'],wrap=h('div',{class:'confetti','aria-hidden':'true'});
  for(var i=0;i<60;i++){var p=h('i');p.style.left=Math.random()*100+'%';p.style.background=cols[i%cols.length];p.style.animationDelay=(Math.random()*0.6)+'s';p.style.animationDuration=(2+Math.random()*1.5)+'s';p.style.transform='rotate('+(Math.random()*360)+'deg)';wrap.appendChild(p)}
  document.body.appendChild(wrap);setTimeout(function(){wrap.remove()},4200);
}

/* ---------- render ---------- */
function render(){
  load();items=[];activeId=null;pad.hidden=true;document.body.classList.remove('pad-open');
  root.innerHTML='';root.appendChild(header());
  var main=h('div',{class:'lb-sheet'},sheet.kind==='count'?renderCount():renderMath());
  root.appendChild(main);
  root.appendChild(h('section',{class:'lb-card result',id:'result',hidden:true,tabindex:'-1','aria-live':'polite'}));
  refresh();
  if(st.g){applyGrade();showResult(false)}
}
document.getElementById('btn-grade').onclick=grade;
document.getElementById('btn-reset-bar').onclick=reset;
if(!S.ok)document.getElementById('no-store').hidden=false;
render();
window.PBT_LB={items:function(){return items},state:function(){return st},grade:grade,reset:reset};
})();
