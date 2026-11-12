import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileUp,
  GraduationCap,
  Info,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { AcademicWork, Category, Institution } from '../types/index.ts';

interface UploadPageProps {
  onSuccess: (work: AcademicWork) => void;
  onNavigate: (tab: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onSuccess, onNavigate }) => {
  const { firebaseUser, token, signInWithGoogle, dbUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [courseOrSubject, setCourseOrSubject] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Undergraduate');
  const [contributorNames, setContributorNames] = useState('');
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear().toString());
  const [downloadPermission, setDownloadPermission] = useState('public');
  const [licenseType, setLicenseType] = useState('CC-BY-4.0');
  const [copyrightDeclaration, setCopyrightDeclaration] = useState(false);

  // File states
  const [docFile, setDocFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Status states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedWork, setUploadedWork] = useState<AcademicWork | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getInstitutions().then(setInstitutions).catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetDoc(e.target.files[0]);
    }
  };

  const validateAndSetDoc = (file: File) => {
    setError('');
    const allowed = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.zip'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Invalid file format "${ext}". Allowed: PDF, DOCX, PPTX, XLSX, ZIP.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds maximum allowed limit of 50MB.');
      return;
    }
    setDocFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetDoc(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!firebaseUser || !token) {
      signInWithGoogle();
      return;
    }

    if (!docFile) {
      setError('Please select or drop an academic document file to upload.');
      return;
    }
    if (!title.trim() || !shortDescription.trim() || !categoryId) {
      setError('Please provide a title, summary, and academic discipline.');
      return;
    }
    if (!copyrightDeclaration && !isDraft) {
      setError('You must confirm ownership or distribution rights for this material.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setError('');

    const formData = new FormData();
    formData.append('document', docFile);
    if (coverFile) {
      formData.append('cover', coverFile);
    }
    formData.append('title', title.trim());
    formData.append('shortDescription', shortDescription.trim());
    formData.append('fullDescription', fullDescription.trim() || shortDescription.trim());
    formData.append('categoryId', categoryId);
    if (institutionId) formData.append('institutionId', institutionId);
    if (courseOrSubject) formData.append('courseOrSubject', courseOrSubject.trim());
    formData.append('academicLevel', academicLevel);
    if (contributorNames) formData.append('contributorNames', contributorNames.trim());
    formData.append('publicationYear', publicationYear);
    formData.append('downloadPermission', downloadPermission);
    formData.append('licenseType', licenseType);
    formData.append('copyrightDeclaration', copyrightDeclaration ? 'true' : 'false');
    formData.append('isDraft', isDraft ? 'true' : 'false');

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 250);

      const res = await api.uploadWork(formData, token);
      clearInterval(interval);
      setUploadProgress(100);

      setUploadedWork(res.work);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Academic upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-white">Join ScholarHub to Publish Research</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          Create an author profile in seconds using your university or Google account to upload papers, dissertations, and study guides.
        </p>
        <button
          onClick={() => signInWithGoogle()}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-95"
        >
          Sign In to Upload Work
        </button>
      </div>
    );
  }

  // Post-upload Success State
  if (uploadedWork) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-white">Academic Submission Complete!</h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {successMessage || 'Your publication has been recorded in the ScholarHub repository.'}
        </p>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-left max-w-md mx-auto space-y-2 text-xs">
          <p className="text-slate-400">Title: <span className="text-white font-semibold">{uploadedWork.title}</span></p>
          <p className="text-slate-400">Status: <span className="text-amber-400 font-semibold capitalize">{uploadedWork.status}</span></p>
          <p className="text-slate-400">License: <span className="text-slate-200">{uploadedWork.licenseType}</span></p>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onSuccess(uploadedWork)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
          >
            View Work Details
          </button>
          <button
            onClick={() => {
              setUploadedWork(null);
              setDocFile(null);
              setTitle('');
              setShortDescription('');
            }}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
          >
            Upload Another Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Publish Scholarly Material
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
          Academic Upload Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Share research papers, dissertations, project reports, and lecture slides with verified attribution.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">
        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-2">
            Academic Document File (Required)
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-amber-400 bg-amber-500/5'
                : docFile
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              id="doc-upload"
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.zip"
              className="hidden"
            />
            <label htmlFor="doc-upload" className="cursor-pointer space-y-3 block">
              {docFile ? (
                <div className="space-y-2">
                  <FileCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">{docFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(docFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-12 h-12 text-amber-400 mx-auto" />
                  <p className="text-sm font-semibold text-slate-200">
                    Drag and drop your academic document, or <span className="text-amber-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Supported formats: PDF, DOCX, DOC, PPTX, PPT, XLSX, ZIP (Max 50MB)
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Primary Metadata */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Academic Work Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Learning Architectures for Asynchronous Distributed Networks"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Short Summary / Abstract Preview *
            </label>
            <textarea
              rows={2}
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A concise 2-3 sentence summary displayed in search cards and directory listings..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Abstract & Research Methodology
            </label>
            <textarea
              rows={5}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed background, research questions, experimental setup, proofs, and conclusions..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Categorization & Institutional Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Academic Discipline *
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Select Primary Discipline</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Degree / Academic Level
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="Undergraduate">Undergraduate Coursework / Thesis</option>
              <option value="Postgraduate">Postgraduate (Master's Dissertation)</option>
              <option value="Doctorate">Doctorate (Ph.D. Research)</option>
              <option value="Faculty/Research">Faculty / Peer-Reviewed Preprint</option>
              <option value="High School">Secondary / Preparatory Education</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Course, Subject, or Seminar
            </label>
            <input
              type="text"
              value={courseOrSubject}
              onChange={(e) => setCourseOrSubject(e.target.value)}
              placeholder="e.g., CS-640 Advanced Operating Systems"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              University / Research Institution
            </label>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">Independent / Unaffiliated</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Co-Authors & Contributors
            </label>
            <input
              type="text"
              value={contributorNames}
              onChange={(e) => setContributorNames(e.target.value)}
              placeholder="e.g., Dr. Jane Smith, John Doe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Year of Publication / Submission
            </label>
            <input
              type="number"
              min={1950}
              max={2030}
              value={publicationYear}
              onChange={(e) => setPublicationYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Permissions & Licensing */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Licensing & Download Permissions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Download Access Setting
              </label>
              <select
                value={downloadPermission}
                onChange={(e) => setDownloadPermission(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="public">Public: Anyone can download immediately</option>
                <option value="registered_only">Registered Users Only: Requires account</option>
                <option value="restricted">Restricted: Read abstract only (contact author)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Creative Commons License
              </label>
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="CC-BY-4.0">CC BY 4.0 (Attribution, open reuse)</option>
                <option value="CC-BY-SA-4.0">CC BY-SA 4.0 (ShareAlike)</option>
                <option value="CC-BY-NC-4.0">CC BY-NC 4.0 (NonCommercial)</option>
                <option value="All Rights Reserved">All Rights Reserved (Author retains full copyright)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic Integrity Pledge & Declaration */}
        <div className="pt-4 border-t border-slate-800">
          <label className="flex items-start space-x-3 cursor-pointer p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              required
              checked={copyrightDeclaration}
              onChange={(e) => setCopyrightDeclaration(e.target.checked)}
              className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
            />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Academic Integrity & Copyright Declaration:</span> I confirm that I am the author of this work or possess explicit permission to distribute it. This upload does not infringe third-party copyrights, violate academic honor codes, or distribute confidential institutional data.
            </div>
          </label>
        </div>

        {/* Progress Bar when uploading */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading academic file and metadata...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-teal-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={uploading}
            onClick={() => handleSubmit(true)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => handleSubmit(false)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              <FileUp className="w-4 h-4" />
              <span>{uploading ? 'Publishing...' : 'Submit Academic Work'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
