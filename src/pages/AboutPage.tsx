import React from 'react';
import {
  BookOpen,
  CheckCircle,
  FileCheck,
  GraduationCap,
  Scale,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>About ScholarHub Repository</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
          Democratizing Global Academic Knowledge & Research
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          ScholarHub was engineered as a high-conversion, peer-verified platform designed to empower university students, doctoral researchers, and faculty to publish, discover, and collaborate on scholarly work.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">Academic Integrity</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every submission requires verified author confirmation. Plagiarism, copyright infringement, and artificial inflation are strictly investigated by our editorial board.
          </p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">Open Access (CC-BY)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We champion Creative Commons licensing. Research should be discoverable without deceptive download hurdles, paywalls, or forced subscriptions.
          </p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-white">Scholarly Community</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Peer interactions through structured comment threads, citation export in 5 standard academic formats, and author follow-ups foster true academic discourse.
          </p>
        </div>
      </div>

      {/* Copyright & DMCA Notice Section */}
      <div id="copyright" className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          <span>Copyright & Intellectual Property Policy</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-white">Respecting Intellectual Property</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          ScholarHub strictly complies with international intellectual property treaties, the Digital Millennium Copyright Act (DMCA), and European copyright directives. Uploaders warrant that they are either the sole copyright holder of the submitted manuscript or possess express statutory license to disseminate the academic material.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          If you believe your copyrighted academic work has been reproduced without authorization, submit a notice through the "Report / Copyright Notice" link found on any publication page, or contact the editorial office at <span className="text-amber-400 underline">support@scholarhub.edu</span>.
        </p>
      </div>

      {/* Disciplines Directory Overview */}
      <div id="disciplines" className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h2 className="font-serif text-2xl font-bold text-white">13 Academic Divisions</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          From Computer Science & IT, Business, and Quantitative Finance to Jurisprudence, Health Sciences, and Humanities, ScholarHub provides distinct indexing for specialized research.
        </p>
      </div>
    </div>
  );
};
