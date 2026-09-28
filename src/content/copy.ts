import type { Lang } from '../lib/lang'

/**
 * Every word on the site. Edit freely.
 *
 * Two voices, written separately rather than translated, so each reads as if the
 * page were made in it. `*words*` switch to the accent face (serif italic in
 * English, Ruqaa calligraphy in Arabic). A line break in a title = one array item.
 */

export const me = {
  email: 'a.bokhary2077@gmail.com',
  github: 'https://github.com/abdullah2036',
  linkedin: 'https://www.linkedin.com/in/abdullah-bokhary-840315326/',
  resume: '/resume/Abdullah_Bokhary_Resume.pdf',
  year: 2026,
}

const en = {
  meta: {
    title: 'Abdullah Bokhary — Ideas in Motion',
    description: 'Freelance web & software developer building design-first websites with a visual identity of their own.',
  },
  name: 'Abdullah',
  fullName: 'Abdullah Bokhary',

  nav: [
    { label: 'Work', href: '#work' },
    { label: 'Series', href: '#series' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],
  talk: 'Let’s Talk',
  resume: 'Résumé',
  switchTo: { label: 'ع', aria: 'اقرأ الموقع بالعربية' },
  menu: { open: 'Open menu', close: 'Close' },

  hero: {
    eyebrow: ['Web & Software Developer', 'Data Science'],
    title: ['Ideas', '*in Motion*'],
    intro: 'I’m Abdullah — a freelance developer who builds websites that start with a visual identity, then engineers everything underneath to run fast and last.',
    cta: 'View Projects',
    resume: 'Résumé',
  },

  work: {
    label: 'Selected Work',
    title: 'Selected *Work*',
    intro: 'Three projects where the interface and the engineering were designed together — each one live and in use.',
    count: (n: number, from: number, to: number) => `(${String(n).padStart(2, '0')}) Projects · ${from === to ? to : `${from}—${to}`}`,
  },

  series: {
    label: 'The Maher Series',
    title: ['One brand,', '*four worlds*'],
    intro: 'Computerjy Maher is a mock tech store I use as a design lab. Every version keeps the same brand, copy and products — only the form changes. One brief, four completely different experiences.',
    hint: 'Scroll to shuffle through',
    live: 'Open live',
    code: 'Code',
    version: 'Version',
  },

  about: {
    label: 'About',
    index: 'Introduction',
    title: ['Creative', '*Engineer*'],
    caption: 'Design, code and data — somewhere between an idea and the thing that ships.',
    statement: [
      'I’m Abdullah Bokhary —',
      'a freelance web & software developer and a final-year Data Science student in Al Khobar.',
      'I like unfamiliar problems and turning them into software people actually use. On websites, identity comes first — then I engineer everything underneath so it stays fast and dependable.',
    ],
    facts: [
      { k: 'Focus', v: 'Design-first websites · web apps · AI / ML' },
      { k: 'Studying', v: 'B.Sc. Data Science, AI track — Saudi Electronic University, 2027' },
      { k: 'Also built', v: 'Team tooling for the Black Hat MEA CTF finals · a zero-shot CLIP detector · an x86 bootloader' },
      { k: 'Languages', v: 'Arabic · English' },
    ],
    more: 'Read my approach',
  },

  certs: {
    label: 'Certifications',
    title: ['Verified', '*skills*'],
    intro: 'Two professional certifications earned in 2026 — one for building software end to end, one for breaking into it.',
    issued: 'Issued',
    id: 'Credential ID',
    verify: 'Verify',
    view: 'View certificate',
    inProgress: 'In progress — Microsoft AI & ML Engineering Professional Certificate',
    items: {
      ibm: {
        name: 'IBM Full Stack Software Developer',
        issuer: 'IBM · Professional Certificate on Coursera',
        date: 'September 2026',
        detail: '15 courses — React, Node.js & Express, Django with SQL, Flask, Docker, Kubernetes, OpenShift, microservices and serverless.',
      },
      ecppt: {
        name: 'eCPPT — Certified Professional Penetration Tester',
        issuer: 'INE Security',
        date: 'September 2026',
        detail: 'A hands-on practical exam in web and network penetration testing.',
      },
    },
  },

  philosophy: {
    label: 'Philosophy',
    title: ['Space', 'for *Ideas*'],
    body: 'Every site I build starts with a visual identity, not a template. Fewer elements, placed with intention — so the work has room to breathe and ideas have space to move.',
    principles: [
      { t: 'Identity before layout', d: 'Each project gets its own visual language — type, colour and motion. Never a theme with a new logo.' },
      { t: 'Motion with meaning', d: 'Movement is a narrative device, never decoration. If it doesn’t guide, it goes.' },
      { t: 'Engineered to last', d: 'Clean architecture, fast loads, accessible markup. Beautiful has to work on a phone on 4G, too.' },
    ],
  },

  contact: {
    label: 'Contact',
    title: ['Let’s', 'Create', '*Together*'],
    body: 'Taking on freelance websites and web apps — and open to AI / ML and software engineering roles.',
    cta: 'Start a Conversation',
    resume: 'Download Résumé',
    links: { email: 'Email', linkedin: 'LinkedIn', github: 'GitHub' },
  },

  footer: {
    rights: '© 2026 Abdullah Bokhary',
    made: 'Designed & built in Al Khobar',
    top: 'Back to top',
  },

  project: {
    back: 'All work',
    client: 'For',
    role: 'Role',
    category: 'Category',
    year: 'Year',
    stack: 'Stack',
    overview: 'Overview',
    challenge: 'Challenge',
    approach: 'Approach',
    next: 'Next project',
    live: 'Visit live site',
    code: 'View code',
  },
}

export type Copy = typeof en

const ar: Copy = {
  meta: {
    title: 'عبدالله بخاري — أفكارٌ لا تهدأ',
    description: 'مطوّر ويب وبرمجيات مستقل، يبني مواقع تنطلق من هويتها البصرية.',
  },
  name: 'عبدالله',
  fullName: 'عبدالله بخاري',

  nav: [
    { label: 'الأعمال', href: '#work' },
    { label: 'السلسلة', href: '#series' },
    { label: 'نبذة', href: '#about' },
    { label: 'تواصل', href: '#contact' },
  ],
  talk: 'لنتحدّث',
  resume: 'السيرة الذاتية',
  switchTo: { label: 'EN', aria: 'Read the site in English' },
  menu: { open: 'افتح القائمة', close: 'إغلاق' },

  hero: {
    eyebrow: ['مطوّر ويب وبرمجيات', 'علم البيانات'],
    title: ['أفكارٌ', '*لا تهدأ*'],
    intro: 'أنا عبدالله، مطوّر مستقل أبني مواقع تبدأ من هويتها البصرية، ثم أُهندس كل ما تحتها لتبقى سريعة ومتينة.',
    cta: 'تصفّح الأعمال',
    resume: 'السيرة الذاتية',
  },

  work: {
    label: 'أعمال مختارة',
    title: 'أعمالٌ *مختارة*',
    intro: 'ثلاثة مشاريع صُمّمت واجهتها وهندستها معاً، وكلها منشورة ويستخدمها الناس اليوم.',
    count: (n: number, from: number, to: number) => {
      const d = (x: number | string) => String(x).replace(/[0-9]/g, (c) => '٠١٢٣٤٥٦٧٨٩'[Number(c)])
      return `(${d(String(n).padStart(2, '0'))}) مشاريع · ${from === to ? d(to) : `${d(from)}—${d(to)}`}`
    },
  },

  series: {
    label: 'سلسلة كمبيوترجي ماهر',
    title: ['علامةٌ واحدة،', '*وأربعة عوالم*'],
    intro: 'كمبيوترجي ماهر متجرٌ تقنيّ تجريبي أتّخذه مختبراً للتصميم. في كل نسخة تبقى الهوية والنصوص والمنتجات كما هي، ويتغيّر الشكل وحده — فكرة واحدة، وأربع تجارب لا تشبه إحداها الأخرى.',
    hint: 'مرّر لتقلّب النسخ',
    live: 'زيارة الموقع',
    code: 'الشيفرة',
    version: 'النسخة',
  },

  about: {
    label: 'نبذة',
    index: 'تعريف',
    title: ['بين الفنّ', '*والشيفرة*'],
    caption: 'تصميمٌ وبرمجة وبيانات، في المسافة بين الفكرة وما يصل فعلاً إلى الناس.',
    statement: [
      'أنا عبدالله بخاري —',
      'مطوّر ويب وبرمجيات مستقل، وطالب علم بيانات في سنتي الأخيرة، من الخُبر.',
      'تستهويني المشكلات غير المألوفة، فأحوّلها إلى برمجيات يستخدمها الناس حقاً. وفي المواقع أبدأ بالهوية دائماً، ثم أبني ما تحتها بعناية حتى تبقى سريعة ويُعتمد عليها.',
    ],
    facts: [
      { k: 'التركيز', v: 'مواقع تنطلق من التصميم · تطبيقات ويب · الذكاء الاصطناعي' },
      { k: 'الدراسة', v: 'بكالوريوس علم البيانات، مسار الذكاء الاصطناعي — الجامعة السعودية الإلكترونية، ٢٠٢٧' },
      { k: 'بنيتُ أيضاً', v: 'أدوات فريقنا لنهائيات Black Hat MEA CTF · كاشفاً بصرياً دون تدريب مسبق · محمّل إقلاع بلغة التجميع' },
      { k: 'اللغات', v: 'العربية · الإنجليزية' },
    ],
    more: 'اقرأ منهجي',
  },

  certs: {
    label: 'الشهادات',
    title: ['مهاراتٌ', '*موثّقة*'],
    intro: 'شهادتان مهنيّتان نلتُهما في ٢٠٢٦: واحدة لبناء البرمجيات من أوّلها إلى آخرها، وأخرى لاختراقها.',
    issued: 'تاريخ الإصدار',
    id: 'رقم الاعتماد',
    verify: 'تحقّق',
    view: 'عرض الشهادة',
    inProgress: 'قيد الإنجاز — شهادة Microsoft الاحترافية في هندسة الذكاء الاصطناعي وتعلّم الآلة',
    items: {
      ibm: {
        name: 'مطوّر البرمجيات الشامل من IBM',
        issuer: 'IBM · شهادة احترافية عبر Coursera',
        date: 'سبتمبر ٢٠٢٦',
        detail: '١٥ مقرراً: React، وNode.js مع Express، وDjango مع SQL، وFlask، وDocker وKubernetes وOpenShift، والخدمات المصغّرة والحوسبة بلا خوادم.',
      },
      ecppt: {
        name: 'eCPPT — مختبِر اختراق محترف معتمد',
        issuer: 'INE Security',
        date: 'سبتمبر ٢٠٢٦',
        detail: 'اختبار عمليّ في اختراق تطبيقات الويب والشبكات.',
      },
    },
  },

  philosophy: {
    label: 'الفلسفة',
    title: ['مساحةٌ', '*للأفكار*'],
    body: 'كل موقع أبنيه يبدأ بهوية بصرية لا بقالب جاهز. عناصر أقل، كلٌّ في مكانه، ليتنفّس العمل وتجد الأفكار مساحتها لتتحرّك.',
    principles: [
      { t: 'الهوية قبل التخطيط', d: 'لكل مشروع لغته البصرية الخاصة: الخط واللون والحركة. لا قالبَ جاهزاً بشعار جديد.' },
      { t: 'حركةٌ لها معنى', d: 'الحركة أداة لرواية القصة لا زينة. إن لم تُرشد الزائر فلا مكان لها.' },
      { t: 'هندسةٌ تدوم', d: 'بنية نظيفة، وتحميل سريع، وشيفرة تحترم إمكانية الوصول. الجمال يجب أن يعمل على جوال بشبكة ضعيفة أيضاً.' },
    ],
  },

  contact: {
    label: 'تواصل',
    title: ['لنصنع', 'شيئاً', '*معاً*'],
    body: 'متاح لمشاريع المواقع وتطبيقات الويب المستقلة، ومنفتح على فرص العمل في الذكاء الاصطناعي وهندسة البرمجيات.',
    cta: 'ابدأ المحادثة',
    resume: 'تحميل السيرة الذاتية',
    links: { email: 'البريد', linkedin: 'لينكدإن', github: 'غيت هب' },
  },

  footer: {
    rights: '© ٢٠٢٦ عبدالله بخاري',
    made: 'صُمّم وبُني في الخُبر',
    top: 'إلى الأعلى',
  },

  project: {
    back: 'كل الأعمال',
    client: 'لِـ',
    role: 'الدور',
    category: 'الفئة',
    year: 'السنة',
    stack: 'التقنيات',
    overview: 'نظرة عامة',
    challenge: 'التحدّي',
    approach: 'الحل',
    next: 'المشروع التالي',
    live: 'زيارة الموقع',
    code: 'الشيفرة على GitHub',
  },
}

export const copy: Record<Lang, Copy> = { en, ar }
