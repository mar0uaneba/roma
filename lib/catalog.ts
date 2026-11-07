import type { Locale } from "@/lib/i18n/config";

export const categorySlugs = [
  "patisserie",
  "sacs",
  "boissons",
  "barquettes",
  "expedition",
  "fermeture",
  "personnalisation",
  "hygiene",
] as const;

export type CategorySlug = (typeof categorySlugs)[number];

export type ProductTranslation = {
  name: string;
  summary: string;
  description: string;
  applications: string[];
  formats: string[];
  imageAlt: string;
};

export type Product = {
  slug: string;
  name: string;
  category: CategorySlug;
  summary: string;
  description: string;
  applications: string[];
  formats: string[];
  image: string;
  imageAlt: string;
  featured: boolean;
  sortOrder: number;
  published: boolean;
  /** Arabic content. Missing fields fall back to French. */
  ar?: Partial<ProductTranslation>;
  /** Shop fields, managed in the admin. A product without a price is "on quote". */
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock?: number | null;
  status?: "active" | "hidden" | "sold_out";
  unit?: string | null;
  unitAr?: string | null;
  minQty?: number;
  sku?: string | null;
  images?: string[];
  feedExcluded?: boolean;
};

export type Category = {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  ar: { name: string; description: string; imageAlt: string };
};

export const categories: Category[] = [
  {
    slug: "patisserie",
    name: "Pâtisserie",
    description: "Boîtes pour gâteaux, parts, mignardises et ventes à emporter.",
    image: "/images/pastry-box.jpg",
    imageAlt: "Boîte carton ouverte remplie de petits gâteaux",
    ar: { name: "الحلويات", description: "علب للكعك والقطع الفردية والحلويات الصغيرة والبيع للأخذ.", imageAlt: "علبة كرتون مفتوحة مليئة بالحلويات الصغيرة" },
  },
  {
    slug: "sacs",
    name: "Sacs et sachets",
    description: "Sacs kraft, poignées et sachets pour le comptoir et la vente.",
    image: "/images/kraft-bag.jpg",
    imageAlt: "Grand sac kraft à poignées tenu en main",
    ar: { name: "الأكياس", description: "أكياس كرافت بمقابض وأكياس صغيرة للكونطوار والبيع.", imageAlt: "كيس كرافت كبير بمقابض في اليد" },
  },
  {
    slug: "boissons",
    name: "Boissons",
    description: "Gobelets pour cafés, jus et service à emporter.",
    image: "/images/paper-cup.jpg",
    imageAlt: "Gobelet kraft de café à emporter sur une table",
    ar: { name: "المشروبات", description: "أكواب للقهوة والعصائر والخدمة للأخذ.", imageAlt: "كوب قهوة من الكرافت للأخذ على طاولة" },
  },
  {
    slug: "barquettes",
    name: "Barquettes",
    description: "Contenants pour repas, salades, traiteur et livraison.",
    image: "/images/bowl.jpg",
    imageAlt: "Bol alimentaire kraft contenant un plat préparé",
    ar: { name: "علب الوجبات", description: "أوعية للوجبات والسلطات والممون والتوصيل.", imageAlt: "وعاء طعام من الكرافت يحتوي على طبق جاهز" },
  },
  {
    slug: "expedition",
    name: "Expédition",
    description: "Cartons et boîtes postales pour les envois e-commerce.",
    image: "/images/mailer-box.jpg",
    imageAlt: "Boîte d'expédition kraft avec étiquette sur une table",
    ar: { name: "الشحن", description: "كراتين وعلب بريدية لطرود التجارة الإلكترونية.", imageAlt: "علبة شحن من الكرافت عليها ملصق فوق طاولة" },
  },
  {
    slug: "fermeture",
    name: "Fermeture",
    description: "Adhésifs et protection pour fermer et expédier proprement.",
    image: "/images/tape.jpg",
    imageAlt: "Fermeture d'un carton d'expédition au ruban adhésif",
    ar: { name: "الإغلاق", description: "أشرطة لاصقة وحماية لإغلاق الطرود وشحنها بإتقان.", imageAlt: "إغلاق كرتونة شحن بشريط لاصق" },
  },
  {
    slug: "personnalisation",
    name: "À votre marque",
    description: "Formats imprimés ou adaptés quand le standard ne suffit pas.",
    image: "/images/gifts.jpg",
    imageAlt: "Boîtes cadeaux kraft et colorées sur fond rouge",
    ar: { name: "بعلامتكم", description: "مقاسات مطبوعة أو مكيّفة حين لا يكفي القياسي.", imageAlt: "علب هدايا من الكرافت وملونة على خلفية حمراء" },
  },
  {
    slug: "hygiene",
    name: "Hygiène",
    description: "Gants à usage unique et film alimentaire pour la cuisine et le service.",
    image: "/images/products/gants-nitrile.jpg",
    imageAlt: "Boîte de 100 gants d'examen en nitrile bleu",
    ar: { name: "النظافة", description: "قفازات للاستعمال الواحد وغشاء غذائي للمطبخ والخدمة.", imageAlt: "علبة من 100 قفاز فحص من النتريل الأزرق" },
  },
];

export const catalogProducts: Product[] = [
  // ── Roma Pack stock: photographed products ───────────────────────────
  {
    slug: "gobelets-cocktail-fruits",
    name: "Gobelets imprimés « Cocktail de fruits »",
    category: "boissons",
    summary: "Gobelets transparents décorés d'ananas, de fraises et d'agrumes, avec couvercle dôme. Prêts pour vos jus et cocktails.",
    description:
      "Un décor fruité imprimé tout autour du gobelet : ananas, fraises, rondelles d'agrumes et feuillage, avec un médaillon « Cocktail de fruits frais · Qualité Premium ». Le reste du gobelet est transparent et laisse voir les couleurs de la boisson. Le couvercle dôme se clipse sur le rebord et garde une ouverture pour la paille. Une version au texte anglais « Fresh fruit juice cocktail » existe en 10 oz.",
    applications: ["Bars à jus", "Cafés", "Snacks", "Événements"],
    formats: ["10 oz · 300 ml", "12 oz · 360 ml", "14 oz · 420 ml", "16 oz · 480 ml"],
    image: "/images/products/gobelets-cocktail-fruits.jpg",
    images: [
      "/images/products/gobelets-cocktail-fruits-2.jpg",
      "/images/products/gobelets-cocktail-fruits-3.jpg",
      "/images/products/gobelets-cocktail-fruits-4.jpg",
    ],
    imageAlt: "Gobelet transparent 16 oz imprimé de fruits, avec couvercle dôme",
    featured: true,
    sortOrder: 1,
    published: true,
    ar: {
      name: "أكواب مطبوعة «كوكتيل الفواكه»",
      summary: "أكواب شفافة مزيّنة بالأناناس والفراولة والحوامض، مع غطاء مقبّب. جاهزة لعصائركم وكوكتيلاتكم.",
      description:
        "زخرفة فواكه مطبوعة حول الكوب: أناناس وفراولة وشرائح حوامض وأوراق، مع شعار «كوكتيل فواكه طازجة · جودة ممتازة». باقي الكوب شفاف ويُظهر ألوان المشروب. يُثبَّت الغطاء المقبّب على الحافة ويترك فتحة للمصّاصة. وتتوفر نسخة بنص إنجليزي «Fresh fruit juice cocktail» بحجم 10 أونصة.",
      applications: ["محلات العصير", "المقاهي", "الوجبات السريعة", "المناسبات"],
      formats: ["10 أونصة · 300 مل", "12 أونصة · 360 مل", "14 أونصة · 420 مل", "16 أونصة · 480 مل"],
      imageAlt: "كوب شفاف 16 أونصة مطبوع بالفواكه مع غطاء مقبّب",
    },
  },
  {
    slug: "gobelets-cristal-dome",
    name: "Gobelets cristal avec couvercle dôme",
    category: "boissons",
    summary: "Gobelets transparents en plastique rigide, avec couvercle dôme percé pour la paille. Du 10 oz au 16 oz.",
    description:
      "Le gobelet cristal met la boisson en vitrine : jus frais, smoothies, milkshakes, cafés glacés ou salades de fruits. Son couvercle dôme se clipse sur le rebord, laisse de la place pour la crème ou les fruits, et garde une ouverture centrale pour la paille. Le conditionnement et les quantités sont précisés dans le devis.",
    applications: ["Bars à jus", "Cafés", "Glaciers", "Snacks"],
    formats: ["10 oz · 300 ml", "14 oz · 420 ml", "16 oz · 480 ml", "Couvercle dôme percé"],
    image: "/images/products/gobelets-cristal-dome.jpg",
    images: ["/images/products/gobelets-cristal-dome-2.jpg", "/images/products/gobelets-cristal-dome-3.jpg"],
    imageAlt: "Gobelet transparent 16 oz avec couvercle dôme",
    featured: true,
    sortOrder: 2,
    published: true,
    ar: {
      name: "أكواب شفافة بغطاء مقبّب",
      summary: "أكواب شفافة من البلاستيك الصلب، بغطاء مقبّب مثقوب للمصّاصة. من 10 إلى 16 أونصة.",
      description:
        "يعرض الكوب الشفاف المشروب كما في الواجهة: عصائر طازجة، سموذي، ميلك شيك، قهوة مثلجة أو سلطة فواكه. يُثبَّت الغطاء المقبّب على الحافة، ويترك مكاناً للكريمة أو الفواكه، مع فتحة في الوسط للمصّاصة. يُحدَّد التعبئة والكميات في عرض السعر.",
      applications: ["محلات العصير", "المقاهي", "محلات المثلجات", "الوجبات السريعة"],
      formats: ["10 أونصة · 300 مل", "14 أونصة · 420 مل", "16 أونصة · 480 مل", "غطاء مقبّب مثقوب"],
      imageAlt: "كوب شفاف 16 أونصة بغطاء مقبّب",
    },
  },
  {
    slug: "bol-soupe-kraft",
    name: "Bols soupe kraft avec couvercle",
    category: "barquettes",
    summary: "Bols ronds en carton kraft avec couvercle transparent, format 16 oz, pour soupes, harira et plats à emporter.",
    description:
      "Paroi en carton kraft brun, rebord roulé et couvercle transparent qui s'emboîte sur le dessus : le contenu reste visible et le bol se ferme proprement pour la livraison. Pensé pour les soupes, la harira, les plats en sauce, les salades et les desserts. Le format présenté est le 16 oz ; d'autres contenances se confirment au devis.",
    applications: ["Restaurants", "Traiteurs", "Snacks", "Livraison"],
    formats: ["16 oz", "Couvercle transparent"],
    image: "/images/products/bol-soupe-kraft.jpg",
    images: ["/images/products/bol-soupe-kraft-2.jpg", "/images/products/bol-soupe-kraft-3.jpg"],
    imageAlt: "Bol soupe en carton kraft 16 oz fermé par un couvercle transparent",
    featured: true,
    sortOrder: 3,
    published: true,
    ar: {
      name: "أوعية شوربة كرافت بغطاء",
      summary: "أوعية دائرية من كرتون الكرافت بغطاء شفاف، حجم 16 أونصة، للشوربة والحريرة والأطباق للأخذ.",
      description:
        "جدار من كرتون الكرافت البني، وحافة ملفوفة، وغطاء شفاف يُركَّب فوقها: يبقى المحتوى ظاهراً ويُغلق الوعاء بإحكام للتوصيل. مناسب للشوربة والحريرة والأطباق بالمرق والسلطات والتحليات. الحجم المعروض 16 أونصة، وتُؤكَّد أحجام أخرى في عرض السعر.",
      applications: ["المطاعم", "الممونون", "الوجبات السريعة", "التوصيل"],
      formats: ["16 أونصة", "غطاء شفاف"],
      imageAlt: "وعاء شوربة من الكرافت 16 أونصة مغلق بغطاء شفاف",
    },
  },
  {
    slug: "saladier-kraft",
    name: "Saladiers kraft avec couvercle",
    category: "barquettes",
    summary: "Bols larges et bas en carton kraft, fermés par un couvercle transparent, pour salades, bowls et plats froids.",
    description:
      "Plus large qu'un bol soupe, le saladier kraft offre une grande surface pour dresser salades composées, poke bowls, pâtes ou fruits découpés. Le couvercle transparent laisse voir la préparation en vitrine comme à la livraison. Contenances et quantités sur devis.",
    applications: ["Saladeries", "Restaurants", "Traiteurs", "Livraison"],
    formats: ["Grand format", "Couvercle transparent"],
    image: "/images/products/saladier-kraft.jpg",
    imageAlt: "Saladier rond en carton kraft avec couvercle transparent",
    featured: false,
    sortOrder: 4,
    published: true,
    ar: {
      name: "صحون سلطة كرافت بغطاء",
      summary: "أوعية واسعة ومنخفضة من كرتون الكرافت، مغلقة بغطاء شفاف، للسلطات والبول والأطباق الباردة.",
      description:
        "أوسع من وعاء الشوربة، يوفّر صحن السلطة الكرافت مساحة كبيرة لتقديم السلطات المركّبة والبوكي بول والمعكرونة والفواكه المقطّعة. ويُظهر الغطاء الشفاف التحضير في الواجهة وعند التوصيل. الأحجام والكميات حسب عرض السعر.",
      applications: ["محلات السلطات", "المطاعم", "الممونون", "التوصيل"],
      formats: ["حجم كبير", "غطاء شفاف"],
      imageAlt: "صحن سلطة دائري من الكرافت بغطاء شفاف",
    },
  },
  {
    slug: "barquette-poulet-roti",
    name: "Barquettes poulet rôti",
    category: "barquettes",
    summary: "Base noire et couvercle dôme transparent nervuré : la barquette du poulet rôti et des plats à emporter.",
    description:
      "La base noire met en valeur le poulet et ses accompagnements ; le couvercle transparent, haut et nervuré, laisse la volaille entière visible sans l'écraser. Pratique pour les rôtisseries, snacks et traiteurs, en vente à emporter comme en livraison. Dimensions et quantités sur devis.",
    applications: ["Rôtisseries", "Snacks", "Traiteurs", "Livraison"],
    formats: ["Base noire", "Couvercle dôme transparent"],
    image: "/images/products/barquette-poulet-roti.jpg",
    imageAlt: "Barquette à base noire avec couvercle dôme transparent nervuré",
    featured: true,
    sortOrder: 5,
    published: true,
    ar: {
      name: "علب الدجاج المشوي",
      summary: "قاعدة سوداء وغطاء مقبّب شفاف مضلّع: علبة الدجاج المشوي والأطباق للأخذ.",
      description:
        "تُبرز القاعدة السوداء الدجاج ومرافقاته، ويُظهر الغطاء الشفاف العالي والمضلّع الدجاجة كاملة دون أن يضغط عليها. عملية لمحلات الشواء والوجبات السريعة والممونين، للبيع للأخذ وللتوصيل. الأبعاد والكميات حسب عرض السعر.",
      applications: ["محلات الشواء", "الوجبات السريعة", "الممونون", "التوصيل"],
      formats: ["قاعدة سوداء", "غطاء مقبّب شفاف"],
      imageAlt: "علبة بقاعدة سوداء وغطاء مقبّب شفاف مضلّع",
    },
  },
  {
    slug: "boite-triangle-kraft",
    name: "Boîtes triangle kraft",
    category: "patisserie",
    summary: "Boîtes triangulaires, kraft à l'extérieur et blanches à l'intérieur, pour une part de gâteau, de tarte ou de pizza.",
    description:
      "La forme triangulaire épouse la part : elle reste droite et protégée, sans place perdue. Extérieur kraft brun, intérieur blanc, couvercle qui se rabat sur le dessus. Idéale pour les parts de gâteau, de tarte, de cheesecake ou de pizza vendues à l'unité.",
    applications: ["Pâtisseries", "Cafés", "Pizzerias", "Vente à la part"],
    formats: ["Une part", "Kraft, intérieur blanc"],
    image: "/images/products/boite-triangle-kraft.jpg",
    imageAlt: "Boîtes triangulaires en kraft, une ouverte et une fermée",
    featured: false,
    sortOrder: 6,
    published: true,
    ar: {
      name: "علب مثلثة كرافت",
      summary: "علب مثلثة، كرافت من الخارج وبيضاء من الداخل، لقطعة كعكة أو تارت أو بيتزا.",
      description:
        "يناسب الشكل المثلث القطعة تماماً: تبقى مستقيمة ومحمية دون مساحة ضائعة. خارج من الكرافت البني، وداخل أبيض، وغطاء يُطوى فوقها. مثالية لقطع الكعك والتارت والتشيز كيك أو البيتزا المبيعة بالقطعة.",
      applications: ["محلات الحلويات", "المقاهي", "محلات البيتزا", "البيع بالقطعة"],
      formats: ["قطعة واحدة", "كرافت، داخل أبيض"],
      imageAlt: "علب مثلثة من الكرافت، واحدة مفتوحة وأخرى مغلقة",
    },
  },
  {
    slug: "film-alimentaire",
    name: "Film alimentaire étirable",
    category: "hygiene",
    summary: "Rouleaux de film alimentaire souple et résistant, en format ménager ou professionnel avec boîte distributrice.",
    description:
      "Le film s'étire sans se déchirer, adhère aux bols, plats et plateaux, limite le dessèchement au froid et évite le mélange des odeurs. Plusieurs références : Salma's Kitchen (rouleaux colorés, dont le 1500×40 mauve en boîte), SP Lux 35 et SP Smart ×40 en boîte distributrice. Pour les cuisines de restaurant, traiteurs, entreprises et hôpitaux.",
    applications: ["Restaurants", "Traiteurs", "Collectivités", "Hôpitaux"],
    formats: ["Salma's Kitchen 150×15", "Salma's Kitchen 1500×40", "SP Lux 35", "SP Smart ×40"],
    image: "/images/products/film-alimentaire.jpg",
    images: [
      "/images/products/film-alimentaire-2.jpg",
      "/images/products/film-alimentaire-3.jpg",
      "/images/products/film-alimentaire-4.jpg",
      "/images/products/film-alimentaire-5.jpg",
      "/images/products/film-alimentaire-6.jpg",
    ],
    imageAlt: "Rouleau de film alimentaire Salma's Kitchen",
    featured: true,
    sortOrder: 7,
    published: true,
    ar: {
      name: "غشاء غذائي قابل للتمدد",
      summary: "لفائف غشاء غذائي مرن ومتين، بحجم منزلي أو مهني مع علبة موزّعة.",
      description:
        "يتمدد الغشاء دون أن يتمزق، ويلتصق بالأوعية والأطباق والصواني، ويحدّ من الجفاف في البرودة ويمنع اختلاط الروائح. عدة مراجع: Salma's Kitchen (لفائف ملونة، منها 1500×40 البنفسجي في علبة)، وSP Lux 35 وSP Smart ×40 في علبة موزّعة. لمطابخ المطاعم والممونين والمقاولات والمستشفيات.",
      applications: ["المطاعم", "الممونون", "المؤسسات", "المستشفيات"],
      formats: ["Salma's Kitchen 150×15", "Salma's Kitchen 1500×40", "SP Lux 35", "SP Smart ×40"],
      imageAlt: "لفافة غشاء غذائي Salma's Kitchen",
    },
  },
  {
    slug: "gants-nitrile",
    name: "Gants nitrile d'examen",
    category: "hygiene",
    summary: "Gants à usage unique en nitrile, sans latex et sans poudre, en boîte distributrice de 100.",
    description:
      "Le nitrile est résistant et convient aux personnes sensibles au latex. Gants non stériles à usage unique, en boîte de 100 qui se sert d'une main. Références disponibles : Use It (bleu, taille XL) et Glove Force (taille L, AQL 1,5). Pour la cuisine, la préparation, le nettoyage et les soins.",
    applications: ["Restauration", "Laboratoires", "Nettoyage", "Santé"],
    formats: ["Boîte de 100", "Tailles L et XL", "Sans latex · sans poudre"],
    image: "/images/products/gants-nitrile.jpg",
    images: ["/images/products/gants-nitrile-2.jpg"],
    imageAlt: "Boîte de 100 gants d'examen en nitrile bleu, taille XL",
    featured: false,
    sortOrder: 8,
    published: true,
    ar: {
      name: "قفازات فحص من النتريل",
      summary: "قفازات للاستعمال الواحد من النتريل، بدون لاتكس وبدون بودرة، في علبة موزّعة من 100.",
      description:
        "النتريل متين ويناسب الأشخاص الحساسين من اللاتكس. قفازات غير معقّمة للاستعمال الواحد، في علبة من 100 تُسحب بيد واحدة. المراجع المتوفرة: Use It (أزرق، مقاس XL) وGlove Force (مقاس L، AQL 1.5). للمطبخ والتحضير والتنظيف والعلاج.",
      applications: ["المطاعم", "المختبرات", "التنظيف", "الصحة"],
      formats: ["علبة من 100", "مقاسات L وXL", "بدون لاتكس · بدون بودرة"],
      imageAlt: "علبة من 100 قفاز فحص من النتريل الأزرق، مقاس XL",
    },
  },
  {
    slug: "gants-vinyle",
    name: "Gants vinyle alimentaires",
    category: "hygiene",
    summary: "Gants vinyle jetables pour la manipulation et la préparation des aliments, en noir ou transparent.",
    description:
      "Conçus pour la manipulation et la transformation des aliments, ces gants vinyle sont sans poudre, ambidextres, non stériles, à surface lisse et à usage unique. Deux coloris, noir et transparent, en boîte distributrice.",
    applications: ["Snacks", "Boulangeries", "Traiteurs", "Cuisines"],
    formats: ["Noir", "Transparent", "Boîte distributrice"],
    image: "/images/products/gants-vinyle.jpg",
    images: ["/images/products/gants-vinyle-2.jpg"],
    imageAlt: "Boîte de gants vinyle transparents pour usage alimentaire",
    featured: false,
    sortOrder: 9,
    published: true,
    ar: {
      name: "قفازات فينيل غذائية",
      summary: "قفازات فينيل تُرمى بعد الاستعمال، لمناولة الأطعمة وتحضيرها، بالأسود أو الشفاف.",
      description:
        "مصمّمة لمناولة الأطعمة وتحويلها، وهذه القفازات من الفينيل بدون بودرة، تناسب اليدين، غير معقّمة، بسطح أملس وللاستعمال الواحد. لونان: أسود وشفاف، في علبة موزّعة.",
      applications: ["الوجبات السريعة", "المخابز", "الممونون", "المطابخ"],
      formats: ["أسود", "شفاف", "علبة موزّعة"],
      imageAlt: "علبة قفازات فينيل شفافة للاستعمال الغذائي",
    },
  },
  // ── Ranges illustrated with library photos ───────────────────────────
  {
    slug: "boites-patisserie",
    name: "Boîtes pâtisserie",
    category: "patisserie",
    summary: "Boîtes carton pour présenter gâteaux, financiers et pièces individuelles sans les écraser.",
    description:
      "Une boîte de pâtisserie doit protéger la pièce et rester simple à monter en heure de pointe. Roma Pack propose des formats carton pour la vente au comptoir, les commandes et les plateaux. Les dimensions, la fenêtre éventuelle et le grammage se confirment selon vos gâteaux et vos quantités.",
    applications: ["Pâtisseries", "Boulangeries", "Traiteurs", "Hôtels"],
    formats: ["Parts individuelles", "Boîtes familiales", "Plateaux"],
    image: "/images/pastry-box.jpg",
    imageAlt: "Petits gâteaux rangés dans une boîte carton",
    featured: true,
    sortOrder: 10,
    published: true,
    ar: {
      name: "علب الحلويات",
      summary: "علب كرتونية لعرض الكعك والفينونسيي والقطع الفردية دون أن تنضغط.",
      description: "يجب أن تحمي علبة الحلويات القطعة وأن تبقى سهلة التركيب في أوقات الذروة. تقترح روما باك مقاسات كرتونية للبيع في الكونطوار والطلبيات والصواني. وتُؤكَّد الأبعاد والنافذة المحتملة والغراماج حسب حلوياتكم وكمياتكم.",
      applications: ["محلات الحلويات", "المخابز", "الممونون", "الفنادق"],
      formats: ["قطع فردية", "علب عائلية", "صوانٍ"],
      imageAlt: "حلويات صغيرة مرتبة في علبة كرتون",
    },
  },
  {
    slug: "boites-parts-emporter",
    name: "Boîtes parts à emporter",
    category: "patisserie",
    summary: "Boîtes refermables pour parts, brownies et desserts vendus à l'unité.",
    description:
      "Pour le snacking sucré et les desserts à emporter, la boîte doit s'ouvrir vite et voyager sans fuite de sucre ni de crème. Nous sélectionnons des formats kraft adaptés aux parts, muffins et assortiments courts. L'impression de votre marque se traite à part, selon le volume.",
    applications: ["Pâtisseries", "Cafés", "Snacking"],
    formats: ["Une à deux parts", "Assortiments", "Kraft nature"],
    image: "/images/dessert-box.jpg",
    imageAlt: "Parts de gâteau dans une boîte kraft à emporter",
    featured: true,
    sortOrder: 20,
    published: true,
    ar: {
      name: "علب القطع للأخذ",
      summary: "علب قابلة للإغلاق للقطع والبراونيز والتحليات المباعة بالوحدة.",
      description: "في الوجبات الخفيفة الحلوة والتحليات للأخذ، يجب أن تُفتح العلبة بسرعة وتُنقل دون تسرّب للسكر أو الكريمة. نختار مقاسات من الكرافت تناسب القطع والمافن والتشكيلات الصغيرة. أما طباعة علامتكم فتُعالَج على حدة حسب الكمية.",
      applications: ["محلات الحلويات", "المقاهي", "الوجبات الخفيفة"],
      formats: ["قطعة أو قطعتان", "تشكيلات", "كرافت طبيعي"],
      imageAlt: "قطع كعك في علبة كرافت للأخذ",
    },
  },
  {
    slug: "sacs-kraft-poignees",
    name: "Sacs kraft à poignées",
    category: "sacs",
    summary: "Sacs de vente solides pour remettre une commande sans sac plastique.",
    description:
      "Le sac est souvent la dernière chose que le client voit. Nous approvisionnons des sacs kraft à poignées pour boutiques, pâtisseries et concepts food. La taille, le papier et la possibilité d'impression dépendent du poids de vos commandes et du volume mensuel.",
    applications: ["Boutiques", "Pâtisseries", "Restaurants", "Concept stores"],
    formats: ["Petit comptoir", "Format commande", "Poignées torsadées"],
    image: "/images/kraft-bag.jpg",
    imageAlt: "Sac kraft brun à poignées",
    featured: true,
    sortOrder: 30,
    published: true,
    ar: {
      name: "أكياس كرافت بمقابض",
      summary: "أكياس بيع متينة لتسليم الطلب دون كيس بلاستيكي.",
      description: "الكيس غالباً آخر ما يراه الزبون. نوفّر أكياس كرافت بمقابض للمتاجر ومحلات الحلويات ومفاهيم الأكل. ويتوقف المقاس ونوع الورق وإمكانية الطباعة على وزن طلبياتكم وحجمها الشهري.",
      applications: ["المتاجر", "محلات الحلويات", "المطاعم", "متاجر المفاهيم"],
      formats: ["حجم كونطوار صغير", "حجم الطلبيات", "مقابض مفتولة"],
      imageAlt: "كيس كرافت بني بمقابض",
    },
  },
  {
    slug: "sacs-comptoir",
    name: "Sacs comptoir",
    category: "sacs",
    summary: "Sacs droits pour le pain, les courses courtes et les remises rapides.",
    description:
      "Quand le geste doit rester rapide, un sac droit et stable suffit. Cette famille couvre les remises comptoir, les petits volumes et les ventes où la poignée n'est pas nécessaire. Les couleurs et les tirages personnalisés se chiffrent sur demande.",
    applications: ["Boulangeries", "Épiceries", "Commerces de proximité"],
    formats: ["Fond plat", "Plusieurs contenances"],
    image: "/images/paper-bags.jpg",
    imageAlt: "Deux sacs kraft avec poignées cordon",
    featured: false,
    sortOrder: 40,
    published: true,
    ar: {
      name: "أكياس الكونطوار",
      summary: "أكياس مستقيمة للخبز والمشتريات الصغيرة والتسليم السريع.",
      description: "حين يجب أن تبقى الحركة سريعة، يكفي كيس مستقيم وثابت. تغطي هذه العائلة التسليم في الكونطوار والكميات الصغيرة والمبيعات التي لا تحتاج إلى مقبض. وتُسعَّر الألوان والطباعة المخصّصة عند الطلب.",
      applications: ["المخابز", "محلات البقالة", "متاجر القرب"],
      formats: ["قاعدة مسطحة", "سعات متعددة"],
      imageAlt: "كيسان من الكرافت بمقابض حبلية",
    },
  },
  {
    slug: "sachets-viennoiserie",
    name: "Sachets viennoiserie",
    category: "sacs",
    summary: "Papier et sachets pour croissant, pain et vente à la pièce.",
    description:
      "La viennoiserie a besoin d'un papier qui protège sans enfermer l'humidité. Nous proposons des sachets et feuilles adaptés au comptoir boulanger. Le format exact se choisit avec vos pièces : croissant, pain individuel ou assortiment.",
    applications: ["Boulangeries", "Cafés", "Hôtels"],
    formats: ["Sachet ouvert", "Feuilles de comptoir"],
    image: "/images/croissant.jpg",
    imageAlt: "Croissant emballé dans du papier kraft",
    featured: false,
    sortOrder: 50,
    published: true,
    ar: {
      name: "أكياس الفينونسيي",
      summary: "ورق وأكياس للكرواسون والخبز والبيع بالقطعة.",
      description: "تحتاج الفينونسيي إلى ورق يحميها دون أن يحبس الرطوبة. نقترح أكياساً وأوراقاً ملائمة لكونطوار المخبزة. ويُختار المقاس الدقيق حسب قطعكم: كرواسون، خبز فردي أو تشكيلة.",
      applications: ["المخابز", "المقاهي", "الفنادق"],
      formats: ["كيس مفتوح", "أوراق الكونطوار"],
      imageAlt: "كرواسون ملفوف في ورق كرافت",
    },
  },
  {
    slug: "gobelets-boissons-chaudes",
    name: "Gobelets boissons chaudes",
    category: "boissons",
    summary: "Gobelets pour café, thé et service à emporter.",
    description:
      "Un gobelet de service doit tenir la chaleur, rester stable en main et s'empiler sans perdre de place. Roma Pack fournit des gobelets pour cafés et restaurants, avec ou sans couvercle selon la gamme retenue. Les contenances se confirment au devis.",
    applications: ["Cafés", "Restaurants", "Boulangeries", "Bureaux"],
    formats: ["Service comptoir", "Avec couvercle sur demande"],
    image: "/images/paper-cup.jpg",
    imageAlt: "Café servi dans un gobelet kraft",
    featured: true,
    sortOrder: 60,
    published: true,
    ar: {
      name: "أكواب المشروبات الساخنة",
      summary: "أكواب للقهوة والشاي والخدمة للأخذ.",
      description: "يجب أن يحافظ كوب الخدمة على الحرارة وأن يبقى ثابتاً في اليد وأن يُرصّ دون أن يأخذ مكاناً. توفّر روما باك أكواباً للمقاهي والمطاعم، بغطاء أو بدونه حسب التشكيلة المختارة. وتُؤكَّد السعات في عرض السعر.",
      applications: ["المقاهي", "المطاعم", "المخابز", "المكاتب"],
      formats: ["خدمة الكونطوار", "بغطاء عند الطلب"],
      imageAlt: "قهوة مقدّمة في كوب كرافت",
    },
  },
  {
    slug: "barquettes-repas",
    name: "Barquettes repas",
    category: "barquettes",
    summary: "Contenants kraft pour bowls, salades et plats à livrer.",
    description:
      "La livraison et le comptoir traiteur demandent un contenant qui se ferme, se transporte et présente correctement le plat. Nous sélectionnons des barquettes et bols alimentaires pour restaurants, dark kitchens et traiteurs. Sauce, chaleur et durée de transport orientent le choix du format.",
    applications: ["Restaurants", "Traiteurs", "Dark kitchens", "Saladeries"],
    formats: ["Bols", "Barquettes rectangulaires", "Couvercles associés"],
    image: "/images/bowl.jpg",
    imageAlt: "Bowl kraft avec un plat de riz et de légumes",
    featured: true,
    sortOrder: 70,
    published: true,
    ar: {
      name: "علب الوجبات",
      summary: "أوعية كرافت للبولز والسلطات والأطباق الموجّهة للتوصيل.",
      description: "يتطلب التوصيل وكونطوار الممون وعاءً يُغلق ويُنقل ويعرض الطبق بشكل لائق. نختار علباً وأطباقاً غذائية للمطاعم والمطابخ المخصّصة للتوصيل والممونين. وتوجّه الصلصة والحرارة ومدة النقل اختيار المقاس.",
      applications: ["المطاعم", "الممونون", "مطابخ التوصيل", "محلات السلطات"],
      formats: ["أطباق عميقة", "علب مستطيلة", "أغطية مرافقة"],
      imageAlt: "طبق كرافت فيه أرز وخضروات",
    },
  },
  {
    slug: "cartons-expedition",
    name: "Cartons d'expédition",
    category: "expedition",
    summary: "Caisses carton pour préparer des envois groupés ou des réassorts.",
    description:
      "Pour les envois de marchandises, de coffrets ou de réassort, le carton doit protéger sans surdimensionner le colis. Nous proposons des caisses d'expédition pour e-commerçants, ateliers et grossistes. La cannelure et les dimensions se calent sur votre produit le plus fragile.",
    applications: ["E-commerce", "Grossistes", "Ateliers", "Marques"],
    formats: ["Caisses américaines", "Plusieurs volumes"],
    image: "/images/carry.jpg",
    imageAlt: "Personne portant deux cartons d'expédition",
    featured: false,
    sortOrder: 80,
    published: true,
    ar: {
      name: "كراتين الشحن",
      summary: "صناديق كرتون لتحضير الشحنات المجمّعة أو إعادة التموين.",
      description: "لشحن البضائع أو العلب أو إعادة التموين، يجب أن يحمي الكرتون دون أن يضخّم حجم الطرد. نقترح صناديق شحن للبائعين عبر الإنترنت والورشات وتجار الجملة. وتُضبط الموجة والأبعاد على منتجكم الأكثر هشاشة.",
      applications: ["التجارة الإلكترونية", "تجار الجملة", "الورشات", "العلامات التجارية"],
      formats: ["صناديق أمريكية", "أحجام متعددة"],
      imageAlt: "شخص يحمل كرتونتي شحن",
    },
  },
  {
    slug: "boites-postales",
    name: "Boîtes postales e-commerce",
    category: "expedition",
    summary: "Boîtes d'envoi propres pour colis unitaires et coffrets.",
    description:
      "La boîte postale est l'emballage que le client ouvre. Nous approvisionnons des formats adaptés aux colis unitaires, avec une surface suffisante pour une étiquette ou une impression. Le choix dépend du poids, de la fragilité et du rendu souhaité à la réception.",
    applications: ["E-commerce", "Marques", "Coffrets"],
    formats: ["Boîtes postales", "Étiquette ou impression"],
    image: "/images/mailer-box.jpg",
    imageAlt: "Boîte postale kraft avec étiquette code-barres",
    featured: true,
    sortOrder: 90,
    published: true,
    ar: {
      name: "علب البريد للتجارة الإلكترونية",
      summary: "علب شحن أنيقة للطرود الفردية وعلب الهدايا.",
      description: "العلبة البريدية هي التغليف الذي يفتحه الزبون. نوفّر مقاسات ملائمة للطرود الفردية، بمساحة كافية لملصق أو طباعة. ويتوقف الاختيار على الوزن والهشاشة والانطباع المرغوب عند الاستلام.",
      applications: ["التجارة الإلكترونية", "العلامات التجارية", "علب الهدايا"],
      formats: ["علب بريدية", "ملصق أو طباعة"],
      imageAlt: "علبة بريدية من الكرافت عليها ملصق بشفرة",
    },
  },
  {
    slug: "rubans-adhesifs",
    name: "Rubans adhésifs",
    category: "fermeture",
    summary: "Fermeture de cartons pour la préparation de commandes.",
    description:
      "La fermeture fait partie du coût de préparation. Nous fournissons des rubans adhésifs pour les cartons d'expédition et les colis internes. Largeur, longueur de rouleau et impression éventuelle se précisent selon votre cadence.",
    applications: ["E-commerce", "Entrepôts", "Ateliers", "Commerces"],
    formats: ["Rouleaux standard", "Dévidoir selon disponibilité"],
    image: "/images/tape.jpg",
    imageAlt: "Ruban adhésif appliqué sur un carton",
    featured: false,
    sortOrder: 100,
    published: true,
    ar: {
      name: "أشرطة لاصقة",
      summary: "إغلاق الكراتين لتحضير الطلبيات.",
      description: "الإغلاق جزء من تكلفة التحضير. نوفّر أشرطة لاصقة لكراتين الشحن والطرود الداخلية. ويُحدَّد العرض وطول اللفة والطباعة المحتملة حسب وتيرتكم.",
      applications: ["التجارة الإلكترونية", "المستودعات", "الورشات", "المتاجر"],
      formats: ["لفات قياسية", "موزّع حسب التوفر"],
      imageAlt: "شريط لاصق يوضع على كرتونة",
    },
  },
  {
    slug: "protection-colis",
    name: "Protection de colis",
    category: "fermeture",
    summary: "Calage et remise de colis pour les envois qui doivent arriver intacts.",
    description:
      "Un bon carton ne suffit pas si le contenu bouge. Nous complétons les gammes d'expédition avec des solutions de protection et de remise, choisies selon la fragilité réelle du produit. Le devis part de ce que vous expédiez, pas d'un catalogue générique.",
    applications: ["E-commerce", "Céramiques", "Coffrets", "Épicerie"],
    formats: ["Selon le produit à protéger"],
    image: "/images/parcel.jpg",
    imageAlt: "Remise d'un colis carton entre deux personnes",
    featured: false,
    sortOrder: 110,
    published: true,
    ar: {
      name: "حماية الطرود",
      summary: "حشو وحماية للطرود التي يجب أن تصل سليمة.",
      description: "الكرتون الجيد لا يكفي إذا تحرّك المحتوى. نكمّل تشكيلات الشحن بحلول للحماية، تُختار حسب الهشاشة الفعلية للمنتج. وينطلق عرض السعر مما تشحنونه، لا من كتالوج عام.",
      applications: ["التجارة الإلكترونية", "الخزف", "علب الهدايا", "البقالة"],
      formats: ["حسب المنتج المراد حمايته"],
      imageAlt: "تسليم طرد من الكرتون بين شخصين",
    },
  },
  {
    slug: "emballages-personnalises",
    name: "Emballages à votre marque",
    category: "personnalisation",
    summary: "Projets imprimés ou adaptés : sac, boîte ou coffret à vos couleurs.",
    description:
      "Quand l'emballage porte votre nom, le standard ne suffit plus. Roma Pack monte le projet avec vous : support, format, couleurs, quantité minimale et délai du façonnier. Nous ne présentons pas d'atelier interne. Nous coordonnons la fourniture et vous donnons un chiffrage avant fabrication.",
    applications: ["Marques", "Pâtisseries", "Cafés", "Coffrets cadeaux"],
    formats: ["Impression", "Couleur papier", "Quantité selon le procédé"],
    image: "/images/plain-box.jpg",
    imageAlt: "Boîte kraft sobre sur fond clair",
    featured: true,
    sortOrder: 120,
    published: true,
    ar: {
      name: "تغليف بعلامتكم",
      summary: "مشاريع مطبوعة أو مكيّفة: كيس أو علبة أو علبة هدايا بألوانكم.",
      description: "حين يحمل التغليف اسمكم، لا يعود القياسي كافياً. تُعدّ روما باك المشروع معكم: المادة والمقاس والألوان والحد الأدنى للكمية وأجل المصنّع. لا نقدّم ورشة داخلية، بل ننسّق التوريد ونعطيكم تسعيرة قبل التصنيع.",
      applications: ["العلامات التجارية", "محلات الحلويات", "المقاهي", "علب الهدايا"],
      formats: ["طباعة", "لون الورق", "كمية حسب الطريقة"],
      imageAlt: "علبة كرافت بسيطة على خلفية فاتحة",
    },
  },
];

export const sectors = [
  {
    slug: "restauration",
    name: "Restaurants et traiteurs",
    text: "Barquettes, sacs et fermetures pour le service, la livraison et les plats à emporter.",
    image: "/images/bowl.jpg",
    imageAlt: "Plat servi dans un contenant kraft",
    categories: ["barquettes", "sacs", "fermeture"] as CategorySlug[],
    ar: { name: "المطاعم والممونون", text: "علب وجبات وأكياس ووسائل إغلاق للخدمة والتوصيل والأطباق للأخذ.", imageAlt: "طبق مقدّم في وعاء كرافت" },
  },
  {
    slug: "patisserie",
    name: "Pâtisseries et boulangeries",
    text: "Boîtes, sachets et sacs qui protègent la pièce et tiennent au comptoir.",
    image: "/images/pastry-box.jpg",
    imageAlt: "Boîte de petits gâteaux",
    categories: ["patisserie", "sacs"] as CategorySlug[],
    ar: { name: "محلات الحلويات والمخابز", text: "علب وأكياس تحمي القطعة وتصمد في الكونطوار.", imageAlt: "علبة حلويات صغيرة" },
  },
  {
    slug: "cafes",
    name: "Cafés",
    text: "Gobelets et sachets pour le service rapide, sur place ou à emporter.",
    image: "/images/paper-cup.jpg",
    imageAlt: "Boisson chaude dans un gobelet kraft",
    categories: ["boissons", "sacs"] as CategorySlug[],
    ar: { name: "المقاهي", text: "أكواب وأكياس للخدمة السريعة، في المكان أو للأخذ.", imageAlt: "مشروب ساخن في كوب كرافت" },
  },
  {
    slug: "commerce",
    name: "Commerces",
    text: "Sacs de vente et emballages de remise pour les boutiques et épiceries.",
    image: "/images/kraft-bag.jpg",
    imageAlt: "Sac kraft de boutique",
    categories: ["sacs", "personnalisation"] as CategorySlug[],
    ar: { name: "المتاجر", text: "أكياس بيع وتغليف تسليم للمتاجر ومحلات البقالة.", imageAlt: "كيس كرافت لمتجر" },
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    text: "Cartons, boîtes postales et adhésifs pour préparer des colis propres.",
    image: "/images/van.jpg",
    imageAlt: "Chargement de cartons dans un véhicule de livraison",
    categories: ["expedition", "fermeture"] as CategorySlug[],
    ar: { name: "التجارة الإلكترونية", text: "كراتين وعلب بريدية وأشرطة لاصقة لتحضير طرود أنيقة.", imageAlt: "تحميل كراتين في سيارة توصيل" },
  },
  {
    slug: "grossistes",
    name: "Grossistes",
    text: "Réassort de gammes courantes pour les revendeurs qui achètent en volume.",
    image: "/images/warehouse.jpg",
    imageAlt: "Entrepôt avec rayonnages de cartons",
    categories: ["expedition", "fermeture", "sacs"] as CategorySlug[],
    ar: { name: "تجار الجملة", text: "إعادة تموين التشكيلات الأساسية للموزعين الذين يشترون بالكميات.", imageAlt: "مستودع برفوف من الكراتين" },
  },
];

export function categoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export type LocalizedCategory = Omit<Category, "ar">;
export type Sector = (typeof sectors)[number];
export type LocalizedSector = Omit<Sector, "ar">;

export function localizeCategory(category: Category, locale: Locale): LocalizedCategory {
  const { ar, ...base } = category;
  return locale === "ar" ? { ...base, ...ar } : base;
}

export function getCategories(locale: Locale) {
  return categories.map((category) => localizeCategory(category, locale));
}

export function getCategory(slug: string, locale: Locale) {
  const category = categoryBySlug(slug);
  return category ? localizeCategory(category, locale) : undefined;
}

export function getSectors(locale: Locale): LocalizedSector[] {
  return sectors.map(({ ar, ...base }) => (locale === "ar" ? { ...base, ...ar } : base));
}

/** Returns the product with its Arabic fields applied when they exist. */
export function localizeProduct(product: Product, locale: Locale): Product {
  if (locale !== "ar" || !product.ar) return product;
  const ar = product.ar;
  return {
    ...product,
    name: ar.name || product.name,
    summary: ar.summary || product.summary,
    description: ar.description || product.description,
    applications: ar.applications?.length ? ar.applications : product.applications,
    formats: ar.formats?.length ? ar.formats : product.formats,
    imageAlt: ar.imageAlt || product.imageAlt,
    unit: product.unitAr || product.unit,
  };
}

/** A product can be bought online when it has a price and is not sold out. */
export function isPurchasable(product: Product) {
  return typeof product.price === "number" && product.price > 0 && product.status !== "sold_out";
}

export function isCategorySlug(value: string | undefined): value is CategorySlug {
  return categorySlugs.some((slug) => slug === value);
}
