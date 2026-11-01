import type { ReciterProfile, SurahMeta, TranslationEdition } from '../types/quran';

// Canonical Metadata for all 114 Surahs of the Noble Quran (Hafs 'an 'Asim — Madinah Mushaf 604 Pages, 6,236 Ayahs)
export const ALL_SURAHS: SurahMeta[] = [
  { number: 1, nameAr: 'الفاتحة', nameEn: 'Al-Fatihah', meaningEn: 'The Opening', ayahCount: 7, revelationType: 'Makki', revelationOrder: 5, startPage: 1, startJuz: 1, summaryAr: 'أم القرآن والسبع المثاني، تجمع أصول التوحيد والعبودية وطلب الهداية للصراط المستقيم.' },
  { number: 2, nameAr: 'البقرة', nameEn: 'Al-Baqarah', meaningEn: 'The Cow', ayahCount: 286, revelationType: 'Madani', revelationOrder: 87, startPage: 2, startJuz: 1, summaryAr: 'أطول سور القرآن، ترسخ منهج الاستخلاف في الأرض والتشريعات العبادية والأسرية والمالية وآية الكرسي.' },
  { number: 3, nameAr: 'آل عمران', nameEn: 'Ali \'Imran', meaningEn: 'Family of Imran', ayahCount: 200, revelationType: 'Madani', revelationOrder: 89, startPage: 50, startJuz: 3, summaryAr: 'تقرير التوحيد والثبات على الحق ومحاورة أهل الكتاب ودروس غزوة أحد.' },
  { number: 4, nameAr: 'النساء', nameEn: 'An-Nisa', meaningEn: 'The Women', ayahCount: 176, revelationType: 'Madani', revelationOrder: 92, startPage: 77, startJuz: 4, summaryAr: 'تنظيم الأسرة والمجتمع وحفظ حقوق الضعفاء واليتامى والنساء وأحكام المواريث والعدل.' },
  { number: 5, nameAr: 'المائدة', nameEn: 'Al-Ma\'idah', meaningEn: 'The Table Spread', ayahCount: 120, revelationType: 'Madani', revelationOrder: 112, startPage: 106, startJuz: 6, summaryAr: 'الوفاء بالعهود والعقود وإكمال الدين وأحكام الحلال والحرام.' },
  { number: 6, nameAr: 'الأنعام', nameEn: 'Al-An\'am', meaningEn: 'The Cattle', ayahCount: 165, revelationType: 'Makki', revelationOrder: 55, startPage: 128, startJuz: 7, summaryAr: 'تقرير العقيدة وأدلة ربوبية الله ووحدانيته في الكون ومبطلات الشرك.' },
  { number: 7, nameAr: 'الأعراف', nameEn: 'Al-A\'raf', meaningEn: 'The Heights', ayahCount: 206, revelationType: 'Makki', revelationOrder: 39, startPage: 151, startJuz: 8, summaryAr: 'موكب النبوات وصراع الحق والباطل عبر قصص الأنبياء مع أقوامهم.' },
  { number: 8, nameAr: 'الأنفال', nameEn: 'Al-Anfal', meaningEn: 'The Spoils of War', ayahCount: 75, revelationType: 'Madani', revelationOrder: 88, startPage: 177, startJuz: 9, summaryAr: 'سنن النصر والتمكين والتقوى ودروس يوم الفرقان في بدر.' },
  { number: 9, nameAr: 'التوبة', nameEn: 'At-Tawbah', meaningEn: 'The Repentance', ayahCount: 129, revelationType: 'Madani', revelationOrder: 113, startPage: 187, startJuz: 10, summaryAr: 'كشف أحوال المنافقين وفتح باب التوبة الصادقة للمؤمنين.' },
  { number: 10, nameAr: 'يونس', nameEn: 'Yunus', meaningEn: 'Jonah', ayahCount: 109, revelationType: 'Makki', revelationOrder: 51, startPage: 208, startJuz: 11, summaryAr: 'الإيمان بالقضاء والقدر وإعجاز القرآن ونجاة قوم يونس بالتوبة.' },
  { number: 11, nameAr: 'هود', nameEn: 'Hud', meaningEn: 'Hud', ayahCount: 123, revelationType: 'Makki', revelationOrder: 52, startPage: 221, startJuz: 11, summaryAr: 'الاستقامة على أمر الله وتثبيت فؤاد النبي صلى الله عليه وسلم بقصص المرسلين.' },
  { number: 12, nameAr: 'يوسف', nameEn: 'Yusuf', meaningEn: 'Joseph', ayahCount: 111, revelationType: 'Makki', revelationOrder: 53, startPage: 235, startJuz: 12, summaryAr: 'أحسن القصص في الصبر الجميل والعفة وحسن التوكل ولطف تدبير الله.' },
  { number: 13, nameAr: 'الرعد', nameEn: 'Ar-Ra\'d', meaningEn: 'The Thunder', ayahCount: 43, revelationType: 'Madani', revelationOrder: 96, startPage: 249, startJuz: 13, summaryAr: 'قوة الحق وآيات الله في الكون وطمأنينة القلوب بذكر الله.' },
  { number: 14, nameAr: 'إبراهيم', nameEn: 'Ibrahim', meaningEn: 'Abraham', ayahCount: 52, revelationType: 'Makki', revelationOrder: 72, startPage: 255, startJuz: 13, summaryAr: 'نعمة الإيمان وشكر المنعم ودعوات الخليل إبراهيم عليه السلام.' },
  { number: 15, nameAr: 'الحجر', nameEn: 'Al-Hijr', meaningEn: 'The Rocky Tract', ayahCount: 99, revelationType: 'Makki', revelationOrder: 54, startPage: 262, startJuz: 14, summaryAr: 'تكفّل الله بحفظ الذكر الحكيم وسننه في إهلاك المكذبين.' },
  { number: 16, nameAr: 'النحل', nameEn: 'An-Nahl', meaningEn: 'The Bee', ayahCount: 128, revelationType: 'Makki', revelationOrder: 70, startPage: 267, startJuz: 14, summaryAr: 'سورة النعم الدالة على وحدانية الخالق والأمر بالعدل والإحسان.' },
  { number: 17, nameAr: 'الإسراء', nameEn: 'Al-Isra', meaningEn: 'The Night Journey', ayahCount: 111, revelationType: 'Makki', revelationOrder: 50, startPage: 282, startJuz: 15, summaryAr: 'معجزة الإسراء ومكانة المسجد الأقصى والوصايا الأخلاقية الكبرى وفضل القرآن.' },
  { number: 18, nameAr: 'الكهف', nameEn: 'Al-Kahf', meaningEn: 'The Cave', ayahCount: 110, revelationType: 'Makki', revelationOrder: 69, startPage: 293, startJuz: 15, summaryAr: 'العصمة من الفتن الأربع: فتنة الدين والمال والعلم والسلطان.' },
  { number: 19, nameAr: 'مريم', nameEn: 'Maryam', meaningEn: 'Mary', ayahCount: 98, revelationType: 'Makki', revelationOrder: 44, startPage: 305, startJuz: 16, summaryAr: 'تجليات رحمة الله بأوليائه وهبة الذرية الصالحة وتنزيه الرحمن.' },
  { number: 20, nameAr: 'طه', nameEn: 'Taha', meaningEn: 'Ta-Ha', ayahCount: 135, revelationType: 'Makki', revelationOrder: 45, startPage: 312, startJuz: 16, summaryAr: 'القرآن شفاء وسعادة لا شقاء، وقصة كليم الله موسى عليه السلام.' },
  { number: 21, nameAr: 'الأنبياء', nameEn: 'Al-Anbiya', meaningEn: 'The Prophets', ayahCount: 112, revelationType: 'Makki', revelationOrder: 73, startPage: 322, startJuz: 17, summaryAr: 'وحدة رسالة الأنبياء جميعاً في التوحيد واستجابة الله لدعواتهم.' },
  { number: 22, nameAr: 'الحج', nameEn: 'Al-Hajj', meaningEn: 'The Pilgrimage', ayahCount: 78, revelationType: 'Madani', revelationOrder: 103, startPage: 332, startJuz: 17, summaryAr: 'تعظيم شعائر الله ومناسك الحج والربط بين البيت العتيق ويوم البعث.' },
  { number: 23, nameAr: 'المؤمنون', nameEn: 'Al-Mu\'minun', meaningEn: 'The Believers', ayahCount: 118, revelationType: 'Makki', revelationOrder: 74, startPage: 342, startJuz: 18, summaryAr: 'صفات المؤمنين المفلحين الوارثين للفردوس الأعلى.' },
  { number: 24, nameAr: 'النور', nameEn: 'An-Nur', meaningEn: 'The Light', ayahCount: 64, revelationType: 'Madani', revelationOrder: 102, startPage: 350, startJuz: 18, summaryAr: 'آداب العفاف وطهارة المجتمع والبيوت وآية النور العظيمة.' },
  { number: 25, nameAr: 'الفرقان', nameEn: 'Al-Furqan', meaningEn: 'The Criterion', ayahCount: 77, revelationType: 'Makki', revelationOrder: 42, startPage: 359, startJuz: 18, summaryAr: 'القرآن فرقان بين الحق والباطل وأوصاف عباد الرحمن.' },
  { number: 26, nameAr: 'الشعراء', nameEn: 'Ash-Shu\'ara', meaningEn: 'The Poets', ayahCount: 227, revelationType: 'Makki', revelationOrder: 47, startPage: 367, startJuz: 19, summaryAr: 'بلاغ الرسالة بالحجة الواضحة ومواقف الرسل مع المكذبين.' },
  { number: 27, nameAr: 'النمل', nameEn: 'An-Naml', meaningEn: 'The Ant', ayahCount: 93, revelationType: 'Makki', revelationOrder: 48, startPage: 377, startJuz: 19, summaryAr: 'العلم والحكمة وشكر النعمة في ملك سليمان عليه السلام.' },
  { number: 28, nameAr: 'القصص', nameEn: 'Al-Qasas', meaningEn: 'The Stories', ayahCount: 88, revelationType: 'Makki', revelationOrder: 49, startPage: 385, startJuz: 20, summaryAr: 'نصر المستضعفين وزوال طغيان فرعون وقارون.' },
  { number: 29, nameAr: 'العنكبوت', nameEn: 'Al-\'Ankabut', meaningEn: 'The Spider', ayahCount: 69, revelationType: 'Makki', revelationOrder: 85, startPage: 396, startJuz: 20, summaryAr: 'سنة الابتلاء لتمحيص الصادقين والمجاهدة في سبيل الله.' },
  { number: 30, nameAr: 'الروم', nameEn: 'Ar-Rum', meaningEn: 'The Romans', ayahCount: 60, revelationType: 'Makki', revelationOrder: 84, startPage: 404, startJuz: 21, summaryAr: 'الوعد الصادق وآيات الله في الأنفس والآفاق والفطرة السليمة.' },
  { number: 31, nameAr: 'لقمان', nameEn: 'Luqman', meaningEn: 'Luqman', ayahCount: 34, revelationType: 'Makki', revelationOrder: 57, startPage: 411, startJuz: 21, summaryAr: 'الحكمة التربوية الإيمانية ووصايا لقمان الحكيم لابنه.' },
  { number: 32, nameAr: 'السجدة', nameEn: 'As-Sajdah', meaningEn: 'The Prostration', ayahCount: 30, revelationType: 'Makki', revelationOrder: 75, startPage: 415, startJuz: 21, summaryAr: 'الخضوع لآيات الله والقيام بالليل رجاء رحمته.' },
  { number: 33, nameAr: 'الأحزاب', nameEn: 'Al-Ahzab', meaningEn: 'The Combined Forces', ayahCount: 73, revelationType: 'Madani', revelationOrder: 90, startPage: 418, startJuz: 21, summaryAr: 'التأسي برسول الله صلى الله عليه وسلم وآداب البيت النبوي والمجتمع المسلم.' },
  { number: 34, nameAr: 'سبأ', nameEn: 'Saba', meaningEn: 'Sheba', ayahCount: 54, revelationType: 'Makki', revelationOrder: 58, startPage: 428, startJuz: 22, summaryAr: 'شكر النعم في قصة داود وسليمان وعاقبة كفران النعمة في سبأ.' },
  { number: 35, nameAr: 'فاطر', nameEn: 'Fatir', meaningEn: 'Originator', ayahCount: 45, revelationType: 'Makki', revelationOrder: 43, startPage: 434, startJuz: 22, summaryAr: 'عظمة الخالق البديع وافتقار الخلق جميعاً إلى الله الغني الحميد.' },
  { number: 36, nameAr: 'يس', nameEn: 'Ya-Sin', meaningEn: 'Ya Sin', ayahCount: 83, revelationType: 'Makki', revelationOrder: 41, startPage: 440, startJuz: 22, summaryAr: 'صدق الرسالة المحمدية وأدلة البعث والنشور بقدرة الله.' },
  { number: 37, nameAr: 'الصافات', nameEn: 'As-Saffat', meaningEn: 'Those who set the Ranks', ayahCount: 182, revelationType: 'Makki', revelationOrder: 56, startPage: 446, startJuz: 23, summaryAr: 'الاصطفاف في طاعة الله وتنزيهه وقصة الفداء العظيم لإسماعيل.' },
  { number: 38, nameAr: 'ص', nameEn: 'Sad', meaningEn: 'The Letter "Saad"', ayahCount: 88, revelationType: 'Makki', revelationOrder: 38, startPage: 453, startJuz: 23, summaryAr: 'الأوبة والرجوع إلى الحق في سير داود وسليمان وأيوب عليهم السلام.' },
  { number: 39, nameAr: 'الزمر', nameEn: 'Az-Zumar', meaningEn: 'The Troops', ayahCount: 75, revelationType: 'Makki', revelationOrder: 59, startPage: 458, startJuz: 23, summaryAr: 'إخلاص الدين لله وحده وسعة رحمته للتائبين.' },
  { number: 40, nameAr: 'غافر', nameEn: 'Ghafir', meaningEn: 'The Forgiver', ayahCount: 85, revelationType: 'Makki', revelationOrder: 60, startPage: 467, startJuz: 24, summaryAr: 'فضل الدعاء ومؤمن آل فرعون ومغفرة الله الواسعة.' },
  { number: 41, nameAr: 'فصلت', nameEn: 'Fussilat', meaningEn: 'Explained in Detail', ayahCount: 54, revelationType: 'Makki', revelationOrder: 61, startPage: 477, startJuz: 24, summaryAr: 'فصاحة البيان القرآني والدعوة بالحسنى والاستقامة.' },
  { number: 42, nameAr: 'الشورى', nameEn: 'Ash-Shuraa', meaningEn: 'The Consultation', ayahCount: 53, revelationType: 'Makki', revelationOrder: 62, startPage: 483, startJuz: 25, summaryAr: 'وحدة الوحي الإلهي ومنهج الشورى واجتناب كبائر الإثم.' },
  { number: 43, nameAr: 'الزخرف', nameEn: 'Az-Zukhruf', meaningEn: 'The Ornaments of Gold', ayahCount: 89, revelationType: 'Makki', revelationOrder: 63, startPage: 489, startJuz: 25, summaryAr: 'حقيقة متاع الدنيا الزائل وسمو القيم الإيمانية الباقية.' },
  { number: 44, nameAr: 'الدخان', nameEn: 'Ad-Dukhan', meaningEn: 'The Smoke', ayahCount: 59, revelationType: 'Makki', revelationOrder: 64, startPage: 496, startJuz: 25, summaryAr: 'إنزال القرآن في ليلة مباركة والتحذير من الغفلة.' },
  { number: 45, nameAr: 'الجاثية', nameEn: 'Al-Jathiyah', meaningEn: 'The Crouching', ayahCount: 37, revelationType: 'Makki', revelationOrder: 65, startPage: 499, startJuz: 25, summaryAr: 'التفكر في آيات السماوات والأرض والحذر من اتباع الهوى.' },
  { number: 46, nameAr: 'الأحقاف', nameEn: 'Al-Ahqaf', meaningEn: 'The Wind-Curved Sandhills', ayahCount: 35, revelationType: 'Makki', revelationOrder: 66, startPage: 502, startJuz: 26, summaryAr: 'بر الوالدين وإنذار قوم عاد وإيمان نفر من الجن بالقرآن.' },
  { number: 47, nameAr: 'محمد', nameEn: 'Muhammad', meaningEn: 'Muhammad', ayahCount: 38, revelationType: 'Madani', revelationOrder: 95, startPage: 507, startJuz: 26, summaryAr: 'نصرة دين الله وتدبر القرآن وإخلاص العمل.' },
  { number: 48, nameAr: 'الفتح', nameEn: 'Al-Fath', meaningEn: 'The Victory', ayahCount: 29, revelationType: 'Madani', revelationOrder: 111, startPage: 511, startJuz: 26, summaryAr: 'الفتح المبين وإنزال السكينة في قلوب المؤمنين وبيعة الرضوان.' },
  { number: 49, nameAr: 'الحجرات', nameEn: 'Al-Hujurat', meaningEn: 'The Rooms', ayahCount: 18, revelationType: 'Madani', revelationOrder: 106, startPage: 515, startJuz: 26, summaryAr: 'سورة الأخلاق والآداب الاجتماعية والأخوة الإيمانية والتثبت من الأخبار.' },
  { number: 50, nameAr: 'ق', nameEn: 'Qaf', meaningEn: 'The Letter "Qaf"', ayahCount: 45, revelationType: 'Makki', revelationOrder: 34, startPage: 518, startJuz: 26, summaryAr: 'تذكير القلوب بحقيقة الموت والبعث ومراقبة الله للإنسان.' },
  { number: 51, nameAr: 'الذاريات', nameEn: 'Adh-Dhariyat', meaningEn: 'The Winnowing Winds', ayahCount: 60, revelationType: 'Makki', revelationOrder: 67, startPage: 520, startJuz: 26, summaryAr: 'الغاية من خلق الجن والإنس وأن الرزق بيد الله الرزاق ذي القوة المتين.' },
  { number: 52, nameAr: 'الطور', nameEn: 'At-Tur', meaningEn: 'The Mount', ayahCount: 49, revelationType: 'Makki', revelationOrder: 76, startPage: 523, startJuz: 27, summaryAr: 'الحجج العقلية الباهرة على الخلق والبعث ونعيم المتقين.' },
  { number: 53, nameAr: 'النجم', nameEn: 'An-Najm', meaningEn: 'The Star', ayahCount: 62, revelationType: 'Makki', revelationOrder: 23, startPage: 526, startJuz: 27, summaryAr: 'توثيق الوحي الإلهي الصادق وسدرة المنتهى.' },
  { number: 54, nameAr: 'القمر', nameEn: 'Al-Qamar', meaningEn: 'The Moon', ayahCount: 55, revelationType: 'Makki', revelationOrder: 37, startPage: 528, startJuz: 27, summaryAr: 'تيسير القرآن للذكر واقتراب الساعة وانشقاق القمر.' },
  { number: 55, nameAr: 'الرحمن', nameEn: 'Ar-Rahman', meaningEn: 'The Beneficent', ayahCount: 78, revelationType: 'Madani', revelationOrder: 97, startPage: 531, startJuz: 27, summaryAr: 'عروس النعم الإلهية وفي مقدمتها تعليم القرآن والبيان.' },
  { number: 56, nameAr: 'الواقعة', nameEn: 'Al-Waqi\'ah', meaningEn: 'The Inevitable', ayahCount: 96, revelationType: 'Makki', revelationOrder: 46, startPage: 534, startJuz: 27, summaryAr: 'انقسام الناس يوم القيامة إلى سابقين مقربين وأصحاب يمين وأصحاب شمال.' },
  { number: 57, nameAr: 'الحديد', nameEn: 'Al-Hadid', meaningEn: 'The Iron', ayahCount: 29, revelationType: 'Madani', revelationOrder: 94, startPage: 537, startJuz: 27, summaryAr: 'البذل في سبيل الله وخشوع القلوب لذكر الله وما نزل من الحق.' },
  { number: 58, nameAr: 'المجادلة', nameEn: 'Al-Mujadila', meaningEn: 'The Pleading Woman', ayahCount: 22, revelationType: 'Madani', revelationOrder: 105, startPage: 542, startJuz: 28, summaryAr: 'سعة علم الله وسمعه وأدب التناجي ورفعة أهل العلم.' },
  { number: 59, nameAr: 'الحشر', nameEn: 'Al-Hashr', meaningEn: 'The Exile', ayahCount: 24, revelationType: 'Madani', revelationOrder: 101, startPage: 545, startJuz: 28, summaryAr: 'الأخوة والإيثار وأثر القرآن في القلوب وأسماء الله الحسنى.' },
  { number: 60, nameAr: 'الممتحنة', nameEn: 'Al-Mumtahanah', meaningEn: 'She that is to be examined', ayahCount: 13, revelationType: 'Madani', revelationOrder: 91, startPage: 549, startJuz: 28, summaryAr: 'الولاء لله والبر والقسط مع غير المحاربين.' },
  { number: 61, nameAr: 'الصف', nameEn: 'As-Saff', meaningEn: 'The Ranks', ayahCount: 14, revelationType: 'Madani', revelationOrder: 109, startPage: 551, startJuz: 28, summaryAr: 'مطابقة القول للعمل ووحدة الصف في نصرة دين الله.' },
  { number: 62, nameAr: 'الجمعة', nameEn: 'Al-Jumu\'ah', meaningEn: 'The Congregation', ayahCount: 11, revelationType: 'Madani', revelationOrder: 110, startPage: 553, startJuz: 28, summaryAr: 'بعثة النبي الأمي بالتزكية والعلم وشعيرة صلاة الجمعة.' },
  { number: 63, nameAr: 'المنافقون', nameEn: 'Al-Munafiqun', meaningEn: 'The Hypocrites', ayahCount: 11, revelationType: 'Madani', revelationOrder: 104, startPage: 554, startJuz: 28, summaryAr: 'الحذر من النفاق وعدم الانشغال بالأموال والأولاد عن ذكر الله.' },
  { number: 64, nameAr: 'التغابن', nameEn: 'At-Taghabun', meaningEn: 'The Mutual Disillusion', ayahCount: 18, revelationType: 'Madani', revelationOrder: 108, startPage: 556, startJuz: 28, summaryAr: 'التسليم لقدر الله فيهدي قلبه والاستعداد ليوم الجمع.' },
  { number: 65, nameAr: 'الطلاق', nameEn: 'At-Talaq', meaningEn: 'The Divorce', ayahCount: 12, revelationType: 'Madani', revelationOrder: 99, startPage: 558, startJuz: 28, summaryAr: 'تقوى الله مخرج من كل ضيق وأحكام الفرقة بالمعروف.' },
  { number: 66, nameAr: 'التحريم', nameEn: 'At-Tahrim', meaningEn: 'The Prohibition', ayahCount: 12, revelationType: 'Madani', revelationOrder: 107, startPage: 560, startJuz: 28, summaryAr: 'وقاية النفس والأهل من النار والتوبة النصوح.' },
  { number: 67, nameAr: 'الملك', nameEn: 'Al-Mulk', meaningEn: 'The Sovereignty', ayahCount: 30, revelationType: 'Makki', revelationOrder: 77, startPage: 562, startJuz: 29, summaryAr: 'تبارك الذي بيده الملك وإتقان خلق السماوات والموت والحياة للابتلاء.' },
  { number: 68, nameAr: 'القلم', nameEn: 'Al-Qalam', meaningEn: 'The Pen', ayahCount: 52, revelationType: 'Makki', revelationOrder: 2, startPage: 564, startJuz: 29, summaryAr: 'شرف القلم والعلم وشهادة الله لنبيه بالخلق العظيم.' },
  { number: 69, nameAr: 'الحاقة', nameEn: 'Al-Haqqah', meaningEn: 'The Reality', ayahCount: 52, revelationType: 'Makki', revelationOrder: 78, startPage: 566, startJuz: 29, summaryAr: 'مشاهد يوم الحساب وسعادة من أوتي كتابه بيمينه.' },
  { number: 70, nameAr: 'المعارج', nameEn: 'Al-Ma\'arij', meaningEn: 'The Ascending Stairways', ayahCount: 44, revelationType: 'Makki', revelationOrder: 79, startPage: 568, startJuz: 29, summaryAr: 'علاج الهلع البشري بالمحافظة على الصلاة والزكاة والعفة.' },
  { number: 71, nameAr: 'نوح', nameEn: 'Nuh', meaningEn: 'Noah', ayahCount: 28, revelationType: 'Makki', revelationOrder: 71, startPage: 570, startJuz: 29, summaryAr: 'صبر نوح عليه السلام في الدعوة وبركات الاستغفار.' },
  { number: 72, nameAr: 'الجن', nameEn: 'Al-Jinn', meaningEn: 'The Jinn', ayahCount: 28, revelationType: 'Makki', revelationOrder: 40, startPage: 572, startJuz: 29, summaryAr: 'استماع الجن للقرآن العجب وإخلاص المساجد لله.' },
  { number: 73, nameAr: 'المزمل', nameEn: 'Al-Muzzammil', meaningEn: 'The Enshrouded One', ayahCount: 20, revelationType: 'Makki', revelationOrder: 3, startPage: 574, startJuz: 29, summaryAr: 'قيام الليل وترتيل القرآن زاداً لحمل القول الثقيل.' },
  { number: 74, nameAr: 'المدثر', nameEn: 'Al-Muddaththir', meaningEn: 'The Cloaked One', ayahCount: 56, revelationType: 'Makki', revelationOrder: 4, startPage: 575, startJuz: 29, summaryAr: 'القيام بالإنذار وتكبير الرب وتطهير الثياب والباطن.' },
  { number: 75, nameAr: 'القيامة', nameEn: 'Al-Qiyamah', meaningEn: 'The Resurrection', ayahCount: 40, revelationType: 'Makki', revelationOrder: 31, startPage: 577, startJuz: 29, summaryAr: 'النفس اللوامة ويقين البعث وجمع الله للقرآن في صدر نبيه.' },
  { number: 76, nameAr: 'الإنسان', nameEn: 'Al-Insan', meaningEn: 'The Man', ayahCount: 31, revelationType: 'Madani', revelationOrder: 98, startPage: 578, startJuz: 29, summaryAr: 'إخلاص الإطعام لوجه الله وجزاء الأبرار في الجنة.' },
  { number: 77, nameAr: 'المرسلات', nameEn: 'Al-Mursalat', meaningEn: 'The Emissaries', ayahCount: 50, revelationType: 'Makki', revelationOrder: 33, startPage: 580, startJuz: 29, summaryAr: 'التحذير المتكرر للمكذبين بيوم الفصل.' },
  { number: 78, nameAr: 'النبأ', nameEn: 'An-Naba', meaningEn: 'The Tidings', ayahCount: 40, revelationType: 'Makki', revelationOrder: 80, startPage: 582, startJuz: 30, summaryAr: 'النبأ العظيم ودلائل قدرة الله في الكون الفسيح.' },
  { number: 79, nameAr: 'النازعات', nameEn: 'An-Nazi\'at', meaningEn: 'Those who drag forth', ayahCount: 46, revelationType: 'Makki', revelationOrder: 81, startPage: 583, startJuz: 30, summaryAr: 'خوف مقام الرب ونهي النفس عن الهوى طريق الجنة.' },
  { number: 80, nameAr: 'عبس', nameEn: '\'Abasa', meaningEn: 'He Frowned', ayahCount: 42, revelationType: 'Makki', revelationOrder: 24, startPage: 585, startJuz: 30, summaryAr: 'ميزان الكرامة بالتقوى وتذكير الإنسان بنشأته وطعامه.' },
  { number: 81, nameAr: 'التكوير', nameEn: 'At-Takwir', meaningEn: 'The Overthrowing', ayahCount: 29, revelationType: 'Makki', revelationOrder: 7, startPage: 586, startJuz: 30, summaryAr: 'تبدل الكون يوم القيامة وشرف القرآن الذكر للعالمين.' },
  { number: 82, nameAr: 'الانفطار', nameEn: 'Al-Infitar', meaningEn: 'The Cleaving', ayahCount: 19, revelationType: 'Makki', revelationOrder: 82, startPage: 587, startJuz: 30, summaryAr: 'تنبيه الإنسان من الغرور وتذكيره بالكرام الكاتبين.' },
  { number: 83, nameAr: 'المطففين', nameEn: 'Al-Mutaffifin', meaningEn: 'The Defrauding', ayahCount: 36, revelationType: 'Makki', revelationOrder: 86, startPage: 587, startJuz: 30, summaryAr: 'تحريم التطفيف في المكيال والميزان والتنافس في طاعة الله.' },
  { number: 84, nameAr: 'الانشقاق', nameEn: 'Al-Inshiqaq', meaningEn: 'The Sundering', ayahCount: 25, revelationType: 'Makki', revelationOrder: 83, startPage: 589, startJuz: 30, summaryAr: 'كدح الإنسان وملاقاته لربه بعمله.' },
  { number: 85, nameAr: 'البروج', nameEn: 'Al-Buruj', meaningEn: 'The Mansions of the Stars', ayahCount: 22, revelationType: 'Makki', revelationOrder: 27, startPage: 590, startJuz: 30, summaryAr: 'ثبات أصحاب الأخدود على الإيمان وحفظ القرآن في اللوح المحفوظ.' },
  { number: 86, nameAr: 'الطارق', nameEn: 'At-Tariq', meaningEn: 'The Morning Star', ayahCount: 17, revelationType: 'Makki', revelationOrder: 36, startPage: 591, startJuz: 30, summaryAr: 'القرآن قول فصل وما هو بالهزل وإحاطة الله بالكائدين.' },
  { number: 87, nameAr: 'الأعلى', nameEn: 'Al-A\'la', meaningEn: 'The Most High', ayahCount: 19, revelationType: 'Makki', revelationOrder: 8, startPage: 591, startJuz: 30, summaryAr: 'تسبيح الرب الأعلى وفلاح من تزكى وذكر اسم ربه فصلى.' },
  { number: 88, nameAr: 'الغاشية', nameEn: 'Al-Ghashiyah', meaningEn: 'The Overwhelming', ayahCount: 26, revelationType: 'Makki', revelationOrder: 68, startPage: 592, startJuz: 30, summaryAr: 'التأمل في خلق الإبل والسماء والجبال والأرض.' },
  { number: 89, nameAr: 'الفجر', nameEn: 'Al-Fajr', meaningEn: 'The Dawn', ayahCount: 30, revelationType: 'Makki', revelationOrder: 10, startPage: 593, startJuz: 30, summaryAr: 'امتحان العبد في الرخاء والشدة وبشرى النفس المطمئنة.' },
  { number: 90, nameAr: 'البلد', nameEn: 'Al-Balad', meaningEn: 'The City', ayahCount: 20, revelationType: 'Makki', revelationOrder: 35, startPage: 594, startJuz: 30, summaryAr: 'اقتحام العقبة بفك الرقاب وإطعام اليتيم والمسكين والتواصي بالصبر والمرحمة.' },
  { number: 91, nameAr: 'الشمس', nameEn: 'Ash-Shams', meaningEn: 'The Sun', ayahCount: 15, revelationType: 'Makki', revelationOrder: 26, startPage: 595, startJuz: 30, summaryAr: 'تزكية النفس سبب الفلاح وتدسيتها سبب الخيبة.' },
  { number: 92, nameAr: 'الليل', nameEn: 'Al-Layl', meaningEn: 'The Night', ayahCount: 21, revelationType: 'Makki', revelationOrder: 9, startPage: 595, startJuz: 30, summaryAr: 'شتات سعي الناس وتيسير اليسرى لمن أعطى واتقى وصدق بالحسنى.' },
  { number: 93, nameAr: 'الضحى', nameEn: 'Ad-Duhaa', meaningEn: 'The Morning Hours', ayahCount: 11, revelationType: 'Makki', revelationOrder: 11, startPage: 596, startJuz: 30, summaryAr: 'مواساة الله لنبيه والتحدث بنعمة الرب وإكرام اليتيم والسائل.' },
  { number: 94, nameAr: 'الشرح', nameEn: 'Ash-Sharh', meaningEn: 'The Relief', ayahCount: 8, revelationType: 'Makki', revelationOrder: 12, startPage: 596, startJuz: 30, summaryAr: 'انشراح الصدر وأن مع العسر يسراً والرغبة إلى الله.' },
  { number: 95, nameAr: 'التين', nameEn: 'At-Tin', meaningEn: 'The Fig', ayahCount: 8, revelationType: 'Makki', revelationOrder: 28, startPage: 597, startJuz: 30, summaryAr: 'خلق الإنسان في أحسن تقويم وحفظ فطرته بالإيمان والعمل الصالح.' },
  { number: 96, nameAr: 'العلق', nameEn: 'Al-\'Alaq', meaningEn: 'The Clot', ayahCount: 19, revelationType: 'Makki', revelationOrder: 1, startPage: 597, startJuz: 30, summaryAr: 'مفتتح الوحي بالقراءة والعلم والسجود والاقتراب من الله.' },
  { number: 97, nameAr: 'القدر', nameEn: 'Al-Qadr', meaningEn: 'The Power', ayahCount: 5, revelationType: 'Makki', revelationOrder: 25, startPage: 598, startJuz: 30, summaryAr: 'شرف ليلة القدر التي أنزل فيها القرآن وهي خير من ألف شهر.' },
  { number: 98, nameAr: 'البينة', nameEn: 'Al-Bayyinah', meaningEn: 'The Clear Proof', ayahCount: 8, revelationType: 'Madani', revelationOrder: 100, startPage: 598, startJuz: 30, summaryAr: 'إخلاص العبادة لله حنفاء وإقام الصلاة وإيتاء الزكاة.' },
  { number: 99, nameAr: 'الزلزلة', nameEn: 'Az-Zalzalah', meaningEn: 'The Earthquake', ayahCount: 8, revelationType: 'Madani', revelationOrder: 93, startPage: 599, startJuz: 30, summaryAr: 'دقة الجزاء الأخروي على مثقال الذرة من الخير والشر.' },
  { number: 100, nameAr: 'العاديات', nameEn: 'Al-\'Adiyat', meaningEn: 'The Courser', ayahCount: 11, revelationType: 'Makki', revelationOrder: 14, startPage: 599, startJuz: 30, summaryAr: 'كشف جحود الإنسان لنعم ربه وحبه الشديد للمال.' },
  { number: 101, nameAr: 'القارعة', nameEn: 'Al-Qari\'ah', meaningEn: 'The Calamity', ayahCount: 11, revelationType: 'Makki', revelationOrder: 30, startPage: 600, startJuz: 30, summaryAr: 'موازين الأعمال يوم القيامة وثقل الحسنات.' },
  { number: 102, nameAr: 'التكاثر', nameEn: 'At-Takathur', meaningEn: 'The Rivalry in world increase', ayahCount: 8, revelationType: 'Makki', revelationOrder: 16, startPage: 600, startJuz: 30, summaryAr: 'التحذير من الانشغال بالتكاثر الدنيوي والسؤال عن النعيم.' },
  { number: 103, nameAr: 'العصر', nameEn: 'Al-\'Asr', meaningEn: 'The Declining Day', ayahCount: 3, revelationType: 'Makki', revelationOrder: 13, startPage: 601, startJuz: 30, summaryAr: 'منهج النجاة الرباعي: الإيمان والعمل الصالح والتواصي بالحق والصبر.' },
  { number: 104, nameAr: 'الهمزة', nameEn: 'Al-Humazah', meaningEn: 'The Traducer', ayahCount: 9, revelationType: 'Makki', revelationOrder: 32, startPage: 601, startJuz: 30, summaryAr: 'النهي عن السخرية والطعن في أعراض الناس والاغترار بجمع المال.' },
  { number: 105, nameAr: 'الفيل', nameEn: 'Al-Fil', meaningEn: 'The Elephant', ayahCount: 5, revelationType: 'Makki', revelationOrder: 19, startPage: 601, startJuz: 30, summaryAr: 'حماية الله لبيته الحرام من كيد أصحاب الفيل.' },
  { number: 106, nameAr: 'قريش', nameEn: 'Quraysh', meaningEn: 'Quraysh', ayahCount: 4, revelationType: 'Makki', revelationOrder: 29, startPage: 602, startJuz: 30, summaryAr: 'عبادة رب البيت شكراً على نعمتي الرزق والأمن من الخوف.' },
  { number: 107, nameAr: 'الماعون', nameEn: 'Al-Ma\'un', meaningEn: 'The Small Kindnesses', ayahCount: 7, revelationType: 'Makki', revelationOrder: 17, startPage: 602, startJuz: 30, summaryAr: 'ذم الرياء والسهو عن الصلاة ومنع العون عن اليتيم والمسكين.' },
  { number: 108, nameAr: 'الكوثر', nameEn: 'Al-Kawthar', meaningEn: 'The Abundance', ayahCount: 3, revelationType: 'Makki', revelationOrder: 15, startPage: 602, startJuz: 30, summaryAr: 'الخير الكثير الموهوب للنبي صلى الله عليه وسلم وإخلاص الصلاة والنحر لله.' },
  { number: 109, nameAr: 'الكافرون', nameEn: 'Al-Kafirun', meaningEn: 'The Disbelievers', ayahCount: 6, revelationType: 'Makki', revelationOrder: 18, startPage: 603, startJuz: 30, summaryAr: 'سورة البراءة من الشرك والتمييز الواضح للتوحيد الخالص.' },
  { number: 110, nameAr: 'النصر', nameEn: 'An-Nasr', meaningEn: 'The Divine Support', ayahCount: 3, revelationType: 'Madani', revelationOrder: 114, startPage: 603, startJuz: 30, summaryAr: 'ختام الفتح بالدخول في دين الله أفواجاً وملازمة التسبيح والحمد والاستغفار.' },
  { number: 111, nameAr: 'المسد', nameEn: 'Al-Masad', meaningEn: 'The Palm Fiber', ayahCount: 5, revelationType: 'Makki', revelationOrder: 6, startPage: 603, startJuz: 30, summaryAr: 'خسران من حارب دعوة الحق وعدم إغناء المال عنه شيئاً.' },
  { number: 112, nameAr: 'الإخلاص', nameEn: 'Al-Ikhlas', meaningEn: 'The Sincerity', ayahCount: 4, revelationType: 'Makki', revelationOrder: 22, startPage: 604, startJuz: 30, summaryAr: 'تعدل ثلث القرآن؛ لتفردها بوصف الله بالأحدية والصمدية والتنزيه الكامل.' },
  { number: 113, nameAr: 'الفلق', nameEn: 'Al-Falaq', meaningEn: 'The Daybreak', ayahCount: 5, revelationType: 'Makki', revelationOrder: 20, startPage: 604, startJuz: 30, summaryAr: 'الاستعاذة برب الفلق من الشرور الظاهرة والخفية والحسد.' },
  { number: 114, nameAr: 'الناس', nameEn: 'An-Nas', meaningEn: 'Mankind', ayahCount: 6, revelationType: 'Makki', revelationOrder: 21, startPage: 604, startJuz: 30, summaryAr: 'الاعتصام برب الناس وملكهم وإلههم من وسوسة الخناس.' },
];

// Canonical 30 Juz Index (Madinah Mushaf Page & Starting Surah:Ayah)
export const ALL_JUZ_INDEX: Array<{
  juz: number;
  nameAr: string;
  startSurah: number;
  startSurahAr: string;
  startAyah: number;
  startPage: number;
  hizbStart: number;
  hizbEnd: number;
}> = [
  { juz: 1, nameAr: 'الجزء الأول', startSurah: 1, startSurahAr: 'الفاتحة', startAyah: 1, startPage: 1, hizbStart: 1, hizbEnd: 2 },
  { juz: 2, nameAr: 'الجزء الثاني', startSurah: 2, startSurahAr: 'البقرة', startAyah: 142, startPage: 22, hizbStart: 3, hizbEnd: 4 },
  { juz: 3, nameAr: 'الجزء الثالث', startSurah: 2, startSurahAr: 'البقرة', startAyah: 253, startPage: 42, hizbStart: 5, hizbEnd: 6 },
  { juz: 4, nameAr: 'الجزء الرابع', startSurah: 3, startSurahAr: 'آل عمران', startAyah: 93, startPage: 62, hizbStart: 7, hizbEnd: 8 },
  { juz: 5, nameAr: 'الجزء الخامس', startSurah: 4, startSurahAr: 'النساء', startAyah: 24, startPage: 82, hizbStart: 9, hizbEnd: 10 },
  { juz: 6, nameAr: 'الجزء السادس', startSurah: 4, startSurahAr: 'النساء', startAyah: 148, startPage: 102, hizbStart: 11, hizbEnd: 12 },
  { juz: 7, nameAr: 'الجزء السابع', startSurah: 5, startSurahAr: 'المائدة', startAyah: 82, startPage: 121, hizbStart: 13, hizbEnd: 14 },
  { juz: 8, nameAr: 'الجزء الثامن', startSurah: 6, startSurahAr: 'الأنعام', startAyah: 111, startPage: 142, hizbStart: 15, hizbEnd: 16 },
  { juz: 9, nameAr: 'الجزء التاسع', startSurah: 7, startSurahAr: 'الأعراف', startAyah: 88, startPage: 162, hizbStart: 17, hizbEnd: 18 },
  { juz: 10, nameAr: 'الجزء العاشر', startSurah: 8, startSurahAr: 'الأنفال', startAyah: 41, startPage: 182, hizbStart: 19, hizbEnd: 20 },
  { juz: 11, nameAr: 'الجزء الحادي عشر', startSurah: 9, startSurahAr: 'التوبة', startAyah: 93, startPage: 201, hizbStart: 21, hizbEnd: 22 },
  { juz: 12, nameAr: 'الجزء الثاني عشر', startSurah: 11, startSurahAr: 'هود', startAyah: 6, startPage: 222, hizbStart: 23, hizbEnd: 24 },
  { juz: 13, nameAr: 'الجزء الثالث عشر', startSurah: 12, startSurahAr: 'يوسف', startAyah: 53, startPage: 242, hizbStart: 25, hizbEnd: 26 },
  { juz: 14, nameAr: 'الجزء الرابع عشر', startSurah: 15, startSurahAr: 'الحجر', startAyah: 1, startPage: 262, hizbStart: 27, hizbEnd: 28 },
  { juz: 15, nameAr: 'الجزء الخامس عشر', startSurah: 17, startSurahAr: 'الإسراء', startAyah: 1, startPage: 282, hizbStart: 29, hizbEnd: 30 },
  { juz: 16, nameAr: 'الجزء السادس عشر', startSurah: 18, startSurahAr: 'الكهف', startAyah: 75, startPage: 302, hizbStart: 31, hizbEnd: 32 },
  { juz: 17, nameAr: 'الجزء السابع عشر', startSurah: 21, startSurahAr: 'الأنبياء', startAyah: 1, startPage: 322, hizbStart: 33, hizbEnd: 34 },
  { juz: 18, nameAr: 'الجزء الثامن عشر', startSurah: 23, startSurahAr: 'المؤمنون', startAyah: 1, startPage: 342, hizbStart: 35, hizbEnd: 36 },
  { juz: 19, nameAr: 'الجزء التاسع عشر', startSurah: 25, startSurahAr: 'الفرقان', startAyah: 21, startPage: 362, hizbStart: 37, hizbEnd: 38 },
  { juz: 20, nameAr: 'الجزء العشرون', startSurah: 27, startSurahAr: 'النمل', startAyah: 56, startPage: 382, hizbStart: 39, hizbEnd: 40 },
  { juz: 21, nameAr: 'الجزء الحادي والعشرون', startSurah: 29, startSurahAr: 'العنكبوت', startAyah: 46, startPage: 402, hizbStart: 41, hizbEnd: 42 },
  { juz: 22, nameAr: 'الجزء الثاني والعشرون', startSurah: 33, startSurahAr: 'الأحزاب', startAyah: 31, startPage: 422, hizbStart: 43, hizbEnd: 44 },
  { juz: 23, nameAr: 'الجزء الثالث والعشرون', startSurah: 36, startSurahAr: 'يس', startAyah: 28, startPage: 442, hizbStart: 45, hizbEnd: 46 },
  { juz: 24, nameAr: 'الجزء الرابع والعشرون', startSurah: 39, startSurahAr: 'الزمر', startAyah: 32, startPage: 462, hizbStart: 47, hizbEnd: 48 },
  { juz: 25, nameAr: 'الجزء الخامس والعشرون', startSurah: 41, startSurahAr: 'فصلت', startAyah: 47, startPage: 482, hizbStart: 49, hizbEnd: 50 },
  { juz: 26, nameAr: 'الجزء السادس والعشرون', startSurah: 46, startSurahAr: 'الأحقاف', startAyah: 1, startPage: 502, hizbStart: 51, hizbEnd: 52 },
  { juz: 27, nameAr: 'الجزء السابع والعشرون', startSurah: 51, startSurahAr: 'الذاريات', startAyah: 31, startPage: 522, hizbStart: 53, hizbEnd: 54 },
  { juz: 28, nameAr: 'الجزء الثامن والعشرون', startSurah: 58, startSurahAr: 'المجادلة', startAyah: 1, startPage: 542, hizbStart: 55, hizbEnd: 56 },
  { juz: 29, nameAr: 'الجزء التاسع والعشرون (تبارك)', startSurah: 67, startSurahAr: 'الملك', startAyah: 1, startPage: 562, hizbStart: 57, hizbEnd: 58 },
  { juz: 30, nameAr: 'الجزء الثلاثون (عمّ)', startSurah: 78, startSurahAr: 'النبأ', startAyah: 1, startPage: 582, hizbStart: 59, hizbEnd: 60 },
];

export const VERIFIED_RECITERS: ReciterProfile[] = [
  { id: 'ar.alafasy', nameAr: 'مشاري راشد العفاسي', nameEn: 'Mishary Rashid Alafasy', riwayahAr: 'حفص عن عاصم', styleAr: 'مرتل نديّ', countryAr: 'الكويت', sampleGlobalAyah: 262 },
  { id: 'ar.abdulrahmanmossad', nameAr: 'عبد الرحمن بن مسعد', nameEn: 'Abdulrahman Mossad', riwayahAr: 'حفص عن عاصم', styleAr: 'تلاوة خاشعة وهادئة (سور مختارة)', countryAr: 'مصر', sampleGlobalAyah: 1735 },
  { id: 'ar.husary', nameAr: 'محمود خليل الحصري', nameEn: 'Mahmoud Khalil Al-Husary', riwayahAr: 'حفص عن عاصم', styleAr: 'المصحف المرتل المعلم', countryAr: 'مصر', sampleGlobalAyah: 1 },
  { id: 'ar.husarymujawwad', nameAr: 'محمود خليل الحصري (مجود)', nameEn: 'Al-Husary (Mujawwad)', riwayahAr: 'حفص عن عاصم', styleAr: 'تجويد تحقيقي', countryAr: 'مصر', sampleGlobalAyah: 262 },
  { id: 'ar.abdulbasitmurattal', nameAr: 'عبد الباسط عبد الصمد', nameEn: 'AbdulBaset AbdulSamad', riwayahAr: 'حفص عن عاصم', styleAr: 'مرتل خاشع', countryAr: 'مصر', sampleGlobalAyah: 262 },
  { id: 'ar.minshawi', nameAr: 'محمد صديق المنشاوي', nameEn: 'Mohamed Siddiq El-Minshawi', riwayahAr: 'حفص عن عاصم', styleAr: 'مرتل خاشع', countryAr: 'مصر', sampleGlobalAyah: 262 },
  { id: 'ar.abdurrahmaansudais', nameAr: 'عبد الرحمن السديس', nameEn: 'Abdurrahmaan As-Sudais', riwayahAr: 'حفص عن عاصم', styleAr: 'تلاوة الحرم المكي', countryAr: 'السعودية', sampleGlobalAyah: 1 },
  { id: 'ar.mahermuaiqly', nameAr: 'ماهر المعيقلي', nameEn: 'Maher Al Muaiqly', riwayahAr: 'حفص عن عاصم', styleAr: 'مرتل الحرم المكي', countryAr: 'السعودية', sampleGlobalAyah: 262 },
  { id: 'ar.saoodshuraym', nameAr: 'سعود الشريم', nameEn: 'Saood Ash-Shuraym', riwayahAr: 'حفص عن عاصم', styleAr: 'حدر متقن', countryAr: 'السعودية', sampleGlobalAyah: 262 },
  { id: 'ar.ahmedajamy', nameAr: 'أحمد بن علي العجمي', nameEn: 'Ahmed ibn Ali al-Ajamy', riwayahAr: 'حفص عن عاصم', styleAr: 'مرتل عذب', countryAr: 'السعودية', sampleGlobalAyah: 262 },
  { id: 'ar.aymanswoaid', nameAr: 'أيمن رشدي سويد (تعليمي)', nameEn: 'Dr. Ayman Suwaid', riwayahAr: 'حفص عن عاصم', styleAr: 'تعليم التجويد ومخارج الحروف', countryAr: 'سوريا', sampleGlobalAyah: 1 },
];

export const GLOBAL_TRANSLATIONS: TranslationEdition[] = [
  { id: 'en.sahih', languageAr: 'الإنجليزية (Saheeh International)', languageEn: 'English', translatorAr: 'مؤسسة صحيح إنترناشونال', translatorEn: 'Saheeh International', sourceAr: 'منتدى المنتدى الإسلامي – طبعة موثقة' },
  { id: 'en.yusufali', languageAr: 'الإنجليزية (عبد الله يوسف علي)', languageEn: 'English (Yusuf Ali)', translatorAr: 'عبد الله يوسف علي', translatorEn: 'Abdullah Yusuf Ali', sourceAr: 'الطبعة الكلاسيكية لترجمة المعاني' },
  { id: 'fr.hamidullah', languageAr: 'الفرنسية (Français)', languageEn: 'French', translatorAr: 'د. محمد حميد الله', translatorEn: 'Muhammad Hamidullah', sourceAr: 'مجمع الملك فهد لطباعة المصحف الشريف' },
  { id: 'de.aburida', languageAr: 'الألمانية (Deutsch)', languageEn: 'German', translatorAr: 'أبو رضا محمد بن أحمد بن رسول', translatorEn: 'Abu Rida ibn Rassoul', sourceAr: 'ترجمة المعاني المعتمدة بالألمانية' },
  { id: 'ru.kuliev', languageAr: 'الروسية (Русский)', languageEn: 'Russian', translatorAr: 'إلمير كولييف', translatorEn: 'Elmir Kuliev', sourceAr: 'مجمع الملك فهد لطباعة المصحف الشريف' },
  { id: 'tr.diyanet', languageAr: 'التركية (Türkçe)', languageEn: 'Turkish', translatorAr: 'رئاسة الشؤون الدينية التركية', translatorEn: 'Diyanet İşleri', sourceAr: 'Diyanet İşleri Başkanlığı' },
  { id: 'ko.korean', languageAr: 'الكورية (한국어)', languageEn: 'Korean', translatorAr: 'حامد تشوي يونغ كيل', translatorEn: 'Korean Scholarly Edition', sourceAr: 'مجمع الملك فهد لطباعة المصحف الشريف' },
  { id: 'es.cortes', languageAr: 'الإسبانية (Español)', languageEn: 'Spanish', translatorAr: 'خوليو كورتيس', translatorEn: 'Julio Cortes', sourceAr: 'الترجمة الإسبانية الموثقة' },
  { id: 'id.indonesian', languageAr: 'الإندونيسية (Bahasa Indonesia)', languageEn: 'Indonesian', translatorAr: 'وزارة الشؤون الدينية الإندونيسية', translatorEn: 'Indonesian Ministry of Religious Affairs', sourceAr: 'Kementerian Agama RI' },
  { id: 'ur.jalandhry', languageAr: 'الأردية (اردو)', languageEn: 'Urdu', translatorAr: 'فتح محمد جالندهري', translatorEn: 'Fateh Muhammad Jalandhry', sourceAr: 'الترجمة الأردية المعتمدة' },
];

// Thematic Quranic Search Topics (Section 7)
export const QURAN_THEMATIC_TOPICS: Array<{
  id: string;
  titleAr: string;
  titleEn: string;
  queryKeyword: string;
  references: Array<{ surah: number; ayah: number; surahAr: string; labelAr: string }>;
}> = [
  {
    id: 'reassurance',
    titleAr: 'الطمأنينة والسكينة',
    titleEn: 'Tranquility & Peace',
    queryKeyword: 'تطمئن القلوب',
    references: [
      { surah: 13, ayah: 28, surahAr: 'الرعد', labelAr: 'اطمئنان القلوب بذكر الله' },
      { surah: 48, ayah: 4, surahAr: 'الفتح', labelAr: 'إنزال السكينة في قلوب المؤمنين' },
      { surah: 89, ayah: 27, surahAr: 'الفجر', labelAr: 'نداء النفس المطمئنة' },
      { surah: 94, ayah: 5, surahAr: 'الشرح', labelAr: 'فإن مع العسر يسراً' },
    ],
  },
  {
    id: 'patience',
    titleAr: 'الصبر والثبات',
    titleEn: 'Patience & Perseverance',
    queryKeyword: 'الصابرين',
    references: [
      { surah: 2, ayah: 153, surahAr: 'البقرة', labelAr: 'الاستعانة بالصبر والصلاة' },
      { surah: 39, ayah: 10, surahAr: 'الزمر', labelAr: 'أجر الصابرين بغير حساب' },
      { surah: 3, ayah: 200, surahAr: 'آل عمران', labelAr: 'اصبروا وصابروا ورابطوا' },
    ],
  },
  {
    id: 'mercy',
    titleAr: 'الرحمة والمغفرة',
    titleEn: 'Mercy & Forgiveness',
    queryKeyword: 'رحمتي وسعت',
    references: [
      { surah: 39, ayah: 53, surahAr: 'الزمر', labelAr: 'لا تقنطوا من رحمة الله' },
      { surah: 7, ayah: 156, surahAr: 'الأعراف', labelAr: 'ورحمتي وسعت كل شيء' },
      { surah: 6, ayah: 54, surahAr: 'الأنعام', labelAr: 'كتب ربكم على نفسه الرحمة' },
    ],
  },
  {
    id: 'repentance',
    titleAr: 'التوبة والإنابة',
    titleEn: 'Repentance',
    queryKeyword: 'توبوا إلى الله',
    references: [
      { surah: 66, ayah: 8, surahAr: 'التحريم', labelAr: 'التوبة النصوح' },
      { surah: 24, ayah: 31, surahAr: 'النور', labelAr: 'وتوبوا إلى الله جميعاً لعلكم تفلحون' },
      { surah: 25, ayah: 70, surahAr: 'الفرقان', labelAr: 'تبديل السيئات حسنات للتائب' },
    ],
  },
  {
    id: 'provision',
    titleAr: 'الرزق والتوكل',
    titleEn: 'Provision & Trust in Allah',
    queryKeyword: 'يتق الله يجعل له مخرجا',
    references: [
      { surah: 65, ayah: 2, surahAr: 'الطلاق', labelAr: 'ومن يتق الله يجعل له مخرجاً ويرزقه' },
      { surah: 51, ayah: 58, surahAr: 'الذاريات', labelAr: 'إن الله هو الرزاق ذو القوة المتين' },
      { surah: 11, ayah: 6, surahAr: 'هود', labelAr: 'وما من دابة في الأرض إلا على الله رزقها' },
    ],
  },
  {
    id: 'supplication',
    titleAr: 'إجابة الدعاء',
    titleEn: 'Answering Supplications',
    queryKeyword: 'فإني قريب',
    references: [
      { surah: 2, ayah: 186, surahAr: 'البقرة', labelAr: 'وإذا سألك عبادي عني فإني قريب' },
      { surah: 40, ayah: 60, surahAr: 'غافر', labelAr: 'ادعوني أستجب لكم' },
      { surah: 27, ayah: 62, surahAr: 'النمل', labelAr: 'أمن يجيب المضطر إذا دعاه' },
    ],
  },
];

// Curated Verse of the Day Pool with Verbatim Canonical Uthmani Text & Accredited Tafsir
export const VERSE_OF_THE_DAY_POOL: Array<{
  theme: 'reassurance' | 'mercy' | 'patience' | 'trust' | 'dua';
  themeAr: string;
  surahNumber: number;
  surahNameAr: string;
  ayahNumber: number;
  globalAyahNumber: number;
  uthmaniText: string;
  tafsirShortAr: string;
  tafsirSourceAr: string;
}> = [
  {
    theme: 'reassurance',
    themeAr: 'الطمأنينة بذكر الله',
    surahNumber: 13,
    surahNameAr: 'سورة الرعد',
    ayahNumber: 28,
    globalAyahNumber: 1735,
    uthmaniText: 'ٱلَّذِينَ ءَامَنُوا۟ وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ ٱللَّهِ ۗ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
    tafsirShortAr: 'يأنس المؤمنون بذكر الله وتلاوة كتابه، فيزول القلق والاضطراب عن قلوبهم ويحل فيها الأنس واليقين والرضا؛ وحقاً لَـبذكر الله وطاعته تسكن القلوب وتطمئن.',
    tafsirSourceAr: 'التفسير الميسر — مجمع الملك فهد لطباعة المصحف الشريف',
  },
  {
    theme: 'mercy',
    themeAr: 'سعة رحمة الله',
    surahNumber: 39,
    surahNameAr: 'سورة الزمر',
    ayahNumber: 53,
    globalAyahNumber: 4111,
    uthmaniText: '۞ قُلْ يَٰعِبَادِىَ ٱلَّذِينَ أَسْرَفُوا۟ عَلَىٰٓ أَنفُسِهِمْ لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا ۚ إِنَّهُۥ هُوَ ٱلْغَفُورُ ٱلرَّحِيمُ',
    tafsirShortAr: 'بشارة عظمى لكل تائب منيب: لا تيأسوا من رحمة الله مهما عظمت الذنوب، فإن الله يغفر الذنوب جميعاً لمن تاب منها وأناب إليه، إنه هو الغفور الرحيم بعباده.',
    tafsirSourceAr: 'تيسير الكريم الرحمن — الشيخ عبد الرحمن بن ناصر السعدي',
  },
  {
    theme: 'dua',
    themeAr: 'قرب الله وإجابة الدعاء',
    surahNumber: 2,
    surahNameAr: 'سورة البقرة',
    ayahNumber: 186,
    globalAyahNumber: 193,
    uthmaniText: 'وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ ٱلدَّاعِ إِذَا دَعَانِ ۖ فَلْيَسْتَجِيبُوا۟ لِى وَلْيُؤْمِنُوا۟ بِى لَعَلَّهُمْ يَرْشُدُونَ',
    tafsirShortAr: 'الله سبحانه قريب من عباده سميع لدعائهم عليم بحاجاتهم، يجيب من دعاه بإخلاص ويقين؛ فعليهم الاستجابة لأمره والثبات على الإيمان به لينالوا الرشاد في دينهم ودنياهم.',
    tafsirSourceAr: 'التفسير الميسر — مجمع الملك فهد لطباعة المصحف الشريف',
  },
  {
    theme: 'patience',
    themeAr: 'التيسير بعد العسر',
    surahNumber: 94,
    surahNameAr: 'سورة الشرح',
    ayahNumber: 5,
    globalAyahNumber: 6096,
    uthmaniText: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا',
    tafsirShortAr: 'وعدٌ إلهي مؤكد لا يتخلف: ما من شدة أو ضيق يمر بالعبد المؤمن إلا واقترن به الفرج والتيسير من الله، ولن يغلب عسرٌ واحدٌ يسرين.',
    tafsirSourceAr: 'تفسير ابن كثير — الإمام الحافظ عماد الدين ابن كثير',
  },
  {
    theme: 'trust',
    themeAr: 'التقوى والتوكل والرزق',
    surahNumber: 65,
    surahNameAr: 'سورة الطلاق',
    ayahNumber: 3,
    globalAyahNumber: 5220,
    uthmaniText: 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ ۚ وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ ۚ إِنَّ ٱللَّهَ بَٰلِغُ أَمْرِهِۦ ۚ قَدْ جَعَلَ ٱللَّهُ لِكُلِّ شَىْءٍ قَدْرًا',
    tafsirShortAr: 'من فوّض أمره إلى الله مع الأخذ بالأسباب المشروعة كفاه الله كل ما أهمّه من أمر دينه ودنياه، وساق إليه الرزق من وجوه لا تخطر له على بال.',
    tafsirSourceAr: 'تيسير الكريم الرحمن — الشيخ عبد الرحمن بن ناصر السعدي',
  },
];

// Authenticated Reasons for Revelation (أسباب النزول المحققة)
export const ASBAB_AL_NUZUL_RECORDS: Array<{
  surahNumber: number;
  surahNameAr: string;
  ayahRange: string;
  sababAr: string;
  sourceAr: string;
}> = [
  {
    surahNumber: 2,
    surahNameAr: 'البقرة',
    ayahRange: '186',
    sababAr: 'جاء أعرابي إلى النبي صلى الله عليه وسلم فقال: يا رسول الله، أقريب ربنا فنناجيه أم بعيد فنناديه؟ فسكت النبي صلى الله عليه وسلم فأنزل الله: (وإذا سألك عبادي عني فإني قريب أجيب دعوة الداع إذا دعان).',
    sourceAr: 'أسباب النزول للواحدي وتفسير الطبري وابن كثير',
  },
  {
    surahNumber: 18,
    surahNameAr: 'الكهف',
    ayahRange: '1 - 26',
    sababAr: 'نزلت جواباً عن أسئلة قريش للنبي صلى الله عليه وسلم عن فتية ذهبوا في الدهر الأول ما كان من أمرهم، وعن رجل طوّاف بلغ مشارق الأرض ومغاربها، وعن الروح.',
    sourceAr: 'تفسير ابن كثير وأسباب النزول للسيوطي (لباب النقول)',
  },
  {
    surahNumber: 58,
    surahNameAr: 'المجادلة',
    ayahRange: '1 - 4',
    sababAr: 'نزلت في خولة بنت ثعلبة رضي الله عنها حين ظاهر منها زوجها أوس بن الصامت فجاءت تشتكي إلى الله وتجادل عند رسول الله صلى الله عليه وسلم، فسمع الله قولها من فوق سبع سماوات.',
    sourceAr: 'صحيح البخاري (تعليقاً) وسنن أبي داود وتفسير ابن كثير',
  },
  {
    surahNumber: 80,
    surahNameAr: 'عبس',
    ayahRange: '1 - 10',
    sababAr: 'نزلت في الصحابي الجليل عبد الله بن أم مكتوم رضي الله عنه وكان ضرير البصر، أتى النبي صلى الله عليه وسلم يستهديه القرآن وعنده عظماء قريش يدعوهم إلى الإسلام.',
    sourceAr: 'الموطأ وسنن الترمذي (حديث صحيح) ولباب النقول للسيوطي',
  },
  {
    surahNumber: 93,
    surahNameAr: 'الضحى',
    ayahRange: '1 - 3',
    sababAr: 'اشتكى النبي صلى الله عليه وسلم فلم يقم ليلتين أو ثلاثاً، فقالت امرأة: ما أرى شيطانك إلا قد تركك، فأنزل الله عز وجل: (والضحى والليل إذا سجى ما ودعك ربك وما قلى).',
    sourceAr: 'متفق عليه — صحيح البخاري وصحيح مسلم عن جندب بن سفيان رضي الله عنه',
  },
  {
    surahNumber: 112,
    surahNameAr: 'الإخلاص',
    ayahRange: '1 - 4',
    sababAr: 'قال المشركون لرسول الله صلى الله عليه وسلم: انسب لنا ربك، فأنزل الله تبارك وتعالى: (قل هو الله أحد الله الصمد لم يلد ولم يولد ولم يكن له كفواً أحد).',
    sourceAr: 'سنن الترمذي ومسند الإمام أحمد (بسند حسن)',
  },
];

// Verify static integrity at boot
export function verifyCanonicalQuranMetadata(): {
  valid: boolean;
  surahCount: number;
  totalAyahs: number;
} {
  const surahCount = ALL_SURAHS.length;
  const totalAyahs = ALL_SURAHS.reduce((sum, s) => sum + s.ayahCount, 0);
  return {
    valid: surahCount === 114 && totalAyahs === 6236,
    surahCount,
    totalAyahs,
  };
}
