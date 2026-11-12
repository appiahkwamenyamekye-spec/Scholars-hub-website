import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  FileCheck,
  GraduationCap,
  Mail,
  Shield,
  Sparkles,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Brand & Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-3 cursor-pointer group inline-flex"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-teal-400 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Scholar<span className="text-amber-400">Hub</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              An open, peer-interactive repository connecting students, doctoral candidates, and university faculties worldwide. Publishing open-access research papers, theses, lecture notes, and assignments under verified academic integrity.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 text-teal-400 font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Verified Integrity</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-400 font-medium">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Creative Commons Friendly</span>
              </span>
            </div>
          </div>

          {/* Academic Disciplines */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Academic Disciplines
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('explore', 'category=computer-science-it')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Computer Science & IT
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore', 'category=business-management')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Business & Management
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore', 'category=economics')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Economics & Finance
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore', 'category=engineering')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Engineering Sciences
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('explore', 'category=health-sciences')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Health & Medicine
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('categories')}
                  className="text-amber-400 hover:underline font-medium inline-flex items-center space-x-1 pt-1"
                >
                  <span>View All 13 Disciplines &rarr;</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Academic Platform & Policy */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Institutional Standards
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-amber-400 transition-colors">
                  About ScholarHub
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about', 'section=ethics')} className="hover:text-amber-400 transition-colors">
                  Academic Ethics & Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about', 'section=copyright')} className="hover:text-amber-400 transition-colors">
                  Copyright & DMCA Notice
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about', 'section=licensing')} className="hover:text-amber-400 transition-colors">
                  Open Licensing (CC-BY 4.0)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about', 'section=moderation')} className="hover:text-amber-400 transition-colors">
                  Peer Moderation Protocol
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Research Digest
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Receive curated weekly digests of high-impact research and emerging preprints across your fields.
            </p>
            {subscribed ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Subscribed! Research highlights will be sent to your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter academic email"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Subscribe to Digest
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-4 sm:space-y-0">
          <p>© 2026 ScholarHub. All rights reserved. Empowering global scholarly discovery.</p>
          <div className="flex items-center space-x-6 text-slate-400">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Statement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
