
import type { Lesson } from '../types';
import { saveLesson, getLesson } from './storageService';
import { cleanExtraneousLessonContent } from '../utils/studyNotesHelper';


function getFallbackCourseOutlineClient(courseTitle: string): { title: string, description: string }[] {
  const norm = courseTitle.trim().toLowerCase();

  if (norm.includes("api economy") || norm.includes("api-economy")) {
    return [
      { title: "Somo la 1: Utangulizi wa API Economy na Google API Keys", description: "Jifunze misingi ya uchumi wa API na aina mbali mbali za API key kutoka Google, makundi yake, na matatizo zinazo weza kusuluhisha kuanzia ngazi ya kiatomu." },
      { title: "Somo la 2: Google API Keys na Changamoto Wanazosuluhisha", description: "Uchambuzi wa kina wa API keys za Google (Maps SDK, Dialogflow, Vision API, Gmail, Calendar, YouTube Data API, n.k) na matatizo makubwa wanayosolvi katika soko nchini." },
      { title: "Somo la 3: Makundi ya Programu (Apps) na API Keys Zake", description: "Jifunze kuainisha makundi ya apps mbalimbali, kuchagua API key sahihi kwa kila kundi, na matatizo wanayosuluhisha ili kuvutia watumiaji wengi." },
      { title: "Somo la 4: Jinsi API Keys Zinavyoweza Kuingiza Utajiri na Kipato", description: "Mbinu za kutengeneza utajiri na kipato (wealth creation) kupitia ujumuishaji wa API keys, mifumo ya malipo, na mifumo ya usajili (monetization strategies)." },
      { title: "Somo la 5: Mifano ya Apps Tayari Zilizopo na Jinsi Zinavyolipa", description: "Uchambuzi wa apps zilizopo sokoni leo, mifano ya jinsi zinavyozalisha faida, na mifano ya kiutendaji ya biashara zilizofanikiwa hapa Tanzania." },
      { title: "Somo la 6: Mwanafunzi Asiyejua Code (No-Code AI App Creator)", description: "Mwongozo maalum kwa mwanafunzi asiyejua code hata kidogo. Jinsi ya kutumia AI kuunda maudhui, source code kamili, UI design, color schemes, na section layouts." },
      { title: "Somo la 7: Kukusanya Vitendea Kazi kwa ajili ya Kuunda App", description: "Jinsi ya kukusanya vitendea kazi vyote (links za maudhui, API key, picha, logo ya app, na ukurasa wa 'About Us') tayari kumkabidhi AI aanze kazi ya kuandika code." },
      { title: "Somo la 8: Uundaji wa Code na Kuisakinisha App Creator 24", description: "Hatua kwa hatua za kumuomba AI aunde HTML source code iliyokamilika, kuinakili (copy) na kuibandika (paste) kwenye App Creator 24, na kupakua APK kwa ajili ya kuitest." },
      { title: "Somo la 9: AI kama Mshauri Mkuu na Mboreshaji wa App yako", description: "Jinsi ya kumtumia AI kama mshauri wako mkuu, mbunifu mwenye uzoefu mkubwa, na mboreshaji wa muonekano, rangi, kadi, na muundo mzima wa app yako ili kuvutia wateja." },
      { title: "Somo la 10: Sanaa ya Uundaji na Matumizi ya Section IDs", description: "Mbinu za hali ya juu za kuunda Section IDs kuunganisha ukurasa mkuu wa template na kadi (cards) za huduma mbalimbali ili kufunguka haraka sana mtumiaji akibofya." },
      { title: "Somo la 11: Kukuza Brand ya Chuo Chetu cha Geniuz College", description: "Jinsi mwanafunzi anavyoweza kuchangia kukaza na kukuza brand ya Geniuz College / Giniaz College, na kuwa sehemu ya suluhisho thabiti linalohitajika nchini." },
      { title: "Somo la 12: Orodha ya Mahitaji na Matatizo ambayo Geniuz College Inasolvi", description: "Mchanganuo kamili wa matatizo ya soko nchini Tanzania ambayo chuo chetu kinaweza kuleta suluhisho kuanzia kiwango cha kiatomu ili kupata faida endelevu." }
    ];
  }
  
  if (norm.includes("app creator 24")) {
    return [
      { title: "Utangulizi na Vipengele vya App Creator 24 (Components)", description: "Jifunze vipengele vya msingi vya jukwaa la App Creator 24 na jinsi ya kuvitumia." },
      { title: "Uundaji na Usimamizi wa Section katika App yako", description: "Mwongozo vya jinsi ya kutengeneza, kusimamai, na kupanga sections mbalimbali za app yako." },
      { title: "Uundaji wa Apps za Nje ya Mtandao (Offline Apps)", description: "Jinsi ya kuunda app inayofanya kazi kikamilifu bila uhitaji wa intaneti (offline)." },
      { title: "Uundaji wa Apps za Mtandaoni (Online Apps)", description: "Mbinu za kuunda apps zinazotegemea mtandao na jinsi ya kuziunganisha na seva." },
      { title: "Hatua kwa Hatua: Kuunda App ya Kuchati (Chat App)", description: "Jifunze kusanidi na kutengeneza jukwaa la mazungumzo na kuchati ndani ya app yako." },
      { title: "Kuunda App ya Kuangalia Channels za Azam TV", description: "Mbinu za kuingiza viungo vya utiririshaji (streaming) na kuunda app ya kuangalia chaneli za Azam TV au TV zingine." },
      { title: "Unda App ya Kusoma Habari za Kiswahili za Kimataifa", description: "Jinsi ya kukusanya vyanzo vya habari na kuunda app ya kisasa ya kusoma habari za kimataifa." },
      { title: "Unda App ya Video za DJ Mark", description: "Mwongozo wa kutayarisha na kuweka viungo vya video za burudani na DJ Mark kwenye app." },
      { title: "Unda App ya Masomo ya Shule za Msingi Tanzania", description: "Kuunda app ya kielimu yenye kuwezesha wanafunzi kusoma masomo ya msingi TZ offline." },
      { title: "Unda App ya Biashara ya Mazao Tanzania", description: "Mbinu za kutengeneza jukwaa la kuuza, kununua na kufuatilia bei za mazao ya kilimo nchini Tanzania." },
      { title: "Kuunda App ya Vituo vya Redio (FM Stations Tanzania)", description: "Hatua za kuweka viungo vya utiririshaji wa sauti ili kusikiliza redio mbalimbali za FM Tanzania." },
      { title: "Kanuni Kuu za Uundaji wa Offline App", description: "Jifunze sheria na kanuni muhimu za kuzingatia ili offline app yako iwe na tija, kasi na utulivu." }
    ];
  }

  if (norm.includes("karibu giniaz")) {
    return [
      { title: "Utangulizi wa Giniaz College", description: "Historia na chimbuko la kuanzishwa kwa chuo, na dira yetu kuu." },
      { title: "Dira na Dhana ya Kuanzishwa", description: "Malengo yetu ya muda mrefu katika kuwaandaa viongozi na wajasiriamali." },
      { title: "Mwongozo wa Masomo na Mafunzo ya Vitendo", description: "Mbinu unazopaswa kutumia kuongeza weledi na unufaike kikamilifu." },
      { title: "Vipengele vya Utafiti na Elimu ya Kisasa", description: "Jinsi ya kufanya tafiti rahisi zinazoleta mapinduzi ya kiuchumi." },
      { title: "Maadili, Nidhamu na Bidii Chuoni", description: "Nguzo thabiti za kiroho na kimaisha zinazojenga mustakabali wa mwanafunzi." },
      { title: "Dhana ya Kujitegemea Kiuchumi nchini Tanzania", description: "Jinsi masomo yetu yanavyolenga kumtoa mwanafunzi kwenye utegemezi." }
    ];
  }

  if (norm.includes("mwanamke wa hisia") || norm.includes("mke wa hisia")) {
    return [
      { title: "Mjue Mwanamke wa Hisia: Jinsi ya Kumtambua Kiwango cha Atomu", description: "Utafiti makini wa kisaikolojia, kihemuko, na alama thabiti za kumtambua na utambulisho tangu kiwango cha atomu." },
      { title: "Nguvu Kubwa za Kiasili za Mwanamke wa Hisia na Jinsi ya Kuzitumia", description: "Kuelewa uwezo wa kipekee wa huruma, hisia kali (empathy), na jinsi ya kuzigeuza kuwa silaha ya mafanikio." },
      { title: "Udhaifu wa Mwanamke wa Hisia na Jinsi Anavyoweza Kuutumia kimaisha", description: "Mwongozo wa kubadili upesi vya kuathirika kihemko kuwa fursa thabiti ya uongozi na umakini kimaisha." },
      { title: "Mwanamke wa Hisia Kwenye Ndoa na Uhusiano Mwema", description: "Uchambuzi wa kina kuhusu mawasiliano, upendo wa dhati, na kutatua migogoro ya ndoa kwa hekima na upendo." },
      { title: "Mwanamke wa Hisia Kwenye Familia na Usimamizi wa Malezi", description: "Maadili na njia thabiti za kulea kwa kuelekeza hisia kwa mtazamo chanya katika familia." },
      { title: "Mwanamke wa Hisia Kazini na Kwenye Jamii", description: "Mbinu za kukabili migongano ya kiofisi, nidhamu ya kazi, na kukuza ushupavu thabiti mbele ya changamoto." }
    ];
  }

  if (norm.includes("mwanaume wa hisia")) {
    return [
      { title: "Mjue Mwanaume wa Hisia: Jinsi ya Kumtambua Kiwango cha Atomu", description: "Kuelewa sifa za mwanaume mwenye hisia za ndani lakini mkimya, na tija yake tangu ngazi ya kiatomu." },
      { title: "Nguvu Zake za Kipekee na Jinsi ya Kuzitumia Kuongoza", description: "Kugusa mioyo, mbinu za kipekee za uongozi kulingana na ubinadamu na unyenyekevu thabiti katika jamii." },
      { title: "Udhaifu Wake na Jinsi Anavyoweza Kuutumia", description: "Kupunguza mihemko ya hasira, kudhibiti hofu ya kukataliwa, na kuugeuza udhaifu huo kuwa uthabiti wa kiume." },
      { title: "Mwanaume wa Hisia Kwenye Ndoa na Uhusiano Mwema", description: "Uwezo wake wa kumpenda mke wake kwa kiwango cha juu na namna ya kuzuia migogoro ya kihemko ya ndani." },
      { title: "Mwanaume wa Hisia Kwenye Familia na Uongozi wa Nyumbani", description: "Kulelewa kwa watoto kwa hekima na weledi, na kuwa mfano bora wa ulinzi, nidhamu na malezi ndani ya nyumba." },
      { title: "Mwanaume wa Hisia Kazini na Kwenye Biashara", description: "Namna ya kujenga ushirikiano wa karibu kiofisi and kufanya uamuzi wa kibiashara wenye tija kubwa." }
    ];
  }

  if (norm.includes("ethical hacker") || norm.includes("hacker") || norm.includes("cybersecurity") || norm.includes("cyber security")) {
    return [
      { title: "Utangulizi wa Ethical Hacking na Ulinzi wa Mifumo", description: "Jifunze misingi ya kiusalama ya mtandaoni, tofauti kati ya hacker mwema na mbaya, na maadili ya kazi nchini Tanzania." },
      { title: "Uchunguzi na Ukusanyaji wa Taarifa (Reconnaissance)", description: "Mwongozo thabiti wa mbinu za kukusanya taarifa za mifumo kwa njia halali ili kutambua maeneo yenye udhaifu." },
      { title: "Utambuzi wa Matundu na Udhaifu wa Mifumo (Scanning)", description: "Jinsi ya kutumia zana za kisasa kufanya skanning ya mitandao na kugundua nyufa zinazoweza kuleta hatari." },
      { title: "Itifaki za Mitandao na Usalama wa Mawasiliano", description: "Kuelewa jinsi data inavyosafiri hewani, na mbinu za kulinda mifumo dhidi ya uingiliaji haramu wa mawasiliano." },
      { title: "Hacking ya Mifumo na Mbinu za Kujilinda (System Hacking)", description: "Uchambuzi wa jinsi password zinavyoweza kuvunjwa na namna ya kuweka ulinzi madhubuti wa akaunti." },
      { title: "Usalama wa Wavuti na Maombi ya Mtandaoni (Web Security)", description: "Kusoma makosa makubwa ya kiusalama ya tovuti (kama OWASP Top 10) na mbinu za kuandika kodi salama." },
      { title: "Uhandisi Jamii na Mitego ya Phishing (Social Engineering)", description: "Sanaa ya kulinda akili na tabia za wafanyakazi na familia dhidi ya hadaa au barua pepe za kitapeli." },
      { title: "Usalama wa Mitandao ya Wi-Fi na Mawasiliano ya Hewani", description: "Mbinu za kulinda router na mitandao ya wireless ya nyumbani au ofisini dhidi ya udukuzi wa karibu." },
      { title: "Ulinzi wa Mobile Apps na Mifumo ya Simu (Mobile Security)", description: "Jinsi ya kulinda data za siri kwenye simu za mkononi na kubaini malware wanaofuatilia mawasiliano." },
      { title: "Uandishi wa Ripoti za Kiufundi na Ushauri wa Kitalamu", description: "Sanaa ya kuandika taarifa za usalama kwa lugha ya kitaalamu ili kusaidia biashara na asasi kujiimarisha." },
      { title: "Sheria na Maadili ya Matumizi ya Mtandao nchini Tanzania", description: "Uchambuzi wa sheria za makosa ya mtandao (Cyber Crimes Act) nchini ili kufanya kazi kwa usalama na uaminifu." },
      { title: "Tafakari Kuu na Mtihani wa Majaribio wa Giniaz Hacker Certification", description: "Hitimisho la kozi kupitia majaribio ya vitendo na kupokea cheti cha ufanisi chini ya Mwalimu Joseph Marwa Kyama." }
    ];
  }

  if (norm.includes("akili bandia") || norm.includes("ai")) {
    return [
      { title: "Utangulizi wa Akili Bandia na Historia Yake", description: "Jifunze dhana za kimsingi za AI, na mabadiliko ya kiteknolojia." },
      { title: "Jinsi Mifano ya Lugha Kubwa (LLM) Inavyofanya Kazi", description: "Kuelewa uwezo wa algoriti za kisasa za lugha kama Gemini na GPT." },
      { title: "Mbinu za Kuandika Prompts kwa Ufanisi (Prompt Engineering)", description: "Mwongozo wa jinsi ya kutoa maelekezo bora ili kupata majibu sahihi." },
      { title: "Matumizi ya AI Katika Kazi na Maisha ya Kila Siku", description: "Kuongeza ufanisi wa ratiba za maisha na kazi za kiofisi kupitia zana za AI." },
      { title: "AI katika Elimu na Utafiti nchini Tanzania", description: "Mbinu za kutumia AI kujifunza, kufanya tafiti na kuandaa maudhui ya shule." },
      { title: "Kuongeza Tija na Kipato kwa Kutumia Zana za AI", description: "Jinsi ya kubuni mifumo na huduma yenye kukuongezea kipato kupitia akili bandia." }
    ];
  }

  if (norm.includes("ufundishaji") || norm.includes("mbinu za ufundishaji")) {
    return [
      { title: "Misingi ya Saikolojia ya Kujifunza na Ufundishaji", description: "Jinsi ubongo unavyopokea taarifa na mbinu za ki-saikolojia za kumshawishi mwanafunzi." },
      { title: "Mbinu Shirikishi za Ufundishaji (Active Learning)", description: "Kuongeza ufanisi darasani kwa kuhusisha wanafunzi badala ya kuongea peke yako." },
      { title: "Jinsi ya Kuandaa Somo (Lesson Planning) kwa Kiwango cha Juu", description: "Andaa mwongozo thabiti vya namna ya kufundisha somo lako hatua kwa hatua." },
      { title: "Matumizi ya Zana za Kufundishia (Teaching Aids)", description: "Zana za kale na za kisasa za kuelimisha zinazoacha picha thabiti kichwani mwa mwanafunzi." },
      { title: "Njia za Kuwasiliana kwa Ufasaha na Kuvutia Wanafunzi", description: "Matumizi bora ya sauti, lugha ya mwili na usemi thabiti usiochosha." },
      { title: "Kudhibiti na Kusimamia Darasa (Classroom Management)", description: "Jinsi ya kudumisha nidhamu, utulivu, na usawa hata darasani kukiwa na fujo." }
    ];
  }

  if (norm.includes("ukweli mchungu")) {
    return [
      { title: "Dunia Haikudai Kitu: Ukweli Kuhusu Uwajibikaji Binafsi", description: "Kuelewa kwamba hakuna mtu anayehusika na furaha au mafanikio yako isipokuwa wewe." },
      { title: "Saikolojia ya Familia na Migongano ya Ndani ya Damu", description: "Ukweli mchungu kuhusu ndugu, wazazi, na jinsi migogoro ya kifamilia inavyoweza kukurudisha nyuma." },
      { title: "Uchumi Halisi: Tofauti ya Kutengeneza na Kulinda Fedha", description: "Mbona watu wengi wenye vipato vikubwa bado ni maskini? Kanuni za kulinda pesa zako." },
      { title: "Jamii na Unafiki wa Kijamii: Kuishi na Watu Bila Kuumizwa", description: "Jinsi ukweli wa kijamii ulivyojengwa juu ya maslahi na jinsi ya kujilinda kijamii." },
      { title: "Imani za Kidini vs Maisha Halisi: Kudumisha Imani Bila Upofu", description: "Uchambuzi wa jinsi ya kufanya kazi kwa bidii sambamba na maombi bila kutega miujiza." },
      { title: "Heshima Haipatikani Kirahisi: Jinsi ya Kuijenga na Kuidumisha", description: "Uhusiano mkubwa wa heshima na nguvu ya kiuchumi pamoja na tabia yako binafsi." }
    ];
  }

  if (norm.includes("kiroho") || norm.includes("ulinzi wa kiroho")) {
    return [
      { title: "Utambuzi vya Vita vya Kiroho na Kanuni Zake Kuu", description: "Kuelewa kwamba maisha yetu yanaonekana kimwili lakini misingi yake ni ya kiroho." },
      { title: "Msingi wa Biblia Katika Ulinzi wa Kiroho (Waefeso 6)", description: "Uchambuzi wa silaha sita za Mungu ambazo kila mwamini anapaswa kusimama nazo." },
      { title: "Silaha za Kiroho: Maombi ya Imani na Kufunga", description: "Nishati thabiti inayozalishwa kwa kuunganisha maombi na unyenyekevu mbele za Mungu." },
      { title: "Soma na Kutafakari Neno la Mungu Kama Ngao", description: "Nguvu ya Neno iliyoandikwa inayotumika kama upanga vya roho dhidi ya adui." },
      { title: "Kutambua na Kusimamia Mipaka ya Kiroho ya Familia", description: "Jinsi ya kuanzisha dhabahu ya familia na kuweka ulinzi wa damu juu ya watoto." },
      { title: "Jukumu la Damu ya Yesu na Ushindi wa Msalaba", description: "Mamlaka makubwa ya ushindi tuliokabidhiwa tanzu zamani na jinsi ya kuitumia." }
    ];
  }

  if (norm.includes("nyakati za sasa") || norm.includes("hali halisi")) {
    return [
      { title: "Uchambuzi wa Mazingira ya Sasa Kijamii na Kiuchumi", description: "Hali halisi nchini Tanzania na duniani kote kiuchumi na kitamaduni." },
      { title: "Mabadiliko ya Kitamaduni na Athari Zake Kwenye Familia", description: "Mmonyoko wa maadili, kuiga mambo ya nje, na siri ya kulinda familia yako." },
      { title: "Teknolojia ya Kisasa, Akili Bandia na Mustakabali wa Binadamu", description: "Athari za kisaikolojia za kuwa kwenye skrini saa 24 na mabadiliko ya maisha yetu." },
      { title: "Upotevu wa Maadili, Unafiki na Jinsi ya Kusimama Imara", description: "Kanuni thabiti za kusimama peke yako bila kuyumbishwa na upepo wa jamii." },
      { title: "Uchumi wa Kidijitali na Changamoto ya Kupata Riziki Halali", description: "Fursa mpya za fedha zilizopo mtandaoni na mambo unayopaswa kuepuka." },
      { title: "Elimu ya Sasa vs Maarifa Halisi ya Kimaisha", description: "Gundua mbona vyeti havitoshi na vyuo vinavyokosa kufundisha stadi za mitaani." }
    ];
  }

  if (norm.includes("eskatolojia") || norm.includes("prophecy")) {
    return [
      { title: "Uumbaji na Mpango wa Milele wa Wokovu wa Mungu", description: "Uchambuzi wa mwanzo katika bustani ya Edeni (Historia), vita vya urejesho leo (Sasa), na picha ya utukufu ujao wa mbingu restored (Zijazo)." },
      { title: "Agano la Mungu na Vipindi vya Kinabii (Dispensations)", description: "Kuelewa agano la kale na usimamizi wake (Historia), kuishi chini ya agano jipya la neema (Sasa), na kuelekea utimilifu kamili wa ahadi za Mungu (Zijazo)." },
      { title: "Kuinuka na Kuanguka kwa Falme za Dunia: Unabii wa Danieli", description: "Tathmini ya falme nne za kale zilizopita (Historia), muundo tete wa mataifa na siasa za leo (Sasa), na uanzishwaji wa Ufalme wa Mungu usiotikisika (Zijazo)." },
      { title: "Kuja kwa Kwanza kwa Kristo na Utangulizi wa Ukombozi", description: "Kuzaliwa na dhabihu ya Yesu msalabani (Historia), nguvu ya msalaba inayotuponya na kutubadilisha leo (Sasa), na msingi mkuu wa tumaini letu la uzima wa milele (Zijazo)." },
      { title: "Kipindi cha Kanisa na Neema ya Mungu kwa Mataifa", description: "Pentekoste na mateso ya kanisa la kwanza (Historia), hali ya kanisa la sasa na changamoto zake za kiroho (Sasa), na utimilifu wa kipindi cha mataifa (Zijazo)." },
      { title: "Ishara za Nyakati za Mwisho Katika Jamii na Ulimwengu", description: "Historia ya magonjwa, vita na njaa zilizopita (Historia), milipuko na mihemko ya kiroho/kijamii ya sasa (Sasa), na dhoruba zinazokaribia kumaliza ulimwengu (Zijazo)." },
      { title: "Unyakuo wa Kanisa (The Rapture) na Kujazwa kwa Watakatifu", description: "Mifano ya kinabii ya Henoko na Eliya (Historia), utayari wa kiroho na maisha ya utakatifu leo (Sasa), na tukio la ghafla la unyakuo ujao (Zijazo)." },
      { title: "Kipindi cha Dhiki Kuu na Tawala za Mpinga Kristo (Antichrist)", description: "Tawala dhalimu zilizotawala kikatili kale (Historia), maandalizi ya mfumo wa kielektroniki na utandawazi leo (Sasa), na mateso makuu ya siku zijazo (Zijazo)." },
      { title: "Kuja kwa Mara ya Pili kwa Kristo na Vita vya Har-Magedoni", description: "Ushindi wa kihistoria wa taifa la Israeli (Historia), migogoro na mihemko ya kisiasa ya sasa Mashariki ya Kati (Sasa), na kurudi kwa Yesu na jeshi lake la watakatifu (Zijazo)." },
      { title: "Ufalme wa Miaka Elfu Moja (The Millennial Reign)", description: "Maono ya kinabii ya amani ya kale ya paradiso (Historia), utawala wa Kristo mioyoni mwetu leo (Sasa), na utawala halisi wa amani duniani Kristo akitawala kimwili (Zijazo)." },
      { title: "Hukumu ya Kiti cha Enzi Cheupe (The Great White Throne)", description: "Gharika ya Nuhu na anguko la Sodoma kama hukumu za kale (Historia), wito wa toba leo (Sasa), na hukumu ya mwisho ya milele ya waovu wote (Zijazo)." },
      { title: "Mbingu Mpya, Nchi Mpya, na Paradiso Iliyorejeshwa", description: "Bustani ya Edeni ya kale iliyopotea (Historia), kilio na mauguzi ya uumbaji wetu wa sasa unaosubiri ukombozi (Sasa), na makazi mapya ya milele yasiyo na machozi au mauti (Zijazo)." }
    ];
  }

  if (norm.includes("biblia") || norm.includes("soma biblia")) {
    return [
      { title: "Nguvu ya Neno la Mungu Katika Maombi", description: "Jinsi ya kujenga hoja mbele za Mungu kwa kurudisha maneno Yake mwenewe." },
      { title: "Mistari ya Kupigania na Kusimamia Kuhusu Ulinzi", description: "Zaburi 91, Zaburi 23 na mistari mingine inayofukuza maroho ya hofu." },
      { title: "Mistari ya Hakika Katika Kushinda Hofu na Wasiwasi", description: "Isaya 41:10, Wafilipi 4:6-7 na jinsi ya kupokea amani kamili mioyoni." },
      { title: "Mistari ya Uponyaji wa Magonjwa na Afya", description: "Kutoka 15:26, 1 Petro 2:24 na kuelekeza imani yako kote kupokea uponyaji." },
      { title: "Mistari ya Kufanikiwa Kiuchumi na Biashara", description: "Kumbukumbu 28:1-14, Zaburi 1:1-3 na kuombea kazi za mikono yako nchini." },
      { title: "Mistari ya Kuombea Familia, Watoto na Nyumba", description: "Joshua 24:15, Isaya 54:13 na kuweka ulinzi wa damu juu ya nyumba yenu." }
    ];
  }

  if (norm.includes("mindfulness of god") || norm.includes("mindfulness")) {
    return [
      { title: "Somo la 1: Utangulizi wa Mindfulness of God (Utambuzi wa Kiroho wa Mungu)", description: "Kuelewa dhana ya mindfulness katika mtazamo wa kiroho na jinsi ya kuweka akili na nafsi yako mbele za Mungu wakati wote." },
      { title: "Somo la 2: Utulivu wa Akili na Fikra Mbele za Mungu (Christian Mindfulness)", description: "Mbinu za kutuliza mawazo yanayotawanyika na kuelekeza fikra zako zote kwenye ukuu na wema wa Mungu." },
      { title: "Somo la 3: Kuishi Katika Wakati Uliopo (The Power of the Present Moment in God)", description: "Acha mahangaiko ya jana na hofu ya kesho; jifunze kukutana na Mungu katika wakati huu wa sasa (Here and Now)." },
      { title: "Somo la 4: Utambuzi wa Pumzi na Uhai Kama Zawadi ya Mungu", description: "Jinsi ya kutumia kila pumzi unayovuta kama ukumbusho wa uwepo, neema na nguvu za Mungu ndani yako." },
      { title: "Somo la 5: Sala za Utulivu na Kutafakari Neno (Contemplative Prayer & Lectio Divina)", description: "Sanaa ya kusoma na kutafakari Biblia kwa utulivu mkubwa ili kuruhusu Neno la Mungu liingie na kubadilisha mtima wako." },
      { title: "Somo la 6: Kuondoa Kelele na Sauti za Nje (Silence and Solitude)", description: "Umuhimu wa kutafuta muda wa ukimya peke yako ili kuisikia sauti ya Mungu ya upole na yenye amani." },
      { title: "Somo la 7: Utambuzi wa Hisia na Mihemko Chini ya Mamlaka ya Mungu", description: "Jinsi ya kuzitambua hisia zako bila kuhukumu, na kuzikabidhi kwa Mungu ili kupata amani ipitayo fahamu zote." },
      { title: "Somo la 8: Kuwa na Shukrani ya Kila Mara (Mindful Gratitude)", description: "Kutengeneza tabia ya kuona na kushukuru kwa wema wa Mungu katika mambo madogo na makubwa ya kila siku." },
      { title: "Somo la 9: Mindfulness katika Kazi, Maamuzi na Shughuli za Kila Siku", description: "Kutenda kila kazi na kufanya maamuzi kwa umakini wa hali ya juu na kwa ajili ya utukufu wa Mungu." },
      { title: "Somo la 10: Kudhibiti Msongo wa Mawazo (Stress) Kupitia Amani ya Mungu", description: "Jinsi utambuzi wa Mungu unavyolinda afya yako ya akili na kukuondolea wasiwasi wa maisha." },
      { title: "Somo la 11: Kujenga Uhusiano wa Kina na Jamii Kupitia Upendo wa Mungu", description: "Kutumia umakini wa kiroho kusikiliza, kuelewa, na kuonyesha upendo na huruma ya dhati kwa watu waliokuzunguka." },
      { title: "Somo la 12: Kuishi Maisha Yasiyo na Mipaka katika Uwepo na Utambuzi wa Mungu", description: "Mpango kazi wa kudumisha Mindfulness of God kama mtindo wa maisha endelevu na wenye matunda tele." }
    ];
  }

  if (norm.includes("kinabii") || norm.includes("viwango vya kinabii") || norm.includes("kutamka neno") || norm.includes("kuona kiroho")) {
    return [
      { title: "Somo la 1: Utangulizi wa Viwango vya Kinabii na Asili ya Mamlaka ya Mkristo (Waefeso 1:17-23, Luka 10:19)", description: "Kuelewa nafasi ya mkristo katika ulimwengu wa roho, asili ya mamlaka ya ki-Mungu, na wito wa kila mwamini kutembea katika vipimo vya kinabii." },
      { title: "Somo la 2: Kutamka Neno Likawa – Nguvu ya Neno la Kinywa na Imani (Ayubu 22:28, Marko 11:22-24, Mithali 18:21)", description: "Kanuni za kibiblia za kuachilia amri za kinabii (prophetic decrees), kuumba mambo yasiyokuwepo kana kwamba yapo (Warumi 4:17), na kuondoa milima." },
      { title: "Somo la 3: Kufunguliwa Macho ya Kiroho na Kuona Ulimwengu wa Roho (2 Wafalme 6:15-17, Waefeso 1:18)", description: "Jinsi macho ya moyo yanavyotiwa nuru; kuelewa viwango vya ufunuo wa kinabii (maono, ndoto, na mwangaza wa kiroho) na kupambanua roho (1 Wakorintho 12:10)." },
      { title: "Somo la 4: Kuisikia Sauti ya Mungu na Kutofautisha Sauti Tatu (1 Samweli 3:1-10, Yohana 10:27)", description: "Mbinu za kibiblia za kusikia sauti ya Mungu kwa uwazi, kuitambua, na kuitofautisha na sauti ya nafsi au sauti ya adui shetani." },
      { title: "Somo la 5: Karama za Roho Mtakatifu Katika Utendaji wa Kinabii (1 Wakorintho 12:4-11)", description: "Uchambuzi wa kina wa Neno la Hekima, Neno la Maarifa, Karama ya Imani, Unabii, na Kupambanua Roho katika maisha ya kila siku." },
      { title: "Somo la 6: Huduma ya Uponyaji – Misingi ya Kibiblia na Mamlaka ya Kristo (Isaya 53:4-5, 1 Petro 2:24, Mathayo 10:1)", description: "Kuelewa agano la uponyaji wa ki-Mungu, jinsi Yesu alivyobeba magonjwa yetu, na haki ya mkristo kuishi na kuhudumu katika afya ya ki-Mungu." },
      { title: "Somo la 7: Hatua kwa Hatua: Jinsi ya Kuombea Mgonjwa na Kuamuru Uponyaji (Marko 16:17-18, Yakobo 5:14-16, Matendo 3:1-9)", description: "Mwongozo wa vitendo wa kuweka mikono juu ya wagonjwa, kuomba sala ya imani, kuamuru magonjwa kuondoka, na kuachilia uzima wa Kristo." },
      { title: "Somo la 8: Nguvu ya Jina la Yesu na Upako wa Damu ya Yesu (Wafilipi 2:9-11, Ufunuo 12:11)", description: "Jinsi ya kutumia Jina la Yesu lenye mamlaka yote mbinguni na duniani kuvunja ngome za adui na kuponya walioteswa na ibilisi (Matendo 10:38)." },
      { title: "Somo la 9: Kufunga, Kuomba na Kulinda Utakatifu wa Chombo (Mathayo 17:20-21, 2 Timotheo 2:20-22, Isaya 58:6-9)", description: "Siri ya maisha ya kufunga na kuomba ili kuongeza usikivu wa kiroho, kuvunja nguvu za giza, na kutunza chombo safi kwa ajili ya utukufu wa Bwana." },
      { title: "Somo la 10: Kukabiliana na Mashaka, Hofu na Vipingamizi Katika Huduma ya Kinabii (Yakobo 1:6-8, 2 Timotheo 1:7)", description: "Mbinu za kushinda mashambulizi ya kifikra, mashaka, na kukatishwa tamaa wakati wa kufanya maombezi na kutamka neno." },
      { title: "Somo la 11: Tabia, Unyenyekevu na Uadilifu wa Mtumishi wa Kinabii (Hesabu 12:3, Wagalatia 5:22-23)", description: "Umuhimu wa kuwa na matunda ya Roho, unyenyekevu usio na majivuno, na kutumia karama za Mungu kwa ajili ya kuwajenga wengine na kumtukuza Mungu pekee." },
      { title: "Somo la 12: Hitimisho na Mpango Kazi wa Kuishi Maisha ya Ushindi na Upako Endelevu (Matendo 1:8, Zaburi 92:10)", description: "Mwongozo kamili wa kudumisha moto wa kiroho, upako mpya wa kila siku, na kuendelea kuwa chombo cha miujiza, unabii, na uponyaji katika jamii." }
    ];
  }

  if (norm.includes("kufunga na kufungua") || norm.includes("kufunga na kufungua jambo")) {
    return [
      { title: "Somo la 1: Siri ya Mamlaka na Funguo za Ufalme wa Mbinguni (Mathayo 16:19)", description: "Kuelewa mamlaka ya kisheria ya kiroho aliyopewa kila mwamini kupitia funguo za ufalme wa mbinguni." },
      { title: "Somo la 2: Maana Halisi ya Kufunga na Kufungua katika Ulimwengu wa Roho", description: "Uchambuzi wa kina wa jinsi ulimwengu wa roho unavyoathiri ulimwengu wa mwili kupitia kanuni ya kufunga na kufungua (Mathayo 18:18)." },
      { title: "Somo la 3: Mahakama za Kiroho na Kanuni za Kisheria Kabla ya Kufunga au Kufungua Jambo", description: "Jinsi ya kusimama kisheria mbele ya madhabahu ya Mungu, kutubu na kuondoa mashtaka ya adui (Zekaria 3:1-4, Wakolosai 2:14-15)." },
      { title: "Somo la 4: Jinsi ya Kufunga Nguvu za Giza, Vifungo vya Ukoo na Laana", description: "Mbinu za vitendo za kibiblia za kufunga roho za uharibifu, mikataba ya kigiza, na vifungo vya kifamilia kwa Jina la Yesu (Isaya 54:17)." },
      { title: "Somo la 5: Jinsi ya Kufungua Baraka, Neema, Afya na Milango ya Mafanikio", description: "Kanuni za ki-Mungu za kuachilia amri za kifalme kufungua milango iliyofungwa ya ajira, ndoa, kibali na afya njema (Ufunuo 3:7-8)." },
      { title: "Somo la 6: Nguvu ya Makubaliano katika Kufunga na Kufungua (Mathayo 18:19-20)", description: "Uwezo wa maombi ya makubaliano katika ngazi ya wanandoa, familia, na kanisa katika kuleta matokeo ya haraka na ya kudumu." },
      { title: "Somo la 7: Matumizi ya Jina la Yesu na Damu ya Yesu kama Silaha Kuu", description: "Kutumia mamlaka ya Jina lipitalo majina yote na nguvu ya ushindi ya Damu ya Yesu katika kuvunja kila upinzani (Wafilipi 2:9-11, Ufunuo 12:11)." },
      { title: "Somo la 8: Kutamka Neno la Mamlaka na Amri za Kifalme za Kinabii (Ayubu 22:28)", description: "Sanaa ya kutamka maamuzi ya kinabii (prophetic decrees) kwa kinywa chako ili kubadilisha mazingira na hali ngumu maishani." },
      { title: "Somo la 9: Kufunga na Kufungua Mambo Katika Ndoa, Familia na Watoto", description: "Mwongozo wa kulinda ndoa, kuvunja roho za kutengana, kufungua amani ya nyumba, na kulinda mustakabali wa watoto." },
      { title: "Somo la 10: Kufunga Umasikini na Kufungua Mzunguko wa Uchumi na Biashara", description: "Hatua za kiroho za kukataa roho ya umaskini na kufungua mifereji ya fedha, biashara, na uwekezaji kulingana na Kumbukumbu la Torati 8:18." },
      { title: "Somo la 11: Matokeo Halisi ya Kufunga na Kufungua na Namna ya Kuyatunza", description: "Kuelewa alama za wazi za majibu ya maombi na jinsi ya kulinda ushindi usipokonywe na adui (Luka 11:24-26)." },
      { title: "Somo la 12: Mitego ya Kuepuka na Siri za Kuishi katika Ushindi wa Kudumu", description: "Kujilinda dhidi ya kiburi, mashaka, na kurudi nyuma; kujenga mtindo thabiti wa maisha ya mamlaka ya kiroho chini ya Mwalimu Joseph Marwa Kyama." }
    ];
  }

  if (norm.includes("ibada ya kikristo") || (norm.includes("ibada") && norm.includes("kikristo"))) {
    return [
      { title: "Somo la 1: Asili, Maana na Msingi wa Ibada ya Kikristo (Yohana 4:23-24)", description: "Kuelewa ibada ya kweli katika Roho na Kweli na jinsi Mungu anavyotafuta waabuduo wa jinsi hiyo." },
      { title: "Somo la 2: Tofauti Kati ya Kusifu, Kuabudu na Kutoa Shukrani", description: "Uchambuzi wa ngazi tatu za kumwendea Mungu: Shukrani malangoni, Sifa nyuani, na Ibada patakatifu pa patakatifu (Zaburi 100:4)." },
      { title: "Somo la 3: Ibada ya Moyo na Maisha Matakatifu kama Dhabihu Hai (Warumi 12:1-2)", description: "Jinsi maisha yako ya kila siku, maadili, na fikra zako zinavyokuwa ibada halisi yenye kumpendeza Mungu." },
      { title: "Somo la 4: Nguvu ya Damu ya Yesu na Njia ya Kuingia Patakatifu pa Patakatifu (Waebrania 10:19-22)", description: "Kuelewa ujasiri tulio nao kupitia Damu ya Yesu kukaribia kiti cha rehema bila hofu wala hukumu." },
      { title: "Somo la 5: Wajibu na Kazi ya Roho Mtakatifu Katika Ibada ya Kweli", description: "Jinsi Roho Mtakatifu anavyotusaidia kuomba, kutuelekeza kuabudu, na kuachilia uwepo mtamu wa Mungu (Warumi 8:26-27)." },
      { title: "Somo la 6: Ibada Binafsi ya Siri Chumbani na Nguvu Yake (Mathayo 6:6)", description: "Siri ya nguvu ya chumba cha siri (secret place), kuomba na kuabudu faraghani ambapo Baba aonaye sirini hukujazi kwa dhahiri." },
      { title: "Somo la 7: Madhabahu ya Ibada ya Familia na Nguvu ya Maombi ya Pamoja", description: "Jinsi ya kuanzisha na kudumisha madhabahu ya familia nyumbani kwa ajili ya ulinzi, upendo na mshikamano (Yoshua 24:15)." },
      { title: "Somo la 8: Muziki, Nyimbo za Sifa na Uimbaji Wenye Upako Madhabahuni", description: "Nguvu ya kiroho ya muziki wa kumpendeza Mungu katika kuangusha kuta na kufukuza roho chafu (1 Samweli 16:23, Matendo 16:25-26)." },
      { title: "Somo la 9: Utoaji, Zaka na Sadaka kama Sehemu Muhimu ya Ibada ya Kikristo", description: "Kuelewa uhusiano wa moyo wa ibada na utoaji wa furaha usio wa manung'uniko (2 Wakorintho 9:6-8, Malaki 3:10)." },
      { title: "Somo la 10: Ishara na Matunda ya Ibada Iliyokubaliwa Mbele za Mungu", description: "Kutambua matokeo ya ibada ya kweli: amani ya ndani, utakaso, usikivu wa sauti ya Mungu na mabadiliko ya tabia (Isaya 6:1-8)." },
      { title: "Somo la 11: Vipingamizi na Mitego Inayoharibu na Kuzima Moto wa Ibada", description: "Kutambua na kuepuka mazoea, unafiki, uchovu wa kiroho, na mambo yanayozima utayari wa kuabudu (Mathayo 15:8-9)." },
      { title: "Somo la 12: Kujenga Mtindo wa Maisha wa Kuabudu Bila Kukoma (1 Wathesalonike 5:16-18)", description: "Mwongozo kamili wa kuishi katika mazingira ya ibada popote ulipo: kazini, safarini, nyumbani na kwenye jamii." }
    ];
  }

  if (norm.includes("kusafisha nyota") || norm.includes("nyota yako")) {
    return [
      { title: "Somo la 1: Siri ya Nyota ya Mwanadamu Katika Biblia na Ufalme wa Mungu (Mathayo 2:1-2, Danieli 12:3)", description: "Ufafanuzi wa kibiblia kuhusu nyota kama alama ya uzima, utukufu, kusudi na wito maalum alioitiwa kila mwanadamu." },
      { title: "Somo la 2: Nyota kama Alama ya Hatima, Utukufu, Karama na Wito Wako Duniani", description: "Kuelewa jinsi kila mtu anavyobeba mng'ao wa pekee wa ki-Mungu (1 Wakorintho 15:41) na kwa nini adui huiwinda tangu utotoni." },
      { title: "Somo la 3: Jinsi Nyota Inavyoweza Kufunikwa na Giza, Vumbi au Vifungo vya Kiroho", description: "Uchambuzi wa dalili za nyota iliyofunikwa: kukataliwa bila sababu, kusahaulika, kushindwa kufikia hatima, na kukwama kimaisha." },
      { title: "Somo la 4: Vyanzo vya Kuchafuka kwa Nyota: Dhambi, Maagano ya Kale na Uchawi", description: "Kugundua milango inayoruhusu giza kugusa hatima ya mtu (Isaya 59:1-2) na jinsi ya kuifunga milele kwa toba." },
      { title: "Somo la 5: Nguvu ya Toba ya Kweli na Damu ya Yesu Katika Kusafisha Nyota Yako (1 Yohana 1:7-9)", description: "Hatua za kina za utakaso kupitia Damu ya Yesu inayotakasa dhamiri na kuondoa kila doa na giza kwenye hatima yako." },
      { title: "Somo la 6: Kuamuru Giza Kuondoka na Nuru ya Kristo Kung'aa (Isaya 60:1-3)", description: "Kutamka amri za kibiblia za: Ondoka, uangaze; kwa kuwa nuru yako imekuja, na utukufu wa Bwana umekuzukia." },
      { title: "Somo la 7: Kuvunja Vifuniko vya Kiroho na Wingu la Kukataliwa au Kukwama", description: "Maombi ya kuvunja utando wa giza, roho ya kucheleweshwa, na kuondoa vazi la aibu mbele ya watu (Isaya 25:7)." },
      { title: "Somo la 8: Maombi Maalum ya Kinabii ya Kurejesha Mng'ao na Utukufu wa Nyota Yako", description: "Mfululizo wa maombi ya vitendo na mafundisho ya kusimama kwenye neno kurejesha miaka iliyoliwa na nzige (Yoeli 2:25-26)." },
      { title: "Somo la 9: Kufungua Nyota ya Biashara, Kazi, Ndoa na Uchumi Wako", description: "Kuelekeza mng'ao wa kiroho kwenye shughuli zako za mikono ili kupata kibali, wateja, fursa mpya na mafanikio nchini." },
      { title: "Somo la 10: Nguvu ya Neno la Mungu, Sadaka na Maisha ya Utakatifu katika Kulinda Nyota", description: "Kanuni za kutunza mafuta na mwangaza wako usizime kwa kuishi maisha safi na kuendelea kutoa dhabihu za shukrani." },
      { title: "Somo la 11: Alama za Nyota Iliyofunguliwa na Inayong'aa Kiroho na Kimwili", description: "Kutambua matunda ya nyota inayong'aa: kibali cha ajabu, furaha, mvuto chanya wa kijamii, na ushuhuda wa wazi wa ki-Mungu." },
      { title: "Somo la 12: Kanuni za Kudumu za Kuilinda Nyota Yako Isichafuke Tena Milele", description: "Hitimisho na kanuni za kutembea katika Kristo kama Nuru ya ulimwengu (Yohana 8:12) chini ya mwongozo wa Giniaz College." }
    ];
  }

  const prefix = courseTitle;
  return [
    { title: `Utangulizi wa ${prefix}`, description: `Misingi ya jumla na fani inayojadiliwa katika kuanza kozi ya ${prefix}.` },
    { title: `Dhana ya Msingi katika ${prefix}`, description: `Mambo ya awali kuelewa asili, mbinu na faida za ${prefix}.` },
    { title: `Utafiti na Mchakato wa ${prefix}`, description: `Mwongozo thabiti vya kiufundi kuelekea kubobea katika ${prefix}.` },
    { title: `Changamoto za Kawaida katika ${prefix}`, description: `Kutatua matatizo makubwa ambayo kila mtu anakutana nayo kwenye ${prefix}.` },
    { title: `Zana na Miundombinu ya ${prefix}`, description: `Mifumo ipi au softwares zipi unapaswa kuzitumia ili kufanikisha ${prefix}.` },
    { title: `Mifano ya Kiutendaji katika ${prefix}`, description: `Uchambuzi wa kesi halisi (case studies) nchini Tanzania kuhusiana na ${prefix}.` },
    { title: `Kuboresha Ufanisi wa ${prefix}`, description: `Njia rahisi lakini zenye nguvu katika kuongeza tija kulingana na misingi ya ${prefix}.` },
    { title: `Usimamizi wa Hatari kwenye ${prefix}`, description: `Kujilinda dhidi ya makosa ya kawaida katika ${prefix}.` },
    { title: `Mbinu za Kitaalamu za ${prefix}`, description: `Siri za mabingwa wanaopata mafanikio makubwa kupitia ${prefix}.` },
    { title: `Ukuaji na Maendeleo Kupitia ${prefix}`, description: `Mbinu za kuongeza kiwango vya ufanisi wa ${prefix} kila siku.` },
    { title: `Nidhamu na Uthabiti wa Kiutekelezaji`, description: `Kuhakikisha unadumisha uendeshaji bora bila kurudi nyuma katika ${prefix}.` },
    { title: `Kuhitimu na Mapendekezo ya Kiutendaji`, description: `Hitimisho la kozi ya ${prefix} likijazwa na ushauri wa mwisho wa Mwalimu wako.` }
  ];
}


export const generateCourseOutline = async (courseTitle: string): Promise<{title: string, description: string}[]> => {
  const norm = courseTitle.toLowerCase();
  if (norm.includes("eskatolojia") || norm.includes("prophecy")) {
    return [
      { title: "Uumbaji na Mpango wa Milele wa Wokovu wa Mungu", description: "Uchambuzi wa mwanzo katika bustani ya Edeni (Historia), vita vya urejesho leo (Sasa), na picha ya utukufu ujao wa mbingu restored (Zijazo)." },
      { title: "Agano la Mungu na Vipindi vya Kinabii (Dispensations)", description: "Kuelewa agano la kale na usimamizi wake (Historia), kuishi chini ya agano jipya la neema (Sasa), na kuelekea utimilifu kamili vya ahadi za Mungu (Zijazo)." },
      { title: "Kuinuka na Kuanguka kwa Falme za Dunia: Unabii wa Danieli", description: "Tathmini ya falme nne za kale zilizopita (Historia), muundo tete wa mataifa na siasa za leo (Sasa), na uanzishwaji wa Ufalme wa Mungu usiotikisika (Zijazo)." },
      { title: "Kuja kwa Kwanza kwa Kristo na Utangulizi wa Ukombozi", description: "Kuzaliwa na dhabihu ya Yesu msalabani (Historia), nguvu ya msalaba inayotuponya na kutubadilisha leo (Sasa), na msingi mkuu wa tumaini letu la uzima wa milele (Zijazo)." },
      { title: "Kipindi cha Kanisa na Neema ya Mungu kwa Mataifa", description: "Pentekoste na mateso ya kanisa la kwanza (Historia), hali ya kanisa la sasa na changamoto zake za kiroho (Sasa), na utimilifu vya kipindi cha mataifa (Zijazo)." },
      { title: "Ishara za Nyakati za Mwisho Katika Jamii na Ulimwengu", description: "Historia ya magonjwa, vita na njaa zilizopita (Historia), milipuko na mihemko ya kiroho/kijamii ya sasa (Sasa), na dhoruba zinazokaribia kumaliza ulimwengu (Zijazo)." },
      { title: "Unyakuo wa Kanisa (The Rapture) na Kujazwa kwa Watakatifu", description: "Mifano ya kinabii ya Henoko na Eliya (Historia), utayari wa kiroho na maisha ya utakatifu leo (Sasa), na tukio la ghafla la unyakuo ujao (Zijazo)." },
      { title: "Kipindi cha Dhiki Kuu na Tawala za Mpinga Kristo (Antichrist)", description: "Tawala dhalimu zilizotawala kikatili kale (Historia), maandalizi ya mfumo wa kielektroniki na utandawazi leo (Sasa), na mateso makuu ya siku zijazo (Zijazo)." },
      { title: "Kuja kwa Mara ya Pili kwa Kristo na Vita vya Har-Magedoni", description: "Ushindi wa kihistoria wa taifa la Israeli (Historia), migogoro na mihemko ya kisiasa ya sasa Mashariki ya Kati (Sasa), na kurudi kwa Yesu na jeshi lake la watakatifu (Zijazo)." },
      { title: "Ufalme wa Miaka Elfu Moja (The Millennial Reign)", description: "Maono ya kinabii ya amani ya kale ya paradiso (Historia), utawala wa Kristo mioyoni mwetu leo (Sasa), na utawala halisi wa amani duniani Kristo akitawala kimwili (Zijazo)." },
      { title: "Hukumu ya Kiti cha Enzi Cheupe (The Great White Throne)", description: "Gharika ya Nuhu na anguko la Sodoma kama hukumu za kale (Historia), wito wa toba leo (Sasa), na hukumu ya mwisho ya milele ya waovu wote (Zijazo)." },
      { title: "Mbingu Mpya, Nchi Mpya, na Paradiso Iliyorejeshwa", description: "Bustani ya Edeni ya kale iliyopotea (Historia), kilio na mauguzi ya uumbaji wetu wa sasa unaosubiri ukombozi (Sasa), na makazi mapya ya milele yasiyo na machozi au mauti (Zijazo)." }
    ];
  }

  const cacheKey = `outline_${courseTitle}`;
  const cached = await getLesson(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached.content);
    } catch {
      // If cached is corrupted, proceed to fetch
    }
  }

  try {
    const response = await fetch("/api/gemini/outline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseTitle }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate outline: Status ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON/HTML page which is typical of proxy restarts");
    }

    const outline = await response.json();
    if (Array.isArray(outline) && outline.length > 0) {
      await saveLesson(cacheKey, JSON.stringify(outline));
      return outline;
    }
    
    throw new Error("Invalid outline details received");
  } catch (error) {
    console.warn("[PWA Client] Fetching from server outline API failed. Activating dynamic client-side course outline generator for:", courseTitle, error);
    // Instant dynamic Swahili client-side fallback to avoid blank screens blockages
    const fallbackOutline = getFallbackCourseOutlineClient(courseTitle);
    await saveLesson(cacheKey, JSON.stringify(fallbackOutline));
    return fallbackOutline;
  }
};

export const generateLessonContentStream = async (
  courseTitle: string, 
  lessonTitle: string, 
  onChunk: (chunk: string) => void,
  maxRetries = 3
): Promise<string> => {
  const cacheKey = `lesson_${courseTitle}_${lessonTitle}`;
  const cached = await getLesson(cacheKey);
  if (cached) {
    onChunk(cached.content);
    return cached.content;
  }

  // Robust instant offline detection to avoid calling network and throwing Failed to Fetch errors
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn(`[Offline Mode] Activating instant Swahili client-side lesson generator for: ${lessonTitle}`);
    const localContent = generateUrgentFallbackContentClient(courseTitle, lessonTitle);
    
    // Simulate streaming for smooth UI transition
    let simulatedText = "";
    let idx = 0;
    const stepSize = Math.max(150, Math.ceil(localContent.length / 100));
    return new Promise((resolve) => {
      const simInterval = setInterval(async () => {
        if (idx >= localContent.length) {
          clearInterval(simInterval);
          await saveLesson(cacheKey, localContent);
          resolve(localContent);
          return;
        }
        simulatedText += localContent.substring(idx, idx + stepSize);
        idx += stepSize;
        onChunk(simulatedText);
      }, 10);
    });
  }

  const fetchWithRetry = (attempt: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      let fullText = "";
      let isAborted = false;
      let timeoutId: any = null;

      // Overall timeout for a single attempt (e.g., 5 minutes for long lessons)
      const MAX_ATTEMPT_TIME = 300000; 

      const eventSource = new EventSource(`/api/gemini/lesson-stream-v2?courseTitle=${encodeURIComponent(courseTitle)}&lessonTitle=${encodeURIComponent(lessonTitle)}`);

      const cleanup = () => {
        isAborted = true;
        eventSource.close();
        if (timeoutId) clearTimeout(timeoutId);
      };

      timeoutId = setTimeout(() => {
        if (!isAborted) {
          console.warn(`Attempt ${attempt} for ${lessonTitle} timed out.`);
          cleanup();
          retryOrReject(new Error("Muda wa kusubiri umeisha. Tafadhali jaribu tena."));
        }
      }, MAX_ATTEMPT_TIME);

      const retryOrReject = (err: Error) => {
        if (attempt < maxRetries) {
          console.log(`Retrying lesson ${lessonTitle} (attempt ${attempt + 1}/${maxRetries}) due to: ${err.message}`);
          setTimeout(() => {
            resolve(fetchWithRetry(attempt + 1));
          }, 2000 * attempt);
        } else {
          reject(err);
        }
      };

      eventSource.onmessage = async (event) => {
        if (isAborted) return;
        
        if (event.data === "[DONE]") {
          cleanup();
          const cleanedText = cleanExtraneousLessonContent(fullText);
          await saveLesson(cacheKey, cleanedText);
          resolve(cleanedText);
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            cleanup();
            retryOrReject(new Error(data.error));
            return;
          }
          if (data.text) {
            fullText += data.text;
            onChunk(fullText);
          }
        } catch (e) {
          // Heartbeats or other non-JSON data might end up here, ignore them
        }
      };

      eventSource.onerror = async (error) => {
        if (isAborted) return;
        console.warn(`EventSource attempt ${attempt} failed:`, error);
        cleanup();
        
        // Fall back to a standard non-streaming HTTP fetch to bypass proxy/SSE buffering issues
        try {
          console.log(`Attempting standard non-streamed HTTP fetch fallback for: ${lessonTitle}`);
          const res = await fetch(`/api/gemini/lesson-stream-v2?courseTitle=${encodeURIComponent(courseTitle)}&lessonTitle=${encodeURIComponent(lessonTitle)}&stream=false`);
          if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
          }
          const data = await res.json();
          if (data && data.text) {
            const fullTextContent = data.text;
            // Simulate streaming for smooth typewriter animation on UI
            let simulatedText = "";
            let idx = 0;
            const stepSize = Math.max(150, Math.ceil(fullTextContent.length / 100));
            const simInterval = setInterval(async () => {
              if (idx >= fullTextContent.length) {
                clearInterval(simInterval);
                const cleanedText = cleanExtraneousLessonContent(fullTextContent);
                await saveLesson(cacheKey, cleanedText);
                resolve(cleanedText);
                return;
              }
              simulatedText += fullTextContent.substring(idx, idx + stepSize);
              idx += stepSize;
              onChunk(simulatedText);
            }, 10);
          } else {
            throw new Error("No text content returned");
          }
        } catch (fetchErr: any) {
          console.warn("HTTP fallback fetch failed:", fetchErr);
          
          const isNetworkError = fetchErr && (
            fetchErr.message?.includes("Failed to fetch") || 
            fetchErr.message?.includes("network") ||
            fetchErr.name === "TypeError"
          );

          if (attempt < maxRetries && !isNetworkError) {
            console.log(`Retrying lesson ${lessonTitle} (attempt ${attempt + 1}/${maxRetries}) due to fetch error.`);
            setTimeout(() => {
              resolve(fetchWithRetry(attempt + 1));
            }, 2000 * attempt);
          } else {
            // ULTIMATE CLIENT-SIDE FALLBACK: Generate beautiful content instantly on the client side!
            console.log(`Activating ultimate client-side Swahili lesson content generator for: ${lessonTitle}`);
            const localContent = generateUrgentFallbackContentClient(courseTitle, lessonTitle);
            
            // Simulate streaming for smooth UI transition
            let simulatedText = "";
            let idx = 0;
            const stepSize = Math.max(150, Math.ceil(localContent.length / 100));
            const simInterval = setInterval(async () => {
              if (idx >= localContent.length) {
                clearInterval(simInterval);
                await saveLesson(cacheKey, localContent);
                resolve(localContent);
                return;
              }
              simulatedText += localContent.substring(idx, idx + stepSize);
              idx += stepSize;
              onChunk(simulatedText);
            }, 10);
          }
        }
      };
    });
  };

  return fetchWithRetry(1);
};

export function generateUrgentFallbackContentClient(courseTitle: string, lessonTitle: string): string {
  const lt = lessonTitle.toLowerCase();
  const ct = courseTitle.toLowerCase();
  
  // Broad course categories
  let category = "Mafunzo ya Maisha na Nidhamu";
  let field = "maendeleo ya kiutu";
  let focus = "kupunguza makosa na kujiimarisha";

  if (ct.includes("biashara") || ct.includes("mjasiriamali") || ct.includes("fedha") || ct.includes("uwekezaji") || ct.includes("product") || ct.includes("wealth") || ct.includes("cashflow") || ct.includes("mauzo") || ct.includes("mshahara") || ct.includes("pesa")) {
    category = "Uchumi na Ujasiriamali Binafsi";
    field = "kuongeza mzunguko wa fedha na kujenga mtaji";
    focus = "nidhamu ya pesa na kusanifu fursa sokoni";
  } else if (ct.includes("injili") || ct.includes("biblia") || ct.includes("eskatolojia") || ct.includes("ibada") || ct.includes("sabato") || ct.includes("kiroho") || ct.includes("mungu")) {
    category = "Hekima ya Kiroho na Neno la Mungu";
    field = "ulinzi wa kiroho na kusimamia mistari ya Biblia";
    focus = "uaminifu na malezi kulingana na maadili ya kiungu";
  } else if (ct.includes("usimamizi") || ct.includes("uongozi") || ct.includes("leadership") || ct.includes("project") || ct.includes("people") || ct.includes("employee") || ct.includes("competent") || ct.includes("hodari")) {
    category = "Usimamizi na Uongozi wa Kimkakati";
    field = "kujenga mifumo imara ya kiutendaji na kusimamia timu";
    focus = "huduma bora kwa wateja, kupanga malengo, na kupunguza upotevu";
  } else if (ct.includes("it") || ct.includes("hacker") || ct.includes("ai") || ct.includes("akili bandia") || ct.includes("technology") || ct.includes("creator") || ct.includes("app") || ct.includes("api") || ct.includes("economy")) {
    category = "Teknolojia na Akili Bandia (AI)";
    field = "uundaji wa programu na matumizi ya mifumo ya kidijitali";
    focus = "ulinzi wa kidijitali, kupata viungo vya maudhui, na kutumia AI";
  } else if (ct.includes("mke") || ct.includes("mume") || ct.includes("mwanamke") || ct.includes("mwanaume") || ct.includes("familia") || ct.includes("social") || ct.includes("emotional") || ct.includes("hisia")) {
    category = "Uhusiano, Ndoa, na Malezi ya Familia";
    field = "saikolojia ya hisia kuanzia kiwango cha atomu";
    focus = "kuondoa unafiki na hasira, na kulinda usalama wa kihemko";
  }

  const instructorName = "Mwalimu Joseph Marwa Kyama";

  if (category === "Hekima ya Kiroho na Neno la Mungu") {
    return `Karibu katika somo la "${lessonTitle}".

SEHEMU YA KWANZA: UTANGULIZI WA KINA KULINGANA NA BIBLIA TAKATIFU
    
Katika somo hili linalobadilisha maana ya maisha, "${lessonTitle}", msingi wetu mkuu unajengwa juu ya Biblia takatifu. Tunajivunia kusimama pekee juu ya misingi isiyorudi nyuma ya Neno la Mungu.

Hapa tunaanza tukiwa na mistari thabiti yenye tarakimu mfululizo tanzu mwanzo kabisa:

1. Zaburi 119:105 - "Neno lako ni taa ya miguu yangu, na mwanga wa njia yangu."
Mwanafunzi wangu mpendwa, mstari huu unatukumbusha kuwa katika somo hili la "${lessonTitle}", kila hatua yetu lazima iongozwe na nuru ya kimungu ili kuepuka giza la kidunia na kupata weledi halisi.

2. Yoshua 1:8 - "Kitabu hiki cha torati kisiondoke kinywani mwako, bali yatafakari maneno yake mchana na usiku..."
Mwalimu Joseph Marwa Kyama anasisitiza kuwa, kila mafanikio hapa chuoni yanategemea uwezo wa kusoma na kutafakari maandiko haya ili kupunguza dhambi na kuweka utakaso.

SEHEMU YA PILI: UFAFANUZI MKUU WA NADHARIA NA BIBLIA TAKATIFU

Katika nadharia yetu, asilimia hamsini ya somo lote ni neno la Mungu tanzu mwanzo. Hebu tushike mistari hii muhimu ya kidijitali:

3. Mithali 3:5-6 - "Mtumainie Bwana kwa moyo wako wote, wala usizitegemee akili zako mwenyewe..."
Tunajifunza hapa mwanafunzi wangu kwamba, hekima yoyote ya kibinadamu bila kumtegemea Muumba wetu haina tija yoyote kazini wala nyumbani.

4. Isaya 41:10 - "Usiogope, kwa maana mimi ni pamoja nawe; usifadhaike, kwa maana mimi ni Mungu wako..."
Ahadi hii inatupa ujasiri mkuu asubuhi ya leo wa kutopata hasira wala dharau pindi tunapokabiliwa na dhoruba za maisha katika kutekeleza somo letu la "${lessonTitle}".

SEHEMU YA TATU: HATUA KWA HATUA ZA VITENDO VYA KI-BIBLIA

Mwanafunzi wangu, hapa kuna mfululizo thabiti wa hatua za kivitendo zilizojengwa moja kwa moja juu ya Maandiko:

5. Mathayo 6:33 - "Bali utafuteni kwanza ufalme wake na haki yake, na hayo yote mtaongezewa."
Mchakato wa Kwanza: Tanguliza ibada thabiti katika kila hatua unayofanya. Huu ni msingi wa kuongeza mzunguko wa fedha na kuleta baraka.

6. Wafilipi 4:13 - "Nayaweza mambo yote katika yeye anitiaye nguvu."
Mchakato wa Pili: Ondoa mawazo hasi ya kwamba huwezi kubadilika. Kristo anakupa neema ya kuacha tabia mbaya na hasira.

7. Warumi 12:2 - "Wala msiifuatishe namna ya dunia hii, bali mgeuzwe kwa kufanywa upya nia zenu..."
Mchakato wa Tatu: Fanya utakaso asubuhi hii tulivu, badili mtazamo uwe wa kiungu ili kupata weledi katika kila doria ya kimaisha.

8. Kutoka 20:8 - "Ikumbuke siku ya Sabato uitakase."
Mchakato wa Nne: Heshimu amri za Mungu kuanzia asili kumlinda roho wako na kupokea tija kuu maishani.

SEHEMU YA NNE: MIFANO HALISI NA KESI ZA KI-MUNGU NCHINI TANZANIA

Hapa chini tunaona jinsi uaminifu wa kufuata Biblia ulivyookoa watu wetu:

9. Kumbukumbu la Torati 28:1-2 - "Itakuwa utakaposikia sauti ya Bwana, Mungu wako, kwa bidii, kuangalia kufanya maagizo yake yote..."
Mfano wa Kwanza: Ndugu mmoja hapa Dar es Salaam aliyekuwa anafanya biashara Kariakoo aliamua kufanyia kazi maelekezo ya somo la "${lessonTitle}" kwa kusimamia amri hizi. Aliondoa unafiki na kuanza kulipa zaka kwa uaminifu. Chapa yake ikatamalaki nchini kote, akabarikiwa sana nchi nzima.

10. Zaburi 1:1-3 - "Heri mtu yule asiyekwenda katika shauri la wasio haki..."
Mfano wa Pili: Kikundi cha kina mama huko Arusha kilichoanzisha mifumo ya akiba kilisimamia mstari huu wa Biblia mwanzo kabisa. Waliepuka lugha mbaya na dharau, nao wakapata tija kubwa na familia zao sasa zimejaa utulivu kamili.

SEHEMU YA TANO: CHANGAMOTO ZA KI-ROHO NA SULUHU ZA BIBLIA

Mistari ya Biblia inakupa suluhu thabiti dhidi ya kila changamoto:

11. 2 Timotheo 3:16-17 - "Kila andiko lenye pumzi ya Mungu lafaa kwa mafundisho, na kwa kuwaonya watu makosa yao..."
Suluhu ya Kwanza: Unapokabiliwa na uvigumu wa kiroho au ugumu wa maisha, chukua Biblia yako na usome; neno ndilo linaadibisha utu uzima wako uwe imara.

12. Waefeso 6:11 - "Vaeni silaha zote za Mungu, mpate kuweza kusimama dhidi ya hila za shetani."
Suluhu ya Pili: Dhidi ya vizuizi vyote vya unafiki au migogoro ya ndoa, suluhisho si hasira au kupigana bali ni kuvaa silaha za imani, upendo na roho thabiti.

SEHEMU YA SITA: USHAURI WA KITAALAMU WA KI-BIBLIA NA MBINU ZA JUU

Wataalamu wetu, wakiongozwa na kiongozi Joseph Marwa Kyama, wanashauri yafuatayo:

13. Mithali 4:23 - "Linda moyo wako kuliko yote uyalindayo; maana ndiko zinakotoka chemchemi za uzima."
Mbinu ya Kwanza: Linda milango ya fahamu yako dhidi ya kelele za ulimwengu asubuhi hii ili kudumisha amani iliyo kamilifu moyoni mwako.

14. Yakobo 1:22 - "Lakini iweni watendaji wa neno, wala si wasikiaji tu, mkijidanganya nafsi zenu."
Mbinu ya Pili: Usome tu dondoo hizi mwanafunzi wangu, kafanye majaribio ya vitendo vya uaminifu na utakaso kuanzia leo.

SEHEMU YA SABA: TAFAKARI KUU & KAZI YA NYUMBANI YA KI-BIBLIA

Wiki hii nzima, chukua nusu saa kila asubuhi na uandike mambo matano mazuri ya kiroho uliyoyatekeleza na yale uliyoweka mifumo thabiti ya ki-Mungu kujiimarisha. Tafakari kwa amani na upendo kuhusu njia zako zote, na dumu katika uaminifu kulingana na mafundisho thabiti ya Biblia takatifu.

Kauli mbiu ya chuo chetu ikiwa daima ni: "Giniaz College: Elimu ya Akili, Upendo na Busara Isiyo na Mipaka chini ya upendo mkuu wa Joseph Marwa Kyama!"`;
  }

  let text = `Karibu katika somo la "${lessonTitle}".

SEHEMU YA KWANZA: UTANGULIZI WA KINA

Siku ya leo tunakwenda kuchambua somo letu zuri sana linaloitwa "${lessonTitle}", likiwa ni sehemu ya mfululizo wa mafundisho ya kozi ya "${courseTitle}". Katika somo hili, nitakufunza hatua kwa hatua ili kukupa mwanga mkubwa utakaokuongoza katika maisha yako, iwe ni nyumbani au kazini.

Utafiti katika ulimwengu wa ${category} unaonyesha wazi kwamba mafanikio yanategemea sana uthibitishaji na kujiimarisha katika misingi ya ${field}. Chimbuko la somo hili nchini Tanzania na kote ulimwenguni linathibitisha kuwa wale wote wanaopuuzia nadharia hizi hukutana na hasara nyingi na msongo wa maisha, wakati wale wanaoweka mifumo thabiti (operational systems) hushamiri na kupata faida ya kuaminika.

Ni lazima uelewe kuwa elimu hii tunayoitoa hapa si uigizaji wa tabia au kutafuta sifa za muda mfupi. Ni lazima ujifunze kujitawala, kuweka vipaumbele vilivyo wazi, na kusoma kila asubuhi ili kukuongezea weledi wa kiutendaji na kuondokana na utegemezi wowote ule.

SEHEMU YA PILI: UFAFANUZI MKUU WA NADHARIA & KANUNI

Katika chuo chetu, tunasisitiza kuwa hakuna jambo linalotokea kwa bahati mbaya. Kila uamuzi na matokeo kimaisha inaongozwa na misingi thabiti iliyofanyiwa utafiti wa kina.

Dhana ya kwanza kabisa ni nadharia ya asili ya mnyororo wa tija. Nadharia hii ya kupendeza inatufundisha kuwa kila sekunde ya siku yako lazima iunganishwe na malengo yako ya baadae ya kimaendeleo. Inapotokea uamuzi mdogo kimaisha kama kuweka akiba au kuamka mapema, ni kama kupanda mbegu ndogo ya mchicha kwenye udongo laini; matokeo yake yatakuwa ya kishujaa na ya kustajabisha sana.

Dhana ya kuaminika soko na jamii inaeleza kuwa ili ujengewe uaminifu mbele ya marafiki, wateja au hata mwenzi wako, ni sharti unyenyekevu thabiti utawale nafsi yako. Kuacha tabia za kizamani za kuwa na mihemko hasi au kupaza sauti (gombano) kunaimarisha ushawishi wako mkuu.

Dhana ya tatu ni mfumo wa kukuza tija na ulinzi endelevu wa rasilimali. Kama jinsi maji ya mto yanavyotiririka bila kurudi nyuma, biashara au familia yako lazima iongozedwa kwa kuandika taratibu rahisi za kazi ili kuhakikisha amani na kuzuia upotevu wa muda na mali zetu.

SEHEMU YA TATU: HATUA KWA HATUA ZA VITENDO

Ili kukupa mwongozo usio na mashaka, hapa chini kuna dondoo mfululizo za kiutendaji unazopaswa kuzifuata kuanzia leo asubuhi kujiimarisha:

Hatua Ya 1: Kufanya Utafiti wa Msingi na Uchambuzi wa Mazingira
Mchakato wa kutenda unajumuisha hatua hii rahisi: Soma kwanza mazingira yanayokuzunguka kabla ya kufanya uamuzi makini kumlinda mradi. Hapa, mwanafunzi wangu, unapaswa kuelewa kuwa nidhamu ya kila wiki ndiyo siri inayotenganisha mabingwa na wachezaji wa kawaida. Epuka kufanya mambo haya kwa ushabiki; andika dondoo hizi na uanze nazo asubuhi ya leo ili upate matokeo makubwa kwenye ${focus}.

Hatua Ya 2: Kuweka Malengo Maalum na Kupima Tija yake kila Wiki
Mchakato wa kutenda unajumuisha hatua hii rahisi: Andika malengo yanayopimika (KPIs) kwenye daftari lako la masomo ya chuo. Hapa, mwanafunzi wangu, unapaswa kuelewa kuwa nidhamu ya kila wiki ndiyo siri inayotenganisha mabingwa na wachezaji wa kawaida. Epuka kufanya mambo haya kwa ushabiki; andika dondoo hizi na uanze nazo asubuhi ya leo ili upate matokeo makubwa kwenye ${focus}.

Hatua Ya 3: Kuzuia na Kudhibiti Kichochezi chochote cha Mihemko Hasi
Mchakato wa kutenda unajumuisha hatua hii rahisi: Inapotokea hasira au dharau, chukua nafasi ya kukaa kimya kulinda nishati yako. Hapa, mwanafunzi wangu, unapaswa kuelewa kuwa nidhamu ya kila wiki ndiyo siri inayotenganisha mabingwa na wachezaji wa kawaida. Epuka kufanya mambo haya kwa ushabiki; andika dondoo hizi na uanze nazo asubuhi ya leo ili upate matokeo makubwa kwenye ${focus}.

Hatua Ya 4: Kujenga na Kuboresha Chapa (Branding and Presentation)
Mchakato wa kutenda unajumuisha hatua hii rahisi: Mwonekano wako na ufungashaji wa bidhaa ndio sura ya kwanza ya ueledi mbele ya soko. Hapa, mwanafunzi wangu, unapaswa kuelewa kuwa nidhamu ya kila wiki ndiyo siri inayotenganisha mabingwa na wachezaji wa kawaida. Epuka kufanya mambo haya kwa ushabiki; andika dondoo hizi na uanze nazo asubuhi ya leo ili upate matokeo makubwa kwenye ${focus}.

Hatua Ya 5: Kuanzisha na Kusimama Mifumo ya Utunzaji Kumbukumbu
Mchakato wa kutenda unajumuisha hatua hii rahisi: Nyaraka, miamala, na miongozo ya kazi ihifadhiwe kwa usahihi wa kidijitali. Hapa, mwanafunzi wangu, unapaswa kuelewa kuwa nidhamu ya kila wiki ndiyo siri inayotenganisha mabingwa na wachezaji wa kawaida. Epuka kufanya mambo haya kwa ushabiki; andika dondoo hizi na uanze nazo asubuhi ya leo ili upate matokeo makubwa kwenye ${focus}.

SEHEMU YA NNE: MIFANO HALISI & KESI ZA KAZI

Kisa cha 1: Uboreshaji wa Uendeshaji Dar es Salaam (Kampuni ya Joseph Commodities LTD)
Nchini Tanzania, ndugu mmoja mfanyabiashara alitumia mfumo huu kurekebisha huduma kwa wateja. Ndani ya miezi sita tu, mauzo yake yaliongezeka kwa asilimia hamsini, akapata heshima kubwa na kuajiri vijana zaidi ya kumi.

Kisa cha 2: Uimarishaji wa Familia Mkoani Mwanza
Familia moja iliyokuwa na migogoro ya mara kwa mara ya kifedha ilipokea mwongozo huu na kuanza kuandika matumizi kila jioni. Utulivu na upendo ulirejea, wakajenga nyumba yao ya kisasa kwa amani tele.

SEHEMU YA TANO: CHANGAMOTO ZA KAWAIDA & SULUHU

Changamoto 1: Uvivu na Kuahirisha Mambo (Procrastination)
Suluhu: Tumia kanuni ya dakika tano; anza mara moja kazi ndogo badala ya kusubiri hisia zikubali.

Changamoto 2: Vikwazo vya Kifedha na Ukosefu wa Mtaji
Suluhu: Anza na kile ulichonacho mkononi; tumia ujuzi wako kama mtaji mkuu kabla ya kutafuta mikopo.

Changamoto 3: Shinikizo la Kijamii na Maneno ya Watu
Suluhu: Linda mwelekeo wako na usiruhusu kelele za nje zikupotezee dira ya maisha yako.

SEHEMU YA SITA: USHAURI WA KITAALAMU & MBINU ZA JUU

Wataalamu wetu katika Giniaz College wanashauri kuendelea kujifunza kila siku, kuwekeza kwenye afya ya akili na mwili, na kujenga mtandao wa watu wenye maadili mema na malengo makubwa.

SEHEMU YA SABA: TAFAKARI KUU & KAZI YA NYUMBANI

Tafakari maisha yako kwa kina na uandike hatua tatu thabiti utakazochukua wiki hii kufanya mabadiliko chanya kulingana na mafunzo haya.

Kauli mbiu ya chuo chetu ikiwa daima ni: "Giniaz College: Elimu ya Akili, Upendo na Busara Isiyo na Mipaka chini ya upendo mkuu wa Joseph Marwa Kyama!"`;

  return text;
}


export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch("/api/gemini/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate speech");
    }

    const data = await response.json();
    return data.audio || null;
  } catch (error: any) {
    console.error("Error generating speech:", error);
    throw new Error(error.message || "Imeshindwa kuunda sauti. Tafadhali jaribu tena baada ya muda mfupi.");
  }
};
