import type { Lang } from '../lib/lang'
import type { MediaKey } from './media'

/**
 * Projects. The first one is the cinematic feature on the home page; every
 * project also gets its own page at /work/:slug. Text is written per language.
 */

interface ProjectText {
  title: string
  category: string
  descriptor: string
  client: string
  role: string
  overview: string
  challenge: string
  approach: string
}

export interface Project {
  slug: string
  year: number
  cover: MediaKey
  /** detail page imagery: one wide plate, then up to two side by side */
  images: { wide?: MediaKey; pair?: MediaKey[] }
  stack: string
  live?: string
  code?: string
  text: Record<Lang, ProjectText>
}

export const projects: Project[] = [
  {
    slug: 'eloria',
    year: 2026,
    cover: 'eloriaHome',
    images: { wide: 'eloriaLibrary', pair: ['eloriaSubscribe'] },
    stack: 'JavaScript · Supabase · Postgres · Auth · Row-Level Security',
    live: 'https://abdullah2036.github.io/eloriaprojectV2/',
    code: 'https://github.com/abdullah2036/eloriaprojectV2',
    text: {
      en: {
        title: 'Eloria',
        category: 'Publishing Platform',
        descriptor: 'A self-publishing home for an Arabic novelist — designed for an author with no technical background to run entirely on her own.',
        client: 'An independent novelist',
        role: 'Design & full-stack development',
        overview:
          'Eloria is where an Arabic novelist publishes her work: a library of novels, a reader with font controls and a progress bar, quotes, characters and an about page — all edited in place by the author herself.',
        challenge:
          'The author has no technical background and no budget for a CMS, yet needed to publish alone — without ever breaking the site or losing a chapter.',
        approach:
          'Version one kept everything in a single JSON file committed through the GitHub API, with drafts saved in the browser and a setup guide written in Arabic. Version two moved it onto Supabase — Postgres, authentication, storage and row-level security — so edits go live instantly, readers can subscribe to new chapters, and only the author can write.',
      },
      ar: {
        title: 'إيلوريا',
        category: 'منصّة نشر',
        descriptor: 'بيتٌ للنشر الذاتي لروائية عربية، صُمّم لتديره كاتبة بلا خلفية تقنية وحدها تماماً.',
        client: 'روائية مستقلة',
        role: 'التصميم والتطوير الكامل',
        overview:
          'إيلوريا هي المكان الذي تنشر فيه روائية عربية أعمالها: مكتبة للروايات، وقارئ فيه تحكّم بحجم الخط وشريط للتقدّم، واقتباسات وشخصيات وصفحة تعريف — وكلها تعدّلها الكاتبة بنفسها في مكانها.',
        challenge: 'لا خلفية تقنية لدى الكاتبة، ولا ميزانية لنظام إدارة محتوى، وعليها أن تنشر وحدها دون أن تكسر الموقع أو تفقد فصلاً واحداً.',
        approach:
          'في النسخة الأولى كان المحتوى كله في ملف JSON واحد يُحفظ عبر واجهة GitHub البرمجية، مع مسودات في المتصفح ودليل إعداد مكتوب بالعربية. وفي الثانية انتقل إلى Supabase: قاعدة Postgres ومصادقة وتخزين وسياسات أمان على مستوى الصفوف؛ فصار النشر فورياً، وصار بوسع القرّاء الاشتراك في الفصول الجديدة، ولا يكتب أحدٌ غير الكاتبة.',
      },
    },
  },
  {
    slug: 'pairing-board',
    year: 2026,
    cover: 'chessDesktop',
    images: { wide: 'chessLive', pair: ['chessMobile'] },
    stack: 'JavaScript · Web Workers · Cloudflare Workers · Edge caching',
    live: 'https://chessresults.pageui.workers.dev/',
    code: 'https://github.com/abdullah2036/chessUI',
    text: {
      en: {
        title: 'Pairing Board',
        category: 'Live Tournament Tool',
        descriptor: 'Find your board in seconds — a live chess pairing viewer, born from watching players crowd around printed sheets.',
        client: 'Chess players & organisers',
        role: 'Product design & development',
        overview:
          'Paste a chess-results tournament link or ID, type your name, and Pairing Board shows only what a player needs: board number, colour, opponent, rating and result — refreshing live while a round is on.',
        challenge: 'Tournament pairing tables are huge and built for desktops. At the venue, players scroll endlessly on their phones hunting for a single line.',
        approach:
          'A dependency-free, mobile-first front end with a “table tent” card for every match and name search that works in any order. Parsing runs off the main thread in Web Workers, and a Cloudflare Worker fetches and edge-caches the source pages so it stays fast when a whole hall opens it at once.',
      },
      ar: {
        title: 'لوحة المواجهات',
        category: 'أداة بطولات مباشرة',
        descriptor: 'اعثر على طاولتك في ثوانٍ — عارضٌ مباشر لمواجهات الشطرنج، وُلد من مشهد لاعبين يتزاحمون حول أوراق مطبوعة.',
        client: 'لاعبو الشطرنج ومنظّمو البطولات',
        role: 'تصميم المنتج والتطوير',
        overview:
          'الصق رابط البطولة من chess-results أو رقمها، واكتب اسمك، فتعرض لك اللوحة ما يحتاجه اللاعب فقط: رقم الطاولة واللون والخصم والتصنيف والنتيجة — وتتحدّث مباشرة طوال الجولة.',
        challenge: 'جداول المواجهات في البطولات ضخمة ومصمّمة لشاشات الحاسب، وفي القاعة يقضي اللاعبون وقتاً طويلاً في التمرير على جوالاتهم بحثاً عن سطر واحد.',
        approach:
          'واجهة بلا أي مكتبات، مصمّمة للجوال أولاً، ببطاقة «طاولة» لكل مباراة وبحثٍ عن الاسم بأي ترتيب. التحليل يجري خارج الخيط الرئيسي عبر Web Workers، وعاملٌ على Cloudflare يجلب الصفحات ويخزّنها مؤقتاً على الحافة، فتبقى سريعة حتى حين تفتحها القاعة كلها معاً.',
      },
    },
  },
  {
    slug: 'leap-one',
    year: 2026,
    cover: 'leapDesktop',
    images: { pair: ['leapPhone'] },
    stack: 'Web Speech API · Claude API · Vision · Bilingual prompts',
    live: 'https://abdullah2036.github.io/leap-one/leap-one.html',
    code: 'https://github.com/abdullah2036/leap-one',
    text: {
      en: {
        title: 'LEAP ONE',
        category: 'Voice AI Companion',
        descriptor: 'A pocket guide for LEAP 2026 — ask out loud, or point the camera at a sign, and it answers in English or Arabic.',
        client: 'LEAP 2026 attendees',
        role: 'Concept, design & development',
        overview:
          'LEAP ONE is a voice companion for the LEAP 2026 tech conference in Riyadh. Hold the mic and ask where the Main Stage is or what’s on right now — or photograph a hall sign and ask where to go. It answers aloud, in two to four sentences.',
        challenge: 'A conference guide has to be fast, honest and hands-free — and must never invent a booth number or a prayer-room location.',
        approach:
          'Speech in and out through the Web Speech API, camera questions sent to a vision-capable model, and a hand-built knowledge base of halls, stages and schedule injected as ground truth — with strict rules to send people to official desks rather than guess. An animated dot-matrix face shows every state.',
      },
      ar: {
        title: 'LEAP ONE',
        category: 'رفيق صوتي بالذكاء الاصطناعي',
        descriptor: 'مرشدٌ في جيبك لمؤتمر LEAP 2026 — اسأله بصوتك أو وجّه الكاميرا إلى لافتة، فيجيبك بالعربية أو الإنجليزية.',
        client: 'زوّار LEAP 2026',
        role: 'الفكرة والتصميم والتطوير',
        overview:
          'LEAP ONE رفيقٌ صوتي لمؤتمر LEAP 2026 التقني في الرياض. اضغط على الميكروفون واسأل أين المسرح الرئيسي أو ما الذي يجري الآن، أو صوّر لافتة قاعة واسأل إلى أين تتّجه، فيجيبك بصوت مسموع في جملتين إلى أربع.',
        challenge: 'المرشد في مؤتمرٍ كهذا يجب أن يكون سريعاً وصادقاً ولا يشغل اليدين — وألّا يخترع رقم جناح أو موقع مصلّى أبداً.',
        approach:
          'الكلام يدخل ويخرج عبر Web Speech API، وأسئلة الكاميرا تُرسَل إلى نموذج يرى الصور، وقاعدة معرفة بنيتُها يدوياً للقاعات والمسارح والجدول تُحقن كحقيقة ثابتة — مع قواعد صارمة تُحيل الزائر إلى المكاتب الرسمية بدل التخمين. ووجهٌ نقطيّ متحرّك يعبّر عن كل حالة.',
      },
    },
  },
]

/** The Computerjy Maher series: one brand, four forms. */
export interface SeriesItem {
  v: number
  image: MediaKey
  live: string
  code: string
  stack: string
  text: Record<Lang, { name: string; idea: string }>
}

export const series: SeriesItem[] = [
  {
    v: 1,
    image: 'maherV1',
    live: 'https://abdullah2036.github.io/ComputerjyMaher/',
    code: 'https://github.com/abdullah2036/ComputerjyMaher',
    stack: 'HTML · CSS · JavaScript',
    text: {
      en: { name: 'Terminal', idea: 'A 2D cyberpunk, retro-terminal landing page — the original. Its brand, services and bilingual copy became the fixed content every later version reuses.' },
      ar: { name: 'الطرفية', idea: 'صفحة هبوط ثنائية الأبعاد بروح السايبربانك والطرفيات القديمة — النسخة الأصل التي ثبّتت الهوية والخدمات والنصوص ثنائية اللغة لكل ما بعدها.' },
    },
  },
  {
    v: 2,
    image: 'maherV2',
    live: 'https://abdullah2036.github.io/computerjymaher3d/',
    code: 'https://github.com/abdullah2036/computerjymaher3d',
    stack: 'Three.js · WebGL',
    text: {
      en: { name: 'The Room', idea: 'A first-person WebGL room. Walk to the desk, click the monitor, and the camera flies through the glass into a live 3D showroom.' },
      ar: { name: 'الغرفة', idea: 'غرفة ثلاثية الأبعاد تتجوّل فيها بمنظور الشخص الأول؛ تقترب من المكتب وتضغط الشاشة، فتعبر الكاميرا الزجاج إلى صالة عرض حيّة.' },
    },
  },
  {
    v: 3,
    image: 'maherV3',
    live: 'https://abdullah2036.github.io/computerjymaherV3/',
    code: 'https://github.com/abdullah2036/computerjymaherV3',
    stack: 'WebGL · Scroll-driven animation',
    text: {
      en: { name: 'Night City', idea: 'The whole page plays as one continuous scene: a WebGL particle field morphs its shape and colour as you scroll from section to section.' },
      ar: { name: 'مدينة الليل', idea: 'الصفحة كلها مشهدٌ واحد متّصل: حقل من الجسيمات يتبدّل شكله ولونه كلما انتقلت بالتمرير من قسم إلى آخر.' },
    },
  },
  {
    v: 4,
    image: 'maherV4',
    live: 'https://abdullah2036.github.io/computerjymaherOS/',
    code: 'https://github.com/abdullah2036/computerjymaherOS',
    stack: 'JavaScript · Window manager',
    text: {
      en: { name: 'Maher OS', idea: 'The studio as an operating system: pick a device at the door, then browse the services in draggable windows, a terminal, or a phone shell.' },
      ar: { name: 'ماهر OS', idea: 'الاستوديو كنظام تشغيل: تختار جهازك عند المدخل، ثم تتصفّح الخدمات في نوافذ تسحبها بيدك، أو عبر الطرفية، أو في واجهة جوال.' },
    },
  },
]

export interface Cert {
  key: 'ibm' | 'ecppt'
  image: MediaKey
  credentialId?: string
  verify?: string
}

export const certs: Cert[] = [
  { key: 'ibm', image: 'certIbm', verify: 'https://coursera.org/verify/professional-cert/ZYDXA0Y9YY1V' },
  { key: 'ecppt', image: 'certEcppt', credentialId: '194431871' },
]

export function getProject(slug?: string) {
  return projects.find((p) => p.slug === slug)
}
