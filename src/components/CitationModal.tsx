import React, { useState } from 'react';
import { Check, Copy, Quote, X } from 'lucide-react';
import { AcademicWork } from '../types/index.ts';

interface CitationModalProps {
  work: AcademicWork;
  isOpen: boolean;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ work, isOpen, onClose }) => {
  const [style, setStyle] = useState<'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'BibTeX'>('APA');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const author = work.authorName || 'Author, A.';
  const year = work.publicationYear || 2025;
  const title = work.title;
  const inst = work.institutionName || 'ScholarHub Repository';
  const url = `${window.location.origin}/#work-${work.slug || work.id}`;

  const getCitationText = () => {
    switch (style) {
      case 'APA':
        return `${author}. (${year}). ${title}. ${inst}. Retrieved from ${url}`;
      case 'MLA':
        return `${author}. "${title}." ${inst}, ${year}, ${url}.`;
      case 'Chicago':
        return `${author}. "${title}." ${inst} (${year}). ${url}.`;
      case 'Harvard':
        return `${author}, ${year}. ${title}. ${inst}. Available at: <${url}> [Accessed ${new Date().toLocaleDateString()}].`;
      case 'BibTeX':
        return `@misc{scholarhub_${work.id},
  author = {${author}},
  title = {${title}},
  year = {${year}},
  institution = {${inst}},
  url = {${url}}
}`;
      default:
        return `${author} (${year}). ${title}.`;
    }
  };

  const citationText = getCitationText();

  const handleCopy = () => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Quote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white">Cite This Academic Work</h3>
            <p className="text-xs text-slate-400">Generate formatted academic citations</p>
          </div>
        </div>

        {/* Style Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-4 text-xs font-semibold">
          {(['APA', 'MLA', 'Chicago', 'Harvard', 'BibTeX'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`flex-1 py-1.5 px-2 rounded transition-colors ${
                style === s
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Citation Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
          {citationText}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-slate-400">Click below or copy manually</span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Citation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
