// conflicts-db.js — 100 Years of Geopolitical Conflicts
// Each entry: name, years, x/y (SVG 1000x500), era, type, parties, casualties, summary, outcome, significance
// Eras: active, recent, coldwar, ww, dispute

const CONFLICT_DB = [
  // ═══ ACTIVE WARS (2024–2026) ═══
  {id:'iran',name:'US + Israel vs Iran',years:'2024–Present',x:610,y:240,era:'active',type:'Interstate War',
   parties:'United States, Israel vs Iran, Hezbollah, Houthis',casualties:'50,000+',
   summary:'Operation Epic Fury began after escalating tensions over Iran\'s nuclear program and proxy attacks. US-Israel coalition launched strikes on Iranian nuclear and military facilities. Iran retaliated with missile barrages and Hormuz Strait blockade, disrupting 21% of global oil transit.',
   outcome:'Ongoing',significance:'First direct US-Iran military confrontation. Oil past $120/barrel. Nuclear escalation risk at historic highs.',link:'/conflict/iran'},

  {id:'india-pakistan',name:'India vs Pakistan',years:'2025–Present',x:690,y:270,era:'active',type:'Interstate War',
   parties:'India vs Pakistan',casualties:'10,000+',
   summary:'Post-Operation Sindoor tensions escalated into a two-front confrontation. India launched precision strikes against militant infrastructure in Pakistan-administered Kashmir. Both nuclear-armed nations on high alert.',
   outcome:'Ongoing — Ceasefire fragile',significance:'Two nuclear-armed nations in direct conflict. 335+ combined nuclear warheads on standby.',link:'/conflict/india-pakistan'},

  {id:'pakistan-afghanistan',name:'Pakistan vs Afghanistan',years:'2023–Present',x:670,y:240,era:'active',type:'Border War',
   parties:'Pakistan vs Taliban-led Afghanistan',casualties:'15,000+',
   summary:'Pakistan launched Operation Azm-e-Istehkam against TTP militants sheltering in Afghanistan. Taliban government refused to act. Cross-border strikes and refugee deportation campaigns escalated into open border conflict.',
   outcome:'Ongoing',significance:'Pakistan fighting on two fronts simultaneously. 1.7M Afghan deportees.',link:'/conflict/pakistan-afghanistan'},

  {id:'russia-ukraine',name:'Russia vs Ukraine',years:'2022–Present',x:560,y:180,era:'active',type:'Interstate War',
   parties:'Russia vs Ukraine (NATO-backed)',casualties:'500,000+',
   summary:'Russia\'s full-scale invasion entered Year 4. Despite massive Western military aid, front lines remain largely static. Russia occupies ~18% of Ukrainian territory. Nuclear rhetoric continues from Moscow.',
   outcome:'Ongoing — Stalemate',significance:'Largest European war since WW2. Reshaped NATO, triggered global energy crisis.',link:'/conflict/russia-ukraine'},

  // ═══ RECENT MAJOR (2000–2025) ═══
  {name:'Syrian Civil War',years:'2011–Present',x:590,y:228,era:'recent',type:'Civil War',
   parties:'Assad Govt + Russia + Iran vs Rebels, ISIS, Kurds, Turkey, USA',casualties:'500,000+',
   summary:'Arab Spring protests devolved into a devastating multi-sided civil war. Foreign powers intervened on all sides. Assad regime survived with Russian and Iranian backing. Chemical weapons used against civilians.',
   outcome:'Assad survived — Low-level insurgency continues',significance:'Europe\'s worst refugee crisis (6.8M displaced). Drew Russia into Middle Eastern power projection.'},

  {name:'Yemen Civil War',years:'2014–Present',x:600,y:290,era:'recent',type:'Civil/Proxy War',
   parties:'Houthi rebels (Iran-backed) vs Saudi-led coalition',casualties:'377,000+',
   summary:'Houthi rebels seized the capital Sana\'a, triggering Saudi-led intervention. Created the world\'s worst humanitarian crisis. Houthis later attacked Red Sea shipping, disrupting global trade.',
   outcome:'Ongoing — Truces fragile',significance:'Proxy battlefield for Saudi-Iranian rivalry. Red Sea attacks disrupted 12% of global trade.'},

  {name:'Iraq War',years:'2003–2011',x:605,y:235,era:'recent',type:'Invasion/Occupation',
   parties:'USA, UK coalition vs Iraq (Saddam Hussein)',casualties:'200,000–1,000,000',
   summary:'US-led coalition invaded Iraq based on disputed WMD intelligence. Saddam overthrown and executed. Occupation triggered massive sectarian violence and insurgency.',
   outcome:'US withdrawal 2011 — Iraq fragmented',significance:'Cost US $2 trillion. Directly led to the rise of ISIS.'},

  {name:'Afghanistan (GWOT)',years:'2001–2021',x:668,y:233,era:'recent',type:'Invasion/Insurgency',
   parties:'USA/NATO vs Taliban, Al-Qaeda',casualties:'176,000+',
   summary:'America\'s longest war began after 9/11. After 20 years, $2.3 trillion, and thousands of casualties, the Taliban retook Kabul within days of the US withdrawal in August 2021.',
   outcome:'Taliban victory — US withdrawal Aug 2021',significance:'America\'s longest war. Taliban returned to power. Chaotic evacuation a defining US failure.'},

  {name:'Libyan Civil Wars',years:'2011–2020',x:530,y:240,era:'recent',type:'Civil War',
   parties:'Gaddafi regime vs NATO-backed rebels, later rival govts',casualties:'30,000+',
   summary:'NATO intervention helped rebels overthrow Gaddafi. Libya descended into chaos with rival governments, militias, and ISIS footholds.',
   outcome:'Gaddafi killed — Libya fragmented',significance:'NATO intervention without follow-up created a failed state. Opened migration route to Europe.'},

  {name:'Myanmar Civil War',years:'2021–Present',x:740,y:275,era:'recent',type:'Civil War/Coup',
   parties:'Military junta vs People\'s Defense Forces, ethnic armies',casualties:'50,000+',
   summary:'Military coup overthrew Aung San Suu Kyi\'s government. Massive civilian resistance evolved into armed rebellion. Resistance forces gaining significant territory.',
   outcome:'Ongoing — Junta losing ground',significance:'One of the world\'s most underreported wars.'},

  {name:'Tigray War (Ethiopia)',years:'2020–2022',x:580,y:310,era:'recent',type:'Civil War',
   parties:'Ethiopian govt + Eritrea vs TPLF',casualties:'300,000–500,000',
   summary:'Ethiopian PM Abiy Ahmed launched military offensive against Tigray region. Eritrean forces joined. Mass atrocities, ethnic cleansing, and weaponized starvation documented.',
   outcome:'Ceasefire Nov 2022',significance:'Among the deadliest wars of the 2020s. Deliberate starvation as weapon.'},

  {name:'Rise & Fall of ISIS',years:'2014–2019',x:598,y:232,era:'recent',type:'Insurgency/Terrorism',
   parties:'ISIS vs Iraq, Syria, Kurds, USA, Russia',casualties:'100,000+',
   summary:'Islamic State declared a caliphate across Iraq and Syria, controlling territory the size of Britain. Coalition of 80+ nations destroyed its territorial holdings by 2019.',
   outcome:'Caliphate destroyed — Insurgency persists',significance:'Redefined modern terrorism. Drew global military coalition.'},

  {name:'Sudan Civil War',years:'2023–Present',x:570,y:295,era:'recent',type:'Civil War',
   parties:'SAF vs Rapid Support Forces (RSF)',casualties:'150,000+',
   summary:'Power struggle between two military factions erupted into civil war. RSF committed atrocities in Darfur. 10M+ displaced — world\'s largest displacement crisis.',
   outcome:'Ongoing',significance:'World\'s largest displacement crisis. Echoes of Darfur genocide.'},

  {name:'Nagorno-Karabakh',years:'2020, 2023',x:600,y:210,era:'recent',type:'Territorial War',
   parties:'Azerbaijan vs Armenia/Artsakh',casualties:'10,000+',
   summary:'Azerbaijan used Turkish drones and Israeli weapons to recapture Nagorno-Karabakh. In 2023, a final offensive forced the entire ethnic Armenian population (120,000) to flee.',
   outcome:'Azerbaijan victory — Ethnic cleansing',significance:'Drone warfare changed modern combat doctrine.'},

  {name:'Russia-Georgia War',years:'2008',x:595,y:198,era:'recent',type:'Interstate War',
   parties:'Russia vs Georgia',casualties:'850+',
   summary:'Russia invaded Georgia after clashes in South Ossetia. Russian forces advanced deep into Georgian territory before ceasefire. Russia recognized breakaway regions.',
   outcome:'Russian victory — Occupied territories',significance:'First European military invasion since WW2. Warning before Ukraine.'},

  // ═══ POST-COLD WAR (1991–2000) ═══
  {name:'Gulf War',years:'1990–1991',x:615,y:248,era:'coldwar',type:'Interstate War',
   parties:'USA-led coalition (34 nations) vs Iraq',casualties:'25,000–50,000',
   summary:'Saddam Hussein invaded Kuwait. US assembled the largest military coalition since WW2 and liberated Kuwait in 100 hours of ground combat. "Highway of Death" became iconic image.',
   outcome:'Decisive coalition victory',significance:'Established US as sole superpower. Ushered in era of American military dominance. CNN\'s first "live war."'},

  {name:'Yugoslav Wars / Bosnia',years:'1991–2001',x:540,y:195,era:'coldwar',type:'Civil War/Genocide',
   parties:'Serbia, Croatia, Bosnia factions, NATO',casualties:'140,000+',
   summary:'Yugoslavia\'s breakup triggered Europe\'s worst violence since WW2. Srebrenica massacre (8,000 Bosnian Muslims) and Siege of Sarajevo shocked the world. NATO eventually intervened with airstrikes.',
   outcome:'Dayton Accords — New nations created',significance:'Genocide in Europe. Led to Kosovo War and NATO bombing of Serbia. Created 7 new nations.'},

  {name:'Rwandan Genocide',years:'1994',x:560,y:325,era:'coldwar',type:'Genocide',
   parties:'Hutu extremists vs Tutsi population',casualties:'800,000–1,000,000',
   summary:'In 100 days, Hutu militias systematically murdered 800,000+ Tutsi and moderate Hutu. The UN and world powers failed to intervene despite clear warnings. Machetes were the primary weapon.',
   outcome:'RPF victory ended genocide',significance:'Fastest genocide in history. Total failure of international community. Reshaped debate on humanitarian intervention.'},

  {name:'Chechen Wars',years:'1994–2009',x:610,y:190,era:'coldwar',type:'Separatist War',
   parties:'Russia vs Chechen separatists',casualties:'200,000+',
   summary:'Chechnya fought two devastating wars for independence from Russia. Grozny was leveled — the UN called it "the most destroyed city on Earth." Putin used the second war to consolidate power.',
   outcome:'Russian control restored',significance:'Launched Putin\'s rise to power. Grozny\'s destruction foreshadowed Russian tactics in Ukraine.'},

  {name:'Somali Civil War',years:'1991–Present',x:600,y:315,era:'coldwar',type:'Civil War/Failed State',
   parties:'Warlords, Al-Shabaab, TFG, African Union',casualties:'500,000+',
   summary:'Somalia\'s government collapsed in 1991. Decades of warlord conflict, famine, piracy, and Islamist insurgency followed. "Black Hawk Down" (1993) shaped US intervention policy for decades.',
   outcome:'Ongoing — Fragile government',significance:'Quintessential failed state. Al-Shabaab remains active threat. Piracy era disrupted global shipping.'},

  // ═══ COLD WAR ERA (1947–1991) ═══
  {name:'Korean War',years:'1950–1953',x:815,y:215,era:'coldwar',type:'Interstate War',
   parties:'North Korea + China vs South Korea + USA/UN',casualties:'3,000,000+',
   summary:'North Korea invaded the South, triggering US/UN intervention. China entered when forces approached its border. Three years of devastating combat ended in armistice — not a peace treaty.',
   outcome:'Armistice — Korea still divided',significance:'Set template for Cold War proxy wars. DMZ remains the most fortified border on Earth.'},

  {name:'Vietnam War',years:'1955–1975',x:755,y:280,era:'coldwar',type:'Interstate/Civil War',
   parties:'North Vietnam + Viet Cong vs South Vietnam + USA',casualties:'3,500,000+',
   summary:'America\'s most controversial war. 2.7M US troops deployed. Despite massive firepower, US could not defeat guerrilla warfare. Anti-war movement transformed American politics forever.',
   outcome:'North Vietnamese victory',significance:'Shattered myth of American invincibility. Defined a generation. Changed US foreign policy doctrine.'},

  {name:'Soviet-Afghan War',years:'1979–1989',x:662,y:228,era:'coldwar',type:'Invasion/Insurgency',
   parties:'Soviet Union vs Afghan Mujahideen (US/CIA-backed)',casualties:'2,000,000+',
   summary:'Soviet Union invaded to prop up communist government. CIA-backed Mujahideen waged guerrilla war with Stinger missiles. Soviet withdrawal marked the beginning of the USSR\'s end.',
   outcome:'Soviet withdrawal',significance:'"Soviet Vietnam." Led directly to USSR collapse. Mujahideen later spawned Taliban and Al-Qaeda.'},

  {name:'Falklands War',years:'1982',x:310,y:405,era:'coldwar',type:'Territorial War',
   parties:'United Kingdom vs Argentina',casualties:'907',
   summary:'Argentina invaded British Falkland Islands. Britain dispatched a task force 8,000 miles. In 74 days of intense fighting, British forces recaptured all territory.',
   outcome:'British victory',significance:'Saved Thatcher\'s career. Ended Argentine junta. Proved territorial aggression could be reversed.'},

  {name:'Iran-Iraq War',years:'1980–1988',x:620,y:242,era:'coldwar',type:'Interstate War',
   parties:'Iraq (Saddam) vs Iran (Khomeini)',casualties:'1,000,000+',
   summary:'Saddam invaded Iran expecting quick victory. Instead, 8-year war of attrition with trenches, chemical weapons, and child soldiers. Both nations devastated.',
   outcome:'Stalemate — UN ceasefire',significance:'Longest conventional war of 20th century. Chemical weapons used extensively.'},

  {name:'Cuban Missile Crisis',years:'1962',x:225,y:262,era:'coldwar',type:'Nuclear Standoff',
   parties:'USA vs Soviet Union (over Cuba)',casualties:'0 direct',
   summary:'USSR secretly deployed nuclear missiles in Cuba, 90 miles from Florida. For 13 days, the world stood on the brink of nuclear annihilation. Kennedy and Khrushchev negotiated a secret deal.',
   outcome:'Soviet missiles withdrawn',significance:'Closest the world has EVER come to nuclear war. Led to US-Soviet hotline and arms control.'},

  {name:'Six-Day War',years:'1967',x:582,y:237,era:'coldwar',type:'Interstate War',
   parties:'Israel vs Egypt, Syria, Jordan',casualties:'20,000+',
   summary:'Israel launched preemptive strikes destroying the Egyptian air force on the ground. In six days, Israel captured Sinai, Gaza, West Bank, East Jerusalem, and Golan Heights.',
   outcome:'Decisive Israeli victory',significance:'Israel tripled in size. Created Palestinian occupation that continues today.'},

  {name:'Chinese Civil War',years:'1927–1949',x:785,y:230,era:'ww',type:'Civil War',
   parties:'Communists (Mao) vs Nationalists (Chiang Kai-shek)',casualties:'8,000,000+',
   summary:'Decades-long struggle between Communists and Nationalists. After WW2, Communists won decisively. Nationalists fled to Taiwan. Mao declared People\'s Republic of China in 1949.',
   outcome:'Communist victory — PRC established',significance:'Created modern China. Taiwan question remains unresolved to this day.'},

  {name:'Congo Crisis',years:'1960–1965',x:555,y:325,era:'coldwar',type:'Civil War/Proxy',
   parties:'Congolese factions, Belgium, USA, USSR, UN',casualties:'100,000+',
   summary:'Congo\'s independence from Belgium immediately devolved into civil war and secession. PM Lumumba assassinated with CIA/Belgian complicity.',
   outcome:'Mobutu dictatorship (32 years)',significance:'CIA-backed coup established decades of dictatorship. Template for Cold War Africa.'},

  {name:'Indo-Pakistani War',years:'1971',x:700,y:260,era:'coldwar',type:'Interstate War',
   parties:'India vs Pakistan (over East Pakistan)',casualties:'300,000–3,000,000',
   summary:'Pakistan\'s military crackdown on East Pakistan triggered refugee crisis and Indian intervention. India won decisively in 13 days. Largest surrender since WW2 (93,000 POWs).',
   outcome:'Indian victory — Bangladesh born',significance:'Pakistan lost half its population. Birth of Bangladesh. Largest surrender since WW2.'},

  // ═══ WORLD WAR ERA (1926–1945) ═══
  {name:'World War II — Europe',years:'1939–1945',x:530,y:175,era:'ww',type:'World War',
   parties:'Allies (UK, USA, USSR, France) vs Axis (Germany, Italy)',casualties:'40,000,000+ (European theater)',
   summary:'Hitler\'s Nazi Germany invaded Poland, triggering global conflict. Holocaust killed 6 million Jews. Eastern Front saw largest battles in history. D-Day invasion liberated Western Europe. Berlin fell May 1945.',
   outcome:'Allied victory — Germany divided',significance:'Deadliest conflict in human history. Created the United Nations, NATO, and the modern world order.'},

  {name:'World War II — Pacific',years:'1941–1945',x:830,y:275,era:'ww',type:'World War',
   parties:'USA, UK, China, Australia vs Japan',casualties:'25,000,000+',
   summary:'Japan\'s attack on Pearl Harbor drew the US into WW2. Island-hopping campaign across the Pacific. War ended with atomic bombings of Hiroshima and Nagasaki — the only nuclear weapons ever used in combat.',
   outcome:'Japanese surrender — US occupation',significance:'Only use of nuclear weapons in war. Began the Atomic Age. Japan became pacifist democracy.'},

  {name:'Spanish Civil War',years:'1936–1939',x:488,y:210,era:'ww',type:'Civil War',
   parties:'Republicans vs Nationalists (Franco), backed by Germany/Italy',casualties:'500,000+',
   summary:'Leftist Republic vs right-wing Nationalists under Franco. Germany and Italy tested weapons and tactics later used in WW2. Guernica bombing became iconic anti-war symbol.',
   outcome:'Franco dictatorship until 1975',significance:'Dress rehearsal for WW2. International Brigades. Picasso\'s Guernica.'},

  {name:'Second Sino-Japanese War',years:'1937–1945',x:790,y:245,era:'ww',type:'Interstate War',
   parties:'China vs Imperial Japan',casualties:'15,000,000–22,000,000',
   summary:'Japan invaded China in full-scale war. Nanjing Massacre killed 300,000+ civilians. War merged into WW2 Pacific theater. China\'s resistance tied down over 1 million Japanese troops.',
   outcome:'Japanese defeat (part of WW2)',significance:'One of the deadliest wars in history. Nanjing Massacre remains deeply controversial.'},

  {name:'Winter War',years:'1939–1940',x:555,y:140,era:'ww',type:'Interstate War',
   parties:'Finland vs Soviet Union',casualties:'150,000+',
   summary:'Stalin invaded tiny Finland expecting quick conquest. Finnish forces used guerrilla tactics in brutal winter conditions. Soviets suffered humiliating losses before Finland negotiated peace.',
   outcome:'Finnish territorial concessions but independence preserved',significance:'Exposed Soviet military weakness. Influenced Hitler\'s decision to invade USSR.'},

  // ═══ TERRITORIAL DISPUTES (ONGOING) ═══
  {name:'Greenland — US Acquisition Push',years:'2019–Present',x:370,y:105,era:'dispute',type:'Territorial Dispute',
   parties:'United States vs Denmark / Greenland',casualties:'0',
   summary:'President Trump proposed purchasing Greenland from Denmark, calling it "a large real estate deal." Denmark refused. Trump cancelled a state visit in retaliation. The push has resumed with strategic Arctic interests citing China and Russia\'s polar ambitions.',
   outcome:'Ongoing diplomatic tension',significance:'Reflects growing Arctic geopolitical competition. Greenland holds rare earth minerals and strategic military value.'},

  {name:'Taiwan Strait Crisis',years:'1949–Present',x:805,y:260,era:'dispute',type:'Territorial Dispute',
   parties:'China (PRC) vs Taiwan (ROC), backed by USA',casualties:'0 (recent)',
   summary:'China considers Taiwan a breakaway province and has never renounced use of force for "reunification." US maintains strategic ambiguity — arming Taiwan while not formally recognizing independence. Military tensions intensifying.',
   outcome:'Ongoing — Most dangerous flashpoint',significance:'Could trigger US-China war. Taiwan produces 90% of world\'s advanced semiconductors.'},

  {name:'South China Sea',years:'1947–Present',x:770,y:285,era:'dispute',type:'Territorial Dispute',
   parties:'China vs Philippines, Vietnam, Malaysia, Brunei, Taiwan',casualties:'Minimal',
   summary:'China claims 90% of the South China Sea via its "nine-dash line," rejected by international tribunal in 2016. China has built artificial islands with military bases. $5.3 trillion in trade passes through annually.',
   outcome:'Ongoing military buildup',significance:'$5.3T annual trade route. China militarizing artificial islands. Risk of naval confrontation with US.'},

  {name:'Kashmir Dispute',years:'1947–Present',x:685,y:245,era:'dispute',type:'Territorial Dispute',
   parties:'India vs Pakistan (and China)',casualties:'70,000+ (insurgency)',
   summary:'Both India and Pakistan claim the entirety of Kashmir. Three wars fought over the territory. India revoked Kashmir\'s special autonomy in 2019. Nuclear-armed rivals face off across the Line of Control.',
   outcome:'Ongoing — Both nuclear-armed',significance:'World\'s most militarized zone. Two nuclear powers in perpetual standoff. 70+ years unresolved.'},

  {name:'Crimea Annexation',years:'2014–Present',x:575,y:190,era:'dispute',type:'Territorial Dispute',
   parties:'Russia vs Ukraine (Western-backed)',casualties:'Part of Ukraine war',
   summary:'Russia annexed Crimea from Ukraine after a disputed referendum conducted under military occupation. The international community largely condemned it. Crimea became a flashpoint for the 2022 full-scale invasion.',
   outcome:'Russian-occupied — Internationally disputed',significance:'First European annexation since WW2. Directly precipitated the 2022 invasion.'},

  {name:'Western Sahara',years:'1975–Present',x:470,y:260,era:'dispute',type:'Territorial Dispute',
   parties:'Morocco vs Polisario Front (Sahrawi Republic)',casualties:'20,000+',
   summary:'Morocco occupies most of Western Sahara after Spain withdrew in 1975. Polisario Front fights for independence from exile. Africa\'s last major decolonization issue remains unresolved.',
   outcome:'Ongoing — Ceasefire collapsed 2020',significance:'Africa\'s last colony. US recognized Moroccan sovereignty in 2020 in exchange for Morocco-Israel normalization.'},

  {name:'Kuril Islands Dispute',years:'1945–Present',x:870,y:170,era:'dispute',type:'Territorial Dispute',
   parties:'Russia vs Japan',casualties:'0',
   summary:'Soviet Union seized the Kuril Islands from Japan at the end of WW2. Japan still claims the four southernmost islands. No peace treaty has ever been signed between Russia and Japan.',
   outcome:'Ongoing — No peace treaty',significance:'Russia and Japan technically still in WW2 state of war. Blocks economic cooperation.'}
];
