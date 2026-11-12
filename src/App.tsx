import React, { useEffect, useState } from 'react';
import { Footer } from './components/Footer.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { UploadPage } from './pages/UploadPage.tsx';
import { UserDashboard } from './pages/UserDashboard.tsx';
import { WorkDetailsPage } from './pages/WorkDetailsPage.tsx';
import { AcademicWork } from './types/index.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'explore' | 'categories' | 'upload' | 'dashboard' | 'admin' | 'about' | 'work-details'>('home');
  const [tabParam, setTabParam] = useState<string>('');
  const [selectedWork, setSelectedWork] = useState<AcademicWork | null>(null);

  // Hash change listener for direct link sharing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('work-')) {
        const idOrSlug = hash.replace('work-', '');
        setCurrentTab('work-details');
        setTabParam(idOrSlug);
      } else if (hash === 'explore') {
        setCurrentTab('explore');
      } else if (hash === 'upload') {
        setCurrentTab('upload');
      } else if (hash === 'admin') {
        setCurrentTab('admin');
      } else if (hash === 'about') {
        setCurrentTab('about');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (tab: string, param: string = '') => {
    setTabParam(param);
    if (tab === 'home') {
      setCurrentTab('home');
      window.location.hash = '';
    } else if (tab === 'explore' || tab === 'popular') {
      setCurrentTab('explore');
      window.location.hash = 'explore';
    } else if (tab === 'categories') {
      setCurrentTab('explore');
      window.location.hash = 'explore';
    } else if (tab === 'upload') {
      setCurrentTab('upload');
      window.location.hash = 'upload';
    } else if (tab === 'dashboard') {
      setCurrentTab('dashboard');
      window.location.hash = 'dashboard';
    } else if (tab === 'admin') {
      setCurrentTab('admin');
      window.location.hash = 'admin';
    } else if (tab === 'about') {
      setCurrentTab('about');
      window.location.hash = 'about';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWork = (work: AcademicWork) => {
    setSelectedWork(work);
    setCurrentTab('work-details');
    setTabParam(work.slug || String(work.id));
    window.location.hash = `work-${work.slug || work.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Parse explore params
  const parseExploreParams = () => {
    const params = new URLSearchParams(tabParam);
    return {
      query: params.get('q') || '',
      category: params.get('category') || '',
      sort: params.get('sort') || 'popular',
    };
  };

  const exploreProps = parseExploreParams();

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <Navbar
          currentTab={currentTab}
          onNavigate={handleNavigate}
        />

        <main className="flex-1">
          {currentTab === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onSelectWork={handleSelectWork}
            />
          )}

          {currentTab === 'explore' && (
            <ExplorePage
              key={tabParam}
              initialQuery={exploreProps.query}
              initialCategory={exploreProps.category}
              initialSort={exploreProps.sort}
              onSelectWork={handleSelectWork}
            />
          )}

          {currentTab === 'work-details' && (
            <WorkDetailsPage
              identifier={tabParam || selectedWork?.slug || selectedWork?.id || ''}
              onBack={() => handleNavigate('explore')}
              onSelectWork={handleSelectWork}
            />
          )}

          {currentTab === 'upload' && (
            <UploadPage
              onSuccess={(work) => handleSelectWork(work)}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'dashboard' && (
            <UserDashboard
              initialTab={tabParam.replace('tab=', '') || 'overview'}
              onNavigate={handleNavigate}
              onSelectWork={handleSelectWork}
            />
          )}

          {currentTab === 'admin' && <AdminDashboard />}

          {currentTab === 'about' && <AboutPage />}
        </main>

        <Footer onNavigate={handleNavigate} />
      </div>
    </AuthProvider>
  );
}
