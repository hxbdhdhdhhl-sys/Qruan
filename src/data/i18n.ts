import type { Language } from '../types/quran';

export const MESSAGE_LIBRARY = {
  ar: {
    welcome: [
      'أهلاً بك في اطمئنان القرآن — اطمئن قلبك بذكر الله',
      'مرحباً بك، نسأل الله أن يجعل القرآن العظيم ربيع قلبك ونور صدرك',
      'ابدأ رحلتك اليومية مع كتاب الله تلاوةً وتدبراً وحفظاً',
      'اجعل لك كل يوم ورداً ثابتاً من القرآن الكريم يبارك يومك',
      'أهلاً بك مجدداً، نكمل رحلتنا المباركة مع كلام الله عز وجل',
      'القرآن ربيع القلوب وطمأنينة النفوس ومنارة الهداية',
    ],
    loading: {
      appBoot: 'جارٍ تجهيز اطمئنان القرآن...',
      mushaf: 'جارٍ تجهيز المصحف الشريف بالرسم العثماني الموثق...',
      surah: 'جارٍ تحميل السورة الكريمة والتحقق من تمام الآيات...',
      recitation: 'جارٍ تحميل التلاوة المباركة، يرجى الانتظار...',
      tafsir: 'جارٍ جلب التفسير من المصدر العلمي المعتمد...',
      translations: 'جارٍ تحميل ترجمة معاني القرآن الكريم...',
      savingProgress: 'جارٍ حفظ تقدم القراءة...',
      syncing: 'جارٍ مزامنة بياناتك بأمان...',
      assistant: 'جارٍ مراجعة التفاسير المعتمدة لإعداد الإجابة الموثقة...',
      search: 'جارٍ البحث في الآيات والمصادر المعتمدة...',
    },
    success: {
      bookmarkSaved: 'تم حفظ الآية في المفضلة بنجاح',
      bookmarkRemoved: 'تمت إزالة الآية من المفضلة',
      readingPositionSaved: 'تم حفظ موضع القراءة الأخير',
      hifzUpdated: 'تم تحديث تقدم الحفظ بنجاح',
      wirdCompleted: 'أحسنت، أتممت وردك القرآني اليومي تقبل الله منك',
      recitationDownloaded: 'تم تنزيل السورة والتلاوة للاستماع دون إنترنت بنجاح',
      noteSaved: 'تم حفظ ملاحظتك التدبرية بنجاح',
      synced: 'تمت مزامنة بياناتك بنجاح عبر أجهزتك',
      khatmahCreated: 'تم إنشاء ختمتك الجديدة بنجاح',
      prayerUpdated: 'تم تحديث مواقيت الصلاة واتجاه القبلة حسب موقعك',
      copied: 'تم نسخ النص القرآني مع توثيق السورة ورقم الآية',
    },
    errors: {
      offline: 'لا يوجد اتصال بالإنترنت حالياً — يمكنك متابعة القراءة والأذكار المحفوظة محلياً.',
      serverUnreachable: 'تعذر الاتصال بالخادم حالياً. يرجى التحقق من اتصالك والمحاولة مجدداً.',
      mushafLoadFailed: 'تعذر تحميل صفحة المصحف من المصدر الموثوق؛ لن يتم عرض أي نص غير مكتمل حفاظاً على قدسية القرآن.',
      audioFailed: 'تعذر تشغيل التلاوة الصوتية حالياً. يرجى تجربة قارئ آخر أو التحقق من الاتصال.',
      tafsirFailed: 'تعذر جلب التفسير المعتمد لهذه الآية في الوقت الحالي.',
      authFailed: 'تعذر إتمام تسجيل الدخول. يرجى المحاولة مرة أخرى.',
      geolocationFailed: 'تعذر تحديد الموقع تلقائياً. يمكنك اختيار مدينتك يدوياً بكل سهولة.',
      syncFailed: 'تعذر إتمام المزامنة السحابية حالياً؛ بياناتك محفوظة محلياً بأمان وستتم مزامنتها تلقائياً عند عودة الاتصال.',
      unexpected: 'حدث خطأ غير متوقع أثناء تنفيذ العملية. يرجى إعادة المحاولة.',
    },
    empty: {
      searchResults: 'لم يتم العثور على نتائج مطابقة لعبارة البحث. جرّب البحث بكلمة مفردة أو اسم السورة.',
      bookmarks: 'لا توجد آيات محفوظة في المفضلة بعد. اضغط على أيقونة الحفظ بجانب أي آية لإضافتها.',
      notes: 'لا توجد ملاحظات تدبرية مسجلة حالياً.',
      hifzPlan: 'لم تقم بإنشاء خطة حفظ شخصية بعد. ابدأ الآن بتحديد وردك اليومي.',
      khatmah: 'لا توجد ختمة نشطة حالياً. أنشئ ختمتك وحدد المدة المناسبة لك.',
      offlineDownloads: 'لم يتم تنزيل سور للعمل دون إنترنت بعد. يمكنك تنزيل أي سورة بضغطة واحدة من المصحف.',
      savedBooks: 'قائمة الكتب المحفوظة للقراءة لاحقاً فارغة حالياً.',
      notifications: 'لا توجد إشعارات جديدة في الوقت الحالي.',
    },
    confirmations: {
      deleteNote: 'هل تريد حذف هذه الملاحظة والآية المحفوظة من قائمتك؟',
      signOut: 'هل تريد تسجيل الخروج من حسابك؟ ستبقى بياناتك المحلية محفوظة.',
      deleteAccountData: 'هل أنت متأكد من حذف بيانات حسابك السحابية والمحلية نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
    },
  },
  en: {
    welcome: [
      'Welcome to Quran Reassurance — Find peace in the remembrance of Allah',
      'Welcome back — Continue your daily journey with the Noble Quran',
      'Make a daily Wird from the Book of Allah a light for your day',
    ],
    loading: {
      appBoot: 'Preparing Quran Reassurance...',
      mushaf: 'Loading verified Uthmani Mushaf...',
      surah: 'Loading Surah and verifying verse integrity...',
      recitation: 'Loading audio recitation, please wait...',
      tafsir: 'Fetching commentary from accredited scholarly sources...',
      translations: 'Loading translation of the meanings of the Quran...',
      savingProgress: 'Saving your reading position...',
      syncing: 'Syncing your progress securely...',
      assistant: 'Consulting accredited Tafsir works...',
      search: 'Searching verified Quranic verses and sources...',
    },
    success: {
      bookmarkSaved: 'Verse saved to Favorites successfully',
      bookmarkRemoved: 'Verse removed from Favorites',
      readingPositionSaved: 'Last reading position saved',
      hifzUpdated: 'Memorization progress updated',
      wirdCompleted: 'Well done! You completed your daily Quranic Wird',
      recitationDownloaded: 'Surah & recitation cached for offline access',
      noteSaved: 'Personal reflection note saved',
      synced: 'Your data has been synced across devices',
      khatmahCreated: 'New Khatmah plan created successfully',
      prayerUpdated: 'Prayer times and Qibla bearing updated',
      copied: 'Verified verse copied with Surah & Ayah citation',
    },
    errors: {
      offline: 'You are currently offline — Offline Quran & saved Adhkar remain available.',
      serverUnreachable: 'Unable to reach server. Please check your connection and retry.',
      mushafLoadFailed: 'Unable to verify complete Mushaf page; partial Quranic text is never displayed.',
      audioFailed: 'Unable to play audio stream right now. Please retry or select another reciter.',
      tafsirFailed: 'Unable to load accredited Tafsir at this moment.',
      authFailed: 'Sign-in could not be completed. Please try again.',
      geolocationFailed: 'Location permission declined or unavailable. Select your city manually.',
      syncFailed: 'Cloud sync paused; your progress is safely stored locally and will sync when online.',
      unexpected: 'An unexpected error occurred. Please try again.',
    },
    empty: {
      searchResults: 'No matching results found. Try searching a single root word or Surah:Ayah.',
      bookmarks: 'No favorite verses saved yet. Bookmark any Ayah while reading.',
      notes: 'No personal reflection notes yet.',
      hifzPlan: 'No active memorization plan yet. Create a personalized daily Hifz schedule.',
      khatmah: 'No active Khatmah plan. Start a 30-day or custom Khatmah schedule.',
      offlineDownloads: 'No Surahs downloaded for offline reading yet.',
      savedBooks: 'Your saved Islamic Library reading list is currently empty.',
      notifications: 'No new notifications right now.',
    },
    confirmations: {
      deleteNote: 'Are you sure you want to remove this saved verse and note?',
      signOut: 'Would you like to sign out of your account?',
      deleteAccountData: 'Permanently delete your cloud and local account data? This cannot be undone.',
    },
  },
} as const;

export const UI_LABELS: Record<
  Language,
  {
    brandName: string;
    brandEnglish: string;
    slogan: string;
    navHome: string;
    navQuran: string;
    navAdhkar: string;
    navTools: string;
    navLibrary: string;
    navAssistant: string;
    navCommunity: string;
    navAccount: string;
    navAdmin: string;
    searchPlaceholder: string;
    continueReading: string;
    verseOfDay: string;
    dailyWird: string;
    nextPrayer: string;
    retry: string;
    goBack: string;
    continueOffline: string;
    signInGoogle: string;
    signOut: string;
    translationNotice: string;
  }
> = {
  ar: {
    brandName: 'اطمئنان القرآن',
    brandEnglish: 'طمأنينة القرآن · Quran Reassurance',
    slogan: 'اطمئن بذكر الله',
    navHome: 'الرئيسية',
    navQuran: 'القرآن الكريم',
    navAdhkar: 'الأذكار',
    navTools: 'أدواتي',
    navLibrary: 'المكتبة',
    navAssistant: 'المساعد الذكي',
    navCommunity: 'مجتمع القرآن',
    navAccount: 'حسابي',
    navAdmin: 'لوحة الإدارة',
    searchPlaceholder: 'ابحث في القرآن، التفاسير، الأذكار، القراء، أو المكتبة...',
    continueReading: 'متابعة القراءة',
    verseOfDay: 'آية اليوم',
    dailyWird: 'الورد القرآني اليومي',
    nextPrayer: 'الصلاة القادمة',
    retry: 'إعادة المحاولة',
    goBack: 'الرجوع للصفحة السابقة',
    continueOffline: 'المتابعة بالبيانات المحفوظة دون إنترنت',
    signInGoogle: 'تسجيل الدخول عبر Google',
    signOut: 'تسجيل الخروج',
    translationNotice:
      'تنبيه علمي: الترجمات المعروضة هي ترجمة لمعاني القرآن الكريم تقريباً بلغات العالم، ولا تُعد بديلاً عن النص القرآني العربي المعجز.',
  },
  en: {
    brandName: 'Quran Reassurance',
    brandEnglish: 'اطمئنان القرآن · Tranquility in Remembrance',
    slogan: 'Find Peace in the Remembrance of Allah',
    navHome: 'Home',
    navQuran: 'Noble Quran',
    navAdhkar: 'Adhkar',
    navTools: 'My Tools',
    navLibrary: 'Library',
    navAssistant: 'Smart Assistant',
    navCommunity: 'Community',
    navAccount: 'Account',
    navAdmin: 'Admin',
    searchPlaceholder: 'Search Quran, Tafsir, Adhkar, Reciters, or Library...',
    continueReading: 'Continue Reading',
    verseOfDay: 'Verse of the Day',
    dailyWird: 'Daily Quran Wird',
    nextPrayer: 'Next Prayer',
    retry: 'Retry',
    goBack: 'Go Back',
    continueOffline: 'Continue Offline',
    signInGoogle: 'Sign in with Google',
    signOut: 'Sign Out',
    translationNotice:
      'Scholarly Notice: Translations convey approximate meanings of the Noble Quran and never replace the revealed Arabic Quranic text.',
  },
};
