const $=id=>document.getElementById(id),fmt=v=>Number.isFinite(v)&&v>=0?new Intl.NumberFormat('en-US').format(v):'—';
const colors={standard:'#21834a',lowest:'#2476cf',highest:'#d13c45',amount:'#8057a6'};
let data={items:[]},group='',category='',sub='',selected=null;
function node(tag,value='',className=''){const e=document.createElement(tag);e.textContent=value;e.className=className;return e;}
function groups(){return [...new Set(data.items.map(i=>i.exchange))].sort((a,b)=>['Diamond Auction','Diamond Exchange','Crystal Exchange'].indexOf(a)-['Diamond Auction','Diamond Exchange','Crystal Exchange'].indexOf(b));}
function drawNav(){
 const gs=groups();if(!gs.includes(group))group=gs[0]||'';
 $('groups').replaceChildren(...gs.map(g=>{const b=node('button',g,'group'+(group===g?' active':''));b.onclick=()=>{group=g;category='';sub='';drawNav();drawItems();};return b;}));
 const inGroup=data.items.filter(i=>i.exchange===group),cats=[...new Set(inGroup.map(i=>i.category))];
 $('categories').className='categories';
 const all=node('button','All categories','category all-category'+(!category?' active':''));all.append(node('small',String(inGroup.length)));all.onclick=()=>{category='';sub='';drawNav();drawItems();};
 $('categories').replaceChildren(all);
 for(const c of cats){const count=inGroup.filter(i=>i.category===c).length,b=node('button',c,'category'+(category===c?' active':''));b.append(node('small',String(count)));b.onclick=()=>{category=c;sub='';drawNav();drawItems();};$('categories').append(b);}
 const subs=category?[...new Set(inGroup.filter(i=>i.category===category).map(i=>i.subcategory))]:[];
 $('subcategories').className='categories'+(subs.length?'':' hidden');
 $('subcategories').replaceChildren(...subs.map(s=>{const b=node('button',s,'category subcategory'+(sub===s?' active':''));b.onclick=()=>{sub=s;drawNav();drawItems();};return b;}));
}
function drawItems(){const query=$('search').value.trim().toLocaleLowerCase(),items=data.items.filter(i=>i.exchange===group&&(!category||i.category===category)&&(!sub||i.subcategory===sub)&&(!query||i.name.toLocaleLowerCase().includes(query)));$('heading').textContent=sub||category||group||'All items';$('grid').replaceChildren();$('empty').classList.toggle('hidden',items.length>0);for(const item of items){const card=node('button','','item');const icon=node('div','','item-icon');icon.dataset.quality=item.qualityColor||'unknown';icon.style.borderColor=({white:'#d9e0e5',blue:'#7db5ed',purple:'#bb8bdf',orange:'#eba857'})[item.qualityColor]||'#ded2ee';const img=document.createElement('img');img.src=item.icon||'./missing-image.png';img.alt='';img.loading='lazy';img.onerror=()=>{img.remove();icon.append(node('span','?','missing'));};icon.append(img);const copy=node('div','','item-copy');copy.append(node('small',item.subcategory),node('b',item.name),node('span',item.price==null?'Not captured':fmt(item.price),'item-price'),node('span',item.listedAmount==null?'Amount not captured':fmt(item.listedAmount)+' listed · '+item.currency,'item-caption'));card.append(icon,copy);card.onclick=()=>openItem(item);$('grid').append(card);}}
function openItem(item){selected=item;const img=$('icon');img.classList.remove('hidden');$('icon-missing').classList.add('hidden');img.onerror=()=>{img.classList.add('hidden');$('icon-missing').classList.remove('hidden');};img.src=item.icon||'./missing-image.png';img.parentElement.style.borderColor=({white:'#d9e0e5',blue:'#7db5ed',purple:'#bb8bdf',orange:'#eba857'})[item.qualityColor]||'#ded2ee';$('category').textContent=`${item.exchange} / ${item.category} / ${item.subcategory}`;$('name').textContent=item.name;$('price').textContent=fmt(item.price);$('standard').textContent=fmt(item.standard);$('lowest').textContent=fmt(item.lowest);$('highest').textContent=fmt(item.highest);$('amount').textContent=fmt(item.listedAmount);$('metric').value='prices';$('detail').showModal();renderHistory();}
function series(item){const m=$('metric').value,all=[['standard','Standard',colors.standard],['lowest','Lowest',colors.lowest],['highest','Highest',colors.highest]];return m==='amount'?[['amount','Amount',colors.amount]]:all.filter(s=>m==='prices'||m===s[0]);}
function renderHistory(){
 if(!selected)return;
 const rows=selected.days||[],lines=series(selected);
 $('legend').replaceChildren(...lines.map(s=>{const e=node('span',s[1]);const mark=node('i');mark.style.setProperty('--color',s[2]);e.prepend(mark);return e;}));
 const canvas=$('chart'),ctx=canvas.getContext('2d'),box=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;
 canvas.width=box.width*dpr;canvas.height=box.height*dpr;ctx.scale(dpr,dpr);
 const w=box.width,h=box.height,pad={l:70,r:14,t:16,b:32};ctx.clearRect(0,0,w,h);
 const points=lines.flatMap(s=>rows.filter(d=>Number.isFinite(d[s[0]])&&d[s[0]]>=0).map(d=>({date:d.date,x:Date.parse(d.date+'T00:00:00Z'),value:d[s[0]],key:s[0],color:s[2],label:s[1]})));
 const tooltip=$('chart-tooltip'),chart=canvas.parentElement;tooltip.classList.add('hidden');
 $('chart-empty').textContent=points.length?'':$('metric').value==='amount'?'No daily amounts recorded yet.':'No daily prices recorded yet.';$('chart-empty').classList.toggle('hidden',points.length>0);
 if(!points.length){$('days').replaceChildren(...rows.slice().reverse().map(d=>dailyRow(d)));canvas.onpointermove=canvas.onpointerdown=canvas.onpointerleave=null;return;}
 const min=Math.min(...points.map(p=>p.value)),max=Math.max(...points.map(p=>p.value)),first=Math.min(...points.map(p=>p.x)),last=Math.max(...points.map(p=>p.x)),lo=min===max?Math.max(0,min*.9):min,hi=min===max?max*1.1:max;
 ctx.font='11px Segoe UI';ctx.textBaseline='middle';
 for(let j=0;j<4;j++){const y=pad.t+(h-pad.t-pad.b)*j/3;ctx.strokeStyle='#e8e3ee';ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle='#897c96';ctx.fillText(fmt(Math.round(hi-(hi-lo)*j/3)),5,y);}
 const X=x=>first===last?(pad.l+w-pad.r)/2:pad.l+(x-first)/(last-first)*(w-pad.l-pad.r),Y=v=>h-pad.b-(v-lo)/(hi-lo)*(h-pad.t-pad.b);
 for(const s of lines){const ps=points.filter(p=>p.key===s[0]).sort((a,b)=>a.x-b.x);ctx.strokeStyle=s[2];ctx.lineWidth=2.5;ctx.beginPath();ps.forEach((p,i)=>{if(i===0)ctx.moveTo(X(p.x),Y(p.value));else ctx.lineTo(X(p.x),Y(p.value));});ctx.stroke();for(const p of ps){ctx.beginPath();ctx.arc(X(p.x),Y(p.value),3,0,Math.PI*2);ctx.fillStyle=s[2];ctx.fill();}}
 ctx.fillStyle='#897c96';ctx.textBaseline='alphabetic';const ticks=rows.filter(d=>d.date).map(d=>Date.parse(d.date+'T00:00:00Z'));
 for(const i of [0,Math.floor((ticks.length-1)/2),ticks.length-1].filter((v,i,a)=>a.indexOf(v)===i)){if(ticks[i])ctx.fillText(new Date(ticks[i]).toISOString().slice(0,10),X(ticks[i])-20,h-7);}
 $('days').replaceChildren(...rows.slice().reverse().map(d=>dailyRow(d)));
 const showTooltip=e=>{
  const rect=canvas.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top;
  const nearest=points.reduce((best,p)=>Math.hypot(X(best.x)-px,Y(best.value)-py)<=Math.hypot(X(p.x)-px,Y(p.value)-py)?best:p);
  if(Math.hypot(X(nearest.x)-px,Y(nearest.value)-py)>(e.pointerType==='mouse'?26:48)){if(e.pointerType==='mouse')tooltip.classList.add('hidden');return;}
  const day=rows.reduce((best,row)=>Math.abs(Date.parse(best.date+'T00:00:00Z')-nearest.x)<=Math.abs(Date.parse(row.date+'T00:00:00Z')-nearest.x)?best:row);
  tooltip.textContent=day.date+'\n'+lines.map(s=>s[1]+': '+fmt(day[s[0]])).join('\n');tooltip.classList.remove('hidden');
  const area=chart.getBoundingClientRect(),anchorX=rect.left-area.left+X(nearest.x),anchorY=rect.top-area.top+Y(nearest.value),tw=tooltip.offsetWidth,th=tooltip.offsetHeight;
  let left=anchorX+12;if(left+tw>chart.clientWidth-8)left=anchorX-tw-12;left=Math.max(8,Math.min(left,chart.clientWidth-tw-8));
  let top=anchorY-th-12;if(top<8)top=anchorY+12;top=Math.max(8,Math.min(top,chart.clientHeight-th-8));tooltip.style.left=left+'px';tooltip.style.top=top+'px';
 };
 canvas.onpointermove=showTooltip;canvas.onpointerdown=e=>{if(e.pointerType!=='mouse')showTooltip(e);};canvas.onpointerleave=e=>{if(e.pointerType==='mouse')tooltip.classList.add('hidden');};
}function dailyRow(d){const tr=document.createElement('tr');for(const v of [d.date,fmt(d.standard),fmt(d.lowest),fmt(d.highest),fmt(d.amount)])tr.append(node('td',v));return tr;}
$('search').addEventListener('input',drawItems);$('metric').addEventListener('change',renderHistory);$('close').onclick=()=>$('detail').close();new ResizeObserver(()=>{if($('detail').open)renderHistory();}).observe($('chart'));
try{const response=await fetch('./data.json');if(!response.ok)throw new Error('data');data=await response.json();$('updated').textContent=data.updatedDate?'Updated '+data.updatedDate:'';drawNav();drawItems();}catch{$('heading').textContent='Price data unavailable';$('empty').classList.remove('hidden');$('empty').textContent='The public price file could not be loaded.';}
