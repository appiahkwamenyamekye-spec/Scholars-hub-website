import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { WorkCard } from '../components/WorkCard.tsx';
import { api } from '../services/api.ts';
import { AcademicWork, Category, Institution } from '../types/index.ts';

interface ExplorePageProps {
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: string;
  onSelectWork: (work: AcademicWork) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialQuery = '',
  initialCategory = '',
  initialSort = 'popular',
  onSelectWork,
}) => {
  const [works, setWorks] = useState<AcademicWork[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [level, setLevel] = useState('');
  const [fileType, setFileType] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [categories, setCategories] = useState<Category[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getInstitutions().then(setInstitutions).catch(() => {});
  }, []);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const data = await api.getWorks({
        q,
        category,
        level,
        type: fileType,
        sort,
        page,
        limit: 12,
      });
      setWorks(data.works);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load works:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorks();
  }, [category, level, fileType, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadWorks();
  };

  const handleResetFilters = () => {
    setQ('');
    setCategory('');
    setLevel('');
    setFileType('');
    setSort('popular');
    setPage(1);
  };

  const hasActiveFilters = Boolean(q || category || level || fileType || sort !== 'popular');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Search Bar */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Academic Discovery
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
            Explore Scholarly Works
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search thousands of peer-uploaded papers, lecture materials, and theses across disciplines.
          </p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center px-3.5 focus-within:border-amber-400 transition-colors">
            <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by keywords, title, course, or contributor..."
              className="w-full bg-transparent py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  setPage(1);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md shrink-0"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters Desktop */}
        <aside
          className={`lg:block ${
            showMobileFilters ? 'block fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : 'hidden'
          } lg:relative lg:p-0 space-y-6`}
        >
          {showMobileFilters && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="font-serif text-lg font-bold text-white">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-200 text-xs font-semibold uppercase tracking-wider">
                <Filter className="w-4 h-4 text-amber-400" />
                <span>Filter Criteria</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Discipline Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Academic Discipline
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">All Disciplines</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Degree Level
              </label>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">All Academic Levels</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate (Master's)</option>
                <option value="Doctorate">Doctorate (Ph.D.)</option>
                <option value="Faculty/Research">Faculty & Postdoc Research</option>
                <option value="High School">Secondary / Preparatory</option>
              </select>
            </div>

            {/* File Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Document Format
              </label>
              <select
                value={fileType}
                onChange={(e) => {
                  setFileType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">All Formats</option>
                <option value="PDF">PDF Document</option>
                <option value="DOCX">Microsoft Word (DOCX)</option>
                <option value="PPTX">Presentation (PPTX)</option>
                <option value="XLSX">Spreadsheet (XLSX)</option>
                <option value="ZIP">Archive (ZIP)</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Results Main Section */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Sort & Results Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-300">
              Showing <span className="text-amber-400 font-bold">{works.length}</span> of{' '}
              <span className="text-white font-bold">{total}</span> publications
            </span>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 shrink-0">Sort By:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="popular">Most Popular & Engaged</option>
                <option value="downloads">Most Downloaded</option>
                <option value="likes">Most Liked</option>
                <option value="recent">Recently Uploaded</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Grid of Results */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400">Loading academic materials...</p>
            </div>
          ) : works.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <p className="font-serif text-xl font-bold text-white">No academic works found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching research works found for this query or filter set. Try clearing filters or searching broader keywords.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  onSelect={onSelectWork}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs text-slate-300 font-medium px-4">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
