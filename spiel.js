const scene=document.querySelector('#scene'), tools=document.querySelector('#tools'), statusLine=document.querySelector('#status');
const dialog=document.querySelector('#window'), body=document.querySelector('#body'), heading=document.querySelector('#heading');
const state={place:'title', unlocked:new Set(['bar']), clues:new Set(), dossiers:new Set(), show:false, sentence:0};
const strangerQuestionOrders=[
 [4,2,5,3,1],
 [1,4,2,3,5],
 [3,2,1,4,5],
 [1,2,4,5,3],
 [4,3,2,5,1]
];
const strangerProgress=new Map();
const strangerPassScore=3;
function strangerQuestionAt(place){
 if(!strangerProgress.has(place)){
  const order=strangerQuestionOrders[Math.floor(Math.random()*strangerQuestionOrders.length)];
  strangerProgress.set(place,{order,index:0,correct:0});
 }
 const {order,index,correct}=strangerProgress.get(place);
 return {number:order[index]??null,position:index+1,total:order.length,correct};
}
function recordStrangerAnswer(place,correct){
 if(strangerQuestionAt(place).number===null)return;
 const progress=strangerProgress.get(place);
 progress.index++;
 if(correct)progress.correct++;
}
const xmStations={
 bar:{code:'AB',flag:'bottle-tip',ready:'heard-Wirtin_1',prompt:'Hört euch zuerst die Wirtin an.',book:'Märchenbuch',notes:[
  ['Rotkäppchen','Die Großmutter ist krank. Rotkäppchen bringt ihr Wein und Kuchen. Im Wald trifft das Mädchen einen Wolf.'],
  ['Schneewittchen','Schneewittchen hat Haare schwarz wie Ebenholz, Haut weiß wie Schnee und Lippen rot wie Blut. Sie versteckt sich bei den sieben Zwergen.'],
  ['Hänsel und Gretel','Hänsel und Gretel verirren sich im Wald. Dort finden sie ein Haus aus Lebkuchen. In dem Haus wohnt eine Hexe.'],
  ['Aschenputtel','Aschenputtel tanzt mit dem Prinzen. Als sie das Schloss verlässt, verliert sie auf der Treppe einen goldenen Pantoffel.'],
  ['Die Bremer Stadtmusikanten','Ein Esel, ein Hund, eine Katze und ein Hahn wollen nach Bremen reisen. Dort wollen sie Musik machen. Unterwegs finden sie ein Haus im Wald.']
 ],answers:[['Rotkäppchen'],['Schneewittchen','Scheewittchen'],['Hänsel und Gretel','Hänsel & Gretel'],['Aschenputtel'],['Bremen','nach Bremen']]},
 koeln:{code:'K',flag:'lock-tip',ready:'rock',prompt:'Findet zuerst Loreleys Zuhause.',book:'Köln-Reiseführer',notes:[
  ['Ein Tag in Köln','Köln liegt am Rhein. Vom Fluss aus sieht man die zwei hohen Türme des Kölner Doms. Der Dom ist die bekannteste Kirche der Stadt.'],
  ['Karneval und Kölsch','Beim Karneval tragen viele Menschen Kostüme. In den Straßen gibt es Musik und große Umzüge. In den Kneipen trinken viele ein Kölsch. Das Bier wird oft in einem schmalen Glas serviert. Das Glas nennt man eine Stange.'],
  ['Weiter am Rhein','Am Loreleyfelsen macht der Rhein eine enge Kurve. Das Wasser fließt dort schnell. Die starke Strömung macht die Fahrt für Schiffe gefährlich.']
 ],answers:[['Rhein','am Rhein'],['Karneval','Kölner Karneval','der Karneval'],['Kölsch','Kölschbier'],['Strömung','starke Strömung','die starke Strömung'],['Kölner Dom','der Kölner Dom','Dom','der Dom']]},
 hh:{code:'HH',flag:'loading-plan',ready:'heard-St_1',prompt:'Sprecht zuerst mit Störtebeker.',book:'Hafenaushang',notes:[
  ['Am Wasser','Der Hamburger Hafen liegt an der Elbe. In Altona gibt es einen Fischmarkt. Dort kann man Fisch kaufen und am Wasser spazieren gehen.'],
  ['Ein Turm und viele Lagerhäuser','Die Kirche Sankt Michaelis hat einen hohen Turm. Die Hamburger nennen die Kirche kurz Michel. In der Speicherstadt stehen alte Lagerhäuser aus rotem Backstein. Früher lagerten dort Waren aus vielen Ländern.'],
  ['Eine Straße mit Geschichte','Der Jungfernstieg liegt an der Binnenalster. Im Jahr 1838 bekam er als erste Straße in Deutschland einen Belag aus Asphalt.']
 ],answers:[['Elbe','an der Elbe','die Elbe'],['Fischmarkt','einen Fischmarkt','Hamburger Fischmarkt'],['Michel','der Michel','Hamburger Michel'],['Speicherstadt','die Speicherstadt'],['Jungfernstieg','der Jungfernstieg']]}
};
function xmClip(station,n){return 'XM/XM_'+n+'_'+station.code;}
let xmReactions=[];
function nextXmReaction(){
 if(!xmReactions.length)xmReactions=[1,2,3,4,5];
 return xmReactions.splice(Math.floor(Math.random()*xmReactions.length),1)[0];
}
function xmBook(station){
 open(station.book);
 for(const [title,text] of station.notes){node('h3',title,body);node('p',text,body);}
}
function xmHint(station){
 const clip=xmClip(station,7);
 speak('fremder',clip);
 if(state.clues.has('heard-'+clip))state.clues.add(station.flag);
 body.querySelector('audio').addEventListener('ended',()=>state.clues.add(station.flag),{once:true});
}
function strangerQuiz(place){
 const station=xmStations[place],question=strangerQuestionAt(place);
 if(question.number===null){
  if(question.correct>=strangerPassScore){xmHint(station);return;}
  message('X. Mac',question.correct+' von '+question.total+' richtig. Für meinen Tipp braucht ihr drei richtige Antworten.');
  button(body,'Noch einmal versuchen',()=>{strangerProgress.delete(place);strangerQuiz(place);});
  return;
 }
 const clip=xmClip(station,question.number+1);
 speak('fremder',clip);
 node('p','Frage '+question.position+' von '+question.total,body);
 const audio=body.querySelector('audio');
 const form=node('form','',body);
 const label=node('label','Antwort',form);
 const input=node('input','',label);input.required=true;input.autocomplete='off';
 const submit=node('button','Antwort prüfen',form);submit.type='submit';
 input.disabled=submit.disabled=!state.clues.has('heard-'+clip);
 audio.addEventListener('ended',()=>{input.disabled=submit.disabled=false;},{once:true});
 form.onsubmit=event=>{
  event.preventDefault();
  if(submit.disabled||!normalize(input.value))return;
  const correct=station.answers[question.number-1].some(value=>normalize(value)===normalize(input.value));
  recordStrangerAnswer(place,correct);
  if(correct){strangerQuiz(place);return;}
  speak('fremder','XM/XM_'+nextXmReaction()+'_X',()=>strangerQuiz(place),'Weiter');
  const reaction=body.querySelector('audio');
  reaction.addEventListener('error',()=>{body.querySelector('button').disabled=false;},{once:true});
  reaction.play().catch(()=>{});
 };
}
function meetXm(place){
 const station=xmStations[place];
 if(!state.clues.has(station.ready)){message('X. Mac',station.prompt);return;}
 const intro=xmClip(station,1);
 if(state.clues.has('heard-'+intro)){strangerQuiz(place);return;}
 speak('fremder',intro,()=>strangerQuiz(place),'Fragen starten');
}
const places={title:['title','Die Goldene Zunge'],bar:['bar','Hamburg · Aloha-Bar'],koeln:['koeln','Kölner Spur · Loreleyfelsen'],hh:['hh','Hamburger Hafen'],rb:['rb','Riesengebirge'],hhkai:['hhkai','Hamburg · Richtplatz'],end:['end','Du bist reich'],secret:['sec_end','Leichenschmaus']};
const people={rich:'Richard',wirt:'Wirtin',lore:'Loreley',sto:'Störtebeker',rub:'Rübezahl',kai:'Mann am Kai',fremder:'X. Mac'};
const dossiers={
 lore:'Loreley ist eine Figur aus einer Sage vom Rhein. Sie sitzt auf einem hohen Felsen und kämmt ihr goldenes Haar. Dabei singt sie. Die Schiffer hören ihr zu und achten nicht mehr auf den Fluss. Der Felsen heißt heute Loreleyfelsen.',
 sto:'Klaus Störtebeker ist ein berühmter Seeräuber aus Norddeutschland. In der Sage fährt er mit seiner Mannschaft über das Meer. Gemeinsam greifen sie andere Schiffe an. Sein Name ist eng mit Hamburg verbunden.',
 rub:'Rübezahl ist ein Berggeist aus dem Riesengebirge. Das Gebirge liegt zwischen Tschechien und Polen. In manchen Geschichten hilft er armen Menschen. Wer gierig ist, bekommt von ihm eine Lektion. Auf Tschechisch heißt er Krakonoš.'
};
const evidence={
 note:['Loreleys Zettel','Ich bin dort, wo man Kölsch trinkt, wo ein großer Dom steht und wo man Karneval feiert. — Loreley'],
 diary:['Loreleys Tagebuch','Richard hat mir alles geglaubt. Wir haben bis zum Morgen Absinth getrunken. Er war so müde, dass er gar nicht bemerkt hat, dass ich seine Goldene Zunge gestohlen habe.'],
 advert:['Bierwerbung','Hafen und Fischmarkt in der Stadt mit dem Michel. Gesponsert von Störtebeker Pils.'],
 poker:['Pokerzettel','Störtebeker setzt die Goldene Zunge. Rübezahl setzt seinen Platz auf dem Schiff. Gewinner: Rübezahl.'],
 mountain:['Zettel von Störtebeker','Das erste Wort bedeutet sehr große Menschen: Riesen. Das zweite Wort ist Gebirge. Dort lebt Rübezahl!']
};
function node(tag,value,parent){const el=document.createElement(tag);if(value)el.textContent=value;parent?.append(el);return el;}
function button(parent,label,action,cls){const b=node('button',label,parent);b.type='button';b.onclick=action;if(cls)b.className=cls;return b;}
function open(title){body.onkeydown=null;heading.textContent=title;body.replaceChildren();if(!dialog.open)dialog.showModal();}
function message(title,value){open(title);node('p',value,body);}
function portrait(id,parent){const p=node('div','',parent);p.className='portrait'+(id==='kai'?' single':'');p.style.backgroundImage='url(assets/'+(id==='fremder'?'strang_sprite':id)+'.png)';p.setAttribute('role','img');p.setAttribute('aria-label',people[id]);}
dialog.addEventListener('close',()=>body.replaceChildren());
function speak(id,clip,next,label){
 open(people[id]);portrait(id,body);
 const audio=node('audio','',body);audio.controls=true;audio.src='audio/'+clip+'.mp3';audio.preload='metadata';
 audio.addEventListener('error',()=>node('p','Die Aufnahme konnte nicht geladen werden. Öffnet das Gespräch erneut.',body),{once:true});
 const advance=next?button(body,label,next):null;
 if(advance)advance.disabled=!state.clues.has('heard-'+clip);
 audio.addEventListener('ended',()=>{
  state.clues.add('heard-'+clip);
  if(advance)advance.disabled=false;
 });
}
function find(id){state.clues.add(id);if(id==='note'){
 state.dossiers.add('lore');
 if(state.place==='bar')scene.querySelector('img').src='assets/bar.png';
 }if(id==='advert')state.dossiers.add('sto');if(id==='mountain')state.dossiers.add('rub');message(...evidence[id]);if(id==='advert'){const poster=node('img','',body);poster.className='poster';poster.src='assets/werbung.png';poster.alt='Störtebeker Pils – Fischmarkt am Michel';}}
function travel(place){if(dialog.open)dialog.close();state.place=place;render();}
function hot(label,rect,action,id){
 const b=button(scene,'',action,'hot'+(id?' sprite':''));b.setAttribute('aria-label',label);
 ['left','top','width','height'].forEach((key,i)=>b.style[key]=rect[i]+'%');
 if(id)b.style.backgroundImage='url(assets/'+(id==='fremder'?'strang_sprite':id)+'.png)';
 node('span',label,b).className='tag';
}
function normalize(s){return s.toLowerCase().trim().normalize('NFC').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss').replace(/oe/g,'o').replace(/ue/g,'u').replace(/ae/g,'a').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');}
function ask(fields,validate,success){
 const form=node('form','',body);
 const inputs=fields.map(name=>{const l=node('label',name,form);const input=node('input','',l);input.required=true;input.autocomplete='off';return input;});
 const submit=node('button','Prüfen',form);submit.type='submit';
 const feedback=node('p','',form);feedback.setAttribute('role','status');
 form.onsubmit=e=>{e.preventDefault();if(validate(inputs.map(i=>normalize(i.value))))success();else feedback.textContent='Das klingt unlogisch. Denkt weiter.';};
}
const tickets={
 bar:['note',['loreley'],['koln'],'koeln','Köln'],
 koeln:['advert',['stortebeker','stortebecker','klausstortebeker','storte'],['hamburg','hamburgerhafen','hh'],'hh','Hamburg'],
 hh:['mountain',['rubezahl'],['riesengebirge'],'rb','ins Riesengebirge']
};
function richard(){
 open('Richard von Roggenfänger');portrait('rich',body);
 if(state.place==='bar')node('p','Ich will meine Zunge wieder! Bitte suchen Sie meine Goldene Zunge. Wenn Sie mit ihr sprechen, kann niemand Nein sagen. Ich zahle Ihnen eine Million Euro, wenn Sie mir die Zunge zurückbringen!',body);
 const ticket=tickets[state.place];if(!ticket)return;
 const [clue,names,targets,to,city]=ticket;
 if(state.unlocked.has(to)){button(body,'Zur Karte',map);return;}
 if(!state.clues.has(clue)){node('p','Findet zuerst eine Spur. Dann bezahle ich eure Fahrkarte.',body);return;}
 ask(['Wer war es wirklich?','Wo ist er?'],([name,target])=>names.includes(name)&&targets.includes(target),()=>{
 state.unlocked.add(to);message('Richard','Sehr clever, ich gebe euch das Ticket.');button(body,'Zur Karte',map);statusLine.textContent='Fahrkarte erhalten · '+city;
 });
}
function map(){
 open('Reisekarte');
 const board=node('div','',body);board.className='map';
 board.innerHTML='<svg viewBox="0 0 430 344" role="img" aria-label="Schematische Karte von Deutschland und dem Riesengebirge"><path d="M125 28L157 38 176 26 197 45 228 43 249 71 240 105 265 136 250 157 266 180 237 210 254 235 219 273 181 265 154 289 126 262 96 270 80 242 86 210 61 186 72 153 64 118 86 102 85 70 114 62Z" fill="#36346b" stroke="#a6a0da" stroke-width="2"/></svg>';
 for(const [key,label,x,y] of [['bar','Aloha-Bar',30,15],['hh','Hamburger Hafen',51,28],['koeln','Köln',21,54],['rb','Riesengebirge',76,55],['hhkai','Richtplatz',69,13]]){
 if(key==='hhkai'&&!state.unlocked.has(key))continue;
 const b=button(board,state.unlocked.has(key)?label:'???',()=>travel(key));b.disabled=!state.unlocked.has(key);b.style.left=x+'%';b.style.top=y+'%';
 }
}
function archive(){
 open('Ermittlungsakte');
 for(const id of state.clues)if(evidence[id])button(body,evidence[id][0],()=>find(id));
 if(![...state.clues].some(id=>evidence[id]))node('p','Noch keine Belege gefunden.',body);
}
function dossier(){
 open('Personendossier');
 if(!state.dossiers.size)node('p','Hier erscheinen Figuren, sobald ihr ihre Namen entdeckt.',body);
 for(const id of state.dossiers){node('h3',people[id],body);portrait(id,body);node('p',dossiers[id],body);}
}
const bottleReactions={
 'Pilz Whisky':{
  trinken:'Viel Alkohol, aber keine Info!',
  essen:'Aua, das tut weh! Wer kontrolliert mich?',
  kussen:'Das war schön, aber nichts passiert.'
 },
 Absinth:{
  trinken:'Bitter! Und die Fee macht, dass die Welt sich dreht.',
  essen:'Schmeckt nicht, wer tippt da eigentlich diesen Quatsch?',
  kussen:'Klirr. Hinter der Flasche fällt ein Zettel auf den Tresen.'
 },
 'Störtebeker Pils':{
  trinken:'Ich bin jetzt ein echter Mann, selbst als Frau, aber eine Info habe ich immer noch nicht.',
  essen:'Nur echte Männer (selbst als Frau) können Störtebeker Pils essen! Merk Dir DAS!',
  kussen:'Die Flasche ist zu männlich. Sie kann nicht sagen, dass sie mich liebt!'
 },
 'Vita Cola':{
  trinken:'Spritzig, urst lecker, aber keine Info.',
  essen:'Als der Kellner das sieht, gibt es mir ein Vita-Cola Eis aus dem Kühlschrank. Urst lecker!',
  kussen:'Diese Cola sollte man häufiger küssen.'
 }
};
function barStranger(){meetXm('bar');}
function bottle(name){
 open(name);
 const form=node('form','',body);
 const label=node('label','Was willst du mit der Flasche machen?',form);
 const input=node('input','',label);input.required=true;input.autocomplete='off';
 const submit=node('button','Versuchen',form);submit.type='submit';
 const reply=node('p','',form);reply.setAttribute('role','status');
 form.onsubmit=e=>{
  e.preventDefault();
  const action=normalize(input.value);
  const reactions=bottleReactions[name];
  if(name==='Absinth'&&action==='kussen'){
   if(!state.clues.has('bottle-tip')){
    reply.textContent='Sie liebt mich nicht, sie liebt mich einfach nicht!';
    input.select();return;
   }
   find('note');const first=body.firstElementChild;
   const reaction=node('p',reactions.kussen);body.insertBefore(reaction,first);
   return;
  }
  reply.textContent=Object.hasOwn(reactions,action)?reactions[action]:'Das klappt mit der Flasche nicht. Versuch ein anderes Verb.';
  input.select();
 };
 input.focus();
}
function menu(){
 open('Getränkekarte');
 for(const [name,description] of [
 ['Pilz Whisky','Alex Pilz hat diesem Whisky seinen Namen gegeben. Er kommt aus Norddeutschland und wird in kleinen Mengen von Hand gemacht. Jede Flasche hat ihre eigene Nummer. Die Schotten dürfen gern mal probieren.'],
 ['Absinth','Man nennt mich die „Grüne Fee“. Ich schmecke nach Wermut, Anis und Fenchel. Früher war ich bei Künstlern in Paris beliebt. In manchen Ländern war ich sogar verboten. Manche Leute sagen, dass man blind wird, wenn man mich trinkt. Viel Glück beim Genuss!'],
 ['Störtebeker Bier','Ein Pils, das keine Beschreibung braucht. Echte Männer trinken Störtebeker, tolle Frauen trinken Störtebeker und die Kinder trinken Störtebekers Malzbier. Die Familie ist Störtebeker. Wir sind alle Teil der Crew. Nordisch derbe!'],
 ['Vita Cola','Die DDR-Cola. Vita Cola gibt es seit 1958. Sie kommt aus Ostdeutschland und schmeckt nach Cola mit Zitrone. Frisch, spritzig und lecker! Im Osten sagt man: Nu, das schmeckt! Der Westen darf auch trinken! Prost, mein Gutster!']]){
 node('h3',name,body);node('p',description,body);}
}
function lore(){
 speak('lore','Lore_1',state.clues.has('diary')?()=>speak('lore','Lore_2',()=>find('advert'),'Werbezettel ansehen'):undefined,'Tagebuch zeigen');
}
function sto(){
 speak('sto','St_1',state.clues.has('poker')?()=>speak('sto','St_2',()=>find('mountain'),'Zettel ansehen'):undefined,'Pokerzettel zeigen');
}
function unlockRock(){
 if(!state.clues.has('heard-Lore_1')){message('Loreleyfelsen','Hört euch zuerst Loreleys Aussage an.');return;}
 message('Nebel am Rhein','Nebel zieht auf. Wie heißt der Felsen, auf dem Loreley zu Hause ist?');
 dialog.classList.add('fog-window');
 scene.classList.add('fog');
 ask(['Name des Felsens'],([name])=>['loreleyfelsen','loreleyfels'].includes(name),()=>{
  state.clues.add('rock');scene.classList.remove('fog');dialog.classList.remove('fog-window');
  render();message('Loreleyfelsen','Der Nebel lichtet sich. Jetzt könnt ihr nach dem Tagebuch suchen.');
 });
}
dialog.addEventListener('close',()=>{scene.classList.remove('fog');dialog.classList.remove('fog-window');});
function loreLock(){
 if(state.clues.has('lore-lock')){find('diary');return;}
 if(!state.clues.has('lock-tip')){message('Das Kölner Schloss','X. Mac kennt das Schloss. Fragt ihn nach einem Hinweis.');return;}
 open('Das Kölner Schloss');
 button(body,'X. Macs Hinweis anhören',()=>xmHint(xmStations.koeln));
 const lock=node('div','',body);lock.className='symbol-lock';
 const art=node('img','',lock);art.src='assets/k_puzz.png';art.alt='Kölschglas links, Kölner Dom in der Mitte, Stadtwappen rechts';
 const counts=[0,0,0];
 ['Kölsch','Dom','Wappen'].forEach((name,i)=>{
  const tile=button(lock,'0',()=>{
   counts[i]=(counts[i]+1)%5;tile.textContent=counts[i];
   tile.setAttribute('aria-label',name+': '+counts[i]);
  },'symbol-wheel');
  tile.style.left=(23.5+i*26.5)+'%';
  tile.setAttribute('aria-label',name+': 0');
 });
 const feedback=node('p','',body);feedback.setAttribute('role','status');
 button(body,'Schloss prüfen',()=>{
  if(counts[0]===3&&counts[1]===1&&counts[2]===3){
   state.clues.add('lore-lock');find('diary');
  }else feedback.textContent='Das Schloss bleibt zu. Prüft die Notiz und zählt die Kronen.';
 });
}
function harborStranger(){meetXm('hh');}
const warehouse=[
 '#########','#.......#','#..#....#','#.......#','#....#..#','#.......#','#########'
];
const barrelColors=['blau','gruen','gelb'];
const dockColors=['gruen','gelb','blau'];
const dockCells=[24,20,50];
const warehouseStart={player:46,barrels:[30,33,40]};
function warehousePuzzle(){
 if(state.clues.has('poker')){find('poker');return;}
 if(!state.clues.has('loading-plan')){message('Fässer','Ich weiß noch nicht, wohin die Fässer sollen. Fragt den Fremden.');return;}
 open('Fässer verladen');
 node('p','Schiebt jedes Fass auf seinen Ladeplatz. Ihr könnt Fässer nur schieben.',body);
 const plan=node('audio','',body);plan.controls=true;plan.src='audio/'+xmClip(xmStations.hh,7)+'.mp3';plan.setAttribute('aria-label','X. Macs Ladeplan');
 const grid=node('div','',body);grid.className='warehouse';grid.setAttribute('role','img');
 let position=warehouseStart;
 const history=[];
 const floor=warehouse.join('');
 const controls=node('div','',body);controls.className='warehouse-controls';
 const moves=node('p','',body);moves.setAttribute('role','status');
 function draw(){
  grid.replaceChildren();
  for(let i=0;i<floor.length;i++){
   const cell=node('div','',grid);cell.className=floor[i]==='#'?'warehouse-wall':'warehouse-floor';
   const dock=dockCells.indexOf(i), barrel=position.barrels.indexOf(i);
   if(dock>=0){
    const marker=node('span',['GR','GE','BL'][dock],cell);
    marker.className='dock '+dockColors[dock];
   }
   if(barrel>=0){
    const cask=node('span',['BL','GR','GE'][barrel],cell);
    cask.className='cask '+barrelColors[barrel];
    if(position.barrels[barrel]===dockCells[barrel])cask.classList.add('placed');
   }
   if(position.player===i)node('span','',cell).className='dockhand';
  }
  const loaded=position.barrels.filter((cell,i)=>cell===dockCells[i]).length;
  moves.textContent=loaded+' von 3 richtig · '+history.length+' Züge';
  grid.setAttribute('aria-label','Hafenlager. '+moves.textContent);
 }
 function step(delta){
  const next=position.player+delta;
  if(floor[next]!=='.')return;
  const barrels=[...position.barrels], index=barrels.indexOf(next);
  if(index>=0){
   const after=next+delta;
   if(floor[after]!=='.'||barrels.includes(after))return;
   barrels[index]=after;
  }
  history.push(position);position={player:next,barrels};draw();
  if(barrels.every((cell,i)=>cell===dockCells[i]))find('poker');
 }
 for(const [label,delta] of [['↑ Hoch',-9],['← Links',-1],['↓ Runter',9],['→ Rechts',1]])button(controls,label,()=>step(delta));
 button(controls,'Zug zurück',()=>{if(history.length){position=history.pop();draw();}});
 button(controls,'Neu starten',()=>{history.length=0;position=warehouseStart;draw();});
 body.onkeydown=e=>{
  const delta={ArrowUp:-9,ArrowLeft:-1,ArrowDown:9,ArrowRight:1}[e.key];
  if(delta===undefined)return;
  e.preventDefault();step(delta);
 };
 draw();
}
function playJingle(){
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)return;
 try{
  const context=new Context();
  context.resume().then(()=>{
   [523.25,659.25,783.99,1046.5].forEach((pitch,i)=>{
    const note=context.createOscillator(), volume=context.createGain(), time=context.currentTime+i*.105;
    note.type='triangle';note.frequency.value=pitch;volume.gain.setValueAtTime(.11,time);
    volume.gain.exponentialRampToValueAtTime(.001,time+.25);
    note.connect(volume).connect(context.destination);note.start(time);note.stop(time+.26);
   });
   setTimeout(()=>context.close(),850);
  }).catch(()=>context.close());
 }catch{/* Die Kiste öffnet sich auch ohne Jingle. */}
}
function revealTongue(){
 state.clues.add('tongue');playJingle();
 open('Die Goldene Zunge gefunden!');
 const reward=node('div','',body);reward.className='tongue-reward';reward.setAttribute('role','img');reward.setAttribute('aria-label','Goldene Zunge');
 button(body,'Weiter',()=>speak('rub','Ruebe_2',sentences,'Fall rekonstruieren'));
}
function chest(){
 if(state.clues.has('tongue')){speak('rub','Ruebe_2',sentences,'Fall rekonstruieren');return;}
 if(!state.clues.has('heard-Ruebe_1')){message('Kiste','Hört euch zuerst Rübezahls Aussage an.');return;}

 message('Kiste','Wie heißt das Zauberwort? Es ist nicht „Bitte“.');
 const d=node('details','',body);node('summary','Tipp ansehen',d);node('p','In einer Sage aus Hameln spielt ein Mann Flöte und fängt damit Ratten. Wie nennt man ihn?',d);
 ask(['Zauberwort'],([word])=>word==='rattenfanger',()=>{
 revealTongue();
 });
}
const rounds=[
 ['Zuerst',['stiehlt','Loreley','Richard','die Goldene Zunge.'],[3,1,0,2]],
 ['Danach',['nimmt','Störtebeker','die Zunge','aus Loreleys Zimmer.'],[3,0,1,2]],
 ['Beim Poker',['gewinnt','Rübezahl','die Zunge','gegen Störtebeker.'],[3,0,2,1]],
 ['Am Ende',['liegt','die Zunge','in einer Kiste','im Riesengebirge.'],[2,3,0,1]]
];
function sentences(){
 if(state.sentence===rounds.length){state.unlocked.add('hhkai');travel('hhkai');return;}
 const [start,words,order]=rounds[state.sentence];const selected=[];
 open('Satz '+(state.sentence+1)+' von '+rounds.length);
 node('p',start+' …',body);
 const slots=node('div','',body), pool=node('div','',body);slots.className='tiles slots';pool.className='tiles';
 const feedback=node('p','',body);feedback.setAttribute('role','status');
 function draw(){slots.replaceChildren();pool.replaceChildren();feedback.textContent='';
 for(const id of selected)button(slots,words[id],()=>{selected.splice(selected.indexOf(id),1);draw();});
 for(const id of order)if(!selected.includes(id))button(pool,words[id],()=>{selected.push(id);draw();});
 }
 draw();button(body,'Satz prüfen',()=>{
 if(selected.length===words.length&&selected.every((id,i)=>id===i)){state.sentence++;sentences();}
 else feedback.textContent='Schaut euch die Reihenfolge noch einmal an.';
 });
}
function kai(){
 if(state.clues.has('paid')){
  speak('kai','Kai_2',()=>{
   message('Eine letzte Frage','Was heißt „Leichenschmaus“ auf Chinesisch?');
   ask(['Antwort in Pinyin'],([answer])=>answer==='sangyan',()=>travel('secret'));
  },'Zum Leichenschmaus');
  return;
 }
 speak('kai','Kai_1',()=>{state.clues.add('paid');travel('end');},'Richards Nachricht öffnen');
}
function render(){
 const [file,name]=places[state.place];scene.replaceChildren();tools.replaceChildren();statusLine.textContent=name;
 const img=node('img','',scene);img.src='assets/'+(file==='bar'&&!state.clues.has('note')?'bar_1':file)+'.png';img.alt=name;
 if(state.place==='title'){button(scene,'Spiel starten',()=>travel('bar'),'start');return;}
 if(['end','secret'].includes(state.place)){button(scene,'Zurück zum Richtplatz',()=>travel('hhkai'),'start');return;}
 button(tools,'Karte',map);button(tools,'Akte',archive);button(tools,'Dossier',dossier);
 if(tickets[state.place])button(tools,'Richard',richard);
 button(tools,'Klickstellen zeigen',toggle);
 const reading=xmStations[state.place];
 if(reading){
  const read=()=>xmBook(reading);
  const objects={
   bar:['MB',[48,39,12,10]],
   koeln:['RFK',[62,82,15,10]],
   hh:['HHA',[4,39,13,12]]
  };
  const [asset,position]=objects[state.place];
  hot(reading.book,position,read,asset);
  scene.lastElementChild.classList.add('single','reading-hotspot');
  button(tools,reading.book+' lesen',read);
 }
 switch(state.place){
 case 'bar':
 hot('Richard',[8,35,12,25],richard,'rich');
 hot('Wirtin',[63,36,12,31],()=>speak('wirt','Wirtin_1'),'wirt');
 hot('Getränkekarte',[72,74,21,17],menu);
 button(tools,'Mit X. Mac sprechen',barStranger);
 hot('X. Mac',[61,49,9,30],barStranger,'fremder');
 hot('Whisky',[14,63,11,28],()=>bottle('Pilz Whisky'));
 hot('Absinth',[27,53,8,38],()=>bottle('Absinth'));
 hot('Bier',[39,59,8,32],()=>bottle('Störtebeker Pils'));
 hot('Cola',[49,61,8,30],()=>bottle('Vita Cola'));
 break;
 case 'koeln':
 hot('Loreley',[67,44,12,33],lore,'lore');
 hot('X. Mac',[49,45,10,33],()=>meetXm('koeln'),'fremder');
 button(tools,'Mit X. Mac sprechen',()=>meetXm('koeln'));
 if(state.clues.has('rock'))hot('Schloss am Tagebuch',[79,45,18,39],loreLock);
 else hot('Zum Felsen',[79,45,18,39],unlockRock);
 break;
 case 'hh':
 hot('Störtebeker',[33,42,13,40],sto,'sto');
 button(tools,'Mit X. Mac sprechen',harborStranger);
 hot('X. Mac',[66,32,12,40],harborStranger,'fremder');
 hot('Fass',[17,63,12,25],warehousePuzzle);
 break;
 case 'rb':
 hot('Rübezahl',[48,46,14,34],()=>speak('rub','Ruebe_1'),'rub');
 hot('Kiste mit Ratten',[67,64,24,29],chest);
 scene.lastElementChild.classList.add('rat-chest');
 break;
 case 'hhkai':
 button(tools,'Mann am Kai',kai);
 hot('Mann am Kai',[46,23,32,68],kai,'kai');
 scene.lastElementChild.classList.add('single');
 if(state.clues.has('paid'))button(tools,'Abspann',()=>travel('end'));
 break;
 }
}
function toggle(){state.show=!state.show;scene.classList.toggle('show',state.show);}
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!dialog.open&&!e.target.closest('button,input,textarea,select,a,[contenteditable]')&& !['title','end','secret'].includes(state.place)){e.preventDefault();toggle();}});
render();
