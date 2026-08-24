/**
 * Study Notes Helper for Giniaz College
 * Generates structured, high-quality "Mambo ya kunote na kujifunza" (Notes and Explanations)
 * with lesson synthesis and verse reference lists.
 */

export interface StudyNoteItem {
  kitu: string;
  ufafanuzi: string;
}

export interface StudyNotes {
  ujumbeMkuu: string;
  mamboMuhimu: StudyNoteItem[];
  mistari: string[]; // Only verse references, without full text
  mapumziko?: {
    kichwa: string;
    maelezo: string;
    muda: string;
  };
}

export function stripQuotedContent(text: string): string {
  if (!text) return "";
  let result = text;
  // Match and remove content inside standard and smart quotes, including the quotes themselves
  result = result.replace(/"[^"]*"/g, "");
  result = result.replace(/“[^”]*”/g, "");
  result = result.replace(/‘[^’]*’/g, "");
  result = result.replace(/'[^']*'/g, "");
  return result.replace(/\s+/g, " ").trim();
}

export function cleanLessonTitle(title: string): string {
  if (!title) return "";
  
  let cleaned = stripQuotedContent(title);
  
  const swahiliNumbers = [
    "kwanza", "pili", "tatu", "nne", "tano", "sita", "saba", "nane", "tisa", "kumi", 
    "kumi na moja", "kumi na mbili", "kumi na tatu", "kumi na nne", "kumi na tano"
  ];
  
  const swahiliNumbersPattern = swahiliNumbers.join("|");
  
  const regexes = [
    new RegExp(`^somo\\s+la\\s+(${swahiliNumbersPattern}|\\d+)\\s*[-:|\\s]*\\s*`, "i"),
    new RegExp(`^somo\\s+(${swahiliNumbersPattern}|\\d+)\\s*[-:|\\s]*\\s*`, "i"),
    /^utangulizi\s+wa\s+/i,
    new RegExp(`^(${swahiliNumbersPattern})\\s*[-:|\\s]\\s*`, "i")
  ];
  
  for (const regex of regexes) {
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, "").trim();
    }
  }
  
  cleaned = stripQuotedContent(cleaned);
  
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned;
}

// Clean prefixes from text
function cleanText(text: string): string {
  return text
    .trim()
    .replace(/^[-*•\s\d.]+\s*/, '') // Remove bullet points or numbering
    .replace(/^["'“‘]+|["'”’]+$/g, '') // Remove enclosing quotes
    .trim();
}

// Check if a piece of text is a Bible verse or reference rather than a living instruction
function isBibleVerse(text: string): boolean {
  const lowercase = text.toLowerCase();
  const bibleRefRegex = /(?:Zaburi|Yohana|Isaya|Mathayo|Luka|Waefeso|Warumi|Mwanzo|Ufunuo|Walawi|Kumbukumbu|Mithali|Mhubiri|Wagalatia|Wakolosai|Wathesalonike|Timotheo|Tito|Ebrania|Yakobo|Petro|Yuda|Yeremia|Ezekieli|Danieli|Hosea|Yoeli|Amosi|Obadia|Yona|Mika|Nahumu|Habakuku|Sefania|Hagai|Zekaria|Malaki)/i;
  
  if (bibleRefRegex.test(text) && (/\d+[:\s]+\d+/.test(lowercase) || lowercase.includes("mstari") || lowercase.includes("sura"))) {
    return true;
  }
  if (lowercase.includes("linasema:") || lowercase.includes("inasema:") || lowercase.includes("maandiko") || lowercase.includes("biblia inasema")) {
    return true;
  }
  if (/^[0-9:\-\s,]+$/.test(text)) {
    return true;
  }
  return false;
}

// Check if a piece of text is a heading/subheading or a Bible verse
function isHeadingOrVerse(text: string): boolean {
  const lowercase = text.toLowerCase();
  if (lowercase.startsWith("sehemu ya") || 
      lowercase.startsWith("somo la") || 
      lowercase.startsWith("utangulizi") || 
      lowercase.startsWith("hitimisho") || 
      lowercase.startsWith("mambo ya kunote") ||
      /^[A-Z0-9\s.:\-,!]+$/.test(text)) {
    return true;
  }
  return isBibleVerse(text);
}

// Extract Bible verse references like "Zaburi 91:1-2" or "Yohana 3:16"
export function extractVerseReferences(content: string): string[] {
  const bibleRefRegex = /(?:Zaburi|Yohana|Isaya|Mathayo|Luka|Waefeso|Warumi|Mwanzo|Ufunuo|Walawi|Kumbukumbu|Mithali|Mhubiri|Wagalatia|Wakolosai|Wathesalonike|Timotheo|Tito|Ebrania|Yakobo|Petro|Yuda|Yeremia|Ezekieli|Danieli|Hosea|Yoeli|Amosi|Obadia|Yona|Mika|Nahumu|Habakuku|Sefania|Hagai|Zekaria|Malaki)\s+\d+[:\s]+\d+(?:-\d+)?/gi;
  
  const matches = content.match(bibleRefRegex) || [];
  const uniqueReferences = Array.from(new Set(matches.map(m => cleanText(m))));
  return uniqueReferences;
}

// Hand-crafted Fallback Database for the 12 lessons of Eskatolojia
const ESKATOLOJIA_FALLBACKS: { keys: string[], items: StudyNoteItem[] }[] = [
  {
    keys: ["uumbaji", "eden"],
    items: [
      { kitu: "Kutafakari Kusudi la Kuumbwa Kwako", ufafanuzi: "Mungu alikuumba kwa mfano wake ili uishi kwa upendo na ushirika naye, kuanzia bustani ya Edeni hadi kwenye utukufu wa milele." },
      { kitu: "Kuelewa Mpango wa Urejesho wa Kiroho", ufafanuzi: "Ukombozi sio mpango wa dharura; Mungu aliuandaa kabla ya kuwekwa misingi ya dunia ili kukuokoa na dhambi." },
      { kitu: "Kuishi kwa Utambuzi wa Hatima ya Milele", ufafanuzi: "Tafakari daima kuwa safari yako ya duniani ni ya muda mfupi, na unapaswa kujiandaa kwa ajili ya paradiso iliyorejeshwa." },
      { kitu: "Kulinda Ushirikiano na Mungu Edeni Mpya", ufafanuzi: "Bustani ya Edeni ya kale iliyopotea ni picha ya kile tutakachorudishiwa mbinguni; dumu katika maombi ili kulinda ushirika wako." },
      { kitu: "Kukataa Hadithi na Uongo wa Nyoka", ufafanuzi: "Jilinde na uongo na ushawishi wa kishetani unaolenga kukutoa kwenye mpango safi wa wokovu wa Mungu kimaisha." }
    ]
  },
  {
    keys: ["agano", "vipindi", "dispensations"],
    items: [
      { kitu: "Kutambua Vipindi Mbalimbali vya Neema", ufafanuzi: "Mungu amejifunua kwa wanadamu kupitia maagano na vipindi tofauti vya kihistoria ili kutimiza mpango wake wa wokovu." },
      { kitu: "Kusimama Imara Chini ya Agano Jipya", ufafanuzi: "Tunaishi katika kipindi cha neema ambapo dhabahu kuu ni moyo wako uliosafishwa kwa Damu ya Yesu." },
      { kitu: "Kutii Sheria na Maelekezo ya Kiroho Leo", ufafanuzi: "Kila kipindi cha kinabii kina majukumu yake; sasa hivi unapaswa kuishi kwa uaminifu na utakatifu chini ya uongozi wa Roho Mtakatifu." },
      { kitu: "Kuelewa Ahadi za Kipekee za Maagano", ufafanuzi: "Tafakari ahadi zote ambazo Mungu aliweka kwa Ibrahimu, Nuhu na Daudi, na uone jinsi zinavyotimia katika maisha yetu leo." },
      { kitu: "Kutunza Uaminifu katika Kipindi cha Neema", ufafanuzi: "Neema haimaanishi kuishi katika dhambi bali ni fursa kubwa ya kujitakasa huku tukijiandaa kwa unyakuo ujao." }
    ]
  },
  {
    keys: ["falme", "daniel", "sanamu", "kuinuka"],
    items: [
      { kitu: "Kuelewa Unabii wa Sanamu Kuu", ufafanuzi: "Falme zote za kidunia (Babeli, Umedi, Ugiriki, Rumi) zinapita na kuanguka, lakini Ufalme wa Mungu pekee ndio utakaosimama milele." },
      { kitu: "Kujenga Imani Isiyotikisika Kama Danieli", ufafanuzi: "Katika mifumo na siasa za sasa, kataa kabisa kujichafua kwa chakula cha mfalme; baki mwaminifu kwa Mungu wako hata kwenye tundu la simba." },
      { kitu: "Kutambua Jiwe Lililokatika Bila Mikono", ufafanuzi: "Jiwe hili ni Yesu Kristo ambaye atavunja falme zote dhalimu na kusimamisha amani na haki ya milele duniani kote." },
      { kitu: "Kusimama Upande wa Ufalme Usiotikisika", ufafanuzi: "Weka tumaini lako katika ufalme wa kiungu utakaotawala kwa haki badala ya kutegemea nguvu tete za wanadamu." },
      { kitu: "Kulinda Ushuhuda wa Kiroho Katika Ugenini", ufafanuzi: "Uwe mfano mwema wa utakatifu na maadili hata unapokuwa katikati ya mazingira yasiyomcha Mungu." }
    ]
  },
  {
    keys: ["kuja kwa kwanza", "horini", "dhabihu"],
    items: [
      { kitu: "Kupokea Unyenyekevu wa Kuzaliwa kwa Yesu", ufafanuzi: "Yesu hakuja kwa fahari bali alizaliwa horini ili kuleta upendo, faraja, na wokovu kwa watu wote wanyenyekevu." },
      { kitu: "Kutafakari Nguvu ya Dhabihu ya Msalaba", ufafanuzi: "Msalaba sio ishara ya kushindwa bali ni ushindi mkuu ambapo dhambi zako zilisamehewa na laana zote zilinyegezwa." },
      { kitu: "Kuishi Maisha ya Kushuhudia Ukombozi", ufafanuzi: "Ukiwa umekombolewa, kuwa mjumbe wa upendo na amani, ukiwatangazia wengine ushindi tulioandaliwa na Kristo." },
      { kitu: "Kutembea katika Upole kama Mwanakondoo", ufafanuzi: "Jifunze kutoka kwa tabia ya Yesu Kristo ya unyenyekevu na upendo mkuu katika kukabiliana na changamoto zote za maisha." },
      { kitu: "Kutambua Thamani ya Damu ya Ukombozi", ufafanuzi: "Linda utakatifu wa mwili wako, ukijua umenunuliwa kwa thamani kubwa ya Damu ya Yesu pale msalabani." }
    ]
  },
  {
    keys: ["kipindi cha kanisa", "mataifa", "pentekoste"],
    items: [
      { kitu: "Kujazwa Nguvu za Roho Mtakatifu", ufafanuzi: "Kama ilivyokuwa siku ya Pentekoste, unahitaji upako na nguvu ya Roho Mtakatifu ili kushuhudia na kusimama imara leo." },
      { kitu: "Kulinda Ushirikiano na Upendo wa Kikanisa", ufafanuzi: "Kanisa la kwanza lilidumu katika ushirika na kuomba pamoja; jaza nyumba yako roho ya maombi na upendo kwa waumini wenzako." },
      { kitu: "Kutumia Kipindi hiki cha Neema Kikamilifu", ufafanuzi: "Mlango wa neema uko wazi kwa mataifa yote; jitahidi kuingia na kuwavuta wengine kabla ya muda wa neema kuisha." },
      { kitu: "Kujenga Madhabahu ya Siri Kila Siku", ufafanuzi: "Kuwa na utaratibu thabiti wa kusali na kutafakari asubuhi na jioni ili kudumisha upako wa Roho Mtakatifu ndani yako." },
      { kitu: "Kusaidia Wahitaji kwa Upendo wa Kikanisa", ufafanuzi: "Kanisa la kwanza lilishirikiana kwa kila kitu; toa msaada wa kiroho na kimwili kwa wale wanaokuzunguka ili kuonyesha upendo wa Kristo." }
    ]
  },
  {
    keys: ["ishara za nyakati", "nyakati za mwisho", "jamii na ulimwengu"],
    items: [
      { kitu: "Kusoma na Kutafsiri Ishara za Nyakati", ufafanuzi: "Njaa, magonjwa, vita na mmonyoko wa maadili ni alama za wazi kuwa kurudi kwa Bwana wetu Yesu Kristo kuko karibu sana." },
      { kitu: "Kujilinda na Roho ya Ubaridi wa Kiroho", ufafanuzi: "Upendo wa wengi utapoa katika siku za mwisho; omba kila siku asubuhi na jioni ili kulinda moto wa madhabahu yako ya ndani." },
      { kitu: "Kuepuka Upotofu na Walimu wa Uongo", ufafanuzi: "Kutakuwa na manabii wengi wa uongo; jaza akili yako neno la kweli la Biblia ili uweze kupambanua roho zote potofu." },
      { kitu: "Kukesha na Kuomba Bila Kughafilika", ufafanuzi: "Tenga muda maalum kila asubuhi na usiku kusali, kujitakasa, na kukesha huku ukijilinda na anasa zote za ulimwengu." },
      { kitu: "Kujaza Moyo Wako Neno la Uzima Kila Siku", ufafanuzi: "Soma Biblia asubuhi kabla ya kuanza kazi ili roho yako ipate nguvu ya kushinda majaribu yote ya sasa." }
    ]
  },
  {
    keys: ["unyakuo", "rapture", "watakatifu"],
    items: [
      { kitu: "Kuishi Maisha ya Kukesha na Utayari", ufafanuzi: "Unyakuo utatokea kwa ghafla kama mwizi wa usiku; hakikisha taa yako imejaa mafuta ya utakatifu na maombi kila sekunde." },
      { kitu: "Kujitakasa na Kuepuka Madoa ya Dunia", ufafanuzi: "Bwana anarudi kulichukua kanisa lisilo na mawaa bora kunyanzi; jiepushe kabisa na tabia au mazungumzo yanayoweza kukuchafua." },
      { kitu: "Kujazwa Tumaini la Unyakuo wa Watakatifu", ufafanuzi: "Siri hii kuu inatupa faraja kubwa; usihofie kifo au dhoruba za sasa kwani tutabadilishwa miili yetu kuwa ya utukufu." },
      { kitu: "Kuandaa Nyumba Yako katika Utayari", ufafanuzi: "Fanya maombi ya pamoja asubuhi na jioni na familia yako ili nyumba yenu yote iwe tayari kulindwa na kunyakuliwa." },
      { kitu: "Kuweka Hazina Yako Mbinguni Kwanza", ufafanuzi: "Weka upendo wako wote katika ahadi za milele na usishikilie sana mambo ya kupita ya ulimwengu huu tete." }
    ]
  },
  {
    keys: ["dhiki kuu", "antichrist", "mpinga kristo", "chapa"],
    items: [
      { kitu: "Kutambua Mifumo ya Udhibiti wa Kielektroniki", ufafanuzi: "Utandawazi na mifumo ya sasa ya kidijitali inaandaa njia kwa ajili ya chapa ya mnyama; dumu katika utakatifu kuzuia mtego huo." },
      { kitu: "Kujua Hatari ya Kipindi cha Dhiki Kuu", ufafanuzi: "Kutakuwa na dhiki kuu ambayo haijawahi kutokea tingu mwanzo wa dunia; pambana sasa ili unyakuliwe na usishuhudie mateso hayo." },
      { kitu: "Kujenga Msimamo Imara Isiyoyumba", ufafanuzi: "Kataa kabisa kufanya makubaliano yoyote yanayokiuka neno la Mungu kwa kisingizio cha kutaka kufanikiwa au kupata chakula." },
      { kitu: "Kutegemea Ulinzi wa Mungu Kila Siku", ufafanuzi: "Unapojisikia mnyonge, tuliza roho yako kwa kupumua kwa utulivu na kuomba kwa bidii, ukiweka imani yako yote katika ahadi za Bwana." },
      { kitu: "Kulinda Uaminifu Wako Katika Kipindi cha Mtihani", ufafanuzi: "Baki mwaminifu kwa misingi ya kiungu hata kama unalazimika kupitia vikwazo, ukijua thawabu yetu ni ya milele." }
    ]
  },
  {
    keys: ["kuja kwa mara ya pili", "pili kwa kristo", "magedoni", "har-magedoni"],
    items: [
      { kitu: "Kujua Tofauti ya Unyakuo na Kurudi kwa Pili", ufafanuzi: "Katika unyakuo Kristo anakuja hewani kuchukua watakatifu wake, lakini katika kuja kwa pili anakuja na watakatifu wake kuhukumu dunia." },
      { kitu: "Kutazama Ushindi wa Vita vya Har-Magedoni", ufafanuzi: "Mataifa yote yatapigana na Israeli, lakini Kristo atashuka kwa utukufu mkuu na kuwashinda maadui wote kwa pumzi ya kinywa chake." },
      { kitu: "Kuishi kwa Kutambua Mamlaka ya Kristo", ufafanuzi: "Mfalme wa wafalme atatawala kwa fimbo ya chuma; simama upande wake sasa ili uwe mshindi siku hiyo ya utukufu." },
      { kitu: "Kujiepusha na Mashirikiano ya Kasi ya Dunia", ufafanuzi: "Kataa kuungana na makundi au magenge yoyote yanayompinga Mungu kimaisha, ili usishiriki katika hukumu yao." },
      { kitu: "Kuishi kwa Ujasiri Bila Hofu ya Dhoruba", ufafanuzi: "Dhoruba zote za kisiasa na kijamii zinaonyesha kurudi kwa Kristo kuliko na ushindi; simama kwa ujasiri ukijua ukombozi wako unakaribia." }
    ]
  },
  {
    keys: ["miaka elfu moja", "millennial", "utawala wa amani"],
    items: [
      { kitu: "Kutamani Utawala wa Amani na Haki", ufafanuzi: "Kristo atatawala kimwili duniani kwa miaka elfu moja, ambapo shetani atafungwa na amani ya paradiso itarejea." },
      { kitu: "Kujiandaa Kutawala Pamoja na Kristo", ufafanuzi: "Watakatifu watatawala kama wafalme na makuhani; jifunze nidhamu ya uongozi na hekima ya Mungu leo ili ukae katika utukufu huo." },
      { kitu: "Kutafakari Amani Kati ya Uumbaji Wote", ufafanuzi: "Wanyama wataishi kwa amani na watoto watacheza na nyoka; ni picha nzuri ya urejesho ambayo tunapaswa kuingojea kwa imani." },
      { kitu: "Kuishi kwa Haki na Usawa Sasa", ufafanuzi: "Anza kutawala sasa juu ya tabia, mihemko na miili yetu ili tuweze kustahili kutawala pamoja naye katika utukufu." },
      { kitu: "Kutazama Mwisho wa Machafuko Duniani", ufafanuzi: "Huzuni zote, chuki, na migogoro zitaisha kabisa Kristo atakapochukua hatamu za ulimwengu; tuliza moyo wako kwa ahadi hii." }
    ]
  },
  {
    keys: ["hukumu", "kiti cha enzi", "white throne", "kitabu cha uzima"],
    items: [
      { kitu: "Kuhakikisha Jina Lako Lipo Kwenye Kitabu cha Uzima", ufafanuzi: "Hukumu hii ni ya mwisho kwa waovu wote; hakikisha jina lako limeandikwa kwa herufi za dhahabu katika Kitabu cha Uzima cha Mwanakondoo." },
      { kitu: "Kuishi kwa Hofu ya Kiungu na Toba ya Kila Siku", ufafanuzi: "Kila siri ya mwanadamu itafunuliwa siku hiyo; ishi kwa unyenyekevu, toba ya kila siku na kuepuka dhambi zote za siri." },
      { kitu: "Kuelewa Haki na Usawa wa Hukumu ya Mungu", ufafanuzi: "Mungu hana upendeleo; kila mtu atahukumiwa kulingana na matendo yake yaliyoandikwa kwenye vitabu vya mbinguni." },
      { kitu: "Kutubu Makosa na Kusafishwa kwa Damu ya Yesu", ufafanuzi: "Kila dhambi iliyotubiwa inafutwa kwa Damu ya Yesu na haitahukumiwa kamwe; kimbilia madhabahu ya toba kila asubuhi." },
      { kitu: "Kuepuka Kuhukumu Wengine Katika Jamii", ufafanuzi: "Acha hukumu kwa Mungu pekee; ishi kwa upendo, neema na kusamehe kila mtu anayekukosea katika safari yako yote." }
    ]
  },
  {
    keys: ["mbingu mpya", "nchi mpya", "paradiso iliyorejeshwa"],
    items: [
      { kitu: "Kutazama Makazi ya Milele ya Watakatifu", ufafanuzi: "Yerusalemu mpya itashuka kutoka mbinguni, ikiwa imepambwa kwa vito vya thamani na dhahabu safi kama kioo." },
      { kitu: "Kufurahia Maisha Yasiyo na Machozi wala Mauti", ufafanuzi: "Katika mbingu na nchi mpya hakutakuwa na maumivu, magonjwa, huzuni, wala kifo; Mungu atafuta kila chozi mioyoni mwetu." },
      { kitu: "Kudumu Kwenye Safari hadi Ushindi wa Mwisho", ufafanuzi: "Paradiso iliyopotea Edeni inarejeshwa kikamilifu; vumilia dhoruba zote za sasa kwani mwisho wetu ni wa utukufu usio na mwisho." },
      { kitu: "Kuishi kwa Mtazamo wa Milele na Utakatifu", ufafanuzi: "Yerusalemu mpya haitaingia kitu chochote kilicho kinyonge au kichafu; dumu katika utakatifu wa hali ya juu kila siku." },
      { kitu: "Kushukuru kwa Upendo Mkuu wa Mungu Leo", ufafanuzi: "Sifu na ushukuru Mungu kila siku kwa maandalizi ya makazi yetu ya milele ambapo tutaishi naye milele na milele." }
    ]
  }
];

// Hand-crafted Fallback Database for the 12 lessons of App Creator 24 Tutorial
const APP_CREATOR_FALLBACKS: { keys: string[], items: StudyNoteItem[] }[] = [
  {
    keys: ["utangulizi na vipengele", "components"],
    items: [
      { kitu: "Kuelewa Vipengele vya App Creator 24", ufafanuzi: "Jifunze vipengele vya msingi vya jukwaa la App Creator 24 kama vile Chat, Webview, na Cards ili kuvitumia vizuri." },
      { kitu: "Umuhimu wa Usanifu wa Mwanzo (Layout design)", ufafanuzi: "Andaa ramani na mwonekano wa app yako kabla ya kuanza kuingiza data ili iwe rahisi kutumiwa na watu." },
      { kitu: "Kuweka Rangi na Icons Zenye Kuvutia", ufafanuzi: "Tumia rangi zinazoendana na picha zenye mwonekano nadhifu ili kuongeza ubora wa kitalamu wa app yako." }
    ]
  },
  {
    keys: ["usimamizi wa section"],
    items: [
      { kitu: "Kupanga na Kutengeneza Section Mpya", ufafanuzi: "Section ndio msingi wa maudhui ya app yako; panga sections kwa kufuata mfumo rahisi na unaoeleweka upesi." },
      { kitu: "Kuweka Icons Kwenye Kila Section", ufafanuzi: "Kila section iwe na icon yake ya kipekee ili mtumiaji ajue wapi pa kubofya bila kuchanganyikiwa kimaisha." },
      { kitu: "Usimamizi wa Menu ya Kando (Navigation Drawer)", ufafanuzi: "Sanidi drawer menu vizuri ili kurahisisha utembeleaji wa sections zote muhimu za app yako." }
    ]
  },
  {
    keys: ["nje ya mtandao", "offline app"],
    items: [
      { kitu: "Kuingiza Maudhui ya Nje ya Mtandao (Offline HTML)", ufafanuzi: "Tumia sections za HTML au maandishi ya ndani ili app yako ifanye kazi kikamilifu bila uhitaji wa bando la intaneti." },
      { kitu: "Kupunguza Ukubwa wa Picha na Sauti", ufafanuzi: "Fanya compress kwa picha na video zote unazoingiza ili kuzuia app kuwa nzito sana kwenye simu za watumiaji." },
      { kitu: "Kuhakikisha Uzoefu Mzuri kwa Watumiaji wa Tanzania", ufafanuzi: "Tengeneza app inayofunguka haraka hata kwenye simu zenye uwezo mdogo (low-end phones) nchini Tanzania." }
    ]
  },
  {
    keys: ["apps za mtandaoni", "online app"],
    items: [
      { kitu: "Kuunganisha App na Seva za Mtandaoni", ufafanuzi: "Tumia viungo imara na sahihi (HTTPS) ili kuruhusu app yako kusasisha maudhui dynamically kutoka mbali." },
      { kitu: "Usimamizi wa Notification kwa Watumiaji (Push Notifications)", ufafanuzi: "Weka utaratibu wa kutuma push notifications kwa watumiaji wako kuwajulisha kuhusu maudhui mapya." },
      { kitu: "Kujaribu Kasi ya Mtandao wa App Yako", ufafanuzi: "Hakikisha app yako haichukui muda mrefu kupakia data inapokuwa kwenye mitandao ya polepole ya 3G nchini." }
    ]
  },
  {
    keys: ["app ya kuchati", "chat app"],
    items: [
      { kitu: "Kusanidi Section ya Chat ya Kikundi (Group Chat)", ufafanuzi: "Tengeneza vyumba vya mazungumzo na weka sheria za kujiunga ili kulinda usalama na maadili ya watumiaji." },
      { kitu: "Usimamizi wa Maudhui Mabaya (Moderation Tools)", ufafanuzi: "Weka uwezo wa kufuta meseji mbaya au kumzuia (block) mtumiaji anayevunja maadili kwenye chat ya app yako." },
      { kitu: "Kukuza Ushirikiano Kati ya Watumiaji", ufafanuzi: "Ruhusu watumiaji kutuma picha na emoji ili kufanya mazungumzo kuwa ya kuvutia na yenye kuchangamsha kimaisha." }
    ]
  },
  {
    keys: ["azam tv"],
    items: [
      { kitu: "Kutafuta Viungo Sahihi vya Streaming (m3u8 URLs)", ufafanuzi: "Tumia viungo halali vya utiririshaji (live stream URLs) ili kuwezesha watumiaji kuangalia chaneli za Azam TV offline/online." },
      { kitu: "Kuweka Video Player Imara na Rahisi", ufafanuzi: "Sanidi video player ya app yako kusaidia mifumo tofauti tofauti ya utiririshaji ili picha isigande wakati wa kuangalia." },
      { kitu: "Kuweka Ratiba za Vipindi Vya Azam TV", ufafanuzi: "Weka ratiba fupi ya mechi au vipindi ili kusaidia watazamaji wako kujua lini channel itakuwa hewani." }
    ]
  },
  {
    keys: ["habari za kiswahili"],
    items: [
      { kitu: "Kukusanya Vyanzo vya Habari vya Kimataifa (RSS Feeds)", ufafanuzi: "Unganisha RSS feeds za vyanzo vya kuaminika vya Kiswahili ili watumiaji wapate habari za sasa kwa usahihi." },
      { kitu: "Ubunifu wa Layout ya Kusoma Habari", ufafanuzi: "Tumia font kubwa ya kusomeka kwa urahisi na weka nafasi (padding) ya kutosha ili msomaji asichoke macho." },
      { kitu: "Kuweka Kipengele cha Kusoma Habari Nje ya Mtandao", ufafanuzi: "Ruhusu app kuhifadhi (cache) habari za karibuni ili mtumiaji asome hata akiwa vijijini bila mtandao." }
    ]
  },
  {
    keys: ["dj mark"],
    items: [
      { kitu: "Kuweka Viungo vya Video Laini", ufafanuzi: "Tumia viungo vya video kutoka seva za uhakika ili video za burudani za DJ Mark zifunguke kwa kasi ya juu." },
      { kitu: "Uandaaji wa List ya Video kwa Jamii", ufafanuzi: "Panga video kwa makundi (kama vile Action, Bongo, nk) ili mtumiaji apate anachopenda kwa urahisi." },
      { kitu: "Kuweka Option ya Kuomba Video Mpya (Request Section)", ufafanuzi: "Weka fomu rahisi ili watumiaji waandike maoni au video wanazotaka DJ Mark aziweke katika app." }
    ]
  },
  {
    keys: ["masomo ya shule", "msingi tanzania"],
    items: [
      { kitu: "Kupanga Maudhui kwa Ngazi za Madarasa", ufafanuzi: "Tenga masomo kwa madarasa (Darasa la 1 hadi la 7) ili mwanafunzi au mzazi apate masomo sahihi kwa wakati sahihi." },
      { kitu: "Kuweka Maswali ya Mazoezi (Quizzes offline)", ufafanuzi: "Tengeneza chemsha bongo rahisi offline ili wanafunzi wapime uelewa wao baada ya kusoma somo husika." },
      { kitu: "Kuhakikisha Lugha ya Kiswahili Rahisi", ufafanuzi: "Tumia Kiswahili fasaha na cha kawaida kinachoeleweka kwa watoto wa shule za msingi nchini Tanzania." }
    ]
  },
  {
    keys: ["biashara ya mazao"],
    items: [
      { kitu: "Kuweka Bei za Sasa za Mazao Sokoni", ufafanuzi: "Weka orodha ya bei za mazao (kama mahindi, mchele, maharagwe) katika mikoa tofauti ili kusaidia wakulima wetu." },
      { kitu: "Kuweka Mawasiliano ya Wauzaji na Wanunuzi", ufafanuzi: "Tengeneza section yenye namba za simu za wauzaji ili kurahisisha biashara bila madalali dhalimu kimaisha." },
      { kitu: "Kutoa Ushauri wa Kilimo na Uhifadhi", ufafanuzi: "Weka dondoo fupi za jinsi ya kupanda, kuvuna na kuhifadhi mazao ili kuzuia hasara kwa wakulima." }
    ]
  },
  {
    keys: ["vituo vya redio", "fm stations"],
    items: [
      { kitu: "Kuingiza Viungo vya Sauti vya Redio FM (Icecast/Shoutcast)", ufafanuzi: "Kusanya na kuweka viungo vya utiririshaji wa sauti (audio streaming URLs) vya vituo vya redio maarufu nchini." },
      { kitu: "Usimamizi wa Kicheza Sauti Ndani ya App", ufafanuzi: "Hakikisha redio inaendelea kucheza kwa nyuma (background play) mtumiaji anapofanya mambo mengine kwenye simu yake." },
      { kitu: "Kupunguza Matumizi ya Bando kwa Utiririshaji wa Sauti", ufafanuzi: "Tumia viungo vyenye bitrate ya kawaida (kama 64kbps) ili kuokoa bando la watumiaji wako wa Tanzania." }
    ]
  },
  {
    keys: ["kanuni kuu za uundaji"],
    items: [
      { kitu: "Sheria ya Kasi na Wepesi wa App", ufafanuzi: "App nzuri isizidi 15MB katika uundaji wake mwanzo ili isichukue nafasi kubwa kwenye simu za watumiaji." },
      { kitu: "Kujaribu App Kwenye Simu Tofauti Tofauti", ufafanuzi: "Kabla ya kusambaza app, ijaribu kwenye simu mbili au tatu za Android kuona kama inafanya kazi bila matatizo." },
      { kitu: "Uaminifu na Usalama wa Data za Watumiaji", ufafanuzi: "Usiombe ruhusa (permissions) ambazo app yako haizihitaji (kama vile namba za simu au mahali alipo mtumiaji)." }
    ]
  }
];

// Smart builder that dynamically weaves cleanLesson directly into categories
function generateDynamicFallbackPoints(cleanLesson: string, category: string): StudyNoteItem[] {
  if (category === "uchumi") {
    return [
      {
        kitu: `Kusimamia Nidhamu ya Fedha Katika ${cleanLesson}`,
        ufafanuzi: `Weka nidhamu ya kiungu na uamuzi thabiti wa kifedha katika kufuata kanuni zote tulizofundishwa leo kuhusu ${cleanLesson}.`
      },
      {
        kitu: `Kutengeneza Akiba na Bajeti ya ${cleanLesson}`,
        ufafanuzi: `Andika chini kila matumizi na tenga angalau asilimia 10 hadi 20 ya kipato chako kama akiba ya kusaidia malengo yako ya ${cleanLesson}.`
      },
      {
        kitu: `Kuanzisha Chanzo cha Pili Kupitia ${cleanLesson}`,
        ufafanuzi: `Tafuta fursa ndogo ya biashara au uwekezaji inayoweza kukuingizia kipato cha ziada ukiongozwa na mada ya leo ya ${cleanLesson}.`
      },
      {
        kitu: `Kutoa Zaka na Sadaka Katika ${cleanLesson}`,
        ufafanuzi: `Mpe Mungu sehemu ya kumi kwa uaminifu na dhabihu kabla ya kufanya matumizi yoyote ili kulinda baraka za ${cleanLesson} kimaisha.`
      },
      {
        kitu: `Kufanya Kazi kwa Ubora wa Juu Kuhusu ${cleanLesson}`,
        ufafanuzi: `Tekeleza kazi zako na biashara yako kwa viwango vya juu na uaminifu kana kwamba unamfanyia Mungu katika fani ya ${cleanLesson}.`
      }
    ];
  } else if (category === "kiroho") {
    return [
      {
        kitu: `Kusimamisha Madhabahu ya Siri ya ${cleanLesson}`,
        ufafanuzi: `Tengeneza kona maalum ya utulivu nyumbani kwako ili kuomba na kutafakari kila siku kwa bidii misingi tuliyojifunza ya ${cleanLesson}.`
      },
      {
        kitu: `Kutamka na Kusimamai Neno katika ${cleanLesson}`,
        ufafanuzi: `Unapokabiliwa na dhoruba au vikwazo kimaisha, fungua kinywa chako na utamke mistari ya ushindi inayolinda na kusimamia ${cleanLesson}.`
      },
      {
        kitu: `Kufanya Maombi ya Kufunga Kuhusu ${cleanLesson}`,
        ufafanuzi: `Weka utaratibu wa kufunga angalau siku moja kwa wiki ili kuimarisha utu wako wa ndani na kusikia sauti ya kiungu katika ${cleanLesson}.`
      },
      {
        kitu: `Kusoma na Kutafakari Biblia Katika ${cleanLesson}`,
        ufafanuzi: `Soma kwa makini sura moja au mbili kila siku asubuhi, ukiandika chini jambo moja thabiti la kufanyia kazi kabla ya kuanza ${cleanLesson}.`
      },
      {
        kitu: `Kuishi Chini ya Ulinzi wa Damu ya Yesu na ${cleanLesson}`,
        ufafanuzi: `Tamka ulinzi wa Damu ya Yesu juu ya maisha yako, watoto na kazi yako kila asubuhi ili kuzuia adui asiharibu neema ya ${cleanLesson}.`
      }
    ];
  } else if (category === "ndoa") {
    return [
      {
        kitu: `Kuonyesha Upendo na Heshima katika ${cleanLesson}`,
        ufafanuzi: `Mume penda mke wako kwa dhati kwa kumsikiliza na kumjali, na mke mheshimu mume wako kwa lugha ya upole ukiishi kwa kanuni za ${cleanLesson}.`
      },
      {
        kitu: `Kujenga Mawasiliano ya Wazi Kuhusu ${cleanLesson}`,
        ufafanuzi: `Mzungumze kwa utulivu na uwazi kuhusu changamoto za ${cleanLesson} chumbani sirini kabla ya kulala bila hasira wala vinyongo.`
      },
      {
        kitu: `Kuombeana na Kusimama Pamoja Katika ${cleanLesson}`,
        ufafanuzi: `Weka utaratibu wa kushikana mikono kila siku na mwenza wako kuomba pamoja ili kulinda amani na ustawi wa ndoa yenu katika ${cleanLesson}.`
      },
      {
        kitu: `Kutunza Faragha na Siri Zote za ${cleanLesson}`,
        ufafanuzi: `Linda siri zote za ndani ya nyumba na usithubutu kushirikisha mapungufu au migogoro ya ${cleanLesson} kwa watu wa nje au mitandaoni.`
      },
      {
        kitu: `Kupanga Muda Maalum wa Pamoja Katika ${cleanLesson}`,
        ufafanuzi: `Tengeneza muda wa kuwa pamoja kama mume na mke (kama vile Date Night) kufanya tathmini na kufurahia malengo ya ${cleanLesson}.`
      }
    ];
  } else if (category === "it") {
    return [
      {
        kitu: `Ulinzi na Usalama wa Taarifa katika ${cleanLesson}`,
        ufafanuzi: `Badilisha password zako zote kuwa imara na weka ulinzi wa hatua mbili (2FA) kulinda mifumo na akaunti zote za kazi za ${cleanLesson}.`
      },
      {
        kitu: `Kutumia Akili Bandia (AI) Kuhusu ${cleanLesson}`,
        ufafanuzi: `Tumia AI na kuandika prompts sahihi zenye muktadha, mifano na miongozo sahihi ili kurahisisha na kuleta tija kubwa katika ${cleanLesson}.`
      },
      {
        kitu: `Kuunda Mifumo Inayofanya Kazi Offline Katika ${cleanLesson}`,
        ufafanuzi: `Hakikisha tovuti au programu unazounda nchini Tanzania zinafaa kutumika offline ili kuwasaidia watumiaji kuokoa gharama za bando la ${cleanLesson}.`
      },
      {
        kitu: `Kutumia Teknolojia kwa Maadili katika ${cleanLesson}`,
        ufafanuzi: `Linda uaminifu wako mtandaoni kitalamu kwa kukataa dukuaji haramu, wizi wa data, au uasherati wa digitali katika ${cleanLesson}.`
      },
      {
        kitu: `Kujifunza na Kuboresha Stadi za IT Kuhusu ${cleanLesson}`,
        ufafanuzi: `Tenga angalau dakika 30 kila siku kujifunza ujuzi mpya na kusoma mabadiliko ili uwe hodari na wa kipekee katika ${cleanLesson}.`
      }
    ];
  } else {
    // category maisha
    return [
      {
        kitu: `Kujenga Nidhamu Binafsi Kuhusu ${cleanLesson}`,
        ufafanuzi: `Kamilisha kazi zako zote kwa wakati uliopangwa bila kuruhusu uvivu wala ugonjwa wa kuahirisha mambo kukuzuia katika ${cleanLesson}.`
      },
      {
        kitu: `Kudhibiti Msongo wa Mawazo Katika ${cleanLesson}`,
        ufafanuzi: `Unapokutana na dhoruba au vikwazo kimaisha, tuliza roho yako kwa kupumua kwa utulivu na kuomba neema ya ${cleanLesson}.`
      },
      {
        kitu: `Kutunza Utanashati na Mwonekano wa ${cleanLesson}`,
        ufafanuzi: `Vaa mavazi nadhifu na yenye heshima yanayoakisi utu wako safi ili ujenge ujasiri dhabiti wa kukabiliana na changamoto za ${cleanLesson}.`
      },
      {
        kitu: `Kujenga Uhusiano Chanya na Watu katika ${cleanLesson}`,
        ufafanuzi: `Sikiliza wengine kwa makini kabla ya kujibu, taja mazuri ya watu na uepuke kabisa majungu au uvumi usio na tija kuhusu ${cleanLesson}.`
      },
      {
        kitu: `Kuweka Malengo na Kufanya Tathmini Kuhusu ${cleanLesson}`,
        ufafanuzi: `Kila Jumapili jioni, tenga muda wa kuandika malengo matatu na ufanye tathmini ya makosa ya nyuma ili kukua katika ${cleanLesson}.`
      }
    ];
  }
}

function isQuestion(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  if (normalized.includes('?')) return true;
  if (normalized.startsWith('je ') || normalized.startsWith('je,') || normalized.startsWith('je!')) return true;
  if (normalized.startsWith('kwa nini') || normalized.startsWith('kwanini')) return true;
  if (normalized.startsWith('mbona')) return true;
  if (normalized.startsWith('lini')) return true;
  if (normalized.startsWith('vipi')) return true;
  if (normalized.startsWith('nani')) return true;
  if (normalized.startsWith('gani')) return true;
  return false;
}

// Extract points from paragraphs dynamically
function extractPointsFromParagraphs(paragraphs: string[]): StudyNoteItem[] {
  const items: StudyNoteItem[] = [];
  paragraphs.forEach(p => {
    let kitu = "";
    let ufafanuzi = "";
    
    if (p.includes(':') && p.indexOf(':') < 100 && p.indexOf(':') > 3) {
      const parts = p.split(':');
      kitu = cleanText(parts[0]);
      ufafanuzi = cleanText(parts.slice(1).join(':'));
    } else {
      const sents = p.split(/(?<=[.!?])\s+/);
      if (sents.length >= 2) {
        kitu = cleanText(sents[0]);
        ufafanuzi = cleanText(sents.slice(1).join(" "));
      } else if (p.length > 30) {
        // Only one sentence, take first few words as title
        const words = p.split(/\s+/);
        if (words.length > 5) {
          kitu = words.slice(0, 5).join(" ") + "...";
          ufafanuzi = p;
        }
      }
    }
    
    if (kitu && ufafanuzi && kitu.length > 4 && ufafanuzi.length > 15) {
      if (!isHeadingOrVerse(kitu) && !isHeadingOrVerse(ufafanuzi) && !isQuestion(kitu) && !isQuestion(ufafanuzi)) {
        // If kitu is too long, clean it or truncate it to be a beautiful title
        if (kitu.length > 70) {
          const words = kitu.split(/\s+/);
          kitu = words.slice(0, 6).join(" ") + "...";
        }
        items.push({ kitu, ufafanuzi });
      }
    }
  });
  return items;
}

const STRONG_SWAHILI_IMPERATIVES = [
  "soma", "tafakari", "andika", "weka", "panga", "epuka", "jenga", "fanya", "tenga", "linda", 
  "tumia", "kuza", "simamia", "anza", "hakikisha", "jitahidi", "jizoeze", "dhibiti", "chagua", 
  "fuatilia", "shirikisha", "omba", "kumbuka", "sali", "zingatia", "tenda", "pima", "nenda", 
  "toa", "sikiliza", "jitenge", "jilinde", "jiepushe", "jiandae", "mheshimu", "muombe", 
  "msikilize", "mtendee", "orodhesha", "chunguza", "tathmini", "kabili", "wasiliana", "pitia", 
  "kamilisha", "ongeza", "punguza", "timiza", "shirikiana", "nena", "kabiri", "kagua", "amka",
  "ula", "kunywa", "pasi", "vaa", "tembea", "jipongeze", "dumisha", "badilisha", "sanidi",
  "tafuta", "kutana", "saidia", "shiriki", "jifunze", "elewa", "chambua", "laza", "kimbia",
  "wekeza", "changia", "tazama", "tafsiri", "kiri", "hubiri", "anzisha", "kusanya", "punguza",
  "ongeza", "rekebisha", "kula", "kunywa", "panga", "pima", "vunja", "ondoa", "kataa", "kubali",
  "safisha", "imarisha"
];

function startsWithStrongImperative(text: string): boolean {
  const words = text.trim().toLowerCase().split(/\s+/);
  if (words.length === 0) return false;
  const firstWord = words[0].replace(/[^a-z]/g, '');
  return STRONG_SWAHILI_IMPERATIVES.some(imp => firstWord === imp || firstWord.startsWith(imp));
}

function toSwahiliImperative(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^['"“‘*-\s]+/, '');
  
  const prefixesToStrip = [
    /^(umuhimu\s+wa|faida\s+za|faida\s+ya|hasara\s+za|hasara\s+ya|madhara\s+ya|sababu\s+za|sababu\s+ya|maana\s+ya|tafsiri\s+ya|lengo\s+la|malengo\s+ya|siri\s+ya|siri\s+za|alama\s+za|alama\s+ya|njia\s+za|njia\s+ya|mbinu\s+za|mbinu\s+ya|jinsi\s+ya|namna\s+ya|kanuni\s+za|kanuni\s+ya|wajibu\s+wa|haja\s+ya|uhitaji\s+wa|misingi\s+ya|misingi\s+wa|shahada\s+ya|ushahidi\s+wa|ushahidi\s+ya)\s*,?\s*/i,
    /^(katika\s+somo\s+hili|kwa\s+hiyo|hivyo|basi|kwa\s+ujumla|kwanza|pili|tatu|nne|tano)\s*,?\s*/i,
    /^(mwanafunzi|mtu|kila\s+mtu|kila\s+mmoja|kila\s+mwanafunzi|sisi|sote|waamini|wakristo|wanandoa|watumiaji|watengenezaji)\s+(anapaswa|anatakiwa|anashauriwa|anafaa|inabidi|anajifunza|anapenda|analazimika|anaruhusiwa|anapaswa\s+pia|anapaswa\s+vilevile)\s+(ku|kuji|kumu|kum|kuwa|kufanya)?/i,
    /^(unapaswa|unapaswa\s+pia|unapaswa\s+vilevile|unatakiwa|tunatakiwa|inabidi|kumbuka|hakikisha|anza|jaribu|jitahidi|muhimu|unashauriwa|inashauriwa)\s+(ku|kuji|kumu|kum|kuwa|kufanya)?/i,
    /^(ni\s+muhimu\s+sana|ni\s+muhimu|ni\s+vizuri|ni\s+vyema|ni\s+vyema\s+sana|ni\s+bora|ni\s+lazima)\s+(kwa\s+mwanafunzi|kwa\s+kila\s+mtu|kwa\s+kristo|kwa\s+mwamini)?\s*(ku|kuji|kumu|kum|kuwa|kufanya)?/i,
    /^(kuwa\s+makini\s+na|kuwa\s+makini\s+katika)\s+/i,
    /^(kuanzisha|kuanza)\s+/i,
    /^(kusimamia|kusimamia\s+vizuri)\s+/i,
    /^(kujifunza|kujifunza\s+jinsi\s+ya)\s+/i,
    /^(kufanya|kufanya\s+tathmini\s+ya)\s+/i,
    /^(kutenga|kutenga\s+muda\s+wa)\s+/i,
    /^(kujenga|kujenga\s+tabia\s+ya)\s+/i,
    /^(kuhakikisha|kuhakikisha\s+kuwa)\s+/i,
    /^(kutumia|kutumia\s+vizuri)\s+/i,
    /^(kutunza|kutunza\s+vizuri)\s+/i,
    /^(kudumisha|kudumisha\s+vizuri)\s+/i,
    /^(kushirikisha|kushirikisha\s+vizuri)\s+/i,
    /^(kuepuka|kuepuka\s+kabisa)\s+/i
  ];

  let loop = true;
  while (loop) {
    let matched = false;
    for (const prefix of prefixesToStrip) {
      if (prefix.test(cleaned)) {
        cleaned = cleaned.replace(prefix, "").trim();
        matched = true;
      }
    }
    if (!matched) {
      loop = false;
    }
  }

  // Convert common action nouns to direct imperative verbs
  const nounToVerbMaps: [RegExp, string][] = [
    [/^usimamizi\s+wa\s+/i, "Simamia "],
    [/^upangaji\s+wa\s+/i, "Panga "],
    [/^uwekaji\s+wa\s+/i, "Weka "],
    [/^uandishi\s+wa\s+/i, "Andika "],
    [/^utunzaji\s+wa\s+/i, "Tunza "],
    [/^ujenzi\s+wa\s+/i, "Jenga "],
    [/^ufunguaji\s+wa\s+/i, "Fungua "],
    [/^uanzishaji\s+wa\s+/i, "Anzisha "],
    [/^ulinzi\s+wa\s+/i, "Linda "],
    [/^ukuaji\s+wa\s+/i, "Kuza "],
    [/^uepukaji\s+wa\s+/i, "Epuka "],
    [/^utafutaji\s+wa\s+/i, "Tafuta "],
    [/^utengenezaji\s+wa\s+/i, "Tengeneza "],
    [/^usafishaji\s+wa\s+/i, "Safisha "],
    [/^uimarishaji\s+wa\s+/i, "Imarisha "],
    [/^upunguzaji\s+wa\s+/i, "Punguza "],
    [/^uongezaji\s+wa\s+/i, "Ongeza "],
    [/^usambazaji\s+wa\s+/i, "Sambaza "],
    [/^utekelezaji\s+wa\s+/i, "Tekeleza "],
    [/^ushirikishwaji\s+wa\s+/i, "Shirikisha "],
    [/^utambuzi\s+wa\s+/i, "Tambua "],
    [/^upimaji\s+wa\s+/i, "Pima "],
    [/^uthamini\s+wa\s+/i, "Tathmini "],
    [/^uombaji\s+wa\s+/i, "Omba "],
    [/^upitishaji\s+wa\s+/i, "Pitia "],
    [/^uboreshaji\s+wa\s+/i, "Boresha "],
    [/^ufuatiliaji\s+wa\s+/i, "Fuatilia "],
    [/^ugawaji\s+wa\s+/i, "Gawa "],
    [/^uuzaji\s+wa\s+/i, "Uza "],
    [/^ununuzi\s+wa\s+/i, "Nunua "],
    [/^ulipaji\s+wa\s+/i, "Lipa "],
    [/^ukusanyaji\s+wa\s+/i, "Kusanya "],
    [/^uwekezaji\s+wa\s+/i, "Wekeza "],
    [/^majadiliano\s+ya\s+/i, "Jadili "],
    [/^ushirikiano\s+wa\s+/i, "Shirikiana "],
    [/^mawasiliano\s+ya\s+/i, "Wasiliana "],
    [/^huduma\s+ya\s+/i, "Toa huduma ya "],
    [/^matumizi\s+ya\s+/i, "Tumia "],
    [/^maandalizi\s+ya\s+/i, "Jiandae na "],
    [/^ushiriki\s+katika\s+/i, "Shiriki katika "],
    [/^mafunzo\s+ya\s+/i, "Jifunze kuhusu "],
    [/^imani\s+katika\s+/i, "Amini katika "],
    [/^sala\s+ya\s+/i, "Sali "],
    [/^maombi\s+ya\s+/i, "Omba "],
    [/^utii\s+kwa\s+/i, "Tii "],
    [/^upendo\s+katika\s+/i, "Onyesha upendo katika "],
    [/^msamaha\s+wa\s+/i, "Samehe "],
    [/^unyenyekevu\s+wa\s+/i, "Onyesha unyenyekevu katika "],
    [/^uvumilivu\s+wa\s+/i, "Kuwa mvumilivu katika "],
    [/^ujasiri\s+wa\s+/i, "Onyesha ujasiri katika "],
    [/^mabadiliko\s+ya\s+/i, "Badilisha "],
    [/^ubora\s+wa\s+/i, "Imarisha ubora wa "],
    [/^nidhamu\s+ya\s+/i, "Jenga nidhamu ya "],
    [/^uaminifu\s+wa\s+/i, "Kuwa mwaminifu katika "],
    [/^shukrani\s+kwa\s+/i, "Shukuru "],
    [/^toba\s+ya\s+/i, "Tubu "],
    [/^hekima\s+ya\s+/i, "Tafuta hekima ya "],
    [/^andiko\s+la\s+/i, "Soma andiko la "],
    [/^mstari\s+wa\s+/i, "Soma mstari wa "],
    [/^somo\s+la\s+/i, "Soma somo la "],
    [/^kitabu\s+cha\s+/i, "Soma kitabu cha "],
    [/^ushauri\s+wa\s+/i, "Tafuta ushauri wa "],
    [/^utaratibu\s+wa\s+/i, "Weka utaratibu wa "],
    [/^mpango\s+wa\s+/i, "Panga "],
    [/^lengo\s+la\s+/i, "Weka lengo la "],
    [/^malengo\s+ya\s+/i, "Weka malengo ya "],
    [/^vikwazo\s+vya\s+/i, "Epuka vikwazo vya "],
    [/^changamoto\s+za\s+/i, "Kabili changamoto za "],
    [/^misingi\s+ya\s+/i, "Fuata misingi ya "],
    [/^ibada\s+ya\s+/i, "Shiriki ibada ya "],
    [/^ushurika\s+wa\s+/i, "Shiriki ushirika wa "],
    [/^mambo\s+muhimu\s+/i, "Fanyia kazi mambo muhimu "],
    [/^mistari\s+/i, "Soma mistari "],
    [/^dondoo\s+/i, "Pitia dondoo "],
    [/^hatua\s+/i, "Tekeleza hatua "]
  ];

  for (const [regex, replacement] of nounToVerbMaps) {
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, replacement).trim();
      break;
    }
  }

  // Handle Swahili infinitive prefix "ku" or subject prefixes "ana", "una", "tuna"
  const words = cleaned.split(/\s+/);
  if (words.length > 0) {
    const firstWord = words[0];
    const rest = cleaned.substring(firstWord.length);
    const lowerFirst = firstWord.toLowerCase();

    // Remove non-alphabetic chars from firstWord for processing
    const cleanWord = lowerFirst.replace(/[^a-z]/g, '');

    let transformed = firstWord; // default

    if (cleanWord.startsWith("kujifunza")) {
      transformed = "jifunze";
    } else if (cleanWord.startsWith("kujilinda")) {
      transformed = "jilinde";
    } else if (cleanWord.startsWith("kujitenga")) {
      transformed = "jitenge";
    } else if (cleanWord.startsWith("kujiepusha")) {
      transformed = "jiepushe";
    } else if (cleanWord.startsWith("kujiandaa")) {
      transformed = "jiandae";
    } else if (cleanWord.startsWith("kujizoeza")) {
      transformed = "jizoeze";
    } else if (cleanWord.startsWith("kujitahidi")) {
      transformed = "jitahidi";
    } else if (cleanWord.startsWith("kumsikiliza")) {
      transformed = "msikilize";
    } else if (cleanWord.startsWith("kumtendea")) {
      transformed = "mtendee";
    } else if (cleanWord.startsWith("kumheshimu")) {
      transformed = "mheshimu";
    } else if (cleanWord.startsWith("kumuomba")) {
      transformed = "muombe";
    } else if (cleanWord.startsWith("kumuheshimu")) {
      transformed = "mheshimu";
    } else if (cleanWord.startsWith("kumsaidia")) {
      transformed = "msaidie";
    } else if (cleanWord.startsWith("kumshirikisha")) {
      transformed = "mshirikishe";
    } else if (cleanWord.startsWith("kuwaombea")) {
      transformed = "waombee";
    } else if (cleanWord.startsWith("kuwasaidia")) {
      transformed = "wasaidie";
    } else if (cleanWord.startsWith("kuwaheshimu")) {
      transformed = "waheshimu";
    } else if (cleanWord.startsWith("kuji")) {
      const stem = cleanWord.substring(4);
      if (stem.endsWith("a")) {
        transformed = "ji" + stem.slice(0, -1) + "e";
      } else {
        transformed = "ji" + stem;
      }
    } else if (cleanWord.startsWith("ku")) {
      if (cleanWord === "kula" || cleanWord === "kunywa" || cleanWord === "kuja" || cleanWord === "kuwa") {
        transformed = cleanWord;
      } else {
        transformed = cleanWord.substring(2);
      }
    } else if (cleanWord.startsWith("anaji") || cleanWord.startsWith("unaji") || cleanWord.startsWith("tunaji")) {
      const stem = cleanWord.substring(5);
      if (stem.endsWith("a")) {
        transformed = "ji" + stem.slice(0, -1) + "e";
      } else {
        transformed = "ji" + stem;
      }
    } else if (cleanWord.startsWith("ana") || cleanWord.startsWith("una") || cleanWord.startsWith("tuna")) {
      const stem = cleanWord.substring(3);
      if (stem.length >= 3) {
        if (stem.startsWith("ji")) {
          const s = stem.substring(2);
          if (s.endsWith("a")) {
            transformed = "ji" + s.slice(0, -1) + "e";
          } else {
            transformed = "ji" + s;
          }
        } else {
          transformed = stem;
        }
      }
    }

    // Preserve original casing/capitalization
    if (transformed !== firstWord) {
      cleaned = transformed + rest;
    }
  }

  cleaned = cleaned.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function getPrependedText(prefix: string, body: string): string {
  if (!body) return prefix;
  let firstChar = body.charAt(0);
  let rest = body.slice(1);
  
  // Do not lowercase proper nouns
  const words = body.split(/\s+/);
  const firstWord = words[0];
  const properNouns = ["mungu", "kristo", "biblia", "kikristo", "yesu", "roho", "johana", "isaya", "pasto", "shetani", "yahwe", "adam", "eva", "israel", "israeli", "yohana", "paulo", "petro", "mtakatifu", "bwana"];
  if (properNouns.includes(firstWord.toLowerCase())) {
    // Keep casing as is
  } else {
    firstChar = firstChar.toLowerCase();
  }
  
  return prefix.trim() + " " + firstChar + rest;
}

const GENERAL_FALLBACKS = [
  "Tekeleza kwa umakini",
  "Hakikisha unafanyia kazi",
  "Jitahidi kufuata",
  "Chukua hatua za kufanya",
  "Anza mara moja kufanya",
  "Boresha kiutendaji",
  "Fuatilia kwa ukaribu",
  "Imarisha utaratibu wa",
  "Jenga tabia ya kufanya",
  "Weka juhudi katika",
  "Dhibiti na usimamie"
];

const EXPLANATORY_FALLBACKS = [
  "Hakikisha unaweka juhudi katika",
  "Jitahidi sana kufanikisha",
  "Tekeleza kwa bidii mada ya",
  "Fanya juhudi kubwa kufanikisha",
  "Chukua jukumu thabiti la",
  "Anza leo kufanya maboresho katika",
  "Imarisha kabisa utendaji wako kwenye",
  "Fanya tathmini ya kina kuhusu",
  "Jenga nidhamu thabiti ya",
  "Dumu katika kufanya na kutenda"
];

function toSubjunctiveVerb(firstWord: string): string {
  const lowerWord = firstWord.toLowerCase().replace(/[^a-z]/g, "");
  
  // Explicit map
  const verbMap: Record<string, string> = {
    "amka": "unaamka",
    "anza": "unaanza",
    "andika": "unaandika",
    "anzisha": "unaanzisha",
    "boresha": "unaboresha",
    "chagua": "unachagua",
    "chambua": "unachambua",
    "chukua": "unachukua",
    "chunguza": "unachunguza",
    "dhibiti": "unadhibiti",
    "dumu": "unadumu",
    "epuka": "unaepuka",
    "fanya": "unafanya",
    "fuata": "unafuata",
    "fuatilia": "unafuatilia",
    "hudhuria": "unahudhuria",
    "heshimu": "unaheshimu",
    "hifadhi": "unahifadhi",
    "imarisha": "unaimarisha",
    "jenga": "unajenga",
    "jifunze": "unajifunze",
    "jiepushe": "unajiepusha",
    "jizoeze": "unajizoeza",
    "jiwekee": "unajiwekea",
    "jipongeze": "unajipongeze",
    "kabili": "unakabili",
    "kamilisha": "unakamilisha",
    "kagua": "unakagua",
    "kiri": "unakiri",
    "kula": "unakula",
    "kunywa": "unakunywa",
    "linda": "unalinda",
    "mpe": "unampa",
    "msikilize": "unamsikiliza",
    "mheshimu": "unamheshimu",
    "nunua": "unanunua",
    "nenda": "unaenda",
    "omba": "unaomba",
    "onyesha": "unaonyesha",
    "panga": "unapanga",
    "pitia": "unapitia",
    "pima": "unapima",
    "sali": "unasali",
    "soma": "unasoma",
    "sanidi": "unasanidi",
    "simamia": "unasimamia",
    "shiriki": "unashiriki",
    "shirikiana": "unashirikiana",
    "shirikisha": "unashirikisha",
    "tafuta": "unatafuta",
    "tafakari": "unatafakari",
    "tenga": "unatenga",
    "tekeleza": "unatekeleza",
    "toa": "unatoa",
    "tubu": "unatubu",
    "tunza": "unatunza",
    "timiza": "unatimiza",
    "tambua": "unatambua",
    "tumia": "unatumia",
    "thamini": "unathamini",
    "utamke": "unatamka",
    "weka": "unaweka",
    "wekeza": "unawekeza",
    "wasiliana": "unawasiliana",
    "zingatia": "unazingatia"
  };

  if (verbMap[lowerWord]) {
    return verbMap[lowerWord];
  }

  // Regex and prefix-based rules
  if (lowerWord.startsWith("una")) {
    return lowerWord;
  }
  if (lowerWord.startsWith("ji")) {
    return "unaji" + lowerWord.slice(2);
  }
  if (lowerWord.startsWith("m") && !lowerWord.startsWith("ma") && !lowerWord.startsWith("mbe") && !lowerWord.startsWith("mbi")) {
    return "unam" + lowerWord.slice(1);
  }
  if (lowerWord.startsWith("ku")) {
    return "una" + lowerWord.slice(2);
  }
  
  return "una" + lowerWord;
}

function convertToHakikishaKitendoKivumishi(text: string): string {
  if (!text) return "";
  let body = toSwahiliImperative(text);
  
  // Strip any leading "hakikisha " if it is followed by something
  const lowerBody = body.toLowerCase();
  if (lowerBody.startsWith("hakikisha ")) {
    body = body.slice(9).trim();
  }
  
  const words = body.split(/\s+/);
  if (words.length === 0) return text;
  
  const firstWord = words[0];
  const rest = words.slice(1).join(" ");
  
  const subjunctiveVerb = toSubjunctiveVerb(firstWord);
  
  if (rest) {
    let firstChar = rest.charAt(0);
    const restWord = rest.split(/\s+/)[0];
    const properNouns = ["mungu", "kristo", "biblia", "kikristo", "yesu", "roho", "johana", "isaya", "pasto", "shetani", "yahwe", "adam", "eva", "israel", "israeli", "yohana", "paulo", "petro", "mtakatifu", "bwana"];
    if (!properNouns.includes(restWord.toLowerCase())) {
      firstChar = firstChar.toLowerCase();
    }
    const cleanRest = firstChar + rest.slice(1);
    return `Hakikisha ${subjunctiveVerb} ${cleanRest}`;
  } else {
    return `Hakikisha ${subjunctiveVerb}`;
  }
}

function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  const sentences: string[] = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;
    if ((char === '.' || char === '!' || char === '?') && (i === text.length - 1 || text[i + 1] === ' ')) {
      sentences.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) {
    sentences.push(current.trim());
  }
  return sentences;
}

function cleanFirstSentenceBeforeIli(sentence: string): string {
  const patterns = [
    /\s+ili\s+uweze\s+kupata\s+/i,
    /\s+ili\s+uweze\s+/i,
    /\s+ili\s+upate\s+/i,
    /\s+ili\s+/i,
    /\s+kwa\s+ajili\s+ya\s+/i,
    /\s+kwa\s+kuwa\s+/i
  ];
  let cleaned = sentence;
  // Remove ending period temporarily if any
  if (cleaned.endsWith(".")) {
    cleaned = cleaned.slice(0, -1);
  }
  for (const pattern of patterns) {
    const match = cleaned.split(pattern);
    if (match.length > 0) {
      cleaned = match[0];
    }
  }
  return cleaned.trim();
}

const MATOKEO_MAZURI: Record<string, string[]> = {
  kiroho: [
    "ili uweze kukua kiroho, kupata amani ya kweli na kibali mbele za Mungu",
    "ili uimarishe imani yako thabiti na upate baraka tele za kiungu kila siku",
    "ili upate ulinzi kamili wa kiroho dhidi ya vishawishi na changamoto za ulimwengu",
    "ili udumishe ushirika mzuri na Mungu na kuishi maisha yenye ushuhuda mwema"
  ],
  eskatolojia: [
    "ili uweze kusimama imara katika imani na kujiandaa vyema kwa unyakuo na uzima wa milele",
    "ili uelewe ishara za nyakati na kulinda roho yako dhidi ya upotoshaji wa siku za mwisho",
    "ili uishi maisha ya utakatifu na utayari kamili kwa ajili ya kurudi kwake Kristo",
    "ili uweze kueneza injili ya ufalme and kuwaongoza wengine kwenye njia ya wokovu"
  ],
  uchumi: [
    "ili ufikie malengo yako ya uhuru wa kifedha na kupata maendeleo thabiti ya kiuchumi",
    "ili uongeze baraka zako za kifedha, uepuke umaskini na ujenge uchumi imara",
    "ili udhibiti vizuri matumizi yako na kukuza vyanzo vipya vya kipato chenye tija",
    "ili uweze kujitegemea kiuchumi na kuwa msaada mzuri kwa familia na jamii yako"
  ],
  ndoa: [
    "ili ujenge ndoa imara yenye upendo wa dhati, heshima na furaha ya kudumu",
    "ili uimarishe mawasiliano mazuri na mwenza wako na kuondoa migogoro isiyo na tija",
    "ili uweke misingi mizuri ya malezi bora na amani kamili katika familia yenu",
    "ili udumishe utulivu wa kihemko na uaminifu thabiti katika nyumba yenu"
  ],
  it: [
    "ili ulinde usalama wa akaunti na data zako mtandaoni dhidi ya udukuzi",
    "ili upate ujuzi wa kisasa wa kiteknolojia unaokuletea fursa nzuri za kidijitali",
    "ili uboreshe mifumo yako ya kazi na kuongeza kasi ya utendaji wako wa kila siku"
  ],
  maisha: [
    "ili uweze kufikia malengo yako yote kimaisha na kupata afya bora na ustawi mwema",
    "ili uongeze nidhamu yako ya kazi na kuishi maisha yenye furaha na tija kubwa",
    "ili uepuke changamoto zisizo na lazima na kujenga tabia thabiti za mafanikio"
  ]
};

function enforceImperative(title: string, category: string, cleanLesson: string, index: number = 0): string {
  return convertToHakikishaKitendoKivumishi(title);
}

function enforceImperativeUfafanuzi(desc: string, category: string, cleanLesson: string, index: number = 0): string {
  const sentences = splitIntoSentences(desc);
  if (sentences.length === 0) return desc;
  
  const firstSentence = sentences[0];
  const cleanedFirst = cleanFirstSentenceBeforeIli(firstSentence);
  const hakikishaPart = convertToHakikishaKitendoKivumishi(cleanedFirst);
  
  const resultPool = MATOKEO_MAZURI[category] || MATOKEO_MAZURI["maisha"];
  const positiveResult = resultPool[index % resultPool.length];
  
  const firstSentenceWithResult = `${hakikishaPart} ${positiveResult}.`;
  
  const remainingSentences = sentences.slice(1);
  const finalDescription = remainingSentences.length > 0
    ? `${firstSentenceWithResult} ${remainingSentences.join(" ")}`
    : firstSentenceWithResult;
    
  return finalDescription;
}

// Transform list of key points to strictly instructional
function makeInstructional(items: StudyNoteItem[], cleanLesson: string, category: string): StudyNoteItem[] {
  return items.map((item, index) => {
    const rawKitu = cleanText(item.kitu);
    const rawUfafanuzi = cleanText(item.ufafanuzi);

    const imperativeKitu = enforceImperative(rawKitu, category, cleanLesson, index);
    const imperativeUfafanuzi = enforceImperativeUfafanuzi(rawUfafanuzi, category, cleanLesson, index);

    return {
      kitu: imperativeKitu,
      ufafanuzi: imperativeUfafanuzi
    };
  });
}

interface ConceptPhrases {
  ya: string;
  wa: string;
  katika: string;
  kwa: string;
  kuhusu: string;
  mradi: string;
  za: string;
  la: string;
}

function getConceptPhrases(cleanLesson: string, category: string): ConceptPhrases {
  const raw = getRawConceptPhrases(cleanLesson, category);
  const ya = raw.ya;
  const wa = raw.wa;
  const za = ya.replace(/^ya\s+/i, 'za ');
  const la = wa.replace(/^wa\s+/i, 'la ');
  return {
    ...raw,
    za,
    la
  };
}

function getRawConceptPhrases(cleanLesson: string, category: string): any {
  const lower = cleanLesson.toLowerCase().trim();
  
  if (category === "uchumi") {
    if (lower.includes("bajeti") || lower.includes("matumizi")) {
      return {
        ya: "ya bajeti na udhibiti wa matumizi",
        wa: "wa usimamizi wa bajeti",
        katika: "katika kupanga bajeti na matumizi",
        kwa: "kwa ajili ya kupanga bajeti",
        kuhusu: "kuhusu kupanga bajeti na matumizi",
        mradi: "mpango wa bajeti"
      };
    }
    if (lower.includes("akiba") || lower.includes("usalama")) {
      return {
        ya: "ya kuweka akiba na usalama wa kifedha",
        wa: "wa akiba na usalama wa kifedha",
        katika: "katika kujiwekea akiba ya dharura",
        kwa: "kwa ajili ya usalama wako wa kifedha",
        kuhusu: "kuhusu kuweka akiba na kulinda fedha",
        mradi: "mpango wa kuweka akiba"
      };
    }
    if (lower.includes("deni") || lower.includes("madeni") || lower.includes("kopa")) {
      return {
        ya: "ya kuepuka madeni na kukopa",
        wa: "wa kujiepusha na madeni",
        katika: "katika kudhibiti na kuepuka madeni",
        kwa: "kwa ajili ya kujiepusha na madeni ya anasa",
        kuhusu: "kuhusu jinsi ya kuepuka na kulipa madeni",
        mradi: "mpango wa kulipa madeni"
      };
    }
    if (lower.includes("biashara") || lower.includes("mjasiriamali") || lower.includes("mitaji")) {
      return {
        ya: "ya ujasiriamali na kukuza mtaji wako",
        wa: "wa ujasiriamali na biashara",
        katika: "katika biashara na ujasiriamali",
        kwa: "kwa ajili ya kuanzisha na kukuza biashara",
        kuhusu: "kuhusu ujasiriamali na kukuza mitaji",
        mradi: "mradi wa ujasiriamali"
      };
    }
    if (lower.includes("uwekezaji") || lower.includes("uzalishaji")) {
      return {
        ya: "ya uwekezaji na uzalishaji wenye tija",
        wa: "wa uwekezaji sahihi",
        katika: "katika kuwekeza na kuzalisha faida",
        kwa: "kwa ajili ya uwekezaji na uzalishaji",
        kuhusu: "kuhusu fursa za uwekezaji",
        mradi: "mradi wa uwekezaji"
      };
    }
    if (lower.includes("zaka") || lower.includes("sadaka")) {
      return {
        ya: "ya utoaji wa zaka na sadaka kwa uaminifu",
        wa: "wa utoaji wa uaminifu",
        katika: "katika kutoa zaka na sadaka",
        kwa: "kwa ajili ya utoaji wa zaka na sadaka",
        kuhusu: "kuhusu uaminifu katika utoaji",
        mradi: "mpango wa kutoa na kusaidia"
      };
    }
    return {
      ya: "ya kujenga uhuru wa kifedha",
      wa: "wa kujenga uhuru wa kifedha",
      katika: "katika safari ya kufikia uhuru wa kifedha",
      kwa: "kwa ajili ya kufikia uhuru wa kifedha",
      kuhusu: "kuhusu jinsi ya kujenga uhuru wa kifedha",
      mradi: "mpango wa uhuru wa kifedha"
    };
  }

  if (category === "it") {
    if (lower.includes("usalama") || lower.includes("data")) {
      return {
        ya: "ya usalama wa habari na data",
        wa: "wa usalama wa mifumo na data",
        katika: "katika kulinda mifumo na data",
        kwa: "kwa ajili ya usalama wa habari",
        kuhusu: "kuhusu usalama wa data na mifumo",
        mradi: "mradi wa usalama wa mifumo"
      };
    }
    if (lower.includes("programu") || lower.includes("kodi") || lower.includes("uandishi")) {
      return {
        ya: "ya uandishi wa kodi safi na programu",
        wa: "wa uandishi wa kodi yenye ufanisi",
        katika: "katika kuandika programu na kodi",
        kwa: "kwa ajili ya uandishi wa programu",
        kuhusu: "kuhusu uandishi sahihi wa programu",
        mradi: "mradi wa uandishi wa programu"
      };
    }
    if (lower.includes("mifumo")) {
      return {
        ya: "ya usimamizi wa mifumo ya kisasa",
        wa: "wa usimamizi bora wa mifumo",
        katika: "katika kusanidi mifumo ya IT",
        kwa: "kwa ajili ya kuboresha mifumo",
        kuhusu: "kuhusu usimamizi wa mifumo ya kisasa",
        mradi: "mradi wa usimamizi wa mifumo"
      };
    }
    if (lower.includes("akili") || lower.includes("ai")) {
      return {
        ya: "ya matumizi ya akili bandia (AI)",
        wa: "wa akili bandia na teknolojia mpya",
        katika: "katika kutumia akili bandia",
        kwa: "kwa ajili ya mifumo ya akili bandia",
        kuhusu: "kuhusu matumizi ya akili bandia",
        mradi: "mradi wa akili bandia (AI)"
      };
    }
    return {
      ya: "ya ujuzi na ubunifu wa kiteknolojia",
      wa: "wa ujuzi na ubunifu wa kiteknolojia",
      katika: "katika kujifunza teknolojia ya kisasa",
      kwa: "kwa ajili ya maendeleo ya kiteknolojia",
      kuhusu: "kuhusu ujuzi na ubunifu wa kiteknolojia",
      mradi: "mradi wa ubunifu wa kiteknolojia"
    };
  }

  if (category === "kiroho") {
    if (lower.includes("maombi") || lower.includes("sala")) {
      return {
        ya: "ya dhati ya maombi na sala",
        wa: "wa nidhamu ya dhati ya maombi",
        katika: "katika maombi na maisha ya sala",
        kwa: "kwa ajili ya kukuza maisha ya maombi",
        kuhusu: "kuhusu nidhamu ya dhati ya maombi",
        mradi: "mpango wa maombi na sala"
      };
    }
    if (lower.includes("utakatifu") || lower.includes("utakaso")) {
      return {
        ya: "ya utakatifu na maisha ya utakaso",
        wa: "wa maisha ya utakatifu",
        katika: "katika kuishi maisha ya utakatifu",
        kwa: "kwa ajili ya utakaso na utakatifu",
        kuhusu: "kuhusu maisha ya utakatifu",
        mradi: "mpango wa kujitakasa na utakatifu"
      };
    }
    if (lower.includes("imani")) {
      return {
        ya: "ya imani thabiti na kuamini",
        wa: "wa msingi madhubuti wa imani",
        katika: "katika kusimama imara katika imani",
        kwa: "kwa ajili ya kuimarisha imani yako",
        kuhusu: "kuhusu msingi madhubuti wa imani",
        mradi: "mpango wa kukuza imani"
      };
    }
    if (lower.includes("upendo")) {
      return {
        ya: "ya upendo wa dhati wa kimungu",
        wa: "wa upendo wa dhati wa kimungu",
        katika: "katika kuonyesha upendo wa dhati",
        kwa: "kwa ajili ya kukuza upendo na ushirikiano",
        kuhusu: "kuhusu upendo wa dhati wa kimungu",
        mradi: "mpango wa upendo na ushirika"
      };
    }
    if (lower.includes("ibada")) {
      return {
        ya: "ya ibada safi na ya kweli",
        wa: "wa misingi ya ibada safi",
        katika: "katika kufanya ibada safi",
        kwa: "kwa ajili ya ibada safi na ya kweli",
        kuhusu: "kuhusu misingi ya ibada safi",
        mradi: "mpango wa ibada ya dhati"
      };
    }
    return {
      ya: "ya ukuaji wako wa kiroho",
      wa: "wa ukuaji wako wa kiroho",
      katika: "katika safari ya ukuaji wa kiroho",
      kwa: "kwa ajili ya ukuaji wako wa kiroho",
      kuhusu: "kuhusu ukuaji wako wa kiroho",
      mradi: "mpango wa ukuaji wa kiroho"
    };
  }

  if (category === "ndoa") {
    if (lower.includes("mawasiliano") || lower.includes("kuzungumza")) {
      return {
        ya: "ya mawasiliano yenye staha na unyenyekevu",
        wa: "wa mawasiliano mazuri na unyenyekevu",
        katika: "katika kuzungumza kwa staha na upendo",
        kwa: "kwa ajili ya mawasiliano bora na mwenza",
        kuhusu: "kuhusu mawasiliano yenye staha",
        mradi: "mpango wa kuboresha mawasiliano"
      };
    }
    if (lower.includes("fedha") || lower.includes("pesa")) {
      return {
        ya: "ya ushirikiano wa kifedha katika familia",
        wa: "wa ushirikiano bora wa kifedha",
        katika: "katika usimamizi wa pamoja wa fedha",
        kwa: "kwa ajili ya usalama wa kifedha wa familia",
        kuhusu: "kuhusu ushirikiano wa kifedha katika familia",
        mradi: "bajeti ya pamoja ya familia"
      };
    }
    if (lower.includes("malezi") || lower.includes("watoto")) {
      return {
        ya: "ya malezi bora na maadili ya kifamilia",
        wa: "wa malezi bora ya watoto",
        katika: "katika kulelea watoto maadili mema",
        kwa: "kwa ajili ya malezi bora na maadili",
        kuhusu: "kuhusu malezi bora ya kifamilia",
        mradi: "mpango wa malezi na maadili"
      };
    }
    if (lower.includes("uaminifu") || lower.includes("siri")) {
      return {
        ya: "ya uaminifu na faragha ya ndoa",
        wa: "wa uaminifu na kulinda faragha ya ndoa",
        katika: "katika uaminifu na uadilifu wa ndoa",
        kwa: "kwa ajili ya uaminifu na kulinda faragha",
        kuhusu: "kuhusu uaminifu na faragha ya ndoa",
        mradi: "mpango wa kulinda faragha"
      };
    }
    if (lower.includes("hasira") || lower.includes("samehe")) {
      return {
        ya: "ya uvumilivu na msamaha wa haraka",
        wa: "wa msamaha wa dhati na uvumilivu",
        katika: "katika kusameheana na kuvumiliana",
        kwa: "kwa ajili ya msamaha na amani nyumbani",
        kuhusu: "kuhusu uvumilivu na msamaha wa haraka",
        mradi: "mpango wa kusameheana"
      };
    }
    return {
      ya: "ya ustawi wa ndoa na kifamilia",
      wa: "wa ustawi wa ndoa na familia",
      katika: "katika kulinda amani ya ndoa na familia",
      kwa: "kwa ajili ya ustawi wa ndoa yenu",
      kuhusu: "kuhusu ustawi wa ndoa na familia",
      mradi: "mpango wa ustawi wa ndoa"
    };
  }

  if (category === "eskatolojia") {
    if (lower.includes("uumbaji") || lower.includes("eden")) {
      return {
        ya: "ya uumbaji na kusudi la awali la mwanadamu",
        wa: "wa uumbaji na kusudi la awali",
        katika: "katika kuelewa kusudi la uumbaji",
        kwa: "kwa ajili ya kuelewa kusudi la awali",
        kuhusu: "kuhusu uumbaji na kusudi la awali",
        mradi: "mpango wa uumbaji"
      };
    }
    if (lower.includes("agano") || lower.includes("vipindi")) {
      return {
        ya: "ya maagano ya kinabii ya neema",
        wa: "wa maagano ya kinabii ya neema",
        katika: "katika kuelewa maagano ya neema",
        kwa: "kwa ajili ya maagano ya kinabii",
        kuhusu: "kuhusu maagano ya kinabii ya neema",
        mradi: "mpango wa maagano ya neema"
      };
    }
    if (lower.includes("falme") || lower.includes("daniel") || lower.includes("sanamu")) {
      return {
        ya: "ya unabii wa falme za dunia",
        wa: "wa unabii wa falme za dunia",
        katika: "katika kuelewa unabii wa Danieli",
        kwa: "kwa ajili ya utafiti wa falme za dunia",
        kuhusu: "kuhusu unabii wa falme za dunia",
        mradi: "mpango wa unabii wa falme"
      };
    }
    if (lower.includes("kuja") || lower.includes("dhabihu") || lower.includes("ukombozi")) {
      return {
        ya: "ya dhabihu na ukombozi wa kiungu",
        wa: "wa dhabihu na ukombozi wa kiungu",
        katika: "katika kuelewa dhabihu ya Kristo",
        kwa: "kwa ajili ya ukombozi wa kiungu",
        kuhusu: "kuhusu dhabihu na ukombozi wa kiungu",
        mradi: "mpango wa dhabihu na ukombozi"
      };
    }
    if (lower.includes("kanisa") || lower.includes("mataifa") || lower.includes("pentekoste")) {
      return {
        ya: "ya kipindi cha neema ya kanisa",
        wa: "wa kipindi cha neema ya kanisa",
        katika: "katika kipindi hiki cha neema",
        kwa: "kwa ajili ya huduma ya kanisa",
        kuhusu: "kuhusu kipindi cha neema ya kanisa",
        mradi: "mpango wa huduma ya kanisa"
      };
    }
    if (lower.includes("ishara") || lower.includes("nyakati")) {
      return {
        ya: "ya ishara za nyakati za mwisho",
        wa: "wa kutambua ishara za nyakati",
        katika: "katika kuangalia ishara za nyakati",
        kwa: "kwa ajili ya kuelewa alama za nyakati",
        kuhusu: "kuhusu ishara za nyakati za mwisho",
        mradi: "mpango wa kuchunguza alama za nyakati"
      };
    }
    if (lower.includes("unyakuo")) {
      return {
        ya: "ya unyakuo wa watakatifu",
        wa: "wa kujiandaa na unyakuo ujao",
        katika: "katika kutarajia unyakuo wa watakatifu",
        kwa: "kwa ajili ya utayari ...",
        kuhusu: "kuhusu unyakuo wa watakatifu",
        mradi: "mpango wa kujiandaa na unyakuo"
      };
    }
    if (lower.includes("dhiki") || lower.includes("antichrist") || lower.includes("ulinzi")) {
      return {
        ya: "ya ulinzi dhidi ya udanganyifu wa nyakati za mwisho",
        wa: "wa ulinzi dhidi ya chapa na mbinu za udanganyifu",
        katika: "katika kupinga udanganyifu wa mpinga Kristo",
        kwa: "kwa ajili ya kulinda imani dhidi ya chapa",
        kuhusu: "kuhusu ulinzi dhidi ya udanganyifu wa nyakati za mwisho",
        mradi: "mpango wa ulinzi dhidi ya udanganyifu"
      };
    }
    if (lower.includes("pili") || lower.includes("magedoni") || lower.includes("hukumu")) {
      return {
        ya: "ya kurudi kwa Kristo na hukumu ya mwisho",
        wa: "wa kurudi kwa Kristo na hukumu ya Har-Magedoni",
        katika: "katika kujiandaa na kurudi kwa Kristo",
        kwa: "kwa ajili ya siku ya kurudi kwa Kristo",
        kuhusu: "kuhusu kurudi kwa Kristo na hukumu",
        mradi: "mpango wa kujiandaa na kurudi kwa Kristo"
      };
    }
    return {
      ya: "ya masomo ya unabii na matukio ya mwisho",
      wa: "wa masomo ya unabii na matukio ya mwisho",
      katika: "katika kujifunza unabii wa eskatolojia",
      kwa: "kwa ajili ya kuelewa unabii wa Biblia",
      kuhusu: "kuhusu masomo ya unabii na matukio ya mwisho",
      mradi: "mpango wa masomo ya unabii"
    };
  }

  // category === "maisha" or fallback
  if (lower.includes("nidhamu")) {
    return {
      ya: "ya kujenga nidhamu binafsi ya maisha",
      wa: "wa nidhamu binafsi katika maisha",
      katika: "katika kujenga nidhamu na tabia njema",
      kwa: "kwa ajili ya nidhamu binafsi ya maisha",
      kuhusu: "kuhusu nidhamu binafsi ya maisha",
      mradi: "mpango wa kujenga nidhamu"
    };
  }
  if (lower.includes("malengo") || lower.includes("panga")) {
    return {
      ya: "ya kuweka malengo na kupanga maisha",
      wa: "wa kuweka malengo na mipango thabiti",
      katika: "katika kuweka malengo na mipango",
      kwa: "kwa ajili ya kufikia malengo ya maisha",
      kuhusu: "kuhusu kuweka malengo na kupanga ratiba",
      mradi: "mpango wa kufikia malengo"
    };
  }
  if (lower.includes("afya") || lower.includes("mazoezi")) {
    return {
      ya: "ya afya na ustawi wa mwili na akili",
      wa: "wa afya bora na kufanya mazoezi",
      katika: "katika kulinda afya na ustawi wako",
      kwa: "kwa ajili ya afya na ustawi wa mwili",
      kuhusu: "kuhusu afya na ustawi wa mwili na akili",
      mradi: "mpango wa afya na mazoezi"
    };
  }
  if (lower.includes("muda") || lower.includes("ratiba")) {
    return {
      ya: "ya usimamizi bora wa muda na ratiba",
      wa: "wa usimamizi mzuri wa muda wako",
      katika: "katika kusimamia muda na ratiba za kazi",
      kwa: "kwa ajili ya usimamizi bora wa muda",
      kuhusu: "kuhusu usimamizi bora wa muda",
      mradi: "ratiba bora ya usimamizi wa muda"
    };
  }
  return {
    ya: "ya maendeleo na ustawi wako binafsi",
    wa: "wa maendeleo na ustawi wako binafsi",
    katika: "katika safari ya maendeleo binafsi",
    kwa: "kwa ajili ya maendeleo na ustawi wako",
    kuhusu: "kuhusu maendeleo na ustawi wako binafsi",
    mradi: "mpango wa maendeleo binafsi"
  };
}

// Map lesson titles to simplified core concepts to hide exact titles
function getLessonConcept(cleanLesson: string, category: string): string {
  const lower = cleanLesson.toLowerCase().trim();
  
  if (category === "eskatolojia") {
    if (lower.includes("uumbaji") || lower.includes("eden")) return "uumbaji na kusudi la awali la mwanadamu";
    if (lower.includes("agano") || lower.includes("vipindi") || lower.includes("dispensation")) return "maagano ya kinabii ya neema";
    if (lower.includes("falme") || lower.includes("daniel") || lower.includes("sanamu")) return "unabii wa falme za dunia";
    if (lower.includes("kuja") || lower.includes("horini") || lower.includes("dhabihu")) return "dhabihu na ukombozi wa kiungu";
    if (lower.includes("kanisa") || lower.includes("mataifa") || lower.includes("pentekoste")) return "kipindi cha neema ya kanisa";
    if (lower.includes("ishara") || lower.includes("nyakati")) return "ishara za nyakati za mwisho";
    if (lower.includes("unyakuo")) return "unyakuo wa watakatifu";
    if (lower.includes("dhiki") || lower.includes("antichrist") || lower.includes("mpinga") || lower.includes("chapa")) return "ulinzi dhidi ya udanganyifu wa nyakati za mwisho";
    if (lower.includes("pili") || lower.includes("magedoni") || lower.includes("har-magedoni")) return "kurudi kwa Kristo na hukumu";
    return "mafundisho haya ya kinabii";
  }
  
  if (category === "kiroho") {
    if (lower.includes("maombi") || lower.includes("kusali") || lower.includes("sala")) return "nidhamu ya dhati ya maombi";
    if (lower.includes("utakatifu") || lower.includes("kujitakasa")) return "maisha ya utakatifu na utakaso";
    if (lower.includes("imani") || lower.includes("kuamini")) return "msingi madhubuti wa imani";
    if (lower.includes("upendo") || lower.includes("kushirikiana")) return "upendo wa dhati wa kimungu";
    if (lower.includes("ibada")) return "misingi ya ibada safi";
    return "ukuaji wako wa kiroho";
  }
  
  if (category === "ndoa") {
    if (lower.includes("mawasiliano") || lower.includes("kuzungumza")) return "mawasiliano yenye staha na unyenyekevu";
    if (lower.includes("fedha") || lower.includes("pesa")) return "ushirikiano wa kifedha katika familia";
    if (lower.includes("malezi") || lower.includes("watoto")) return "malezi bora na maadili ya kifamilia";
    if (lower.includes("uaminifu") || lower.includes("siri")) return "uaminifu na faragha ya ndoa";
    if (lower.includes("hasira") || lower.includes("kusamehe") || lower.includes("samehe")) return "uvumilivu na msamaha wa haraka";
    return "ustawi wa ndoa na familia";
  }
  
  if (category === "uchumi") {
    if (lower.includes("bajeti") || lower.includes("panga")) return "kupanga bajeti na nidhamu ya matumizi";
    if (lower.includes("akiba") || lower.includes("weka")) return "kuweka akiba na usalama wa kifedha";
    if (lower.includes("deni") || lower.includes("madeni") || lower.includes("kopa")) return "kujiepusha na madeni yasiyo na tija";
    if (lower.includes("biashara") || lower.includes("mjasiriamali")) return "ujasiriamali na kukuza mitaji";
    if (lower.includes("uwekezaji") || lower.includes("wekeza")) return "uwekezaji sahihi na uzalishaji";
    if (lower.includes("zaka") || lower.includes("sadaka")) return "uaminifu katika kutoa zaka na sadaka";
    return "uhuru wako wa kifedha";
  }
  
  if (category === "it") {
    if (lower.includes("usalama") || lower.includes("hacker") || lower.includes("data")) return "usalama wa habari na data";
    if (lower.includes("programu") || lower.includes("code") || lower.includes("uandishi")) return "uandishi sahihi na ufanisi wa programu";
    if (lower.includes("mifumo") || lower.includes("it")) return "usimamizi bora wa mifumo ya kisasa";
    if (lower.includes("akili") || lower.includes("ai")) return "matumizi ya akili bandia";
    return "ujuzi na ubunifu wa kiteknolojia";
  }
  
  if (lower.includes("nidhamu")) return "nidhamu binafsi ya maisha";
  if (lower.includes("malengo") || lower.includes("panga")) return "kuweka malengo na kupanga ratiba";
  if (lower.includes("afya") || lower.includes("mazoezi")) return "afya na ustawi wa mwili na akili";
  if (lower.includes("muda") || lower.includes("ratiba")) return "usimamizi bora wa muda";
  
  return "maendeleo na ustawi wako binafsi";
}

export function getEskatolojiaAdviceParagraph(lessonTitle: string): string {
  const norm = lessonTitle.toLowerCase();
  if (norm.includes("uumbaji") || norm.includes("eden") || norm.includes("wokovu")) {
    return `Ushauri mkuu kutoka Giniaz College katika somo hili la uumbaji ni kuelekeza maisha yako yote kwenye kusudi la asili la Mungu. Tambua kuwa uliumbwa kwa upendo mkuu na ukiwa na dhamana ya kutunza uumbaji na kuishi maisha yenye utakatifu, ukirejesha utulivu wa Edeni ndani ya familia yako.`;
  }
  if (norm.includes("agano") || norm.includes("vipindi") || norm.includes("dispensations")) {
    return `Giniaz College inakushauri kufanyia kazi maarifa haya ya maagano ya Mungu kwa kuishi maisha ya uaminifu chini ya agano la neema. Maandalizi ya dhati ya kiroho yanahitaji kuelewa hatua za kihistoria za wokovu na kutii ahadi zote mlizopeana mbele ya Mungu, ukijua kuwa yeye ni mwaminifu daima.`;
  }
  if (norm.includes("falme") || norm.includes("daniel")) {
    return `Katika somo hili linaloangazia kuinuka na kuanguka kwa falme, Giniaz College tunakushauri kujenga ushupavu thabiti kama Danieli huko Babeli. Usisujudie sanamu na mifumo ya sasa ya kidunia; badala yake, weka uaminifu wako wote katika Ufalme wa Mungu usiotikisika unaokuja hivi karibuni.`;
  }
  if (norm.includes("kuja kwa kwanza") || norm.includes("ukombozi") || norm.includes("kristo")) {
    return `Tafakari ya dhati kuhusu dhabihu ya Calvary ndiyo kiini cha ushauri wa chuo katika somo hili. Tunakuhimiza kuishi kwa shukrani na upendo mkuu kila siku, ukizishinda hofu zote kwa nguvu ya msalaba na damu ya Yesu iliyomwagika kwa ukombozi wako mkuu.`;
  }
  if (norm.includes("kanisa") || norm.includes("neema")) {
    return `Katika kipindi hiki cha neema na huduma ya kanisa, uongozi wa kitaaluma wa Giniaz College tunakushauri kutumia kwa uaminifu karama zote za kiroho ulizokabidhiwa. Kuza ushirika mwema na waumini wenzako, na shiriki kikamilifu katika kueneza injili ya wokovu kabla ya mlango wa neema kufungwa.`;
  }
  if (norm.includes("ishara") || norm.includes("nyakati") || norm.includes("ulimwengu")) {
    return `Tunakushauri kuwa macho na mwangalifu sana katika kutafsiri matukio ya sasa ulimwenguni kwa jicho la kinabii. Usijazwe na hofu ya majanga au mabadiliko ya kijamii, bali dumu katika kukesha na kuomba ukiwa na amani kuu moyoni, ukijua ukombozi wako umekaribia.`;
  }
  if (norm.includes("unyakuo") || norm.includes("rapture") || norm.includes("watakatifu")) {
    return `Kuhusu unyakuo wa watakatifu, ushauri thabiti wa Giniaz College ni kuhakikisha unadumisha utakaso wa kila siku na uaminifu wa moyo. Weka mafuta ya kutosha ya Roho Mtakatifu katika taa yako kwa kuishi maisha ya kukesha, ili Bwana atakapokuja akukute ukiwa tayari kuingia naye mbinguni.`;
  }
  if (norm.includes("dhiki") || norm.includes("mpinga") || norm.includes("antichrist")) {
    return `Katika somo hili la dhiki kuu, tunakushauri kujiandaa sasa kwa kujenga mizizi imara ya imani na ujasiri usioyumba. Epuka kulegea au kuathiriwa na mifumo dhalimu ya kiuchumi na kifikra ya mpinga Kristo; dumu katika neno la Mungu kama ngome na ulinzi wako thabiti.`;
  }
  if (norm.includes("kuja kwa mara ya pili") || norm.includes("hargemoni") || norm.includes("magedoni")) {
    return `Ushauri mkuu wa kitaaluma katika somo hili ni kuelekeza matumaini yako yote katika kuja kwa utukufu kwa Kristo na ushindi wa Har-Magedoni. Simama imara upande wa Bwana ukiwa na ujasiri mkubwa, ukijua kuwa kila adui na mateso ya sasa yataangamizwa, na ushindi wa milele ni wetu.`;
  }
  if (norm.includes("miaka elfu") || norm.includes("millennial") || norm.includes("utawala")) {
    return `Giniaz College inakupendekezea kutafakari juu ya amani na utulivu wa utawala wa miaka elfu moja. Ruhusu amani hiyo itawale moyo wako tangu leo kwa kuepuka mifarakano, hasira au mihemko, ukiishi maisha ya kifalme na ya kiutawala yanayofaa kuingia katika miaka elfu moja ya mbinguni.`;
  }
  if (norm.includes("hukumu") || norm.includes("enzi cheupe") || norm.includes("white throne")) {
    return `Katika kukabili somo hili la hukumu ya mwisho, tunakusihi uishi maisha yenye uwajibikaji mkubwa na unyenyekevu mbele ya kiti cha enzi. Kagua mienendo yako kila siku, fanya toba ya dhati, na hakikisha kuwa jina lako limeandikwa kwa herufi za dhahabu katika Kitabu cha Uzima cha Mwanakondoo.`;
  }
  if (norm.includes("mbingu mpya") || norm.includes("nchi mpya") || norm.includes("paradiso")) {
    return `Hitimisho la safari yetu ni mbingu mpya na nchi mpya restored. Ushauri wetu wa mwisho kama Giniaz College ni kuweka mtazamo wako daima kwenye utukufu ujao usio na maumivu wala machozi. Kila jaribu la sasa ni jepesi likilinganishwa na uzuri wa paradiso ya milele uliyotayarishiwa.`;
  }
  return `Katika muktadha wa mabadiliko ya sasa ya ulimwengu na utimilifu wa unabii wa kibiblia, uongozi wa kitaaluma wa Giniaz College tunakushauri kuhakikisha kuwa mafundisho ya somo hili yanakuwa msingi wa ukuaji wako wa kiroho. Kufanyia kazi kwa uaminifu misingi hii kutakusaidia kulinda imani yako dhidi ya changamoto za kiitikadi za nyakati za sasa.`;
}

// Generate category-specific loving introductory paragraph that incorporates cleanLesson
function generateDynamicMotherlyParagraph(rawLesson: string, category: string, items: StudyNoteItem[]): string {
  const cleanLesson = getLessonConcept(rawLesson, category);
  const getSeed = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getSeed(cleanLesson);
  const variant = seed % 3;

  if (category === "eskatolojia") {
    return getEskatolojiaAdviceParagraph(rawLesson);
  }

  if (category === "kiroho") {
    if (variant === 0) {
      return `Katika safari yako ya maendeleo ya kiroho kupitia mafundisho haya, uongozi wa Giniaz College tunakushauri kwa dhati kujenga msingi madhubuti wa nidhamu binafsi. Katika kuliishi hili, weka kipaumbele cha dhati kwenye mafundisho ya leo ili kuritubisha na kuimarisha nafsi yako kila siku.

Uimara wako wa kiroho unategemea jinsi unavyoweka kanuni hizi katika utendaji wa kila siku. Tunakuhimiza kufanya jitihada za makusudi kufuata ushauri huu ili kujiweka karibu na hekima na maarifa ya kimungu.

Kulinda maadili and uadilifu wa moyo wako ni jambo la msingi; hakikisha unakamilisha mafunzo haya kwa kutenda kwa uaminifu. Hii itakusaidia kuwa kielelezo hai cha upendo, weledi, na utukufu mahali popote ulipo.`;
    } else if (variant === 1) {
      return `Ukuaji wa kiimani na kiroho unaimarishwa kwa vitendo na mienendo thabiti. Kuhusu mafundisho haya, ushauri mkuu wa kitaaluma kutoka Giniaz College ni kuelekeza nguvu zako katika kutenda mema na kuomba. Hatua hii itafungua milango mipya ya ufahamu na neema ya kiungu.

Tunakuhimiza kwa dhati kufanya tathmini ya kina ya kiroho kila siku kwa kuanza kutekeleza misingi tuliyojifunza leo. Mfumo huu utakujengea nidhamu bora ya kiroho na kukusaidia kuepuka vishawishi au changamoto za kila siku.

Usiache maarifa haya yabaki katika nadharia tu; thibitisha uelewa wako kwa kuweka mkazo kwenye malengo yako ya kiroho. Tunaamini kuwa utekelezaji huu utaleta ustawi mkubwa katika maisha yako ya binafsi na ya kijamii.`;
    } else {
      return `Kupitia masomo haya ya kukuza utu wa ndani na hasa mafundisho haya, uongozi wa Giniaz College tunakusihi kutambua kuwa unao wajibu wa kukuza uwezo wako wa kiroho. Anza safari hii ya mafanikio leo kwa kutekeleza jambo hili la msingi la kufanyia kazi uaminifu wako.

Neno la Mungu na misingi ya kiroho viwe dira kuu ya hatua zako zote. Ili kufanikisha hili, tunakuhimiza kuanzisha na kudumisha tabia endelevu ya kufanya maombi na kutafakari ili kupata utulivu na amani ya kweli moyoni mwako.

Kwa kuhitimisha, weka azma thabiti ya kufanyia kazi malengo yako ya ukuaji. Kila hatua unayopiga kwa uaminifu na bidii itakusogeza karibu zaidi na utimilifu wa malengo na mapenzi ya dhati ya Mungu kwa maisha yako.`;
    }
  } else if (category === "ndoa") {
    if (variant === 0) {
      return `Kuhusu mafundisho haya, uongozi wa Giniaz College tunakushauri kuimarisha misingi ya mahusiano na familia yako kama nguzo kuu ya ustawi na amani ya kijamii. Anza leo kwa kuweka nia thabiti ya kufanyia kazi misingi ya upendo ili kujenga maelewano na ushirikiano mzuri na mwenza wako.

Katika maisha ya ndoa na mahusiano, upendo wa dhati unadhihirishwa kwa vitendo vya kila siku vya unyenyekevu, mawasiliano ya kitaalamu, na heshima ya pande zote mbili. Tunakushauri kuweka mkazo mkubwa katika mazungumzo ya wazi ili kutatua migogoro kwa hekima.

Hakikisha unaweka kipaumbele cha kulinda ustawi wa kihisia wa mwenza wako kwa kutekeleza ushauri wa uaminifu na heshima. Hekima hii itajenga boma imara linalostahimili dhoruba zote na kuwa mfano bora wa kuigwa katika jamii.`;
    } else if (variant === 1) {
      return `Uhusiano mwema and amani katika familia ni matokeo ya uwekezaji wa makusudi, nidhamu, na ushirikiano. Kupitia mafundisho haya, Giniaz College inakushauri kuchukua hatua ya kitaalamu ya kuombeana na kusameheana ili kuleta mabadiliko chanya kuanzia leo.

Mawasiliano yenye staha, upole, na uwazi ndiyo msingi mkuu wa familia imara. Hivyo basi, tunakuhimiza sana kufanyia kazi ushauri wa heshima na unyenyekevu ili kuzuia mifarakano na kujenga mazingira salama na yenye upendo ndani ya nyumba yenu.

Usiruhusu mazoea yapunguze thamani ya mahusiano yenu; fanya tathmini endelevu ya ustawi wa ndoa yenu kwa kutekeleza mipango ya pamoja ya kimkakati. Uamuzi huu utarejesha furaha, uaminifu, na amani ya kudumu katika boma lenu.`;
    } else {
      return `Ndoa ni taasisi muhimu ya kijamii inayohitaji hekima kubwa, ustahimilivu, na maarifa ya kimkakati. Sisi kama Giniaz College, tukizingatia mafundisho haya, tunakushauri kujenga ukaribu wa dhati na mwenza wako kwa kuanza na hatua madhubuti za heshima.

Unyenyekevu, uvumilivu, na uwezo wa kusameheana haraka ni siri ya mahusiano endelevu. Kwa sababu hiyo, weka juhudi za makusudi katika mawasiliano mazuri ili kusafisha anga ya ndoa yenu na kuzuia migogoro isiyo na tija.

Mwisho kabisa, fanyia kazi kwa uaminifu mkubwa jambo hili la kulinda faragha yenu. Kila hatua ya heshima na upendo unayoichukua leo itazaa matunda ya amani na ustawi wa familia yako ya mfano.`;
    }
  } else if (category === "uchumi") {
    if (variant === 0) {
      return `Katika safari yako ya kujenga uhuru wa kifedha na kuimarisha mifumo yako ya kiuchumi kupitia mafundisho haya, uongozi wa kitaaluma wa Giniaz College tunakushauri kuanza kutekeleza mbinu hizi mara moja. Anza kwa kuweka nidhamu thabiti kwenye upangaji wa bajeti ili kuzuia upotevu wa rasilimali.

Kumbuka kuwa siri ya mafanikio endelevu ya kifedha haipo tu kwenye kiwango cha kipato unachoingiza, bali kwenye nidhamu ya usimamizi. Tunakuhimiza kuweka kipaumbele kikubwa kwenye uwekaji wa akiba ili kuhakikisha rasilimali zako zinazaa matunda na kukua salama.

Usiishie kupata maarifa ya nadharia pekee; chukua hatua sasa kwa kufanyia kazi dondoo ya leo ya usimamizi. Kila uamuzi wa busara wa kifedha unaouchukua leo unalinda mustakabali wako and kufungua fursa mpya za maendeleo.`;
    } else if (variant === 1) {
      return `Uchumi imara unajengwa kwa maamuzi madhubuti ya kimkakati na nidhamu ya kila siku. Kuhusiana na mafundisho haya, Giniaz College inakushauri kuanza leo kufanya tathmini ya kina ya kifedha kupitia hatua ya kupanga matumizi yako yote.

Nidhamu ya matumizi ndiyo nguzo kuu ya ulinzi dhidi ya changamoto za kiuchumi na madeni yasiyo na tija. Hivyo basi, tunakusihi uweke mkazo wa kipekee katika uwekaji wa akiba ya kudumu ili kukuza mtaji wako na kupanua uwekezaji wako kwa hekima na utulivu.

Hakikisha unaepuka matumizi yasiyo ya lazima and uweke malengo thabiti ya kufikia uhuru wa kifedha kwa kutekeleza mipango yako vizuri. Kila hatua ya uwekaji akiba na uwekezaji sahihi inakusogeza karibu na utulivu wa kudumu wa kiuchumi.`;
    } else {
      return `Masomo haya yamebeba kanuni muhimu za kitaalamu za usimamizi na mafanikio ya kiuchumi. Sisi kama Giniaz College tunakushauri uanze kufanyia kazi maarifa haya kwa kuweka nidhamu thabiti ya kupanga bajeti ya kila siku ili kulinda na kudhibiti mzunguko wako wa kifedha.

Usimamizi mzuri wa rasilimali ni tabia inayojengwa na kuendelezwa kila siku. Ili kufanikisha hili, weka mkazo katika utekelezaji wa akiba na uwekezaji, jambo litakalokusaidia kupanga bajeti yako kwa usahihi na kuongeza ufanisi wa rasilimali zako.

Mwisho kabisa, anza utekelezaji leo ukiwa na nia thabiti ya kutenda kwa nidhamu ya hali ya juu. Kwa kufanya hivyo, utajenga mifumo imara ya kifedha inayojitegemea na kuleta ustawi wa kweli katika shughuli zako zote.`;
    }
  } else if (category === "it") {
    if (variant === 0) {
      return `Kama mwanafunzi anayejenga ujuzi wa kiteknolojia kupitia mafundisho haya, uongozi wa kitaaluma wa Giniaz College tunakushauri kutenga muda maalum kila siku kwa ajili ya kufanya mazoezi ya kivitendo. Weka mkazo wa kipekee kwenye kufanya mazoezi ya uandishi wa programu ili kuimarisha uelewa wako wa mifumo na uandishi sahihi wa misimbo.

Kwenye ulimwengu wa teknolojia ya habari (IT), nadharia pekee haitoshi; unahitaji kufanya tathmini endelevu ya kiufundi na kukabiliana na changamoto za mifumo. Tunakusihi sana kufanyia kazi mifumo mipya ili kujenga uwezo wa kutatua changamoto za programu (debugging) na kuboresha utendaji.

Tumia ujuzi huu mpya kubuni miradi yenye tija and ufanyie kazi jambo hili kwa umakini mkubwa ili kulinda daima usalama wa data, maadili ya kitaaluma, na ufanisi wa mifumo unayounda katika safari yako ya kiteknolojia.`;
    } else if (variant === 1) {
      return `Ulimwengu wa kiteknolojia unahitaji ueledi wa juu wa kivitendo na kujifunza kusikoisha. Sisi kama uongozi wa Giniaz College tunakushauri kuhakikisha kuwa mafundisho haya hayabaki kama nadharia tu; anza leo kwa kufanya mazoezi na kujenga ujuzi kupitia hatua za kivitendo.

Ubunifu wa kweli unatokea pale unapoamua kufanyia kazi mifumo mipya na kupima mipaka yako ya kiufundi. Hivyo tunakuhimiza kwa dhati kuweka nia thabiti katika utekelezaji wa mada za kisasa ili kurahisisha kazi zako na kuongeza kasi ya utendaji wako.

Zingatia daima maadili ya kitaaluma na usalama wa mifumo kwa kutekeleza hatua thabiti za usalama. Hia itakutofautisha kama mtaalamu bora na mwaminifu anayeleta mabadiliko chanya ya kidijitali katika taasisi au jamii yako.`;
    } else {
      return `Usimamizi wa mifumo ya kisasa ya kiteknolojia unajengwa juu ya nidhamu na usahihi wa hali ya juu. Kupitia mafundisho haya muhimu, Giniaz College inakushauri uanze leo kwa kuweka mkazo mkubwa katika kubuni mifumo bora ili kulinda ufanisi and ubora wa kazi zako zote za kiufundi.

Katika kuandika programu au kusanidi mifumo, tunakusihi ujenge nidhamu thabiti ya kufanyia kazi mifumo ya kisasa. Hili litakusaidia kuelewa kwa undani jinsi mifumo inavyofanya kazi na kukuepusha na makosa ya kiusalama au udhaifu wa mifumo hiyo.

Mwisho kabisa, hakikisha unafanya uamuzi wa busara wa kufuata taratibu zote za kiusalama ili kuhakikisha mifumo yako inafanya kazi vizuri na inaleta manufaa makubwa kwa watumiaji wake wa mwisho katika ulimwengu wa sasa.`;
    }
  } else {
    if (variant === 0) {
      return `Kupitia mafundisho haya muhimu, uongozi wa Giniaz College tunakushauri kufanyia kazi kwa dhati maarifa haya mapya na kuyafanya kuwa sehemu ya utendaji wako wa kila siku. Anza leo kwa kuweka mkazo kwenye upangaji wa ratiba yako ili kuona mabadiliko ya kweli katika maendeleo yako.

Usiruhusu masomo haya kubaki kama nadharia tu; chukua hatua madhubuti leo kwa kuanza kutenda kwa nidhamu. Hii itakujengea nidhamu binafsi na kudhibiti tabia zako ziendane na malengo yako makuu ya kitaaluma na kimaisha.

Kila hatua ya dhati unayochukua leo kwa uaminifu na bidii itakusogeza karibu zaidi na hatma yako njema. Tunakuhimiza ufanyie kazi jambo hili la msingi kwa ujasiri, weledi na matumaini makubwa ya mafanikio endelevu.`;
    } else if (variant === 1) {
      return `Maisha na taaluma ni mchakato endelevu wa kujifunza kila siku, na mafundisho haya yamebeba misingi muhimu kwa ajili ya ukuaji wako binafsi na wa kitaaluma. Giniaz College inakushauri kuanza kwa kufanyia kazi hatua ya nidhamu ili kuleta nidhamu mpya na yenye tija katika utendaji wako.

Ili kufikia malengo makubwa uliyojiwekea, unahitaji kubadili fikra na mtazamo wako wa utendaji. Tunakuhimiza sana kufanyia kazi ushauri wa kitaaluma ili kujenga ustahimilivu na kuondokana na tabia zinazokupunguzia ufanisi.

Usiandike tu dondoo hizi bali zifanye kuwa sehemu ya utendaji wako wa kila siku; weka mkazo wa kutosha katika kuchukua hatua madhubuti.  Kumbuka kuwa mafanikio na furaha za kweli zinakuja kwa wale wanaochukua hatua madhubuti za kivitendo.`;
    } else {
      return `Masomo haya ni daraja la kukuvusha kutoka mahali ulipo sasa kwenda kwenye hekima ya juu zaidi ya kimaisha na kitaaluma. Sisi kama Giniaz College tunakushauri uanze leo kwa kufanya tathmini ya kina ya maendeleo yako kupitia kutenda kwa bidii na nidhamu.

Nidhamu binafsi ndio ufunguo mkuu wa kuwa kiongozi na mshindi popote ulipo. Kwa hiyo, tunakuhimiza sana kuliishi somo hili kwa kutilia mkazo wa dhati jambo hili ili kuimarisha mienendo yako na kuongeza tija ya utendaji wako.

Kwa kuhitimisha, chukua hatua ya busara leo kwa kufanyia kazi dondoo za mafanikio. Simama imara kwa ujasiri, jifunze kutokana na changamoto, na uendelee kusonga mbele kwa amani na matumaini makubwa ya ushindi wa kila siku.`;
    }
  }
}

const UCHUMI_BASE_ACTIONS = (cleanLesson: string): StudyNoteItem[] => [
  {
    kitu: "Amka asubuhi na mapema na uanze shughuli zako",
    ufafanuzi: `Fanya kazi kwa juhudi na bidii kubwa katika kusimamia mipango yako ya ${cleanLesson}. Kwa mfano, panga kuamka saa kumi na moja asubuhi kila siku ili uongeze masaa ya uzalishaji.`
  },
  {
    kitu: "Tenga akiba mara tu unapoingiza kipato",
    ufafanuzi: `Jiwekee nidhamu ya kuweka akiba ya asilimia 10 hadi 20 ya kipato chako kabla ya kufanya matumizi yoyote. Kwa mfano, tenga shilingi 20,000 kila unapopokea malipo au faida ya biashara.`
  },
  {
    kitu: "Panga bajeti ya matumizi ya kila mwezi",
    ufafanuzi: `Andika orodha ya matumizi yako yote ya lazima na uepuke matumizi yasiyo na tija. Kwa mfano, tumia daftari au programu ya simu kupanga bajeti ya chakula, kodi na usafiri mwanzoni mwa mwezi.`
  },
  {
    kitu: "Epuka kabisa kuchukua madeni yasiyo na tija",
    ufafanuzi: `Usikope fedha kwa ajili ya kununua vitu vya anasa au kukidhi matamanio ya muda mfupi. Kwa mfano, kataa kukopa fedha ili kununua nguo mpya za sherehe au simu ya bei ghali.`
  },
  {
    kitu: "Anzisha chanzo kidogo cha mapato cha pembeni (Side Hustle)",
    ufafanuzi: `Usitegemee chanzo kimoja tu cha mapato kulinda ustawi wako. Kwa mfano, anzisha biashara ndogo ya kuuza bidhaa mtandaoni au kutoa huduma unazoweza kufanya jioni baada ya kazi.`
  },
  {
    kitu: "Wekeza sehemu ya akiba yako ili izalishe faida",
    ufafanuzi: `Usiache fedha zako zikae tu benki bila kuzalisha; zitume zikafanye kazi. Kwa mfano, wekeza katika mifuko ya uwekezaji ya pamoja ya serikali au nunua hisa za makampuni ya uhakika.`
  },
  {
    kitu: "Nunua mahitaji ya nyumbani kwa jumla",
    ufafanuzi: `Punguza gharama zisizo za lazima kwa kununua bidhaa za matumizi ya nyumbani kwa kiwango kikubwa mara moja. Kwa mfano, nunua mfuko wa mchele wa kilo 25 badala ya kununua kilo moja kila siku.`
  },
  {
    kitu: "Jifunze elimu ya fedha na uchumi kila siku",
    ufafanuzi: `Tenga muda wa kusoma vitabu au dondoo za kiuchumi ili kuongeza uelewa wako. Kwa mfano, soma kurasa tano za kitabu cha hekima ya kifedha kila jioni kabla ya kulala.`
  },
  {
    kitu: "Toa zaka na sadaka kwa uaminifu kamili",
    ufafanuzi: `Mpe Mungu sehemu yake kwa uaminifu ili kulinda baraka za kifedha katika kazi zako. Kwa mfano, tenga asilimia 10 ya mapato yako kama zaka mara tu unapopokea malipo au mshahara wako.`
  },
  {
    kitu: "Fanya tathmini ya fedha kila mwisho wa wiki",
    ufafanuzi: `Angalia jinsi ulivyotumia fedha zako na urekebishe makosa ya matumizi. Kwa mfano, kila Jumamosi jioni pitia miamala yako yote ya simu kujua ulipoteza kiasi gani kwenye mambo yasiyo ya lazima.`
  }
];

const KIROHO_BASE_ACTIONS = (cleanLesson: string): StudyNoteItem[] => [
  {
    kitu: "Amka asubuhi na mapema kufanya ibada",
    ufafanuzi: `Tenga muda wa kwanza kabisa asubuhi kuongea na Mungu kabla ya kuanza shughuli zako. Kwa mfano, weka alamu ya kukuamsha saa kumi na moja asubuhi kufanya maombi ya dhati ya dakika 15.`
  },
  {
    kitu: "Soma na utafakari neno la Mungu kila siku",
    ufafanuzi: `Soma sura moja au mbili za Biblia iti kujenga msingi imara wa kiroho na kulinda amani yako ya ndani. Kwa mfano, soma sura moja ya Zaburi kila siku asubuhi na uandike mstarri mmoja thabiti wa kuuishi.`
  },
  {
    kitu: "Omba bila kukoma katika mazingira yoyote",
    ufafanuzi: `Weka moyo wako ukiwa umeunganishwa na Mungu hata ukiwa katika shughuli zako za kawaida. Kwa mfano, omba kimya kimya moyoni mwako ukiwa kwenye usafiri au ukiwa njiani kuelekea kazini.`
  },
  {
    kitu: "Weka utaratibu wa kufunga na kuomba",
    ufafanuzi: `Jinyime chakula au anasa kwa muda maalum ili kuimarisha roho yako na kupata ushindi wa kiroho. Kwa mfano, chagua siku ya Jumatano kufunga kuanzia asubuhi hadi saa kumi jioni kwa ajili ya kufanya maombi maalum.`
  },
  {
    kitu: "Kiri na utamke maneno ya ushindi kila asubuhi",
    ufafanuzi: `Epuka kabisa malalamiko na maneno hasi, badala yake tamka baraka na amani ya Kristo juu yako. Kwa mfano, kila asubuhi tamka kwa sauti: 'Leo ni siku ya ushindi, nitalindwa na kufanikiwa katika kila jambo.'`
  },
  {
    kitu: "Shiriki ibada na ushirika wa waumini wenzako",
    ufafanuzi: `Usijitenge na wengine; nenda kanisani au kwenye vikundi vya maombi kujengana imani. Kwa mfano, hudhuria ibada ya katikati ya wiki au maombi ya kikundi kila Alhamisi jioni bila kukosa.`
  },
  {
    kitu: "Toa shukrani kwa Mungu kwa kila jambo",
    ufafanuzi: `Jifunze kumshukuru Mungu kwa mambo makubwa na madogo hata wakati wa changamoto za kimaisha. Kwa mfano, andika mambo matatu ya shukrani kila usiku kabla ya kulala na umshukuru Mungu kwa hayo.`
  },
  {
    kitu: "Jiepushe kabisa na dhambi na vishawishi",
    ufafanuzi: `Linda utakatifu wa moyo na mwili wako dhidi ya mambo yanayomchukiza Mungu. Kwa mfano, zima simu au ondoka haraka mahali penye mazungumzo ya umbea, chuki, au picha zisizo na maadili.`
  },
  {
    kitu: "Wasaidie wahitaji na wenye shida kwa upendo wa dhati",
    ufafanuzi: `Onyesha imani yako kwa vitendo kwa kutoa msaada kwa watu wenye uhitaji wanaokuzunguka. Kwa mfano, tenga nguo usizotumia au kiasi kidogo cha chakula na ukipeleke kwa yatima au maskini aliye karibu nawe.`
  },
  {
    kitu: "Tengeneza mazingira ya ibada ya familia nyumbani",
    ufafanuzi: `Linda amani ya familia yako na uepuke migogoro isiyo na tija inayozima roho. Kwa mfano, anzisha maombi ya pamoja ya familia kila usiku kabla ya kulala ili kuweka ulinzi wa kiungu nyumbani kwenu.`
  }
];

const NDOA_BASE_ACTIONS = (cleanLesson: string): StudyNoteItem[] => [
  {
    kitu: "Msikilize mwenza wako kwa makini bila kumkatiza",
    ufafanuzi: `Tenga muda wa kusikiliza hisia na mawazo ya mwenza wako kwa upendo mkubwa. Kwa mfano, weka simu yako pembeni na umtazame mwenza wako machoni anapozungumza nawe kuhusu jinsi siku yake ilivyokuwa.`
  },
  {
    kitu: "Mpe mwenza wako mahitaji muhimu ya msingi",
    ufafanuzi: `Timiza wajibu wako wa ndoa kwa upendo, uaminifu na furaha bila kusubiri kulazimishwa. Kwa mfano, mume nunua mahitaji ya nyumbani kwa wakati, na mke weka nyumba katika hali ya usafi na utulivu kila siku.`
  },
  {
    kitu: "Sema maneno ya sifa na shukrani kwa mwenza wako",
    ufafanuzi: `Onyesha kuthamini juhudi ndogo ndogo anazofanya mwenza wako kwa ajili ya familia. Kwa mfano, mpe tabasamu na umwambie: 'Asante sana kwa chakula kitamu hiki' au 'Unapendeza sana leo mume/mke wangu.'`
  },
  {
    kitu: "Tatua migogoro yenu chumbani kwa siri na utulivu",
    ufafanuzi: `Kamwe usigombee mbele ya watoto au ndugu, wala usishirikishe watu wa nje siri zenu za ndani. Kwa mfano, mkipishana kauli, tulizana kwanza na kisha mzungumze kwa sauti ya upole chumbani kwenu kabla ya kulala.`
  },
  {
    kitu: "Weka utaratibu wa kuomba pamoja kila siku",
    ufafanuzi: `Shikana mikono na mwenza wako kukiri baraka, ulinzi na amani ya kiungu juu ya ndoa yenu. Kwa mfano, weka utaratibu wa kusali pamoja dakika tano kila asubuhi kabla ya kuondoka na kila usiku kabla ya kulala.`
  },
  {
    kitu: "Panga muda wa kuwa wawili tu (Date Night)",
    ufafanuzi: `Dumisha urafiki na mvuto wa kimapenzi kwa kutoka pamoja au kupata muda wa faragha. Kwa mfano, panga kutoka na mwenza wako kwenda kupata chakula cha jioni au kutembea bustanini angalau mara moja kila mwezi.`
  },
  {
    kitu: "Samehe haraka vinyongo na makosa ya nyuma",
    ufafanuzi: `Usihifadhi hasira moyoni wala usikumbushe makosa yaliyopita wakati wa majadiliano. Kwa mfano, mwenza wako akikosea na kuomba msamaha, mkubalie kwa dhati na useme: 'Nimekusamehe, tuyajenge ya sasa.'`
  },
  {
    kitu: "Kuwa mwaminifu kwa asilimia mia moja katika kila jambo",
    ufafanuzi: `Shirikisha mwenza wako vyanzo vyako vya mapato na uepuke urafiki wa siri unaoweza kuleta mashaka. Kwa mfano, mpe mwenza wako taarifa zote za fedha na uruhusu simu yako iwe wazi kwake bila password za siri.`
  },
  {
    kitu: "Msaidie mwenza wako kazi za nyumbani kwa hiari",
    ufafanuzi: `Shirikianeni kubeba majukumu ya nyumbani ili kupunguza uchovu na kujenga upendo dhabiti. Kwa mfano, mume msaidie mke kuosha vyombo au kucheza na watoto jioni mke anapoandaa chakula cha jioni.`
  },
  {
    kitu: "Tengeneza mshangao mdogo wa upendo (Surprises)",
    ufafanuzi: `Mfanyie mwenza wako jambo zuri asilotegemea ili kuonyesha kuwa unamfikiria kila wakati. Kwa mfano, mshike mkono ghafla mkiwa mnatembea, au mletee zawadi ndogo kama ua, chokoleti, au matunda anayopenda bila sababu maalum.`
  }
];

const IT_BASE_ACTIONS = (cleanLesson: string): StudyNoteItem[] => [
  {
    kitu: "Badilisha password zako zote kuwa imara sana",
    ufafanuzi: `Linda akaunti zako za mitandao na mifumo dhidi ya dukuaji na wizi wa data wa kielektroniki. Kwa mfano, weka password yenye mchanganyiko wa herufi kubwa, ndogo, namba na alama maalum (kama vile @, #, $) leo.`
  },
  {
    kitu: "Weka ulinzi wa hatua mbili (2FA) kwenye akaunti zote",
    ufafanuzi: `Ongeza safu ya ziada ya usalama ili hata mtu akijua password yako ashindwe kabisa kuingia kwenye mifumo yako. Kwa mfano, washa kipengele cha Google Authenticator au SMS verification kwenye akaunti yako ya Gmail na WhatsApp leo.`
  },
  {
    kitu: "Punguza ukubwa wa programu unazounda (Optimization)",
    ufafanuzi: `Hakikisha programu unazounda ni nyepesi ili ziendane na simu zenye uwezo mdogo nchini Tanzania. Kwa mfano, compress picha na faili zote za app yako ili isizidi ukubwa wa 15MB wakati wa kuipakua.`
  },
  {
    kitu: "Sanidi mifumo yako ifanye kazi Offline bila matatizo",
    ufafanuzi: `Wawezeshe watumiaji kutumia programu yako bila kuhitaji bando au intaneti kila wakati. Kwa mfano, tumia LocalStorage au SQLite kuhifadhi data za somo ili mtumiaji asome hata akiwa kijijini bila mtandao.`
  },
  {
    kitu: "Tenga dakika 30 kila siku kujifunza ujuzi mpya",
    ufafanuzi: `Kuwa mtaalamu wa IT wa kisasa kwa kusoma mabadiliko ya teknolojia kila siku na kujaribu mambo mapya. Kwa mfano, tembelea tovuti za teknolojia au soma miongozo ya uandishi wa msimbo (kama vile MDN au GitHub) kabla ya kulala.`
  },
  {
    kitu: "Andika msimbo (code) safi na wenye maelezo mafupi",
    ufafanuzi: `Rahisisha usimamizi na uboreshaji wa programu zako kwa kuandika code zilizopangwa vizuri. Kwa mfano, tumia majina ya variable yanayoeleweka na ongeza maelezo (comments) kuelezea kazi ya kila section ya msimbo.`
  },
  {
    kitu: "Fanya majaribio ya mifumo kwenye vifaa tofauti tofauti",
    ufafanuzi: `Hakikisha programu au tovuti yako inafanya kazi vizuri kwenye skrini kubwa na ndogo bila kufeli. Kwa mfano, kabla ya kuachia tovuti yako, ifungue kwenye simu yako, tablet na kompyuta ili kujiridhisha kuwa mwonekano ni thabiti.`
  },
  {
    kitu: "Hifadhi kazi zako kwenye wingu (Cloud Backup) kila siku",
    ufafanuzi: `Zuia kupoteza data au msimbo muhimu pindi kifaa chako kinapoharibika au kupotea ghafla. Kwa mfano, tumia GitHub kusukuma (push) code zako kila jioni au hifadhi nyaraka zako kwenye Google Drive kila mara.`
  },
  {
    kitu: "Tumia Akili Bandia (AI) kwa usahihi kuongeza tija yako",
    ufafanuzi: `Jifunze kuandika prompts sahihi zenye mifano ili upate majibu thabiti ya kukusaidia kutatua changamoto za kitalamu. Kwa mfano, andika prompt inayofafanua lugha, muundo na muktadha unaotaka AI ikusaidie katika kazi zako.`
  },
  {
    kitu: "Jiepushe na matumizi ya programu haramu (Cracked Software)",
    ufafanuzi: `Linda vifaa vyako dhidi ya virusi na malware kwa kutumia programu na mifumo halisi. Kwa mfano, pakua programu zako zote kutoka tovuti rasmi au duka rasmi la Play Store badala ya kutumia viungo haramu mtandaoni.`
  }
];

const ESKATOLOJIA_BASE_ACTIONS = (cleanLesson: string): StudyNoteItem[] => [
  {
    kitu: "Soma na uchambue unabii wa Biblia kila siku",
    ufafanuzi: `Elewa alama za nyakati kwa kusoma vitabu vya Danieli na Ufunuo kwa makini sana ili ujue mpango wa Mungu. Kwa mfano, tenga dakika 20 kila asubuhi kusoma sura moja na ulinganishe unabii huo na matukio yanayotokea sasa duniani.`
  },
  {
    kitu: "Laza roho yako kwa utakatifu na maombi ya kukesha",
    ufafanuzi: `Jiandae kwa kurudi kwa Kristo kwa kujiepusha na anasa za ulimwengu na ubaridi wa kiroho. Kwa mfano, fanya maombi ya toba na kujitakasa kila usiku kabla ya kulala, ukiomba kulindwa na mawaa ya ulimwengu huu.`
  },
  {
    kitu: "Kimbia na uepuke mafundisho na walimu wa uongo",
    ufafanuzi: `Pima kila fundisho unalolisikia kwa kutumia neno thabiti la Biblia ili usipotezwe na uongo wa nyakati za mwisho. Kwa mfano, ukisikia fundisho jipya mtandaoni, fungua Biblia yako na uhakiki kama linakubaliana na mistari ya kweli.`
  },
  {
    kitu: "Weka hazina yako mbinguni kwa kutoa kwa ajili ya injili",
    ufafanuzi: `Punguza ushikamanifu na mali za duniani zinazopita, na wekeza katika ufalme wa milele wa Mungu wetu. Kwa mfano, changia gharama za kueneza injili au msaidie mhubiri anayepeleka neno kwa watu wasiomfahamu Mungu.`
  },
  {
    kitu: "Jiandae kwa ajili ya mtihani wa imani ya kweli",
    ufafanuzi: `Jenga msimamo thabiti usioyumba tangu sasa kabla ya siku za dhiki kuu na mtihani wa chapa ya mnyama kuwadia. Kwa mfano, fanya maamuzi madogo ya kusimamia uaminifu kazini hata kama inamaanisha kukosa faida ya haraka leo.`
  },
  {
    kitu: "Tazama na utafsiri matukio ya dunia kwa jicho la kinabii",
    ufafanuzi: `Fuatilia habari za ulimwengu kama vile mmonyoko wa maadili na siasa ukielewa ni utimilifu wa unabii. Kwa mfano, unapoona habari za vita au magonjwa mapya, usihofu bali kiri moyoni: 'Yesu anarudi, niko salama mkononi mwake.'`
  },
  {
    kitu: "Hubiri injili ya ufalme kwa watu wa karibu yako",
    ufafanuzi: `Kuwa mjumbe wa amani na wokovu kwa kuwaeleza wengine tumaini la kurudi kwa Kristo na jinsi ya kujiandaa. Kwa mfano, anzisha mazungumzo ya kirafiki na jirani au mfanyakazi mwenzako na umshirikishe upendo wa Mungu.`
  },
  {
    kitu: "Tengeneza ibada ya familia ya kila siku nyumbani kwako",
    ufafanuzi: `Hakikisha nyumba yako yote inajaa roho ya maombi na utakatifu ili sote tunyakuliwe pamoja. Kwa mfano, kila saa mbili usiku kusanya watoto na mwenza wako kusoma mstarri mmoja na kuomba pamoja kwa dakika tano.`
  },
  {
    kitu: "Ishi kwa unyenyekevu na upendo mkuu kama Kristo",
    ufafanuzi: `Jiepushe na kiburi cha maisha na roho ya ubinafsi inayotawala kizazi hiki cha mwisho. Kwa mfano, nena kwa upole na amani na kila mtu anayekukwaza, ukionyesha tabia ya Mwanakondoo wa Mungu aliyetufia msalabani.`
  },
  {
    kitu: "Tenga siku moja kwa wiki kufanya tathmini ya utakatifu wako",
    ufafanuzi: `Kagua maisha yako ya kiroho na uone maeneo unayotakiwa kutubu na kurekebisha mienendo yako. Kwa mfano, kila Jumapili jioni kaa faragha peke yako, fanya tathmini ya jinsi ulivyoishi wiki hiyo na uandike maeneo ya kurekebisha.`
  }
];

const MAISHA_BASE_ACTIONS = (cleanLesson: string): StudyNoteItem[] => [
  {
    kitu: "Amka asubuhi na mapema na uanze siku yako kwa malengo",
    ufafanuzi: `Panga asubuhi yako vizuri ili uweze kutekeleza majukumu yako ya ${cleanLesson} kwa ufanisi mkubwa na nidhamu ya hali ya juu. Kwa mfano, weka alamu ya kukuamsha saa kumi na moja asubuhi na uandike mambo matatu unayotaka kuyatimiza leo.`
  },
  {
    kitu: "Kula chakula chenye afya na virutubisho asubuhi",
    ufafanuzi: `Linda afya na nguvu ya mwili wako iti uweze kufanya kazi zako vizuri bila kuchoka haraka kimaisha. Kwa mfano, kunywa chai yenye viini lishe na ule tunda kama ndizi au chungwa kila asubuhi kabla ya kuondoka nyumbani.`
  },
  {
    kitu: "Panga vipaumbele vya shughuli zako kila siku",
    ufafanuzi: `Usifanye mambo kwa fujo; anza na yale yenye umuhimu mkubwa kwanza kabla ya kuanza mambo mengine ya ${cleanLesson}. Kwa mfano, andika orodha ya majukumu yako asubuhi na uweke alama ya nyota kwenye mambo mawili muhimu ambayo lazima yakamilike leo.`
  },
  {
    kitu: "Epuka kabisa ugonjwa wa kuahirisha mambo yako",
    ufafanuzi: `Kamilisha kila jukumu ulilopanga kufanya kwa wakati uliopangwa bila kutafuta sababu za kukwepa. Kwa mfano, unapoanza kuandika ripoti au kufanya kazi ya mikono, weka simu yako mbali hadi ukamilishe kazi hiyo.`
  },
  {
    kitu: "Kabiliana na msongo wa mawazo kwa utulivu na pumzi",
    ufafanuzi: `Unapokutana na changamoto au habari mbaya, tuliza roho yako kwanza kabla ya kufanya maamuzi yoyote ya ${cleanLesson}. Kwa mfano, pumua kwa nguvu ndani na nje mara tatu, kisha omba kimya kimya ukisema: 'Mungu nipe hekima ya kukabili jambo hili.'`
  },
  {
    kitu: "Vaa mavazi nadhifu na yenye heshima kila wakati",
    ufafanuzi: `Mwonekano wako unajenga ujasiri dhabiti na unaleta heshima mbele ya watu unaokutana nao kimaisha. Kwa mfano, pasi nguo yako vizuri usiku na hakikisha imejitiri vizuri kabla ya kwenda kazini au kwenye mkutano wa kijamii leo.`
  },
  {
    kitu: "Sikiliza wengine kwa makini kabla ya kutoa majibu",
    ufafanuzi: `Jenga mahusiano mazuri na watu kwa kuwa msikilizaji mzuri badala ya kuwa mzungumzaji tu daima. Kwa mfano, mtu anapokueleza shida yake, usimkatishe bali mruhusu amalize kisha useme: 'Nimekusikia, hebu tuone jinsi ya kutatua hili.'`
  },
  {
    kitu: "Weka akiba kidogo ya fedha kwa dharura za maisha",
    ufafanuzi: `Jilinde na dharura za ghafla kama magonjwa au matatizo ya usafiri kwa kuwa na mfuko wa dharura. Kwa mfano, weka shilingi 1,000 au 2,000 kila siku kwenye kibubu au akaunti ya siri ambayo huigusi kabisa isipokuwa wakati wa shida kubwa.`
  },
  {
    kitu: "Soma kurasa tano za kitabu cha hekima au maendeleo kila siku",
    ufafanuzi: `Ongeza maarifa yako na upanue uelewa wako wa mambo kila siku bila kuchoka ili ukue kimaisha. Kwa mfano, soma kurasa tano za kitabu cha stadi za maisha au makala yenye manufaa kila jioni baada ya chakula cha usiku.`
  },
  {
    kitu: "Tenga muda wa kufanya mazoezi ya kuweka mwili imara",
    ufafanuzi: `Imarisha afya ya moyo wako na uepuke magonjwa ya kileo kwa kufanya mazoezi mepesi mara kwa mara. Kwa mfano, fanya mazoezi ya kutembea kwa haraka kwa dakika 20 au kufanya push-ups kumi kila asubuhi kabla ya kuoga.`
  }
];

function convertToImperativeWithExample(item: StudyNoteItem, category: string, cleanLesson: string, index: number = 0): StudyNoteItem {
  const rawKitu = cleanText(item.kitu);
  const rawUfafanuzi = cleanText(item.ufafanuzi);

  const imperativeKitu = enforceImperative(rawKitu, category, cleanLesson, index);
  const imperativeUfafanuzi = enforceImperativeUfafanuzi(rawUfafanuzi, category, cleanLesson, index);

  return {
    kitu: imperativeKitu,
    ufafanuzi: imperativeUfafanuzi
  };
}

const EXTRA_BACKUP_ACTIONS = (cleanLesson: string): StudyNoteItem[] => [
  {
    kitu: "Panga mpango wa dharura wa kukabili changamoto",
    ufafanuzi: `Jiandae kisaikolojia na kimkakati kukabiliana na vikwazo vyovyote vinavyoweza kujitokeza katika safari yako ya ${cleanLesson}. Kwa mfano, andika chini orodha ya suluhisho tatu za haraka kwa kila changamoto leo.`
  },
  {
    kitu: "Tafuta ushauri kwa waliofanikiwa kabla yako",
    ufafanuzi: `Usitegemee akili yako tu; tafuta mwongozo kwa watu wenye uzoefu mkubwa katika mada ya ${cleanLesson}. Kwa mfano, panga kikao kifupi cha dakika 10 na mshauri wako au kiongozi jioni ya leo.`
  },
  {
    kitu: "Weka mazingira yako katika hali ya usafi na utulivu",
    ufafanuzi: `Mazingira safi yanaongeza ufanisi na kuondoa msongamano wa mawazo wakati wa kutekeleza ${cleanLesson}. Kwa mfano, safisha meza yako ya kazi au chumba chako vizuri kabla ya kuanza shughuli zako.`
  },
  {
    kitu: "Pima na uandike maendeleo yako kila siku",
    ufafanuzi: `Fanya tathmini ya mara kwa mara ili kujua kama unakaribia malengo yako ya ${cleanLesson}. Kwa mfano, andika kwenye shajara yako kila jioni mafanikio madogo mawili uliyopata leo.`
  },
  {
    kitu: "Jizawadie kwa kila hatua kubwa unayopiga",
    ufafanuzi: `Kuza ari na motisha yako ya ndani kwa kujipongeza unapokamilisha malengo magumu ya ${cleanLesson}. Kwa mfano, jipatie kikombe cha kahawa au pumzika kwa dakika 30 baada ya kukamilisha jukumu kubwa leo.`
  }
];

function isItemSimilar(itemA: StudyNoteItem, itemB: StudyNoteItem): boolean {
  const titleA = itemA.kitu.toLowerCase().trim();
  const titleB = itemB.kitu.toLowerCase().trim();
  
  if (titleA === titleB) return true;
  if (titleA.includes(titleB) || titleB.includes(titleA)) return true;
  
  // Check prefix of title (first 10 characters)
  if (titleA.substring(0, 10) === titleB.substring(0, 10)) return true;
  
  // Check if they share any significant Swahili word of length >= 5
  const stopwords = new Set([
    "katika", "na", "ya", "wa", "kwa", "kila", "za", "vya", "vile", "yako", 
    "chako", "zako", "wako", "kama", "hili", "sasa", "asubuhi", "mapema", 
    "kujifunze", "kufanya", "panga", "weka", "tenga", "epuka", "fanya", "jenga", "soma"
  ]);
  
  const wordsA = titleA.split(/[\s,.:;!?()]+/).filter(w => w.length >= 5 && !stopwords.has(w));
  const wordsB = titleB.split(/[\s,.:;!?()]+/).filter(w => w.length >= 5 && !stopwords.has(w));
  
  for (const wA of wordsA) {
    if (wordsB.includes(wA)) {
      return true; // Avoid same thematic action words
    }
  }

  const descA = itemA.ufafanuzi.toLowerCase().trim();
  const descB = itemB.ufafanuzi.toLowerCase().trim();
  
  if (descA === descB) return true;
  if (descA.includes(descB) || descB.includes(descA)) return true;
  
  // Prefix of description
  if (descA.substring(0, 25) === descB.substring(0, 25)) return true;
  
  // Shared words in explanation
  const dWordsA = descA.split(/[\s,.:;!?()]+/).filter(w => w.length >= 6 && !stopwords.has(w));
  const dWordsB = descB.split(/[\s,.:;!?()]+/).filter(w => w.length >= 6 && !stopwords.has(w));
  
  let sharedCount = 0;
  for (const wA of dWordsA) {
    if (dWordsB.includes(wA)) {
      sharedCount++;
    }
  }
  
  if (sharedCount >= 2) {
    return true; // Overlap in explanation concepts
  }
  
  return false;
}

export function getEskatolojiaSpecificActions(lessonTitle: string): StudyNoteItem[] {
  const norm = lessonTitle.toLowerCase();
  
  if (norm.includes("uumbaji") || norm.includes("eden") || norm.includes("wokovu")) {
    return [
      { kitu: "Tafakari ya Uumbaji asubuhi", ufafanuzi: "Tenga dakika 5 asubuhi kutafakari uumbaji wa Mungu katika bustani ya Edeni na jinsi alivyo na mpango wa wokovu kwa ajili yako tangu mwanzo." },
      { kitu: "Chagua kuishi kwa Kusudi la asili", ufafanuzi: "Andika chini mambo matatu unayotenda leo yanayolinda na kuonyesha utii wako kwa Mungu aliyekuumba ukiwa na thamani kuu." },
      { kitu: "Rejesha amani ya Edeni nyumbani kwako", ufafanuzi: "Epuka kabisa maneno ya hasira au kashfa leo; badala yake jaza nyumba yenu upendo, tabasamu, na utulivu mwanana kama wa bustani ya Edeni." },
      { kitu: "Tunza mazingira yako ya kujifunzia", ufafanuzi: "Fanya usafi wa mazingira yako ya kazi leo asubuhi, ukiweka chumba chako katika hali ya hewa safi na mpangilio mzuri ili kuongeza ufanisi." },
      { kitu: "Tafuta vyakula vya asili na afya bora", ufafanuzi: "Zingatia lishe bora ya asili leo kwa kula matunda na mboga za majani, ukiheshimu mwili wako kama hekalu takatifu alilolifanya Mungu tangu uumbaji." },
      { kitu: "Soma kwa utulivu Mwanzo sura ya 1 na 2", ufafanuzi: "Soma sura hizi mbili jioni ya leo ukichunguza jinsi uumbaji ulivyokuwa kamili na ushukuru kwa upendo huo wa asili." },
      { kitu: "Weka doria ya kiroho juu ya moyo wako", ufafanuzi: "Kataa mawazo hasi au vishawishi vinavyojaribu kukutoa kwenye kusudi takatifu la uumbaji wako leo." },
      { kitu: "Ombea ukombozi na utakaso wa dhati", ufafanuzi: "Fanya maombi maalum jioni ya leo ukijiombea urejesho kamili wa kiroho uendane na sura na mfano wa Mungu." },
      { kitu: "Toa shukrani za kipekee kwa ukombozi", ufafanuzi: "Andika shukrani tano za dhati in katika shajara yako ukitambua kazi kubwa ya wokovu aliyokufanyia Mungu katika maisha yako." },
      { kitu: "Shuhudia upendo wa Mungu kwa mtu mmoja", ufafanuzi: "Tafuta mtu mmoja aliyelemewa na shida leo, mpe maneno ya faraja na amani ukimkumbusha kuwa Mungu anampenda sana." }
    ];
  }
  if (norm.includes("agano") || norm.includes("vipindi") || norm.includes("dispensations")) {
    return [
      { kitu: "Tambua kipindi cha neema unachoishi", ufafanuzi: "Tafakari leo jinsi kipindi hiki cha sasa cha neema kilivyo fursa ya kipekee ya ukombozi na uondoe hofu ya kuhukumiwa." },
      { kitu: "Simama juu ya ahadi za Agano Jipya", ufafanuzi: "Andika misingi ya agano jipya inayokuhakikishia msamaha wa dhambi na ulinzi, na uikariri asubuhi ya leo." },
      { kitu: "Jifunze uaminifu wa maagano ya kale", ufafanuzi: "Soma jinsi Mungu alivyolinda agano lake na Ibrahimu na Nuhu, na ujifunze kuwa Yeye ni mwaminifu wa milele." },
      { kitu: "Fanya tathmini ya uaminifu wako kwa Mungu", ufafanuzi: "Angalia kama unatimiza ahadi na nadhiri zako zote kwa Mungu na jirani yako, na urekebishe makosa leo." },
      { kitu: "Zingatia amani na neema kwa wote", ufafanuzi: "Toa msamaha kwa mtu aliyekukosea leo, ukionyesha neema kama ile uliyopewa bure chini ya agano jipya." },
      { kitu: "Soma Waebrania sura ya 8 na 9", ufafanuzi: "Soma sura hizi jioni ya leo ukichunguza tofauti ya agano la kale na agano jipya lililojengwa juu ya dhabihu bora ya Kristo." },
      { kitu: "Linda heshima ya dhabihu ya Yesu", ufafanuzi: "Kataa kabisa tabia mbaya au dhambi za makusudi leo ili usikanyage damu ya agano inayokutakasa kila siku." },
      { kitu: "Ombea uaminifu katika familia yako", ufafanuzi: "Fanya ibada ya pamoja ya kifamilia leo ukiweka agano la amani na ulinzi juu ya watoto na mwenza wako." },
      { kitu: "Weka kumbukumbu ya ahadi za kibiblia", ufafanuzi: "Tenga kijitabu maalum cha kuandika mistari ya agano unayoweza kusimamia wakati wa maombi na majaribu ya kimaisha." },
      { kitu: "Jipongeze kwa kuwa mrithi wa ahadi", ufafanuzi: "Shukuru Mungu kwa sauti ya furaha ukijua kuwa kupitia neema Yake, wewe ni mrithi rasmi wa uzima wa milele." }
    ];
  }
  if (norm.includes("falme") || norm.includes("daniel")) {
    return [
      { kitu: "Chunguza unabii wa Danieli 2 na 7", ufafanuzi: "Soma sura hizi za Biblia leo, ukichora au kuandika mpangilio wa falme nne na jinsi jiwe lililochongwa bila mikono linavyoashiria Kristo." },
      { kitu: "Simama imara kama Danieli huko Babeli", ufafanuzi: "Weka uamuzi thabiti wa kutoyumbishwa na tabia mbaya za kijamii au shinikizo la marafiki kazini au chuoni leo." },
      { kitu: "Kataa kabisa anasa na vyakula vya Babeli", ufafanuzi: "Zingatia maisha ya kiasi na nidhamu katika matumizi na vyakula leo, ukiepuka ulevi au anasa zinazoharibu akili." },
      { kitu: "Omba mara tatu kwa siku kwa utaratibu", ufafanuzi: "Weka alarms saa tatu asubuhi, saa sita mchana, na saa tisa alasiri ili upige magoti kwa dakika 5 kuongea na Mungu kama Danieli." },
      { kitu: "Tambua kuwa historia iko mikononi mwa Mungu", ufafanuzi: "Unapoona changamoto za kisiasa au kiuchumi za sasa, tuliza moyo wako ukijua Mungu ndiye anayetawala falme za wanadamu." },
      { kitu: "Fanya kazi yako kwa uaminifu usio na mawaa", ufafanuzi: "Tekeleza majukumu yako ya kiofisi au ya kibiashara kwa ueledi wa juu sana leo ili maadui wasipate sababu ya kukushtaki." },
      { kitu: "Kataa kusujudia sanamu za sasa za dunia", ufafanuzi: "Kataa kuweka pesa, sifa, au mitandao ya kijamii mbele ya Mungu, ukiilinda nafsi yako dhidi ya ibada ya sanamu." },
      { kitu: "Soma dondoo za kihistoria za falme za kale", ufafanuzi: "Tenga dakika 15 leo kusoma historia ya Medo-Persia, Ugiriki na Rumi ili kuona jinsi Biblia ilivyotabiri kwa usahihi wa kiatomu." },
      { kitu: "Ombea ujasiri na hekima ya uongozi", ufafanuzi: "Omba Mungu akujaze roho ya ubora (excellent spirit) kama ya Danieli ili uwe kiongozi bora na tegemeo katika jamii yako." },
      { kitu: "Andika azimio la kusimama peke yako kwa kweli", ufafanuzi: "Andika katika shajara yako: 'Hata kama wote watayumba, mimi nitasimama upande wa kweli na uaminifu kwa Mungu wangu.'" }
    ];
  }
  if (norm.includes("kuja kwa kwanza") || norm.includes("ukombozi") || norm.includes("kristo")) {
    return [
      { kitu: "Soma habari za Calvary na ukombozi", ufafanuzi: "Soma Isaya 53 na Luka 23 leo ukizama katika mateso na dhabihu ya Yesu msalabani iliyokupa ushindi wa kudumu." },
      { kitu: "Ishi kwa shukrani na unyenyekevu mkuu", ufafanuzi: "Epuka kabisa malalamiko au manung'uniko leo; badala yake mshukuru Mungu kila saa kwa kukupa uzima na msamaha bure." },
      { kitu: "Zishinde hofu zote kwa nguvu ya Msalaba", ufafanuzi: "Unapohisi wasiwasi au hofu ya magonjwa na mauti, tamka kwa sauti: 'Yesu alichukua magonjwa yangu msalabani, mimi nina ushindi.'" },
      { kitu: "Fanya tendo moja la dhati la upendo", ufafanuzi: "Onyesha upendo kwa jirani yako leo kwa kumsaidia kwa msaada wa chakula, fedha, au ushauri wa kitaalamu kama ishara ya ukombozi." },
      { kitu: "Omba kwa ajili ya nguvu ya ufufuo", ufafanuzi: "Fanya maombi maalum asubuhi kuomba nguvu ya Roho Mtakatifu iliyomfufua Kristo ihuishe afya yako na kazi zako zote leo." },
      { kitu: "Weka ulinzi wa Damu ya Yesu nyumbani", ufafanuzi: "Tamka maombi ya ulinzi juu ya milango ya nyumba yako na juu ya watoto wako, ukiweka doria ya kiungu dhidi ya hila za adui." },
      { kitu: "Soma Injili ya Yohana sura ya 19", ufafanuzi: "Tenga muda jioni kusoma kwa utulivu sura hii, ukitafakari kauli ya mwisho ya Yesu: 'Imekwisha!' na ufurahie uhuru wako." },
      { kitu: "Kataa kabisa kutosamehe wengine leo", ufafanuzi: "Samehe makosa yote ya watu waliokuumiza huko nyuma, ukikumbuka jinsi ulivyosamehewa deni kubwa msalabani." },
      { kitu: "Kiri ukombozi wako wa kifedha na kiroho", ufafanuzi: "Tamka asubuhi: 'Kristo alifanyika maskini ili mimi nipate kuwa tajiri, umaskini na laana havina nguvu juu yangu tena.'" },
      { kitu: "Jipongeze kwa kumiliki amani ya Calvary", ufafanuzi: "Kaa kwa utulivu mkuu kabla ya kulala, ukijiridhisha kuwa una amani kamili na Mungu wako kwa dhabihu ya ukombozi." }
    ];
  }
  if (norm.includes("kanisa") || norm.includes("neema")) {
    return [
      { kitu: "Shiriki kikamilifu katika ushirika wa dhati", ufafanuzi: "Piga simu au tembelea muumini mmoja leo kumjulia hali na kumtia moyo, ukiimarisha misingi ya upendo wa kikristo." },
      { kitu: "Tambua na utumie karama yako ya kiroho", ufafanuzi: "Tafakari karama uliyopewa (kama kufundisha, kusaidia, au kufariji) na uitumie leo kuleta tija na ufanisi katika ushirika wenu." },
      { kitu: "Ombea kanisa na viongozi wake leo", ufafanuzi: "Tenga dakika 5 kuombea viongozi wa kiroho wapate hekima, uaminifu, na nguvu za kusimama imara dhidi ya kuanguka kwa ulimwengu." },
      { kitu: "Weka doria ya kulinda usafi wa ushirika", ufafanuzi: "Kataa kabisa kushiriki katika mazungumzo ya umbea, majungu, au kashfa dhidi ya watumishi wa Mungu au waumini wenzako leo." },
      { kitu: "Soma Matendo ya Mitume sura ya 2", ufafanuzi: "Soma sura hii leo ukichunguza jinsi kanisa la kwanza lilivyoishi kwa umoja, kusali pamoja, na kusaidiana kwa uaminifu mkubwa." },
      { kitu: "Toa sadaka ya upendo kusaidia wahitaji", ufafanuzi: "Tenga kiasi kidogo cha fedha au chakula leo na ukipeleke kwa mtu mhitaji aliyemo ndani ya ushirika wenu au jirani yako." },
      { kitu: "Kuza niandiko ya kusoma Biblia na familia", ufafanuzi: "Anzisha madarasa madogo ya kujifunza Neno la Mungu nyumbani kwako leo jioni ukiwa na watoto na mwenza wako." },
      { kitu: "Kataa upotoshaji na mienendo mibaya", ufafanuzi: "Simamia maadili ya kibiblia katika maisha yako ya kila siku, ukiwa kielelezo bora cha mwanga na chumvi katika jamii yako." },
      { kitu: "Omba kwa ajili ya mvua ya masika", ufafanuzi: "Omba ujazo mpya wa Roho Mtakatifu katika maisha yako leo ili uwe na nguvu ya kushuhudia na kufanya kazi kwa ufanisi mkubwa." },
      { kitu: "Shukuru kwa fursa ya kuwemo kwenye ushirika", ufafanuzi: "Mshukuru Mungu jioni ya leo kwa kukupenda na kukuweka ndani ya boma takatifu la kanisa Lake la neema." }
    ];
  }
  if (norm.includes("ishara") || norm.includes("nyakati") || norm.includes("ulimwengu")) {
    return [
      { kitu: "Tafsiri ripoti za habari kwa jicho la kinabii", ufafanuzi: "Unaposoma au kusikiliza habari za kimataifa leo, zilinganishe na Mathayo 24 ili uone utimilifu wa ishara za nyakati." },
      { kitu: "Zima hofu yote ya majanga moyoni mwako", ufafanuzi: "Kataa kabisa mihemko ya woga au fadhaa kuhusu vita na njaa, ukikumbuka kuwa Yesu alisema: 'Msishtuke, haya hayana budi kutokea.'" },
      { kitu: "Zingatia maisha ya kukesha na kuomba", ufafanuzi: "Weka ratiba dhabiti ya maombi ya kila siku, ukiilinda roho yako isilale katika usingizi wa kiroho na anasa za dunia." },
      { kitu: "Weka akiba ya rasilimali kwa hekima", ufafanuzi: "Zingatia usimamizi mzuri wa uchumi na chakula nyumbani kwako leo, ukikataa upotevu ukijua nyakati za sasa ni tete sana." },
      { kitu: "Soma Mathayo sura ya 24 na Luka 21", ufafanuzi: "Soma sura hizi mbili leo ukichunguza ishara zote alizozitaja Yesu na jinsi zinavyotimia mbele ya macho yetu leo." },
      { kitu: "Ombea ulinzi wa kiungu juu ya familia yako", ufafanuzi: "Fanya maombi maalum ya kuweka boma la ulinzi juu ya nyumba yenu dhidi ya magonjwa, majanga, na dhoruba za ulimwengu huu." },
      { kitu: "Walaumu na kuwaonya wengine kwa upendo", ufafanuzi: "Tafuta nafasi ya kuzungumza na rafiki yako leo kumkumbusha umuhimu wa kujiweka tayari kiroho kwa sababu muda umekaribia." },
      { kitu: "Ondoa upotevu wa muda kwenye burudani mbaya", ufafanuzi: "Punguza muda unaopoteza leo kwenye mitandao ya kijamii au kuangalia burudani zisizo na maadili, ukiutumia kusoma Neno la Mungu." },
      { kitu: "Kiri ushindi na amani ya Kristo kila saa", ufafanuzi: "Tamka kwa ujasiri leo asubuhi: 'Mungu hajanipa roho ya hofu, bali ya nguvu, ya upendo, na ya akili timamu.'" },
      { kitu: "Fanya tathmini ya utayari wako kila usiku", ufafanuzi: "Kabla ya kulala leo, kagua mienendo yako, fanya toba ya dhati na uandike katika shajara yako mambo ya kuimarisha." }
    ];
  }
  if (norm.includes("unyakuo") || norm.includes("rapture") || norm.includes("watakatifu")) {
    return [
      { kitu: "Dumu katika utakaso wa kila siku", ufafanuzi: "Linda fikra zako, macho yako, na maneno yako leo ili yawe safi na ya kumpendeza Mungu, ukijitayarisha kwa ajili ya unyakuo." },
      { kitu: "Omba ujazo wa mara kwa mara wa Roho Mtakatifu", ufafanuzi: "Tenga dakika 10 asubuhi hii kuomba Mungu ajaze taa yako mafuta mapya ya Roho Mtakatifu ili usikose Bwana atakapokuja." },
      { kitu: "Kataa kabisa vishawishi na tabia za kiulimwengu", ufafanuzi: "Weka mipaka thabiti ya kulinda moyo wako dhidi ya tamaa za mwili na anasa za sasa zinazoweza kukuzorotesha kiroho." },
      { kitu: "Soma 1 Wathesalonike 4:13-18", ufafanuzi: "Soma mistari hii leo kwa utulivu mkubwa, ukitafakari jinsi sauti ya malaika mkuu itakavyovuma na jinsi tutakavyonyakuliwa mawinguni." },
      { kitu: "Weka nia yako kwenye mambo ya mbinguni", ufafanuzi: "Epuka kushikamana sana na mali au sifa za kidunia leo; zifanye kuwa zana za kupita lakini moyo wako uwe mbinguni." },
      { kitu: "Sali kwa unyenyekevu na kutubu dhambi", ufafanuzi: "Kila asubuhi na usiku kiri makosa yako mbele za Mungu ukiomba damu ya Yesu ikusafishe kabisa na kukuweka safi bila mawaa." },
      { kitu: "Zungumza na familia yako kuhusu utayari", ufafanuzi: "Fanya mjadala mfupi na watoto wako leo jioni ukiwaelezea kwa lugha rahisi kuhusu unyakuo na jinsi ya kuishi maisha safi." },
      { kitu: "Kataa uzembe na uvivu wa kiroho", ufafanuzi: "Kumbuka kuwa unyakuo ni wa ghafla; fanya doria ya kiroho moyoni mwako sasa hivi ili usipatwe na usingizi mkuu." },
      { kitu: "Andika azimio la uaminifu katika shajara", ufafanuzi: "Andika leo: 'Nitabaki mwaminifu kwa Kristo, nitalinda mavazi yangu ya kiroho yawe meupe kila saa na kila dakika.'" },
      { kitu: "Mshukuru Mungu kwa tumaini hili kuu la uzima", ufafanuzi: "Toa dhabihu ya shukrani jioni ya leo kwa sauti ya furaha, ukijipongeza kwa kupata ufunuo wa siri hii ya kuokoa nafsi yako." }
    ];
  }
  if (norm.includes("dhiki") || norm.includes("mpinga") || norm.includes("antichrist")) {
    return [
      { kitu: "Jenga mizizi imara ya imani tanzu sasa", ufafanuzi: "Tenga muda mrefu zaidi wa kusoma Biblia na kuomba leo ili imani yako ijengwe juu ya mwamba, isije ikatikisika wakati wa dhoruba." },
      { kitu: "Epuka kutegemea mifumo dhalimu ya kidunia", ufafanuzi: "Zingatia kanuni za kujitegemea kiuchumi na uzalishaji wa asili, ukikataa mitego ya madeni yanayoweza kukufanya mtumwa." },
      { kitu: "Kataa kabisa kupokea alama ya mnyama", ufafanuzi: "Weka uamuzi thabiti wa kiroho moyoni mwako leo kwamba utakuwa radhi kupoteza kila kitu kuliko kusaliti uaminifu wako kwa Mungu." },
      { kitu: "Soma Ufunuo sura ya 13 na 14", ufafanuzi: "Soma sura hizi leo ukichunguza mbinu za kiuchumi na za kidini za mpinga Kristo na jinsi ya kuzishinda kwa saburi ya watakatifu." },
      { kitu: "Ombea ustahimilivu na ujasiri usioyumba", ufafanuzi: "Omba Mungu akujaze roho ya ushupavu kama ya akina Sadraka, Meshaki, na Abednego ili usiiogope tanuru ya moto ya sasa." },
      { kitu: "Linda watoto wako dhidi ya itikadi potofu", ufafanuzi: "Kagua vitabu, michezo, na vipindi vya runinga wanavyoangalia watoto wako leo, na uondoe vyenye misingi ya ki-mpinga Kristo." },
      { kitu: "Jizoeze kuishi kwa maisha ya kiasi na kuridhika", ufafanuzi: "Punguza matamanio ya anasa za kidunia leo; jifunze kufurahi kwa mambo ya msingi ili kujiandaa kukabiliana na nyakati za shida." },
      { kitu: "Weka ushirika imara na waumini waaminifu", ufafanuzi: "Jenga uhusiano wa karibu sana na marafiki waaminifu wa kiroho ili muweze kusaidiana na kunitia moyo wakati dhoruba ikianza." },
      { kitu: "Kiri kuwa nguvu ya Mungu ni kubwa kuliko adui", ufafanuzi: "Tamka kwa sauti leo asubuhi: 'Yeye aliyeko ndani yangu ni mkuu kuliko yeye aliyeko ulimwenguni, mimi nina ushindi daima.'" },
      { kitu: "Kabidhi mustakabali wako mikononi mwa Mungu", ufafanuzi: "Kabla ya kulala leo, fanya maombi ya dhati ya kusema: 'Bwana, maisha yangu na hatima yangu viko mikononi Mwako, nilinde daima.'" }
    ];
  }
  if (norm.includes("kuja kwa mara ya pili") || norm.includes("hargemoni") || norm.includes("magedoni")) {
    return [
      { kitu: "Tazamia kwa furaha kurudi kwa Kristo", ufafanuzi: "Jaza akili yako na picha ya utukufu ya kurudi kwa Bwana leo, ukiondoa mifadhaiko ya sasa na ukitazamia tuzo la milele." },
      { kitu: "Simama imara upande wa Bwana wa Vita", ufafanuzi: "Weka msimamo imara wa kiroho leo, ukikataa kabisa kushiriki au kukubali uasi wowote kijamii unaopingana na sheria ya Mungu." },
      { kitu: "Soma Ufunuo sura ya 19 na Mathayo 25", ufafanuzi: "Soma sura hizi leo ukichunguza jinsi Yesu atakavyokuja kama Mfalme wa wafalme na Bwana wa mabwana kuwahukumu maadui wote." },
      { kitu: "Ombea nguvu ya kusimama mpaka mwisho", ufafanuzi: "Fanya maombi asubuhi hii kuomba neema ya kuvumilia majaribu na kubaki ukiwa mwaminifu hadi siku ile ya kurudi kwake." },
      { kitu: "Walaumu na kuwavuta watu kwenye toba leo", ufafanuzi: "Tafuta mtu mmoja leo anayeishi katika uasi, mpe ujumbe wa upendo na toba ukimkumbusha kuwa siku ya Bwana inakuja kama mwizi." },
      { kitu: "Ondoa kinyongo na chuki moyoni mwako", ufafanuzi: "Safi moyo wako dhidi ya hasira zote leo ili Kristo atakapokuja akukute ukiwa na amani, upendo, na utakaso kamili." },
      { kitu: "Kiri ushindi mkubwa juu ya hila za adui", ufafanuzi: "Tamka asubuhi: 'Yesu alishinda msalabani na atashinda Har-Magedoni; mimi niko upande wa mshindi na sitashindwa kimaisha.'" },
      { kitu: "Jenga nidhamu ya kutoa dhabihu za shukrani", ufafanuzi: "Toa sadaka au andika shukrani za dhati leo kumshukuru Mungu kwa kukupa kibali cha kuurithi ufalme Wake wa utukufu." },
      { kitu: "Weka ulinzi wa kiroho juu ya nyumba yako", ufafanuzi: "Fanya ibada ya jioni ukiwa na watoto wako, mkisoma kuhusu kurudi kwa Yesu na mkiimba nyimbo za ushindi wa kinabii." },
      { kitu: "Pumzisha moyo wako kwa tumaini la ushindi", ufafanuzi: "Lala leo ukiwa na furaha tele ukijua kuwa siri ya wokovu wako imelindwa na Mfalme anayekuja kukulandisha nyumbani." }
    ];
  }
  if (norm.includes("miaka elfu") || norm.includes("millennial") || norm.includes("utawala")) {
    return [
      { kitu: "Ruhusu amani ya Kristo itawale sasa", ufafanuzi: "Kataa kabisa hasira, ugomvi, au kubishana na watu leo; anza kuliishi somo hili kwa kujaza moyo wako utulivu wa mbinguni." },
      { kitu: "Soma Ufunuo sura ya 20 kwa utulivu", ufafanuzi: "Soma sura hii leo ukichunguza jinsi shetani atakavyofungwa kwa miaka elfu moja na jinsi watakatifu watakavyotawala na Kristo." },
      { kitu: "Jizoeze tabia na staha ya kifalme", ufafanuzi: "Zingatia usemi mzuri, staha, na mavazi ya heshima leo, ukiishi kama kiongozi na mrithi wa kifalme wa Ufalme wa Mbinguni." },
      { kitu: "Ombea amani na utulivu katika ndoa yako", ufafanuzi: "Fanya maombi maalum ya kuondoa mihemko na kuleta maelewano ya dhati ndani ya nyumba yenu, mkionyesha mfano wa amani ya milele." },
      { kitu: "Weka malengo ya muda mrefu ya kiroho", ufafanuzi: "Andika chini mipango ya jinsi utakavyokuza uelewa wako wa kiroho na kujiandaa kwa ajili ya kutawala pamoja na Kristo mbinguni." },
      { kitu: "Ondoa uchoyo na ubinafsi katika tabia yako", ufafanuzi: "Fanya tendo moja la ukarimu leo kwa kutoa msaada wa chakula au fedha kwa mtu anayehitaji, ukishirikiana naye kwa upendo." },
      { kitu: "Fundisha watoto wako kuhusu paradiso", ufafanuzi: "Tenga muda leo jioni kuwaelezea watoto wako jinsi miaka elfu moja mbinguni itakavyokuwa ya amani na furaha isiyo na mfano." },
      { kitu: "Kiri mamlaka na uwezo wa kifalme juu yako", ufafanuzi: "Tamka asubuhi ya leo: 'Mimi ni mfalme na kuhani wa Mungu, nina mamlaka ya kushinda changamoto zote za sasa kwa jina la Yesu.'" },
      { kitu: "Fanya tathmini ya utendaji wako kila jioni", ufafanuzi: "Kagua mienendo yako kabla ya kulala ili uhakikishe kuwa umeishi leo kulingana na sheria takatifu za ufalme wa neema." },
      { kitu: "Shukuru kwa siri za utawala zilizofunuliwa", ufafanuzi: "Mshukuru Mungu jioni ya leo kwa sauti kubwa kwa kukufanya kuwa sehemu ya uzao mteule unaoenda kutawala naye milele." }
    ];
  }
  if (norm.includes("hukumu") || norm.includes("enzi cheupe") || norm.includes("white throne")) {
    return [
      { kitu: "Hakikisha jina lako limo Kwenye Kitabu cha Uzima", ufafanuzi: "Fanya maombi ya dhati asubuhi hii kuomba damu ya Yesu isafishe dhambi zako zote na kulinda jina lako lisifutwe kwenye Kitabu cha Uzima." },
      { kitu: "Ishi maisha ya uaminifu na uwajibikaji", ufafanuzi: "Zingatia ukweli, uaminifu, na uadilifu katika kila neno and tendo lako leo, ukikumbuka kuwa kila jambo tutalitolea hesabu." },
      { kitu: "Samehe wote waliokukosea bila kinyongo", ufafanuzi: "Safisha moyo wako leo dhidi ya chuki au kinyongo, ukiwasamehe bure wale waliokuumiza ili nawe upokee msamaha wa hukumu." },
      { kitu: "Soma Ufunuo 20:11-15 na Mathayo 25:31-46", ufafanuzi: "Soma mistari hii leo ukichunguza ukweli wa hukumu ya mwisho na jinsi ya kujiweka upande wa kondoo waaminifu." },
      { kitu: "Ombea toba na utakaso wa dhati kwa wote", ufafanuzi: "Fanya maombi maalum ya kuombea ndugu zako, watoto, na marafiki wapate neema ya toba na wokovu kabla ya siku ile kuu." },
      { kitu: "Kataa kabisa dhambi za makusudi na siri", ufafanuzi: "Ondoa na uache tabia yoyote ya siri inayomchukiza Mungu leo, ukijua hakuna jambo lililositirika ambalo halitafunuliwa siku ya hukumu." },
      { kitu: "Fanya tathmini ya maadili na utendaji wako", ufafanuzi: "Kagua miamala yako yote ya leo, maneno yako, na matumizi ya rasilimali, na ufanye marekebisho yanayofaa maadili ya ki-Mungu." },
      { kitu: "Kataa kabisa kuhukumu au kukashifu wengine", ufafanuzi: "Zuia kinywa chako leo dhidi ya kutoa hukumu au kejeli kwa watu waliopo karibu nawe, ukiacha hukumu yote mkononi mwa Mungu." },
      { kitu: "Kiri kuwa neema ya Kristo inakuepusha na hukumu", ufafanuzi: "Tamka kwa ujasiri leo asubuhi: 'Hakuna hukumu ya adhabu juu yangu mimi niliye ndani ya Kristo, nimevushwa kutoka mautini kuingia uzimani.'" },
      { kitu: "Lala ukiwa na amani ya dhati na Mungu wako", ufafanuzi: "Kaa kwa utulivu kabla ya kulala ukijikabidhi kwa Mungu na ukimshukuru kwa neema ya upendo inayokufunika na kukulinda daima." }
    ];
  }
  if (norm.includes("mbingu mpya") || norm.includes("nchi mpya") || norm.includes("paradiso")) {
    return [
      { kitu: "Weka mtazamo wako kwenye hatima ya milele", ufafanuzi: "Unapokutana na changamoto au maumivu ya kimaisha leo, jikumbushe kuwa haya yote ni ya muda mfupi na paradiso ya milele inakusubiri." },
      { kitu: "Soma Ufunuo sura ya 21 na 22", ufafanuzi: "Soma sura hizi mbili jioni ya leo ukijivinjari katika uzuri wa mji mtakatifu Yerusalemu mpya, barabara za dhahabu, na mto wa maji ya uzima." },
      { kitu: "Ondoa kila kilio na machozi kwa tumaini hili", ufafanuzi: "Kataa huzuni au mifadhaiko leo; badala yake tabasamu na ufurahi ukijua Mungu atafuta kila chozi katika macho yako hivi kurubuni." },
      { kitu: "Ishi kama raia wa mbinguni tanzu leo", ufafanuzi: "Zingatia usemi wa heshima, upendo, na utakaso katika kila hatua yako leo, ukionyesha mienendo inayofaa kuingia katika mji mtakatifu." },
      { kitu: "Ombea uimara wa kiroho wa familia yako", ufafanuzi: "Fanya ibada ya pamoja nyumbani mkisoma kuhusu Yerusalemu mpya, na kuomba kuwa wote mtaingia katika mji huo bila kukosa." },
      { kitu: "Kataa kabisa kushikamana sana na mali za sasa", ufafanuzi: "Zitumie rasilimali zako leo kwa uaminifu lakini usizifanye mungu wako; jua utajiri halisi na wa milele uko Yerusalemu mpya." },
      { kitu: "Zingatia utakaso kamili wa tabia yako", ufafanuzi: "Ondoa kinyongo, uchoyo, uongo, au hasira yoyote leo ili mavazi yako ya kiroho yabaki yakiwa meupe na yenye kung'aa daima." },
      { kitu: "Shuhudia habari njema za paradiso kwa mwingine", ufafanuzi: "Tafakari au msaidie mtu aliyekata tamaa leo, mpe tumaini la mbingu mpya na nchi mpya ambapo hakutakuwa na mauti wala maumivu tena." },
      { kitu: "Andika barua ya shukrani kwenda kwako mwenyewe", ufafanuzi: "Andika katika shajara yako dokezo la ushindi, ukijipongeza kwa kukaza mwendo na kueleza utayari wako wa kuurithi mji mtakatifu." },
      { kitu: "Mshukuru Mungu jioni kwa kukutayarishia makazi bora", ufafanuzi: "Toa dhabihu ya sifa kwa sauti kubwa kabla ya kulala leo, ukifurahia kwa dhati baraka ya kuwa na nyumba ya milele mbinguni." }
    ];
  }

  // Fallback if somehow not matching keywords
  return [
    { kitu: "Soma Biblia kila asubuhi na jioni", ufafanuzi: "Zingatia kusoma sura moja ya Danieli au Ufunuo kila siku ili kuongeza uelewa wako wa kinabii." },
    { kitu: "Weka ratiba ya kukesha na kuomba", ufafanuzi: "Omba kwa ajili ya ulinzi wa kiroho na utayari wa familia yako dhidi ya mitego ya nyakati hizi za mwisho." },
    { kitu: "Zima arifa za simu wakati wa ibada", ufafanuzi: "Linda umakini wako kwa masaa mawili leo ili ufanye tafakari ya dhati bila usumbufu wa kiteknolojia." },
    { kitu: "Kuza nidhamu binafsi ya utakaso", ufafanuzi: "Kagua mienendo yako kila jioni na ufanye toba ya dhati ili uwe kielelezo bora cha uaminifu." },
    { kitu: "Shiriki ushirika mwema na waaminifu wenzako", ufafanuzi: "Jengana imani na waumini wenzako kupitia mazungumzo ya kinabii yenye staha na upendo." },
    { kitu: "Ondoa tamaa na anasa za kidunia leo", ufafanuzi: "Weka vipaumbele vyako mbinguni na dumu katika kuliishi somo hili kwa vitendo kila siku." },
    { kitu: "Toa sadaka ya shukrani kwa uaminifu", ufafanuzi: "Mpe Mungu sehemu Yake kwa uaminifu ili kulinda baraka za kiroho na kiuchumi katika maisha yako." },
    { kitu: "Kataa kabisa vishawishi vya nyakati hizi", ufafanuzi: "Simama imara katika kweli ya neno bila woga hata kama utakutana na upinzani wa kijamii." },
    { kitu: "Kesha na kuomba ukijiombea amani ya ndani", ufafanuzi: "Zitawale hofu zote za siku zijazo ukijua kuwa ulinzi wa kiungu unakufunika na kukuongoza." },
    { kitu: "Jipongeze kwa hatua ya ukuaji wa kiroho", ufafanuzi: "Mshukuru Mungu jioni ya leo kwa siri za kinabii alizokufunulia ili kukuokoa na uasi na kukuimarisha." }
  ];
}

export function getDynamicBreakSection(lessonTitle: string, category: string): { kichwa: string, maelezo: string, muda: string } {
  const norm = lessonTitle.toLowerCase();
  
  if (category === "eskatolojia") {
    if (norm.includes("uumbaji") || norm.includes("eden") || norm.includes("wokovu")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Tafakari ya Uumbaji wa Ajabu",
        maelezo: "Pata dakika 10 za kukaa kwa utulivu mkubwa mahali penye miti au asili ya upepo. Fumba macho, vuta pumzi kwa kina, na ushukuru kwa upendo wa Mungu aliyekuumba na kupanga wokovu wako kabla ya kuwekwa misingi ya dunia.",
        muda: "Dakika 10"
      };
    }
    if (norm.includes("agano") || norm.includes("vipindi") || norm.includes("dispensations")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Mapitio ya Agano la Neema",
        maelezo: "Pumzika kwa dakika 15 ukiwa umeshika kikombe cha maji safi ya kunywa au chai ya mitishamba. Ruhusu ubongo wako utulie kwa kufikiria jinsi unavyoishi chini ya neema kuu ya Mungu katika kipindi hiki cha sasa.",
        muda: "Dakika 15"
      };
    }
    if (norm.includes("falme") || norm.includes("daniel")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Tafakari ya Ushupavu na Uthabiti",
        maelezo: "Simama, unyooshe viungo vya mwili (miguu na mikono) kwa dakika 10. Angalia nje ya dirisha na ukumbuke kuwa mamlaka na falme zote za ulimwengu huu zinapita, lakini Ufalme wa Kristo ni wa milele.",
        muda: "Dakika 10"
      };
    }
    if (norm.includes("kuja kwa kwanza") || norm.includes("ukombozi") || norm.includes("kristo")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Shukrani ya Calvary na Upendo",
        maelezo: "Pumzika kwa dakika 12. Kaa kwa unyenyekevu na utulivu ukifikiria dhabihu kuu ya Yesu msalabani kwa ajili yako. Hebu upendo huo ujaze moyo wako amani na kuondoa wasiwasi wote vya sasa.",
        muda: "Dakika 12"
      };
    }
    if (norm.includes("kanisa") || norm.includes("neema")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Pumziko la Ushirika na Karama",
        maelezo: "Chukua dakika 15 za kupumzisha macho yako mbali na skrini ya simu au kompyuta. Fikiria jinsi unavyoweza kutumia karama zako kuwasaidia wengine katika ushirika wa kanisa na jamii inayokuzunguka leo.",
        muda: "Dakika 15"
      };
    }
    if (norm.includes("ishara") || norm.includes("nyakati") || norm.includes("ulimwengu")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Kuondoa Hofu na Kujaza Utulivu",
        maelezo: "Fumba macho yako kwa dakika 10. Vuta pumzi polepole na kuruhusu amani ya Kristo ijae moyoni mwako. Jikumbushe kuwa licha ya ishara na dhoruba za nyakati hizi za mwisho, Yeye yuko nawe daima.",
        muda: "Dakika 10"
      };
    }
    if (norm.includes("unyakuo") || norm.includes("rapture") || norm.includes("watakatifu")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Maandalizi ya Kiroho na Akiba ya Mafuta",
        maelezo: "Pumzika kwa dakika 12 ukiwa mbali na vurugu za dunia. Tafakari kama taa yako ina mafuta ya kutosha (Roho Mtakatifu) na fanya ombi fupi la moyoni la kukabidhi mienendo yako yote kwa Mungu.",
        muda: "Dakika 12"
      };
    }
    if (norm.includes("dhiki") || norm.includes("mpinga") || norm.includes("antichrist")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Ustahimilivu na Mizizi Imara ya Imani",
        maelezo: "Chukua dakika 15 kupumzika na kunywa kikombe cha maziwa ya moto au maji ya joto. Jikumbushe kuwa uimara wako unajengwa sasa kupitia dhabihu ndogo ndogo za uaminifu kila siku.",
        muda: "Dakika 15"
      };
    }
    if (norm.includes("kuja kwa mara ya pili") || norm.includes("hargemoni") || norm.includes("magedoni")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Ushindi Mkuu wa Mfalme wetu",
        maelezo: "Pumzika kwa dakika 10 ukiwa umekaa vizuri na kuacha mawazo yote ya kidunia. Tafakari juu ya asubuhi ile nzuri ya ushindi ambapo Kristo atarudi kwa utukufu mkubwa kutawala kwa haki na amani.",
        muda: "Dakika 10"
      };
    }
    if (norm.includes("miaka elfu") || norm.includes("millennial") || norm.includes("utawala")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Paradiso ya Amani na Utulivu wa Ndani",
        maelezo: "Tenga dakika 12 za ukimya kamili. Hebu amani ya utawala wa miaka elfu moja ianze kutawala moyo wako sasa hivi, ukiondoa mifadhaiko na vurugu zote za maisha ya kila siku.",
        muda: "Dakika 12"
      };
    }
    if (norm.includes("hukumu") || norm.includes("enzi cheupe") || norm.includes("white throne")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Uandishi wa Kitabu cha Uzima",
        maelezo: "Kaa kwa unyenyekevu mkubwa kwa dakika 15. Tafakari juu ya neema inayokuwezesha kuandikwa jina lako kwenye Kitabu cha Uzima cha Mwanakondoo, na fanya tathmini ya dhati ya mahusiano yako na wengine.",
        muda: "Dakika 15"
      };
    }
    if (norm.includes("mbingu mpya") || norm.includes("nchi mpya") || norm.includes("paradiso")) {
      return {
        kichwa: "Sehemu ya Mapumziko: Furaha ya Milele Isiyo na Machozi",
        maelezo: "Pumzika kwa dakika 15 ukiwa umetulia kabisa. Fumba macho na ufikirie makazi yetu mapya ambapo hakutakuwa na maumivu, mauti, huzuni wala machozi tena. Furahia tumaini hili kuu la milele!",
        muda: "Dakika 15"
      };
    }
  }

  // Fallback breaks for other categories
  if (category === "kiroho") {
    return {
      kichwa: "Sehemu ya Mapumziko: Kukarabati Nguvu za Ndani",
      maelezo: "Pumzisha akili yako kwa dakika 10 kwa kufumba macho na kuvuta pumzi ndefu mara tano. Kabidhi majukumu yako yote mbele za Mungu ukiwa na utulivu mkuu wa moyoni.",
      muda: "Dakika 10"
    };
  }
  if (category === "ndoa") {
    return {
      kichwa: "Sehemu ya Mapumziko: Ustawi wa Kihisia na Amani ya Nyumbani",
      maelezo: "Chukua dakika 15 kupumzika na mwenza wako (kama yupo karibu) au mtafakari kwa upendo mkiwa mbali na shughuli za kazi. Ruhusu upendo ujaze fikra zako.",
      muda: "Dakika 15"
    };
  }
  if (category === "uchumi") {
    return {
      kichwa: "Sehemu ya Mapumziko: Kuboresha Akili na Mtazamo wa Kifedha",
      maelezo: "Pumzika kwa dakika 10 ukiwa mbali na hesabu na kodi. Jikumbushe kuwa amani ya akili ndio rasilimali kubwa kuliko zote katika kujenga utajiri wa kudumu.",
      muda: "Dakika 10"
    };
  }
  if (category === "it") {
    return {
      kichwa: "Sehemu ya Mapumziko: Linda Macho na Akili Yako (Digital Detox Break)",
      maelezo: "Ondoka kwenye skrini ya simu au kompyuta yako kabisa kwa dakika 15. Tembea kidogo, kunywa glasi ya maji baridi, na unyooshe viungo ili kupunguza msongo wa macho na ubongo.",
      muda: "Dakika 15"
    };
  }

  return {
    kichwa: "Sehemu ya Mapumziko ya Kujisomea",
    maelezo: "Baada ya kusoma somo hili, chukua dakika 10 za kupumzika ili uruhusu ubongo wako uhifadhi na kuchakata vizuri maarifa mapya uliyojifunza kabla ya kuanza utekelezaji.",
    muda: "Dakika 10"
  };
}

function getDynamicLessonSpecificActions(content: string, lessonTitle: string, category: string, courseTitle: string = ""): StudyNoteItem[] {
  const rawLesson = cleanLessonTitle(lessonTitle);
  const cleanLesson = getLessonConcept(rawLesson, category);
  const phrases = getConceptPhrases(cleanLesson, category);
  const cleanCourse = courseTitle.replace(/^(kozi\s+ya\s*:?\s*)/i, '').trim();

  // Simple string hashing function to select combinations deterministically
  const getSimpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const seed = getSimpleHash(lessonTitle + courseTitle);

  // Extract unique high-quality nouns from content to make recommendations hyper-contextual
  const stopwords = new Set([
    "katika", "pamoja", "kwenye", "kwanza", "baada", "kabla", "kisha", "kwani", 
    "lakini", "mbele", "nyuma", "muda", "wake", "somo", "chuo", "mwanafunzi", 
    "mwalimu", "joseph", "marwa", "kyama", "giniaz", "college", "yake", "kila",
    "kwao", "nyinyi", "sisi", "yetu", "yenu", "yao", "kama", "hili", "huyo", 
    "pale", "hapo", "hali", "nani", "gani", "nini", "hata", "hasa", "tena"
  ]);
  
  const words = content.split(/[\s,.:;!?()"\d]+/)
    .map(w => w.toLowerCase().trim())
    .filter(w => w.length > 5 && !stopwords.has(w));
  
  const uniqueContentWords = Array.from(new Set(words));

  const getWord = (offset: number, fallback: string): string => {
    return fallback;
  };

  // 10 Themes/Areas of Action
  const templates: StudyNoteItem[] = [];

  if (category === "it") {
    // 1. Planning
    const planTitles = [
      `Panga Ramani ya Kazi ${phrases.ya}`,
      `Andaa Blueprint ya Mfumo ${phrases.wa}`,
      `Sanifu Usanifu wa Mfumo ${phrases.wa}`
    ];
    const planExps = [
      `Andika chini hatua tano za kusanifu mifumo ${phrases.ya} kwenye kijitabu chako leo, ukitumia dhana ya ${getWord(1, "misingi")} ili kuzuia mianya ya kiufundi.`,
      `Chora mchoro wa usanifu au ramani ya mfumo ${phrases.wa} asubuhi ya leo, na ubainishe mzunguko mzima wa data ukizingatia mifano ya ${getWord(2, "kubuni")}.`,
      `Bainisha mapema mahitaji ya kiufundi na miundombinu inayotakiwa kwa ajili ya kutekeleza mradi ${phrases.wa} leo, ukiangazia masuala ya ${getWord(3, "utendaji")}.`
    ];

    // 2. Practical application
    const appTitles = [
      `Fanya Majaribio ${phrases.ya}`,
      `Andika Kodi Safi ${phrases.ya}`,
      `Sanidi Kivitendo ${phrases.ya}`
    ];
    const appExps = [
      `Tenga dakika 45 leo kuandika kodi ya majaribio au kusakinisha maktaba mpya ${phrases.ya}, ukitumia mbinu za ${getWord(4, "ubunifu")} kuondoa makosa mapema.`,
      `Fungua mazingira yako ya uandishi kodi (IDE), unda faili jipya ${phrases.ya}, na utekeleze msimbo rahisi wa majaribio ukiongozwa na dhana ya ${getWord(5, "mchakato")}.`,
      `Tekeleza kivitendo somo ${phrases.ya} kwa kuunda mradi mdogo (sandbox/prototype) kwenye kompyuta au simu yako sasa hivi.`
    ];

    // 3. Security & Protection
    const secTitles = [
      `Sanidi Ulinzi ${phrases.wa}`,
      `Kagua Usalama ${phrases.wa}`,
      `Weka Itifaki ya Usalama ${phrases.wa}`
    ];
    const secExps = [
      `Sakinisha programu za kisasa za usalama, washa uthibitishaji wa hatua mbili (2FA) kwenye seva ${phrases.ya}, na uhakikishe nenosiri lako lina herufi maalum.`,
      `Kagua mianya yote ya usalama kwenye mfumo wako ${phrases.wa} leo, na uzibe uwezekano wowote wa uvujaji wa data kwa kutumia ${getWord(6, "usimbaji")}.`,
      `Weka mifumo madhubuti ya kuzuia mashambulizi ya mtandao yanayolenga vipengele ${phrases.ya}, ukizingatia misingi ya ${getWord(7, "uthibitisho")}.`
    ];

    // 4. Optimization & Quality Control
    const optTitles = [
      `Boresha Kasi ${phrases.ya}`,
      `Safisha Kodi ${phrases.ya}`,
      `Kagua Ufanisi ${phrases.wa}`
    ];
    const optExps = [
      `Chambua kodi au mfumo wako ${phrases.wa} leo jioni, fupisha loops, na uhakikishe kuwa unatumia kumbukumbu kwa ufanisi zaidi.`,
      `Fanya refactoring kwenye faili zako ${phrases.ya} ili kuondoa msimbo unaojirudia, ukileta ufanisi thabiti kupitia mbinu ya ${getWord(8, "uboreshaji")}.`,
      `Pima kasi ya kupakia kurasa and utendaji wa jumla ${phrases.wa}, na urekebishe maeneo yanayochelewesha majibu ya mfumo.`
    ];

    // 5. Communication & Collaboration
    const colTitles = [
      `Shirikiana ${phrases.kuhusu}`,
      `Omba Maoni ${phrases.ya}`,
      `Zungumza na Timu ${phrases.ya}`
    ];
    const colExps = [
      `Pakia kodi au mchoro wako ${phrases.wa} kwenye jukwaa la watengenezaji programu la Giniaz, kisha omba maoni ya kiufundi kuhusu uboreshaji wa ${getWord(9, "huduma")}.`,
      `Shiriki dondoo za somo ${phrases.ya} na mwanafunzi mwenzako leo, mkijadiliana jinsi ya kutatua changamoto za ${getWord(10, "kiufundi")} kwa pamoja.`,
      `Wasilisha report fupi ya maendeleo ya mradi wako ${phrases.wa} kwa kiongozi wako au mshauri wako vya masomo ili kupata mwongozo sahihi.`
    ];

    // 6. Self-Correction & Monitoring
    const monTitles = [
      `Kagua Magogo ${phrases.ya}`,
      `Fanya Doria ${phrases.ya}`,
      `Chambua Makosa ${phrases.ya}`
    ];
    const monExps = [
      `Kagua ripoti na system logs ${phrases.ya} leo jioni ili kubaini kama kuna ucheleweshaji wa huduma (latency) au majaribio ya udukuzi.`,
      `Unda orodha maalum ya ukaguzi (checklist) wa matatizo ya mara kwa mara katika ${phrases.katika} na uikimbize kwenye mfumo wako sasa hivi.`,
      `Tengeneza mazingira ya kupima hitilafu (debugging suite) ila kubaini na kusahihisha upungufu ${phrases.katika}.`
    ];

    // 7. Modern Tools & AI
    const toolTitles = [
      `Tumia Akili Bandia ${phrases.kwa}`,
      `Sanifu Prompts ${phrases.ya}`,
      `Utafiti wa Zana ${phrases.ya}`
    ];
    const toolExps = [
      `Andika prompts makini kupata miundo mbadala na suluhu za kuboresha ${phrases.ya} kupitia AI, kisha linganisha na majibu ya ${getWord(1, "teknolojia")}.`,
      `Tumia zana za kisasa za usaidizi wa kodi (AI coding assistants) kuharakisha uandishi wa sehemu ngumu ${phrases.ya} leo asubuhi.`,
      `Fanya utafiti wa programu na zana mpya za wazi (open-source tools) zinazoweza kurahisisha na kuharakisha utekelezaji ${phrases.ya}.`
    ];

    // 8. Ethics & Compliance
    const ethTitles = [
      `Zingatia Sheria ${phrases.ya}`,
      `Fuata Maadili ${phrases.ya}`,
      `Linda Faragha ${phrases.ya}`
    ];
    const ethExps = [
      `Pitia sheria za makosa ya mtandao na uhakikishe mfumo wowote ${phrases.wa} unaounda hauombi au kuhifadhi data za siri za watumiaji bila idhini yao.`,
      `Hifadhi na ulinde hakimiliki za wengine unapotumia mifumo ${phrases.ya}, na epuka kabisa kunakili kazi za watu bila sifa.`,
      `Weka misingi ya uwazi na maadili mema ya utumiaji wa teknolojia ${phrases.ya} ila kujenga mifumo inayoleta manufaa ya kijamii.`
    ];

    // 9. Stress & Mindset Management
    const mindTitles = [
      `Dhibiti Uchovu ${phrases.wa}`,
      `Pumzika baada ya Kazi`,
      `Weka Uwiano ${phrases.katika}`
    ];
    const mindExps = [
      `Unapojisikia msongo wa mawazo wakati wa kuandika kodi ${phrases.ya}, piga picha ya skrini, nyanyuka, tembea dakika 5 mazingira ya karibu, kisha urejee.`,
      `Tenga vipindi vya dakika 25 vya kazi (Pomodoro) ukiwa unafanya mazoezi ${phrases.ya}, ukifuatiwa na dakika 5 za kunyoosha viungo na kupumua.`,
      `Epuka kufanya kazi usiku kucha kwenye mifumo ${phrases.ya}; hakikisha unapata masaa 7 ya kulala ili kuweka ubongo wako katika hali nzuri.`
    ];

    // 10. Verification & Celebration
    const celTitles = [
      `Hifadhi Toleo ${phrases.wa}`,
      `Jipongeze kwa Hatua ${phrases.ya}`,
      `Toa Ripoti ${phrases.ya}`
    ];
    const celExps = [
      `Pakia sasisho thabiti (git commit) la kazi yako ${phrases.ya} kwenye GitHub leo, na unywe kikombe cha chai ukijishukuru kwa kukamilisha kwa ueledi.`,
      `Hifadhi nakala salama (backup) ya kodi yako yote ${phrases.ya} kwenye wingu au diski ya nje leo jioni ili kulinda juhudi zako.`,
      `Tengeneza andiko fupi (readme file) kuelezea mradi wako ${phrases.wa} na uushiriki kwa furaha na jamii yako.`
    ];

    templates.push({ kitu: planTitles[seed % 3], ufafanuzi: planExps[(seed + 1) % 3] });
    templates.push({ kitu: appTitles[(seed + 1) % 3], ufafanuzi: appExps[(seed + 2) % 3] });
    templates.push({ kitu: secTitles[(seed + 2) % 3], ufafanuzi: secExps[(seed + 3) % 3] });
    templates.push({ kitu: optTitles[(seed + 3) % 3], ufafanuzi: optExps[(seed + 4) % 3] });
    templates.push({ kitu: colTitles[(seed + 4) % 3], ufafanuzi: colExps[(seed + 5) % 3] });
    templates.push({ kitu: monTitles[(seed + 5) % 3], ufafanuzi: monExps[(seed + 6) % 3] });
    templates.push({ kitu: toolTitles[(seed + 6) % 3], ufafanuzi: toolExps[(seed + 7) % 3] });
    templates.push({ kitu: ethTitles[(seed + 7) % 3], ufafanuzi: ethExps[(seed + 8) % 3] });
    templates.push({ kitu: mindTitles[(seed + 8) % 3], ufafanuzi: mindExps[(seed + 9) % 3] });
    templates.push({ kitu: celTitles[(seed + 9) % 3], ufafanuzi: celExps[seed % 3] });
  } else if (category === "uchumi") {
    // 1. Planning
    const planTitles = [
      `Andaa Bajeti ${phrases.ya}`,
      `Panga Mzunguko wa Fedha ${phrases.wa}`,
      `Unda Mpango wa Kifedha ${phrases.wa}`
    ];
    const planExps = [
      `Andika chini vyanzo vyote vya mtaji na matumizi yanayohusiana na mambo ${phrases.ya} asubuhi ya leo, ukigawa kwa mfumo wa 50/30/20 kuzuia hasara na kukuza ${getWord(1, "faida")}.`,
      `Changanua na upange makadirio ya bajeti yako ya mwezi huu kwa ajili ya kugharamia mradi ${phrases.wa}, ukiweka kipaumbele kukuza ${getWord(2, "uwekezaji")}.`,
      `Tengeneza jedwali rahisi la hesabu leo kubaini gharama zote za uendeshaji wa mradi ${phrases.wa}, ukizuia upotevu vya mtaji kwa mbinu ya ${getWord(3, "ubana matumizi")}.`
    ];

    // 2. Implementation
    const appTitles = [
      `Weka Akiba ${phrases.ya}`,
      `Anzisha mradi mdogo ${phrases.wa}`,
      `Tenga Mtaji ${phrases.wa}`
    ];
    const appExps = [
      `Hamishia asilimia 10 ya mapato yako ya leo kwenye akaunti ya akiba isiyoguswa ili kuwezesha uanzishwaji au uboreshaji wa mambo ${phrases.ya}.`,
      `Anzisha mradi mdogo wa majaribio unaohusu mambo ${phrases.ya} leo kuanzia na mtaji mdogo unaomudu, ukitumia dhana ya ${getWord(4, "ujasiriamali")}.`,
      `Tenga kiasi kidogo cha fedha leo asubuhi maalum kwa ajili ya kufanyia doria au kuanza kujiandaa kivitendo kwa somo ${phrases.ya}.`
    ];

    // 3. Protection
    const secTitles = [
      `Dhibiti Hasara ${phrases.ya}`,
      `Dhibiti Matumizi ${phrases.ya}`,
      `Weka Misingi ya Usalama ${phrases.wa}`
    ];
    const secExps = [
      `Kabla ya kufanya matumizi yasiyo ya lazima yanayohusiana na mambo ${phrases.ya} leo, subiri masaa 24 ili kuzuia manunuzi ya msukumo (impulse buying).`,
      `Kagua madeni yako yote yanayoweza kukwamisha utekelezaji wa mradi ${phrases.wa} leo, na uweke mkakati wa kupunguza matumizi yasiyo ya lazima ya ${getWord(5, "anasa")}.`,
      `Weka mifumo madhubuti ya kuzuia uvujaji wa fedha na hasara kwenye usimamizi wako wa mambo ${phrases.ya}, ukitumia kanuni ya ${getWord(6, "uaminifu")}.`
    ];

    // 4. Optimization
    const optTitles = [
      `Boresha Mtiririko ${phrases.wa}`,
      `Kagua Bei ${phrases.ya}`,
      `Tathmini Gharama ${phrases.ya}`
    ];
    const optExps = [
      `Tathmini gharama zako za uendeshaji leo, tafuta wauzaji wa jumla ili kupunguza bei ya mambo ${phrases.ya} na kuongeza faida ya uaminifu.`,
      `Chambua upya mfumo wako wa mauzo ya mambo ${phrases.ya} na uboreshe njia za kupokea malipo kwa njia ya mtandao ili kurahisisha ${getWord(7, "manunuzi")}.`,
      `Kagua vyanzo vya hasara katika mfumo wa uzalishaji wa mambo ${phrases.ya} na uongeze tija kwa kupunguza upotevu wa malighafi.`
    ];

    // 5. Collaboration
    const colTitles = [
      `Boresha Huduma ${phrases.kwa}`,
      `Zungumza na Washirika ${phrases.wa}`,
      `Omba Ushauri ${phrases.wa}`
    ];
    const colExps = [
      `Zungumza kwa upole na tabasamu na wateja wako leo kuhusu mambo ${phrases.ya}, omba maoni yao kuhusu ${getWord(8, "huduma")} ili kuongeza uaminifu wao.`,
      `Wasiliana na mtaalamu wa usimamizi wa fedha au biashara leo asubuhi kuomba ushauri jinsi ya kuboresha ufanisi ${phrases.wa}.`,
      `Tengeneza mtandao wa ushirikiano na wadau watatu waaminifu wanaofanya shughuli sawa na mambo ${phrases.ya} ili kubadilishana uzoefu.`
    ];

    // 6. Evaluation
    const monTitles = [
      `Kagua Hesabu ${phrases.ya}`,
      `Andika Daftari ${phrases.ya}`,
      `Tathmini Ripoti ya Kifedha ${phrases.ya}`
    ];
    const monExps = [
      `Rekodi kila shilingi ya mapato na matumizi ya leo kwenye daftari au programu maalum ya hesabu inayohusu mambo ${phrases.ya} kuzuia upotevu.`,
      `Fanya ukaguzi wa mwisho wa hesabu zako za wiki hii jioni ya leo ili kubaini ufanisi wa matumizi yaliyowekwa kwenye mambo ${phrases.ya}.`,
      `Andika ripoti fupi ya hasara na faida za mwezi uliopita kwa ajili ya kufanya maamuzi madhubuti ya ukuaji ${phrases.wa}.`
    ];

    // 7. Research/Tools
    const toolTitles = [
      `Utafiti wa Soko ${phrases.wa}`,
      `Tafuta Fursa ${phrases.katika}`,
      `Tumia Teknolojia ${phrases.kwa}`
    ];
    const toolExps = [
      `Tembelea biashara tatu zinazohusu mambo ${phrases.ya} karibu na eneo lako, chunguza bei na uwezo wao, kisha uunde mkakati bora wa ${getWord(9, "ushindani")}.`,
      `Soma na kufanyia doria makala au takwimu mpya za soko kuhusu mambo ${phrases.ya} ili kubaini maeneo yenye fursa kubwa na uhitaji mkubwa leo.`,
      `Sakinisha programu ya kisasa ya kufuatilia matumizi na usimamizi wa hesabu kwa ajili ya kuboresha doria ya mambo ${phrases.ya}.`
    ];

    // 8. Ethics/Law
    const ethTitles = [
      `Timiza Ahadi ${phrases.ya}`,
      `Nidhamu ya Fedha ${phrases.ya}`,
      `Lipa Madeni ${phrases.ya}`
    ];
    const ethExps = [
      `Timiza ahadi zote za kifedha kwa wakati leo, na uweke mpango mzuri wa kulipa madeni yote yanayohusu mambo ${phrases.ya} kurejesha heshima yako.`,
      `Toa zaka ya uaminifu au changia asilimia 10 ya faida ${phrases.ya} leo kwa wahitaji ili kukuza roho ya ukarimu na uaminifu kimaadili.`,
      `Hakikisha miamala yote ya kifedha inayohusu mambo ${phrases.ya} inafanywa kwa uwazi, uaminifu, na inafuata sheria bila hila.`
    ];

    // 9. Wellbeing
    const mindTitles = [
      `Dhibiti Msongo wa Kifedha ${phrases.katika}`,
      `Weka Amani ${phrases.katika}`,
      `Punguza Hofu ${phrases.ya}`
    ];
    const mindExps = [
      `Unapohisi msongo wa kifedha au wasiwasi kuhusu mambo ${phrases.ya}, pumzika kwa dakika tano, tafakari mafanikio uliyobarikiwa nayo leo kwenye ${getWord(10, "maisha")}.`,
      `Weka uwiano mwema kati ya utafutaji wa fedha za mambo ${phrases.ya} na maisha ya kifamilia ili kulinda afya yako ya kiakili na ya mwili leo.`,
      `Fanya mazoezi ya kupumua kwa utulivu unapoona malengo ya kifedha ${phrases.ya} yanachelewa kutimia, ukijua wokovu na amani viko mikononi mwa Mungu.`
    ];

    // 10. Celebration
    const celTitles = [
      `Jipongeze kwa hatua ${phrases.ya}`,
      `Toa Shukrani ${phrases.kwa}`,
      `Sherehekea Ukuaji ${phrases.wa}`
    ];
    const celExps = [
      `Sherehekea hatua ndogo ya ukuaji uliyopata leo kwenye mambo ${phrases.ya} kwa kupata kikombe cha chai, na uweke azimio thabiti la kufanikiwa zaidi kesho.`,
      `Toa sadaka ya shukrani kwa Mungu leo kwa ajili ya uelewa na fursa zilizofunguka katika usimamizi wa mambo ${phrases.ya}.`,
      `Tenga sehemu ndogo ya faida ${phrases.ya} kujipatia tuzo dogo la kibinafsi como njia ya kujipa motisha ya kusonga mbele.`
    ];

    templates.push({ kitu: planTitles[seed % 3], ufafanuzi: planExps[(seed + 1) % 3] });
    templates.push({ kitu: appTitles[(seed + 1) % 3], ufafanuzi: appExps[(seed + 2) % 3] });
    templates.push({ kitu: secTitles[(seed + 2) % 3], ufafanuzi: secExps[(seed + 3) % 3] });
    templates.push({ kitu: optTitles[(seed + 3) % 3], ufafanuzi: optExps[(seed + 4) % 3] });
    templates.push({ kitu: colTitles[(seed + 4) % 3], ufafanuzi: colExps[(seed + 5) % 3] });
    templates.push({ kitu: monTitles[(seed + 5) % 3], ufafanuzi: monExps[(seed + 6) % 3] });
    templates.push({ kitu: toolTitles[(seed + 6) % 3], ufafanuzi: toolExps[(seed + 7) % 3] });
    templates.push({ kitu: ethTitles[(seed + 7) % 3], ufafanuzi: ethExps[(seed + 8) % 3] });
    templates.push({ kitu: mindTitles[(seed + 8) % 3], ufafanuzi: mindExps[(seed + 9) % 3] });
    templates.push({ kitu: celTitles[(seed + 9) % 3], ufafanuzi: celExps[seed % 3] });
  } else if (category === "kiroho") {
    // 1. Planning
    const planTitles = [
      `Anzisha Dhabahu ${phrases.ya}`,
      `Panga Ratiba ${phrases.ya}`,
      `Panga Ibada ${phrases.ya}`
    ];
    const planExps = [
      `Tenga dakika 10 asubuhi ya leo kuanzisha dhabahu ya maombi faragha inayohusu mambo ${phrases.ya}, ukimkabidhi Bwana mipango yako yote ya siku.`,
      `Panga ratiba maalum ya kuamka asubuhi na mapema kufanya doria ya kiroho juu ya mambo ${phrases.ya}, ukiongozwa na upendo wa ${getWord(1, "kiungu")}.`,
      `Unda mpango wa usomaji wa Biblia wa siku 12 unaolenga kujifunza na kutafakari misingi yote inayojenga roho yako ${phrases.katika} kiroho.`
    ];

    // 2. Implementation
    const appTitles = [
      `Soma Neno ${phrases.kuhusu}`,
      `Tafakari Maandiko ${phrases.ya}`,
      `Simamia Mistari ${phrases.ya}`
    ];
    const appExps = [
      `Fungua Biblia yako na usome sura moja inayojadili mambo ${phrases.ya} leo, na uandike mistari miwili mikuu ya kuishi nayo mchana kutwa.`,
      `Tenga dakika 15 leo mchana kutafakari na kukiri kwa kinywa chako neno la uzima lililoandikwa kuhusu mambo ${phrases.ya} ukitumia nguvu ya ${getWord(2, "imani")}.`,
      `Soma andiko la leo linalohusu mambo ${phrases.ya} na uandike tafsiri yake rahisi katika daftari lako ili uikumbuke na kuitekeleza.`
    ];

    // 3. Protection
    const secTitles = [
      `Linda Utakatifu ${phrases.katika}`,
      `Linda Milango ${phrases.ya}`,
      `Epuka Vikwazo ${phrases.ya}`
    ];
    const secExps = [
      `Jitenge kwa upole na mazungumzo au picha zinazoharibu roho yako ${phrases.katika}, na uhakikishe unadumisha utakaso wa dhati asubuhi hii.`,
      `Weka ulinzi mkali kwenye milango ya fahamu (macho na masikio) ili kulinda ushuhuda na utakatifu unaojengwa na somo ${phrases.ya}.`,
      `Kataa vishawishi vyote vinavyolenga kukurudisha nyuma au kukutoa kwenye misingi ya kiroho ${phrases.ya} leo, ukitumia ngao ya ${getWord(3, "wokovu")}.`
    ];

    // 4. Optimization
    const optTitles = [
      `Kagua Tabia ${phrases.ya}`,
      `Fanya Toba ${phrases.ya}`,
      `Boresha Utakaso ${phrases.katika}`
    ];
    const optExps = [
      `Kagua nia na mawazo yako yote leo jioni, omba toba na utakaso wa ki-Mungu ili uendelee kukua katika uaminifu ${phrases.wa}.`,
      `Omba Roho Mtakatifu afichue maeneo ya siri moyoni mwako yanayohitaji marekebisho ili ufanane kabisa na Kristo katika mambo ${phrases.ya}.`,
      `Fanya uamuzi wa kuacha kabisa mazoea mabaya yaliyotajwa katika somo ${phrases.ya} na uanze kuishi maisha mapya ya utakatifu leo.`
    ];

    // 5. Collaboration
    const colTitles = [
      `Weka Ushirika ${phrases.wa}`,
      `Weka Dhabahu ya Familia ${phrases.ya}`,
      `Shiriki Ibada ${phrases.kuhusu}`
    ];
    const colExps = [
      `Kusanya familia au rafiki yako leo usiku, ongoza wimbo wa sifa, na ushiriki nao somo hili ${phrases.wa} kwa upendo na unyenyekevu.`,
      `Panga kuhudhuria ibada ya ushirika au kusanyiko la kiroho wiki hii ili kujifunza zaidi kuhusu mambo ${phrases.ya} kutoka kwa wacha Mungu.`,
      `Shiriki dondoo za kiroho na mwanafunzi mwenzako leo, mkijadiliana jinsi ya kusimama imara katika ${getWord(4, "upendo")} wa dhati.`
    ];

    // 6. Evaluation
    const monTitles = [
      `Kagua Utayari ${phrases.wa}`,
      `Pima Imani ${phrases.katika}`,
      `Tathmini Roho ${phrases.ya}`
    ];
    const monExps = [
      `Fanya tathmini ya kina kabla ya kulala leo ukiangalia kama matendo yako yameakisi upendo na uadilifu ${phrases.wa} katika wokovu.`,
      `Kagua kama kuna kinyongo au chuki uliyoiweka moyoni leo inayozuia utendaji ${phrases.wa}, na uisafishe kwa toba ya unyenyekevu.`,
      `Pima maisha yako ya maombi na usomaji wa neno wiki hii uone kama yanaendana na misingi ya ukuaji wa kiroho ${phrases.wa}.`
    ];

    // 7. Research/Tools
    const toolTitles = [
      `Utafiti wa Kiroho ${phrases.wa}`,
      `Soma Vitabu ${phrases.ya}`,
      `Kagua Misingi ${phrases.ya}`
    ];
    const toolExps = [
      `Pitia vitabu vyenye kujenga roho kuhusu mambo ${phrases.ya} leo, ukiandika mbinu za kiroho zinazosaidia kujiimarisha dhidi ya mihemko.`,
      `Fanya utafiti kwenye kamusi ya Biblia au concordances kuelewa maana ya maneno asilia ya kiyunani au kiebrania kuhusu mambo ${phrases.ya}.`,
      `Chunguza mafundisho ya mababa wa kale wa imani ili uone jinsi walivyotekeleza na kusimamia kwa uaminifu somo ${phrases.ya}.`
    ];

    // 8. Ethics/Law
    const ethTitles = [
      `Jenga Uaminifu ${phrases.katika}`,
      `Fuata Maagizo ${phrases.ya}`,
      `Timiza Ahadi ${phrases.ya}`
    ];
    const ethExps = [
      `Heshimu amri za Mungu na uishi kwa uadilifu kulingana na mafundisho ${phrases.ya}, na uhakikishe unaondoa unafiki katika kazi yako leo.`,
      `Timiza nadhiri au ahadi zote ulizompa Mungu au jirani yako leo zinazogusa mambo ${phrases.ya}, ukiimarisha uadilifu wako wa kiroho.`,
      `Zingatia ukweli na uaminifu katika miamala yako yote na maneno yako leo, ukionyesha mfano hai wa kanuni ${phrases.ya}.`
    ];

    // 9. Wellbeing
    const mindTitles = [
      `Kua na Amani ${phrases.katika}`,
      `Kabili Hofu ${phrases.kuhusu}`,
      `Kumbuka Baraka ${phrases.ya}`
    ];
    const mindExps = [
      `Unapojisikia hofu au wasiwasi leo, fungua kinywa chako usome Zaburi ya 91, ukiri ushindi wa Kristo juu ya changamoto ${phrases.ya}.`,
      `Weka doria ya utulivu wa kiroho moyoni mwako, ukikataa fadhaa zote na ukitafuta amani inayopita ufahamu katika mambo ${phrases.ya}.`,
      `Andika baraka tano kuu ambazo Mungu amekupa leo, na uzielezee kwa shukrani mbele zake ukimshukuru kwa wokovu na ulinzi ${phrases.wa}.`
    ];

    // 10. Celebration
    const celTitles = [
      `Toa Shukrani ${phrases.kwa}`,
      `Toa Dhabihu ${phrases.ya}`,
      `Jipongeze Kiroho ${phrases.kwa}`
    ];
    const celExps = [
      `Tenga sadaka au shukrani ya uaminifu kuelezea shukrani yako kwa Mungu leo kwa kukupa uzima na uelewa wa somo hili ${phrases.wa}.`,
      `Imba wimbo mmoja wa sifa kwa sauti ya ushindi jioni ya leo kumshukuru Mungu kwa kukuvusha salama katika doria na majaribio ${phrases.ya}.`,
      `Andika azimio thabiti la kiroho katika shajara yako leo, ukiapa kuendelea kuishi maisha yanayoshuhudia utakatifu ${phrases.wa}.`
    ];

    templates.push({ kitu: planTitles[seed % 3], ufafanuzi: planExps[(seed + 1) % 3] });
    templates.push({ kitu: appTitles[(seed + 1) % 3], ufafanuzi: appExps[(seed + 2) % 3] });
    templates.push({ kitu: secTitles[(seed + 2) % 3], ufafanuzi: secExps[(seed + 3) % 3] });
    templates.push({ kitu: optTitles[(seed + 3) % 3], ufafanuzi: optExps[(seed + 4) % 3] });
    templates.push({ kitu: colTitles[(seed + 4) % 3], ufafanuzi: colExps[(seed + 5) % 3] });
    templates.push({ kitu: monTitles[(seed + 5) % 3], ufafanuzi: monExps[(seed + 6) % 3] });
    templates.push({ kitu: toolTitles[(seed + 6) % 3], ufafanuzi: toolExps[(seed + 7) % 3] });
    templates.push({ kitu: ethTitles[(seed + 7) % 3], ufafanuzi: ethExps[(seed + 8) % 3] });
    templates.push({ kitu: mindTitles[(seed + 8) % 3], ufafanuzi: mindExps[(seed + 9) % 3] });
    templates.push({ kitu: celTitles[(seed + 9) % 3], ufafanuzi: celExps[seed % 3] });
  } else if (category === "eskatolojia") {
    return getEskatolojiaSpecificActions(lessonTitle);
  } else if (category === "ndoa") {
    // 1. Planning
    const planTitles = [
      `Panga Muda na Mwenza ${phrases.kuhusu}`,
      `Mkakati wa Ndoa ${phrases.ya}`,
      `Panga Ratiba ${phrases.ya}`
    ];
    const planExps = [
      `Tenga dakika 15 leo jioni kuzungumza na mwenza wako faragha bila simu kando yetu, mkipanga ustawi na kuelewa mambo ${phrases.ya}.`,
      `Andaa mpango wa pamoja wa kifedha au kiroho na mwenza wako asubuhi ya leo unaolenga kuimarisha misingi ${phrases.ya}.`,
      `Kaa na mwenza wako leo jioni kupanga ratiba ya kuwafundisha watoto nidhamu na kuanzisha dhabahu ya pamoja inayohusu mambo ${phrases.ya}.`
    ];

    // 2. Implementation
    const appTitles = [
      `Onyesha Upendo ${phrases.kwa}`,
      `Zungumza kwa Upole ${phrases.kuhusu}`,
      `Saidiana Kazi ${phrases.za}`
    ];
    const appExps = [
      `Msaidie mwenza wako kuandaa watoto asubuhi hii au kuosha vyombo jioni ili kumwonyesha upendo wa dhati katika kutenda mambo ${phrases.ya}.`,
      `Andika ujumbe mfupi wa mapenzi na shukrani leo asubuhi na mtumie mwenza wako, ukionyesha jinsi unavyothamini mchango wake katika mambo ${phrases.ya}.`,
      `Fanya tendo moja la dhati la kumshangaza mwenza wako leo (kama kumnunulia zawadi ndogo) ili kufanyia kazi kwa upendo misingi ${phrases.ya}.`
    ];

    // 3. Protection
    const secTitles = [
      `Onyesha Uaminifu ${phrases.katika}`,
      `Linda Faragha ${phrases.ya}`,
      `Dhibiti Hasira ${phrases.kwa}`
    ];
    const secExps = [
      `Usiweke nenosiri la siri kwenye simu yako ambalo mwenza wako halijui, na mshirikishe ratiba yako yako yote ya leo kulinda misingi ${phrases.ya}.`,
      `Linda siri na faragha za ndoa yenu leo, ukiepuka kabisa kushirikisha watu wa nje changamoto zenu bila makubaliano ya pamoja kuhusu mambo ${phrases.ya}.`,
      `Kataa kabisa vishawishi vyote vinavyolenga kuingilia au kuharibu uaminifu na heshima ya mwenza wako katika mambo ${phrases.ya}.`
    ];

    // 4. Optimization
    const optTitles = [
      `Dhibiti Mihemko ${phrases.ya}`,
      `Boresha Mazungumzo ${phrases.ya}`,
      `Samehe Haraka ${phrases.katika}`
    ];
    const optExps = [
      `Mwenzi wako akikukosea leo, dhibiti hasira yako, pumua kwa nguvu, na uamue kumsamehe kwa upendo kulingana na misingi ${phrases.ya}.`,
      `Boresha njia ya mazungumzo na mwenza wako leo, ukitumia maneno ya upole na yenye kujenga badala ya lawama au ukosoaji unaoumiza kuhusu mambo ${phrases.ya}.`,
      `Laza hasira yako kabla ya jua kuzama leo; mwambie mwenza wako kuwa unamsamehe na mkae chini kusafisha kinyongo kulingana na misingi ${phrases.ya}.`
    ];

    // 5. Collaboration
    const colTitles = [
      `Mthamini Mwenza ${phrases.katika}`,
      `Pongeza Mwenza ${phrases.kuhusu}`,
      `Shukuru Mwenza ${phrases.kwa}`
    ];
    const colExps = [
      `Mshike mkono mwenza wako leo mwangalie machoni, na mpongeze kwa dhati kwa uaminifu na kila jitihada anazoweka kwenye misingi ${phrases.ya}.`,
      `Mshukuru mwenza wako leo asubuhi kwa uwepo wake na upendo wake kimaisha, ukimtaja kama zawadi ya kipekee inayofanikisha misingi ${phrases.ya}.`,
      `Andaa chakula anachokipenda mwenza wako leo jioni, mkile pacha huku mkijadili mambo mazuri na ya kupendeza ya misingi ${phrases.ya}.`
    ];

    // 6. Evaluation
    const monTitles = [
      `Tathmini Mawasiliano ${phrases.ya}`,
      `Kagua Makosa ${phrases.za}`,
      `Kaa na Mwenza ${phrases.wa}`
    ];
    const monExps = [
      `Fanyeni tathmini ya pamoja jioni ya leo mkiwa wawili, mkizungumzia jinsi mlivyoboresha amani na uhusiano wenu kupitia misingi ${phrases.ya}.`,
      `Kagua kwa unyenyekevu tabia zako zinazoweza kumkwaza mwenza wako, andika maeneo ya kujirekebisha ili ufanikiwe katika mambo ${phrases.ya}.`,
      `Uliza mwenza wako leo: "Ni eneo gani katika maisha yetu nirekebishe ili ujisikie unapendwa zaidi?" na usikilize maoni yake kulingana na misingi ${phrases.ya}.`
    ];

    // 7. Research/Tools
    const toolTitles = [
      `Soma Saikolojia ${phrases.ya}`,
      `Soma Hisia ${phrases.za}`,
      `Jifunze Tabia ${phrases.za}`
    ];
    const toolExps = [
      `Soma kitabu au makala ya stadi za ndoa leo kuelewa saikolojia ya hisia ya mwenza wako kuanzia ngazi ya kiatomu katika mambo ${phrases.ya}.`,
      `Fanya utafiti wa mbinu za kisasa za mawasiliano ya wanandoa, ukiandika dondoo zitakazosaidia kuelewa tofauti zenu katika mambo ${phrases.ya}.`,
      `Kagua tabia za kitamaduni au malezi ya mwenza wako zilizounda mtazamo wake wa sasa, ili umuelewe na kumvumilia katika mambo ${phrases.ya} leo.`
    ];

    // 8. Ethics/Law
    const ethTitles = [
      `Heshimu Ahadi ${phrases.za}`,
      `Fuata Maagizo ${phrases.ya}`,
      `Jenga Heshima ${phrases.katika}`
    ];
    const ethExps = [
      `Epuka kumdhihaki au kumkoshoa mwenza wako mbele ya watu wengine leo; jenga heshima na uadilifu katika mambo ${phrases.ya}.`,
      `Zingatia ahadi na nadhiri zote za ndoa mlizopeana mbele ya madhabahu, na dumu katika kuziishi kivitendo kulingana na misingi ${phrases.ya}.`,
      `Weka misingi ya unyenyekevu na uaminifu leo asubuhi, ukikataa kiburi na kujiona una haki kila wakati ili kulinda amani ${phrases.ya}.`
    ];

    // 9. Wellbeing
    const mindTitles = [
      `Dhibiti Msongo ${phrases.katika}`,
      `Tafuta Furaha ${phrases.ya}`,
      `Amani ya Nyumbani ${phrases.katika}`
    ];
    const mindExps = [
      `Tengeneza mazingira ya utulivu na amani nyumbani kwenu leo, mkicheka pamoja na kupunguza msongo wa mawazo kuhusu mambo ${phrases.ya}.`,
      `Tenga masaa mawili ya mapumziko ya pamoja na mwenza wako leo jioni, mkiondoa majadiliano yote ya kazi au changamoto za kifedha za misingi ${phrases.ya}.`,
      `Ombea ndoa na mwenza wako kwa upendo leo, ukikabidhi afya yake, hisia zake, na mafanikio yake yote mikononi mwa Mungu kulingana na misingi ${phrases.ya}.`
    ];

    // 10. Celebration
    const celTitles = [
      `Tenga Siku ${phrases.ya}`,
      `Jipongezeni ${phrases.kwa}`,
      `Sherehekea Upendo ${phrases.wa}`
    ];
    const celExps = [
      `Panga matembezi mafupi au kutoka kwa chakula cha jioni mwishoni mwa wiki ukiwa na mwenza wako kusherehekea misingi ${phrases.ya}.`,
      `Toa zawadi ya shukrani kwa mwenza wako jioni ya leo mkiwa faragha, ukimshukuru kwa upendo na ustahimilivu wake katika mambo ${phrases.ya}.`,
      `Andika ujumbe wa dhati wa heri katika kijitabu chake leo, ukimtakia siku njema na kuonyesha utayari wa kuishi naye kwa uaminifu kupitia misingi ${phrases.ya}.`
    ];

    templates.push({ kitu: planTitles[seed % 3], ufafanuzi: planExps[(seed + 1) % 3] });
    templates.push({ kitu: appTitles[(seed + 1) % 3], ufafanuzi: appExps[(seed + 2) % 3] });
    templates.push({ kitu: secTitles[(seed + 2) % 3], ufafanuzi: secExps[(seed + 3) % 3] });
    templates.push({ kitu: optTitles[(seed + 3) % 3], ufafanuzi: optExps[(seed + 4) % 3] });
    templates.push({ kitu: colTitles[(seed + 4) % 3], ufafanuzi: colExps[(seed + 5) % 3] });
    templates.push({ kitu: monTitles[(seed + 5) % 3], ufafanuzi: monExps[(seed + 6) % 3] });
    templates.push({ kitu: toolTitles[(seed + 6) % 3], ufafanuzi: toolExps[(seed + 7) % 3] });
    templates.push({ kitu: ethTitles[(seed + 7) % 3], ufafanuzi: ethExps[(seed + 8) % 3] });
    templates.push({ kitu: mindTitles[(seed + 8) % 3], ufafanuzi: mindExps[(seed + 9) % 3] });
    templates.push({ kitu: celTitles[(seed + 9) % 3], ufafanuzi: celExps[seed % 3] });
  } else {
    // 1. Planning
    const planTitles = [
      `Weka Malengo ${phrases.ya}`,
      `Panga Ratiba ${phrases.ya}`,
      `Andaa Mpango ${phrases.wa}`
    ];
    const planExps = [
      `Andika chini malengo matatu makuu unayotaka kuyatimiza leo yanayohusu misingi ${phrases.ya}, na upange muda maalum wa kuyafanyia kazi.`,
      `Andaa muhtasari wa hatua utakazofuata wiki hii kutatua changamoto za misingi ${phrases.ya} kimaisha, ukiweka malengo yenye kupimika.`,
      `Panga ratiba yako ya kila siku ya kujisomea na kujifunza stadi mpya zinazosaidia kukuza uelewa wako wa mambo ${phrases.ya} leo.`
    ];

    // 2. Implementation
    const appTitles = [
      `Fanya Mazoezi ${phrases.ya}`,
      `Tekeleza Kivitendo ${phrases.wa}`,
      `Chukua Hatua ${phrases.katika}`
    ];
    const appExps = [
      `Tenga dakika 20 asubuhi ya leo kufanya mazoezi ya utendaji au kukimbia mchakamchaka ili kuamsha nguvu za mwili kwa ajili ya misingi ${phrases.ya}.`,
      `Fanya doria moja ya vitendo leo asubuhi kuelekeza nguvu zako zote kwenye kukamilisha sehemu ya kwanza ya kazi ${phrases.ya}.`,
      `Tekeleza kivitendo dondoo zote ulizosoma katika misingi ${phrases.ya} leo, bila kuahirisha wala kutafuta visingizio vya kukwama.`
    ];

    // 3. Protection
    const secTitles = [
      `Epuka Vikwazo ${phrases.za}`,
      `Dhibiti Hasara ${phrases.katika}`,
      `Weka Mipaka ${phrases.kwa}`
    ];
    const secExps = [
      `Punguza muda unaopoteza leo kupiga soga zisizo na tija au kubishana na watu, na badala yake panga kukutana na watu wanaohimiza misingi ${phrases.ya}.`,
      `Weka mipaka thabiti ya kulinda muda na nguvu zako dhidi ya watu au shughuli zinazokupotezea nidhamu na ustawi wa mambo ${phrases.ya} leo.`,
      `Zima arifa zote za simu zisizo za lazima leo kwa masaa mawili ili uweze kuangazia na kulinda umakini wako katika kufanikisha misingi ${phrases.ya}.`
    ];

    // 4. Optimization
    const optTitles = [
      `Boresha Nidhamu ${phrases.ya}`,
      `Kagua Ufanisi ${phrases.wa}`,
      `Ongeza Tija ${phrases.katika}`
    ];
    const optExps = [
      `Gawanya masaa yako ya leo katika vitalu maalum vya kazi na kupumzika, ukihakikisha unamaliza kila jukumu ${phrases.wa} kwa wakati.`,
      `Kagua upotevu wa muda na rasilimali katika kazi yako leo, na uboreshe mifumo yako ya utendaji ili ufanikiwe katika mambo ${phrases.ya}.`,
      `Sakinisha programu ya kuongeza tija au tumia mbinu za kuweka orodha ya majukumu kwa ajili ya kukuza ufanisi ${phrases.wa} leo.`
    ];

    // 5. Collaboration
    const colTitles = [
      `Sikiliza kwa Makini ${phrases.kuhusu}`,
      `Shirikiana na Watu ${phrases.katika}`,
      `Omba Ushauri ${phrases.wa}`
    ];
    const colExps = [
      `Mtu anapoongea nawe leo kuhusu mambo ${phrases.ya}, weka simu yako chini, mtazame usoni na uitikie kuonyesha kuwa unamwelewa kwa dhati.`,
      `Shirikiana na mtu mmoja mwenye hekima leo, omba ushauri wake jinsi ya kuboresha tabia au ujuzi wako unaogusa misingi ${phrases.ya}.`,
      `Tengeneza mazingira ya kazi ya pamoja au tija na timu yako leo, mkihimizana kutekeleza misingi na nidhamu ${phrases.ya}.`
    ];

    // 6. Evaluation
    const monTitles = [
      `Fanya Tathmini ${phrases.ya}`,
      `Kagua Maendeleo ${phrases.ya}`,
      `Tathmini Nidhamu ${phrases.ya}`
    ];
    const monExps = [
      `Kabla ya kulala usiku wa leo, andika kwenye kijitabu chako mafanikio mawili na changamoto moja uliyokutana nayo kwenye misingi ${phrases.ya}.`,
      `Kagua malengo uliyojiwekea asubuhi ya leo na upeme asilimia ngapi umefanikiwa kuitekeleza kivitendo kwa somo la misingi ${phrases.ya}.`,
      `Fanya tathmini ya kina ya maendeleo yako ya mwezi huu, ukiandika mambo ya kurekebisha ili uishi sawa na misingi ${phrases.ya}.`
    ];

    // 7. Research/Tools
    const toolTitles = [
      `Soma Kurasa ${phrases.za}`,
      `Utafiti wa Mbinu ${phrases.za}`,
      `Tumia AI kuboresha misingi ${phrases.ya}`
    ];
    const toolExps = [
      `Tenga dakika 15 kusoma kitabu cha stadi za maisha au makala yenye kujenga, ukiandika somo kuu utakalolifanyia kazi katika misingi ${phrases.ya}.`,
      `Tumia zana za kisasa za Akili Bandia au mtandao leo asubuhi kufanya utafiti wa kina juu ya mbinu bora za kufanikisha misingi ${phrases.ya}.`,
      `Tafuta kisa au mfano mmoja wa mafanikio wa mtu aliyebobea katika nyanja ${phrases.ya}, na ujifunze tabia zake za utendaji leo.`
    ];

    // 8. Ethics/Law
    const ethTitles = [
      `Jenga Uaminifu ${phrases.katika}`,
      `Timiza Ahadi ${phrases.za}`,
      `Fuata Maadili ${phrases.ya}`
    ];
    const ethExps = [
      `Timiza kila ahadi uliyotoa leo yanayohusu misingi ${phrases.ya} kwa wakati, na iwapo huwezi kuitimiza, wasiliana na mhusika mapema.`,
      `Zingatia uaminifu, ukweli, na uadilifu katika maneno na matendo yako yote leo, ukionyesha ushawishi chanya kupitia misingi ${phrases.ya}.`,
      `Kataa kabisa kufanya udanganyifu au hila za aina yoyote kazini au masomoni leo, ukisimamia maadili ya juu ya misingi ${phrases.ya}.`
    ];

    // 9. Wellbeing
    const mindTitles = [
      `Dhibiti Msongo ${phrases.wa}`,
      `Kua na Utulivu ${phrases.katika}`,
      `Pumua kwa Kina ${phrases.katika}`
    ];
    const mindExps = [
      `Unapojisikia kuchoka sana leo mchana wakati wa kutekeleza mambo ${phrases.ya}, pumzika kwa dakika tano, pumua kwa kina, na ukumbuke baraka tatu.`,
      `Weka mazingira yako ya kazi katika Hali ya usafi na utulivu leo ili kupunguza msongo wa mawazo na kuongeza umakini katika misingi ${phrases.ya}.`,
      `Tenga masaa maalum leo kufurahia wakati wako na familia yako au kufanya jambo linalokuletea furaha na kupumzisha akili kuhusu misingi ${phrases.ya}.`
    ];

    // 10. Celebration
    const celTitles = [
      `Jipongeze kwa hatua ${phrases.ya}`,
      `Tuzo la Kazi ${phrases.ya}`,
      `Shukuru kwa Ukuaji ${phrases.wa}`
    ];
    const celExps = [
      `Unapokamilisha kazi ngumu uliyopanga leo inayohusu misingi ${phrases.ya}, jipatie kikombe cha chai au pumzika kwa dakika 10 ukijishukuru kwa jitihada zako.`,
      `Toa shukrani za dhati kwa Mungu au kwa mtu aliyekusaidia kufanikisha majukumu yako ya leo yanayohusiana na misingi ${phrases.ya}.`,
      `Andika barua fupi ya pongezi kwenda kwako mwenyewe katika shajara yako leo, ukitambua kila hatua ndogo ya ukuaji katika misingi ${phrases.ya}.`
    ];

    templates.push({ kitu: planTitles[seed % 3], ufafanuzi: planExps[(seed + 1) % 3] });
    templates.push({ kitu: appTitles[(seed + 1) % 3], ufafanuzi: appExps[(seed + 2) % 3] });
    templates.push({ kitu: secTitles[(seed + 2) % 3], ufafanuzi: secExps[(seed + 3) % 3] });
    templates.push({ kitu: optTitles[(seed + 3) % 3], ufafanuzi: optExps[(seed + 4) % 3] });
    templates.push({ kitu: colTitles[(seed + 4) % 3], ufafanuzi: colExps[(seed + 5) % 3] });
    templates.push({ kitu: monTitles[(seed + 5) % 3], ufafanuzi: monExps[(seed + 6) % 3] });
    templates.push({ kitu: toolTitles[(seed + 6) % 3], ufafanuzi: toolExps[(seed + 7) % 3] });
    templates.push({ kitu: ethTitles[(seed + 7) % 3], ufafanuzi: ethExps[(seed + 8) % 3] });
    templates.push({ kitu: mindTitles[(seed + 8) % 3], ufafanuzi: mindExps[(seed + 9) % 3] });
    templates.push({ kitu: celTitles[(seed + 9) % 3], ufafanuzi: celExps[seed % 3] });
  }

  return templates;
}

export function getStudyNotes(courseTitle: string, lessonTitle: string, content: string): StudyNotes {
  const normCourse = courseTitle.toLowerCase();
  const normLesson = lessonTitle.toLowerCase();
  
  // Clean lesson title prefix
  const cleanLesson = cleanLessonTitle(lessonTitle);
  
  // Determine category based on normCourse/normLesson keywords
  let category = "maisha";
  if (normCourse.includes("eskatolojia") || normLesson.includes("unabii") || normLesson.includes("nyakati") || normCourse.includes("sabato")) {
    category = "eskatolojia";
  } else if (normCourse.includes("kiroho") || normCourse.includes("injili") || normCourse.includes("neno-mungu") || normCourse.includes("biblia") || normCourse.includes("tuombeje") || normCourse.includes("mapenzi-ya-mungu") || normCourse.includes("ibada") || normCourse.includes("ulinzi")) {
    category = "kiroho";
  } else if (normCourse.includes("ndoa") || normCourse.includes("mke") || normCourse.includes("mume") || normCourse.includes("familia") || normCourse.includes("mwanamke") || normCourse.includes("mwanaume") || normCourse.includes("uhusiano")) {
    category = "ndoa";
  } else if (normCourse.includes("pesa") || normCourse.includes("fedha") || normCourse.includes("uchumi") || normCourse.includes("biashara") || normCourse.includes("mjasiriamali") || normCourse.includes("mshahara") || normCourse.includes("utajiri") || normCourse.includes("cashflow") || normCourse.includes("uwekezaji")) {
    category = "uchumi";
  } else if (normCourse.includes("hacker") || normCourse.includes("it") || normCourse.includes("app-creator") || normCourse.includes("akili-bandia") || normCourse.includes("ai")) {
    category = "it";
  }

  // Generate the 10 custom, lesson-specific practical steps!
  const final10Points = getDynamicLessonSpecificActions(content, lessonTitle, category, courseTitle);
  const collegeAdvicePoints = final10Points.map(item => {
    let title = item.kitu.trim();
    if (!title.toLowerCase().startsWith("ushauri wa chuo")) {
      title = `Ushauri wa Chuo: ${title}`;
    }
    return {
      kitu: title,
      ufafanuzi: item.ufafanuzi
    };
  });

  // Ensure biblical verses (only references!)
  let rawVerses = extractVerseReferences(content);
  if (rawVerses.length === 0) {
    if (category === "eskatolojia") {
      rawVerses = ["Ufunuo 22:12", "Danieli 12:3", "Mathayo 24:14", "2 Timotheo 3:1-5"];
    } else if (category === "kiroho") {
      rawVerses = ["Zaburi 91:1-2", "Zaburi 23:1", "Waefeso 6:11", "Yohana 15:7"];
    } else if (category === "ndoa") {
      rawVerses = ["Waefeso 5:22-25", "Wakolosai 3:18-19", "Mithali 18:22", "1 Petro 3:7"];
    } else if (category === "uchumi") {
      rawVerses = ["Mithali 10:4", "Kumbukumbu 8:18", "Mithali 3:9-10", "Malaki 3:10"];
    } else if (category === "it") {
      rawVerses = ["Mithali 1:5", "Mithali 18:15", "Kumbukumbu 28:12", "Isaya 43:19"];
    } else {
      rawVerses = ["Mithali 4:7", "Mithali 16:3", "Wagalatia 6:9", "Mithali 22:29"];
    }
  }

  const ujumbeMkuu = generateDynamicMotherlyParagraph(cleanLesson, category, collegeAdvicePoints);
  const cleanedUjumbeMkuu = stripQuotedContent(ujumbeMkuu);

  const cleanedCollegeAdvicePoints = collegeAdvicePoints.map(item => ({
    kitu: stripQuotedContent(item.kitu),
    ufafanuzi: stripQuotedContent(item.ufafanuzi)
  }));

  const mapumziko = getDynamicBreakSection(lessonTitle, category);

  return {
    ujumbeMkuu: cleanedUjumbeMkuu,
    mamboMuhimu: cleanedCollegeAdvicePoints,
    mistari: rawVerses,
    mapumziko
  };
}

export function cleanExtraneousLessonContent(text: string): string {
  if (!text) return "";
  
  let cleaned = text
    .replace(/[#*_~`]/g, '')
    .replace(/\(\s*n\s*\/\s*n\s*\)/gi, '')
    .replace(/\[\s*n\s*\/\s*n\s*\]/gi, '')
    .replace(/\(\s*\\n\\n\s*\)/gi, '')
    .replace(/\\n\\n/g, '\n\n')
    .trim();

  // Define markers that indicate the beginning of appended extraneous sections.
  // Standard lessons consist of 7 sections (or paragraphs).
  // These markers are used to prune older format trailing blocks that might be in the cache.
  const markers = [
    /\n\s*={5,}/, // Divider lines like =============
    /\n\s*UTANGULIZI\s+WA\s+SOMO\s+RASMI/i,
    /\n\s*MABORESHO\s+YA\s+UJUZI/i,
    /\n\s*TATHMINI\s+YA\s+SOMO/i,
    /\n\s*HITIMISHO\s+NA\s+USHAURI/i,
    /\n\s*UPANUZI\s+WA\s+SOMO/i
  ];
  
  let earliestIndex = -1;
  
  for (const marker of markers) {
    const match = cleaned.match(marker);
    if (match && match.index !== undefined) {
      if (earliestIndex === -1 || match.index < earliestIndex) {
        earliestIndex = match.index;
      }
    }
  }
  
  if (earliestIndex !== -1) {
    return cleaned.substring(0, earliestIndex).trim();
  }
  
  return cleaned;
}

