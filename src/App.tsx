import React, { useEffect } from 'react';
import { QuranAppProvider, useQuranApp } from './context/QuranAppContext';
import {
  AudioPlayerBar,
  GlobalSearchModal,
  InstitutionalFooter,
  InternalPageBreadcrumbs,
  MobileBottomNav,
  NotificationsDrawer,
  OperationalUtilityBar,
  ToastAndConfirmOverlays,
  TopNavigationHeader,
} from './components/NavigationAndOverlays';
import { HomeDashboardView } from './components/HomeDashboardView';
import { QuranHubView } from './components/QuranHubView';
import { AdhkarAndTasbihView } from './components/AdhkarAndTasbihView';
import { IslamicToolsHubView } from './components/IslamicToolsHubView';
import {
  CommunityView,
  LibraryView,
  SmartAssistantView,
} from './components/LibraryAssistantCommunityView';
import { UserProfileView } from './components/UserProfileView';
import { AdminConsoleView } from './components/AdminConsoleView';

const QuranReassuranceShell: React.FC = () => {
  const { activeNav, lang, audioState } = useQuranApp();

  useEffect(() => {
    const titlesAr: Record<string, string> = {
      home: 'اطمئنان القرآن – الطمأنينة القرآنية | اطمئن بذكر الله',
      quran: 'المصحف الشريف والتلاوات والتفسير | اطمئنان القرآن',
      adhkar: 'الأذكار النبوية والأدعية والمسبحة | اطمئنان القرآن',
      tools: 'مواقيت الصلاة، القبلة، الحفظ والتجويد | اطمئنان القرآن',
      library: 'المكتبة الإسلامية الموثقة | اطمئنان القرآن',
      assistant: 'المساعد القرآني الذكي | اطمئنان القرآن',
      community: 'مجتمع القرآن والختمات الجماعية | اطمئنان القرآن',
      account: 'حسابي وإحصائيات الورد والحفظ | اطمئنان القرآن',
      admin: 'لوحة الإدارة والحوكمة العلمية | اطمئنان القرآن',
    };
    const titlesEn: Record<string, string> = {
      home: 'Quran Reassurance – اطمئنان القرآن | Find Peace in Remembrance',
      quran: 'Noble Mushaf, Recitations & Tafsir | Quran Reassurance',
      adhkar: 'Authenticated Adhkar, Duas & Tasbih | Quran Reassurance',
      tools: 'Prayer Times, Qibla, Hifz & Tajweed | Quran Reassurance',
      library: 'Accredited Islamic Library | Quran Reassurance',
      assistant: 'Smart Quranic Assistant | Quran Reassurance',
      community: 'Quran Community & Collective Khatmah | Quran Reassurance',
      account: 'Account, Bookmarks & Progress | Quran Reassurance',
      admin: 'Admin & Scholarly Governance Console | Quran Reassurance',
    };

    document.title =
      (lang === 'ar' ? titlesAr[activeNav] : titlesEn[activeNav]) ||
      'اطمئنان القرآن – الطمأنينة القرآنية | Quran Reassurance';
  }, [activeNav, lang]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FBF9F5] dark:bg-[#09120E] text-stone-900 dark:text-stone-100 selection:bg-amber-300/40 ${
        audioState.verseText ? 'pb-28 md:pb-20' : 'pb-16 md:pb-0'
      }`}
    >
      <TopNavigationHeader />
      <OperationalUtilityBar />

      <main className="flex-1 w-full">
        <InternalPageBreadcrumbs />
        {activeNav === 'home' && <HomeDashboardView />}
        {activeNav === 'quran' && <QuranHubView />}
        {activeNav === 'adhkar' && <AdhkarAndTasbihView />}
        {activeNav === 'tools' && <IslamicToolsHubView />}
        {activeNav === 'library' && <LibraryView />}
        {activeNav === 'assistant' && <SmartAssistantView />}
        {activeNav === 'community' && <CommunityView />}
        {activeNav === 'account' && <UserProfileView />}
        {activeNav === 'admin' && <AdminConsoleView />}
      </main>

      <InstitutionalFooter />
      <AudioPlayerBar />
      <MobileBottomNav />
      <GlobalSearchModal />
      <NotificationsDrawer />
      <ToastAndConfirmOverlays />
    </div>
  );
};

export default function App() {
  return (
    <QuranAppProvider>
      <QuranReassuranceShell />
    </QuranAppProvider>
  );
}
