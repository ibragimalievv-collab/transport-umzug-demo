'use strict';
(() => {
  const I18N = {
    de: {
      locale:'de-DE', service:{moebeltransport:'Möbeltransport',umzug:'Umzug',kleintransport:'Kleintransport',gewerbetransport:'Gewerbetransport'},
      items:[['Sofas','Sofa'],['Schränke','Schrank'],['Betten','Bett'],['Tische','Tisch'],['Stühle','Stuhl'],['Kartons','Karton']],
      floors:['Erdgeschoss','1. Etage','2. Etage','3. Etage','4. Etage','5. Etage oder höher','Untergeschoss / Keller','Noch offen'],
      lifts:{unknown:'Unbekannt',yes:'Ja, Maße noch prüfen',no:'Nein'},carries:{unknown:'Noch offen',short:'Bis 10 m',medium:'10–30 m',long:'Mehr als 30 m'},
      extras:{packen:'Verpackung besprechen',montage:'Demontage / Montage besprechen',tragen:'Tragehilfe besprechen',haltezone:'Haltemöglichkeit / Halteverbotszone klären'},
      heading:['Wo beginnt der Weg?','Was kommt mit?','Wie sieht es vor Ort aus?','Alles Wichtige an einem Ort.'],
      intro:['Pflichtangaben sind mit * markiert. Stadt oder Postleitzahl genügt; bitte keine genaue Wohnadresse eingeben.','Anzahl eintragen oder weitere Gegenstände unten beschreiben. Mindestens eine dieser Angaben ist erforderlich.','Zugänge und Zeitpunkt helfen, den Aufwand zu verstehen. Unbekannte Details dürfen offenbleiben.','Ihre Vorbereitung ist fertig. Prüfen Sie die Angaben und nehmen Sie die Übersicht mit.'],
      serviceLabel:'Was planen Sie? *',from:'Abholort *',to:'Zielort *',place:'Stadt oder Postleitzahl',routeNote:'Ortsangaben sind eine Planungshilfe und bestätigen keine Routenverfügbarkeit.',
      volume:'Richtwert der gewählten Gegenstände',methodTitle:'Wie wird der Richtwert berechnet?',
      method:'Anzahl × fester Planungswert: Sofa 1,5 m³, Schrank 2,0 m³, Bett 1,2 m³, Tisch 0,8 m³, Stuhl 0,2 m³, Karton 0,08 m³. Das ist eine grobe Rechenhilfe. Tatsächliche Maße, Verpackung, Zerlegung und Stapelbarkeit können stark abweichen. Freitext wird nicht eingerechnet. Gewicht, Fahrzeug und Nutzlast werden nicht geprüft.',
      notes:'Weitere Gegenstände / Besonderheiten',notesExample:'Zum Beispiel: 1 Spiegel, ca. 120 × 70 cm, zerbrechlich',notesHint:'Maximal 600 Zeichen. Bitte keine Namen, Kontaktdaten oder sensiblen Informationen.',
      pickup:'A / Abholung',arrival:'B / Ankunft',floor:'Etage',lift:'Passender Aufzug vorhanden?',carry:'Trageweg ab Fahrzeug',time:'Zeitpunkt',flexible:'Noch offen / flexibel',fixed:'Wunschtermin angeben',date:'Wunschtermin *',dateHint:'Ein Wunschdatum ist keine Reservierung.',
      extrasTitle:'Zusätzlichen Bedarf vormerken (optional)',extrasNote:'Diese Auswahl ist keine Zusage, dass die Leistung später angeboten werden kann.',
      back:'← Zurück',next:'Weiter →',create:'Übersicht erstellen →',progress:(n)=>`Schritt ${n} von 4 · Nur auf Ihrem Gerät`,
      routeTitle:'Route & Vorhaben',itemsTitle:'Transportgut',accessTitle:'Zugänge',detailsTitle:'Zeitpunkt & Bedarf',fromSummary:'Von',toSummary:'Nach',pickupSummary:'Abholung',arrivalSummary:'Ankunft',liftSummary:'Aufzug',carrySummary:'Trageweg',extraItems:'Weitere Gegenstände laut Beschreibung',volumeSummary:'Richtwert gewählter Gegenstände',notesSummary:'Weitere Angaben',noExtras:'Kein zusätzlicher Bedarf vorgemerkt.',wishSuffix:'Wunsch, nicht bestätigt',
      editRoute:'Route ändern',editItems:'Transportgut ändern',editAccess:'Zugänge ändern',editDetails:'Details ändern',notSent:'Die Übersicht wurde nicht versendet.',summaryNote:'Sie bleibt in dieser Seite, bis Sie neu laden oder die Eingaben löschen. Es gibt keinen Anfrageempfänger und keine Buchung. Freitext ist im Volumenrichtwert nicht enthalten.',
      download:'Übersicht herunterladen',print:'Drucken / als PDF',downloadHint:'Download als Textdatei. PDF über den Druckdialog Ihres Geräts.',downloadStarted:'Der Dateidownload wurde gestartet. Bitte prüfen Sie den Downloadbereich Ihres Browsers. Es wurde nichts versendet.',reset:'Eingaben löschen und neu beginnen',file:'mein-transportplan.txt',
      routeError:(which)=>`Bitte geben Sie einen ${which==='from'?'Abholort':'Zielort'} mit 2 bis 80 Zeichen an.`,itemError:(label,max)=>`Bitte für ${label} eine ganze Zahl von 0 bis ${max} eingeben.`,loadError:'Bitte mindestens einen Gegenstand auswählen oder weitere Gegenstände mit mindestens drei Zeichen beschreiben.',notesError:'Die Beschreibung darf höchstens 600 Zeichen enthalten.',dateError:'Bitte wählen Sie einen gültigen Wunschtermin ab heute oder lassen Sie den Zeitpunkt offen.',
      exportTitle:'TRAGFALK — MEINE VORBEREITUNG',created:'Erstellt',printTitle:'Mein Transportplan',warning:'VORSCHAU — UNTERNEHMEN IN VORBEREITUNG\nDies ist eine lokale Vorbereitung, keine versendete Anfrage, kein Angebot und keine Buchung. Kein Transportanbieter hat die Angaben erhalten. Leistungen und Verfügbarkeit sind nicht bestätigt.',exportFooter:'Kein Preis berechnet. Keine Reservierung. Die Datei wurde auf Wunsch lokal erstellt.',
      languageError:'Der Sprachwechsel konnte nicht geladen werden. Ihr Plan bleibt erhalten. Bitte versuchen Sie es erneut.',switchNote:'Beim Sprachwechsel bleibt Ihr Plan in dieser geöffneten Seite erhalten. Neuladen setzt ihn zurück.'
    },
    ru: {
      locale:'ru-RU',service:{moebeltransport:'Перевозка мебели',umzug:'Переезд',kleintransport:'Небольшая перевозка',gewerbetransport:'Перевозки для бизнеса'},
      items:[['Диваны','Диван'],['Шкафы','Шкаф'],['Кровати','Кровать'],['Столы','Стол'],['Стулья','Стул'],['Коробки','Коробка']],
      floors:['Первый этаж (Erdgeschoss)','Этаж над первым (1. OG)','2. OG — два этажа над первым','3. OG — три этажа над первым','4. OG — четыре этажа над первым','5. OG и выше','Цоколь / подвал','Пока неизвестно'],
      lifts:{unknown:'Пока неизвестно',yes:'Да, размеры нужно проверить',no:'Нет'},carries:{unknown:'Пока неизвестно',short:'До 10 м',medium:'10–30 м',long:'Более 30 м'},
      extras:{packen:'Обсудить упаковку',montage:'Обсудить разборку / сборку',tragen:'Обсудить помощь с переноской',haltezone:'Уточнить место остановки / временный запрет парковки'},
      heading:['Откуда и куда?','Что нужно перевезти?','Какие условия на месте?','Всё важное — в одном плане.'],
      intro:['Обязательные поля отмечены *. Достаточно города или индекса; точный домашний адрес вводить не нужно.','Укажите количество или опишите другие вещи ниже. Нужно заполнить хотя бы один из этих вариантов.','Условия доступа и дата помогают понять объём работы. Неизвестные детали можно оставить открытыми.','Подготовка завершена. Проверьте сведения и сохраните план у себя.'],
      serviceLabel:'Что вы планируете? *',from:'Место отправления *',to:'Место назначения *',place:'Город или почтовый индекс',routeNote:'Ввод маршрута помогает подготовить план, но не подтверждает возможность перевозки.',
      volume:'Условный объём выбранных предметов',methodTitle:'Как рассчитывается объём?',method:'Количество × условный объём: диван — 1,5 м³, шкаф — 2,0 м³, кровать — 1,2 м³, стол — 0,8 м³, стул — 0,2 м³, коробка — 0,08 м³. Это грубая подсказка для планирования. Реальные размеры, упаковка, разборка и возможность укладки могут сильно отличаться. Предметы из свободного описания не учитываются. Вес, автомобиль и грузоподъёмность не проверяются.',
      notes:'Другие вещи / особенности',notesExample:'Например: 1 зеркало, около 120 × 70 см, хрупкое',notesHint:'До 600 символов. Не указывайте имена, контакты и конфиденциальные сведения.',
      pickup:'А / Отправление',arrival:'Б / Прибытие',floor:'Этаж по немецкой нумерации',lift:'Есть подходящий лифт?',carry:'Расстояние переноски от машины',time:'Когда нужна перевозка?',flexible:'Пока неизвестно / гибкая дата',fixed:'Указать желаемую дату',date:'Желаемая дата *',dateHint:'Желаемая дата не означает бронирование.',
      extrasTitle:'Отметить дополнительную помощь (необязательно)',extrasNote:'Выбор не подтверждает, что эта услуга будет доступна после запуска.',
      back:'← Назад',next:'Далее →',create:'Создать план →',progress:(n)=>`Шаг ${n} из 4 · Только на вашем устройстве`,
      routeTitle:'Маршрут и задача',itemsTitle:'Что перевозим',accessTitle:'Условия доступа',detailsTitle:'Дата и дополнительная помощь',fromSummary:'Откуда',toSummary:'Куда',pickupSummary:'Отправление',arrivalSummary:'Прибытие',liftSummary:'Лифт',carrySummary:'Переноска',extraItems:'Другие вещи по описанию',volumeSummary:'Условный объём выбранных предметов',notesSummary:'Дополнительно',noExtras:'Дополнительная помощь не отмечена.',wishSuffix:'пожелание, не подтверждено',
      editRoute:'Изменить маршрут',editItems:'Изменить список вещей',editAccess:'Изменить условия доступа',editDetails:'Изменить детали',notSent:'План никуда не отправлен.',summaryNote:'Он остаётся в открытой странице до перезагрузки или сброса. Получатель заявки ещё не подключён; бронирования нет. Вещи из свободного описания не включены в оценку объёма.',
      download:'Скачать план',print:'Печать / сохранить PDF',downloadHint:'Скачивание текстового файла. PDF можно сохранить через диалог печати устройства.',downloadStarted:'Скачивание запущено. Проверьте раздел загрузок браузера. Ничего не отправлено.',reset:'Удалить введённое и начать заново',file:'moy-plan-perevozki.txt',
      routeError:(which)=>`Укажите ${which==='from'?'место отправления':'место назначения'}: от 2 до 80 символов.`,itemError:(label,max)=>`В поле «${label}» нужно целое число от 0 до ${max}.`,loadError:'Выберите хотя бы один предмет или опишите другие вещи — не менее трёх символов.',notesError:'Описание не должно превышать 600 символов.',dateError:'Выберите корректную дату не раньше сегодняшней или оставьте дату открытой.',
      exportTitle:'TRAGFALK — МОЙ ПЛАН ПЕРЕВОЗКИ',created:'Создано',printTitle:'Мой план перевозки',warning:'ПРЕДВАРИТЕЛЬНАЯ ВЕРСИЯ — КОМПАНИЯ В ПОДГОТОВКЕ\nЭто локальный черновик, а не отправленная заявка, предложение или бронирование. Ни один перевозчик не получил эти сведения. Услуги и возможность перевозки не подтверждены.',exportFooter:'Стоимость не рассчитана. Бронирования нет. Файл создан локально по вашему действию.',
      languageError:'Не удалось загрузить другой язык. Ваш план сохранён в странице. Попробуйте ещё раз.',switchNote:'При смене языка план сохраняется в открытой странице. Перезагрузка сбрасывает его.'
    },
    en: {
      locale:'en-GB',service:{moebeltransport:'Furniture transport',umzug:'Moving home',kleintransport:'Small-load transport',gewerbetransport:'Business transport'},
      items:[['Sofas','Sofa'],['Wardrobes','Wardrobe'],['Beds','Bed'],['Tables','Table'],['Chairs','Chair'],['Boxes','Box']],
      floors:['Ground floor','1st floor above ground','2nd floor above ground','3rd floor above ground','4th floor above ground','5th floor or higher','Basement','Not yet known'],
      lifts:{unknown:'Not yet known',yes:'Yes, dimensions still to check',no:'No'},carries:{unknown:'Not yet known',short:'Up to 10 m',medium:'10–30 m',long:'More than 30 m'},
      extras:{packen:'Discuss packing',montage:'Discuss disassembly / assembly',tragen:'Discuss carrying assistance',haltezone:'Check stopping space / temporary parking restrictions'},
      heading:['Where does the journey begin?','What needs to move?','What is access like?','Everything important, in one plan.'],
      intro:['Required fields are marked *. A town or postcode is enough; please do not enter an exact home address.','Enter quantities or describe other items below. At least one of these options is required.','Access and timing help clarify the work involved. You can leave unknown details open.','Your preparation is ready. Check the details and keep a copy of your plan.'],
      serviceLabel:'What are you planning? *',from:'Collection location *',to:'Destination *',place:'Town or postcode',routeNote:'Locations help you prepare a plan; they do not confirm route availability.',
      volume:'Planning volume of selected items',methodTitle:'How is this estimate calculated?',method:'Quantity × fixed planning value: sofa 1.5 m³, wardrobe 2.0 m³, bed 1.2 m³, table 0.8 m³, chair 0.2 m³, box 0.08 m³. This is a rough planning aid. Actual dimensions, packing, disassembly and stackability may differ considerably. Free-text items are excluded. Weight, vehicle suitability and payload are not checked.',
      notes:'Other items / special considerations',notesExample:'For example: 1 mirror, approx. 120 × 70 cm, fragile',notesHint:'Up to 600 characters. Please do not include names, contact details or sensitive information.',
      pickup:'A / Collection',arrival:'B / Delivery',floor:'Floor (German numbering)',lift:'Is there a suitable lift?',carry:'Carrying distance from vehicle',time:'Timing',flexible:'Not yet known / flexible',fixed:'Enter a preferred date',date:'Preferred date *',dateHint:'A preferred date is not a reservation.',
      extrasTitle:'Note any extra help needed (optional)',extrasNote:'Selecting an option does not confirm that the service will be available after launch.',
      back:'← Back',next:'Continue →',create:'Create overview →',progress:(n)=>`Step ${n} of 4 · Only on your device`,
      routeTitle:'Route & task',itemsTitle:'Items to move',accessTitle:'Access',detailsTitle:'Timing & extra help',fromSummary:'From',toSummary:'To',pickupSummary:'Collection',arrivalSummary:'Delivery',liftSummary:'Lift',carrySummary:'Carrying distance',extraItems:'Other items as described',volumeSummary:'Planning volume of selected items',notesSummary:'Other details',noExtras:'No additional help noted.',wishSuffix:'preferred, not confirmed',
      editRoute:'Edit route',editItems:'Edit items',editAccess:'Edit access',editDetails:'Edit details',notSent:'This overview has not been sent.',summaryNote:'It stays in this open page until you reload or clear your entries. There is no request recipient and no booking. Free-text items are not included in the volume estimate.',
      download:'Download overview',print:'Print / save as PDF',downloadHint:'Download a text file. To save a PDF, use your device’s print dialog.',downloadStarted:'The download has started. Please check your browser’s downloads. Nothing has been sent.',reset:'Clear entries and start again',file:'my-transport-plan.txt',
      routeError:(which)=>`Please enter a ${which==='from'?'collection location':'destination'} with 2 to 80 characters.`,itemError:(label,max)=>`Enter a whole number from 0 to ${max} for ${label.toLowerCase()}.`,loadError:'Select at least one item or describe other items using at least three characters.',notesError:'The description must not exceed 600 characters.',dateError:'Choose a valid date from today onwards, or leave the timing open.',
      exportTitle:'TRAGFALK — MY TRANSPORT PLAN',created:'Created',printTitle:'My transport plan',warning:'PREVIEW — BUSINESS IN PREPARATION\nThis is a local draft, not a submitted request, quote or booking. No transport provider has received these details. Services and availability are not confirmed.',exportFooter:'No price calculated. No reservation. This file was created locally at your request.',
      languageError:'The other language could not be loaded. Your plan is still here. Please try again.',switchNote:'Your plan stays in this open page when you switch language. Reloading clears it.'
    }
  };
  const MORE_COPY={
    de:{quickTitle:'Was möchten Sie bewegen?',quickServices:{moebeltransport:'Möbel',umzug:'Umzug',kleintransport:'Kleintransport',gewerbetransport:'Gewerbe'},quickContinue:'Weiter zum Transportgut →',quickNote:'Stadt oder Postleitzahl genügt. Ohne Registrierung; Ihre Angaben bleiben in dieser geöffneten Seite.',quickDateTitle:'Wunschtermin ergänzen (optional)',quickDateLabel:'Wunschtermin',quickDateHint:'Leer lassen, wenn der Zeitpunkt noch offen ist. Kein bestätigter Termin.',generalItems:'Allgemein · ohne Raumzuordnung',noGeneralItems:'Keine allgemein erfassten Gegenstände.',roomsTitle:'Nach Räumen ergänzen (optional)',roomsNote:'Zählen Sie jeden Gegenstand nur einmal: entweder allgemein oder im passenden Raum. Raumangaben ergänzen die allgemeine Liste; nichts wird automatisch übernommen.',rooms:{living:'Wohnzimmer',bedroom:'Schlafzimmer',kitchen:'Küche',office:'Arbeitszimmer',storage:'Keller / Abstellraum'},roomMethod:'Für alle Räume gelten dieselben festen Planungswerte. Allgemeine Angaben und Raumeinträge werden addiert.',itemCount:n=>`${n} ${n===1?'Gegenstand':'Gegenstände'}`,notKnown:'Noch offen',serviceError:'Bitte wählen Sie eine Transportart.'},
    ru:{quickTitle:'Что нужно перевезти?',quickServices:{moebeltransport:'Мебель',umzug:'Переезд',kleintransport:'Малый груз',gewerbetransport:'Для бизнеса'},quickContinue:'Перейти к списку вещей →',quickNote:'Достаточно города или индекса. Без регистрации; сведения остаются в этой открытой странице.',quickDateTitle:'Добавить желаемую дату (необязательно)',quickDateLabel:'Желаемая дата',quickDateHint:'Оставьте пустым, если дата пока неизвестна. Дата не подтверждена.',generalItems:'Общий список · без привязки к комнате',noGeneralItems:'В общем списке пока нет предметов.',roomsTitle:'Дополнить по комнатам (необязательно)',roomsNote:'Считайте каждый предмет только один раз: в общем списке или в подходящей комнате. Списки комнат дополняют общий; предметы не копируются автоматически.',rooms:{living:'Гостиная',bedroom:'Спальня',kitchen:'Кухня',office:'Кабинет',storage:'Подвал / кладовая'},roomMethod:'Во всех комнатах используются те же условные объёмы. Количество из общего списка и комнат суммируется.',itemCount:n=>`${n} ${n%10===1&&n%100!==11?'предмет':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'предмета':'предметов'}`,notKnown:'Пока неизвестно',serviceError:'Выберите вид перевозки.'},
    en:{quickTitle:'What would you like to move?',quickServices:{moebeltransport:'Furniture',umzug:'Home move',kleintransport:'Small load',gewerbetransport:'Business'},quickContinue:'Continue to your items →',quickNote:'A town or postcode is enough. No registration; your details stay in this open page.',quickDateTitle:'Add a preferred date (optional)',quickDateLabel:'Preferred date',quickDateHint:'Leave blank if the timing is still open. This date is not confirmed.',generalItems:'General items · not assigned to a room',noGeneralItems:'No general items entered.',roomsTitle:'Add items by room (optional)',roomsNote:'Count each item only once: either in the general list or in its room. Room entries add to the general list; nothing is copied automatically.',rooms:{living:'Living room',bedroom:'Bedroom',kitchen:'Kitchen',office:'Home office',storage:'Basement / storage'},roomMethod:'Every room uses the same fixed planning values. General items and room entries are added together.',itemCount:n=>`${n} ${n===1?'item':'items'}`,notKnown:'Not yet known',serviceError:'Please choose a transport type.'}
  };
  const inventory=[{key:'sofa',factor:1.5,max:99},{key:'schrank',factor:2,max:99},{key:'bett',factor:1.2,max:99},{key:'tisch',factor:.8,max:99},{key:'stuhl',factor:.2,max:99},{key:'karton',factor:.08,max:500}];
  const rooms=[{key:'living',items:['sofa','schrank','tisch','stuhl','karton']},{key:'bedroom',items:['bett','schrank','karton']},{key:'kitchen',items:['tisch','stuhl','karton']},{key:'office',items:['tisch','stuhl','schrank','karton']},{key:'storage',items:['schrank','karton']}];
  const floorValues=['0','1','2','3','4','5+','UG','?'];
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const validDate=value=>{const d=new Date(value+'T12:00:00');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(d.getTime())&&d.getFullYear()===Number(value.slice(0,4))&&d.getMonth()+1===Number(value.slice(5,7))&&d.getDate()===Number(value.slice(8,10))&&value>=today();};
  let destroy=()=>{};
  function boot(memory=null){
    destroy();
    const controller=new AbortController(),signal=controller.signal;
    destroy=()=>controller.abort();
    const on=(element,event,fn)=>element?.addEventListener(event,fn,{signal});
    const lang=Object.hasOwn(I18N,document.documentElement.lang)?document.documentElement.lang:'de';
    const u={...I18N[lang],...MORE_COPY[lang]};
    const methodText=u.method+' '+u.roomMethod;
    const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-nav');
    const closeMenu=()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');};
    on(menu,'click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav?.classList.toggle('open',open);});
    on(nav,'click',e=>{if(e.target.closest('a'))closeMenu();});
    on(document,'keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){closeMenu();menu.focus();}});
    const app=document.querySelector('#planner-app');if(!app)return;
    const form=document.querySelector('#planner-form'),content=document.querySelector('#step-content'),errors=document.querySelector('#form-errors'),previous=document.querySelector('#previous-step'),next=document.querySelector('#next-step'),progress=document.querySelector('#planner-progress');
    const tabs=[...document.querySelectorAll('.planner-tabs li')];
    const params=new URLSearchParams(location.search);
    const defaultService=Object.hasOwn(u.service,params.get('leistung'))?params.get('leistung'):'moebeltransport';
    const initialState=()=>({service:defaultService,from:'',to:'',items:Object.fromEntries(inventory.map(i=>[i.key,0])),roomItems:Object.fromEntries(rooms.map(room=>[room.key,Object.fromEntries(room.items.map(key=>[key,0]))])),notes:'',fromFloor:'?',toFloor:'?',fromLift:'unknown',toLift:'unknown',fromCarry:'unknown',toCarry:'unknown',dateStyle:'flexible',date:'',extras:[]});
    let state=memory?memory.state:initialState(),step=memory?memory.step:0,switching=false,routeEditor='main',dateEditor='main';
    // Missing room keys can occur when an already open plan changes language after an upgrade.
    state.roomItems??={};
    for(const room of rooms){state.roomItems[room.key]??={};for(const key of room.items)state.roomItems[room.key][key]??=0;}
    const itemNames=item=>u.items[inventory.indexOf(item)];
    const itemByKey=key=>inventory.find(item=>item.key===key);
    const countValid=(item,value)=>String(value).trim()!==''&&Number.isFinite(Number(value))&&Number.isInteger(Number(value))&&Number(value)>=0&&Number(value)<=item.max;
    const records=()=>[...inventory.map(item=>({item,value:state.items[item.key],id:'item-'+item.key,label:itemNames(item)[0]})),...rooms.flatMap(room=>room.items.map(key=>{const item=itemByKey(key);return {item,value:state.roomItems[room.key][key],id:`room-${room.key}-${key}`,label:u.rooms[room.key]+' · '+itemNames(item)[0]};}))];
    const allCountsValid=()=>records().every(({item,value})=>countValid(item,value));
    const volume=()=>allCountsValid()?records().reduce((sum,{item,value})=>sum+Number(value)*item.factor,0):null;
    const volumeText=()=>{const total=volume();return total===null?'—':new Intl.NumberFormat(u.locale,{minimumFractionDigits:1,maximumFractionDigits:1}).format(total)+(lang==='ru'?' м³':' m³');};
    const hasItems=()=>records().some(({item,value})=>countValid(item,value)&&Number(value)>0);
    const roomCount=room=>room.items.every(key=>countValid(itemByKey(key),state.roomItems[room.key][key]))?room.items.reduce((sum,key)=>sum+Number(state.roomItems[room.key][key]),0):null;
    const options=(list,selected)=>list.map(([value,label])=>`<option value="${escape(value)}"${value===selected?' selected':''}>${escape(label)}</option>`).join('');
    const pairs=obj=>Object.entries(obj);
    const floor=value=>u.floors[floorValues.indexOf(value)]||u.floors[7];
    const quickMount=document.querySelector('#quick-start-mount');
    let quickForm=null,quickFrom=null,quickTo=null,quickDate=null,quickErrors=null;
    if(quickMount){
      quickMount.closest('.hero-copy')?.classList.add('has-quick-start');
      quickMount.innerHTML=`<form class="quick-start" id="quick-plan-form" novalidate><fieldset class="quick-services"><legend>${escape(u.quickTitle)}</legend>${pairs(u.quickServices).map(([key,label])=>`<label class="quick-service"><input type="radio" name="quick-service" value="${key}"${key===state.service?' checked':''}><span>${escape(label)}</span></label>`).join('')}</fieldset><div class="quick-route"><div class="field"><label for="quick-from">${escape(u.from)}</label><input id="quick-from" name="quick-from" maxlength="80" autocomplete="off" required placeholder="${escape(u.place)}" value="${escape(state.from)}"></div><div class="field"><label for="quick-to">${escape(u.to)}</label><input id="quick-to" name="quick-to" maxlength="80" autocomplete="off" required placeholder="${escape(u.place)}" value="${escape(state.to)}"></div></div><details class="quick-date"${state.dateStyle==='fixed'?' open':''}><summary>${escape(u.quickDateTitle)}</summary><div class="field"><label for="quick-date">${escape(u.quickDateLabel)}</label><input type="date" id="quick-date" name="quick-date" min="${today()}" aria-describedby="quick-date-hint" value="${escape(state.dateStyle==='fixed'?state.date:'')}"><span class="hint" id="quick-date-hint">${escape(u.quickDateHint)}</span></div></details><div class="error-box" id="quick-errors" role="alert"></div><div class="quick-actions"><button type="submit" class="btn arrow">${escape(u.quickContinue)}</button></div><p class="quick-note">${escape(u.quickNote)}</p></form>`;
      quickForm=quickMount.querySelector('#quick-plan-form');quickFrom=quickForm.querySelector('#quick-from');quickTo=quickForm.querySelector('#quick-to');quickDate=quickForm.querySelector('#quick-date');quickErrors=quickForm.querySelector('#quick-errors');
    }
    const context=document.createElement('div');context.id='plan-context';context.className='plan-context';
    const contextRoute=document.createElement('p');contextRoute.className='plan-context-route';
    const contextMeta=document.createElement('p');contextMeta.className='plan-context-meta';context.append(contextRoute,contextMeta);form.prepend(context);
    function setValue(field,value){if(field&&field.value!==String(value))field.value=String(value);}
    function updateSharedUI(){
      setValue(quickFrom,state.from);setValue(quickTo,state.to);setValue(quickDate,state.dateStyle==='fixed'?state.date:'');
      quickForm?.querySelectorAll('[name="quick-service"]').forEach(field=>{field.checked=field.value===state.service;});
      setValue(form.querySelector('#from'),state.from);setValue(form.querySelector('#to'),state.to);setValue(form.querySelector('#service'),state.service);
      setValue(form.querySelector('#date'),state.date);
      form.querySelectorAll('[name="dateStyle"]').forEach(field=>{field.checked=field.value===state.dateStyle;});
      const dateField=form.querySelector('#date-field');if(dateField)dateField.hidden=state.dateStyle!=='fixed';
      const heroFrom=document.querySelector('#hero-route-from'),heroTo=document.querySelector('#hero-route-to');
      if(heroFrom)heroFrom.textContent=state.from.trim()||u.fromSummary;
      if(heroTo)heroTo.textContent=state.to.trim()||u.toSummary;
      contextRoute.textContent=(state.from.trim()||u.notKnown)+' → '+(state.to.trim()||u.notKnown);
      contextMeta.textContent=u.service[state.service]+(hasItems()&&allCountsValid()?' · '+u.volumeSummary+': '+volumeText():'');
      const output=form.querySelector('#volume-value');if(output)output.textContent=volumeText();
      let total=0,valid=true;
      for(const room of rooms){const count=roomCount(room),badge=form.querySelector(`[data-room-count="${room.key}"]`);if(badge)badge.textContent=count===null?'—':u.itemCount(count);if(count===null)valid=false;else total+=count;}
      const totalBadge=form.querySelector('[data-room-count="all"]');if(totalBadge)totalBadge.textContent=valid?u.itemCount(total):'—';
      if(step===3){const sections=summarySections();content.querySelectorAll('[data-summary-text]').forEach((paragraph,index)=>{paragraph.textContent=sections[index].text;});}
    }
    function readQuickRoute(){if(!quickForm)return;const selected=quickForm.querySelector('[name="quick-service"]:checked');if(selected&&Object.hasOwn(u.service,selected.value))state.service=selected.value;state.from=quickFrom.value;state.to=quickTo.value;}
    function readQuickDate(clear=false){if(!quickDate)return;if(quickDate.value){state.date=quickDate.value;state.dateStyle='fixed';}else {state.dateStyle='flexible';if(clear)state.date='';}}
    function readField(field){
      if(!field.name||field.name==='extra'||(field.type==='radio'&&!field.checked))return;
      if(field.name.startsWith('item-')){const key=field.name.slice(5);if(Object.hasOwn(state.items,key))state.items[key]=field.value;}
      else if(field.name.startsWith('room-')){const [,roomKey,itemKey]=field.name.split('-');if(state.roomItems[roomKey]&&Object.hasOwn(state.roomItems[roomKey],itemKey))state.roomItems[roomKey][itemKey]=field.value;}
      else if(Object.hasOwn(state,field.name))state[field.name]=field.value;
    }
    function syncInputs(){
      form.querySelectorAll('input,select,textarea').forEach(readField);
      if(step===2)state.extras=[...form.querySelectorAll('[name="extra"]:checked')].map(field=>field.value);
      if(routeEditor==='quick'||!form.querySelector('#from'))readQuickRoute();
      if(dateEditor==='quick')readQuickDate();
      updateSharedUI();
    }
    function clearErrors(scope,errorBox){
      if(!scope||!errorBox)return;errorBox.textContent='';
      scope.querySelectorAll('[aria-invalid]').forEach(field=>{field.removeAttribute('aria-invalid');field.classList.remove('invalid');const ids=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==errorBox.id);if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby');});
    }
    function focusVisible(field,atStart=false){
      if(!field)return;
      let ancestor=field.parentElement;while(ancestor){if(ancestor.tagName==='DETAILS')ancestor.open=true;ancestor=ancestor.parentElement;}
      field.focus({preventScroll:true});field.scrollIntoView({block:atStart?'start':'center',behavior:'auto'});
    }
    function showErrors(invalid,errorBox){
      if(!invalid.length)return false;
      errorBox.textContent=invalid.map(entry=>entry[1]).join(' ');
      for(const [id] of invalid){const field=document.getElementById(id);if(!field)continue;field.setAttribute('aria-invalid','true');field.classList.add('invalid');const ids=new Set((field.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(errorBox.id);field.setAttribute('aria-describedby',[...ids].join(' '));}
      focusVisible(document.getElementById(invalid[0][0]));return true;
    }
    function routeErrors(prefix=''){
      const invalid=[];
      for(const key of ['from','to']){state[key]=state[key].trim();if(state[key].length<2||state[key].length>80)invalid.push([prefix+key,u.routeError(key)]);}
      if(!Object.hasOwn(u.service,state.service))invalid.unshift([prefix?'quick-from':'service',u.serviceError]);
      return invalid;
    }
    const stepButtons=tabs.map((tab,index)=>{
      const button=document.createElement('button');button.type='button';button.className='planner-step';
      while(tab.firstChild)button.append(tab.firstChild);tab.append(button);
      on(button,'click',()=>{if(index<step){syncInputs();step=index;render(true);}});return button;
    });
    function countInput(item,room=null){
      const id=room?`room-${room.key}-${item.key}`:`item-${item.key}`,value=room?state.roomItems[room.key][item.key]:state.items[item.key];
      return `<div class="item-count"><label for="${id}">${escape(itemNames(item)[0])}</label><input id="${id}" name="${id}" type="number" min="0" max="${item.max}" step="1" inputmode="numeric" value="${escape(value)}" aria-describedby="inventory-once"${room?` aria-label="${escape(u.rooms[room.key]+' · '+itemNames(item)[0])}"`:''}></div>`;
    }
    function roomInventory(){
      const any=rooms.some(room=>roomCount(room)>0),total=rooms.reduce((sum,room)=>sum+(roomCount(room)||0),0);
      return `<details class="room-inventory"${any?' open':''}><summary>${escape(u.roomsTitle)} <span class="room-count" data-room-count="all">${escape(u.itemCount(total))}</span></summary><div class="room-inventory-groups">${rooms.map(room=>`<details class="room-group"${roomCount(room)>0?' open':''}><summary>${escape(u.rooms[room.key])}<span class="room-count" data-room-count="${room.key}">${escape(u.itemCount(roomCount(room)||0))}</span></summary><div class="volume-list">${room.items.map(key=>countInput(itemByKey(key),room)).join('')}</div></details>`).join('')}</div></details>`;
    }
    function accessBlock(prefix,title){return `<section class="access-box" aria-labelledby="${prefix}-title"><h4 id="${prefix}-title">${escape(title)}</h4><div class="field"><label for="${prefix}Floor">${u.floor}</label><select id="${prefix}Floor" name="${prefix}Floor">${options(floorValues.map((v,i)=>[v,u.floors[i]]),state[prefix+'Floor'])}</select></div><div class="field"><label for="${prefix}Lift">${u.lift}</label><select id="${prefix}Lift" name="${prefix}Lift">${options(pairs(u.lifts),state[prefix+'Lift'])}</select></div><div class="field"><label for="${prefix}Carry">${u.carry}</label><select id="${prefix}Carry" name="${prefix}Carry">${options(pairs(u.carries),state[prefix+'Carry'])}</select></div></section>`;}
    function render(focus=false){
      errors.textContent='';
      tabs.forEach((tab,index)=>{const current=index===step;if(current)tab.setAttribute('aria-current','step');else tab.removeAttribute('aria-current');tab.classList.toggle('is-complete',index<step);stepButtons[index].disabled=index>=step;if(current)stepButtons[index].setAttribute('aria-current','step');else stepButtons[index].removeAttribute('aria-current');});
      previous.hidden=step===0;previous.textContent=u.back;next.hidden=step===3;progress.textContent=u.progress(step+1);next.textContent=step===2?u.create:u.next;
      const heading=`<h3 id="step-title" tabindex="-1">${u.heading[step]}</h3><p class="form-intro">${u.intro[step]}</p>`;
      if(step===0)content.innerHTML=heading+`<div class="form-grid"><div class="field full"><label for="service">${u.serviceLabel}</label><select name="service" id="service">${options(pairs(u.service),state.service)}</select></div><div class="field"><label for="from">${u.from}</label><input id="from" name="from" maxlength="80" autocomplete="off" value="${escape(state.from)}" placeholder="${u.place}" required></div><div class="field"><label for="to">${u.to}</label><input id="to" name="to" maxlength="80" autocomplete="off" value="${escape(state.to)}" placeholder="${u.place}" required></div></div><p class="form-intro" style="margin:20px 0 0">${u.routeNote}</p>`;
      if(step===1)content.innerHTML=heading+`<h4 class="general-inventory-title">${escape(u.generalItems)}</h4><div class="volume-list">${inventory.map(item=>countInput(item)).join('')}</div><p class="room-inventory-note" id="inventory-once">${escape(u.roomsNote)}</p>${roomInventory()}<div class="volume-output"><span>${u.volume}</span><strong id="volume-value" aria-live="polite">${volumeText()}</strong></div><details class="method"><summary>${u.methodTitle}</summary><p>${escape(methodText)}</p></details><div class="field"><label for="notes">${u.notes}</label><textarea id="notes" name="notes" maxlength="600" placeholder="${u.notesExample}">${escape(state.notes)}</textarea><span class="hint">${u.notesHint}</span></div>`;
      if(step===2)content.innerHTML=heading+`<div class="access-columns">${accessBlock('from',u.pickup)}${accessBlock('to',u.arrival)}</div><fieldset style="border:0;padding:0;margin:25px 0 0"><legend class="field-label">${u.time}</legend><div class="radio-group">${[['flexible',u.flexible],['fixed',u.fixed]].map(([value,label])=>`<label class="choice"><input type="radio" name="dateStyle" value="${value}"${state.dateStyle===value?' checked':''}>${label}</label>`).join('')}</div></fieldset><div class="field" id="date-field" style="margin-top:17px"${state.dateStyle!=='fixed'?' hidden':''}><label for="date">${u.date}</label><input id="date" name="date" type="date" min="${today()}" value="${escape(state.date)}"><span class="hint">${u.dateHint}</span></div><fieldset style="border:0;padding:0;margin:24px 0 0"><legend class="field-label">${u.extrasTitle}</legend><div class="extras">${pairs(u.extras).map(([value,label])=>`<label class="choice"><input type="checkbox" name="extra" value="${value}"${state.extras.includes(value)?' checked':''}>${label}</label>`).join('')}</div><p class="form-intro" style="margin-bottom:0">${u.extrasNote}</p></fieldset>`;
      if(step===3)content.innerHTML=heading+`<div class="summary-grid">${summarySections().map(section=>`<section class="summary-part"><h4>${escape(section.title)}</h4><p data-summary-text>${escape(section.text)}</p><button type="button" class="summary-edit" data-edit="${section.step}">${escape(section.edit)}</button></section>`).join('')}</div><div class="summary-notice"><strong>${u.notSent}</strong><br>${u.summaryNote}</div><div class="download-actions"><button class="btn arrow" type="button" id="download-plan">${u.download}</button><button class="btn outline" type="button" id="print-plan">${u.print}</button></div><p class="form-intro" id="export-status" aria-live="polite" style="margin-top:14px;margin-bottom:6px">${u.downloadHint}</p><button type="button" class="reset-btn" id="reset-plan">${u.reset}</button>`;
      updateSharedUI();
      if(focus)focusVisible(document.querySelector('#step-title'),true);
    }
    const dateText=()=>state.dateStyle!=='fixed'?u.flexible:validDate(state.date)?new Intl.DateTimeFormat(u.locale).format(new Date(state.date+'T12:00:00'))+` (${u.wishSuffix})`:u.dateError;
    function inventorySummary(){
      const general=inventory.filter(item=>countValid(item,state.items[item.key])&&Number(state.items[item.key])>0).map(item=>`${itemNames(item)[0]}: ${Number(state.items[item.key])}`).join(', ');
      const lines=[u.generalItems+': '+(general||u.noGeneralItems)];
      for(const room of rooms){const entries=room.items.filter(key=>countValid(itemByKey(key),state.roomItems[room.key][key])&&Number(state.roomItems[room.key][key])>0).map(key=>`${itemNames(itemByKey(key))[0]}: ${Number(state.roomItems[room.key][key])}`);if(entries.length)lines.push(u.rooms[room.key]+': '+entries.join(', '));}
      lines.push(u.volumeSummary+': '+volumeText());if(state.notes)lines.push(u.notesSummary+': '+state.notes);return lines.join('\n');
    }
    function summarySections(){return [
      {title:u.routeTitle,text:`${u.service[state.service]}\n${u.fromSummary}: ${state.from}\n${u.toSummary}: ${state.to}`,step:0,edit:u.editRoute},
      {title:u.itemsTitle,text:inventorySummary(),step:1,edit:u.editItems},
      {title:u.accessTitle,text:`${u.pickupSummary}: ${floor(state.fromFloor)} · ${u.liftSummary}: ${u.lifts[state.fromLift]} · ${u.carrySummary}: ${u.carries[state.fromCarry]}\n${u.arrivalSummary}: ${floor(state.toFloor)} · ${u.liftSummary}: ${u.lifts[state.toLift]} · ${u.carrySummary}: ${u.carries[state.toCarry]}`,step:2,edit:u.editAccess},
      {title:u.detailsTitle,text:`${dateText()}\n${state.extras.length?state.extras.map(key=>u.extras[key]).join('\n'):u.noExtras}`,step:2,edit:u.editDetails}
    ];}
    function validate(){
      syncInputs();clearErrors(form,errors);const invalid=[];
      if(step===0)invalid.push(...routeErrors());
      if(step===1){
        for(const {item,value,id,label} of records()){if(!countValid(item,value))invalid.push([id,u.itemError(label,item.max)]);}
        state.notes=state.notes.trim();if(state.notes.length>600)invalid.push(['notes',u.notesError]);if(!invalid.length&&!hasItems()&&state.notes.length<3)invalid.push(['notes',u.loadError]);
        if(!invalid.length){for(const item of inventory)state.items[item.key]=Number(state.items[item.key]);for(const room of rooms)for(const key of room.items)state.roomItems[room.key][key]=Number(state.roomItems[room.key][key]);}
      }
      if(step===2&&(quickDate?.validity.badInput||(state.dateStyle==='fixed'&&!validDate(state.date)))){if(quickDate?.validity.badInput){state.dateStyle='fixed';state.date='';dateEditor='main';}invalid.push(['date',u.dateError]);}
      updateSharedUI();return !showErrors(invalid,errors);
    }
    function handleMainInput(event){
      const field=event.target;if(!field.name)return;
      if(['service','from','to'].includes(field.name))routeEditor='main';
      if(['dateStyle','date'].includes(field.name))dateEditor='main';
      if(field.name==='extra')state.extras=[...form.querySelectorAll('[name="extra"]:checked')].map(input=>input.value);else readField(field);
      updateSharedUI();
    }
    on(form,'input',handleMainInput);on(form,'change',handleMainInput);
    on(form,'focusin',event=>{if(['service','from','to'].includes(event.target.name))routeEditor='main';if(['dateStyle','date'].includes(event.target.name))dateEditor='main';});
    if(quickForm){
      function handleQuickInput(event){if(event.target===quickDate){dateEditor='quick';readQuickDate(true);}else {routeEditor='quick';readQuickRoute();}updateSharedUI();}
      on(quickForm,'input',handleQuickInput);on(quickForm,'change',handleQuickInput);
      on(quickForm,'focusin',event=>{if(event.target===quickDate)dateEditor='quick';else if(event.target.matches('input'))routeEditor='quick';});
      on(quickForm,'submit',event=>{
        event.preventDefault();syncInputs();readQuickRoute();readQuickDate(true);routeEditor='quick';dateEditor='quick';clearErrors(quickForm,quickErrors);
        const invalid=routeErrors('quick-');if(quickDate.validity.badInput||(state.dateStyle==='fixed'&&!validDate(state.date)))invalid.push(['quick-date',u.dateError]);updateSharedUI();
        if(showErrors(invalid,quickErrors))return;
        clearErrors(form,errors);step=1;render(true);
      });
    }
    on(form,'submit',event=>{event.preventDefault();if(step<3&&validate()){step++;render(true);}});
    on(previous,'click',()=>{if(step>0){syncInputs();step--;render(true);}});
    on(content,'click',event=>{const button=event.target.closest('button');if(!button)return;if(button.id==='download-plan')download();else if(button.id==='print-plan')print();else if(button.id==='reset-plan'){state=initialState();step=0;routeEditor='main';dateEditor='main';clearErrors(quickForm,quickErrors);render(true);}else if(button.dataset.edit!==undefined){syncInputs();step=Number(button.dataset.edit);render(true);}});
    const exportText=()=>`${u.exportTitle}\n${u.created}: ${new Date().toLocaleDateString(u.locale)}\n\n${u.warning}\n\n${summarySections().map(section=>section.title.toLocaleUpperCase(u.locale)+'\n'+section.text).join('\n\n')}\n\n${methodText}\n\n${u.exportFooter}\n`;
    function prepareExport(){
      syncInputs();let invalidStep=-1;
      if(routeErrors().length)invalidStep=0;
      else if(!allCountsValid()||state.notes.trim().length>600||(!hasItems()&&state.notes.trim().length<3))invalidStep=1;
      else if(quickDate?.validity.badInput||(state.dateStyle==='fixed'&&!validDate(state.date))){invalidStep=2;if(quickDate?.validity.badInput){state.dateStyle='fixed';state.date='';}}
      if(invalidStep<0)return true;if(invalidStep===2)dateEditor='main';step=invalidStep;render();validate();return false;
    }
    function download(){if(!prepareExport())return;const blob=new Blob(['\uFEFF'+exportText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=u.file;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);document.querySelector('#export-status').textContent=u.downloadStarted;}
    function print(){if(!prepareExport())return;const area=document.querySelector('#print-area');area.replaceChildren();const title=document.createElement('h1');title.textContent=u.printTitle;area.append(title);const meta=document.createElement('p');meta.textContent=u.created+': '+new Date().toLocaleDateString(u.locale);area.append(meta);const note=document.createElement('p');note.className='print-warning';note.textContent=u.warning;area.append(note);for(const section of summarySections()){const heading=document.createElement('h2');heading.textContent=section.title;const text=document.createElement('pre');text.textContent=section.text;area.append(heading,text);}const foot=document.createElement('p');foot.className='print-warning';foot.textContent=methodText+' '+u.exportFooter;area.append(foot);window.print();}
    document.querySelectorAll('a[data-language]').forEach(link=>on(link,'click',async event=>{
      if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();if(link.dataset.language===lang||switching)return;switching=true;syncInputs();const keeper={state,step};const target=new URL(link.href,location.href);const inProgress=step>0||state.from||state.to||state.notes||hasItems();const languageNav=link.closest('.language-switch');languageNav?.setAttribute('aria-busy','true');
      try{
        if(target.origin!==location.origin)throw new Error('Language page must be on this origin');
        const response=await fetch(target.pathname+target.search,{credentials:'same-origin',cache:'no-store',signal});if(!response.ok)throw new Error('Language page unavailable');
        const doc=new DOMParser().parseFromString(await response.text(),'text/html');if(!doc.querySelector('#planner-app'))throw new Error('Missing planner');
        document.documentElement.lang=doc.documentElement.lang;document.title=doc.title;
        const description=doc.querySelector('meta[name=description]'),canonical=doc.querySelector('link[rel="canonical"]');
        if(description)document.querySelector('meta[name=description]')?.setAttribute('content',description.getAttribute('content'));
        if(canonical)document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical.getAttribute('href'));
        document.body.innerHTML=doc.body.innerHTML;history.pushState(null,'',target.pathname+target.search+(inProgress?'#planer':target.hash));boot(keeper);
      }catch{
        if(signal.aborted)return;languageNav?.removeAttribute('aria-busy');let alert=languageNav?.querySelector('.language-error');if(!alert&&languageNav){alert=document.createElement('span');alert.className='language-error';alert.setAttribute('role','alert');languageNav.append(alert);}if(alert)alert.textContent=u.languageError;switching=false;
      }
    }));
    const bottom=document.querySelector('.planner-bottom');if(bottom){const hint=document.createElement('span');hint.className='language-plan-note';hint.textContent=u.switchNote;bottom.append(hint);}
    app.hidden=false;render(Boolean(memory&&(step>0||state.from||state.to)));
  }
  window.addEventListener('popstate',()=>location.reload());
  boot();
})();
