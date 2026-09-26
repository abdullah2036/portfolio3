/* ──────────────────────────────────────────────────────────────
   All copy lives here: two languages × two sides.
   House style: short, plain, no boasting. Arabic is written as
   Arabic, not translated line-by-line.
   ────────────────────────────────────────────────────────────── */

window.SITE_CONFIG = {
  // TODO: your number, international format, digits only (e.g. "9665XXXXXXXX")
  whatsapp: "",
  // TODO: your real email
  email: "hello@example.com",
  github: "https://github.com/abdullah2036",
  linkedin: "https://www.linkedin.com/in/abdullah-bokhary-840315326/"
};

window.CONTENT = {
  /* ═══════════════════════════════ ENGLISH ═══════════════════════════════ */
  en: {
    meta: {
      title: "Abdullah Bokhary — Freelance web developer",
      description: "Freelance web developer in Saudi Arabia. Websites in Arabic and English, designed with you and built carefully."
    },
    ui: {
      name: "Abdullah Bokhary",
      skip: "Skip to content",
      nav: { work: "Work", range: "Range", certs: "Certifications", about: "About", services: "Services", process: "Process", contact: "Contact" },
      navMy: { services: "Stack", process: "Workflow" },
      sideLabel: "Choose whose side of the work to see",
      your: "Your side", my: "My side",
      yourHint: "For clients", myHint: "For developers",
      langLabel: "Language",
      menu: "Menu", close: "Close",
      busy: "Loading…",
      scroll: "Scroll",
      person: "Person", machine: "System",
      openCase: "View project",
      backTop: "Back to top"
    },

    hero: {
      l1a: "Simple on", l1b: "your side",
      l2a: "Handled on", l2b: "mine",
      switchNote: "Every project has two sides.",
      your: {
        status: "Freelance web developer · Saudi Arabia",
        lead: "You bring the idea and how it should feel. I design and build the website, and take care of the technical side.",
        cta1: "See the work", cta2: "Start a project"
      },
      my: {
        status: "Freelance developer · Open to collaborations",
        lead: "I work between design and code: clear interfaces, light back ends, and documentation others can build on.",
        cta1: "View projects", cta2: "GitHub"
      },
      specimen: {
        title: "Eloria · Author mode", saved: "Draft saved", chapter: "Chapter 12",
        chapterName: "The house by the sea", publish: "Publish", publishing: "Publishing…",
        capYour: "What the author sees. Try it.",
        capMy: "What happens when she presses it."
      },
      stats: {
        your: [
          { v: "AR · EN", l: "Designed in both languages" },
          { v: "1", l: "Point of contact, start to launch" },
          { v: "Yours", l: "Code, domain and a handover guide" }
        ],
        my: [
          { v: "29", l: "Public repositories" },
          { v: "2", l: "Professional certifications" },
          { v: "AR · EN", l: "Bilingual, RTL-ready builds" }
        ]
      }
    },

    work: {
      kicker: "Work",
      your: { title: "Selected work.", lead: "Websites for clients, and projects I build for myself." },
      my: { title: "Selected work.", lead: "Each case study covers the constraints, decisions and stack." },
      filters: { all: "All", client: "Clients", personal: "Personal" },
      cat: { client: "Client", personal: "Personal" },
      labels: {
        needed: "The brief", got: "The result",
        constraints: "Constraints", decisions: "Decisions", architecture: "How it works", stack: "Stack",
        live: "Live site", source: "Source", next: "Next project", gallery: "Screens"
      }
    },

    range: {
      kicker: "Range",
      title: "One brief, four designs.",
      your: { lead: "A mock computer shop, designed four different ways from the same content." },
      my: { lead: "Same content, four builds: static HTML, a 3D room, a particle scroll and a desktop OS." },
      shuffle: "Shuffle"
    },

    certs: {
      kicker: "Certifications",
      title: "Certifications.",
      verify: "Verify", id: "ID", view: "View certificate",
      items: {
        ecppt: {
          name: "eCPPT", full: "Certified Professional Penetration Tester",
          issuer: "INE Security", date: "September 2026",
          your: "Hands-on security testing, applied to the sites I build.",
          tags: ["Penetration testing", "Privilege escalation", "Lateral movement", "Active Directory", "Reporting"]
        },
        ibm: {
          name: "IBM Full Stack", full: "IBM Full Stack Software Developer",
          issuer: "IBM · Coursera", date: "September 2026",
          your: "A 15-course program covering front end, back end and cloud.",
          tags: ["React", "Node.js", "Python · Flask · Django", "Docker · Kubernetes", "Microservices", "CI/CD"]
        }
      }
    },

    about: {
      kicker: "About",
      card: {
        your: [["Based in", "Saudi Arabia"], ["Languages", "Arabic · English"], ["Clients", "Writers, creators, small businesses"], ["Status", "Available for projects"]],
        my: [["Studying", "B.Sc. Data Science"], ["Focus", "Web, AI, security"], ["Certified", "eCPPT · IBM Full Stack"], ["Status", "Open to collaborations"]]
      },
      your: {
        title: "Hi, I’m Abdullah.",
        p: "A freelance web developer in Saudi Arabia. I work with people who know how their idea should feel, and I take care of how it gets built — keeping them involved at every step.",
        expectTitle: "Working with me",
        expect: [
          { i: "message", t: "Plain language", d: "Every decision explained simply." },
          { i: "shield", t: "Honest scope", d: "What’s possible, and what it takes." },
          { i: "phone", t: "Mobile first", d: "Designed for the phones your visitors use." },
          { i: "key", t: "Full handover", d: "You own the code, with a guide in your language." }
        ]
      },
      my: {
        title: "Hi, I’m Abdullah.",
        p: "I study Data Science and build for the web independently. I prefer simple, well-documented solutions and bring in heavier tools only when a project needs them.",
        toolboxTitle: "Toolbox",
        toolbox: [
          { t: "Front end", items: ["HTML & CSS", "JavaScript", "TypeScript", "React", "Tailwind CSS", "WebGL"] },
          { t: "Back end & data", items: ["Node.js", "Cloudflare Workers", "Supabase", "Postgres", "PHP", "MySQL"] },
          { t: "Languages", items: ["Python", "Java", "C", "SQL", "x86 Assembly", "Bash"] },
          { t: "Security & AI", items: ["Penetration testing", "CTF tooling", "Machine learning", "Data analysis"] }
        ]
      }
    },

    services: {
      your: {
        kicker: "Services", title: "What I can build for you.", like: "Like",
        items: [
          { i: "globe", t: "Bilingual websites", d: "Arabic and English, designed together.", ref: "This site" },
          { i: "pen", t: "Sites you manage yourself", d: "Update and publish without a dashboard.", ref: "Eloria Story" },
          { i: "pointer", t: "Interactive experiences", d: "Sites people explore, not just scroll.", ref: "Pixel Portfolio" },
          { i: "chart", t: "Tools and dashboards", d: "Data turned into something readable.", ref: "Pairing Board" }
        ]
      },
      my: {
        kicker: "Stack", title: "What I build with.",
        groups: [
          { i: "layers", t: "Front end", items: ["HTML & CSS", "JavaScript", "TypeScript", "React", "Tailwind CSS", "WebGL"] },
          { i: "server", t: "Back end & data", items: ["Node.js", "Cloudflare Workers", "Supabase", "Postgres", "PHP", "MySQL"] },
          { i: "code", t: "Languages", items: ["Python", "Java", "C", "SQL", "x86 Assembly", "Bash"] },
          { i: "shield", t: "Security & AI", items: ["Penetration testing", "CTF tooling", "Machine learning", "Data analysis"] }
        ]
      }
    },

    process: {
      your: {
        kicker: "Process", title: "How a project goes.",
        steps: [
          { t: "Talk", d: "Tell me the idea in your own words." },
          { t: "Plan", d: "I send back a clear scope and timeline." },
          { t: "Build", d: "You follow progress on a live link." },
          { t: "Launch", d: "You get the site, the code and a guide." }
        ]
      },
      my: {
        kicker: "Workflow", title: "How I work.",
        steps: [
          { t: "Brief", d: "Goals and constraints written down first." },
          { t: "Prototype", d: "A working link early, then iterate." },
          { t: "Build", d: "Static first; a back end when needed." },
          { t: "Handover", d: "A README in the client’s language." }
        ]
      }
    },

    contact: {
      kicker: "Contact",
      your: {
        title: "Have an idea?",
        lead: "Describe it in your own words. Rough is fine.",
        label: "Your idea",
        placeholder: "e.g. A website for my home perfume business…",
        send: "Send on WhatsApp", email: "or email",
        help: "Opens WhatsApp with your message. Nothing is sent until you press send.",
        empty: "Write a few words first."
      },
      my: {
        title: "Let’s talk.",
        lead: "Open to freelance projects and collaborations.",
        links: { github: "GitHub", githubNote: "29 repositories", linkedin: "LinkedIn", linkedinNote: "Experience and education", email: "Email", emailNote: "Direct message" }
      }
    },

    footer: { rights: "© 2026 Abdullah Bokhary", made: "Arabic · English" },

    projects: [
      {
        id: "eloria", name: "Eloria Story", alt: "إيلوريا", for: "Self-publishing site for a novelist",
        your: {
          line: "She writes and publishes chapters from the page itself.",
          needed: "A calm place for readers, and a way to publish new chapters without learning a dashboard.",
          got: "An editor built into the site and a single Publish button. Drafts save as she types."
        },
        my: {
          line: "In-page editor that publishes to GitHub; v2 runs on Supabase.",
          constraints: ["Non-technical author", "No hosting budget", "Arabic-first, mobile readers"],
          decisions: ["Edits save as localStorage drafts", "Publish writes data.json via the GitHub Contents API", "Rapid edits batched; 409 conflicts retried", "v2: Supabase with auth and row-level security"],
          diagram: [["p", "The author", "writes, presses Publish"], ["m", "Draft", "localStorage"], ["m", "GitHub Contents API", "PUT data.json"], ["p", "Readers", "new chapter in about a minute"]]
        }
      },
      {
        id: "pixel", name: "Pixel Portfolio", alt: "بورتفوليو البكسل", for: "A portfolio you can walk around",
        your: {
          line: "A small pixel-art world: walk around a campsite to find the work.",
          needed: "A personal experiment: could a portfolio be a place instead of a page?",
          got: "A campsite, a boardwalk, a workshop and a cabin — each holds part of the portfolio."
        },
        my: {
          line: "TypeScript game world; all content lives in one data file.",
          constraints: ["Keyboard and touch", "Readable on phones", "Content editable without touching game code"],
          decisions: ["TypeScript with Vite", "A portrait layout on phones, not a shrunken desktop", "Content in src/data/portfolio.ts", "Deploys to GitHub Pages on every push"],
          diagram: [["p", "Visitor", "walks, presses E"], ["m", "Game loop", "camera, collisions, dialogue"], ["m", "portfolio.ts", "projects, skills, links"], ["p", "Panel", "the part they found"]]
        }
      },
      {
        id: "chess", name: "Pairing Board", alt: "لوحة الطاولات", for: "Chess players at tournaments",
        your: {
          line: "Type your name, see your board.",
          needed: "Players crowd around printed sheets to find their board before each round.",
          got: "One card with board, colour, opponent and result. It refreshes during a round."
        },
        my: {
          line: "A Cloudflare Worker turns a site with no API into cached JSON.",
          constraints: ["No API or CORS on the source", "A whole hall refreshing at once", "Players on phones, in a hurry"],
          decisions: ["Worker scrapes and normalises pairings", "Edge cache: 12 s for rounds, 120 s for metadata", "Name search in any order", "Keeps the last good data if a refresh fails"],
          diagram: [["p", "A player", "types a name"], ["m", "Cloudflare Worker", "scrape, normalise, cache"], ["m", "chess-results.com", "no API"], ["p", "Their card", "board, colour, opponent"]]
        }
      },
      {
        id: "leap", name: "LEAP ONE", alt: "LEAP 2026", for: "Visitors at LEAP 2026, Riyadh",
        your: {
          line: "Ask out loud where to go next, in Arabic or English.",
          needed: "A pocket guide for a very large conference venue.",
          got: "A voice companion that answers in a few sentences, or reads a hall sign through the camera."
        },
        my: {
          line: "Voice in, voice out; answers grounded in venue information.",
          constraints: ["Noisy venue, short answers", "Two languages", "No made-up locations"],
          decisions: ["Short spoken answers", "Camera questions about signs", "Points to the official map when unsure", "Web search only for live details"],
          diagram: [["p", "Attendee", "holds the mic"], ["m", "Speech and camera", "question and context"], ["m", "Model + venue data", "rules, clock, schedule"], ["p", "Answer", "spoken, 2–4 sentences"]]
        }
      }
    ],

    worlds: [
      { v: "v1", your: ["Retro terminal", "Dark, bold and bilingual."], my: ["HTML · CSS · JS", "The original content every version reuses."] },
      { v: "v2", your: ["A room to walk into", "Click the monitor to enter the showroom."], my: ["First-person WebGL", "The monitor is a portal into a second scene."] },
      { v: "v3", your: ["Night city", "One continuous scene as you scroll."], my: ["WebGL particles", "A particle field that reshapes per section."] },
      { v: "v4", your: ["Desktop OS", "The shop explained as a computer desktop."], my: ["Windowed shell", "Windows, a dock and a working terminal."] }
    ],

    alt: {
      eloria: "Eloria Story — a lilac Arabic reading site",
      pixel: "Pixel Portfolio — a pixel-art campsite at night",
      chess: "Pairing Board — a player's table card with board number and opponent",
      leap: "LEAP ONE — a dark voice assistant screen with a pixel face"
    }
  },

  /* ═══════════════════════════════ العربية ═══════════════════════════════ */
  ar: {
    meta: {
      title: "عبدالله بخاري — مطوّر مواقع مستقل",
      description: "مطوّر مواقع مستقل في السعودية. مواقع بالعربية والإنجليزية، نصمّمها معًا وأبنيها بعناية."
    },
    ui: {
      name: "عبدالله بخاري",
      skip: "انتقل إلى المحتوى",
      nav: { work: "الأعمال", range: "التنوّع", certs: "الشهادات", about: "نبذة", services: "الخدمات", process: "طريقة العمل", contact: "تواصل" },
      navMy: { services: "الأدوات", process: "سير العمل" },
      sideLabel: "اختر من أي جهة تريد رؤية العمل",
      your: "جهتك", my: "جهتي",
      yourHint: "للعملاء", myHint: "للمطوّرين",
      langLabel: "اللغة",
      menu: "القائمة", close: "إغلاق",
      busy: "جارٍ التحميل…",
      scroll: "مرّر",
      person: "إنسان", machine: "نظام",
      openCase: "عرض المشروع",
      backTop: "العودة للأعلى"
    },

    hero: {
      l1a: "بسيط", l1b: "من جهتك",
      l2a: "والباقي", l2b: "عليّ",
      switchNote: "لكل مشروع جهتان.",
      your: {
        status: "مطوّر مواقع مستقل · السعودية",
        lead: "أنت تأتي بالفكرة وبالإحساس الذي تريده، وأنا أصمّم الموقع وأبنيه وأتولّى الجانب التقني.",
        cta1: "شاهد الأعمال", cta2: "ابدأ مشروعًا"
      },
      my: {
        status: "مطوّر مستقل · منفتح على التعاون",
        lead: "أعمل بين التصميم والكود: واجهات واضحة، وخوادم خفيفة، وتوثيق يسهل على غيري البناء عليه.",
        cta1: "استعرض المشاريع", cta2: "GitHub"
      },
      specimen: {
        title: "إيلوريا · وضع الكاتبة", saved: "حُفظت المسودة", chapter: "الفصل الثاني عشر",
        chapterName: "البيت الذي على البحر", publish: "نشر", publishing: "جارٍ النشر…",
        capYour: "ما تراه الكاتبة. جرّبه.",
        capMy: "ما يحدث حين تضغطه."
      },
      stats: {
        your: [
          { v: "لغتان", l: "تصميم بالعربية والإنجليزية" },
          { v: "١", l: "شخص واحد من البداية حتى الإطلاق" },
          { v: "ملكك", l: "الكود والنطاق ودليل التسليم" }
        ],
        my: [
          { v: "٢٩", l: "مستودعًا عامًّا" },
          { v: "٢", l: "شهادتان مهنيتان" },
          { v: "لغتان", l: "مشاريع ثنائية اللغة" }
        ]
      }
    },

    work: {
      kicker: "الأعمال",
      your: { title: "أعمال مختارة.", lead: "مواقع لعملاء، ومشاريع أبنيها لنفسي." },
      my: { title: "أعمال مختارة.", lead: "كل دراسة حالة تعرض القيود والقرارات والأدوات." },
      filters: { all: "الكل", client: "عملاء", personal: "شخصية" },
      cat: { client: "عميل", personal: "شخصي" },
      labels: {
        needed: "المطلوب", got: "النتيجة",
        constraints: "القيود", decisions: "القرارات", architecture: "كيف يعمل", stack: "الأدوات",
        live: "الموقع", source: "الكود", next: "المشروع التالي", gallery: "لقطات"
      }
    },

    range: {
      kicker: "التنوّع",
      title: "فكرة واحدة، أربعة تصاميم.",
      your: { lead: "متجر كمبيوتر تجريبي صمّمته بأربع طرق مختلفة، بالمحتوى نفسه." },
      my: { lead: "المحتوى نفسه في أربع نسخ: HTML ثابت، وغرفة ثلاثية الأبعاد، وتمرير بالجزيئات، وسطح مكتب." },
      shuffle: "أعد الخلط"
    },

    certs: {
      kicker: "الشهادات",
      title: "الشهادات.",
      verify: "تحقّق", id: "الرقم", view: "عرض الشهادة",
      items: {
        ecppt: {
          name: "eCPPT", full: "مختبر اختراق محترف معتمد",
          issuer: "INE Security", date: "سبتمبر ٢٠٢٦",
          your: "اختبار أمني عملي، أطبّقه على المواقع التي أبنيها.",
          tags: ["اختبار الاختراق", "رفع الصلاحيات", "التنقّل الجانبي", "Active Directory", "كتابة التقارير"]
        },
        ibm: {
          name: "IBM Full Stack", full: "مطوّر برمجيات شامل من IBM",
          issuer: "IBM · Coursera", date: "سبتمبر ٢٠٢٦",
          your: "برنامج من ١٥ مقرّرًا يغطي الواجهات والخوادم والسحابة.",
          tags: ["React", "Node.js", "Python · Flask · Django", "Docker · Kubernetes", "Microservices", "CI/CD"]
        }
      }
    },

    about: {
      kicker: "نبذة",
      card: {
        your: [["المقر", "السعودية"], ["اللغات", "العربية · الإنجليزية"], ["العملاء", "كتّاب وصنّاع محتوى ومشاريع صغيرة"], ["الحالة", "متاح للمشاريع"]],
        my: [["أدرس", "بكالوريوس علم البيانات"], ["التركيز", "الويب والذكاء الاصطناعي والأمن"], ["الشهادات", "eCPPT · IBM Full Stack"], ["الحالة", "منفتح على التعاون"]]
      },
      your: {
        title: "أهلًا، أنا عبدالله.",
        p: "مطوّر مواقع مستقل في السعودية. أعمل مع من يعرف كيف يريد أن تبدو فكرته، وأتولّى أنا طريقة بنائها، مع إشراكه في كل خطوة.",
        expectTitle: "العمل معي",
        expect: [
          { i: "message", t: "كلام واضح", d: "كل قرار مشروح ببساطة." },
          { i: "shield", t: "صراحة في النطاق", d: "ما هو ممكن، وما يتطلّبه." },
          { i: "phone", t: "الجوال أولًا", d: "مصمَّم للأجهزة التي يستخدمها زوّارك." },
          { i: "key", t: "تسليم كامل", d: "الكود ملكك، ومعه دليل بلغتك." }
        ]
      },
      my: {
        title: "أهلًا، أنا عبدالله.",
        p: "أدرس علم البيانات وأبني للويب بشكل مستقل. أفضّل الحلول البسيطة الموثّقة، ولا أستخدم أدوات أثقل إلا حين يحتاجها المشروع.",
        toolboxTitle: "الأدوات",
        toolbox: [
          { t: "الواجهات", items: ["HTML & CSS", "JavaScript", "TypeScript", "React", "Tailwind CSS", "WebGL"] },
          { t: "الخوادم والبيانات", items: ["Node.js", "Cloudflare Workers", "Supabase", "Postgres", "PHP", "MySQL"] },
          { t: "لغات البرمجة", items: ["Python", "Java", "C", "SQL", "x86 Assembly", "Bash"] },
          { t: "الأمن والذكاء الاصطناعي", items: ["اختبار الاختراق", "أدوات CTF", "تعلّم الآلة", "تحليل البيانات"] }
        ]
      }
    },

    services: {
      your: {
        kicker: "الخدمات", title: "ما يمكنني بناؤه لك.", like: "مثل",
        items: [
          { i: "globe", t: "مواقع ثنائية اللغة", d: "العربية والإنجليزية تُصمَّمان معًا.", ref: "هذا الموقع" },
          { i: "pen", t: "مواقع تديرها بنفسك", d: "حدّث وانشر دون لوحة تحكّم.", ref: "إيلوريا" },
          { i: "pointer", t: "تجارب تفاعلية", d: "مواقع يستكشفها الزائر، لا يمرّرها فقط.", ref: "بورتفوليو البكسل" },
          { i: "chart", t: "أدوات ولوحات بيانات", d: "بيانات تتحوّل إلى شيء مفهوم.", ref: "Pairing Board" }
        ]
      },
      my: {
        kicker: "الأدوات", title: "ما أبني به.",
        groups: [
          { i: "layers", t: "الواجهات", items: ["HTML & CSS", "JavaScript", "TypeScript", "React", "Tailwind CSS", "WebGL"] },
          { i: "server", t: "الخوادم والبيانات", items: ["Node.js", "Cloudflare Workers", "Supabase", "Postgres", "PHP", "MySQL"] },
          { i: "code", t: "لغات البرمجة", items: ["Python", "Java", "C", "SQL", "x86 Assembly", "Bash"] },
          { i: "shield", t: "الأمن والذكاء الاصطناعي", items: ["اختبار الاختراق", "أدوات CTF", "تعلّم الآلة", "تحليل البيانات"] }
        ]
      }
    },

    process: {
      your: {
        kicker: "طريقة العمل", title: "كيف يسير المشروع.",
        steps: [
          { t: "نتحدّث", d: "احكِ لي الفكرة بكلماتك." },
          { t: "نخطّط", d: "أرسل لك نطاقًا واضحًا وجدولًا زمنيًا." },
          { t: "أبني", d: "تتابع التقدّم على رابط حيّ." },
          { t: "نُطلق", d: "تستلم الموقع والكود ودليل الاستخدام." }
        ]
      },
      my: {
        kicker: "سير العمل", title: "كيف أعمل.",
        steps: [
          { t: "الموجز", d: "الأهداف والقيود مكتوبة أولًا." },
          { t: "النموذج", d: "رابط يعمل مبكرًا، ثم تحسين مستمر." },
          { t: "البناء", d: "ملفات ثابتة أولًا، وخادم عند الحاجة." },
          { t: "التسليم", d: "ملف README بلغة العميل." }
        ]
      }
    },

    contact: {
      kicker: "تواصل",
      your: {
        title: "عندك فكرة؟",
        lead: "اشرحها بكلماتك، ولو كانت غير مكتملة.",
        label: "فكرتك",
        placeholder: "مثلًا: موقع لمشروع عطور منزلي…",
        send: "أرسلها عبر واتساب", email: "أو عبر البريد",
        help: "يفتح واتساب ورسالتك جاهزة. لا يُرسَل شيء حتى تضغط إرسال.",
        empty: "اكتب كلمات قليلة أولًا."
      },
      my: {
        title: "لنتحدّث.",
        lead: "منفتح على المشاريع المستقلة والتعاون.",
        links: { github: "GitHub", githubNote: "٢٩ مستودعًا", linkedin: "LinkedIn", linkedinNote: "الخبرة والتعليم", email: "البريد", emailNote: "رسالة مباشرة" }
      }
    },

    footer: { rights: "© ٢٠٢٦ عبدالله بخاري", made: "عربي · English" },

    projects: [
      {
        id: "eloria", name: "إيلوريا", alt: "Eloria Story", for: "موقع نشر ذاتي لروائية",
        your: {
          line: "تكتب فصولها وتنشرها من الصفحة نفسها.",
          needed: "مكان هادئ للقرّاء، وطريقة لنشر الفصول دون تعلّم لوحة تحكّم.",
          got: "محرّر داخل الموقع وزرّ نشر واحد، والمسودات تُحفظ أثناء الكتابة."
        },
        my: {
          line: "محرّر داخل الصفحة ينشر إلى GitHub، والنسخة الثانية على Supabase.",
          constraints: ["كاتبة غير تقنية", "بلا ميزانية استضافة", "عربي أولًا، وقرّاء على الجوال"],
          decisions: ["التعديلات تُحفظ مسودات في localStorage", "النشر يكتب data.json عبر GitHub Contents API", "تجميع التعديلات وإعادة المحاولة عند خطأ 409", "النسخة الثانية: Supabase مع مصادقة وأمان على مستوى الصفوف"],
          diagram: [["p", "الكاتبة", "تكتب وتضغط «نشر»"], ["m", "مسودة", "localStorage"], ["m", "GitHub Contents API", "PUT data.json"], ["p", "القرّاء", "فصل جديد خلال دقيقة"]]
        }
      },
      {
        id: "pixel", name: "بورتفوليو البكسل", alt: "Pixel Portfolio", for: "بورتفوليو تتجوّل فيه",
        your: {
          line: "عالم بكسل صغير: تتجوّل في مخيّم لتكتشف الأعمال.",
          needed: "تجربة شخصية: هل يمكن أن يكون البورتفوليو مكانًا لا صفحة؟",
          got: "مخيّم وممشى وورشة وكوخ، في كلٍّ منها جزء من البورتفوليو."
        },
        my: {
          line: "عالم لعبة بـ TypeScript، وكل المحتوى في ملف بيانات واحد.",
          constraints: ["لوحة مفاتيح ولمس", "مقروء على الجوال", "تعديل المحتوى دون لمس كود اللعبة"],
          decisions: ["TypeScript مع Vite", "تخطيط عمودي للجوال، لا نسخة مصغّرة", "المحتوى في src/data/portfolio.ts", "نشر تلقائي إلى GitHub Pages مع كل push"],
          diagram: [["p", "الزائر", "يمشي ويضغط E"], ["m", "حلقة اللعبة", "الكاميرا والتصادم والحوار"], ["m", "portfolio.ts", "المشاريع والمهارات والروابط"], ["p", "اللوحة", "الجزء الذي وجده"]]
        }
      },
      {
        id: "chess", name: "لوحة الطاولات", alt: "Pairing Board", for: "لاعبو شطرنج في البطولات",
        your: {
          line: "اكتب اسمك، وشاهد طاولتك.",
          needed: "يتزاحم اللاعبون حول الأوراق المطبوعة ليعرفوا طاولاتهم قبل كل جولة.",
          got: "بطاقة واحدة فيها الطاولة واللون والخصم والنتيجة، وتتحدّث أثناء الجولة."
        },
        my: {
          line: "Worker على Cloudflare يحوّل موقعًا بلا API إلى JSON مخزّن مؤقتًا.",
          constraints: ["المصدر بلا API ولا CORS", "قاعة كاملة تحدّث الصفحة معًا", "لاعبون على الجوال، وعلى عجلة"],
          decisions: ["الـ Worker يقرأ الجداول ويوحّدها", "تخزين مؤقت: ١٢ ثانية للجولات و١٢٠ للبيانات", "بحث بالاسم بأي ترتيب", "تبقى آخر بيانات صحيحة إن فشل التحديث"],
          diagram: [["p", "اللاعب", "يكتب اسمه"], ["m", "Cloudflare Worker", "قراءة وتوحيد وتخزين"], ["m", "chess-results.com", "بلا API"], ["p", "بطاقته", "الطاولة واللون والخصم"]]
        }
      },
      {
        id: "leap", name: "LEAP ONE", alt: "LEAP 2026", for: "زوّار LEAP 2026 في الرياض",
        your: {
          line: "اسأل بصوتك إلى أين تذهب، بالعربي أو الإنجليزي.",
          needed: "دليل جيب لمكان مؤتمر كبير جدًا.",
          got: "مرافق صوتي يجيب بجمل قليلة، أو يقرأ لافتة القاعة عبر الكاميرا."
        },
        my: {
          line: "إدخال وإخراج صوتي، وإجابات مستندة إلى معلومات المكان.",
          constraints: ["مكان مزدحم وإجابات قصيرة", "لغتان", "لا مواقع مختلَقة"],
          decisions: ["إجابات صوتية قصيرة", "أسئلة عن اللافتات عبر الكاميرا", "يحيل إلى الخريطة الرسمية عند الشك", "بحث في الويب للتفاصيل الحيّة فقط"],
          diagram: [["p", "الزائر", "يمسك الميكروفون"], ["m", "الصوت والكاميرا", "السؤال والسياق"], ["m", "النموذج ومعلومات المكان", "القواعد والوقت والجدول"], ["p", "الإجابة", "صوتية، من جملتين إلى أربع"]]
        }
      }
    ],

    worlds: [
      { v: "v1", your: ["طرفية كلاسيكية", "داكن وجريء وثنائي اللغة."], my: ["HTML · CSS · JS", "المحتوى الأصلي لكل النسخ."] },
      { v: "v2", your: ["غرفة تدخلها", "اضغط الشاشة لتدخل صالة العرض."], my: ["WebGL بمنظور الشخص الأول", "الشاشة بوابة إلى مشهد ثانٍ."] },
      { v: "v3", your: ["مدينة ليلية", "مشهد واحد متصل أثناء التمرير."], my: ["جزيئات WebGL", "حقل جزيئات يتشكّل مع كل قسم."] },
      { v: "v4", your: ["سطح مكتب", "المتجر مشروحًا كسطح مكتب."], my: ["واجهة بنوافذ", "نوافذ وشريط تطبيقات وطرفية."] }
    ],

    alt: {
      eloria: "إيلوريا — موقع قراءة عربي بألوان ليلكية",
      pixel: "بورتفوليو البكسل — مخيّم ليلي بأسلوب البكسل",
      chess: "لوحة الطاولات — بطاقة اللاعب برقم الطاولة والخصم",
      leap: "LEAP ONE — شاشة مساعد صوتي داكنة بوجه بكسل"
    }
  }
};

/* Language-independent data */
window.PROJECT_META = {
  eloria:  { cat: "client",   hero: "eloria-home",      gallery: ["eloria-library", "eloria-reader", "eloria-mobile"], live: "https://abdullah2036.github.io/eloriaproject/", repo: "https://github.com/abdullah2036/eloriaproject", tags: ["Vanilla JS", "GitHub API", "Supabase", "GitHub Pages"] },
  pixel:   { cat: "personal", hero: "pixel-campsite",   gallery: ["pixel-cabin"], live: "", repo: "https://github.com/abdullah2036/pixelportfolio", tags: ["TypeScript", "Vite", "Canvas", "GitHub Actions"] },
  chess:   { cat: "personal", hero: "chess-desktop",    gallery: ["chess-mobile"], live: "https://chessresults.pageui.workers.dev/#1434355", repo: "https://github.com/abdullah2036/chessUI", tags: ["Cloudflare Workers", "Edge cache", "Vanilla JS"] },
  leap:    { cat: "personal", hero: "leap-one",         gallery: [], live: "https://abdullah2036.github.io/leap-one/leap-one.html", repo: "https://github.com/abdullah2036/leap-one", tags: ["Speech APIs", "LLM", "Camera input"] }
};

window.WORLD_META = [
  { img: "cm-v1", href: "https://github.com/abdullah2036/ComputerjyMaher" },
  { img: "cm-v2", href: "https://abdullah2036.github.io/computerjymaher3d/" },
  { img: "cm-v3", href: "https://github.com/abdullah2036/computerjymaherV3" },
  { img: "cm-v4", href: "https://abdullah2036.github.io/computerjymaherOS/" }
];

window.CERT_META = {
  ecppt: { img: "cert-ecppt", id: "194431871", verify: "" },
  ibm: { img: "cert-ibm", id: "ZYDXA0Y9YY1V", verify: "https://coursera.org/verify/professional-cert/ZYDXA0Y9YY1V" }
};
