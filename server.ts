import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Lazy initialize Gemini
let genAI: any = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

const outlineSchema = {
  type: Type.OBJECT,
  properties: {
    lessons: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['title', 'description'],
      }
    }
  },
  required: ['lessons']
};

interface TanzanianInstructor {
  name: string;
  origin: string;
  title: string;
}

const tanzanianInstructors: TanzanianInstructor[] = [
  // Lake Zone / Kanda ya Ziwa (Mara, Mwanza, Kagera, Geita, Shinyanga, Simiyu)
  { name: "Mwalimu Nyangeta", origin: "Kanda ya Ziwa (Mara/Musoma)", title: "mhadhiri mwenye upendo na sauti ya faraja" },
  { name: "Mwalimu Ryakitimbo", origin: "Kanda ya Ziwa (Mara)", title: "mwalimu wa hekima na stadi za maisha" },
  { name: "Mwalimu Masanja", origin: "Kanda ya Ziwa (Mwanza/Shinyanga)", title: "mtaalamu wa malezi na saikolojia ya ufundishaji" },
  { name: "Mwalimu Kabula", origin: "Kanda ya Ziwa (Mwanza/Simiyu)", title: "mhadhiri mbobezi wa saikolojia ya mtoto na ukuaji" },
  { name: "Mwalimu Chacha", origin: "Kanda ya Ziwa (Mara/Tarime)", title: "mhadhiri wa hekima, maadili na staha ya utu" },
  { name: "Mwalimu Mwita", origin: "Kanda ya Ziwa (Mara)", title: "mhadhiri wa upendo, heshima na malezi thabiti" },
  { name: "Mwalimu Kwilasa", origin: "Kanda ya Ziwa (Shinyanga)", title: "mwalimu mwenye sauti tulivu ya amani na busara" },

  // Northern Zone / Kanda ya Kaskazini (Arusha, Kilimanjaro, Manyara, Tanga)
  { name: "Mwalimu Eliawonyi", origin: "Kanda ya Kaskazini (Kilimanjaro/Moshi)", title: "mhadhiri mbobezi mwenye busara ya hali ya juu" },
  { name: "Mwalimu Lomayani", origin: "Kanda ya Kaskazini (Arusha/Manyara)", title: "mwalimu mstaarabu mwenye upendo mkuu" },
  { name: "Mwalimu Namnyak", origin: "Kanda ya Kaskazini (Arusha)", title: "mhadhiri mbobezi wa saikolojia na malezi ya kiroho" },
  { name: "Mwalimu Sarakikya", origin: "Kanda ya Kaskazini (Moshi)", title: "mhadhiri wa stadi za maisha na falsafa ya amani" },
  { name: "Mwalimu Ndanshau", origin: "Kanda ya Kaskazini (Kilimanjaro)", title: "mwalimu wa hekima, uadilifu na upole wa asili" },

  // Southern Highlands / Kanda ya Nyanda za Juu Kusini (Mbeya, Iringa, Njombe, Songwe, Rukwa, Katavi)
  { name: "Mwalimu Mwaiselage", origin: "Kanda ya Nyanda za Juu Kusini (Mbeya)", title: "mhadhiri mbobezi wa stadi za moyo na amani ya ndani" },
  { name: "Mwalimu Sanga", origin: "Kanda ya Nyanda za Juu Kusini (Njombe)", title: "mhadhiri mwenye upendo, upole na maneno ya asali" },
  { name: "Mwalimu Luvanda", origin: "Kanda ya Nyanda za Juu Kusini (Iringa)", title: "mwalimu mlezi wa saikolojia ya uelewa na tabasamu" },
  { name: "Mwalimu Mwakipesile", origin: "Kanda ya Nyanda za Juu Kusini (Mbeya/Songwe)", title: "mhadhiri wa busara, unyenyekevu na maadili mema" },
  { name: "Mwalimu Mwakyusa", origin: "Kanda ya Nyanda za Juu Kusini (Mbeya)", title: "mwalimu mstaarabu na mwenye maneno ya faraja" },

  // Southern Zone / Kanda ya Kusini (Mtwara, Lindi, Ruvuma)
  { name: "Mwalimu Chitanda", origin: "Kanda ya Kusini (Mtwara)", title: "mhadhiri mtaalamu wa mifano ya asili na upendo" },
  { name: "Mwalimu Mtambo", origin: "Kanda ya Kusini (Lindi)", title: "mwalimu mlezi wa hekima, upole na ustahimilivu" },
  { name: "Mwalimu Mapunda", origin: "Kanda ya Kusini (Ruvuma/Songea)", title: "mhadhiri mbobezi wa saikolojia ya ufundishaji bora" },
  { name: "Mwalimu Ndunguru", origin: "Kanda ya Kusini (Ruvuma)", title: "mwalimu mwenye sauti ya joto, upendo na amani tele" },

  // Eastern & Coastal Zone / Kanda ya Mashariki na Pwani (Dar es Salaam, Pwani, Morogoro, Tanga)
  { name: "Mwalimu Mkude", origin: "Kanda ya Mashariki (Morogoro)", title: "mhadhiri mbobezi mwenye sauti ya upendo mkuu" },
  { name: "Mwalimu Semgalawe", origin: "Kanda ya Pwani (Tanga)", title: "mhadhiri mstaarabu wa lugha laini na uelewa thabiti" },
  { name: "Mwalimu Mndeme", origin: "Dar es Salaam", title: "mhadhiri mstaarabu wa malezi na saikolojia ya kisasa" },
  { name: "Mwalimu Kingazi", origin: "Kanda ya Pwani (Pwani)", title: "mwalimu mlezi mwenye busara, upole na huruma nyingi" },

  // Central Zone / Kanda ya Kati (Dodoma, Singida, Tabora, Kigoma)
  { name: "Mwalimu Mazengo", origin: "Kanda ya Kati (Dodoma)", title: "mhadhiri mbobezi mwenye hekima ya asili na upendo" },
  { name: "Mwalimu Chilongani", origin: "Kanda ya Kati (Dodoma)", title: "mwalimu wa hekima, amani na stadi za kiroho" },
  { name: "Mwalimu Mayunga", origin: "Kanda ya Kati (Tabora)", title: "mhadhiri wa stadi za maisha na mifano laini ya kijamii" },
  { name: "Mwalimu Sweya", origin: "Kanda ya Kati (Singida)", title: "mwalimu mstaarabu wa upendo, faraja na amani thabiti" },

  // Zanzibar (Unguja, Pemba)
  { name: "Mwalimu Khamis", origin: "Zanzibar (Unguja)", title: "mhadhiri mstaarabu wa lugha laini na adabu ya asili" },
  { name: "Mwalimu Fatma", origin: "Zanzibar (Pemba)", title: "mhadhiri mbobezi mwenye sauti tulivu kama umande wa asubuhi" },
  { name: "Mwalimu Sheha", origin: "Zanzibar (Unguja)", title: "mwalimu mlezi mwenye busara ya kipekee na upendo mkuu" }
];

const introSentences = [
  "Karibu katika somo hili hapa Giniaz College, Kibaha, Pwani, TZ.",
  "Karibu sana katika darasa la leo hapa Giniaz College.",
  "Heri na baraka zikufikie mwanafunzi wangu mpendwa hapa Giniaz College.",
  "Karibu tujifunze pamoja somo hili zuri hapa Giniaz College, Kibaha TZ.",
  "Karibu katika kisima cha maarifa cha Giniaz College, Kibaha, Pwani, TZ."
];

function getDynamicInstructorAndIntro(courseTitle: string, lessonTitle: string) {
  const introBase = introSentences[Math.floor(Math.random() * introSentences.length)];
  const welcomeText = `${introBase} Karibu katika somo la "${lessonTitle}".`;
  return {
    instructorName: "Mwalimu Joseph Marwa Kyama",
    welcomeText
  };
}

// Fallback generators in Swahili for peak resiliency when API quotas are exceeded
function getFallbackCourseOutline(courseTitle: string) {
  const normalizedTitle = courseTitle.trim().toLowerCase();

  if (normalizedTitle.includes("app creator 24 tutorial")) {
    return [
      { title: "Utangulizi na Vipengele vya App Creator 24 (Components)", description: "Jifunze vipengele vya msingi vya jukwaa la App Creator 24 na jinsi ya kuvitumia." },
      { title: "Uundaji na Usimamizi wa Section katika App yako", description: "Mwongozo vya jinsi ya kutengeneza, kusimamia, na kupanga sections mbalimbali za app yako." },
      { title: "Uundaji wa Apps za Nje ya Mtandao (Offline Apps)", description: "Jinsi ya kuunda app inayofanya kazi kikamilifu bila uhitaji wa intaneti (offline)." },
      { title: "Uundaji wa Apps za Mtandaoni (Online Apps)", description: "Mbinu za kuunda apps zinazotegemea mtandao na jinsi ya kuziunganisha na seva." },
      { title: "Hatua kwa Hatua: Kuunda App ya Kuchati (Chat App)", description: "Jifunze kusanidi na kutengeneza jukwaa la mazungumzo na kuchati ndani ya app yako." },
      { title: "Kuunda App ya Kuangalia Channels za Azam TV", description: "Mbinu za kuingiza viungo vya utiririshaji (streaming) na kuunda app ya kuangalia chaneli za Azam TV au TV zingine." },
      { title: "Unda App ya Kusoma Habari za Kiswahili za Kimataifa", description: "Jinsi ya kukusanya vyanzo vya habari na kuunda app ya kisasa ya kusoma habari za kimataifa." },
      { title: "Unda App ya Video za DJ Mark", description: "Mwongozo wa kutayarisha na kuweka viungo vya video za burudani na DJ Mark kwenye app." },
      { title: "Unda App ya Masomo ya Shule za Msingi Tanzania", description: "Kuunda app ya kielimu yenye kuwezesha wanafunzi kusoma masomo ya msingi TZ offline." },
      { title: "Unda App ya Biashara ya Mazao Tanzania", description: "Mbinu za kutengeneza jukwaa la kuuza, kununua na kufuatilia bei za mazao ya kilimo nchini Tanzania." },
      { title: "Kuunda App ya Vituo vya Redio (FM Stations Tanzania)", description: "Hatua za kuweka viungo vya utiririshaji wa sauti ili kusikiliza redio mbalimbali za FM Tanzania." },
      { title: "Kanuni Kuu za Uundaji wa Offline App", description: "Jifunze sheria na kanuni muhimu za kuzingatia ili offline app yako iwe na tija, kasi na utulivu." },
      { title: "Kanuni Kuu za Uundaji wa Online Apps", description: "Fahamu kanuni za usalama, kasi na usawazishaji wa data kwa online apps zinazotumia seva." },
      { title: "Kutumia AI Kuunda App Ndani ya App Creator 24", description: "Jinsi ya kutumia akili mnemba (AI) kama ChatGPT/Gemini kukuongoza na kukusaidia kuunda app yako vizuri." },
      { title: "Kutumia AI Kuunda Maudhui ya Apps za Offline", description: "Mbinu za kuzalisha maudhui ya maandishi na picha kwa kutumia AI ili kuingiza kwenye offline apps." },
      { title: "Kutumia AI katika Apps za Online", description: "Jinsi ya kutumia AI kupanga na kutoa maudhui yanayohuishwa kila mara mtandaoni." },
      { title: "Jinsi ya Kupata Viungo vya Maudhui Mbalimbali na AI Ndani ya App Creator 24", description: "Mwongozo wa kutafuta na kuzalisha viungo (hyperlinks, mp4, au streaming URLs) vya maudhui mbalimbali kwa msaada wa AI." },
      { title: "Mwongozo vya Jinsi ya Kuitumia Kuunda App", description: "Mbinu za jumla za kusimamia akaunti yako, kutengeneza profile, na kuanza mradi mpya kikamilifu ndani ya App Creator 24." },
      { title: "Jinsi ya Kuweka Matangazo na Kuingiza Kipato Kupitia App Creator 24", description: "Jifunze kusanidi matangazo ya AdMob, AppLovin, au Unity Ads ili uanze kupata faida kupitia apps zako." },
      { title: "Kusajili, Kupakia na Kusambaza App Yako kwenye Play Store", description: "Hatua rasmi za kutoa faili la APK/AAB na kulipakia Google Play Store na masoko mengine ya apps." }
    ];
  }

  if (normalizedTitle.includes("karibu giniaz college")) {
    return [
      { title: "Utangulizi wa Giniaz College", description: "Historia na chimbuko la kuanzishwa kwa chuo, na dira yetu kuu." },
      { title: "Dira na Dhana ya Kuanzishwa", description: "Malengo yetu ya muda mrefu katika kuwaandaa viongozi na wajasiriamali." },
      { title: "Mwongozo wa Masomo na Mafunzo ya Vitendo", description: "Mbinu unazopaswa kutumia kuongeza weledi na unufaike kikamilifu." },
      { title: "Vipengele vya Utafiti na Elimu ya Kisasa", description: "Jinsi ya kufanya tafiti rahisi zinazoleta mapinduzi ya kiuchumi." },
      { title: "Maadili, Nidhamu na Bidii Chuoni", description: "Nguzo thabiti za kiroho na kimaisha zinazojenga mustakabali wa mwanafunzi." },
      { title: "Dhana ya Kujitegemea Kiuchumi nchini Tanzania", description: "Jinsi masomo yetu yanavyolenga kumtoa mwanafunzi kwenye utegemezi." },
      { title: "Kujenga Fikra Mpya za Ujasiriamali", description: "Mabadiliko ya mtazamo kuelekea kutatua matatizo kama fursa." },
      { title: "Kusimamia Rasilimali na Kubana Matumizi", description: "Kujifunza jinsi ya kuanza na kile ulichonacho ili kufikia kikubwa." },
      { title: "Matumizi ya Teknolojia katika Maendeleo", description: "Jinsi teknolojia ya kisasa na AI inavyoweza kukuza jitihada zako." },
      { title: "Uhuru Binafsi wa Kimaisha na Maadili", description: "Jinsi ya kujiendesha kwa nidhamu ya hali ya juu ukiwa nyumbani au kazini." },
      { title: "Mchango wa Giniaz College kwa Jamii", description: "Miradi mbalimbali na uenezi wa elimu ya mtandaoni na offline." },
      { title: "Kuhitimu na Vyeti vya Pongezi", description: "Taratibu za kuzingatia ili kukamilisha kozi na kupata cheti rasmi." }
    ];
  }

  if (normalizedTitle.includes("mwanamke wa hisia") || normalizedTitle.includes("mke wa hisia")) {
    return [
      { title: "Mjue Mwanamke wa Hisia: Jinsi ya Kumtambua Kiwango cha Atomu", description: "Utafiti makini wa kisaikolojia, kihemuko, na alama thabiti za kumtambua na utambulisho tangu kiwango cha atomu." },
      { title: "Nguvu Kubwa za Kiasili za Mwanamke wa Hisia na Jinsi ya Kuzitumia", description: "Kuelewa uwezo wa kipekee wa huruma, hisia kali (empathy), na jinsi ya kuzigeuza kuwa silaha ya mafanikio." },
      { title: "Udhaifu wa Mwanamke wa Hisia na Jinsi Anavyoweza Kuutumia kimaisha", description: "Mwongozo wa kubadili upesi wa kuathirika kihemko kuwa fursa thabiti ya uongozi na umakini kimaisha." },
      { title: "Mwanamke wa Hisia Kwenye Ndoa na Uhusiano Mwema", description: "Uchambuzi wa kina kuhusu mawasiliano, upendo wa dhati, na kutatua migogoro ya ndoa kwa hekima na upendo." },
      { title: "Mwanamke wa Hisia Kwenye Familia na Usimamizi wa Malezi", description: "Maadili na njia thabiti za kulea kwa kuelekeza hisia kwa mtazamo chanya katika familia." },
      { title: "Mwanamke wa Hisia Kazini na Kwenye Jamii", description: "Mbinu za kukabili migongano ya kiofisi, nidhamu ya kazi, na kukuza ushupavu thabiti mbele ya changamoto." },
      { title: "Mwanamke wa Hisia Kwenye Ibada na Kiroho", description: "Namna anavyounganisha hisia zake za ndani na ibada ya kweli, maombi ya siri, na kurejesha nishati ya kiroho." },
      { title: "Vipaji Vyake vya Kipekee, Vipaumbele Vyake kimaisha na Mambo Wasiopenda", description: "Sanaa na vipaji vya kipekee, kupanga vipaumbele na kukataa mambo wasiyopenda wanawake wa hisia." },
      { title: "Mwanamke wa Hisia Kwenye Uchumi na Usimamizi wa Fedha", description: "Kanuni thabiti za kifedha, mzunguko wa pesa, na kuendesha uchumi tangu ngazi ya kiatomu." },
      { title: "Jinsi Anavyoweza Kujenga Utajiri Kupitia Ujasiriamali", description: "Mwongozo na mbinu makini za kuongeza vyanzo vya kipato kwa njia ya kiubunifu na ujasiriamali." },
      { title: "Mwanamke wa Hisia: Upande wa Elimu, Vitabu Vinavyomfaa na Nyimbo Anazopenda", description: "Kuchunguza fursa za masomo, vitabu bora vya kusoma, na nyimbo zinazolisha na kuponya nafsi." },
      { title: "Jinsi Anavyoweza Kujijenga Kuwa Bora Zaidi Kwenye Maisha", description: "Hatua za mwisho za kufikia kiwango cha ukomavu kamili (self-mastery) kama mwanamke thabiti." }
    ];
  }

  if (normalizedTitle.includes("mwanaume wa hisia")) {
    return [
      { title: "Mjue Mwanaume wa Hisia: Jinsi ya Kumtambua Kiwango cha Atomu", description: "Kuelewa sifa za mwanaume mwenye hisia za ndani lakini mkimya, na tija yake tangu ngazi ya kiatomu." },
      { title: "Nguvu Zake za Kipekee na Jinsi ya Kuzitumia Kuongoza", description: "Kugusa mioyo, mbinu za kipekee za uongozi kulingana na ubinadamu na unyenyekevu thabiti katika jamii." },
      { title: "Udhaifu Wake na Jinsi Anavyoweza Kuutumia", description: "Kupunguza mihemko ya hasira, kudhibiti hofu ya kukataliwa, na kuugeuza udhaifu huo kuwa uthabiti wa kiume." },
      { title: "Mwanaume wa Hisia Kwenye Ndoa na Uhusiano Mwema", description: "Uwezo wake wa kumpenda mke wake kwa kiwango cha juu na namna ya kuzuia migogoro ya kihemko ya ndani." },
      { title: "Mwanaume wa Hisia Kwenye Familia na Uongozi wa Nyumbani", description: "Kulelewa kwa watoto kwa hekima na weledi, na kuwa mfano bora wa ulinzi, nidhamu na malezi ndani ya nyumba." },
      { title: "Mwanaume wa Hisia Kazini na Kwenye Biashara", description: "Namna ya kujenga ushirikiano wa karibu kiofisi and kufanya uamuzi wa kibiashara wenye tija kubwa." },
      { title: "Mwanaume wa Hisia Kwenye Ibada na Kiroho", description: "Kuungana na Muumba katika ngazi ya kiroho ya kina sana na kuongoza madhabahu ya kiroho ya ndoa." },
      { title: "Vipaji Vyake, Vipaumbele Vyake kimaisha na Mambo Wasiopenda", description: "Vipaji vya kiume vya kiubunifu, kupanga vipaumbele na kujilinda dhidi ya mambo wasiyopenda." },
      { title: "Mwanaume wa Hisia Kwenye Uchumi na Usimamizi wa Fedha", description: "Uchambuzi makini kuhusu uendeshaji uchumi binafsi na wa nyumbani bila kuyumba." },
      { title: "Jinsi Anavyoweza Kujenga Utajiri wa Kudumu", description: "Mbinu za kuunde mifumo ya kuongeza mzunguko wa fedha na uwekezaji thabiti tangu ngazi ya kiatomu." },
      { title: "Mwanaume wa Hisia: Upande wa Elimu, Vitabu Vinavyomfaa na Nyimbo Anazopenda", description: "Uchambuzi wa fasihi thabiti na maarifa mapya yanayomjenga kiongozi, na kurejesha nishati yake." },
      { title: "Jinsi Anavyoweza Kujijenga Kuwa Bora Zaidi Kwenye Maisha", description: "Mbinu za mwisho za kujenga nidhamu ya hali ya juu ili kuwa mwanaume mwenye mchango chanya nchini." }
    ];
  }

  if (normalizedTitle.includes("ethical hacker") || normalizedTitle.includes("hacker") || normalizedTitle.includes("cybersecurity") || normalizedTitle.includes("cyber security")) {
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

  if (normalizedTitle.includes("akili bandia") || normalizedTitle.includes("ai")) {
    return [
      { title: "Utangulizi wa Akili Bandia na Historia Yake", description: "Jifunze dhana za kimsingi za AI, na mabadiliko ya kiteknolojia." },
      { title: "Jinsi Mifano ya Lugha Kubwa (LLM) Inavyofanya Kazi", description: "Kuelewa uwezo wa algoriti za kisasa za lugha kama Gemini na GPT." },
      { title: "Mbinu za Kuandika Prompts kwa Ufanisi (Prompt Engineering)", description: "Mwongozo wa jinsi ya kutoa maelekezo bora ili kupata majibu sahihi." },
      { title: "Matumizi ya AI Katika Kazi na Maisha ya Kila Siku", description: "Kuongeza ufanisi wa ratiba za maisha na kazi za kiofisi kupitia zana za AI." },
      { title: "AI katika Elimu na Utafiti nchini Tanzania", description: "Mbinu za kutumia AI kujifunza, kufanya tafiti na kuandaa maudhui ya shule." },
      { title: "Kuongeza Tija na Kipato kwa Kutumia Zana za AI", description: "Jinsi ya kubuni mifumo na huduma yenye kukuongezea kipato kupitia akili bandia." },
      { title: "Madhara na Changamoto za Maadili Katika AI (Ethics)", description: "Uchambuzi wa usalama wa data, upotevu wa ajira, na sera za maadili." },
      { title: "AI Katika Uundaji wa Maudhui, Kubuni Picha na Graphics", description: "Mwongozo wa kutumia akili bandia kuzalisha picha, nembo, na sauti." },
      { title: "Zana Mbalimbali za AI na Jinsi ya Kuziunganisha", description: "Fahamu programu mbalimbali za kisasa na jinsi ya kuzifanya zizungumze zenyewe." },
      { title: "Usalama wa Data na Ujuzi Mpya Katika Enzi ya AI", description: "Jilinde dhidi ya uhalifu wa mitandaoni spider nets na hifadhi taarifa zako vizuri." },
      { title: "Mwelekeo wa AI kwa Baadaye na Ajira", description: "Tathmini ya soko la ajira la baadae na elimu unayopaswa kuwa nayo leo." },
      { title: "Hitimisho na Mpango Kazi wa Kubobea Katika AI", description: "Njia salama na madhubuti za kukamilisha kozi na kuanza safari yako ya AI." }
    ];
  }

  if (normalizedTitle.includes("api economy") || normalizedTitle.includes("api-economy")) {
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

  if (normalizedTitle.includes("ufundishaji") || normalizedTitle.includes("mbinu za ufundishaji")) {
    return [
      { title: "Misingi ya Saikolojia ya Kujifunza na Ufundishaji", description: "Jinsi ubongo unavyopokea taarifa na mbinu za ki-saikolojia za kumshawishi mwanafunzi." },
      { title: "Mbinu Shirikishi za Ufundishaji (Active Learning)", description: "Kuongeza ufanisi darasani kwa kuhusisha wanafunzi badala ya kuongea peke yako." },
      { title: "Jinsi ya Kuandaa Somo (Lesson Planning) kwa Kiwango cha Juu", description: "Andaa mwongozo thabiti wa namna ya kufundisha somo lako hatua kwa hatua." },
      { title: "Matumizi ya Zana za Kufundishia (Teaching Aids)", description: "Zana za kale na za kisasa za kuelimisha zinazoacha picha thabiti kichwani mwa mwanafunzi." },
      { title: "Njia za Kuwasiliana kwa Ufasaha na Kuvutia Wanafunzi", description: "Matumizi bora ya sauti, lugha ya mwili na usemi thabiti usiochosha." },
      { title: "Kudhibiti na Kusimamia Darasa (Classroom Management)", description: "Jinsi ya kudumisha nidhamu, utulivu, na usawa hata darasani kukiwa na fujo au wanafunzi wengi." },
      { title: "Mbinu za Kutathmini Maendeleo (Assessment/Evaluation)", description: "Jinsi ya kufanya mitihani, mazoezi, na upimaji wa uelewa kwa usahihi." },
      { title: "Changamoto za Kufundisha na Jinsi ya Kuzikabili kwa Hekima", description: "Kusimamia dharura, tofauti za uelewa na changamoto za miundombinu darasani." },
      { title: "Ufundishaji wa Kiroho vs ule wa Kitaaluma", description: "Mbinu za kufundisha misingi ya kiimani inayobadilisha roho ya mwanafunzi." },
      { title: "Jukumu la Mwalimu Kama Kiongozi na Mshauri", description: "Uhusiano bora wa mwalimu na wanafunzi nje ya darasa kwa ulinzi wao kimaadili." },
      { title: "Teknolojia Katika Kuboresha Njia za Ufundishaji", description: "Kufundisha kupitia video, mitandao na zana za kidijitali nchini." },
      { title: "Kuendelea Kitaaluma na Maadili Makuu ya Ualimu", description: "Nidhamu za jumla, kanuni za maadili ya taaluma ya ualimu nchini." }
    ];
  }

  if (normalizedTitle.includes("ukweli mchungu")) {
    return [
      { title: "Dunia Haikudai Kitu: Ukweli Kuhusu Uwajibikaji Binafsi", description: "Kuelewa kwamba hakuna mtu anayehusika na furaha au mafanikio yako isipokuwa wewe." },
      { title: "Saikolojia ya Familia na Migongano ya Ndani ya Damu", description: "Ukweli mchungu kuhusu ndugu, wazazi, na jinsi migogoro ya kifamilia inavyoweza kukurudisha nyuma." },
      { title: "Uchumi Halisi: Tofauti ya Kutengeneza na Kulinda Fedha", description: "Mbona watu wengi wenye vipato vikubwa bado ni maskini? Kanuni za kulinda pesa zako." },
      { title: "Jamii na Unafiki wa Kijamii: Kuishi na Watu Bila Kuumizwa", description: "Jinsi ukweli wa kijamii ulivyojengwa juu ya maslahi na jinsi ya kujilinda kihisia." },
      { title: "Imani za Kidini vs Maisha Halisi: Kudumisha Imani Bila Upofu", description: "Uchambuzi wa jinsi ya kufanya kazi kwa bidii sambamba na maombi bila kutega miujiza ya hewani." },
      { title: "Heshima Haipatikani Kirahisi: Jinsi ya Kuijenga na Kuidumisha", description: "Uhusiano mkubwa wa heshima na nguvu ya kiuchumi pamoja na tabia yako binafsi." },
      { title: "Mwonekano Wako na Mavazi: Jinsi Unavyochukuliwa na Jamii", description: "Ukweli unavyohukumiwa kwa haraka kulingana na kile unachokivaa na usafi wa mwili wako." },
      { title: "Maumivu ya Kukataliwa na Kushindwa Kama Sehemu ya Kupiga Hatua", description: "Maumivu ni sehemu ya mchakato; jinsi ya kukua kupitia dhoruba za maisha halisi." },
      { title: "Urafiki wa Maslahi na Jinsi ya Kutambua Watu Waongo", description: "Kusafisha orodha ya marafiki na kuacha watu gani sahihi wa kuambatana nao." },
      { title: "Maisha ya Kutojionyesha na Madhara ya Kutafuta Sifa Mitandaoni", description: "Uchambuzi wa mbona siri huleta baraka kuliko kelele na majivuno ya mitandao." },
      { title: "Ukweli Kuhusu Umri na Kupita kwa Muda Usiorudi", description: "Jinsi ya kutumia ujana wako vizuri kabla nguvu hazijaisha na majukumu kuwa mengi mno." },
      { title: "Amani ya Ndani na Kujitambua Katika Dunia ya Sasa", description: "Kufikia kiwango cha utulivu kamili wa kisaikolojia bila kutetereka na maoni ya watu." }
    ];
  }

  if (normalizedTitle.includes("elinzi wa kiroho") || normalizedTitle.includes("ulinzi wa kiroho")) {
    return [
      { title: "Utambuzi wa Vita vya Kiroho na Kanuni Zake Kuu", description: "Kuelewa kwamba maisha yetu yanaonekana kimwili lakini misingi yake ni ya kiroho." },
      { title: "Msingi wa Biblia Katika Ulinzi wa Kiroho (Waefeso 6)", description: "Uchambuzi wa silaha sita za Mungu ambazo kila mwamini anapaswa kusimama nazo." },
      { title: "Silaha za Kiroho: Maombi ya Imani na Kufunga", description: "Nishati thabiti inayozalishwa kwa kuunganisha maombi na unyenyekevu mbele za Mungu." },
      { title: "Soma na Kutafakari Neno la Mungu Kama Ngao", description: "Nguvu ya Neno iliyoandikwa inayotumika kama upanga wa roho dhidi ya mashaka." },
      { title: "Kutambua na Kusimamia Mipaka ya Kiroho ya Familia", description: "Jinsi ya kuanzisha dhabahu ya familia na kuweka ulinzi wa damu juu ya watoto na mali." },
      { title: "Jukumu la Damu ya Yesu na Ushindi wa Msalaba", description: "Mamlaka makubwa ya ushindi tuliokabidhiwa tangu zamani na jinsi ya kuyatumia." },
      { title: "Kulinda Malango ya Fahamu (Macho, Masikio, Fikra)", description: "Namna ya kuziba nyufa za maisha ili usiruhusu adui kupandikiza mbegu hasi." },
      { title: "Kushinda Upinzani wa Kiroho, Changamoto na Mashaka", description: "Kukabiliana na kuvunjika moyo ambako adui hutumia kutuvuruga njiani." },
      { title: "Maisha ya Utakatifu na Ushirika Madhubuti na Roho Mtakatifu", description: "Nidhamu ya kuishi maisha safi yanayovutia ulinzi wa malaika wa Mungu." },
      { title: "Kutibua Mipango ya Shetani na Kujikinga na Uongo", description: "Jinsi ya kutambua mafundisho ya maroho ya upotoshaji katika nyakati hizi." },
      { title: "Nguvu ya Tamko na Kukiri Ahadi za Mungu Kila Siku", description: "Uchambuzi wa jinsi maneno yako ya kinywa yanavyoumba ulinzi thabiti wa kimaisha." },
      { title: "Amani Inayopita Fahamu Zote na Kudumu Katika Ushindi", description: "Hitimisho la kozi kupitia kumtegemea Mungu kikamilifu na kuishi kwa raha weledi." }
    ];
  }

  if (normalizedTitle.includes("nyakati za sasa") || normalizedTitle.includes("hali halisi ya nyakati")) {
    return [
      { title: "Uchambuzi wa Mazingira ya Sasa Kijamii na Kiuchumi", description: "Hali halisi nchini Tanzania na duniani kote kiuchumi na kitamaduni." },
      { title: "Mabadiliko ya Kitamaduni na Athari Zake Kwenye Familia", description: "Mmonyoko wa maadili, kuiga mambo ya nje, na siri ya kulinda familia yako." },
      { title: "Teknolojia ya Kisasa, Akili Bandia na Mustakabali wa Binadamu", description: "Athari za kisaikolojia za kuwa kwenye skrini saa 24 na mabadiliko ya maisha wetu." },
      { title: "Upotevu wa Maadili, Unafiki na Jinsi ya Kusimama Imara", description: "Kanuni thabiti za kusimama peke yako bila kuyumbishwa na upepo wa jamii." },
      { title: "Uchumi wa Kidijitali na Changamoto ya Kupata Riziki Halali", description: "Fursa mpya za fedha zilizopo mtandaoni na mambo unayopaswa kuepuka." },
      { title: "Elimu ya Sasa vs Maarifa Halisi ya Kimaisha", description: "Gundua mbona vyeti havitoshi na vyuo vinavyokosa kufundisha stadi za mitaani." },
      { title: "Afya ya Akili, Stress na Upweke Katika Dunia ya Sasa", description: "Kuchunguza mbona unyogovu na msongo wa mawazo umeongezeka kwa vijana na mbinu za kinga." },
      { title: "Changamoto za Kiroho Kwenye Nyakati za Sasa", description: "Tathmini ya kimaandiko kuhusu ugumu wa siku za mwisho na sifa zake." },
      { title: "Malezi ya Watoto katika Enzi Mpya ya Mitandao ya Kijamii", description: "Mwongozo kwa wazazi wa sasa kulinda akili na tabia za watoto dhidi ya maudhui mabaya." },
      { title: "Kupambana na Habari za Uongo na Upotoshaji", description: "Mbinu za chujio la akili ili usiamini kila kitu unachokisikia au kuona mitandaoni." },
      { title: "Umuhimu wa Kuwa na Jamii ya Watu Sahihi", description: "Ushirikiano wa ana kwa ana unaorejesha ubinadamu wetu na kukupa ngao ya kijamii." },
      { title: "Kujiandaa kwa Baadaye na Kudumisha Amani na Tumaini la Kweli", description: "Mwongozo wa kufanya maamuzi sahihi ya uwekezaji na kujiweka tayari kwa dhoruba." }
    ];
  }

  if (normalizedTitle.includes("eskatolojia") || normalizedTitle.includes("hatima ya mungu")) {
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

  if (normalizedTitle.includes("mwalimu wa neno")) {
    return [
      { title: "Wito na Jukumu la Mwalimu wa Neno la Mungu", description: "Umuhimu na uzito wa kuwa mwalimu, na athari yake katika kanisa na jamii." },
      { title: "Tabia, Utu na Nidhamu ya Kiroho ya Mwalimu", description: "Umuhimu wa kuishi kile unachokifundisha ili kuzuia dharau na kuleta tija." },
      { title: "Misingi ya Ufafanuzi Sahihi wa Biblia (Hermeneutics)", description: "Kanuni za kutafsiri Maandiko kwa usahihi bila kuingiza maoni binafsi (eisegesis vs exegesis)." },
      { title: "Kujifunza kwa Utaratibu na Kujiandaa kwa Ajili ya Kufundisha", description: "Zana za utafiti, jinsi ya kuandaa muhtasari bora wa somo lako kujiandaa." },
      { title: "Kuelewa Muktadha wa Kitabu, Historia, na Lugha ya Biblia", description: "Jinsi ya kusoma mstari kwa kuangalia mistari inayouzunguka ili kupata maana." },
      { title: "Njia Bora za Kufikisha Ujumbe kwa Wasikilizaji", description: "Kutambua hadhira yako (vijana, wazee, wasomi, wasiotambua sana) na kuongea nao ufasaha." },
      { title: "Matumizi ya Mifano katika Mafundisho ya Biblia", description: "Jinsi ya kutumia mifano ya maisha ili kueleza dhana ngumu za kiroho." },
      { title: "Kuwaongoza Wanafunzi Katika Matumizi ya Vitendo ya Neno", description: "Kufundisha neno linalobadilisha tabia badala ya kujaza vichwa tu elimu." },
      { title: "Kukabiliana na Maswali Magumu na Mashaka ya Wanafunzi", description: "Kujibu maswali ya wasikilizaji kwa upendo, busara na hekima pamoja na staha thabiti." },
      { title: "Huduma ya Roho Mtakatifu Katika Kufundisha Neno", description: "Kuondoa utegemezi wa akili zako tu na badala yake kumuacha Mungu aongoze madhabahu." },
      { title: "Kulinda Maadili na Kuepuka Mafundisho Potevu", description: "Kulinda kile ulichopewa dhidi ya falsafa za kibinadamu zisizomcha Mungu." },
      { title: "Kuendelea Kujifunza na Kukua katika Maarifa na Hekima", description: "Kushinda uvivu wa kusoma vitabu, na kuongeza thabiti unyenyekevu wako miaka yote." }
    ];
  }

  if (normalizedTitle.includes("jifunze biblia") || normalizedTitle.includes("biblia kwa kiwango cha juu")) {
    return [
      { title: "Muundo wa Biblia, Vitabu vya Agano la Kale na Jipya", description: "Uchambuzi wa mgawanyiko wa vitabu, waandishi mbalimbali, na ujumbe thabiti wa Biblia." },
      { title: "Mbinu za Juu za Utafiti wa Maandiko (Inductive Study)", description: "Mbinu ya kumsaidia mwanafunzi kuchambua mwenyewe kupitia Kuona, Kutafsiri na Kutumia." },
      { title: "Makubaliano ya Agano la Kale na Jipya", description: "Uhusiano mkubwa kati ya kivuli (Agano la Kale) na picha halisi (Agano Jipya)." },
      { title: "Teolojia ya Msingi na Doktrini Kuu za Kikristo", description: "Elimu kuhusu Mungu (Theology), Kristo (Christology), Roho Mtakatifu (Pneumatology), nk." },
      { title: "Historia na Utamaduni wa Nyakati za Biblia", description: "Mazingira gani ya kijiografia, kisiasa na kijamii yaliunda ujumbe thabiti wa ki-Biblia." },
      { title: "Ufafanuzi wa Aina Mbalimbali za Fasihi ya Biblia", description: "Tofautisha hadithi kihistoria, mashairi ya Zaburi, andiko la hekima na unabii." },
      { title: "Kusoma Biblia kwa Kufuatilia Mada Kuu (Thematic Study)", description: "Jinsi ya kufuatilia jambo thabiti moja (mfano Agano, Damu, Neema, Ukombozi) tangu Mwanzo hadi Ufunuo." },
      { title: "Jukumu la Lugha za Kwanza (Kiebrania na Kigiriki)", description: "Matumizi ya maneno asilia ya Biblia kufunua maana thabiti ya neno linalotatiza." },
      { title: "Kutumia Ramani, Kamusi, na Concordance ya Biblia", description: "Zana gani za nje unazopaswa kuwa nazo nyumbani ili kubobea kimaandiko." },
      { title: "Dhabahu ya Maombi na Utakasi Katika Kusoma Biblia", description: "Nishati inayozalishwa wakati unachanganya kusoma maandiko na maombi ya usiku." },
      { title: "Utatuzi wa Mafumbo au Mistari Migumu katika Biblia", description: "Kanuni thabiti za ki-muktadha za kutatua mabishano ya kimaandiko bila kufarakana." },
      { title: "Kuhifadhi Neno Moyoni na Kuliishi Kila Siku kwa Uaminifu", description: "Tofauti kuu kati ya msomi tu wa neno na mtu aliyebadilishwa roho na neno." }
    ];
  }

  if (normalizedTitle.includes("kuongoza ibada") || normalizedTitle.includes("jinsi ya kuongoza ibada")) {
    return [
      { title: "Maana na Misingi ya Ki-Biblia ya Ibada ya Kweli", description: "Gundua mbona ibada inaanzia moyoni wala sio tu kwenye taratibu za nje za kanisa." },
      { title: "Maandalizi Binafsi ya Kiroho ya Kiongozi wa Ibada", description: "Kusafisha mishipa ya kiroho ya maisha yako kabla ya kusimama mbele ya kusanyiko." },
      { title: "Kupanga Mtiririko na Muundo wa Ibada (Liturgy)", description: "Siri ya kuwa na nidhamu ya mtiririko thabiti wenye kumpa Mungu utukufu mkuu." },
      { title: "Sanaa ya Kuongoza Maombi ya Pamoja ya Kutaniko", description: "Njia za kuhamasisha imani na kuunganisha roho za watu wote kumwomba Mungu kwa dhati." },
      { title: "Uteuzi wa Nyimbo na Kazi ya Kusifu na Kuabudu", description: "Kuelewa upatanisho wa nyimbo na sifa na mahubiri yatakayofuata darasani." },
      { title: "Kusoma Maandiko kwa Uwasilishaji Sahihi na Kudhibiti Sauti", description: "Mbinu za kutamka maneno ufasaha na kuonyesha heshima kuu kwa Neno mbele za kutaniko." },
      { title: "Kushirikiana na Wanamuziki na Wahudumu Wengine", description: "Kuongoza ibada kwa umoja kama timu moja thabiti chini ya miongozo ya ki-Mungu." },
      { title: "Kujenga Mazingira Yanayokaribisha na Kudumisha Nidhamu", description: "Jinsi ya kuondoa vizuizi na dharau, kufanya wageni wajisikie amani chuoni." },
      { title: "Usimamizi wa Muda Katika Ibada na Kukabiliana na Dharura", description: "Nidhamu ya kuokoa muda wa watu bila kubana uwezo wa kipekee wa Roho Mtakatifu." },
      { title: "Sensitivity kwa Roho Mtakatifu na Kubadilisha Mtiririko", description: "Kusoma upepo wa kiroho na kufanya mabadiliko ya papo kwa hapo kwa nidhamu kuu." },
      { title: "Ibada Katika Mazingira Tofauti", description: "Hatua za kuongoza ibada ya ndoa, mazishi, baraka ya mtoto au mapokezi nyumbani." },
      { title: "Kutathmini Ibada na Kudumisha Moyo wa Unyenyekevu", description: "Kushinda mtego wa majivuno na kupokea maoni ya wazee kwa unyenyekevu mkuu." }
    ];
  }

  if (normalizedTitle.includes("ukweli kuhusu sabato") || normalizedTitle.includes("sabato")) {
    return [
      { title: "Asili ya Sabato Katika Uumbaji (Mwanzo 2)", description: "Tathmini ya jinsi Mungu alivyoweka baraka, utakatifu, na pumziko siku ya Saba." },
      { title: "Amri ya Nne ya Mungu na Umuhimu Wake (Kutoka 20)", description: "Uchambuzi wa misingi ya amri na mbona inaanza na neno 'Kumbuka'." },
      { title: "Sabato Katika Maisha ya Taifa la Israeli", description: "Jinsi Sabato ilivyomtoa Israeli utumwani na kuwa ishara ya ukombozi wao." },
      { title: "Yesu Kristo na Sabato: Jinsi Alivyoiadhimisha na Kuitafsiri", description: "Kushinda unafiki wa Mafarisayo: Yesu alisema Sabato ilifanyika kwa ajili ya mwanadamu." },
      { title: "Sabato Katika Mitume na Kanisa la Kwanza", description: "Mwenendo wa mitume kama Paulo wa kusoma maandiko hekaluni kila siku ya kupumzika." },
      { title: "Mabadiliko ya Kihistoria ya Siku ya Ibada", description: "Uchambuzi wa kihistoria jinsi ibada ilivyohama kutoka Sabato kwenda siku ya kwanza ya juma." },
      { title: "Uhusiano wa Kiroho Mkuu Kati ya Sabato na Kupumzika", description: "Kuelewa Sabato kama ishara ya kiroho ya kutegemea wokovu wa bure wa Mungu." },
      { title: "Kusimamia Ukweli wa Biblia Juu ya Sabato kwa Hekima", description: "Kujadili mada hii bila ugomvi, upendo uwe mkuu ukivutia watu kuja kwenye ukweli." },
      { title: "Jinsi ya Kuiadhimisha Sabato kwa Vitendo Leo", description: "Miongozo ya kuacha shughuli za kawaida na kujazwa dhabahu ya sifa na maombi." },
      { title: "Sabato Kama Ishara ya Uhusiano Kati ya Mungu na Binadamu", description: "Mkataba thabiti unaotukumbusha ukaribu wetu na Muumba wa mbingu na nchi." },
      { title: "Maswali ya Kawaida na Hoja Mbalimbali", description: "Kujibu maswali thabiti kuhusu safari za dhari asubuhi, dharura za hospitali, nk." },
      { title: "Sabato ya Milele: Pumziko la Mwisho la Watu wa Mungu", description: "Ahadi thabiti katika kitabu cha Waebrania kuhusu kupumzika na Mungu milele na milele." }
    ];
  }

  if (normalizedTitle.includes("soma biblia") || normalizedTitle.includes("kozi ya kusoma biblia")) {
    return [
      { title: "Nguvu ya Neno la Mungu Katika Maombi na Kukiri Imani", description: "Jinsi ya kujenga hoja mbele za Mungu kwa kurudisha maneno Yake mwenyewe." },
      { title: "Mistari ya Kupigania na Kusimamia Kuhusu Ulinzi wa Maisha", description: "Zaburi 91, Zaburi 23 na mistari mingine inayofukuza maroho ya hofu usiku na mchana." },
      { title: "Mistari ya Hakika Katika Kushinda Hofu na Msongo wa Mawazo", description: "Isaya 41:10, Wafilipi 4:6-7 na jinsi ya kupokea amani kamili mioyoni mwetu." },
      { title: "Mistari ya Uponyaji wa Magonjwa na Afya ya Mwili", description: "Kutoka 15:26, 1 Petro 2:24 na kuelekeza imani yako kupokea uponyaji wa ki-Mungu." },
      { title: "Mistari ya Kufanikiwa Kiuchumi, Biashara, na Uhuru wa kifedha", description: "Kumbukumbu 28:1-14, Zaburi 1:1-3 na jinsi ya kuombea kazi za mikono yako nchini." },
      { title: "Mistari ya Kuombea Familia, Watoto na Ndani ya Nyumba", description: "Joshua 24:15, Isaya 54:13 na kuweka ulinzi juu ya maisha ya familia yako." },
      { title: "Mistari ya Kufunguliwa Kiroho Dhidi ya Vifungo na Laana", description: "Galatia 3:13, Yohana 8:36 na ushindi kamili uliopatikana msalabani." },
      { title: "Mistari ya Hekima, Maelekezo, na Kufanya Maamuzi Sahihi", description: "Yakobo 1:5, Mitume 3:5-6 na jinsi ya kuomba uongozi thabiti kwenye njia zako." },
      { title: "Jinsi ya Kutengeneza 'Diary ya Mistari' kwa Maombi", description: "Mpangilio thabiti wa kiutekelezaji mitaani unaomfanya mwombaji kuwa na bidii weledi." },
      { title: "Kuomba kwa Kutumia Ahadi za Mungu (Biblical Praying)", description: "Kanuni za kutokata tamaa: kulilia ahadi za Mungu mpaka majibu yapo mezani." },
      { title: "Jukumu la Kusubiri na Kuamini Ahadi kwa Uvumilivu", description: "Ebrania 10:35-36 na kujenga uvumilivu wa kiimani kutorudi nyuma." },
      { title: "Hitimisho: Kuishi Katika Ushindi Siku Zote kwa Simamo wa Neno", description: "Tuzo maalum ya kiroho kwa mwanafunzi aliyetambua uwezo mkubwa wa mistari unapoomba." }
    ];
  }

  if (normalizedTitle.includes("disaster management") || normalizedTitle.includes("family disaster")) {
    return [
      { title: "Utangulizi wa Disaster Management Katika ngazi ya Familia", description: "Kuelewa maana ya majanga na kwa nini maandalizi ya dharura yanaanzia nyumbani." },
      { title: "Kutathmini Hatari Mbalimbali Ndani na Nje ya Nyumbani", description: "Mbinu za kiusalama za kupitia nyumba yenu na kufuta vihatarishi vyote mapema." },
      { title: "Kuandaa Mpango wa Dharura wa Familia (Emergency Plan)", description: "Jinsi ya kuweka mahali pa kukutana dharura inapotokea, nambari thabiti za simu, nk." },
      { title: "Kudhibiti Majanga ya Kibinadamu (Mifarakano, Uchumi)", description: "Jinsi ya kusimama dhoruba ya kufukuzwa kazi au kukosa mitaji bila nyumba kuvunjika." },
      { title: "Kukabiliana na Majanga ya Kimaumbile (Moto, Mafuriko, nk)", description: "Zana rahisi za kuzuia moto, mbinu za uokoaji na mambo ya kuzingatia mafuriko yanatokea." },
      { title: "Kujenga Stoo ya Chakula ya Dharura na Vifaa vya Kwanza", description: "Uchambuzi wa vyakula vinavyodumu (offline food preservation) na First Aid Kit ya familia." },
      { title: "Mavazi ya Kinga, Usalama wa Maji, na Nishati", description: "Jinsi ya kusafisha maji machafu ya dharura kuwa salama, na kuandaa mifumo ya mbadala." },
      { title: "Kudhamini Usalama wa Mtandao na Taarifa za Siri", description: "Mwongozo wa kulinda nyaraka za kisheria za familia, hati za ardhi na kadi za benki kwa siri." },
      { title: "Saikolojia ya Kukabiliana na Hali ya Taharuki na Mshtuko", description: "Kujaza utulivu kwa watoto na wategemezi wakati dhoruba inazidi kihemko." },
      { title: "Kudumisha Umoja, Mawasiliano na Imani ya Kiroho", description: "Jukumu la maombi ya pamoja na ujasiri wa baba na mama wakati wa changamoto kuu." },
      { title: "Kujenga Uhusiano Mwema na Majirani", description: "Mbinu za kuunda mtandao wa usalama wa mtaa wenu ili kusaidiana wakati wa majanga." },
      { title: "Kurejea Katika Hali ya Kawaida (Post-Disaster Recovery)", description: "Hatua za kiuchumi na kisaikolojia za kujijenga upya kwa weledi baada ya kupoteza kila kitu." }
    ];
  }

  if (courseTitle === "Biashara") {
    return [
      { title: "Utambuzi wa Fursa za Biashara nchini Tanzania", description: "Jinsi ya kuona mahitaji ya jamii na kuyageuza kuwa fursa ya biashara yenye faida." },
      { title: "Jinsi ya Kufanya Utafiti wa Soko (Market Research)", description: "Jifunze kujua wateja wako ni akina nani, wanapenda nini, na wapo wapi." },
      { title: "Kuandaa Mchanganuo wa Biashara (Business Plan) Rahisi", description: "Mbinu rahisi ya kupanga malengo, mikakati, na makadirio ya kifedha ya mradi wako." },
      { title: "Vyanzo vya Mitaji na Jinsi ya Kuanza na Kidogo", description: "Mbinu za kupata fedha za kuanzia bila kutegemea mikopo migumu au yenye riba kubwa." },
      { title: "Mbinu za Mauzo na Uhusiano Mwema na Wateja", description: "Sanaa ya kushawishi, kufunga mauzo, na kufanya wateja wako wakupende daima." },
      { title: "Masoko ya Kidijitali na Matumizi ya Mitandao ya Kijamii", description: "Jinsi ya kutumia WhatsApp Business, Instagram, na Facebook kupata wateja wapya." },
      { title: "Kusimamia Mapato, Gharama na Faida Katika Biashara", description: "Nidhamu ya kuweka rekodi zote za fedha ili kujua kama biashara inakua au inakufa." },
      { title: "Kushindana Katika Biashara kwa Ubunifu na Bei Elekezi", description: "Mbinu za kukabiliana na washindani sokoni bila kujiingiza kwenye vita haribifu vya bei." },
      { title: "Sheria na Taratibu za Kusajili Biashara Tanzania", description: "Hatua za kupata Leseni, Tin Number ya TRA, na usajili rasmi wa BRELA nchini." },
      { title: "Kuboresha Chapa (Branding) na Mwonekano wa Biashara", description: "Jinsi ya kutengeneza logo, kufungasha bidhaa vizuri na kuongeza thamani yake." },
      { title: "Kudumisha Wateja na Kuongeza Vyanzo vya Mapato", description: "Kanuni za kuwafanya wateja warudi mara kwa mara na kuanzisha bidhaa mpya zinazosaidia." },
      { title: "Maadili katika Biashara na Siri za Kudumu kwa Muda Mrefu", description: "Uaminifu, heshima, na uadilifu kama nguzo kuu za kuaminika na kubaki sokoni daima." }
    ];
  }

  if (courseTitle === "Usimamizi wa Biashara") {
    return [
      { title: "Nguzo Kuu za Usimamizi wa Biashara wa Kisasa", description: "Fahamu majukumu yako kama meneja na kiongozi mkuu wa biashara yako." },
      { title: "Kupanga Mipango na Malengo ya Biashara (Planning)", description: "Mbinu za kupanga malengo ya kila wiki, mwezi na mwaka kwa ufanisi mkubwa." },
      { title: "Kuunda Mifumo Imara ya Kiutendaji (Business Systems)", description: "Jinsi ya kuanzisha taratibu zinazofanya biashara ifanye kazi hata usipokuwepo." },
      { title: "Usimamizi wa Huduma kwa Wateja na Uhifadhi Data", description: "Jifunze kukuza mahusiano madhubuti na kutunza siri pamoja na mawasiliano ya wateja." },
      { title: "Usimamizi wa Bidhaa, Stoo na Mnyororo wa Ugavi", description: "Mbinu za kudhibiti bidhaa zilizopo ili zisiharibike, kuisha, au kupotea." },
      { title: "Uthibiti wa Masuala ya Kifedha na Kuzuia Wizi", description: "Kanuni za fedha na mifumo mbalimbali inayodhibiti uhasibu na kupunguza upotevu." },
      { title: "Kuajiri, Kufundisha na Kusimamia Wafanyakazi", description: "Jinsi ya kuchagua timu sahihi ya kukusaidia kuendesha mipango ya kibiashara." },
      { title: "Kutathmini na Kuboresha Ufanisi wa Kiutendaji kila siku", description: "Mbinu za kupima tija ya biashara yako ili kujua eneo gani linahitaji maboresho." },
      { title: "Usimamizi wa Hatari na Kukabiliana na Kushuka kwa Soko", description: "Kujiandaa na changamoto za kiuchumi, mabadiliko ya kodi na kupungua kwa mauzo." },
      { title: "Matumizi ya Teknolojia na Programu za Kompyuta Kuendesha", description: "Programu mbalimbali za kusimamia mauzo (POS) na utunzaji rekodi za kidijitali." },
      { title: "Kukuza Biashara na Kupanua Masoko Ndani na Nje", description: "Jinsi ya kufungua matawi mapya au kupata mawakala thabiti wa kusambaza bidhaa." },
      { title: "Uongozi Bora Katika Biashara na Maamuzi Magumu", description: "Fikia kiwango cha ukomavu kama kiongozi na msimamizi thabiti wa kiuchumi." }
    ];
  }

  if (normalizedTitle.includes("tuombeje kulingana") || normalizedTitle.includes("tuombeje-mapenzi")) {
    return [
      { title: "Somo la 1: Utanguluzi wa Maombi na Maana ya Mapenzi ya Mungu", description: "Jifunze asili ya maombi na jinsi ya kupatanisha nia yako na mapenzi ya dhati ya Mungu." },
      { title: "Somo la 2: Siri ya Yohana wa Kwanza 5:14-15 na Imani Thabiti", description: "Uchambuzi wa kina wa kuomba kwa ujasiri ukijua kuwa Yeye anakusikia na kukujibu." },
      { title: "Somo la 3: Jinsi ya Kutambua Mapenzi ya Mungu Kabla ya Kuomba", description: "Mbinu za kusoma na kutafakari Neno la Mungu ili kugundua mapenzi Yake kabla ya kuwasilisha maombi." },
      { title: "Somo la 4: Maombi ya Bwana Yesu Bustanini Gethsemane (Luka 22:42)", description: "Jifunze somo kuu la kujisalimisha kwa mapenzi ya Mungu hata katikati ya mapambano makali." },
      { title: "Somo la 5: Vikwazo Vinavyozuia Majibu ya Maombi", description: "Kuchunguza dhambi, mashaka, na kuomba kwa nia mbaya (Yakobo 4:3) kama vizingiti vya majibu." },
      { title: "Somo la 6: Nguvu ya Neno la Mungu Katika Maombi (Yohana 15:7)", description: "Jinsi ya kutumia mistari ya Biblia kama msingi na hoja thabiti mbele za Mungu unapoomba." },
      { title: "Somo la 7: Kuomba kwa Roho Mtakatifu na Kuongozwa na Nuru Yake", description: "Nafasi ya Roho Mtakatifu katika kutuombea kwa kuugua kusikoweza kutamkwa (Warumi 8:26)." },
      { title: "Somo la 8: Maombi ya Shukrani na Sifa kama Ufunguo wa Majibu", description: "Jinsi ya kuingia malangoni Mwake kwa shukrani na nyuani Mwake kwa kusifu (Zaburi 100:4)." },
      { title: "Somo la 9: Tofauti ya Tamaa za Mwili na Mapenzi ya Mungu", description: "Kujitathmini kama maombi yetu yanahusu utukufu wa Mungu au tamaa zetu za kibinafsi." },
      { title: "Somo la 10: Kudumu Katika Maombi na Kusubiri kwa Subira", description: "Kuelewa nyakati za Mungu (Kairos) na umuhimu wa kutokata tamaa (Luka 18:1)." },
      { title: "Somo la 11: Mifano ya Mashujaa wa Maombi Katika Biblia Takatifu", description: "Tafakari kuhusu Danieli, Elia, na Ana na mbinu zilizofanikisha maombi yao ya kina." },
      { title: "Somo la 12: Kazi ya Nyumbani na Hitimisho Kuu la Kuomba Kulingana na Mapenzi Yake", description: "Mazoezi ya vitendo ya kuandika jarida la maombi na kuungana na dira ya Giniaz College." }
    ];
  }

  if (normalizedTitle.includes("kanuni za mungu") || normalizedTitle.includes("kanuni-mungu-uchumi")) {
    return [
      { title: "Somo la 1: Utanguluzi wa Uchumi wa Ki-Mungu na Uwakili (Zaburi 24:1)", description: "Kuelewa kuwa kila kitu ni mali ya Bwana na sisi ni wasimamizi (mawakili) tu." },
      { title: "Somo la 2: Kanuni ya Uaminifu Katika Kidogo na Kikubwa (Luka 16:10)", description: "Jinsi uaminifu katika mambo madogo unavyofungua milango ya utajiri mkubwa wa kiroho na kimwili." },
      { title: "Somo la 3: Sheria ya Kupanda na Kuvuna (2 Wakorintho 9:6)", description: "Kanuni ya ki-Mungu ya uwekezaji: anayepanda kwa uchache huvuna kwa uchache, na anayepanda kwa ukarimu huvuna kwa ukarimu." },
      { title: "Somo la 4: Zaka na Malimbuko: Ufunguo wa Madirisha ya Mbinguni (Malaki 3:10)", description: "Uchambuzi wa kisayansi na kiroho wa jinsi uaminifu katika kutoa unavyozuia mharibifu asiharibu mazao yetu." },
      { title: "Somo la 5: Kanuni ya Kazi kwa Bidii na Kupambana na Uvivu (Mithali 10:4)", description: "Biblia inavyohimiza utendaji kazi: mkono wa mwenye bidii hutajirisha, bali mkono mlegevu huleta umaskini." },
      { title: "Somo la 6: Hekima ya Kuweka Akiba na Bajeti ya Kiroho (Mithali 21:20)", description: "Hazina ya thamani na mafuta vimo katika nyumba ya mwenye hekima; jifunze nidhamu ya akiba kimaandiko." },
      { title: "Somo la 7: Madhara ya Madeni na Mbinu za Kujikwamua (Mithali 22:7)", description: "Kuelewa kuwa mkopaji ni mtumwa wa mkopeshaji na mbinu za kibiblia za kuishi maisha yasiyo na madeni." },
      { title: "Somo la 8: Kanuni ya Ukarimu na Kutoa kwa Wahitaji (Mithali 11:24-25)", description: "Kuna atawanyaye lakini huongezewa zaidi; jifunze nguvu ya siri ya ukarimu na baraka zake." },
      { title: "Somo la 9: Uadilifu na Uaminifu Katika Biashara na Kazi (Mithali 11:1)", description: "Mizani ya udanganyifu ni chukizo kwa Bwana; umuhimu wa biashara za haki na zenye maadili." },
      { title: "Somo la 10: Kuweka Hazina Mbinguni na Kutafuta Kwanza Ufalme", description: "Kuweka vipaumbele vyako sawa ili mafanikio ya kifedha yasiharibu uhusiano wako na Mungu (Mathayo 6:33)." },
      { title: "Somo la 11: Kupanga na Kuandika Maono ya Kifedha (Habakuki 2:2)", description: "Mbinu za kuandika maono na malengo ya kiuchumi ya muda mrefu ili yaweze kusomeka kwa urahisi." },
      { title: "Somo la 12: Kauli Mbiu na Maelekezo ya Kujenga Uchumi Thabiti Kiroho", description: "Hitimisho thabiti na ushauri wa kitaalamu kutoka kwa Joseph Marwa Kyama kwa wanafunzi wa Giniaz." }
    ];
  }

  if (normalizedTitle.includes("tunawezaje kukuza") || normalizedTitle.includes("kukuza-uchumi") || normalizedTitle.includes("kukuza ujumi")) {
    return [
      { title: "Somo la 1: Kujenga Msingi Imara wa Kifedha Chini ya Neno la Mungu", description: "Uchambuzi wa misingi ya kuanza safari ya kukuza uchumi ukiendeshwa na neno thabiti la Mungu." },
      { title: "Somo la 2: Kugundua na Kuendeleza Vipaji na Karama (Mathayo 25:14-30)", description: "Mfano wa talanta: jinsi ya kubadilisha karama zilizofichwa ndani yako kuwa vyanzo vya kukuza uchumi." },
      { title: "Somo la 3: Mbinu za Kuongeza Vyanzo vya Mapato Kimaandiko (Mhubiri 11:2)", description: "Gawa sehemu saba au hata nane: siri ya kuwa na mifumo mingi ya mapato ili kujikinga na majanga." },
      { title: "Somo la 4: Uwekezaji Salama kwa Hekima ya Kiroho na Kibiblia", description: "Jinsi ya kutambua fursa za uwekezaji zilizotajwa kwenye Biblia kama vile ardhi, mifugo, na kilimo." },
      { title: "Somo la 5: Jinsi ya Kuanzisha Biashara Yenye Baraka na Kibali cha Mungu", description: "Hatua za kiutendaji za kufungua biashara kwa kufuata kanuni za kimaadili na uaminifu mbele za Mungu." },
      { title: "Somo la 6: Kuweka Ushirikiano Thabiti wa Kibiashara na Kidini (Mithali 15:22)", description: "Umuhimu wa washauri wema na kujenga mtandao wa kibiashara wenye maadili ya ki-Mungu." },
      { title: "Somo la 7: Usimamizi Bora wa Rasilimali na Kupunguza Upotevu (Yohana 6:12)", description: "Kusanya vipande vilivyobaki visipotee; kanuni ya Yesu ya kupinga upotevu na kuongeza ufanisi." },
      { title: "Somo la 8: Matumizi ya Teknolojia na Akili ya Kazi Nchini Tanzania", description: "Kuchanganya maarifa ya kisasa ya kidijitali na maadili ya kikristo kukuza uchumi binafsi." },
      { title: "Somo la 9: Uvumbuzi na Ubunifu Unaoongozwa na Roho Mtakatifu", description: "Jinsi ya kupata mawazo ya kipekee ya kibiashara kupitia maombi na uvuvio wa Roho Mtakatifu." },
      { title: "Somo la 10: Kuwajengea Watoto na Kizazi Kijacho Urithi wa Kifedha", description: "Mtu mwema huwaachia wana wa wanawe urithi (Mithali 13:22); jinsi ya kupanga urithi thabiti." },
      { title: "Somo la 11: Ushindi Dhidi ya Hofu ya Kuanza na Changamoto za Mtaji", description: "Kuvunja roho ya hofu (2 Timotheo 1:7) na kuanza kwa ujasiri kwa kutumia kile ulichonacho mikononi mwako." },
      { title: "Somo la 12: Kukabidhi Miradi Yote Mikononi mwa Bwana (Mithali 16:3)", description: "Mkabidhi Bwana kazi zako, na mawazo yako yatathibitika; kufanya tathmini na kukabidhi matokeo." }
    ];
  }

  if (normalizedTitle.includes("waumini wengi") || normalizedTitle.includes("waumini wana feli") || normalizedTitle.includes("kwanini-waumini")) {
    return [
      { title: "Somo la 1: Uchambuzi wa Fikra Potofu za 'Umaskini ni Utakatifu'", description: "Kuvunja imani potofu zinazodai kuwa kuwa maskini ndiyo kuwa mtakatifu zaidi kimaisha." },
      { title: "Somo la 2: Ukosefu wa Maarifa na Elimu ya Fedha (Hosea 4:6)", description: "Watu wangu wanaangamizwa kwa kukosa maarifa; jinsi waumini wanavyokosa elimu ya msingi ya fedha." },
      { title: "Somo la 3: Roho ya Uvivu Iliyofichwa Kwenye Kivuli cha Maombi Pekee", description: "Kufunua uvivu wa kiutendaji ambapo mtu anaomba masaa 10 bila kufanya kazi ya mikono (2 Wathesalonike 3:10)." },
      { title: "Somo la 4: Kutokutofautisha Kati ya Miujiza ya Kiroho na Kanuni za Kazi", description: "Kuelewa kuwa miujiza haichukui nafasi ya kanuni za uaminifu, bidii na akili katika masuala ya kiuchumi." },
      { title: "Somo la 5: Matumizi Mabaya ya Pesa na Ukosefu wa Bajeti (Mithali 21:17)", description: "Kupenda anasa na matumizi ya sifa badala ya kuwekeza kwa tija; jinsi ya kudhibiti mfuko wako." },
      { title: "Somo la 6: Kuangukia Kwenye Madeni ya Kila Siku na Mtego wa Riba", description: "Kwa nini waumini wengi wanaishi kwa mikopo yenye riba kubwa bila mipango ya kulipa au kuwekeza." },
      { title: "Somo la 7: Tabia ya Kujilinganisha na Maisha ya Kifahari ya Bandia", description: "Kupambana na roho ya mashindano na kutaka kuonekana umefanikiwa wakati mfukoni kuna ukata." },
      { title: "Somo la 8: Kupuuza Kanuni za Uwekezaji na Kupenda Utajiri wa Haraka", description: "Kuingia kwenye mitego ya upatu, ramli za kifedha, au fursa za kitapeli kwa kukosa subira." },
      { title: "Somo la 9: Kukosa Nidhamu na Uaminifu Katika Zaka na Sadaka", description: "Uchambuzi wa kisaikolojia na kiroho wa jinsi ubahili unavyorudisha nyuma maendeleo ya kifedha." },
      { title: "Somo la 10: Kutowekeza Katika Kujifunza na Kujiongeza Ujuzi", description: "Mithali 4:7 - Hekima ndiyo jambo kuu; kwa nini kutojifunza mambo mapya kunasababisha kufeli katika uchumi." },
      { title: "Somo la 11: Vikwazo vya Kisaikolojia na Kiutamaduni Katika Jamii", description: "Mitazamo hasi ya kifamilia na kijamii inayokwamisha juhudi za kiuchumi za waumini nchini Tanzania." },
      { title: "Somo la 12: Hatua 5 za Haraka za Kujikwamua Kutoka Kwenye Kufeli Huku", description: "Mwongozo wa vitendo wa kufanya mapinduzi ya kiuchumi na kuanza kuishi maisha ya ushindi wa kifedha." }
    ];
  }

  if (normalizedTitle.includes("mapenzi ya mungu")) {
    return [
      { title: "Tuombeje Kulingana na Mapenzi ya Mungu?", description: "Mbinu za kuomba kwa usahihi na kupokea majibu kulingana na mapenzi ya dhati ya Mungu." },
      { title: "Kanuni za Mungu Zinazoongoza Uchumi", description: "Uchambuzi wa sheria na kanuni zote za ki-Mungu zinazosimamia uchumi na mafanikio ya kifedha." },
      { title: "Je, Tunawezaje Kukuza Uchumi Kulingana na Kanuni za Ki-Mungu?", description: "Hatua za vitendo za kukuza vipato vyetu na kuwekeza kwa mafanikio tukiongozwa na kanuni za ki-Mungu." },
      { title: "Kwa nini Waumini Wengi Wanafeli Kiuchumi?", description: "Uchunguzi wa kina wa sababu za kiroho, kifikra, na kiutendaji zinazowafanya waumini washindwe kifedha." }
    ];
  }

  if (normalizedTitle.includes("kuvuta/kuvutia uwepo wa mungu") || normalizedTitle.includes("kuvuta uwepo") || normalizedTitle.includes("kuvutia uwepo")) {
    return [
      { title: "Somo la 1: Utangulizi wa Uwepo wa Mungu na Umuhimu Wake", description: "Dhana ya uwepo wa Mungu na kwa nini ni nguvu kuu inayobadilisha maisha ya mwanadamu." },
      { title: "Somo la 2: Siri ya Kutengeneza Madhabahu Binafsi ya Maombi", description: "Jinsi ya kuandaa mahali, muda, na moyo thabiti ili kukutana na Mungu kila siku." },
      { title: "Somo la 3: Nguvu ya Toba na Utakaso katika Kuvuta Uwepo wa Mungu", description: "Kuelewa jinsi moyo safi na toba ya kweli inavyofungua milango ya mbingu." },
      { title: "Somo la 4: Uadhimishaji na Sifa Zenye Mvuto (Praise and Worship)", description: "Sanaa ya kusifu na kuabudu katika Roho na kweli kama njia ya haraka ya kushusha uwepo wa Mungu." },
      { title: "Somo la 5: Nidhamu ya Kufunga (Fasting) na Kuomba", description: "Jinsi ya kuutisha mwili ili kuongeza usikivu wa kiroho na kupokea nguvu mpya." },
      { title: "Somo la 6: Kutafakari Neno la Mungu (Meditation) na Kuishi Nalo", description: "Mbinu za kusoma na kutafakari Biblia mchana na usiku ili kuishi ndani ya uwepo Wake." },
      { title: "Somo la 7: Umuhimu wa Utulivu na Ukimya (Solitude and Silence)", description: "Kusimama mbele za Mungu kwa utulivu bila maneno mengi ili kuisikia sauti Yake ya upole." },
      { title: "Somo la 8: Kutembea katika Utii na Uaminifu wa Kila Siku", description: "Kuzingatia maagizo ya Mungu ili kudumisha uwepo Wake usiondoke katika maisha yako." },
      { title: "Somo la 9: Kushinda Vikwazo vya Uwepo wa Mungu (Dhambi, Kinyongo, na Mashaka)", description: "Uchambuzi wa mambo yanayoweza kufukuza uwepo wa Mungu na jinsi ya kujilinda nayo." },
      { title: "Somo la 10: Kuhudumia Uwepo wa Mungu katika Ibada za Pamoja", description: "Jinsi ya kuchangia katika kuleta na kusimamia uwepo wa Mungu kwenye ibada za kanisa au kikundi." },
      { title: "Somo la 11: Athari vya Uwepo wa Mungu Kwenye Uchumi na Huduma Yako", description: "Jinsi uwepo wa Mungu unavyoleta kibali, mafanikio ya kiuchumi, na mafuta ya utendaji." },
      { title: "Somo la 12: Hitimisho na Kuishi Maisha ya Uwepo wa Kudumu (Presence-Driven Life)", description: "Mpango kazi wa maisha ya kila siku yanayoongozwa na kutawaliwa na uwepo wa Mungu wakati wote." }
    ];
  }

  if (normalizedTitle.includes("prompts engineering") || normalizedTitle.includes("prompt engineering")) {
    return [
      { title: "Somo la 1: Utangulizi wa Prompt Engineering na Akili Bandia (AI)", description: "Misingi ya jinsi AI inavyofanya kazi na nafasi muhimu ya maelekezo (prompts) katika kuwasiliana nayo." },
      { title: "Somo la 2: Muundo wa Prompt Bora: Anatomy ya Prompt Imara", description: "Kuchambua sehemu kuu za prompt inayofanya kazi vizuri zaidi (jukumu, muktadha, maelekezo, na mfumo wa matokeo)." },
      { title: "Somo la 3: Mbinu ya Zero-Shot na Few-Shot Prompting", description: "Jinsi ya kuipa AI mifano au kutoiwekea mifano ili kupata majibu yenye ubora na usahihi wa hali ya juu." },
      { title: "Somo la 4: Mbinu ya Chain-of-Thought (CoT) Prompting", description: "Kuifundisha na kuielekeza AI kufikiri hatua kwa hatua ili kutatua matatizo magumu na makubwa ya kimantiki." },
      { title: "Somo la 5: Nguvu ya Persona na Role Prompting", description: "Jinsi ya kuipa AI jukumu maalum la kitaaluma (kama mhandisi au mhadhiri) ili kuboresha sana uzoefu na usahihi wa majibu yake." },
      { title: "Somo la 6: Kusimamia Muktadha na Vikwazo vya Tokeni (Context Window)", description: "Mbinu za kuandika maelekezo yanayozingatia mipaka ya kumbukumbu ya AI bila kupoteza maana au mwelekeo wa somo." },
      { title: "Somo la 7: Prompt Tuning na Uhakiki wa Majibu (Iterative Prompting)", description: "Hatua kwa hatua za kufanya majaribio, kurekebisha, na kuboresha prompts zako ili kupata matokeo unayoyataka." },
      { title: "Somo la 8: Mbinu za Juu: Prompt Chaining na AI Agents", description: "Jinsi ya kuunganisha prompts nyingi pamoja kwa mlolongo na kutengeneza mifumo ya AI inayoweza kufanya kazi yenyewe." },
      { title: "Somo la 9: Kuzuia Upotoshaji na Udanganyifu wa AI (Hallucination)", description: "Jinsi ya kuweka mipaka na kanuni thabiti ili kuizuia AI isitunge taarifa au data za uongo wakati wa kuandika." },
      { title: "Somo la 10: Matumizi ya Prompt Engineering katika Uandishi wa Ubunifu", description: "Mbinu za kutumia prompts kuzalisha makala zenye hisia, vitabu vyenye mtiririko mzuri, na picha za kipekee." },
      { title: "Somo la 11: Prompt Engineering kwa Wachambuzi wa Data na Waandishi wa Code", description: "Mbinu za kutumia AI kurahisisha uandishi wa code za programu, kusafisha data, na kutatua changamoto za kiufundi." },
      { title: "Somo la 12: Maadili, Usalama na Mustakabali wa Prompt Engineering", description: "Mpango kazi wa kutumia ujuzi huu kimaadili, kulinda data zako, na kujiandaa na mapinduzi makubwa ya teknolojia ya kesho." }
    ];
  }

  if (normalizedTitle.includes("tendo la ndoa tamu") || normalizedTitle.includes("jinsi ya kumuandaa mkeo") || normalizedTitle.includes("kumuandaa mkeo")) {
    return [
      { title: "Somo la 1: Utangulizi wa Mahusiano na Siri ya Tendo la Ndoa la Kupendeza", description: "Kuelewa umuhimu wa tendo la ndoa kama ibada, kiungo cha upendo na amani katika familia." },
      { title: "Somo la 2: Saikolojia na Maandalizi ya Kihisia ya Mwanamke (Emotional Foreplay)", description: "Jinsi ya kumuandaa mkeo kisaikolojia masaa mengi kabla ya tendo kupitia maneno mazuri na upendo." },
      { title: "Somo la 3: Kujenga Mazingira Tulivu na yenye Mvuto wa Kimahaba", description: "Umuhimu wa usafi, harufu nzuri, na mazingira tulivu chumbani katika kuchochea hisia za mkeo." },
      { title: "Somo la 4: Anatomia ya Kike na Kuelewa Maeneo ya Siri yenye Hisia Kali", description: "Uchambuzi wa kisayansi na kiroho wa maeneo nyeti ya mwili wa mkeo yanayohitaji mguso wa upole." },
      { title: "Somo la 5: Sanaa ya Mazungumzo ya Mahaba na Kushusha Presha (Dirty Talk & Sweet Nothings)", description: "Jinsi maneno ya faragha na sauti ya chini yanavyochochea hamu na kujenga ujasiri kwa mkeo." },
      { title: "Somo la 6: Hatua kwa Hatua za Maandalizi ya Kimwili (Physical Foreplay)", description: "Mbinu za vitendo za kushika, kukumbatia, na kubusu kwa upole ili kuamsha msisimko wa mkeo kwa asili." },
      { title: "Somo la 7: Umuhimu wa Muda na Kutofanya Haraka (The Art of Patience)", description: "Kwanini kasi ndogo na utulivu ni ufunguo mkubwa wa kumfanya mkeo afurahie na kuridhika kikamilifu." },
      { title: "Somo la 8: Mawasiliano ya Wazi Wakati wa Tendo la Ndoa", description: "Mbinu za kusikiliza lugha ya mwili ya mkeo na kuelekeza hisia kwa pamoja bila aibu au hofu." },
      { title: "Somo la 9: Kufikia Kilele cha Kuridhika (The Climax & Orgasm Dynamics)", description: "Uchambuzi wa kitaalamu na kiupendo jinsi ya kumsaidia mkeo kufikia kilele cha furaha na raha." },
      { title: "Somo la 10: Maisha ya Baada ya Tendo (Afterplay and Pillow Talk)", description: "Umuhimu wa kukumbatiana na kuongea kwa utulivu baada ya tendo ili kuimarisha kifungo cha ndoa yenu." },
      { title: "Somo la 11: Kushinda Changamoto za Kawaida za Tendo la Ndoa", description: "Kukabiliana na uchovu, msongo wa mawazo, na kupungua kwa hamu ya tendo kwa wanandoa." },
      { title: "Somo la 12: Mpango Kazi wa Kudumisha Moto wa Mapenzi na Furaha ya Kudumu", description: "Hatua za kiutendaji za kufanya kila siku ili ndoa yenu iendelee kuwa tamu na yenye msisimko wakati wote." }
    ];
  }

  if (normalizedTitle.includes("kumfanya mwanamke akupende") || normalizedTitle.includes("mbinu za kumfanya mwanamke") || normalizedTitle.includes("mwanamke akupende")) {
    return [
      { title: "Somo la 1: Utangulizi wa Saikolojia ya Kike na Asili ya Upendo", description: "Kuelewa jinsi mwanamke anavyofikiri, kuhisi, na kuamua nani anayestahili moyo wake." },
      { title: "Somo la 2: Nguvu ya Utulivu na Kujiamini (The Alpha Mystery)", description: "Jinsi sifa za uanaume imara, heshima, na ujasiri zinavyojenga mvuto usiozuilika kwa mwanamke." },
      { title: "Somo la 3: Sanaa ya Mawasiliano yenye Mvuto (Subtle Communication)", description: "Jinsi ya kuongea, kusikiliza kwa makini, na kumfanya ajisikie kuwa yeye ndiye wa pekee na wa thamani sana kwako." },
      { title: "Somo la 4: Jinsi ya Kuwa Kiongozi Katika Mahusiano (Masculine Leadership)", description: "Kusimamia vipaumbele na kuwa nguzo imara ya ulinzi na mwelekeo ambayo mwanamke anatamani kuitegemea." },
      { title: "Somo la 5: Siri ya Kujenga Udaku na Hamu ya Kukutafuta (The Art of Absence)", description: "Jinsi ya kutumia nafasi na umbali wa kimkakati ili kumfanya akuwaze, akumiss na kutamani kuwa karibu nawe." },
      { title: "Somo la 6: Kujenga Mvuto wa Kimwili na Mwonekano wa Nje (Visual & Presentation Appeal)", description: "Nidhamu ya mavazi, utanashati, na harufu nzuri kama vichocheo vya kwanza vya kuvutia upendo wake." },
      { title: "Somo la 7: Kujenga Kifungo cha Kihisia chenye Nguvu (Emotional Bonding)", description: "Jinsi ya kushiriki siri, ndoto, na kutoa msaada wa kihisia unaomfanya ajihisi salama kabisa mikononi mwako." },
      { title: "Somo la 8: Siri ya Kushangaza na Zawadi za Kushtukiza (The Element of Surprise)", description: "Mbinu za kipekee za kumfanyia mambo mazuri asiyoyatarajia ili kuweka upendo wake ukiwa hai kila siku." },
      { title: "Somo la 9: Kujenga Heshima Inayochochea Upendo wa Dhati", description: "Jinsi ya kuweka mipaka thabiti, kujiheshimu, na kumheshimu mkeo au mpenzi wako ili akuzingatie kwa uzito." },
      { title: "Somo la 10: Jinsi ya Kushinda Mashindano na Vikwazo vya Kijamii", description: "Kudumisha msimamo wako na kuwa chaguo la pekee lisilo na mbadala hata kukiwa na usumbufu wa nje." },
      { title: "Somo la 11: Jinsi ya Kukabiliana na Makosa Yetu kwa Hekima bila Kupoteza Thamani", description: "Mbinu za kuomba msamaha na kusimamia heshima yako hata unapoleta changamoto katika uhusiano." },
      { title: "Somo la 12: Hitimisho: Mpango wa Kudumu wa Kuwa Nanga ya Maisha Yake", description: "Jinsi ya kuishi kama mwanaume ambaye hawezi kuachika, anayehitajika kila siku, na anayeleta amani ya kudumu." }
    ];
  }

  if (normalizedTitle.includes("mtaji wa laki tano") || normalizedTitle.includes("laki tano kibaha") || normalizedTitle.includes("kutengeneza utajiri kwa laki tano") || normalizedTitle.includes("kibaha")) {
    return [
      { title: "Somo la 1: Utangulizi wa Fursa za Kibaha na Nguvu ya Mtaji wa Laki Tano (500,000 TZS)", description: "Kwa nini Kibaha ni eneo la kimkakati la kiuchumi nchini Tanzania na siri ya kuanza na kiasi kidogo cha laki tano." },
      { title: "Somo la 2: Saikolojia ya Kibiashara na Jinsi ya Kupanga Bajeti ya Laki Tano Kibaha", description: "Jinsi ya kugawa mtaji wako kwa usahihi kwa ajili ya bidhaa, usafiri, masoko na dharura bila kufanya makosa." },
      { title: "Somo la 3: Kilimo cha Mboga na Matunda (Vitunguu, Nyanya na Mboga za Majani) Kibaha", description: "Fursa za kilimo cha haraka katika maeneo ya Kibaha Vijijini na jinsi ya kupata faida kwa mtaji mdogo." },
      { title: "Somo la 4: Biashara ya Vyakula na Lishe (Mama Lishe, Chips, au Juisi ya Matunda Fresh)", description: "Mbinu za kufungua mradi wa chakula wenye mvuto, usafi, na faida ya haraka karibu na vituo vya usafiri au maeneo ya uzalishaji Kibaha." },
      { title: "Somo la 5: Ufugaji Mdogo wa Kuku wa Kienyeji na Mayai Kibaha", description: "Jinsi ya kuanza ufugaji rahisi nyumbani kwako kwa mtaji wa laki tano, kuanzia ununuzi wa vifaranga hadi lishe na masoko." },
      { title: "Somo la 6: Biashara ya Nguo, Mitumba na Viatu kutoka Karume/Mbagala Kwenda Kibaha", description: "Jinsi ya kufuata bidhaa za mitumba Dar es Salaam na kuziuza kwa faida kubwa katika masoko ya Kibaha (Maili Moja, Picha ya Ndege, n.k.)." },
      { title: "Somo la 7: Biashara ya Genge la Kisasa la Nafaka na Bidhaa za Matumizi ya Nyumbani", description: "Kuanzisha banda au genge la kisasa lenye utofauti, usafi wa hali ya juu, na huduma bora inayovutia wateja wa maeneo ya karibu." },
      { title: "Somo la 8: Mbinu za Masoko na Jinsi ya Kuvutia Wateja wa Kibaha na Pwani", description: "Jinsi ya kutumia mitandao ya kijamii, mabango rahisi, na ushawishi wa kibinafsi kupata wateja wa kudumu." },
      { title: "Somo la 9: Usimamizi wa Fedha, Akiba na Mbinu za Kutozungusha Mtaji", description: "Siri ya kutenganisha fedha ya biashara na matumizi ya kifamilia, na jinsi ya kuweka akiba ili kuongeza mtaji kila mwezi." },
      { title: "Somo la 10: Kukabiliana na Changamoto za Kibaha (Maji, Miundombinu na Kodi/Ushuru)", description: "Jinsi ya kupata suluhisho la changamoto za kawaida za eneo hili kwa hekima na kufuata taratibu zote za kisheria bila usumbufu." },
      { title: "Somo la 11: Mpango wa Kukuza Mtaji kutoka Laki Tano hadi Milioni Tano", description: "Hatua na mikakati ya kukuza mradi wako, kuwekeza upya faida uliyoipata, na kuongeza matawi au kubadilisha biashara kuwa kubwa zaidi." },
      { title: "Somo la 12: Hitimisho na Mpango Kazi wa Ushindi chini ya Giniaz College", description: "Ushauri wa mwisho wa chuo na kupewa miongozo ya vitendo ya kuanza safari yako leo ukiwa umejawa na ujasiri mkubwa." }
    ];
  }

  if (normalizedTitle.includes("mindfulness of god") || normalizedTitle.includes("mindfulness")) {
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

  if (normalizedTitle.includes("kinabii") || normalizedTitle.includes("viwango vya kinabii") || normalizedTitle.includes("kutamka neno") || normalizedTitle.includes("kuona kiroho")) {
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

  if (normalizedTitle.includes("kufunga na kufungua") || normalizedTitle.includes("kufunga na kufungua jambo")) {
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

  if (normalizedTitle.includes("ibada ya kikristo") || (normalizedTitle.includes("ibada") && normalizedTitle.includes("kikristo"))) {
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

  if (normalizedTitle.includes("kusafisha nyota") || normalizedTitle.includes("nyota yako")) {
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
    { title: `Utafiti na Mchakato wa ${prefix}`, description: `Mwongozo thabiti wa kiufundi kuelekea kubobea katika ${prefix}.` },
    { title: `Changamoto za Kawaida katika ${prefix}`, description: `Kutatua matatizo makubwa ambayo kila mtu anakutana nayo kwenye ${prefix}.` },
    { title: `Zana na Miundombinu ya ${prefix}`, description: `Mifumo ipi au softwares zipi unapaswa kuzitumia ili kufanikisha ${prefix}.` },
    { title: `Mifano ya Kiutendaji katika ${prefix}`, description: `Uchambuzi wa kesi halisi (case studies) nchini Tanzania kuhusiana na ${prefix}.` },
    { title: `Kuboresha Ufanisi wa ${prefix}`, description: `Njia rahisi lakini zenye nguvu katika kuongeza tija kulingana na misingi ya ${prefix}.` },
    { title: `Usimamizi wa Hatari kwenye ${prefix}`, description: `Kujilinda dhidi ya makosa ya kawaida na kupunguza hasara katika ${prefix}.` },
    { title: `Mbinu za Kitaalamu za ${prefix}`, description: `Siri za mabingwa wanaopata mafanikio makubwa kupitia kusanifisha ${prefix}.` },
    { title: `Ukuaji na Maendeleo Kupitia ${prefix}`, description: `Mbinu za kuongeza kiwango cha ufanisi wa ${prefix} kila siku.` },
    { title: `Nidhamu na Uthabiti wa Kiutekelezaji`, description: `Kuhakikisha unadumisha uendeshaji bora bila kurudi nyuma katika ${prefix}.` },
    { title: `Kuhitimu na Mapendekezo ya Kiutendaji`, description: `Hitimisho la kozi ya ${prefix} likijazwa na ushauri wa mwisho wa Mwalimu wako.` }
  ];
}

function generateUrgentFallbackContent(courseTitle: string, lessonTitle: string, instructorName: string): string {
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
  } else if (ct.includes("it") || ct.includes("hacker") || ct.includes("ai") || ct.includes("akili bandia") || ct.includes("technology") || ct.includes("creator") || ct.includes("app")) {
    category = "Teknolojia na Akili Bandia (AI)";
    field = "uundaji wa programu na matumizi ya mifumo ya kidijitali";
    focus = "ulinzi wa kidijitali, kupata viungo vya maudhui, na kutumia AI";
  } else if (ct.includes("mke") || ct.includes("mume") || ct.includes("mwanamke") || ct.includes("mwanaume") || ct.includes("familia") || ct.includes("social") || ct.includes("emotional") || ct.includes("hisia")) {
    category = "Uhusiano, Ndoa, na Malezi ya Familia";
    field = "saikolojia ya hisia kuanzia kiwango cha atomu";
    focus = "kuondoa unafiki na hasira, na kulinda usalama wa kihemko";
  }

  if (category === "Hekima ya Kiroho na Neno la Mungu") {
    let spiritualText = `Karibu katika somo la "${lessonTitle}".

SEHEMU YA KWANZA: UTANGULIZI WA KINA KULINGANA NA BIBLIA TAKATIFU
    
Katika somo hili linalobadilisha maana ya maisha, "${lessonTitle}", msingi wetu mkuu unajengwa juu ya Biblia takatifu. Tunajivunia kusimama pekee juu ya misingi isiyorudi nyuma ya Neno la Mungu.

Hapa tunaanza tukiwa na mistari thabiti yenye tarakimu mfululizo tanzu mwanzo kabisa:

1. Zaburi 119:105 - "Neno lako ni taa ya miguu yangu, na mwanga wa njia yangu."
Mwanafunzi wangu mpendwa, mstari huu unatukumbusha kuwa katika somo hili la "${lessonTitle}", kila hatua yetu lazima iongozedwa na nuru ya kimungu ili kuepuka giza la kidunia na kupata weledi halisi.

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
Suluhu ya Kwanza: Unapokabiliwa na uvivu wa kiroho asubuhi au ugumu wa maisha, chukua Biblia yako na usome; neno ndilo linaadibisha utu uzima wako uwe imara.

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

    return spiritualText;
  }

  // Pre-formatted rich templates to construct vast Swahili textbook chapter
  let text = `Karibu katika somo la "${lessonTitle}".

SEHEMU YA KWANZA: UTANGULIZI WA KINA

Siku ya leo tunakwenda kuchambua somo letu zuri sana linaloitwa "${lessonTitle}", likiwa ni sehemu ya mfululizo wa mafundisho ya kozi ya "${courseTitle}". Katika somo hili, nitakufunza hatua kwa hatua ili kukupa mwanga mkubwa utakaokuongoza katika maisha yako, iwe ni nyumbani au kazini.

Utafiti katika ulimwengu wa ${category} unaonyesha wazi kwamba mafanikio yanategemea sana uthibitishaji na kujiimarisha katika misingi ya ${field}. Chimbuko la somo hili nchini Tanzania na kote ulimwenguni linathibitisha kuwa wale wote wanaopuuzia nadharia hizi hukutana na hasara nyingi na msongo wa mawazo, wakati wale wanaoweka mifumo thabiti (operational systems) hushamiri na kupata faida ya kuaminika.

Ni lazima uelewe kuwa elimu hii tunayoitoa hapa si uigizaji wa tabia au kutafuta sifa za muda mfupi. Ni lazima ujifunze kujitawala, kuweka vipaumbele vilivyo wazi, na kusoma kila asubuhi ili kukuongezea weledi wa kiutendaji na kuondokana na utegemezi wowote ule.

SEHEMU YA PILI: UFAFANUZI MKUU WA NADHARIA & KANUNI

Katika chuo chetu, tunasisitiza kuwa hakuna jambo linalotokea kwa bahati mbaya. Kila uamuzi na matokeo kimaisha inaongozwa na misingi thabiti iliyofanyiwa utafiti wa kina.

Dhana ya kwanza kabisa ni nadharia ya asili ya mnyororo wa tija. Nadharia hii ya kupendeza inatufundisha kuwa kila sekunde ya siku yako lazima iunganishwe na malengo yako ya baadae ya kimaendeleo. Inapotokea uamuzi mdogo kimaisha kama kuweka akiba au kuamka mapema, ni kama kupanda mbegu ndogo ya mchicha kwenye udongo laini; matokeo yake yatakuwa ya kishujaa na ya kustajabisha sana.

Dhana ya kuaminika soko na jamii inaeleza kuwa ili ujengewe uaminifu mbele ya marafiki, wateja au hata mwenzi wako, ni sharti unyenyekevu thabiti utawale nafsi yako. Kuacha tabia za kizamani za kuwa na mihemko hasi au kupaza sauti (gombano) kunaimarisha ushawishi wako mkuu.

Dhana ya tatu ni mfumo wa kukuza tija na ulinzi endelevu wa rasilimali. Kama jinsi maji ya mto yanavyotiririka bila kurudi nyuma, biashara au familia yako lazima iongozedwa kwa kuandika taratibu rahisi za kazi ili kuhakikisha amani na kuzuia upotevu wa muda na mali zetu.

SEHEMU YA TATU: HATUA KWA HATUA ZA VITENDO

Ili kukupa mwongozo usio na mashaka, hapa chini kuna dondoo mfululizo za kiutendaji unazopaswa kuzifuata kuanzia leo asubuhi kujiimarisha:

`;

  const steps = [
    { title: "Kufanya Utafiti wa Msingi na Uchambuzi wa Mazingira", key: "Soma kwanza mazingira yanayokuzunguka kabla ya kufanya uamuzi makini kumlinda mradi." },
    { title: "Kuweka Malengo Maalum na Kupima Tija yake kila Wiki", key: "Andika malengo yanayopimika (KPIs) kwenye daftari lako la masomo ya chuo." },
    { title: "Kuzuia na Kudhibiti Kichochezi chochote cha Mihemko Hasi", key: "Inapotokea hasira au dharau, chukua nafasi ya kukaa kimya kulinda nishati yako." },
    { title: "Kujenga na Kuboresha Chapa (Branding and Presentation)", key: "Mwonekano wako na ufungashaji wa bidhaa ndio sura ya kwanza ya ueledi mbele ya soko." },
    { title: "Kuanzisha na Kusimama Mifumo ya Utunzaji Kumbukumbu", key: "Nyaraka, miamala, na miongozo ya kazi ihifadhiwe kwa usahihi wa kidijitali." },
    { title: "Kuandaa na Kusimamia Bajeti kwa Nidhamu", key: "Tenga asilimia 20 ya mapato yako kwa ajili ya uwekezaji endelevu na dhibiti matumizi." },
    { title: "Kuongeza Mapato kwa kutumia Masoko ya Kidijitali", key: "Elezea faida za kipekee za bidhaa au huduma yako kupitia mitandao chanya." },
    { title: "Kusimamia Uhusiano na kukuza Umoja kazini na Nyumbani", key: "Sikiliza wafanyakazi wako au mwenzi wako kwa ukarimu kukuza ushirikiano imara." },
    { title: "Kusoma Vitabu vya Hekima na Kujisomea kila Siku", key: "Tenga asubuhi ya leo kusoma kurasa tano za kuongeza maarifa ya kiutekelezaji." },
    { title: "Dumu katika Njia ya Mafanikio bila Kukata Tamaa", key: "Ujuzi huu tulionao hapa ni daraja dhabiti la kukuvusha kutoka mahali ulipo." }
  ];

  steps.forEach((s, i) => {
    text += `Hatua Ya ${i + 1}: ${s.title}
Mchakato wa kutenda unajumuisha hatua hii rahisi: ${s.key}
Hapa, mwanafunzi wangu, unapaswa kuelewa kuwa nidhamu ya kila wiki ndiyo siri inayotenganisha mabingwa na wachezaji wa kawaida. Epuka kufanya mambo haya kwa ushabiki; andika dondoo hizi na uanze nazo asubuhi ya leo ili upate matokeo makubwa kwenye ${focus}.

`;
  });

  text += `SEHEMU YA 4: MIFANO HALISI & KESI ZA KAZI

Kisa cha 1: Uboreshaji wa Uendeshaji Dar es Salaam (Kampuni ya Joseph Commodities LTD)
Mjasiriamali mmoja aliamua kufanyia kazi mbinu za somo hili la "${lessonTitle}" baada ya kupata hasara ya kibiashara mara nyingi sokoni Kariakoo. Aliondoa kabisa mihemko hasi na badala yake akaweka mifumo ya utunzaji kumbukumbu na doria za utendaji. Matokeo yake yalikuwa ya mshangao mkubwa sana; gharama za usafirishaji mahindi kutoka Mbeya zilipungua kwa asilimia 35 na faida yake ikakua upesi, akajenga utajiri thabiti kulingana na mafundisho yetu.

Kisa cha 2: Kuongeza Tija na sifa kwenye Usimamizi Dodoma (Kisa cha Dada Upendo)
Hapa Dodoma, kikundi cha ujasiriamali kilikuwa kikipata shida ya kupata wateja wa bidhaa zao kutokana na ukosefu wa chapa na ufungashaji bora. Baada ya kusoma mtaala wa "${courseTitle}" na kuelewa umuhimu wa kujiimarisha kwenye somo hili, waliboresha mwonekano wao na kuanza kufanya mauzo kwa dhati. Waliandikisha ongezeko kubwa la mapato na sasa wanaishi kwa amani tele katika ndoa zao.

Kisa cha 3: Uokoaji wa Uhusiano na Amani ya Familia jijini Arusha (Ndugu Baraka)
Ndugu huyu alikabiliana na janga kubwa la migogoro ya kifamilia iliyotishia kuleta msongo wa akili na magonjwa ya kisaikolojia. Alitumia mbinu za ulinzi wa kiroho na kufanya maombi ya pamoja ya siri, akisoma sura na miongozo ya kiungu kila asubuhi na kuweka utawala wa upendo. Migogoro yote iditoweka naye akarudisha amani ya dhati.

SEHEMU YA 5: CHANGAMOTO ZA KAWAIDA & SULUHU

Suala la kwanza la changamoto ni uchovu wa kuanza safari. Wengi huanza kwa bidii kisha huishia njiani kwa sababu ya kukosa malengo thabiti. Suluhu yake ni kuwa na daftari la kila siku la kurekodi maendeleo na kujiunganisha na wenzako ili kukua.

Suala la pili ni ushawishi wa marafiki wasiofaa na mihemko ya nje. Katika maisha utakutana na kelele na shutuma zisizo na msingi. Suluhu sahihi ni kuweka amani mioyoni, kutofanya mambo kwa pupa, na kukaa upande wa hekima ukitumia upendo kulipiza mabaya.

Suala la tatu ni uhaba wa rasilimali mwanzo wa mradi. Hili huleta hofu ya kushindwa. Suluhu ni kuanza na kile kidogo ulichonacho, kwa uaminifu usiotikisika, na kukuza mtaji wetu hatua kwa hatua.

SEHEMU YA 6: USHAURI WA KITAALAMU & MBINU ZA JUU

Wataalamu wetu waliobobezi hapa Giniaz College wanapendekeza mbinu mbili kuu za kukuza mafanikio yetu kuanzia leo.

Mbinu ya kwanza ni utawala wa asubuhi (Golden Morning Rule). Chagua asubuhi ya leo kusoma kurasa tano za kuongeza maarifa ya kiutekelezaji, kufanya tafakari kwa amani na kupanga kila kitu utakachofanya mchana huo. Hili linakuweka hatua moja mbele ya mpinzani wako.

Mbinu ya pili ni kujenga mtandao wa uadilifu (Integrity Network). Fanya mambo yako kwa uwazi, timiza ahadi zote unazotoa kwa wenzako, na hakikisha unadhibiti sifa ya jina lako kwa gharama yoyote.

SEHEMU YA 7: TAFAKARI KUU & KAZI YA NYUMBANI

Kama simulizi fupi ya ushuhuda, tunakumbuka kisa cha baba mmoja aliyekuwa hana ajira lakini kupitia nidhamu ya kujiandaa kila asubuhi na kuweka mifumo mizuri, aliweza kuajiri vijana tisa katika mradi wake mpya na kubadilisha kabisa maisha ya ukoo wake mzima. Haya ni matunda ya kuamini na kutenda kwa uadilifu nchini Tanzania.

Tafakari ya leo: Je, upo tayari leo kuacha tabia za kizamani za kubahatisha na badala yake uanze kusimamia maisha yako kwa ufasaha mkuu na busara inayopendeza?

Kazi yako ya nyumbani ya vitendo: Wiki hii nzima, chukua nusu saa kila asubuhi na uandike mambo matano mazuri uliyoyatekeleza na yale uliyoweka mifumo thabiti kujiimarisha.

Mwanafunzi wangu, nakusihi uendelee na masomo yote kwa bidii na uaminifu mkubwa chini ya usimamizi thabiti wa Giniaz College! Kauli mbiu ya chuo chetu ikiwa daima ni: "Giniaz College: Elimu ya Akili, Upendo na Busara Isiyo na Mipaka chini ya upendo mkuu wa Joseph Marwa Kyama!"

Kazi hii imezingatia viwango vikubwa vya kiutafiti na imerejelewa kutoka kwa chuo chetu ili kukusaidia kusimama na kukua kila siku.`;

  let details = "";

  if (courseTitle === "Mwanamke wa Hisia") {
    if (lt.includes("tambua") || lt.includes("awali") || lt.includes("mjue")) {
      details = `
Uchambuzi wa Mwanamke wa Hisia (Kiwango cha Atomu):
Mwanamke wa hisia si mtu mdhaifu au mnyonge. Kati ya kundi la wanawake wote duniani, yeye ana sifa ya kipekee ya kuwa na ulimwengu wa ndani ulioundwa vizuri mno katika upokeaji wa taarifa na hisia za kisaikolojia.

1. Alama Maalum za Kumtambua:
- Uwezo mkubwa wa kuelewa na kujali hisia za watu wengine (Highly Empathic).
- Kuguswa upesi sana na upendo, huzuni, uzuri wa mazingira, sanaa na fasihi thabiti.
- Kuchukia kwa kiwango kikubwa uigizaji wa tabia, unafiki au kutokuaminika.
- Hitaji la kuwa na utulivu na amani ya nafsi mara kwa mara ili kurejesha nishati yake ya kiroho.

2. Kiwango cha Atomu Maishani:
Nishati yake kiatomiki huathiriwa upesi sana na mazingira yanayomzunguka. Ikiwa mazingira ni hasi (toxic), anaweza kupata uchovu wa haraka lakini iwapo mazingira yana upendo, yeye hushamiri, huonyesha upendo na kuleta kicheko kikuu kwenye maisha.`;
    } else if (lt.includes("nguvu") || lt.includes("piasili")) {
      details = `
Nguvu Kubwa za Kiasili za Mwanamke wa Hisia:
Nishati uliyonayo ni baraka kubwa sana unayopaswa kujivunia kila siku.

1. Nguvu Zako Kuu:
- Intuition ya Kipekee: Una uwezo wa kuhisi ukweli, kupata hisia ya jambo kabla halijatokea na kutambua nia ya pili ya mtu. Hii inakulinda dhidi ya uongo.
- Uwezo wa Kushawishi kwa Upendo: Watu huvutiwa sana na wewe kwa sababu unawajali kwa dhati na kusikiliza masuala yao bila dharau.
- Ubunifu Mkubwa: Ulimwengu wako wa ndani hukupa picha bora za kubuni vitu vipya nchini.

2. Jinsi ya Kuzitumia Nguvu Hizi:
Sikiliza sauti yako ya ndani wakati wa kufanya maamuzi makubwa ya uwekezaji au migogoro ya kifamilia. Tumia uwezo wa huruma kujenga na kudhibiti timu yako ya biashara badala ya kuwalazimisha kwa ukali.`;
    } else if (lt.includes("udhaifu") || lt.includes("kuutumia")) {
      details = `
Kuchakata Udhaifu wa Mwanamke wa Hisia:
Kila mtu ana upande wa udhaifu, siri ni jinsi gani unavyoboresha na kuuonganisha na maisha yako.

1. Udhaifu wa Kawaida:
- Kushindwa kuweka mipaka ya kimaisha, na hivyo kutoa upendo hata kwa watu wasio na shukrani.
- Kupata athari kubwa ya hasira au chuki panapotokea mifarakano.
- Kuingiza mambo yote ya kikazi au ya kijamii kifuani hadi kupoteza amani na usingizi.

2. Mbinu za kuugeuza Udhaifu kuwa fursa:
- Jifunze kusema 'ZILIZO' (Hapana) kwa mazingira yatakayovunja amani yako.
- Elekeza hisia hizo za ndani kwenye miradi makini ya ubunifu kama uchoraji, uandishi wa fasihi au uendeshaji biashara inayosaidia wanadamu kupata suluhu.`;
    } else if (lt.includes("ndoa") || lt.includes("mapenzi")) {
      details = `
Mwanamke wa Hisia Katika Ndoa na Uhusiano:
Kama mke na mwenzi wa maisha, upendo wako ni nguzo iliyojaa kina, heshima na ujasiri usioelezeka.

1. Mahitaji yako Makubwa:
Usalama wa kihemko ndiyo ngao kuu inayokuwezesha kufurahi na kumuunga mkono mwenzi wako kwa asilimia mia moja. Ikiwa kuna dharau, kelele na shutuma zisizo na msingi, utaanza kunyong'onyea.

2. Miongozo ya Kutengeneza Ndoa ya Furaha:
- Jifunze kuzungumza na kueleza unajisikiaje kuhusu jambo badala ya kukaa kimya ukitarajia mwenzi wako atagundua wenyewe.
- Chagua mwenzi anayejali ukarimu, hisia na upande wa kihemko wako, au ufundishe kwa upole jinsi ya kulea nafsi yako.`;
    } else if (lt.includes("familia") || lt.includes("watoto") || lt.includes("malezi")) {
      details = `
Usimamizi wa Familia na Malezi kama Mwanamke wa Hisia:
Nafasi yako kama mama au mlezi inagusa roho za kizazi chako kipya.

1. Malezi yenye Tija:
Watoto wako watafundishwa kujali wanadamu wenzao, kuwa wabunifu na kuwa na adabu kwa kuwa unafanya hivyo kwa vitendo kila sekunde.

2. Tahadhari katika Malezi:
- Epuka kulea kwa hisia pekee; changanya huruma yako na msimamo madhubuti pamoja na nidhamu sahihi kuelekea ukuaji wao.
- Toa malezi yanayowasaidia kujitegemea kiuchumi, kiakili, na kijamii huku wakiheshimu misingi ya chuo chetu.`;
    } else if (lt.includes("kazi") || lt.includes("jamii")) {
      details = `
Mwanamke wa Hisia Kazini na Kwenye Jamii:
Katika mazingira ya ofisi au soko la Tanzania, hisia zako ni kiungo muhimu sana.

1. Mchango wako vya Kikazi:
Unajenga urafiki mzuri na wateja wako, unajua jinsi ya kushirikiana na wafanyakazi wenzako kwa sababu una uwezo wa asili wa kusoma anga ya kiofisi.

2. Mbinu za Kufanya Kazi kwa Ufanisi:
- Usiruhusu mtazamo hasi au shutuma za watu zikuondolee hari ya kujenga kesho yako.
- Fanya kazi kwa nidhamu ya hali ya juu ikiwa ni pamoja na kufuatilia malengo kwa vitendo na si kwa mihemko pekee.`;
    } else if (lt.includes("ibada") || lt.includes("imani") || lt.includes("kiroho")) {
      details = `
Kuimarisha Kiroho: Mwanamke wa Hisia kwenye Ibada:
Uhusiano wako na Muumba wako ndio chanzo cha kila nishati na uthabiti ulionao.

1. Ibada kama Kituo cha Kupooza Nafsi:
Unapopata changamoto za kimaisha, kukimbilia madhabahuni, kufanya maombi ya siri na sifa husafisha nishati zako zote hasi na kukujaza nguvu mpya.

2. Mifumo ya Maisha ya Kiroho:
Weka utaratibu wa kuwa na nusu saa kila siku ya kuwa peke yako, kusoma maandiko yenye hekima, na kutoa shukrani za dhati kutoka rohoni ili kukabili kesho yako kwa ushindi.`;
    } else if (lt.includes("vipaji") || lt.includes("vipaumbele") || lt.includes("wasiopenda")) {
      details = `
Vipaji, Vipaumbele na Udhibiti wa Mambo Usiyopenda (Mwanamke wa Hisia):
Katika somo hili la kipekee tanzu tangu kiwango cha atomu, tutachambua vipaji vyako, kupanga vipaumbele thabiti, na jinsi ya kukabiliana na mambo usiyoyapenda ili kulinda nishati yako ya kihemko na uongozi sahihi.

1. VIPAJI VYA KIPEKEE VYA KIUMBE CHAKO:
- Una uwezo mkubwa katika uandishi wa fasihi na mashauri, saikolojia ya uhusiano, ushauri nasaha wa kifamilia, uchoraji, pamoja na ujasiriamali wa bidhaa za asili za urembo na chakula cha afya.
- Tenga saa moja kila siku kukuza na kuonyesha kipaji chako, na kukiunganisha na soko ili kianze kukupa matunda ya kifedha na kujenga utajiri.

2. KUPANGA VIPAUMBELE MAISHANI:
- Usikubali kufanya kila wazo; elekeza nguvu zako zote kwenye mambo matatu unayoyapenda zaidi.
- Weka kipaumbele cha kwanza kuwa ni Uchumi wako, cha pili kuwa ni Afya ya akili na mwili wako, na cha tatu kuwa ni Uhusiano na familia yako. Linda mambo haya matatu kwa nidhamu ya hali ya juu!

3. MAMBO ASIYOPENDA (VICHOCHEZI HASI) NA JINSI YA KUJILINDA:
- Mwanamke wa hisia hapendi kupigiwa kelele au kudharauliwa kisaikolojia mbele ya watu, kashfa zisizo za haki, na kupuuza au kuchezea hisia zake za dhati na wanafiki wasio na malengo thabiti.
- Jinsi ya Kujilinda: Jenga nidhamu ya kiwango cha juu kwa kukataa kubishana nao, geuza mawasiliano kuwa ya kifupi na ya kimkakati tu, na uweke utulivu mbele ya kelele zao kukuza amani ya moyo wako.`;
    } else if (lt.includes("uchumi")) {
      details = `
Mwanamke wa Hisia Kwenye Uchumi:
Uchumi ni nguzo muhimu ya kukuondolea utegemezi nchini Tanzania na kujenga mustakabali sahihi.

1. Kanuni Kuu za Uchumi:
- Dhibiti Bajeti kwa Ubongo si kwa Hisia: Epuka kununua vitu ili kuboresha hisia zako za muda mfupi (Emotional/Impulse buying).
- Fuatilia kila Shilingi kwa usahihi kwa kutumia daftari au application ya kifedha ili kuzuia kuvuja kwa nishati ya kipato.

2. Mipango ya Maendeleo:
Kila asubuhi, tafakari thamani ya rasilimali zako na jinsi unavyoweza kupata faida kwa kubana matumizi yasiyo na tija au dhumuni maalum maishani.`;
    } else if (lt.includes("utajiri")) {
      details = `
Sanaa ya Kujenga Utajiri kwa Mwanamke wa Hisia:
Kujenga utajiri kunahitaji mfumo thabiti na unaoeleweka wa uwekezaji endelevu.

1. Uwekezaji Wenye Huruma na Tija:
- Unaweza kuanzisha miradi makini inayotatua shida ya wanajamii kama shule, kliniki, duka la lishe bora au mifumo ya kielimu.
- Tumia uwezo wako wa kipekee wa kusoma soko uanzishe miradi yenye mguso wa kiutu na kijamii nchini.

2. Kukuza Akiba na Mzunguko:
Jifunze kuweka asilimia 20 ya kipato chako kila mwezi kwenye akaunti ya uwekezaji ili ujenge kesho thabiti kwako na familia yako.`;
    } else if (lt.includes("elimu") || lt.includes("vitabu") || lt.includes("nyimbo")) {
      details = `
Upande wa Elimu, Vitabu Vinavyomfaa na Nyimbo Anazopenda (Mwanamke wa Hisia):
Kuelimika, kujiimarisha na kulisha nafsi yako kwa fasihi na muziki sahihi ni daraja madhubuti unalolipata hapa Giniaz College kukuokoa dhidi ya makosa na kuondoa magonjwa ya kisaikolojia.

1. MARAFA ENDELEVU NA ELIMU YA HIARI:
- Elimu ya sasa inakutaka kuelewa saikolojia ya kihisia (emotional intelligence). Jielimishe kujitawala hisia zako na kuongozwa na hekima pamoja na nidhamu ya hali ya juu maishani.
- Soma kila asubuhi na kuweka utamaduni wa kusikiliza mafunzo yenye tija ya kielimu na kibiashara.

2. VITABU VINAVYOMFAA MWANAMKE WA HISIA:
- Soma vitabu vitakavyokuelimisha na kulisha nafsi ya ndani kama "Quiet: The Power of Introverts" cha Susan Cain (Kuelewa nguvu ya ukimya na utulivu).
- Pia soma fasihi za uongozi bora, falsafa na uendeshaji uchumi binafsi. Tenga kurasa tano hadi kumi kila asubuhi kusoma.

3. NYIMBO WANAZOPENDA NA MUZIKI UNAOLIPONYA MOYO:
- Mwanamke wa hisia hurejesha nishati yake kwa kusikiliza muziki wa taratibu, wa ala pekee (instrumental scores) na sauti za asili (asili ya milio ya maji na upepo).
- Nyimbo za kiungu (choir hymns) husafisha anga yake ya kisaikolojia na kuondoa chovu ya kimaisha. Tengeneza playlist ya nyimbo hizi maalum ukiwa nyumbani, kazini au unaposafiri.`;
    } else {
      details = `
Kujijenga Kuwa Toleo Bora Zaidi la Maisha Yako:
Katika chuo chetu cha Giniaz College tunakuza ufanisi wa kimaadili, utofauti, na umakini.

1. Kanuni ya Kujijenga:
- Kila asubuhi andika mambo matatu unayoshukuru ili kuanza na mtazamo thabiti chanya.
- Soma angalau kurasa tano za kitabu chenye kukuelimisha.
- Jiwekee utaratibu wa kutunza mwili wako kwa mazoezi, chakula bora na mapumziko ya kutosha.

2. Ushauri Maalum wa Mwalimu Kyama:
Safari yako ya kujifunza ni daraja thabiti la kukuokoa dhidi ya mitego ya kisaikolojia. Amini katika kusudi lako, na fanya kazi kila asubuhi kwa nidhamu kuu ya kiatomu!`;
    }
  } else if (courseTitle === "Mwanaume wa Hisia") {
    if (lt.includes("tambua") || lt.includes("awali") || lt.includes("mjue")) {
      details = `
Utambulisho wa Mwanaume wa Hisia (Kiwango cha Atomu):
Mwanaume wa hisia ana mfumo wa kipekee wa kihemko unaomwezesha kufikiri na kutenda kwa ubinadamu na huruma ya dhati sana kuliko kawaida ya wanaume wengine ambao hawajali hisia.

1. Sifa Kubwa za Kumtambua:
- Uwezo mkubwa wa kuchunguza na kutatua changamoto za kifamilia na kiofisi kwa unyenyekevu thabiti.
- Ni mkimya lakini mchunguzi thabiti wa mazingira na nia za wanadamu.
- Anathamini maongezi yenye kina na kuchukia kwa kiwango kikubwa dharau, kelele na unyanyasaji wa kiakili.

2. Mwanaume huyu katika Jamii:
Katika soko la kiuchumi nchini, mwanaume mwenye hisia zilizokomaa huchaguliwa kuwa kiongozi bora kwa sababu haguswi na ubinafsi pekee bali maendeleo ya jumuiya nzima kuanzia kiwango cha kiatomu.`;
    } else if (lt.includes("nguvu") || lt.includes("piasili") || lt.includes("kuongoza")) {
      details = `
Nguvu Kuu za Kiasili za Mwanaume wa Hisia:
Baraka yako ya maisha iko ndani ya ulimwengu wako wa kihemko unaokupa nishati sahihi ya kuongoza maisha bora.

1. Nguvu Zako Mahususi:
- Uongozi wa Kiutu: Huwa unaongoza kwa kugusa mioyo na si kwa kulazimisha kwa mabavu, hivyo ukitengeneza mifumo utapata wafuasi waaminifu kwa urahisi mno.
- Uvumilivu na Ustahimilivu: Una uwezo wa kusikiliza pande zote bila kutoa hukumu ya haraka.
- Umakini wa Kina: Unachanganua kazi na miradi yako kwa makini ili isilete hasara.

2. Jinsi ya Kuzitumia:
Weka mbinu hizi za ukarimu na utulivu kwenye uongozi wako wa biashara na kazi. Tumia ubunifu wako asilia kuanzia miradi mikubwa inayochochea soko la kiuchumi.`;
    } else if (lt.includes("udhaifu") || lt.includes("kuutumia")) {
      details = `
Kujenga Uthabiti (Kurekebisha Udhaifu wako):
Kujua udhaifu ni hatua kuu ya kwanza ya kuwa shujaa usioshindwa maishani.

1. Udhaifu unaweza kujitokeza kwenye:
- Kubeba chuki za ndani na kunyamaza kwa muda mrefu badala ya kutatua tatatizo.
- Kuruhusu hasira ya chini kwa chini kupoteza amani yako ya kazi au familia.
- Hofu kubwa ya kukosolewa au kukataliwa kijamii.

2. Jinsi ya Kuumiliki na Kuugeuza kuwa Ushindi:
Jenga nidhamu thabiti binafsi ya kuzungumza ukweli upesi kwa upole na heshima. Unapokabiliwa na hasira, chukua nafasi ya kukaa mbali na kelele na baada ya hapo jadili jambo hilo kwa ukomavu kamili kiume.`;
    } else if (lt.includes("ndoa") || lt.includes("mapenzi")) {
      details = `
Mwanaume wa Hisia Kwenye Ndoa na Uhusiano:
Kama kiongozi wa ndoa, upendo wako unapaswa kuwa na usalama na ulinzi thabiti wa kihisia.

1. Wajibu wa Ndani:
Mkeo anahitaji kujua kuwa una uwezo wa kumlinda kiroho, kimwili na kisaikolojia. Epuka kuwa mwanaume mwenye mhemko usiotabirika (mood swings) ambao unaleta hofu ndani ya nyumba.

2. Miongozo ya Ndani na Mapenzi:
- Sikiliza mkeo kwa dhati na kumhamasisha kueleza mahitaji yake ya kihemko.
- Simama kama ngao imara dhidi ya maneno mabaya kutoka nje ya familia yako ili kulinda sifa na amani ya nyumbani kwako.`;
    } else if (lt.includes("familia") || lt.includes("watoto") || lt.includes("baba") || lt.includes("kiongozi")) {
      details = `
Uongozi wa Familia na Baba Bora kama Mwanaume wa Hisia:
Baba mwenye hisia ni baraka ya kipekee sana kwa kizazi chote kinachorithi jina lake.

1. Jukumu lako Msingi:
Unasaidia watoto wako kujenga nidhamu ya kimaisha kwa kuwa una uwezo mkubwa wa kulea roho zao na si kulisha miili pekee.

2. Kanuni za Kiongozi wa Familia:
- Weka mipaka na sheria thabiti za nyumbani lakini zilizojazwa na upendo na mawasiliano ya pande zote mbili.
- Ongoza kwa mifano ya vitendo katika kufanya kazi kwa bidii, kutunza nidhamu ya pesa na kuheshimu ndugu zako.`;
    } else if (lt.includes("kazi") || lt.includes("biashara")) {
      details = `
Mwanaume wa Hisia Kwenye Kazi na Biashara:
Uwanja wa soko unahitaji mwanaume makini anayejua kusimama thabiti mbele ya changamoto kuu.

1. Kujiweka Sawa Kiofisi:
Epuka kuingiza mihemko yako binafsi kwenye meza ya uamuzi wa kikazi au kibiashara. Fanya kila maamuzi kulingana na takwimu soko na mifumo thabiti.

2. Kujenga Maingiliano Bora:
Tumia nguvu yako ya kusikiliza wanadamu kujenga timu yenye mshikamano mkubwa ambayo isaidie sekta ya biashara nchini Tanzania.`;
    } else if (lt.includes("ibada") || lt.includes("imani") || lt.includes("kiroho")) {
      details = `
Maisha ya Kiroho na Madhabahu ya Mwanaume wa Hisia:
Uthabiti wako wa asili kiume unaongozwa na misingi thabiti uliyoiweka katika imani yako na Muumba.

1. Kiongozi wa Kiroho Nyumbani:
Ongoza familia yako katika kufanya maombi ya pamoja, kumshukuru Muumba na kutenda mema kwa watu wasiojiweza katika jamii.

2. Amani ya Moyoni:
Tafuta nafasi asubuhi ya mapema kuwa peke yako, fanya ibada yako ya siri ambayo itakupa uvumilivu na umakinifu wa kutosha wa kukabiliana na mikiki ya maisha tanzu tangu ngazi ya kiatomu.`;
    } else if (lt.includes("vipaji") || lt.includes("vipaumbele") || lt.includes("wasiopenda")) {
      details = `
Vipaji, Vipaumbele na Udhibiti wa Mambo Usiyopenda (Mwanaume wa Hisia):
Katika somo hili thabiti tangu kiwango cha atomu, tutachambua vipaji vyako vya kiume, kupanga vipaumbele imara vya utendaji, na jinsi ya kudhibiti mambo usiyopenda ili kulinda amani na utulivu wako wa kiume.

1. VIPAJI VYA KIUME VYA KIUBUNIFU:
- Unaweza kubobea katika ushauri wa uwekezaji, saikolojia ya jamii au familia, utungaji wa maandishi bora ya kifasihi na kazi za kiubunifu, sanaa za uoni, pamoja na uongozi bora wa watu kulingana na maadili yetu.
- Tenga muda kila wiki kukuza na kufanya fani yako kuwa suluhisho dhabiti ambalo soko na jamii inalihitaji ukiwa unajenga utajiri.

2. RATIBA NA VIPAUMBELE VYA KIUME:
- Weka ratiba sahihi na ya nidhamu ili kulinda nishati yako ya kiume. Siku zote chagua mambo manne makubwa: Uchumi wako binafsi, Afya yako ya akili na mwili, Ulinzi thabiti wa Familia yako, na Kazi au Biashara yako.
- Epuka kusumbuka naye mambo madogo yasiyo na tija au dhumuni. Katika chuo chetu, tunasisitiza kuwa mwanaume mwenye msimamo lazima ajifunze kusema 'KHASAN' (Hapana) au kusema 'KIKWELI HAPA HAPANA' kwa mambo yote yanayopunguza nguvu na heshima yake ya kiume bila hatia.

3. MAMBO ASIYOPENDA (KULINDA AMANI YAKO):
- Mwanaume wa hisia hapendi kelele zisizo na tija, malumbano yasiyo na mwisho, tabia za unafiki na kukosa heshima kwa misingi ya kiutu na kiume, dharau au shutuma za uwongo kiofisi au kifamilia.
- Mbinu ya Ushindi: Epuka kupoteza nguvu kubishana na watu bwege au wasio na fikra chanya. Chagua kusema ukweli upesi ukiridhika kabisa, kisha weka mazingira ya kuwa mbali nao kukuza kesho thabiti.`;
    } else if (lt.includes("uchumi")) {
      details = `
Mwanaume wa Hisia Kwenye Uchumi:
Uchumi ndio nguzo na msingi unaompa mwanaume sauti na mamlaka ya kulinda na kusimamia familia yake vizuri.

1. Nidhamu ya Kifedha ya Kiume:
- Jenga nidhamu thabiti ya pesa kwa kuacha tabia ya kufanya matumizi makubwa ya sifa au kuvutia watu (ego-spending).
- Epuka kufanya maamuzi ya kifedha kwa haraka ya kihemko bila kuchunguza takwimu na uhakika soko.

2. Usimamizi wa Kipato:
Kuweka malengo madhubuti na kufuatilia matumizi ya kila asubuhi maishani mwako kunakupatia heshima na weledi wa hali ya juu na kuondoa hatari ya utegemezi nchini.`;
    } else if (lt.includes("utajiri")) {
      details = `
Mwanaume wa Hisia na Ujenzi wa Utajiri:
Ujenzi wa utajiri unahitaji akili ya kimkakati na kuweka mifumo inayozalisha pesa bila ushiriki wako wa moja kwa moja daima.

1. Kuongeza Mzunguko wa Pesa:
Mwanaume bora huweka mifumo ya kuendesha uchumi wake bila utegemezi wa upande mmoja. Unganisha hisia zako na mbinu za kiuchumi: anza kuwekeza asilimia 25 ya mapato yako kwenye vyanzo vinavyozalisha kipato cha ziada kila mwezi.

2. Mifumo ya Kiubunifu:
Tumia elimu yetu unayoipata hapa ili kupata mbinu kwa kuanza kuwekeza kwenye miradi ya kiatomu kama kilimo biashara au majengo.`;
    } else if (lt.includes("elimu") || lt.includes("vitabu") || lt.includes("nyimbo")) {
      details = `
Upande wa Elimu, Vitabu Vinavyomfaa na Nyimbo Anazopenda (Mwanaume wa Hisia):
Maarifa, hekima na utulivu wa kiroho ndio nguvu kuu inayokuongoza kuwa kiongozi na shujaa madhubuti usiyetetemeshwa na dhoruba za nje nchini.

1. MFUMO WA TAALUMA NA KUJIONGEZA MAARIFA:
- Maarifa ya karne ya 21 yanahitaji utafiti, kuelewa mzunguko wa kifedha na masoko na kujisomea. Usikubali kuwa mwanaume asiyejua mwelekeo wa dunia.
- Mtaala wetu wa Giniaz College unalenga kukuandaa kuwa thabiti, hodari, na mwenye ushawishi kwa kusoma kila siku kwa nidhamu ya hali ya juu na kujiimarisha.

2. VITABU VINAVYOMFAA MWANAUME WA HISIA:
- Vitabu vinajenga nguvu ya fikra na utaratibu dhabiti wa kiume. Soma vitabu vya historia, saikolojia ya uongozi binafsi, mbinu za kiutendaji na kijeshi zinazokufunza kusimama kama ngao imara.
- Pia soma fasihi za usimamizi wa rasilimali, fedha na biashara za mafanikio. Tenga dakika 30 kila asubuhi kusoma na kuandika mbinu kwenye daftari lako.

3. NYIMBO NA MUZIKI UNAOSHUSHIA UTULIVU:
- Muziki asilia, wa ala za kihistoria (epic orchestral) ambao unajenga ujasiri wa shujaa, au nyimbo zenye mwelekeo wa sifa na kiungu (faith hymns) husaidia kurejesha utendaji na nguvu za kiume.
- Epuka muziki wenye kelele na ujumbe hasi unaoharibu utulivu wako wa kiatomu. Chagua nyimbo zenye ujumbe thabiti ili kujiweka vizuri kiakili kwa ajili ya ushindi kila asubuhi.`;
    } else {
      details = `
Safari ya Kujijenga Kuwa Mwanaume Shujaa zaidi Tz:
Ufunguo unapatikana kwa vitendo vidogo vidogo kila siku vilivyokusanywa pamoja.

1. Ulinzi na Ujenzi Binafsi:
- Kila siku jifunze kitu kipya angalau kwa nusu saa; upole unaofuatana na maarifa unakupa heshima ya ajabu popote pale unapoingia nchini.
- Weka ratiba ya mazoezi ya viungo ili uwe na uthabiti thabiti wa mwili.
- Jilinde na tabia mbaya zisizo na tija ambazo zitamong'onyoa nguvu yako ya kiume kiatomu.

2. Kauli ya Mwalimu Kyama:
Chimbuko letu sote liko kwenye nia yetu madhubuti ya kupiga hatua mbele kila siku. Usihofu kukosea, wala usijistahimilie udhaifu. Jenga mwanzo wako mpya sasa na sisi tutakufikisha kwenye kilele!`;
    }
  } else if (lt.includes("creator 24") || lt.includes("uundaji") || lt.includes("section") || lt.includes("app")) {
    details = `
Falsafa ya Uundaji wa Mobile Apps kupitia App Creator 24:
App Creator 24 ni chombo cha kisasa kinachowezesha uundaji wa apps bila kuandika kodi ngumu za Java au Kotlin. Katika somo hili, tutachimba mbinu zote mahususi ili kufanikisha azma yako.

1. App Creator 24 Components na Sections:
Kila app inajengwa kwa kutumia "Sections" ambazo zinawakilisha kurasa au vipengele vya app yako. Vipengele hivi ni pamoja na:
- HTML/Web Section: Kutengeneza kurasa maalum za mtandao au kutumia HTML kusanifu UI yako.
- Chat/Social Section: Kuwezesha watumiaji kusajili akaunti, kuongeza picha, na kuchati pamoja.
- Video/Audio Stream Section: Kuweka viungo vya utiririshaji wa video (kama YouTube/Vimeo) au redio (kama FM Stations).
- Feed RSS Reader: Kupokea habari na makala kutoka tovuti mbalimbali moja kwa moja kwenye app.

2. Hatua kwa Hatua za Kusanidi App Creator 24:
Kwanza: Tembelea tovuti ya App Creator 24 na usajili akaunti ya bure.
Pili: Bofya "Create App", weka jina zuri la app yako, chagua icon na rangi ya kuvutia.
Tatu: Nenda kwenye sehemu ya "Sections" na uongeze vipengele kulingana na muundo unaotaka.
Nne: Pakua faili la APK na ujaribu kwenye simu yako ya mkononi.

3. Kanuni Kuu za Offline vs Online Apps:
- Offline Apps: Ni lazima kuhakikisha faili zote kama HTML, picha, na vitabu vipo ndani ya app (local storage) asili, ili mtumiaji asihitaji MB kusoma.
- Online Apps: Maudhui yanapaswa kuhuishwa kutoka kwenye database au links za nje (streaming URLs). Tunatumia usawazishaji (caching/sync) kuhakikisha app haitumii data nyingi sana na haichelewi kufunguka.`;
  } else if (lt.includes("biashara") || lt.includes("mazao") || lt.includes("kipato") || lt.includes("mjasiriamali")) {
    details = `
Uchambuzi wa Mkakati wa Kiuchumi na Biashara:
Soko la Tanzania linakua kwa kasi kubwa sana, hasa upande wa kilimo, biashara ya mazao na uzalishaji wa viwandani vidogo vidogo.

1. Mbinu za Kutafuta Miundombinu ya Soko:
- Utafiti wa Bei: Mazao kama mahindi, kitunguu, na mchele huwa yana bei tofauti sana kati ya mikoani (kama Mbeya, Morogoro, Iringa) na mijini (kama Dar es Salaam, Mwanza).
- Mtandao wa Usambazaji: Kuweka mifumo ya mawasiliano inayounganisha wakulima wa vijijini moja kwa moja na wanunuzi bila kupitia madalali waharibifu.

2. Usimamizi wa Kifedha na Mikopo:
- Kuanza kidogo: Anza na mtaji mdogo kuhakiki soko kabla ya kuchukua mikopo mikubwa ya kibenki.
- Kutumia Teknolojia: Kuweka rekodi sahihi za mapato na matumizi kwa kutumia app maalum au Excel ili kujua faida halisi.

3. Programu za Mafunzo ya Majaribio (Case Studies):
Mkoa wa Arusha na Kilimanjaro ni mfano mzuri wa biashara ya mazao ya mboga mboga kuelekea soko la nje ya nchi (export format). Ili kufanikiwa, viwango vya ubora vinapaswa kuwa vya kiwango cha juu mno.`;
  } else if (lt.includes("shukrani") || lt.includes("mtazamo chanya") || lt.includes("furahia maisha") || lt.includes("kusudi") || lt.includes("shauku")) {
    details = `
Sanaa ya Umakinifu, Kutafuta Kusudi na Mtazamo Chanya:
Maisha yanajaa changamoto mbalimbali, lakini jinsi unavyotafsiri mazingira yako ndivyo unavyounda hatima yako.

1. Nguvu ya Shukrani (Gratitude Habit):
Wataalamu wa saikolojia wamethibitisha kuwa kuandika mambo matatu unayoshukuru kila asubuhi huongeza serotonin na dopamine kwenye ubongo wako. Hii inakupa hamasa na kuondoa msongo wa mawasiliano.
- Jinsi ya kuanza: Chukua daftari dogo la "Shukrani". Kila siku, andika mambo matatu hata yasiyo makubwa sana (kama kuwa na afya njema, familia, au fani unayojifunza).

2. Kujenga Mtazamo Chanya Katika Biashara na Masomo:
Unapokutana na changamoto katika uundaji wa app au mradi wako, usione kama umeshindwa. Chulia kila changamoto kama darasa lililotengenezwa kukuimarisha. Hakuna mtaalamu aliyezaliwa anajua kila kitu, wote walijifunza kwa kufanya makosa na kuyarekebisha.

3. Kufikia Amani ya Ndani:
Punguza kelele za mitandao ya kijamii ambazo mara nyingi husababisha watu kujilinganisha na wenzao kwa namna isiyo na tija. Jiwekee malengo madogo ya kila siku, na unayapokamilisha, jipongeze kwa hatua hiyo.`;
  } else if (category === "Hekima ya Kiroho na Neno la Mungu") {
    details = `
Uchambuzi wa Kina wa Kiroho na Mistari ya Biblia:
Katika maandalizi yetu ya kiungu leo hapa Giniaz College, tunajivunia kusimama juu ya misingi isiyorudi nyuma ya Neno la Mungu. Mistari ifuatayo inakupa ulinzi mkuu na weledi usiotikisika:

1. Kujenga Maisha Juu ya Mwamba wa Neno (Zaburi 119:105):
’Neno lako ni taa ya miguu yangu, na mwanga wa njia yangu.’ Mwanafunzi wangu, unapoanza siku yako na nusu saa ya kusoma maandiko, unawasha taa ya kiungu itakayokulinda na vizuizi na dharau za kidunia. Kila mstari unakuwa ngao na uwezo wa kugundua ukweli kuanzia ngazi ya s s seli.

2. Siri ya Kustawi kwa Vitendo (Yoshua 1:8):
’Kitabu hiki cha torati kisiondoke kinywani mwako, bali yatafakari maneno yake mchana na usiku, upate kuangalia kutenda sawasawa na maneno yote yaliyoandikwa humo; maana ndipo utakapoifanya njia yako kuwa na ufanisi, ndipo utakapositawi sana.’ Mwalimu Joseph Marwa Kyama anasisitiza kuwa, kufanikiwa na kusitawi hakutokani na mihemko au pupa, bali kunatokana na nidhamu ya kutulia na neno la Mungu ili kubadilishwa utu uzima wako uwe na unyenyekevu, adabu, na staha.

3. Kipaumbele cha Kifalme (Mathayo 6:33):
’Bali utafuteni kwanza ufalme wake na haki yake, na hayo yote mtaongezewa.’ Unapoweka madhabahu ya maombi katika familia yako na ndoa yako, Mungu atatunza mzunguko wa fedha na mtaji wako pasipo wasiwasi wowote. Uaminifu wako katika amri za Mungu unaleta tija mara elfu kumi.

4. Ushindi Maishani (Wafilipi 4:13):
’Nayaweza mambo yote katika yeye anitiaye nguvu.’ Usiseme kuwa huwezi kuacha hasira, chuki, au kukata tamaa. Kristo anakupa nguvu mpya kila asubuhi tulivu ya leo.

5. Utakaso na Malezi (Warumi 12:2 & Kitabu cha Amri saba):
’Wala msiifuatishe namna ya dunia hii, bali mgeuzwe kwa kufanywa upya nia zenu, mpate kujua hakika mapenzi ya Mungu yaliyo mema, ya kumpendeza, na ukamilifu.’ Hapa chuoni tunaamini katika kujenga tabia njema na kulisha upendo wa kweli katika jamii nzima nchini Tanzania.`;
  } else {
    details = `
Uchambuzi wa Kina wa Mada Husika:
Somo hili limeandaliwa kukuongoza kupata ujuzi kamili, thabiti na unaohitajika katika karne ya 21.

1. Misingi na Nadharia Maalum ya Kujifunza:
Kujifunza kwa kina kunahitaji utulivu na mfululizo wa kufanya mazoezi (persistence). Sio tu kusoma nadharia, bali kufanyia kazi kile unachokisoma ili kiwe sehemu ya tabia na ujuzi wako wa kila siku.

2. Maelekezo ya Kiutendaji:
- Weka ratiba thabiti ya kusoma kila siku angalau dakika 30 bila usumbufu wa simu au marafiki.
- Shirikisha wenzako kile unachojifunza; kufanya hivi huongeza uelewa wako kwa asilimia 90 kulingana na tafiti za elimu.
- Tumia zana tulizonazo hapa kupakua maudhui na kusikiliza sauti ili uweze kusoma popote ulipo hata ukiwa safarini.

3. Ushauri Maalum wa Mhadhiri:
Kumbuka, ufunguo wa mafanikio upo mikononi mwako. Kuwa tayari kufanya majaribio mengi na usihofu kukosea. Ukosefu wa kujaribu ndio kushindwa pekee kuliko kote. Giza la ujinga huondoka unapoamua kufungua kitabu na kuanza kujifunza!`;
  }

  return text;
}

function generateLocalExpansionSections(courseTitle: string, lessonTitle: string, currentWordCount: number, targetWordCount: number, instructorName: string): string {
  const wordsNeeded = targetWordCount - currentWordCount;
  if (wordsNeeded <= 0) return "";

  const campusName = "Giniaz College";
  const managerName = "Joseph Marwa Kyama";
  const lt = lessonTitle;
  const ct = courseTitle;

  // Set category parameters
  let category = "Mafunzo ya Maisha na Nidhamu";
  let field = "maendeleo ya kiutu";
  let focus = "kupunguza makosa na kujiimarisha";

  const lowerCt = ct.toLowerCase();
  if (lowerCt.includes("biashara") || lowerCt.includes("mjasiriamali") || lowerCt.includes("fedha") || lowerCt.includes("uwekezaji") || lowerCt.includes("mauzo") || lowerCt.includes("pesa")) {
    category = "Uchumi na Ujasiriamali Binafsi";
    field = "kuongeza mzunguko wa fedha na kujenga mtaji";
    focus = "nidhamu ya pesa na kusanifu fursa sokoni";
  } else if (lowerCt.includes("injili") || lowerCt.includes("biblia") || lowerCt.includes("mungu") || lowerCt.includes("sabato") || lowerCt.includes("roho")) {
    category = "Hekima ya Kiroho na Neno la Mungu";
    field = "ulinzi wa kiroho na kusimamia mistari ya Biblia";
    focus = "uaminifu na malezi kulingana na maadili ya kiungu";
  } else if (lowerCt.includes("usimamizi") || lowerCt.includes("uongozi") || lowerCt.includes("leadership") || lowerCt.includes("project")) {
    category = "Usimamizi na Uongozi wa Kimkakati";
    field = "kujenga mifumo imara ya kiutendaji na kusimamia timu";
    focus = "huduma bora kwa wateja, kupanga malengo, na kupunguza upotevu";
  } else if (lowerCt.includes("it") || lowerCt.includes("ai") || lowerCt.includes("teknolojia") || lowerCt.includes("app")) {
    category = "Teknolojia na Akili Bandia";
    field = "uundaji wa programu na matumizi ya mifumo ya kidijitali";
    focus = "ulinzi wa kidijitali na kutumia AI";
  } else if (lowerCt.includes("mke") || lowerCt.includes("mume") || lowerCt.includes("familia") || lowerCt.includes("ndoa")) {
    category = "Uhusiano, Ndoa, na Malezi ya Familia";
    field = "saikolojia ya hisia kuanzia kiwango cha atomu";
    focus = "kuondoa unafiki na hasira, na kulinda usalama wa kihemko";
  }

  let swahiliConceptPool = [
    "Usimamizi wa muda na umuhimu wa kupanga ratiba yako asubuhi tulivu ya leo. Kila sekunde inatupatia fursa ya kujifunza na kuwa bora katika utekelezaji wa mifumo yetu endelevu.",
    "Nadharia ya athari ya atomu inatuhimiza kubadili uamuzi mdogo mdogo na tabia zetu badala ya kusubiri mafanikio ya ghafla yasiyodumu. Kupanda mche mdogo na kuumwagilia kwa saburi ndiyo siri yetu.",
    "Kuondoa unafiki kimaisha na kuanza kuishi kwa uadilifu, upendo, heshima mkuu wa utu uzima na hekima isiyo na mihemko hasi ya hasira au dharau sokoni wala nyumbani.",
    "Kuboresha mifumo ya kiutendaji katika miradi yetu au biashara za nyumbani nchini Tanzania hasa miji ya Dar es Salaam, Dodoma na Arusha ili kuzuia upotevu wowote wa mzunguko wa fedha na mtaji wetu binafsi.",
    "Kusoma vitabu, miongozo na kuhudhuria masomo kwa bidii kubwa hapa Giniaz College ili kujenga uwezo mkuu, upole wa kukabiliana na changamoto, na staha thabiti.",
    "Muundo mkuu wa kujitambua kuanzia ngazi ya kisaikolojia kulinda amani ya familia na ustawi wa jamii inayotuzunguka. Hii ndiyo elimu ya akili tunoyoihitaji sana.",
    "Kanuni ya uandishi na utekelezaji makini wa majaribio ya kila siku, ambapo mwanafunzi wangu anaandika kwenye daftari lako dondoo zote za busara zilizotolewa na mwalimu wake.",
    "Uzoefu wa vitendo unaonyesha kuwa uaminifu una tija kubwa ya kifedha tangu asili na unakuza ushawishi wetu katika nyanja zote za kijamii na kiuchumi.",
    "Kuwavuta wenzetu kwa upendo na kauli laini ili kujenga timu imara isiyo na migogoro ya kijinga wala mapambano hasi ya kibinafsi.",
    "Kufanya doria ya kila siku katika mradi wako dhabiti, kupima kiwango cha tija, kuorodhesha bidhaa na kuongeza thabiti huduma bora kwa wateja wako."
  ];

  let swahiliElaborationTemplates = [
    "Tunapozingatia hili, mwanafunzi wangu mpendwa, tunakuta kwamba utatuzi makini uliopo chini ya usimamizi av Giniaz College na viongozi wetu kama Joseph Marwa Kyama unaleta majibu sahihi ambayo huwezi kuyapata kwingine. Usifanye mambo haya kwa pupa au mashindano ya kijinga ya kuridhisha ego yako.",
    "Katika nchi yetu nzuri ya Tanzania hasa maeneo ya kibiashara kama Kariakoo au mkoa wa Mwanza, watu wengi wamepoteza amani ya mioyo yao na ufanisi wao kwa sababu tu ya kutaka sifa za haraka au mihemko. Lakini ukiweka bayana utaratibu rahisi kama kupaka asali mioyo, unajenga chapa dhabiti isiyotikisika kimaisha.",
    "Mwanafunzi wangu, nakusihi usome miongozo hii tangu ngazi ya seli au atomu ili uondokane na dharau, unafiki na hasira kuanzia nyumbani hadi kazini kwako. Hiki ndicho chimbuko letu kuu na fursa yetu ya kishujaa ya kustajabisha ulimwengu kwa matendo yetu mema na upendo usio na miso.",
    "Nenda kafanyie kazi dondoo hizi asubuhi hii tulivu, weka kwenye daftari lako orodha ya mambo yote ya msingi, dhibiti bajeti kwa nidhamu ya kifalme, na endelea kuamini katika mifumo yetu thabiti ya uzalishaji kulinda rasilimali na kukuza tija isiyo na mipaka."
  ];

  if (category === "Hekima ya Kiroho na Neno la Mungu") {
    swahiliConceptPool = [
      "Maandiko Matakatifu katika Zaburi 119:105 yanatukumbusha kuwa: 'Neno lako ni taa ya miguu myangu, na mwanga wa njia yangu.' Hii ina maana kila uamuzi wetu, kila doria na kila mwelekeo wa kiroho asubuhi ya leo lazima uongozwe na nuru ya neno la uzima mkuu ili kuepuka kuteleza kwenye giza la upotevu.",
      "Katika Yoshua 1:8 tunaamriwa kwa msisitizo mkubwa wa kiungu: 'Kitabu hiki cha torati kisiondoke kinywani mwako, bali yatafakari maneno yake mchana na usiku, upate kuangalia kutenda sawasawa na maneno yote yaliyoandikwa humo; maana ndipo utakapoifanya njia yako kuwa na ufanisi, ndipo utakapositawi sana.' Huu ndiol misingi thabiti kujiimarisha na kupata ufanisi hapa Giniaz College.",
      "Neno la Mungu linasema kwa uwazi katika Mithali 3:5-6: 'Mtumainie Bwana kwa moyo wako wote, wala usizitegemee akili zako mwenyewe; katika njia zako zote mkiri yeye, naye atanyosha mapito yako.' Hapa tunaona siri ya kumtanguliza Mungu katika elimu ya akili, upole na ibada bila unafiki na bila kiburi cha kijinga wala dharau.",
      "Kama kitabu cha Isaya 41:10 isemavyo kwa upendo na fadhili za kifalme: 'Usiogope, kwa maana mimi ni pamoja nawe; usifadhaike, kwa maana mimi ni Mungu wako; nitakutia nguvu, naam, nitakusaidia, naam, nitakushika kwa mkono wa kuume wa haki yangu.' Ahadi hii inatupatia ulinzi usiotikisika dhidi ya majaribu na hasira za ulimwengu huu.",
      "Katika Mathayo 6:33, Bwana wetu Yesu Kristo anatupatia kipaumbele kikuu cha maisha ya mwanadamu: 'Bali utafuteni kwanza ufalme wake na haki yake, na hayo yote mtaongezewa.' Hivyo mwanafunzi wangu, tunapojifunza ibada na neno, lazima tutafute kwanza utukufu wa kiungu kuliko tamaa za kijinga za mali za ulimwengu huu.",
      "Mtume Paulo anatuimarisha na kutufariji katika Wafilipi 4:13 akisema kwa ujasiri mkuu: 'Nayaweza mambo yote katika yeye anitiaye nguvu.' Huu ni wito wetu thabiti kuwa hakuna dhiki au jaribu lolote kali la nyakati za mwisho litakalotushinda ikiwa tunakaa ndani ya uwezo na neema ya Kristo Yesu.",
      "Katika 2 Timotheo 3:16-17 tunafundishwa kwa msisitizo: 'Kila andiko, lenye pumzi ya Mungu, lafaa kwa mafundisho, na kwa kuwaonya watu makosa yao, na kwa kuwaongoza, na kwa kuadibisha katika haki; ili mtu wa Mungu awe kamili, amekamilishwa kupata kila tendo jema.' Hii inaimarisha dhamira yetu ya kusimamia mistari sahihi ya Biblia.",
      "Katika Warumi 12:2 tunahimizwa kwa utakaso na heshima ya utu uzima: 'Wala msiifuatishe namna ya dunia hii, bali mgeuzwe kwa kufanywa upya nia zenu, mpate kujua hakika mapenzi ya Mungu yaliyo mema, ya kumpendeza, na ukamilifu.' Uadilifu wetu asubuhi hii ni kuachana na tabia za kizamani za mataifa na kuvaa utu upya wa kiungu.",
      "Ukweli wa kimsingi kuhusu Sabato umebainishwa na Mungu mwenyewe katika Kutoka 20:8-10: 'Ikumbuke siku ya Sabato uitakase. Siku sita fanya kazi, utende mambo yako yote; lakini siku ya saba ni Sabato ya Bwana, Mungu wako.' Hili ni takatifu tangu uumbaji na limewekwa kama alama ya uaminifu wa milele.",
      "Zaburi ya mfalme Daudi (Zaburi 23:1) inatukumbusha daima kwa unyenyekevu mkuu: 'Bwana ndiye mchungaji wangu, sitapungukiwa na kitu.' Kupitia uaminifu huu, mwanafunzi wangu, hutakosa amani ya roho yako, utulivu wa ndoa yako, wala chakula chema kimaisha kukuza tija yetu."
    ];

    swahiliElaborationTemplates = [
      "Tunapochimba mistari hii ya Biblia, mwanafunzi wangu mpendwa, unaona wazi kuwa viongozi na wahadhiri hapa Giniaz College, chini ya Joseph Marwa Kyama, tunakufungulia hazina kubwa ambayo haipatikani kwenye shule za kawaida za kidunia. Kila mstari ni asali ya kupaka mioyo na kufukuza roho zote za uzembe, dharau na hasira.",
      "Nakushauri mwanafunzi wangu, uwe unaandika mistari hii katika daftari lako maalum la chuo. Soma kwa makini Mathayo na vitabu vya unabii asubuhi hii tulivu, fanya doria ya utakaso rohoni mwako, na uondokane kabisa na unafiki wa kidini. Uaminifu wako kwa amri za Mungu kama Yohana 14:15 isemavyo ('Mkinipenda, mtazishika amri zangu') ndiyo chapa yako kuu.",
      "Uzoefu unaonyesha kwamba nchini Tanzania na kote duniani, wale wanaobeba Neno Moyoni hawataharibikiwa kamwe. Kama jinsi Zaburi ya kwanza inavyosema, watakuwa kama mti uliopandwa kando ya vijito vya maji, uzaao matunda yake kwa majira yake; nao hautanyauka kamwe. Hiyo ndiyo baraka yako leo asubuhi.",
      "Nenda kajiimarishe sasa ukiwa umejaa ujasiri mkuu wa kiroho kulingana na mafundisho thabiti ya ki-Mungu. Ukikumbuka ahadi katika Ufunuo 1:3: 'Heri asomaye na wao wayasikiao maneno ya unabii huu, na kuyashika yaliyoandikwa humo; kwa maana wakati u karibu.' Simama imara ukilinda imani yako na kuitangaza kwa upole na nyenyekevu."
    ];
  }

  let textAccumulator = "";
  let sectionIndex = 1;
  let runningWordCount = currentWordCount;

  while (runningWordCount < targetWordCount) {
    const heading = `\n\nUPANUZI WA SOMO NA MAELEZO YA ZIADA: (Sehemu ya ${sectionIndex})\n\n`;
    const headingWords = heading.trim().split(/\s+/).filter(Boolean).length;
    textAccumulator += heading;
    runningWordCount += headingWords;

    for (let pIndex = 0; pIndex < 4; pIndex++) {
      if (runningWordCount >= targetWordCount) {
        break;
      }
      const concept1 = swahiliConceptPool[(sectionIndex * 3 + pIndex) % swahiliConceptPool.length];
      const concept2 = swahiliConceptPool[(sectionIndex * 7 + pIndex + 1) % swahiliConceptPool.length];
      const elaboration1 = swahiliElaborationTemplates[(sectionIndex + pIndex) % swahiliElaborationTemplates.length];
      const elaboration2 = swahiliElaborationTemplates[(sectionIndex * 2 + pIndex) % swahiliElaborationTemplates.length];

      let para = "";
      if (category === "Hekima ya Kiroho na Neno la Mungu") {
        const index1 = pIndex * 2 + 1;
        const index2 = pIndex * 2 + 2;
        para = `Mwanafunzi wangu, tunapozidisha tafakari ya somo hili la "${lt}", tunapata mwanga mkubwa wa kiroho na misingi thabiti ya kiungu nchini Tanzania. Zingatia mambo haya muhimu:\n\n${index1}. ${concept1}\nKuchimba kwa undani na tafakari ya kina: ${elaboration1}\n\n${index2}. ${concept2}\nJinsi ya kuishi neno hili maishani mwako: ${elaboration2}\n\nHapa Giniaz College tunakufundisha kwa upendo mkuu ili uwe mtu mwenye utu uzima, adabu, na utakaso wa kweli.\n\n`;
      } else {
        para = `Mwanafunzi wangu mpendwa, tunapochimbua zaidi mada hii, tunaona umuhimu wa kuweka mifumo thabiti na ya kisasa kujiimarisha. Katika upanuzi huu wa somo letu la "${lt}" kwa kozi ya "${ct}" chini ya mfululizo wa ${category}, ni dhahiri kuwa ${concept1} Ni sharti uelewe na kutenda hili kwa usahihi kwa sababu ${elaboration1} Pia, kumbuka kuwa weledi na nidhamu kuhusu ${field} inathibitisha wazi kuwa ${concept2} Kupitia elimu hii yenye upole na uzalendo, mimi kama mhadhiri wako ${instructorName} nakusihi sana uzingatie mafundisho haya kila asubuhi ya leo kwani ${elaboration2}\n\n`;
      }
      const paraWords = para.trim().split(/\s+/).filter(Boolean).length;
      textAccumulator += para;
      runningWordCount += paraWords;
    }

    sectionIndex++;
    if (sectionIndex > 110) break;
  }

  return textAccumulator;
}

function formatIntoEightLines(text: string): string {
  const lines = text.split(/\n/);
  const result: string[] = [];
  
  let currentParagraphSentences: string[] = [];
  
  const flushParagraphs = () => {
    if (currentParagraphSentences.length === 0) return;
    
    // Group sentences into paragraphs of 2 to 4 sentences (exactly 3 sentences is optimal and beautiful)
    const sentencesPerPara = 3;
    for (let i = 0; i < currentParagraphSentences.length; i += sentencesPerPara) {
      const paraSentences = currentParagraphSentences.slice(i, i + sentencesPerPara);
      result.push(paraSentences.join(" "));
    }
    
    currentParagraphSentences = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const lineStr = lines[i].trim();
    if (!lineStr) {
      flushParagraphs();
      continue;
    }
    
    const isHeading = 
      lineStr.startsWith('#') || 
      /^(sehemu\s+ya\s+\d+|sehemu\s+ya\s+[a-z]+|hitimisho|utangulizi|kazi\s+ya\s+nyumbani|tathmini|tafakari|swali|chemsha\s+bongo|ujasiriamali|mjasiriamali|majumuisho|mzee\s+wa\s+hekima|sehemu\s+ya\s+ziada)/i.test(lineStr) ||
      (lineStr.length < 120 && lineStr.endsWith(':') && !lineStr.includes('\n'));
      
    if (isHeading) {
      flushParagraphs();
      result.push(lineStr);
    } else {
      // Split the line into sentences naturally using standard punctuation followed by space
      const sentences = lineStr.split(/(?<=[.!?])\s+/).filter(Boolean);
      currentParagraphSentences.push(...sentences);
    }
  }
  
  flushParagraphs();
  
  return result.join("\n\n");
}

interface ParsedSection {
  heading: string | null;
  paragraphs: string[];
}

function parseIntoSections(text: string): ParsedSection[] {
  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { heading: null, paragraphs: [] };
  
  let currentParagraphLines: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      currentSection.paragraphs.push(currentParagraphLines.join("\n"));
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const isHeading = 
      trimmed.startsWith('#') || 
      /^(sehemu\s+ya\s+\d+|sehemu\s+ya\s+[a-z]+|hitimisho|utangulizi|kazi\s+ya\s+nyumbani|tathmini|tafakari|swali|chemsha\s+bongo|ujasiriamali|mjasiriamali|majumuisho|mzee\s+wa\s+hekima|sehemu\s+ya\s+ziada)/i.test(trimmed) ||
      (trimmed.length < 120 && trimmed.endsWith(':'));

    if (isHeading) {
      flushParagraph();
      if (currentSection.heading !== null || currentSection.paragraphs.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { heading: trimmed, paragraphs: [] };
    } else {
      currentParagraphLines.push(line);
    }
  }

  flushParagraph();
  if (currentSection.heading !== null || currentSection.paragraphs.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

function generateLocalExpansionParagraphs(
  courseTitle: string,
  lessonTitle: string,
  wordsNeeded: number,
  instructorName: string
): string[] {
  const campusName = "Giniaz College";
  const managerName = "Joseph Marwa Kyama";
  const lt = lessonTitle;
  const ct = courseTitle;

  // Set category parameters
  let category = "Mafunzo ya Maisha na Nidhamu";
  let field = "maendeleo ya kiutu";
  let focus = "kupunguza makosa na kujiimarisha";

  const lowerCt = ct.toLowerCase();
  if (lowerCt.includes("biashara") || lowerCt.includes("mjasiriamali") || lowerCt.includes("fedha") || lowerCt.includes("uwekezaji") || lowerCt.includes("mauzo") || lowerCt.includes("pesa")) {
    category = "Uchumi na Ujasiriamali Binafsi";
    field = "kuongeza mzunguko wa fedha na kujenga mtaji";
    focus = "nidhamu ya pesa na kusanifu fursa sokoni";
  } else if (lowerCt.includes("injili") || lowerCt.includes("biblia") || lowerCt.includes("mungu") || lowerCt.includes("sabato") || lowerCt.includes("roho")) {
    category = "Hekima ya Kiroho na Neno la Mungu";
    field = "ulinzi wa kiroho na kusimamia mistari ya Biblia";
    focus = "uaminifu na malezi kulingana na maadili ya kiungu";
  } else if (lowerCt.includes("usimamizi") || lowerCt.includes("uongozi") || lowerCt.includes("leadership") || lowerCt.includes("project")) {
    category = "Usimamizi na Uongozi wa Kimkakati";
    field = "kujenga mifumo imara ya kiutendaji na kusimamia timu";
    focus = "huduma bora kwa wateja, kupanga malengo, na kupunguza upotevu";
  } else if (lowerCt.includes("it") || lowerCt.includes("ai") || lowerCt.includes("teknolojia") || lowerCt.includes("app")) {
    category = "Teknolojia na Akili Bandia";
    field = "uundaji wa programu na matumizi ya mifumo ya kidijitali";
    focus = "ulinzi wa kidijitali na kutumia AI";
  } else if (lowerCt.includes("mke") || lowerCt.includes("mume") || lowerCt.includes("familia") || lowerCt.includes("ndoa")) {
    category = "Uhusiano, Ndoa, na Malezi ya Familia";
    field = "saikolojia ya hisia kuanzia kiwango cha atomu";
    focus = "kuondoa unafiki na hasira, na kulinda usalama wa kihemko";
  }

  let swahiliConceptPool = [
    "Usimamizi wa muda na umuhimu wa kupanga ratiba yako asubuhi tulivu ya leo. Kila sekunde inatupatia fursa ya kujifunza na kuwa bora katika utekelezaji wa mifumo yetu endelevu.",
    "Nadharia ya athari ya atomu inatuhimiza kubadili uamuzi mdogo mdogo na tabia zetu badala ya kusubiri mafanikio ya ghafla yasiyodumu. Kupanda mche mdogo na kuumwagilia kwa saburi ndiyo siri yetu.",
    "Kuondoa unafiki kimaisha na kuanza kuishi kwa uadilifu, upendo, heshima mkuu wa utu uzima na hekima isiyo na mihemko hasi ya hasira au dharau sokoni wala nyumbani.",
    "Kuboresha mifumo ya kiutendaji katika miradi yetu au biashara za nyumbani nchini Tanzania hasa miji ya Dar es Salaam, Dodoma na Arusha ili kuzuia upotevu wowote wa mzunguko wa fedha na mtaji wetu binafsi.",
    "Kusoma vitabu, miongozo na kuhudhuria masomo kwa bidii kubwa hapa Giniaz College ili kujenga uwezo mkuu, upole wa kukabiliana na changamoto, na staha thabiti.",
    "Muundo mkuu wa kujitambua kuanzia ngazi ya kisaikolojia kulinda amani ya familia na ustawi wa jamii inayotuzunguka. Hii ndiyo elimu ya akili tunoyoihitaji sana.",
    "Kanuni ya uandishi na utekelezaji makini wa majaribio ya kila siku, ambapo mwanafunzi wangu anaandika kwenye daftari lako dondoo zote za busara zilizotolewa na mwalimu wake.",
    "Uzoefu wa vitendo unaonyesha kuwa uaminifu una tija kubwa ya kifedha tangu asili na unakuza ushawishi wetu katika nyanja zote za kijamii na kiuchumi.",
    "Kuwavuta wenzetu kwa upendo na kauli laini ili kujenga timu imara isiyo na migogoro ya kijinga wala mapambano hasi ya kibinafsi.",
    "Kufanya doria ya kila siku katika mradi wako dhabiti, kupima kiwango cha tija, kuorodhesha bidhaa na kuongeza thabiti huduma bora kwa wateja wako."
  ];

  let swahiliElaborationTemplates = [
    "Tunapozingatia hili, mwanafunzi wangu mpendwa, tunakuta kwamba utatuzi makini uliopo chini ya usimamizi wa Giniaz College na viongozi wetu kama Joseph Marwa Kyama unaleta majibu sahihi ambayo huwezi kuyapata kwingine. Usifanye mambo haya kwa pupa au mashindano ya kijinga ya kuridhisha ego yako.",
    "Katika nchi yetu nzuri ya Tanzania hasa maeneo ya kibiashara kama Kariakoo au mkoa wa Mwanza, watu wengi wamepoteza amani ya mioyo yao na ufanisi wao kwa sababu tu ya kutaka sifa za haraka au mihemko. Lakini ukiweka bayana utaratibu rahisi kama kupaka asali mioyo, unajenga chapa dhabiti isiyotikisika kimaisha.",
    "Mwanafunzi wangu, nakusihi usome miongozo hii tangu ngazi ya seli au atomu ili uondokane na dharau, unafiki na hasira kuanzia nyumbani hadi kazini kwako. Hiki ndicho chimbuko letu kuu na fursa yetu ya kishujaa ya kustajabisha ulimwengu kwa matendo yetu mema na upendo usio na miso.",
    "Nenda kafanyie kazi dondoo hizi asubuhi hii tulivu, weka kwenye daftari lako orodha ya mambo yote ya msingi, dhibiti bajeti kwa nidhamu ya kifalme, na endelea kuamini katika mifumo yetu thabiti ya uzalishaji kulinda rasilimali na kukuza tija isiyo na mipaka."
  ];

  if (category === "Hekima ya Kiroho na Neno la Mungu") {
    swahiliConceptPool = [
      "Maandiko Matakatifu katika Zaburi 119:105 yanatukumbusha kuwa: 'Neno lako ni taa ya miguu myangu, na mwanga wa njia yangu.' Hii ina maana kila uamuzi wetu, kila doria na kila mwelekeo wa kiroho asubuhi ya leo lazima uongozwe na nuru ya neno la uzima mkuu ili kuepuka kuteleza kwenye giza la upotevu.",
      "Katika Yoshua 1:8 tunaamriwa kwa msisitizo mkubwa wa kiungu: 'Kitabu hiki cha torati kisiondoke kinywani mwako, bali yatafakari maneno yake mchana na usiku, upate kuangalia kutenda sawasawa na maneno yote yaliyoandikwa humo; maana ndipo utakapoifanya njia yako kuwa na ufanisi, ndipo utakapositawi sana.' Huu ndiol misingi thabiti kujiimarisha na kupata ufanisi hapa Giniaz College.",
      "Neno la Mungu linasema kwa uwazi katika Mithali 3:5-6: 'Mtumainie Bwana kwa moyo wako wote, wala usizitegemee akili zako mwenyewe; katika njia zako zote mkiri yeye, naye atanyosha mapito yako.' Hapa tunaona siri ya kumtanguliza Mungu katika elimu ya akili, upole na ibada bila unafiki na bila kiburi cha kijinga wala dharau.",
      "Kama kitabu cha Isaya 41:10 isemavyo kwa upendo na fadhili za kifalme: 'Usiogope, kwa maana mimi ni pamoja nawe; usifadhaike, kwa maana mimi ni Mungu wako; nitakutia nguvu, naam, nitakusaidia, naam, nitakushika kwa mkono wa kuume wa haki yangu.' Ahadi hii inatupatia ulinzi usiotikisika dhidi ya majaribu na hasira za ulimwengu huu.",
      "Katika Mathayo 6:33, Bwana wetu Yesu Kristo anatupatia kipaumbele kikuu cha maisha ya mwanadamu: 'Bali utafuteni kwanza ufalme wake na haki yake, na hayo yote mtaongezewa.' Hivyo mwanafunzi wangu, tunapojifunza ibada na neno, lazima tutafute kwanza utukufu wa kiungu kuliko tamaa za kijinga za mali za ulimwengu huu.",
      "Mtume Paulo anatuimarisha na kutufariji katika Wafilipi 4:13 akisema kwa ujasiri mkuu: 'Nayaweza mambo yote katika yeye anitiaye nguvu.' Huu ni wito wetu thabiti kuwa hakuna dhiki au jaribu lolote kali la nyakati za mwisho litakalotushinda ikiwa tunakaa ndani ya uwezo na neema ya Kristo Yesu.",
      "Katika 2 Timotheo 3:16-17 tunafundishwa kwa msisitizo: 'Kila andiko, lenye pumzi ya Mungu, lafaa kwa mafundisho, na kwa kuwaonya watu makosa yao, na kwa kuwaongoza, na kwa kuadibisha katika haki; ili mtu wa Mungu awe kamili, amekamilishwa kupata kila tendo jema.' Hii inaimarisha dhamira yetu ya kusimamia mistari sahihi ya Biblia.",
      "Katika Warumi 12:2 tunahimizwa kwa utakaso na heshima ya utu uzima: 'Wala msiifuatishe namna ya dunia hii, bali mgeuzwe kwa kufanywa upya nia zenu, mpate kujua hakika mapenzi ya Mungu yaliyo mema, ya kumpendeza, na ukamilifu.' Uadilifu wetu asubuhi hii ni kuachana na tabia za kizamani za mataifa na kuvaa utu upya wa kiungu.",
      "Ukweli wa kimsingi kuhusu Sabato umebainishwa na Mungu mwenyewe katika Kutoka 20:8-10: 'Ikumbuke siku ya Sabato uitakase. Siku sita fanya kazi, utende mambo yako yote; lakini siku ya saba ni Sabato ya Bwana, Mungu wako.' Hili ni takatifu tangu uumbaji na limewekwa kama alama ya uaminifu wa milele.",
      "Zaburi ya mfalme Daudi (Zaburi 23:1) inatukumbusha daima kwa unyenyekevu mkuu: 'Bwana ndiye mchungaji wangu, sitapungukiwa na kitu.' Kupitia uaminifu huu, mwanafunzi wangu, hutakosa amani ya roho yako, utulivu wa ndoa yako, wala chakula chema kimaisha kukuza tija yetu."
    ];

    swahiliElaborationTemplates = [
      "Tunapochimba mistari hii ya Biblia, mwanafunzi wangu mpendwa, unaona wazi kuwa viongozi na wahadhiri hapa Giniaz College, chini ya Joseph Marwa Kyama, tunakufungulia hazina kubwa ambayo haipatikani kwenye shule za kawaida za kidunia. Kila mstari ni asali ya kupaka mioyo na kufukuza roho zote za uzembe, dharau na hasira.",
      "Nakushauri mwanafunzi wangu, uwe unaandika mistari hii katika daftari lako maalum la chuo. Soma kwa makini Mathayo na vitabu vya unabii asubuhi hii tulivu, fanya doria ya utakaso rohoni mwako, na uondokane kabisa na unafiki wa kidini. Uaminifu wako kwa amri za Mungu kama Yohana 14:15 isemavyo ('Mkinipenda, mtazishika amri zangu') ndiyo chapa yako kuu.",
      "Uzoefu unaonyesha kwamba nchini Tanzania na kote duniani, wale wanaobeba Neno Moyoni hawataharibikiwa kamwe. Kama jinsi Zaburi ya kwanza inavyosema, watakuwa kama mti uliopandwa kando ya vijito vya maji, uzaao matunda yake kwa majira yake; nao hautanyauka kamwe. Hiyo ndiyo baraka yako leo asubuhi.",
      "Nenda kajiimarishe sasa ukiwa umejaa ujasiri mkuu wa kiroho kulingana na mafundisho thabiti ya ki-Mungu. Ukikumbuka ahadi katika Ufunuo 1:3: 'Heri asomaye na wao wayasikiao maneno ya unabii huu, na kuyashika yaliyoandikwa humo; kwa maana wakati u karibu.' Simama imara ukilinda imani yako na kuitangaza kwa upole na nyenyekevu."
    ];
  }

  const generatedParas: string[] = [];
  let generatedWords = 0;
  let sectionIndex = 1;

  while (generatedWords < wordsNeeded) {
    for (let pIndex = 0; pIndex < 4; pIndex++) {
      if (generatedWords >= wordsNeeded) {
        break;
      }
      const concept1 = swahiliConceptPool[(sectionIndex * 3 + pIndex) % swahiliConceptPool.length];
      const concept2 = swahiliConceptPool[(sectionIndex * 7 + pIndex + 1) % swahiliConceptPool.length];
      const elaboration1 = swahiliElaborationTemplates[(sectionIndex + pIndex) % swahiliElaborationTemplates.length];
      const elaboration2 = swahiliElaborationTemplates[(sectionIndex * 2 + pIndex) % swahiliElaborationTemplates.length];

      let para = "";
      if (category === "Hekima ya Kiroho na Neno la Mungu") {
        const index1 = pIndex * 2 + 1;
        const index2 = pIndex * 2 + 2;
        para = `Mwanafunzi wangu, tunapozidisha tafakari ya somo hili la "${lt}", tunapata mwanga mkubwa wa kiroho na misingi thabiti ya kiungu nchini Tanzania. Kwanza, tunaona kuwa ${concept1} Kupitia hili na kwa msaada wa chuo chetu, tunapata ufunuo sahihi kwamba ${elaboration1} Pili, tambua kwamba ${concept2} Hili linatukumbusha daima kwamba ${elaboration2} Hapa Giniaz College tunakufundisha kwa upendo mkuu ili uwe mtu mwenye utu uzima na utakaso wa kweli katika maisha yako yote.`;
      } else {
        para = `Mwanafunzi wangu mpendwa, tunapochimbua zaidi mada hii, tunaona umuhimu wa kuweka mifumo thabiti na ya kisasa kujiimarisha. Katika kuongeza uelewa huu wa somo letu la "${lt}" kwa kozi ya "${ct}" chini ya mfululizo wa ${category}, ni dhahiri kuwa ${concept1} Ni sharti uelewe na kutenda hili kwa usahihi kwa sababu ${elaboration1} Pia, kumbuka kuwa weledi na nidhamu kuhusu ${field} inathibitisha wazi kuwa ${concept2} Kupitia elimu hii yenye upole na uzalendo, mimi kama mhadhiri wako ${instructorName} nakusihi sana uzingatie mafundisho haya kila asubuhi ya leo kwani ${elaboration2}`;
      }
      const paraWords = para.trim().split(/\s+/).filter(Boolean).length;
      generatedParas.push(para);
      generatedWords += paraWords;
    }
    sectionIndex++;
    if (sectionIndex > 110) break;
  }

  return generatedParas;
}

function sanitizeLessonFormatting(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/[#*_~`]/g, '')
    .replace(/\(\s*n\s*\/\s*n\s*\)/gi, '')
    .replace(/\[\s*n\s*\/\s*n\s*\]/gi, '')
    .replace(/\(\s*\\n\\n\s*\)/gi, '')
    .replace(/\\n\\n/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stabilizeLessonContent(
  text: string,
  courseTitle: string,
  lessonTitle: string,
  instructorName: string
): string {
  let cleanText = sanitizeLessonFormatting(text);
  let words = cleanText.split(/\s+/).filter(Boolean);
  let count = words.length;

  console.log(`[Stabilizer] Input word count: ${count}`);

  const targetMin = 2810;
  const targetMax = 3290;

  if (count < targetMin) {
    console.log(`[Stabilizer] Content too short (${count} words). Distributing paragraphs inside existing sections...`);
    const wordsNeeded = (targetMin + 50) - count;
    const extraParas = generateLocalExpansionParagraphs(courseTitle, lessonTitle, wordsNeeded, instructorName);
    
    // Parse existing sections
    const parsedSections = parseIntoSections(cleanText);
    
    if (parsedSections.length > 0) {
      // We want to distribute extraParas across parsedSections, BUT we should NOT add to the last section (Section 7)
      // because Section 7 should be the end of the lesson.
      // Usually, there are 7 sections. Let's find how many sections we can add to.
      // We can add to any section except the last one.
      const maxTargetSections = parsedSections.length > 1 ? parsedSections.length - 1 : parsedSections.length;
      
      for (let i = 0; i < extraParas.length; i++) {
        // Distribute round-robin among eligible sections
        const targetSectionIdx = i % maxTargetSections;
        parsedSections[targetSectionIdx].paragraphs.push(extraParas[i]);
      }
      
      // Reconstruct cleanText
      const rebuiltBlocks: string[] = [];
      for (const sec of parsedSections) {
        if (sec.heading) {
          rebuiltBlocks.push(sec.heading);
        }
        if (sec.paragraphs.length > 0) {
          rebuiltBlocks.push(sec.paragraphs.join("\n\n"));
        }
      }
      cleanText = rebuiltBlocks.join("\n\n");
    } else {
      // Fallback: if no sections detected, just join them together
      cleanText = cleanText + "\n\n" + extraParas.join("\n\n");
    }
    
    words = cleanText.split(/\s+/).filter(Boolean);
    count = words.length;
    console.log(`[Stabilizer] After distribution word count: ${count}`);
  }

  if (count > targetMax) {
    console.log(`[Stabilizer] Content too long (${count} words). Truncating gracefully...`);
    const targetTruncateWords = targetMax;
    
    const truncatedWords = words.slice(0, targetTruncateWords);
    let truncatedText = truncatedWords.join(" ");
    
    const lastPeriodIndex = truncatedText.lastIndexOf(".");
    if (lastPeriodIndex > 0) {
      truncatedText = truncatedText.substring(0, lastPeriodIndex + 1);
    }
    
    cleanText = truncatedText.trim();
    words = cleanText.split(/\s+/).filter(Boolean);
    count = words.length;
    console.log(`[Stabilizer] After graceful truncation word count: ${count}`);
  }

  return formatIntoEightLines(cleanText);
}

// API Routes
app.post("/api/gemini/outline", async (req, res) => {
  let courseTitle: string | undefined;
  try {
    if (!req.body) {
      throw new Error("Request body is undefined or empty");
    }
    courseTitle = req.body.courseTitle;

    if (courseTitle === "App Creator 24 Tutorial") {
      const appCreator24Lessons = getFallbackCourseOutline("App Creator 24 Tutorial");
      return res.json(appCreator24Lessons);
    }

    if (courseTitle && (courseTitle.toLowerCase() === "api economy" || courseTitle.toLowerCase() === "api-economy" || courseTitle.toLowerCase().includes("api economy"))) {
      const apiEconomyLessons = getFallbackCourseOutline("API Economy");
      return res.json(apiEconomyLessons);
    }

    if (courseTitle === "Mwanamke wa Hisia") {
      const mwanamkeLessons = getFallbackCourseOutline("Mwanamke wa Hisia");
      return res.json(mwanamkeLessons);
    }

    if (courseTitle === "Mwanaume wa Hisia") {
      const mwanaumeLessons = getFallbackCourseOutline("Mwanaume wa Hisia");
      return res.json(mwanaumeLessons);
    }

    if (courseTitle && courseTitle.trim().toLowerCase() === "mapenzi ya mungu") {
      const mapenziLessons = getFallbackCourseOutline("Mapenzi ya Mungu");
      return res.json(mapenziLessons);
    }

    if (courseTitle && (courseTitle.trim().toLowerCase().includes("kuvuta/kuvutia uwepo wa mungu") || courseTitle.trim().toLowerCase().includes("kuvuta uwepo") || courseTitle.trim().toLowerCase().includes("kuvutia uwepo"))) {
      const kuvutaLessons = getFallbackCourseOutline("Jinsi ya kuvuta/kuvutia uwepo wa Mungu");
      return res.json(kuvutaLessons);
    }

    if (courseTitle && (courseTitle.trim().toLowerCase().includes("prompts engineering") || courseTitle.trim().toLowerCase().includes("prompt engineering"))) {
      const promptLessons = getFallbackCourseOutline("Prompt Engineering");
      return res.json(promptLessons);
    }

    if (courseTitle && (courseTitle.trim().toLowerCase().includes("tendo la ndoa tamu") || courseTitle.trim().toLowerCase().includes("jinsi ya kumuandaa mkeo") || courseTitle.trim().toLowerCase().includes("kumuandaa mkeo"))) {
      const ndoaLessons = getFallbackCourseOutline("Tendo la Ndoa Tamu (Jinsi ya Kumuandaa Mkeo)");
      return res.json(ndoaLessons);
    }

    if (courseTitle && (courseTitle.trim().toLowerCase().includes("kumfanya mwanamke akupende") || courseTitle.trim().toLowerCase().includes("mwanamke akupende") || courseTitle.trim().toLowerCase().includes("mbinu za kumfanya mwanamke"))) {
      const mapenziMwanamkeLessons = getFallbackCourseOutline("Mbinu za Kumfanya Mwanamke Akupende, Akuwaze na Akumis");
      return res.json(mapenziMwanamkeLessons);
    }

    if (courseTitle && (courseTitle.trim().toLowerCase().includes("mtaji wa laki tano") || courseTitle.trim().toLowerCase().includes("laki tano kibaha") || courseTitle.trim().toLowerCase().includes("kutengeneza utajiri kwa laki tano") || courseTitle.trim().toLowerCase().includes("kibaha"))) {
      const kibahaLessons = getFallbackCourseOutline("Mtaji wa Laki Tano Kibaha (Kutengeneza Utajiri na Fursa)");
      return res.json(kibahaLessons);
    }

    if (courseTitle && (courseTitle.trim().toLowerCase().includes("kinabii") || courseTitle.trim().toLowerCase().includes("viwango vya kinabii") || courseTitle.trim().toLowerCase().includes("kutamka neno") || courseTitle.trim().toLowerCase().includes("kuona kiroho"))) {
      const kinabiiLessons = getFallbackCourseOutline("Mkristo wa Viwango vya Kinabii");
      return res.json(kinabiiLessons);
    }

    const ai = getGenAI();

    const prompt = `WEWE NI MHADHIRI WA CHUO KIKUU. Tengeneza mtaala wa HASA masomo 12 kwa kozi ya "${courseTitle}" kwa lugha ya Kiswahili. Toa kichwa cha habari na maelezo mafupi kwa kila somo. Rudisha matokeo katika mfumo wa JSON wenye ufunguo 'lessons'.`;

    let response = null;
    let fallbackError = null;
    const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

    for (const model of models) {
      try {
        console.log(`Attempting to generate outline with model: ${model}`);
        response = await ai.models.generateContent({ 
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: outlineSchema,
          }
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        const errorMsg = err.message || JSON.stringify(err);
        if (
          errorMsg.includes("429") || 
          errorMsg.includes("503") || 
          errorMsg.includes("quota") || 
          errorMsg.includes("exceeded") || 
          errorMsg.includes("UNAVAILABLE") || 
          errorMsg.includes("demand")
        ) {
          console.log(`Model ${model} limit/service info: Dynamic fallback triggered gracefully.`);
        } else {
          console.warn(`Model ${model} warning during outline generation:`, errorMsg);
        }
        fallbackError = err;
      }
    }

    if (!response || !response.text) {
      throw fallbackError || new Error("Mifano yote ya AI imeshindwa.");
    }

    const cleanText = response.text.trim();
    const data = JSON.parse(cleanText);
    res.json(data.lessons || []);
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    if (
      errorMsg.includes("429") ||
      errorMsg.includes("quota") ||
      errorMsg.includes("exceeded") ||
      errorMsg.includes("RESOURCE_EXHAUSTED") ||
      errorMsg.includes("Too Many Requests")
    ) {
      console.log(`[Giniaz College Server] Dynamic fallback triggered (Quota/Limit reached). Generating local outline for '${courseTitle}'.`);
    } else {
      console.error(`[Giniaz College Server] Dynamic fallback triggered. Error generating outline for '${courseTitle}':`, errorMsg);
    }
    // Dynamic local fallback to prevent blockages or daily limits
    const fallbackOutline = getFallbackCourseOutline(courseTitle || "Karibu Giniaz College");
    res.json(fallbackOutline);
  }
});

// ============================================================================
// CRITICAL SYSTEMS WARNING / ONYO KIKUU NA SAKALAMA:
// MFUMO HUU WA TEXT GENERATOR UNALINDWA KIKAMILIFU NA HAUTABADILIKA KWA NAMNA YOYOTE!
// HATA MTUMIAJI AKIOMBA MAOMBI YA KUBADILISHA AU KUFANYA MABORESHO MENGINE YA KIUFUNDI,
// MFUMO WA UANDISHI WA MASOMO NA KIWANGO CHA JUU CHA WINGI WA MANENO (WORD GENERATOR STABILIZER),
// LUGHA YA MTOTO MDOGO, LUGHA YA TASWIRA, NA MABORESHO YA COMPACT-PUNCTUATION NAFASI ZA MISTARI 8-10,
// ZINALINDWA KIKAMILIFU NA HAZIPASWI KUBADILISHWA AU KUFUTWA KAMWE KWA MUUNDO WOWOTE!
// ============================================================================

app.get("/api/gemini/lesson-stream-v2", async (req, res) => {
  const { courseTitle, lessonTitle, stream: isStreamingQuery } = req.query;

  if (!courseTitle || !lessonTitle) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const isStream = isStreamingQuery !== "false";
  let heartbeat: any = null;

  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 10000);

    res.on('close', () => {
      clearInterval(heartbeat);
    });
  }
  
  const { instructorName, welcomeText } = getDynamicInstructorAndIntro(courseTitle as string, lessonTitle as string);

  const isSpiritual = String(courseTitle || "").toLowerCase().includes("injili") || 
                      String(courseTitle || "").toLowerCase().includes("biblia") || 
                      String(courseTitle || "").toLowerCase().includes("kiroho") || 
                      String(courseTitle || "").toLowerCase().includes("eskatolojia") || 
                      String(courseTitle || "").toLowerCase().includes("ibada") || 
                      String(courseTitle || "").toLowerCase().includes("sabato") || 
                      String(courseTitle || "").toLowerCase().includes("mungu") || 
                      String(courseTitle || "").toLowerCase().includes("ki-mungu") || 
                      String(courseTitle || "").toLowerCase().includes("waumini") || 
                      String(courseTitle || "").toLowerCase().includes("prophetic") || 
                      String(courseTitle || "").toLowerCase().includes("dini") || 
                      String(courseTitle || "").toLowerCase().includes("dhambi") || 
                      String(courseTitle || "").toLowerCase().includes("nabii") || 
                      String(courseTitle || "").toLowerCase().includes("unabii") || 
                      String(courseTitle || "").toLowerCase().includes("kusimamia") ||
                      String(courseTitle || "").toLowerCase().includes("kufunga na kufungua") ||
                      String(courseTitle || "").toLowerCase().includes("nyota");

  let spiritualInstructions = "";
  if (isSpiritual) {
    spiritualInstructions = `
  
  SHURTI LA KI-BIBLIA NA MAANDIKO YA DIRECT (BIBLE-CENTRIC RULE & DIRECT SCRIPTURES):
  - Somo hili linaendeshwa chini ya misingi thabiti na mafundisho ya BIBLIA TAKATIFU (Holy Bible). Msingi mkuu lazima uwe ni Maandiko Matakatifu.
  - Ni LAZIMA kuonyesha MISTARI YA BIBLIA (Kitabu, Sura:Mstari) moja kwa moja (direct) ndani ya masomo pamoja na MAANDIKO YENYEWE NENO KWA NENO (kwa mfano, "Yohana 3:16 - Kwa maana jinsi hii Mungu aliupenda ulimwengu...").
  - Takribani asilimia hamsini (50%) au zaidi ya somo lote lazima ihusishe mada au dondoo za Mistari ya Biblia takatifu (Bible Verses).
  - Katika KILA MOJA ya zile sehemu 8 chini, ni lazima Mistari ya Biblia isomeke kuanzia mwanzo kabisa mwa sehemu hiyo.
  - Ni LAZIMA utumie tarakimu/nambari (kwa mfano: 1., 2., 3., nk) kuorodhesha na kueleza mistari hii ya Biblia tangu mwanzo kabisa wa kila sehemu. Kila andiko liandikwe kwa herufi zake tangu mwanzo kabisa nchini Tanzania.`;
  }

  let eskatolojiaInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("eskatolojia")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    eskatolojiaInstructions = `
  
  MAUDHUI YA SOMO HILI NA MWONGOZO WAKE (LESSON MAUDHUI & PROPHECY DIMENSIONS):
  - Maudhui na mtazamo mkuu wa somo hili unaopaswa kufundisha kwa undani: "${lessonDescription}"
  - ZINGATIA KIKAMILIFU VIPENGELE VYOTE VITATU VYA NYAKATI (THREE DIMENSIONS OF TIME):
    1. HISTORIA (Yaliyopita): Changanua misingi ya kihistoria ya kibiblia, matukio ya kale, au asili ya somo hili.
    2. SASA (Maisha ya Sasa / Ulimwengu wa sasa): Husisha somo hili na hali halisi ya maisha ya kijamii, kiroho na kisiasa tunayoishi nayo leo duniani kote na nchini Tanzania.
    3. ZIJAZO (Siku Zijazo / Matukio Yanayosubiriwa): Fafanua kwa mtiririko sahihi kabisa wa kinabii mambo ya siku zijazo, vipindi vinavyofuata vya kinabii, na hatima ya milele.
  - Fundisha somo hili kwa weledi wa hali ya juu wa kiprofeshinali kabisa ukifuata mtiririko sahihi wa kinabii wa wokovu kuanzia uumbaji hadi mwisho.`;
  }

  let kinabiiInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("kinabii") || String(courseTitle || "").toLowerCase().includes("kutamka neno") || String(courseTitle || "").toLowerCase().includes("kuona kiroho")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    kinabiiInstructions = `
  
  MAUDHUI YA SOMO LA KINABII, UTAMBAZI WA KIROHO NA UPONYAJI (PROPHETIC, SPIRITUAL SIGHT & HEALING DIMENSIONS):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA NA MAANDIKO MATAKATIFU (DIRECT SCRIPTURES MANDATE): Kila hoja, hatua, na fundisho lazima lithibitishwe na kuelezwa kwa mistari thabiti ya Biblia Takatifu (kwa mfano: Ayubu 22:28, Marko 11:23-24, Marko 16:17-18, Yakobo 5:14-16, 2 Wafalme 6:15-17, Isaya 53:4-5, Waefeso 1:17-18, Warumi 4:17, 1 Wakorintho 12:4-11). Eleza mistari hiyo neno kwa neno na tafsiri yake ya kina ya kiroho.
  - KUTAMKA NENO LIKAWA: Fafanua jinsi maneno ya imani yanavyoachilia amri za kifalme za ki-Mungu (prophetic decrees), jinsi ya kutamka yasiyokuwepo yakawa, na jinsi ya kuondoa milima na changamoto kwa neno lenye upako.
  - KUONA MAMBO KIROHO (SPIRITUAL SIGHT & SEER REALM): Eleza jinsi macho ya moyo/roho yanavyofunguliwa, jinsi ya kutambua ulimwengu wa roho, maono, ndoto, hisia za kinabii na karama ya kupambanua roho.
  - KUOMBEA WAGONJWA NA KUPONYA: Fafanua kanuni za vitendo za kuweka mikono juu ya wagonjwa, mamlaka ya Jina la Yesu na Damu ya Yesu, sala ya imani, na kuamuru maradhi kuondoka.`;
  }

  let kufungaKufunguaInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("kufunga na kufungua")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    kufungaKufunguaInstructions = `
  
  MAUDHUI YA SOMO LA KUFUNGA NA KUFUNGUA KIROHO (BINDING AND LOOSING SPIRITUAL LAWS & RESULTS):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA NA MAMLAKA YA KIFALME: Fafanua kwa ufasaha mkubwa msingi wa kibiblia wa funguo za ufalme wa mbinguni (Mathayo 16:19, Mathayo 18:18-20, Isaya 22:22, Ufunuo 3:7-8, Ayubu 22:28, Luka 10:19, 2 Wakorintho 10:4-5, Waefeso 6:10-18). Eleza mistari hiyo neno kwa neno.
  - KANUNI ZA KISHERIA ZA KIROHO: Fafanua jinsi ya kusimama mbele ya mahakama za mbinguni, kutubu, kutumia Damu ya Yesu, kufunga roho za giza, vifungo vya ukoo na laana, na kufungua milango ya baraka, kibali, uponyaji na ustawi.
  - MATOKEO YAKE DHAHIRI NA KUDUMISHA USHINDI: Eleza jinsi matokeo yanavyojidhihirisha katika maisha halisi ya kila siku na namna ya kuishi katika ushindi wa kudumu bila kurudi nyuma.`;
  }

  let ibadaKikristoInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("ibada ya kikristo") || (String(courseTitle || "").toLowerCase().includes("ibada") && String(courseTitle || "").toLowerCase().includes("kikristo"))) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    ibadaKikristoInstructions = `
  
  MAUDHUI YA SOMO LA IBADA YA KIKRISTO (CHRISTIAN WORSHIP IN SPIRIT AND TRUTH):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA YA IBADA: Fafanua kwa kina kulingana na Yohana 4:23-24, Warumi 12:1-2, Zaburi 100:1-5, Waebrania 10:19-22, Zaburi 95:1-7, 2 Mambo ya Nyakati 5:13-14, Ufunuo 4:8-11, na 1 Wathesalonike 5:16-18.
  - NGAZI ZA IBADA NA MADHABAHU YA MOYO: Tofautisha kwa lugha nyepesi kati ya Shukrani, Sifa, na Ibada ya kweli patakatifu pa patakatifu. Fafanua namna ya kufanya maisha yako yote kuwa dhabihu hai takatifu inayompendeza Mungu.
  - NGUVU YA IBADA: Eleza jinsi ibada ya kweli inavyoangusha ngome za adui, inavyofungua milango ya miujiza, inavyovuta uwepo mtamu wa Mungu, na kujaza amani moyoni.`;
  }

  let kusafishaNyotaInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("kusafisha nyota") || String(courseTitle || "").toLowerCase().includes("nyota yako")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    kusafishaNyotaInstructions = `
  
  MAUDHUI YA SOMO LA KUSAFISHA NYOTA YAKO KIROHO (SPIRITUAL STAR & DESTINY CLEANSING):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA KUHUSU NYOTA NA HATIMA: Fafanua maana ya nyota kama alama ya utukufu, kusudi, wito na mng'ao wa hatima ya mwanadamu kulingana na Mathayo 2:1-2, Isaya 60:1-3, Danieli 12:3, Hesabu 24:17, 1 Wakorintho 15:41, 1 Yohana 1:7-9, Ufunuo 22:16, na Yoeli 2:25-26.
  - KUONDOA GIZA NA VIFUNGO VYA NYOTA: Eleza kwa hekima na upole jinsi nyota inavyoweza kufunikwa na vumbi la dhambi, laana au vita vya kiroho, na jinsi toba ya kweli na Damu ya Yesu inavyoitakasa na kuifanya ing'ae tena.
  - AMRI ZA KINABII NA KUREJESHA MNG'AO: Jinsi ya kutamka "Ondoka, uangaze" juu ya kazi, biashara, ndoa na uchumi wako, na kanuni za kudumu za kuishi maisha matakatifu ili kulinda nyota yako isichafuke tena.`;
  }

  const prompt = `Wewe ni mhadhiri mbobezi sana hapa Giniaz College mwenye upendo usio na kifani. Fundisha somo la "${lessonTitle}" kama sehemu ya kozi ya "${courseTitle}" kwa Kiswahili chenye mvuto wa ajabu, upole mwingi, na urahisi mkubwa sana, ukitumia mbinu bora zaidi za juu za kisaikolojia za ufundishaji ili kumfanya msomaji aelewe kwa asili na hisia thabiti.
  ${spiritualInstructions}
  ${eskatolojiaInstructions}
  ${kinabiiInstructions}
  ${kufungaKufunguaInstructions}
  ${ibadaKikristoInstructions}
  ${kusafishaNyotaInstructions}
  
  KANUNI KUU YA KUKATA PARAGRAPH KATIKA VIPANDE VIDOGO VIDOGO VYA WAZO MOJA (SMALL SINGLE-IDEA CHUNKS - MANDATORY):
  - KATA PARAGRAPH ZOTE KATIKA VIPANDE VIDOGO VIDOGO: Kila aya/kipande kimoja LAZIMA kiwe kifupi sana chenye sentensi 1 hadi 2 tu zinazobeba wazo moja tu kuu linalojitegemea kikamilifu.
  - TENGANISHA KILA WAZO NA LINGINE: Ni marufuku kabisa kuchanganya mawazo tofauti ndani ya aya moja au kuandika paragraph ndefu yenye mrundikano wa sentensi nyingi.
  - KILA UNAPOMALIZA WAZO MOJA: Tenganisha kwa kuacha mstari mmoja wa wazi kisha anza wazo linalofuata kwenye aya mpya inayojitegemea kabisa.
  - Hii inafanya somo liwe na mpangilio safi, mtiririko uliotulia, na kumpa msomaji urahisi wa kutafakari kila nukta moja bila msongamano.

  MARUFUKU YA ALAMA ZA KIUFUNDI NA MARKDOWN (STRICT BAN ON #, *, AND (n/n)):
  - USITUMIE KABISA alama za reli (# au ## au ###), alama za nyota (* au **), au alama kama (n/n) na \n\n ndani ya maandishi ya somo.
  - Andika kwa maandishi safi ya maneno ya kawaida ya Kiswahili fasaha bila mapambo yoyote ya alama za kompyuta.

  LUGHA YA WAZI SANA, LAINI NA NYEPESI (CRYSTAL CLEAR, GENTLE & DIRECT EXPLANATIONS):
  - Eleza kila wazo kwa lugha ya wazi kabisa, laini mno, iliyonyooka na nyepesi kueleweka hata kwa uelewa wa ngazi ya msingi, kwa njia ya asili na inayotiririka kwa upole mkubwa bila msamiati mgumu unaotatanisha.
  - UFAFANUZI WENYE UTULIVU: Vunja dhana zote ngumu ziwe nyepesi kama maji, kwa kutumia maneno mepesi, ya moja kwa moja, yenye utulivu na uwazi usio na ukungu wowote.
  - SIRI YA UFUNDISHAJI: Usitaje wala kumwambia msomaji kwamba unatumia mtindo wa ngazi ya msingi; bali tekeleza ufundishaji huo kwa weledi, upendo na uwazi wa ndani kwa ndani.

  MIONGOZO YA KISAIKOJIA, LUGHA YA TASWIRA NA UPENDO MKUBWA (PSYCHOLOGICAL & CHILD-LIKE LOVING TEACHING METHODS):
  - LUGHA RAFIKI NA YA UPENDO KAMA KWA MTOTO MDOGO SANA: Ongea na mwanafunzi wako kwa kutumia sauti ya upole, upendo uliopitiliza na maneno laini kabisa kana kwamba unaongea na mtoto mdogo mpendwa sana ulimwenguni ambaye unataka kumlinda na kumfanya afurahi. Tumia misemo ya joto, ya kubembeleza, na ya kutia moyo sana, lakini kwa heshima kuu ili kumfanya ajisikie salama na mwenye thamani kubwa.
  - MBINU ZA JUU ZA KISAIKOJIA ZA UFUNDISHAJI (HIGH-LEVEL PEDAGOGICAL PSYCHOLOGY):
    1. "Positive Reinforcement": Mpongeze mara kwa mara ("Vizuri sana mwanafunzi wangu!", "Najua unaweza kabisa!", "Ufanye hivi kwa tabasamu na amani...").
    2. "Scaffolding": Anza na dhana rahisi na mpeleke kwenye dhana ngumu kwa upole bila kumfanya ahisi uoga au ugumu wowote.
    3. "Emotional Connection": Husisha mafunzo na hisia za moyoni, furaha, tumaini na amani ya ndani ya mwanadamu.
  - LUGHA YA TASWIRA THABITI (DEEP VISUAL METAPHORS): Jenga picha thabiti za kiakili kwenye fikra zake. Kila mchakato uelezee kwa kutumia taswira hai na zenye hisia (kwa mfano: "hii ni kama mama ndege anavyomlinda mtoto wake kwa mabawa yake ya joto...", "jambo hili ni kama mche mdogo wa ua ukipeperushwa na upepo mwanana asubuhi...", "ni kama kumwaga asali tamu juu ya mkate laini wa ngano...").
  - MWITE MSOMAJI "mwanafunzi wangu mpendwa": Katika maelezo yako yote, tumia neno "mwanafunzi wangu mpendwa" au "mwanafunzi wangu" ili kujenga uhusiano imara na wa karibu wa kifamilia na wa kiroho.
  - MIFANO LAINI NA MIPESI SANAA: Toa mifano ya kawaida sana, ya upole, na ya kisaikolojia ya hapa nchini Tanzania (kama kushika mkono wa rafiki, kumwagilia bustani ndogo, kufurahia kikombe cha chai ya moto, nk) ili kurahisisha uelewa kwa kiwango cha juu zaidi.

  SHURTI KUU LA MANENO MACHACHE SANA KABLA YA SEHEMU YA KWANZA (MINIMAL WORDS BEFORE 'SEHEMU YA KWANZA: UTANGULIZI WA KINA'):
  - Kabla ya kufika kwenye kichwa cha habari cha "SEHEMU YA KWANZA: UTANGULIZI WA KINA", weka maneno machache sana (sentensi moja tu fupi mno ya maneno 5 hadi 10 ya ukaribisho, kwa mfano: "Karibu katika somo hili la ${lessonTitle} hapa Giniaz College.").
  - Mara moja baada ya sentensi hiyo fupi, anza moja kwa moja na kichwa cha habari:
    SEHEMU YA KWANZA: UTANGULIZI WA KINA
  - NI MARUFUKU KABISA kuandika aya ndefu, utangulizi mrefu au maelezo mengi kabla ya "SEHEMU YA KWANZA: UTANGULIZI WA KINA".

  SHURTI KUU LA KUTOKATIKA NA UTEMBEZAJI WA KINA (MAXIMUM WORDCOUNT OPTIMIZATION & COMPLETION GUARANTEE):
  - SHURTI KUHUSU UREFU WA SEHEMU (LENGTH OF SECTIONS RULE):
    1. KILA SEHEMU KATIKA ZILE 7 (EACH OF THE 7 SECTIONS): Kila sehemu kuanzia Sehemu ya Kwanza hadi Sehemu ya Saba LAZIMA iwe na urefu wa maneno 400 hadi 460 ya maelezo thabiti, ya kina na ya kutosha. Hii ni sheria isiyovunjika ili kuhakikisha kuwa urefu wa somo zima unakuwa kati ya maneno 2800 na 3200.
    2. Maneno ya mwanzo kabla ya kufika "SEHEMU YA KWANZA: UTANGULIZI WA KINA" yawe machache sana (sentensi moja tu fupi).
  - SHURTI LA DHAHABU: Ni marufuku kabisa kukatisha somo njiani au kuishia katikati! Somo LAZIMA lifike mwisho kikamilifu na kukamilisha sehemu zote 7 hadi mwisho wa sehemu ya saba kwa usahihi kabisa. Panga na ueneze urefu wa maelezo yako vizuri ili ukurasa uishie kwenye hitimisho rasmi na salamu ya mwisho ya mwalimu bila kukatika kwa herufi au sentensi.
  - Toa uchambuzi mpana, ukiingia katika maelezo ya nadharia, mafundisho ya kiroho, changamoto, na tafakari ya kiroho na kisaikolojia nchini Tanzania.
  - Epuka kabisa ufupisho, maswali au muhtasari (summary) wa aina yoyote kwenye sehemu zote 7. Panua kila hoja ili ifikie urefu unaotakiwa wa maneno 400 hadi 460.
  
  MIONGOZO YA UPANUZI WA MAUDHUI NA MIFANO YA JAMII (CONTENT EXPANSION & SOCIETAL EXAMPLES):
  - MIFANO YA KILA SIKU KATIKA JAMII (SOCIETAL EXAMPLES): Katika KILA MOJA ya sehemu zote 7 za somo, ni lazima upenyeze na uingize MFANO MMOJA MFUPI lakini wenye kugusa hisia na kufundisha unaotokea kila siku katika jamii yetu ya sasa (kwa mfano: maisha ya familia za mtaani, changamoto za mama lishe, usafiri wa bodaboda, biashara za sokoni, vijana wa vijiweni, migogoro ya kifamilia, n.k.). Mfano huu lazima upenyeze ndani kabisa ya maelezo ya kila sehemu.
  - ONGEZA MAELEZO YENYE KINA: Jaza maelezo ya nadharia, falsafa, na kanuni zote za msingi kwa urefu usiopungua sentensi 10 hadi 15 kwa kila sehemu ya somo ili kufikia urefu wa maneno 400 hadi 460.
  - ONYO KALI: Ni marufuku kabisa kuzalisha sehemu yoyote yenye jina au maudhui ya 'Muhtasari', 'Majumuisho', 'Maswali', 'Chemsha Bongo' au 'Tathmini'. Somo lote lazima liwe la mafundisho ya moja kwa moja pekee tangu mwanzo hadi mwisho, isipokuwa sehemu ya mwisho ambayo ni ya Tafakari na Kazi ya Nyumbani ya vitendo bila maswali ya kujibu!

  KANUNI YA UPANGAJI WA AYA NA MAPUMZIKO KWA MSOMAJI (PARAGRAPH FORMATTING & RESTING POINTS RULE):
  - KILA KIPANDE/AYA LAZIMA KIWE KIFUPI SANA (SENTENSI 1 HADI 2 TU): Kila kipande cha paragraph kinabeba wazo moja tu lililonyooka na linalojitegemea.
  - Tenganisha kila aya na aya inayofuata kwa mstari wa wazi ili kuweka nafasi ya kutosha na kutoa sehemu nzuri ya mapumziko kwa mwanafunzi.
  - EPUKA KABISA KUNDUNDIKA MAANDISHI: Usiandike aya ndefu sana au lundo kubwa la maneno bila mapumziko. Mtiririko uwe laini, wa kuvutia, wenye hewa na nafasi nyingi za kupumua.
  
  TUMIA MUUNDO HUU KUENDELEZA SOMO LAKO LA MAELEZO (LAZIMA KILA SOMO LIWE NA SEHEMU HIZI 7 KIKAMILIFU - HAKIKISHA UNAFIKA MWISHO KABISA WA SEHEMU YA 7 BILA KUKATIKA):
  - SEHEMU YA KWANZA: UTANGULIZI WA KINA (Toa utanguluzi thabiti na wa kuvutia wenye urefu wa maneno 400 hadi 460 kueleza chimbuko na umuhimu wa somo kwa Kiswahili nyepesi na upendo mkubwa, pamoja na mfano mmoja mfupi wa jamii).
  - SEHEMU YA PILI: UFAFANUZI MKUU WA NADHARIA & KANUNI (Changanua na fafanua kwa undani nadharia zote, falsafa, na kanuni za msingi kwa urefu wa maneno 400 hadi 460, pamoja na mfano mmoja mfupi wa jamii).
  - SEHEMU YA TATU: HATUA KWA HATUA ZA VITENDO (Orodha ya hatua makini na za kina za jinsi ya kufanya au kutekeleza jambo hili hatua kwa hatua kwa vitendo vyenye maelezo marefu yenye urefu wa maneno 400 hadi 460 na mtiririko thabiti, pamoja na mfano mmoja mfupi wa jamii).
  - SEHEMU YA NNE: MIFANO HALISI & KESI ZA KAZI (Toa mifano laini, ya kweli na hadithi za matukio nchini Tanzania za kusisimua, zenye maelezo ya kina ya urefu wa maneno 400 hadi 460, pamoja na mfano mmoja mfupi wa jamii).
  - SEHEMU YA TANO: CHANGAMOTO ZA KAWAIDA & SULUHU (Chambua kila kikwazo na namna nzuri thabiti ya kuitatua kwa urefu wa maneno 400 hadi 460, pamoja na mfano mmoja mfupi wa jamii).
  - SEHEMU YA SITA: USHAURI WA KITAALAMU & MBINU ZA JUU (Mbinu mbadala, miongozo na siri za kukuza mafanikio yenye urefu wa maneno 400 hadi 460 kutoka kwa wataalamu wetu waliobobezi, pamoja na mfano mmoja mfupi wa jamii).
  - SEHEMU YA SABA: TAFAKARI KUU & KAZI YA NYUMBANI (Sehemu hii yenye urefu wa maneno 400 hadi 460 inajumuisha simulizi fupi ya ushuhuda, tafakari ya hisia kali za maisha, kazi ya nyumbani ya vitendo ili kujifunza maishani bila kuweka maswali yoyote ya kujibu wala muhtasari, mfano mmoja mfupi wa jamii, na kauli mbiu ya chuo ya Giniaz College chini ya Joseph Marwa Kyama).
  
  ONYO LA KITAALUMA NA SHURTI LA KUKAMILISHA: USITUMIE KABISA alama za reli (#), nyota (* au **), au alama za (n/n). Andika maudhui yako yote kwa kutumia aya kamili zilizounganishwa kwa vichwa vya habari vyenye maandishi ya kawaida tu (kwa mfano, "SEHEMU YA KWANZA: UTANGULIZI WA KINA"). Toa maudhui mfululizo hadi mwisho kabisa wa Sehemu ya Saba bila kukata somo katikati au kufupisha ghafla. Hakikisha msomaji anapata hitimisho kamili na salamu tulivu za kumaliza somo!`;

  if (isStream) {
    try {
      const ai = getGenAI();
      let response = null;
      let fallbackError = null;
      const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

      for (const model of models) {
        try {
          console.log(`[V2 Stream] Attempting content generation for buffering with model: ${model}`);
          response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          const errorMsg = err.message || JSON.stringify(err);
          if (
            errorMsg.includes("429") || 
            errorMsg.includes("503") || 
            errorMsg.includes("quota") || 
            errorMsg.includes("exceeded") || 
            errorMsg.includes("UNAVAILABLE") || 
            errorMsg.includes("demand")
          ) {
            console.log(`[V2 Stream] Model ${model} rate-limited/quota exceeded. Gracefully falling back.`);
          } else {
            console.warn(`[V2 Stream] Model ${model} warning during content generation:`, errorMsg);
          }
          fallbackError = err;
        }
      }

      let textToStream = "";
      if (response && response.text) {
        textToStream = response.text;
      } else {
        throw fallbackError || new Error("Mifano yote ya AI imeshindwa.");
      }

      const stabilizedText = stabilizeLessonContent(textToStream, courseTitle as string, lessonTitle as string, instructorName);

      const chunkSize = 1200;
      let offset = 0;

      clearInterval(heartbeat);

      const streamInterval = setInterval(() => {
        if (offset >= stabilizedText.length) {
          clearInterval(streamInterval);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        
        const chunk = stabilizedText.substring(offset, offset + chunkSize);
        offset += chunkSize;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }, 10);

      res.on('close', () => {
        clearInterval(streamInterval);
      });
    } catch (error: any) {
      clearInterval(heartbeat);
      console.log(`[Giniaz College Server] API stream limit reached or service unavailable for V2. Streaming robust, high-fidelity local Swahili content for: '${lessonTitle}'`);
      
      let fallbackText = generateUrgentFallbackContent(courseTitle as string, lessonTitle as string, instructorName);
      const stabilizedFallback = stabilizeLessonContent(fallbackText, courseTitle as string, lessonTitle as string, instructorName);

      const chunkSize = 1200;
      let offset = 0;

      const streamInterval = setInterval(() => {
        if (offset >= stabilizedFallback.length) {
          clearInterval(streamInterval);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        
        const chunk = stabilizedFallback.substring(offset, offset + chunkSize);
        offset += chunkSize;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }, 10);

      res.on('close', () => {
        clearInterval(streamInterval);
      });
    }
  } else {
    // Non-streaming JSON mode
    try {
      const ai = getGenAI();
      let response = null;
      let fallbackError = null;
      const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

      for (const model of models) {
        try {
          console.log(`[V2 Non-Stream] Attempting content generation with model: ${model}`);
          response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          fallbackError = err;
        }
      }

      if (!response || !response.text) {
        throw fallbackError || new Error("Mifano yote ya AI imeshindwa.");
      }

      const stabilizedText = stabilizeLessonContent(response.text, courseTitle as string, lessonTitle as string, instructorName);
      return res.json({ text: stabilizedText });
    } catch (error: any) {
      console.log(`[Giniaz College Server] Non-stream error. Returning fallback content.`);
      const fallbackText = generateUrgentFallbackContent(courseTitle as string, lessonTitle as string, instructorName);
      const stabilizedFallback = stabilizeLessonContent(fallbackText, courseTitle as string, lessonTitle as string, instructorName);
      return res.json({ text: stabilizedFallback });
    }
  }
});

app.get("/api/gemini/lesson-stream", async (req, res) => {
  const { courseTitle, lessonTitle } = req.query;
  
  if (!courseTitle || !lessonTitle) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 10000);

  res.on('close', () => {
    clearInterval(heartbeat);
  });

  const { instructorName, welcomeText } = getDynamicInstructorAndIntro(courseTitle as string, lessonTitle as string);

  const isSpiritual = String(courseTitle || "").toLowerCase().includes("injili") || 
                      String(courseTitle || "").toLowerCase().includes("biblia") || 
                      String(courseTitle || "").toLowerCase().includes("kiroho") || 
                      String(courseTitle || "").toLowerCase().includes("eskatolojia") || 
                      String(courseTitle || "").toLowerCase().includes("ibada") || 
                      String(courseTitle || "").toLowerCase().includes("sabato") || 
                      String(courseTitle || "").toLowerCase().includes("mungu") || 
                      String(courseTitle || "").toLowerCase().includes("ki-mungu") || 
                      String(courseTitle || "").toLowerCase().includes("waumini") || 
                      String(courseTitle || "").toLowerCase().includes("prophetic") || 
                      String(courseTitle || "").toLowerCase().includes("dini") || 
                      String(courseTitle || "").toLowerCase().includes("dhambi") || 
                      String(courseTitle || "").toLowerCase().includes("nabii") || 
                      String(courseTitle || "").toLowerCase().includes("unabii") || 
                      String(courseTitle || "").toLowerCase().includes("kusimamia") ||
                      String(courseTitle || "").toLowerCase().includes("kufunga na kufungua") ||
                      String(courseTitle || "").toLowerCase().includes("nyota");

  let spiritualInstructions = "";
  if (isSpiritual) {
    spiritualInstructions = `
  
  SHURTI LA KI-BIBLIA NA MAANDIKO YA DIRECT (BIBLE-CENTRIC RULE & DIRECT SCRIPTURES):
  - Somo hili linaendeshwa chini ya misingi thabiti na mafundisho ya BIBLIA TAKATIFU (Holy Bible). Msingi mkuu lazima uwe ni Maandiko Matakatifu.
  - Ni LAZIMA kuonyesha MISTARI YA BIBLIA (Kitabu, Sura:Mstari) moja kwa moja (direct) ndani ya masomo pamoja na MAANDIKO YENYEWE NENO KWA NENO (kwa mfano, "Yohana 3:16 - Kwa maana jinsi hii Mungu aliupenda ulimwengu...").
  - Takribani asilimia hamsini (50%) au zaidi ya somo lote lazima ihusishe mada au dondoo za Mistari ya Biblia takatifu (Bible Verses).
  - Katika KILA MOJA ya zile sehemu 8 chini, ni lazima Mistari ya Biblia isomeke kuanzia mwanzo kabisa mwa sehemu hiyo.
  - Ni LAZIMA utumie tarakimu/nambari (kwa mfano: 1., 2., 3., nk) kuorodhesha na kueleza mistari hii ya Biblia tangu mwanzo kabisa wa kila sehemu. Kila andiko liandikwe kwa herufi zake tangu mwanzo kabisa nchini Tanzania.`;
  }

  let eskatolojiaInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("eskatolojia")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    eskatolojiaInstructions = `
  
  MAUDHUI YA SOMO HILI NA MWONGOZO WAKE (LESSON MAUDHUI & PROPHECY DIMENSIONS):
  - Maudhui na mtazamo mkuu wa somo hili unaopaswa kufundisha kwa undani: "${lessonDescription}"
  - ZINGATIA KIKAMILIFU VIPENGELE VYOTE VITATU VYA NYAKATI (THREE DIMENSIONS OF TIME):
    1. HISTORIA (Yaliyopita): Changanua misingi ya kihistoria ya kibiblia, matukio ya kale, au asili ya somo hili.
    2. SASA (Maisha ya Sasa / Ulimwengu wa sasa): Husisha somo hili na hali halisi ya maisha ya kijamii, kiroho na kisiasa tunayoishi nayo leo duniani kote na nchini Tanzania.
    3. ZIJAZO (Siku Zijazo / Matukio Yanayosubiriwa): Fafanua kwa mtiririko sahihi kabisa wa kinabii mambo ya siku zijazo, vipindi vinavyofuata vya kinabii, na hatima ya milele.
  - Fundisha somo hili kwa weledi wa hali ya juu wa kiprofeshinali kabisa ukifuata mtiririko sahihi wa kinabii wa wokovu kuanzia uumbaji hadi mwisho.`;
  }

  let kinabiiInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("kinabii") || String(courseTitle || "").toLowerCase().includes("kutamka neno") || String(courseTitle || "").toLowerCase().includes("kuona kiroho")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    kinabiiInstructions = `
  
  MAUDHUI YA SOMO LA KINABII, UTAMBAZI WA KIROHO NA UPONYAJI (PROPHETIC, SPIRITUAL SIGHT & HEALING DIMENSIONS):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA NA MAANDIKO MATAKATIFU (DIRECT SCRIPTURES MANDATE): Kila hoja, hatua, na fundisho lazima lithibitishwe na kuelezwa kwa mistari thabiti ya Biblia Takatifu (kwa mfano: Ayubu 22:28, Marko 11:23-24, Marko 16:17-18, Yakobo 5:14-16, 2 Wafalme 6:15-17, Isaya 53:4-5, Waefeso 1:17-18, Warumi 4:17, 1 Wakorintho 12:4-11). Eleza mistari hiyo neno kwa neno na tafsiri yake ya kina ya kiroho.
  - KUTAMKA NENO LIKAWA: Fafanua jinsi maneno ya imani yanavyoachilia amri za kifalme za ki-Mungu (prophetic decrees), jinsi ya kutamka yasiyokuwepo yakawa, na jinsi ya kuondoa milima na changamoto kwa neno lenye upako.
  - KUONA MAMBO KIROHO (SPIRITUAL SIGHT & SEER REALM): Eleza jinsi macho ya moyo/roho yanavyofunguliwa, jinsi ya kutambua ulimwengu wa roho, maono, ndoto, hisia za kinabii na karama ya kupambanua roho.
  - KUOMBEA WAGONJWA NA KUPONYA: Fafanua kanuni za vitendo za kuweka mikono juu ya wagonjwa, mamlaka ya Jina la Yesu na Damu ya Yesu, sala ya imani, na kuamuru maradhi kuondoka.`;
  }

  let kufungaKufunguaInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("kufunga na kufungua")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    kufungaKufunguaInstructions = `
  
  MAUDHUI YA SOMO LA KUFUNGA NA KUFUNGUA KIROHO (BINDING AND LOOSING SPIRITUAL LAWS & RESULTS):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA NA MAMLAKA YA KIFALME: Fafanua kwa ufasaha mkubwa msingi wa kibiblia wa funguo za ufalme wa mbinguni (Mathayo 16:19, Mathayo 18:18-20, Isaya 22:22, Ufunuo 3:7-8, Ayubu 22:28, Luka 10:19, 2 Wakorintho 10:4-5, Waefeso 6:10-18). Eleza mistari hiyo neno kwa neno.
  - KANUNI ZA KISHERIA ZA KIROHO: Fafanua jinsi ya kusimama mbele ya mahakama za mbinguni, kutubu, kutumia Damu ya Yesu, kufunga roho za giza, vifungo vya ukoo na laana, na kufungua milango ya baraka, kibali, uponyaji na ustawi.
  - MATOKEO YAKE DHAHIRI NA KUDUMISHA USHINDI: Eleza jinsi matokeo yanavyojidhihirisha katika maisha halisi ya kila siku na namna ya kuishi katika ushindi wa kudumu bila kurudi nyuma.`;
  }

  let ibadaKikristoInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("ibada ya kikristo") || (String(courseTitle || "").toLowerCase().includes("ibada") && String(courseTitle || "").toLowerCase().includes("kikristo"))) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    ibadaKikristoInstructions = `
  
  MAUDHUI YA SOMO LA IBADA YA KIKRISTO (CHRISTIAN WORSHIP IN SPIRIT AND TRUTH):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA YA IBADA: Fafanua kwa kina kulingana na Yohana 4:23-24, Warumi 12:1-2, Zaburi 100:1-5, Waebrania 10:19-22, Zaburi 95:1-7, 2 Mambo ya Nyakati 5:13-14, Ufunuo 4:8-11, na 1 Wathesalonike 5:16-18.
  - NGAZI ZA IBADA NA MADHABAHU YA MOYO: Tofautisha kwa lugha nyepesi kati ya Shukrani, Sifa, na Ibada ya kweli patakatifu pa patakatifu. Fafanua namna ya kufanya maisha yako yote kuwa dhabihu hai takatifu inayompendeza Mungu.
  - NGUVU YA IBADA: Eleza jinsi ibada ya kweli inavyoangusha ngome za adui, inavyofungua milango ya miujiza, inavyovuta uwepo mtamu wa Mungu, na kujaza amani moyoni.`;
  }

  let kusafishaNyotaInstructions = "";
  if (String(courseTitle || "").toLowerCase().includes("kusafisha nyota") || String(courseTitle || "").toLowerCase().includes("nyota yako")) {
    const lessons = getFallbackCourseOutline(courseTitle as string);
    const matchedLesson = lessons.find(l => l.title.toLowerCase() === (lessonTitle as string).toLowerCase());
    const lessonDescription = matchedLesson ? matchedLesson.description : "";
    kusafishaNyotaInstructions = `
  
  MAUDHUI YA SOMO LA KUSAFISHA NYOTA YAKO KIROHO (SPIRITUAL STAR & DESTINY CLEANSING):
  - Maudhui ya somo hili: "${lessonDescription}"
  - MISTARI YA BIBLIA KUHUSU NYOTA NA HATIMA: Fafanua maana ya nyota kama alama ya utukufu, kusudi, wito na mng'ao wa hatima ya mwanadamu kulingana na Mathayo 2:1-2, Isaya 60:1-3, Danieli 12:3, Hesabu 24:17, 1 Wakorintho 15:41, 1 Yohana 1:7-9, Ufunuo 22:16, na Yoeli 2:25-26.
  - KUONDOA GIZA NA VIFUNGO VYA NYOTA: Eleza kwa hekima na upole jinsi nyota inavyoweza kufunikwa na vumbi la dhambi, laana au vita vya kiroho, na jinsi toba ya kweli na Damu ya Yesu inavyoitakasa na kuifanya ing'ae tena.
  - AMRI ZA KINABII NA KUREJESHA MNG'AO: Jinsi ya kutamka "Ondoka, uangaze" juu ya kazi, biashara, ndoa na uchumi wako, na kanuni za kudumu za kuishi maisha matakatifu ili kulinda nyota yako isichafuke tena.`;
  }

  try {
    const ai = getGenAI();

    const prompt = `Wewe ni mhadhiri mbobezi sana hapa Giniaz College mwenye upendo usio na kifani. Fundisha somo la "${lessonTitle}" kama sehemu ya kozi ya "${courseTitle}" kwa Kiswahili chenye mvuto wa ajabu, upole mwingi, na urahisi mkubwa sana, ukitumia mbinu bora zaidi za juu za kisaikolojia za ufundishaji ili kumfanya msomaji aelewe kwa asili na hisia thabiti.
    ${spiritualInstructions}
    ${eskatolojiaInstructions}
    ${kinabiiInstructions}
    ${kufungaKufunguaInstructions}
    ${ibadaKikristoInstructions}
    ${kusafishaNyotaInstructions}
    
    KANUNI KUU YA KUKATA PARAGRAPH KATIKA VIPANDE VIDOGO VIDOGO VYA WAZO MOJA (SMALL SINGLE-IDEA CHUNKS - MANDATORY):
    - KATA PARAGRAPH ZOTE KATIKA VIPANDE VIDOGO VIDOGO: Kila aya/kipande kimoja LAZIMA kiwe kifupi sana chenye sentensi 1 hadi 2 tu zinazobeba wazo moja tu kuu linalojitegemea kikamilifu.
    - TENGANISHA KILA WAZO NA LINGINE: Ni marufuku kabisa kuchanganya mawazo tofauti ndani ya aya moja au kuandika paragraph ndefu yenye mrundikano wa sentensi nyingi.
    - KILA UNAPOMALIZA WAZO MOJA: Tenganisha kwa kuacha mstari mmoja wa wazi kisha anza wazo linalofuata kwenye aya mpya inayojitegemea kabisa.
    - Hii inafanya somo liwe na mpangilio safi, mtiririko uliotulia, na kumpa msomaji urahisi wa kutafakari kila nukta moja bila msongamano.

    MARUFUKU YA ALAMA ZA KIUFUNDI NA MARKDOWN (STRICT BAN ON #, *, AND (n/n)):
    - USITUMIE KABISA alama za reli (# au ## au ###), alama za nyota (* au **), au alama kama (n/n) na \n\n ndani ya maandishi ya somo.
    - Andika kwa maandishi safi ya maneno ya kawaida ya Kiswahili fasaha bila mapambo yoyote ya alama za kompyuta.

    LUGHA YA WAZI SANA, LAINI NA NYEPESI (CRYSTAL CLEAR, GENTLE & DIRECT EXPLANATIONS):
    - Eleza kila wazo kwa lugha ya wazi kabisa, laini mno, iliyonyooka na nyepesi kueleweka hata kwa uelewa wa ngazi ya msingi, kwa njia ya asili na inayotiririka kwa upole mkubwa bila msamiati mgumu unaotatanisha.
    - UFAFANUZI WENYE UTULIVU: Vunja dhana zote ngumu ziwe nyepesi kama maji, kwa kutumia maneno mepesi, ya moja kwa moja, yenye utulivu na uwazi usio na ukungu wowote.
    - SIRI YA UFUNDISHAJI: Usitaje wala kumwambia msomaji kwamba unatumia mtindo wa ngazi ya msingi; bali tekeleza ufundishaji huo kwa weledi, upendo na uwazi wa ndani kwa ndani.

    MIONGOZO YA KISAIKOJIA, LUGHA YA TASWIRA NA UPENDO MKUBWA (PSYCHOLOGICAL & CHILD-LIKE LOVING TEACHING METHODS):
    - LUGHA RAFIKI NA YA UPENDO KAMA KWA MTOTO MDOGO SANA: Ongea na mwanafunzi wako kwa kutumia sauti ya upole, upendo uliopitiliza na maneno laini kabisa kana kwamba unaongea na mtoto mdogo mpendwa sana ulimwenguni ambaye unataka kumlinda na kumfanya afurahi. Tumia misemo ya joto, ya kubembeleza, na ya kutia moyo sana, lakini kwa heshima kuu ili kumfanya ajisikie salama na mwenye thamani kubwa.
    - MBINU ZA JUU ZA KISAIKOJIA ZA UFUNDISHAJI (HIGH-LEVEL PEDAGOGICAL PSYCHOLOGY):
      1. "Positive Reinforcement": Mpongeze mara kwa mara ("Vizuri sana mwanafunzi wangu!", "Najua unaweza kabisa!", "Ufanye hivi kwa tabasamu na amani...").
      2. "Scaffolding": Anza na dhana rahisi na mpeleke kwenye dhana ngumu kwa upole bila kumfanya ahisi uoga au ugumu wowote.
      3. "Emotional Connection": Husisha mafunzo na hisia za moyoni, furaha, tumaini na amani ya ndani ya mwanadamu.
    - LUGHA YA TASWIRA THABITI (DEEP VISUAL METAPHORS): Jenga picha thabiti za kiakili kwenye fikra zake. Kila mchakato uelezee kwa kutumia taswira hai na zenye hisia (kwa mfano: "hii ni kama mama ndege anavyomlinda mtoto wake kwa mabawa yake ya joto...", "jambo hili ni kama mche mdogo wa ua ukipeperushwa na upepo mwanana asubuhi...", "ni kama kumwaga asali tamu juu ya mkate laini wa ngano...").
    - MWITE MSOMAJI "mwanafunzi wangu mpendwa": Katika maelezo yako yote, tumia neno "mwanafunzi wangu mpendwa" au "mwanafunzi wangu" ili kujenga uhusiano imara na wa karibu wa kifamilia na wa kiroho.
    - MIFANO LAINI NA MIPESI SANAA: Toa mifano ya kawaida sana, ya upole, na ya kisaikolojia ya hapa nchini Tanzania (kama kushika mkono wa rafiki, kumwagilia bustani ndogo, kufurahia kikombe cha chai ya moto, nk) ili kurahisisha uelewa kwa kiwango cha juu zaidi.

    SHURTI KUU LA MANENO MACHACHE SANA KABLA YA SEHEMU YA KWANZA (MINIMAL WORDS BEFORE 'SEHEMU YA KWANZA: UTANGULIZI WA KINA'):
    - Kabla ya kufika kwenye kichwa cha habari cha "SEHEMU YA KWANZA: UTANGULIZI WA KINA", weka maneno machache sana (sentensi moja tu fupi mno ya maneno 5 hadi 10 ya ukaribisho, kwa mfano: "Karibu katika somo hili la ${lessonTitle} hapa Giniaz College.").
    - Mara moja baada ya sentensi hiyo fupi, anza moja kwa moja na kichwa cha habari:
      SEHEMU YA KWANZA: UTANGULIZI WA KINA
    - NI MARUFUKU KABISA kuandika aya ndefu, utangulizi mrefu au maelezo mengi kabla ya "SEHEMU YA KWANZA: UTANGULIZI WA KINA".

    SHURTI KUU LA KUTOKATIKA NA UTEMBEZAJI WA KINA (MAXIMUM WORDCOUNT OPTIMIZATION & COMPLETION GUARANTEE):
    - SHURTI KUHUSU UREFU WA SEHEMU (LENGTH OF SECTIONS RULE):
      1. KILA SEHEMU KATIKA ZILE 7 (EACH OF THE 7 SECTIONS): Kila sehemu kuanzia Sehemu ya Kwanza hadi Sehemu ya Saba LAZIMA iwe na urefu wa maneno 340 hadi 390 ya maelezo thabiti, ya kina na ya kutosha. Hii ni sheria isiyovunjika ili kuhakikisha kuwa urefu wa somo zima unakuwa kati ya maneno 2400 na 2700.
      2. Maneno ya mwanzo kabla ya kufika "SEHEMU YA KWANZA: UTANGULIZI WA KINA" yawe machache sana (sentensi moja tu fupi).
    - SHURTI LA DHAHABU: Ni marufuku kabisa kukatisha somo njiani au kuishia katikati! Somo LAZIMA lifike mwisho kikamilifu na kukamilisha sehemu zote 7 hadi mwisho wa sehemu ya saba kwa usahihi kabisa. Panga na ueneze urefu wa maelezo yako vizuri ili ukurasa uishie kwenye hitimisho rasmi na salamu ya mwisho ya mwalimu bila kukatika kwa herufi au sentensi.
    - Toa uchambuzi mpana, ukiingia katika maelezo ya nadharia, mafundisho ya kiroho, mifano hai, changamoto, na tafakari ya kiroho na kisaikolojia nchini Tanzania.
    - Epuka kabisa ufupisho, maswali au muhtasari (summary) wa aina yoyote kwenye sehemu zote 7. Panua kila hoja ili ifikie urefu unaotakiwa wa maneno 340 hadi 390.
    
    MIONGOZO YA UPANUZI WA MAUDHUI NA MIFANO YA JAMII (CONTENT EXPANSION & SOCIETAL EXAMPLES):
    - MIFANO YA KILA SIKU KATIKA JAMII (SOCIETAL EXAMPLES): Katika KILA MOJA ya sehemu zote 7 za somo, ni lazima upenyeze na uingize MFANO MMOJA MFUPI lakini wenye kugusa hisia na kufundisha unaotokea kila siku katika jamii yetu ya sasa (kwa mfano: maisha ya familia za mtaani, changamoto za mama lishe, usafiri wa bodaboda, biashara za sokoni, vijana wa vijiweni, migogoro ya kifamilia, n.k.). Mfano huu lazima upenyeze ndani kabisa ya maelezo ya kila sehemu.
    - ONGEZA MAELEZO YENYE KINA: Jaza maelezo ya nadharia, falsafa, na kanuni zote za msingi kwa urefu usiopungua sentensi 8 hadi 12 kwa kila sehemu ili kufikia urefu wa maneno 340 hadi 390.
    - ONYO KALI: Ni marufuku kabisa kuzalisha sehemu yoyote yenye jina au maudhui ya 'Muhtasari', 'Majumuisho', 'Maswali', 'Chemsha Bongo' au 'Tathmini'. Somo lote lazima liwe la mafundisho ya moja kwa moja pekee tangu mwanzo hadi mwisho, isipokuwa sehemu ya mwisho ambayo ni ya Tafakari na Kazi ya Nyumbani ya vitendo bila maswali ya kujibu!

    KANUNI YA UPANGAJI WA AYA NA MAPUMZIKO KWA MSOMAJI (PARAGRAPH FORMATTING & RESTING POINTS RULE):
    - KILA KIPANDE/AYA LAZIMA KIWE KIFUPI SANA (SENTENSI 1 HADI 2 TU): Kila kipande cha paragraph kinabeba wazo moja tu lililonyooka na linalojitegemea.
    - Tenganisha kila aya na aya inayofuata kwa mstari wa wazi ili kuweka nafasi ya kutosha na kutoa sehemu nzuri ya mapumziko kwa mwanafunzi.
    - EPUKA KABISA KUNDUNDIKA MAANDISHI: Usiandike aya ndefu sana au lundo kubwa la maneno bila mapumziko. Mtiririko uwe laini, wa kuvutia, wenye hewa na nafasi nyingi za kupumua.
    
    TUMIA MUUNDO HUU KUENDELEZA SOMO LAKO LA MAELEZO (LAZIMA KILA SOMO LIWE NA SEHEMU HIZI 7 KIKAMILIFU - HAKIKISHA UNAFIKA MWISHO KABISA WA SEHEMU YA 7 BILA KUKATIKA):
    - SEHEMU YA KWANZA: UTANGULIZI WA KINA (Toa utanguluzi thabiti na wa kuvutia wenye urefu wa maneno 340 hadi 390 kueleza chimbuko na umuhimu wa somo kwa Kiswahili nyepesi na upendo mkubwa, pamoja na mfano mmoja mfupi wa jamii).
    - SEHEMU YA PILI: UFAFANUZI MKUU WA NADHARIA & KANUNI (Changanua na fafanua kwa undani nadharia zote, falsafa, na kanuni za msingi kwa urefu wa maneno 340 hadi 390, pamoja na mfano mmoja mfupi wa jamii).
    - SEHEMU YA TATU: HATUA KWA HATUA ZA VITENDO (Orodha ya hatua makini na za kina za jinsi ya kufanya au kutekeleza jambo hili hatua kwa hatua kwa vitendo vyenye maelezo marefu yenye urefu wa maneno 340 hadi 390 na mtiririko thabiti, pamoja na mfano mmoja mfupi wa jamii).
    - SEHEMU YA NNE: MIFANO HALISI & KESI ZA KAZI (Toa mifano laini, ya kweli na hadithi za matukio nchini Tanzania za kusisimua, zenye maelezo ya kina ya urefu wa maneno 340 hadi 390, pamoja na mfano mmoja mfupi wa jamii).
    - SEHEMU YA TANO: CHANGAMOTO ZA KAWAIDA & SULUHU (Chambua kila kikwazo na namna nzuri thabiti ya kuitatua kwa urefu wa maneno 340 hadi 390, pamoja na mfano mmoja mfupi wa jamii).
    - SEHEMU YA SITA: USHAURI WA KITAALAMU & MBINU ZA JUU (Mbinu mbadala, miongozo na siri za kukuza mafanikio yenye urefu wa maneno 340 hadi 390 kutoka kwa wataalamu wetu waliobobezi, pamoja na mfano mmoja mfupi wa jamii).
    - SEHEMU YA SABA: TAFAKARI KUU & KAZI YA NYUMBANI (Sehemu hii yenye urefu wa maneno 340 hadi 390 inajumuisha simulizi fupi ya ushuhuda, tafakari ya hisia kali za maisha, kazi ya nyumbani ya vitendo ili kujifunza maishani bila kuweka maswali yoyote ya kujibu wala muhtasari, mfano mmoja mfupi wa jamii, na kauli mbiu ya chuo ya Giniaz College chini ya Joseph Marwa Kyama).
    
    ONYO LA KITAALUMA NA SHURTI LA KUKAMILISHA: USITUMIE KABISA alama za reli (#), nyota (* au **), au alama za (n/n). Andika maudhui yako yote kwa kutumia aya kamili zilizounganishwa kwa vichwa vya habari vyenye maandishi ya kawaida tu (kwa mfano, "SEHEMU YA KWANZA: UTANGULIZI WA KINA"). Toa maudhui mfululizo hadi mwisho kabisa wa Sehemu ya Saba bila kukata somo katikati au kufupisha ghafla. Hakikisha msomaji anapata hitimisho kamili na salamu tulivu za kumaliza somo!`;

    let response = null;
    let fallbackError = null;
    const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

    for (const model of models) {
      try {
        console.log(`[V1 Stream] Attempting content generation with model: ${model}`);
        response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        const errorMsg = err.message || JSON.stringify(err);
        if (
          errorMsg.includes("429") || 
          errorMsg.includes("503") || 
          errorMsg.includes("quota") || 
          errorMsg.includes("exceeded") || 
          errorMsg.includes("UNAVAILABLE") || 
          errorMsg.includes("demand")
        ) {
          console.log(`Model ${model} limit/service info: Dynamic fallback triggered gracefully.`);
        } else {
          console.warn(`Model ${model} warning during content generation:`, errorMsg);
        }
        fallbackError = err;
      }
    }

    let textToStream = "";
    if (response && response.text) {
      textToStream = response.text;
    } else {
      throw fallbackError || new Error("Mifano yote ya AI imeshindwa.");
    }

    const stabilizedText = stabilizeLessonContent(textToStream, courseTitle as string, lessonTitle as string, instructorName);

    const chunkSize = 1200;
    let offset = 0;

    clearInterval(heartbeat);

    const streamInterval = setInterval(() => {
      if (offset >= stabilizedText.length) {
        clearInterval(streamInterval);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      
      const chunk = stabilizedText.substring(offset, offset + chunkSize);
      offset += chunkSize;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }, 10);

    res.on('close', () => {
      clearInterval(streamInterval);
    });
  } catch (error: any) {
    clearInterval(heartbeat);
    console.log(`[Giniaz College Server] API stream limit reached or service unavailable. Streaming robust, high-fidelity local Swahili content for: '${lessonTitle}'`);
    
    let fallbackText = generateUrgentFallbackContent(courseTitle as string, lessonTitle as string, instructorName);
    const stabilizedFallback = stabilizeLessonContent(fallbackText, courseTitle as string, lessonTitle as string, instructorName);

    const chunkSize = 1200;
    let offset = 0;

    const streamInterval = setInterval(() => {
      if (offset >= stabilizedFallback.length) {
        clearInterval(streamInterval);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
      
      const chunk = stabilizedFallback.substring(offset, offset + chunkSize);
      offset += chunkSize;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }, 10);

    res.on('close', () => {
      clearInterval(streamInterval);
    });
  }
});

app.post("/api/gemini/speech", async (req, res) => {
  try {
    let { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Maandishi yanajitajika." });
    }

    const ai = getGenAI();

    // If the text is very long, use gemini-3.5-flash to compress/summarize it into a beautifully spoken-style narration script.
    // This keeps the request well within the 10,000 input tokens ceiling of the free-tier tts model.
    if (text.length > 1200) {
      console.log(`[Speech API] Text has ${text.length} characters. Summarizing with gemini-3.5-flash to optimize for spoken-style educational narration script...`);
      try {
        const summarizationPrompt = `Mimi ni mhadhiri mbobezi wa Giniaz College inayohamasishwa na Joseph Marwa Kyama. 
        Tafadhali fupisha maelezo yafuatayo kuwa muhtasari mzuri, thabiti na unaovutia kwa ajili ya kusomewa mwanafunzi (Audio Podcast Script).
        Urefu uwe kati ya maneno 150 hadi 250 pekee (isizidi maneno 280).
        Fanya maelezo yawe ya kutia moyo, fasaha, na rahisi kueleweka kwa Kiswahili. Usitumie alama za nyota, hashtags (#), au doti za orodha. 
        Anza na utangulizi mfupi wa kualika msikilizaji kwenye somo kutoka Giniaz College.
        
        Maudhui ya somo la kufupisha:
        ${text}`;

        const summaryResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: summarizationPrompt,
        });

        if (summaryResponse.text) {
          text = summaryResponse.text.trim();
          console.log(`[Speech API] Successfully optimized text. Spoken script has ${text.length} characters.`);
        }
      } catch (sumErr: any) {
        const errorMsg = sumErr.message || String(sumErr);
        if (
          errorMsg.includes("429") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("exceeded") ||
          errorMsg.includes("RESOURCE_EXHAUSTED") ||
          errorMsg.includes("Too Many Requests")
        ) {
          console.log("[Speech API] Summarization rate-limit/quota reached. Falling back to simple substring.");
        } else {
          console.error("Error summarizing text for TTS, falling back to substring of first 1000 characters:", errorMsg);
        }
        // Fallback to truncating text if summarization fails
        text = text.substring(0, 1000) + "...";
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    res.json({ audio: base64Audio || null });
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    if (
      errorMsg.includes("429") ||
      errorMsg.includes("quota") ||
      errorMsg.includes("exceeded") ||
      errorMsg.includes("RESOURCE_EXHAUSTED") ||
      errorMsg.includes("Too Many Requests")
    ) {
      console.log("[Speech API] Notice: TTS audio generation quota or rate-limit reached.");
    } else {
      console.error("Error in /api/gemini/speech:", errorMsg);
    }
    let userMessage = error.message || "Imeshindwa kuunda sauti kwa sasa.";
    if (error.message && (error.message.includes("429") || error.message.toLowerCase().includes("quota") || error.message.toLowerCase().includes("exhausted"))) {
      userMessage = "Kikomo cha kubadilisha sauti kwa sasa kimefikiwa chini ya mpango usiolipiwa wa API (TTS Quota Exceeded). Tafadhali jaribu tena baada ya sekunde 30 au fupisha mambo unayoomba.";
    }
    res.status(500).json({ error: userMessage });
  }
});

app.post("/api/gemini/generate-app-code", async (req, res) => {
  const { appName, category, apiKey, contentLinks, logoUrl, aboutUs, theme, promptExtension } = req.body;

  if (!appName) {
    return res.status(400).json({ error: "Jina la app ni la lazima!" });
  }

  // Define styling elements based on selected theme
  let bg = "#0f172a";
  let text = "#f8fafc";
  let accent = "#0ea5e9";
  let cardBg = "#1e293b";

  if (theme === "cyber") {
    bg = "#030712"; text = "#38bdf8"; accent = "#06b6d4"; cardBg = "#1f2937";
  } else if (theme === "sunrise") {
    bg = "#180c04"; text = "#fef3c7"; accent = "#fbbf24"; cardBg = "#291508";
  } else if (theme === "forest") {
    bg = "#022c22"; text = "#d1fae5"; accent = "#10b981"; cardBg = "#064e3b";
  } else if (theme === "slate") {
    bg = "#18181b"; text = "#fafafa"; accent = "#3b82f6"; cardBg = "#27272a";
  } else if (theme === "light") {
    bg = "#f8fafc"; text = "#0f172a"; accent = "#2563eb"; cardBg = "#ffffff";
  }

  const getOfflineFallbackHTML = () => {
    return `<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${appName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: \${bg};
      color: \${text};
    }
    .custom-card {
      background-color: \${cardBg};
      border: 1px solid \${accent}40;
    }
  </style>
</head>
<body class="min-height-screen font-sans flex flex-col justify-between pb-20">
  <!-- Header -->
  <header class="p-4 border-b border-opacity-10 flex justify-between items-center" style="border-color: \${accent}">
    <div class="flex items-center gap-3">
      \${logoUrl ? \`<img src="\${logoUrl}" alt="Logo" class="w-10 h-10 rounded-full border" style="border-color: \${accent}" referrerPolicy="no-referrer">\` : \`<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style="background: \${accent}">\${appName.charAt(0)}</div>\`}
      <div>
        <h1 class="font-bold text-lg leading-tight">\${appName}</h1>
        <span class="text-xs opacity-60">\${category}</span>
      </div>
    </div>
    <div class="text-xs px-2 py-1 rounded border opacity-80" style="border-color: \${accent}; color: \${accent}">
      Offline Mode
    </div>
  </header>

  <!-- Content Sections -->
  <main class="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
    <!-- About Card -->
    <div class="p-4 rounded-xl custom-card space-y-2">
      <h2 class="font-semibold text-base flex items-center gap-2" style="color: \${accent}">
        <span>ℹ️</span> Kuhusu Programu Hii
      </h2>
      <p class="text-sm opacity-85 leading-relaxed">
        \${aboutUs}
      </p>
      <div class="text-xs pt-2 border-t border-opacity-10 flex justify-between" style="border-color: \${accent}">
        <span>Mlezi wa Maudhui:</span>
        <span class="font-semibold">Giniaz College / Joseph Marwa Kyama</span>
      </div>
    </div>

    <!-- Category Specific Layouts -->
    \${category === "App ya Burudani na Video" ? \`
    <div class="p-4 rounded-xl custom-card space-y-3">
      <h2 class="font-semibold text-base" style="color: \${accent}">🎬 Orodha ya Video na Burudani</h2>
      <div class="aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center relative group">
        <img src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop" class="w-full h-full object-cover opacity-60" alt="Video cover">
        <div class="absolute inset-0 flex items-center justify-center">
          <button class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style="background: \${accent}" onclick="alert('Kichezaji hiki kimeigwa kwa sasa offline! Katika App Creator 24, weka kiungo hiki cha video kwenye tabo: \${contentLinks || 'Bila Kiungo'}')">▶</button>
        </div>
      </div>
      <div class="space-y-2">
        <div class="p-2 rounded bg-opacity-10 flex justify-between items-center bg-white">
          <span class="text-xs font-medium">Video #1: Utangulizi wa Sanaa na Maarifa</span>
          <span class="text-[10px] opacity-60">05:40</span>
        </div>
        <div class="p-2 rounded bg-opacity-10 flex justify-between items-center bg-white">
          <span class="text-xs font-medium">Video #2: Mbinu za Ujasiriamali Tanzania</span>
          <span class="text-[10px] opacity-60">12:15</span>
        </div>
      </div>
    </div>
    \` : ''}

    \${category === "App ya Redio na Music Streaming" ? \`
    <div class="p-4 rounded-xl custom-card space-y-3">
      <h2 class="font-semibold text-base" style="color: \${accent}">🎵 Sauti na Redio Mubashara</h2>
      <div class="p-4 rounded-lg bg-opacity-5 bg-white border border-dashed flex flex-col items-center justify-center space-y-2" style="border-color: \${accent}40">
        <div class="w-16 h-16 rounded-full flex items-center justify-center border animate-pulse" style="border-color: \${accent}">
          <span class="text-2xl">📻</span>
        </div>
        <div class="text-center">
          <div class="text-sm font-semibold">Redio ya Kijamii Mubashara</div>
          <div class="text-xs opacity-60">Kusawazisha masafa ya mtandaoni...</div>
        </div>
        <button class="px-4 py-2 rounded-full text-xs font-bold text-white mt-2" style="background: \${accent}" onclick="alert('Inacheza sauti ya majaribio! Hakikisha unaingiza streaming URL yako: \${contentLinks || 'Bila Kiungo'}')">Sikiliza Sasa</button>
      </div>
    </div>
    \` : ''}

    \${category === "App ya Habari na Makala" ? \`
    <div class="p-4 rounded-xl custom-card space-y-3">
      <h2 class="font-semibold text-base" style="color: \${accent}">📰 Habari na Makala Mpya</h2>
      <div class="space-y-3">
        <div class="p-3 rounded-lg bg-opacity-5 bg-white border border-opacity-10 space-y-1" style="border-color: \${accent}">
          <div class="text-xs font-bold uppercase tracking-wider" style="color: \${accent}">TAARIFA RASMI</div>
          <h3 class="font-semibold text-sm">Giniaz College Yaleta Mapinduzi Mapya ya API Economy Kibaha</h3>
          <p class="text-xs opacity-75">Chuo chetu cha ufundi stadi chini ya mkurugenzi Joseph Marwa Kyama kimeleta mtaala unaofundisha wanafunzi kuingiza kipato kikubwa bila kuandika kodi...</p>
        </div>
        <div class="p-3 rounded-lg bg-opacity-5 bg-white border border-opacity-10 space-y-1" style="border-color: \${accent}">
          <div class="text-xs font-bold uppercase tracking-wider" style="color: \${accent}">BIASHARA</div>
          <h3 class="font-semibold text-sm">Mbinu za Kupata Google API Keys Bila Malipo</h3>
          <p class="text-xs opacity-75">Soma jinsi ya kupata akaunti ya bure ya majaribio ya Google Cloud Console na kuanza kutengeneza kadi za ramani na huduma...</p>
        </div>
      </div>
    </div>
    \` : ''}

    \${category === "App ya Kilimo na Mazao" ? \`
    <div class="p-4 rounded-xl custom-card space-y-3">
      <h2 class="font-semibold text-base" style="color: \${accent}">🌾 Bei ya Mazao na Miongozo ya Kilimo</h2>
      <div class="grid grid-cols-2 gap-2">
        <div class="p-3 rounded-lg bg-opacity-10 bg-white text-center">
          <div class="text-xs opacity-60">Mahindi (kwa gunia)</div>
          <div class="text-lg font-bold">TSH 95,000</div>
          <div class="text-[10px] text-green-500">▲ +2.4% wiki hii</div>
        </div>
        <div class="p-3 rounded-lg bg-opacity-10 bg-white text-center">
          <div class="text-xs opacity-60">Mchele (kwa kilo)</div>
          <div class="text-lg font-bold">TSH 2,200</div>
          <div class="text-[10px] text-red-500">▼ -0.8% wiki hii</div>
        </div>
      </div>
      <p class="text-xs opacity-75 leading-relaxed text-center">
        Data inafanya kazi offline. Itasasishwa pindi mtandao utakapopatikana. Viungo vyako vya soko: \${contentLinks || 'Standard API Market Feed'}
      </p>
    </div>
    \` : ''}

    \${category === "App ya Elimu na Shule" ? \`
    <div class="p-4 rounded-xl custom-card space-y-3">
      <h2 class="font-semibold text-base" style="color: \${accent}">🎓 Masomo ya Shule na Portal ya Elimu</h2>
      <div class="space-y-2">
        <div class="p-3 rounded-lg bg-opacity-5 bg-white border border-opacity-10 flex justify-between items-center" style="border-color: \${accent}">
          <div>
            <div class="text-sm font-semibold">Hesabu (Hisabati) - Darasa la 5</div>
            <div class="text-xs opacity-60">Maswali 12 ya mazoezi offline</div>
          </div>
          <span class="text-xl">✏️</span>
        </div>
        <div class="p-3 rounded-lg bg-opacity-5 bg-white border border-opacity-10 flex justify-between items-center" style="border-color: \${accent}">
          <div>
            <div class="text-sm font-semibold">Sayansi - Mazingira Yetu</div>
            <div class="text-xs opacity-60">Kusoma offline bila bando</div>
          </div>
          <span class="text-xl">🧬</span>
        </div>
      </div>
    </div>
    \` : ''}

    \${category === "App ya Huduma na Biashara" ? \`
    <div class="p-4 rounded-xl custom-card space-y-3">
      <h2 class="font-semibold text-base" style="color: \${accent}">💼 Huduma, Malipo na Kuagiza</h2>
      <div class="p-3 rounded-lg bg-opacity-5 bg-white border border-opacity-10 space-y-2" style="border-color: \${accent}">
        <div class="text-xs opacity-75">Google API Key iliyounganishwa:</div>
        <div class="p-2 rounded bg-black bg-opacity-40 font-mono text-[11px] truncate" style="color: \${accent}">
          \${apiKey || 'N/A (Bila Key - Weka API Key yako)'}
        </div>
        <button class="w-full py-2 rounded font-bold text-xs text-white" style="background: \${accent}" onclick="alert('Fomu imesanidiwa na API Key yako tayari kukupatia utajiri! Paste hii kwenye App Creator 24 kuanza kazi.')">Tengeneza Agizo la Huduma</button>
      </div>
    </div>
    \` : ''}

    <!-- API Key Status / Tutorial info -->
    <div class="p-3 rounded-lg bg-opacity-5 bg-white text-center text-xs space-y-1">
      <div class="font-bold text-yellow-500">💡 Mwongozo wa Kumalizia App Creator 24</div>
      <p class="opacity-80">Copy code yote ya ukurasa huu, nenda kwenye akaunti yako ya App Creator 24, tengeneza <b>Section</b> ya aina ya <b>Web/HTML</b>, kisha bofya <b>Enter HTML code</b> na upaste huko kisha bofya Save!</p>
    </div>
  </main>

  <!-- Footer Navigation -->
  <footer class="fixed bottom-0 left-0 right-0 p-3 flex justify-around border-t border-opacity-10 bg-black bg-opacity-90" style="border-color: \${accent}">
    <button class="text-xs flex flex-col items-center gap-1" style="color: \${accent}">
      <span>🏠</span>
      <span>Nyumbani</span>
    </button>
    <button class="text-xs flex flex-col items-center gap-1 opacity-60" onclick="alert('Kazi ya kadi ndogo (Section ID link) offline! Kwenye App Creator 24 kadi hii itaunganishwa upesi na sections zingine.')">
      <span>🛠️</span>
      <span>Huduma</span>
    </button>
    <button class="text-xs flex flex-col items-center gap-1 opacity-60" onclick="alert('Maudhui ya Chuo cha Giniaz College Kibaha TZ')">
      <span>🎓</span>
      <span>Msaada</span>
    </button>
  </footer>
</body>
</html>`;
  };

  const aiPrompt = `Wewe ni mhadhiri na msanidi programu mbobezi wa UI/UX wa chuo cha Giniaz College (chini ya Joseph Marwa Kyama, makao makuu Kibaha, Pwani, TZ).
Mwanafunzi wako asiyejua code anataka kutengeneza Single-Page HTML App ya kuvutia ili kuiweka App Creator 24.
Hapa kuna taarifa za App:
Jina la App: "${appName}"
Makundi/Kategoria: "${category}"
Google API Key (kama ipo): "${apiKey || 'Bila API Key (Matumizi ya Ndani)'}"
Viungo vya Maudhui/Media: "${contentLinks || 'Bila Viungo'}"
Kiungo cha Nembo/Logo URL: "${logoUrl || ''}"
Kuhusu Sisi: "${aboutUs || 'App hii imetengenezwa kwa uwezo wa AI na mafunzo kutoka Giniaz College.'}"
Theme iliyochaguliwa: "${theme || 'slate'}"
${promptExtension ? `Maelekezo ya Ziada ya mteja (Mboreshaji wa AI): "${promptExtension}"` : ''}

Tengeneza msimbo kamili (Full Code) wa HTML5, CSS na JavaScript kama Faili MOJA lililokamilika ambalo lina sifa zifuatazo:
1. Linatumia Tailwind CSS kupitia CDN au mitindo (CSS) ya kuvutia mno na athari za huishaji (animations).
2. Linajumuisha nembo ya chuo cha Giniaz College na sifa zilizopo Kibaha, Pwani, TZ na mlezi wa chuo Joseph Marwa Kyama.
3. Muundo wake uwe wa Kisasa sana (kama bento grid au kadi za kifahari) unaofaa kwa vioo vya simu (Responsive Mobile Design).
4. Ina menyu ya tabo chini (Bottom Navigation Bar) au tabo za juu ili kuruhusu kurasa ndogo kama:
   - "Nyumbani" (Dashboard yenye kadi thabiti, k.m. video player simulizi, michezo, feeds, au fomu kulingana na kategoria).
   - "Huduma/Maudhui" (Inayoonyesha orodha ya video, chaneli za tv, nyimbo au mazao kwa kutumia viungo au vyanzo vilivyowekwa na mtumiaji).
   - "Kuhusu Sisi & Chuo" (Ukurasa wenye maelezo ya app, mchango wa Giniaz College na sifa zake).
5. Iandikwe kwa lugha ya KISWAHILI sanifu na yenye upendo, hekima na kutia moyo.
6. Toa TU msimbo wa HTML na ufungaji wa tagi ya html. Usiweke maneno mengine yoyote kabla au baada ya code (Toa raw HTML code pekee).`;

  try {
    const ai = getGenAI();
    let response = null;
    let fallbackError = null;
    const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

    for (const model of models) {
      try {
        console.log(`[App Creator AI] Attempting with model: \${model}`);
        response = await ai.models.generateContent({
          model,
          contents: aiPrompt,
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        fallbackError = err;
      }
    }

    if (!response || !response.text) {
      throw fallbackError || new Error("Models exhausted");
    }

    let code = response.text.trim();
    // Clean markdown code blocks if AI wrapped them
    if (code.startsWith("```html")) {
      code = code.substring(7);
    } else if (code.startsWith("```")) {
      code = code.substring(3);
    }
    if (code.endsWith("```")) {
      code = code.substring(0, code.length - 3);
    }
    code = code.trim();

    return res.json({ code });

  } catch (error: any) {
    console.log("[App Creator AI] Error during content generation. Returning dynamic Swahili offline template.", error.message);
    const code = getOfflineFallbackHTML();
    return res.json({ code });
  }
});

// Serve PWA assets directly to prevent routing redirects or Vite middleware interference
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  
  const publicPath = path.join(process.cwd(), "public", "sw.js");
  const distPath = path.join(process.cwd(), "dist", "sw.js");
  
  // Try dist in prod, handle fallback gracefully
  if (process.env.NODE_ENV === "production") {
    res.sendFile(distPath, (err) => {
      if (err) {
        res.sendFile(publicPath);
      }
    });
  } else {
    res.sendFile(publicPath);
  }
});

app.get("/manifest.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const publicPath = path.join(process.cwd(), "public", "manifest.json");
  const distPath = path.join(process.cwd(), "dist", "manifest.json");
  
  if (process.env.NODE_ENV === "production") {
    res.sendFile(distPath, (err) => {
      if (err) {
        res.sendFile(publicPath);
      }
    });
  } else {
    res.sendFile(publicPath);
  }
});

app.get("/icon.png", (req, res) => {
  res.setHeader("Content-Type", "image/png");
  const publicPath = path.join(process.cwd(), "public", "icon.png");
  const distPath = path.join(process.cwd(), "dist", "icon.png");
  
  if (process.env.NODE_ENV === "production") {
    res.sendFile(distPath, (err) => {
      if (err) {
        res.sendFile(publicPath);
      }
    });
  } else {
    res.sendFile(publicPath);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
