import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Cpu,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  Heart,
  HeartPulse,
  Layers,
  MessageSquare,
  Scale,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import { WorkCard } from '../components/WorkCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AcademicWork, Category, PlatformStats } from '../types/index.ts';

interface HomePageProps {
  onNavigate: (tab: string, param?: string) => void;
  onSelectWork: (work: AcademicWork) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectWork }) => {
  const { firebaseUser, signInWithGoogle } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredWorks, setFeaturedWorks] = useState<AcademicWork[]>([]);
  const [trendingWorks, setTrendingWorks] = useState<AcademicWork[]>([]);
  const [recentWorks, setRecentWorks] = useState<AcademicWork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getStats().catch(() => null),
      api.getCategories().catch(() => []),
      api.getFeaturedWorks().catch(() => []),
      api.getTrendingWorks().catch(() => []),
      api.getRecentWorks().catch(() => []),
    ]).then(([statsData, catData, featData, trendData, recData]) => {
      if (statsData) setStats(statsData);
      setCategories(catData || []);
      setFeaturedWorks(featData || []);
      setTrendingWorks(trendData || []);
      setRecentWorks(recData || []);
      setLoading(false);
    });
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('explore', `q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('explore');
    }
  };

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code':
        return <Cpu className="w-5 h-5 text-sky-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-amber-400" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-indigo-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-teal-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-purple-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 pt-16 pb-24 border-b border-slate-900">
        {/* Subtle geometric academic background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-teal-500/5 to-transparent blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Academic Publishing & Research Repository</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Your Knowledge <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-teal-300">
                Deserves an Audience.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              ScholarHub is a high-impact digital repository for universities, independent scholars, and students. Discover, peer-review, and download peer-submitted theses, research papers, lecture notes, and assignments.
            </p>

            {/* Prominent Academic Search Bar */}
            <form onSubmit={handleHeroSearch} className="max-w-2xl mx-auto mt-8">
              <div className="relative flex items-center bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 focus-within:border-amber-400 transition-colors">
                <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by paper title, author, keyword, subject, or discipline..."
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shrink-0 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
                >
                  Search Works
                </button>
              </div>
            </form>

            {/* Popular discipline tags */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="text-slate-400 font-medium">Quick Explore:</span>
              {['Computer Science', 'Economics', 'Health Sciences', 'Law', 'Business'].map((t) => (
                <button
                  key={t}
                  onClick={() => onNavigate('explore', `q=${encodeURIComponent(t)}`)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('explore')}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl border border-slate-700 transition-colors flex items-center space-x-2"
              >
                <span>Explore Academic Works</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => {
                  if (!firebaseUser) signInWithGoogle();
                  else onNavigate('upload');
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Your Work</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLATFORM STATISTICS (Real PostgreSQL Counts) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="text-center p-3 border-r border-slate-800 last:border-0">
            <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {stats?.totalWorks.toLocaleString() ?? '10+'}
            </p>
            <p className="text-xs text-amber-400 font-medium mt-1">Published Academic Works</p>
          </div>
          <div className="text-center p-3 border-r border-slate-800 last:border-0">
            <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {stats?.registeredUsers.toLocaleString() ?? '50+'}
            </p>
            <p className="text-xs text-teal-400 font-medium mt-1">Registered Researchers</p>
          </div>
          <div className="text-center p-3 border-r border-slate-800 last:border-0">
            <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {stats?.totalDownloads.toLocaleString() ?? '2,400+'}
            </p>
            <p className="text-xs text-amber-400 font-medium mt-1">Total Downloads</p>
          </div>
          <div className="text-center p-3">
            <p className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {stats?.totalCategories.toLocaleString() ?? '13'}
            </p>
            <p className="text-xs text-teal-400 font-medium mt-1">Academic Disciplines</p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED ACADEMIC WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Editorial Highlights
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Featured Academic Research
            </h2>
          </div>
          <button
            onClick={() => onNavigate('explore', 'sort=popular')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
          >
            <span>View All Highlights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredWorks.length > 0 ? (
            featuredWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onSelect={onSelectWork}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm">
              Loading featured research papers...
            </div>
          )}
        </div>
      </section>

      {/* 4. BROWSE ACADEMIC DISCIPLINES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Explore by Discipline
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Browse Academic Disciplines
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Dive into specialized faculty categories curated for undergraduate studies through doctoral research.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('explore', `category=${cat.slug}`)}
              className="group p-5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {getCategoryIcon(cat.icon)}
                </div>
                <h3 className="font-serif text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description || 'Scholarly papers, assignments, and study resources.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{cat.worksCount || 0} publications</span>
                <span className="text-amber-400 group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TRENDING & POPULAR ACADEMIC WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              High Engagement
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Trending Academic Works
            </h2>
          </div>
          <button
            onClick={() => onNavigate('explore', 'sort=popular')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
          >
            <span>See Most Downloaded</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingWorks.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onSelect={onSelectWork}
            />
          ))}
        </div>
      </section>

      {/* 6. RECENTLY UPLOADED WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Latest Additions
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Recently Uploaded Works
            </h2>
          </div>
          <button
            onClick={() => onNavigate('explore', 'sort=recent')}
            className="mt-3 sm:mt-0 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
          >
            <span>View Recent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentWorks.slice(0, 6).map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onSelect={onSelectWork}
            />
          ))}
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section className="bg-slate-900/60 border-y border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Seamless Workflow
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              How ScholarHub Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Empowering scholarly publishing, open verification, and intellectual collaboration in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl relative">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold font-serif mb-4">
                01
              </div>
              <h3 className="font-serif text-base font-bold text-white">Discover & Search</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Search verified papers across 13 disciplines with advanced filtering by course, degree level, and publication year.
              </p>
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl relative">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold font-serif mb-4">
                02
              </div>
              <h3 className="font-serif text-base font-bold text-white">Upload & Protect</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Submit PDF, DOCX, or PPTX works with full author attribution, CC-BY licensing, and verified copyright ownership.
              </p>
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl relative">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold font-serif mb-4">
                03
              </div>
              <h3 className="font-serif text-base font-bold text-white">Engage & Discuss</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Leave constructive feedback, participate in threaded academic discussions, and connect directly with authors.
              </p>
            </div>

            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl relative">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold font-serif mb-4">
                04
              </div>
              <h3 className="font-serif text-base font-bold text-white">Download & Cite</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Download verified academic files securely and export standard APA, MLA, Chicago, and BibTeX citations with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HIGH-CONVERSION CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl relative space-y-4">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-400 inline-block">
              Open Academic Network
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Ready to Share Your Research with the World?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Join thousands of faculty members, graduate researchers, and students. Gain verified citations, peer readership, and expand the frontiers of open academic knowledge.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  if (!firebaseUser) signInWithGoogle();
                  else onNavigate('upload');
                }}
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
              >
                Publish Your Academic Work Now
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Learn About Our Standards
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
