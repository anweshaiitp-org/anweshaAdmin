'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUserFullProfile,
  getAdminDocumentUploadUrl,
  uploadFileToStorage,
  submitManualUserDocuments
} from '@/lib/userService';
import toast, { Toaster } from 'react-hot-toast';
import {
  FiArrowLeft,
  FiUploadCloud,
  FiCheckCircle,
  FiFileText,
  FiImage,
  FiCreditCard,
  FiBookOpen,
  FiAlertCircle,
  FiShield,
  FiUser,
  FiCheck,
  FiX
} from 'react-icons/fi';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export default function ManualDocumentUploadPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();
  const { isDarkMode, user, isLoading: authLoading } = useAuth();

  const [loadingUser, setLoadingUser] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // College ID form state
  const [collegeIdNumber, setCollegeIdNumber] = useState('');
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [collegeIdPreview, setCollegeIdPreview] = useState<string | null>(null);
  const [dragCollege, setDragCollege] = useState(false);

  // Aadhar ID form state
  const [aadharIdNumber, setAadharIdNumber] = useState('');
  const [aadharIdFile, setAadharIdFile] = useState<File | null>(null);
  const [dragAadhar, setDragAadhar] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState('');
  const [formError, setFormError] = useState('');
  const [successVerified, setSuccessVerified] = useState(false);

  // Check authorization
  const canVerifyIds = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(user?.role || '');

  useEffect(() => {
    if (!authLoading && user && !canVerifyIds) {
      router.replace('/unauthorised');
    }
  }, [user, authLoading, canVerifyIds, router]);

  // Load user data
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    async function load() {
      try {
        setLoadingUser(true);
        const res = await fetchUserFullProfile(userId);
        if (mounted && res.success && res.data?.profile) {
          const prof = res.data.profile;
          setUserProfile(prof);
          if (prof.college_id_number) {
            setCollegeIdNumber(prof.college_id_number);
          } else if (prof.id_card_type !== 'AADHAR' && prof.id_card_number) {
            setCollegeIdNumber(prof.id_card_number);
          }
          if (prof.aadhar_id_number) {
            setAadharIdNumber(prof.aadhar_id_number);
          } else if (prof.id_card_type === 'AADHAR' && prof.id_card_number) {
            setAadharIdNumber(prof.id_card_number);
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load user details');
      } finally {
        if (mounted) setLoadingUser(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // College image preview
  useEffect(() => {
    if (!collegeIdFile) {
      setCollegeIdPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(collegeIdFile);
    setCollegeIdPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [collegeIdFile]);

  // Validations
  const validateCollegeFile = (file: File | null): string | null => {
    if (!file) return 'Please select a College ID image.';
    const isImage =
      ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type?.toLowerCase()) ||
      /\.(png|jpe?g)$/i.test(file.name || '');
    if (!isImage) {
      return 'Invalid file type for College ID. Only image files (PNG, JPG, JPEG) are accepted.';
    }
    if (file.size > MAX_FILE_BYTES) {
      return 'College ID file exceeds 5MB maximum allowed size.';
    }
    return null;
  };

  const validateAadharFile = (file: File | null): string | null => {
    if (!file) return 'Please select an Aadhar Card PDF.';
    const isPdf =
      file.type === 'application/pdf' ||
      /\.pdf$/i.test(file.name || '');
    if (!isPdf) {
      return 'Invalid file type for Aadhar Card. Only PDF files are accepted.';
    }
    if (file.size > MAX_FILE_BYTES) {
      return 'Aadhar Card file exceeds 5MB maximum allowed size.';
    }
    return null;
  };

  const handleCollegeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormError('');
    if (!file) {
      setCollegeIdFile(null);
      return;
    }
    const err = validateCollegeFile(file);
    if (err) {
      toast.error(err);
      setFormError(err);
      return;
    }
    setCollegeIdFile(file);
  };

  const handleAadharFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormError('');
    if (!file) {
      setAadharIdFile(null);
      return;
    }
    const err = validateAadharFile(file);
    if (err) {
      toast.error(err);
      setFormError(err);
      return;
    }
    setAadharIdFile(file);
  };

  const handleCollegeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCollege(false);
    setFormError('');
    const file = e.dataTransfer.files?.[0] || null;
    if (!file) return;
    const err = validateCollegeFile(file);
    if (err) {
      toast.error(err);
      setFormError(err);
      return;
    }
    setCollegeIdFile(file);
  };

  const handleAadharDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragAadhar(false);
    setFormError('');
    const file = e.dataTransfer.files?.[0] || null;
    if (!file) return;
    const err = validateAadharFile(file);
    if (err) {
      toast.error(err);
      setFormError(err);
      return;
    }
    setAadharIdFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    const cleanCollegeNum = collegeIdNumber.trim();
    if (!cleanCollegeNum) {
      const err = 'Please enter the College / Student Roll Number.';
      setFormError(err);
      toast.error(err);
      return;
    }

    const collegeFileErr = validateCollegeFile(collegeIdFile);
    if (collegeFileErr) {
      setFormError(collegeFileErr);
      toast.error(collegeFileErr);
      return;
    }

    const cleanAadharNum = aadharIdNumber.replace(/[\s-]/g, '');
    if (!cleanAadharNum) {
      const err = 'Please enter the 12-digit Aadhar Card Number.';
      setFormError(err);
      toast.error(err);
      return;
    }
    if (!/^\d{12}$/.test(cleanAadharNum)) {
      const err = 'Aadhar Number must be exactly 12 numeric digits.';
      setFormError(err);
      toast.error(err);
      return;
    }

    const aadharFileErr = validateAadharFile(aadharIdFile);
    if (aadharFileErr) {
      setFormError(aadharFileErr);
      toast.error(aadharFileErr);
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Uploading documents & verifying in database...');

    try {
      // Step 1: Upload College ID
      setSubmittingStep('Step 1/3: Requesting upload URL & uploading College ID image...');
      const collegeContentType =
        collegeIdFile!.type ||
        (/\.png$/i.test(collegeIdFile!.name) ? 'image/png' : 'image/jpeg');

      const collegeUploadInfo = await getAdminDocumentUploadUrl(
        userId,
        'college_id',
        collegeContentType,
        collegeIdFile!.name
      );

      await uploadFileToStorage(collegeUploadInfo.uploadUrl, collegeIdFile!);

      // Step 2: Upload Aadhar ID
      setSubmittingStep('Step 2/3: Requesting upload URL & uploading Aadhar Card PDF...');
      const aadharUploadInfo = await getAdminDocumentUploadUrl(
        userId,
        'aadhar_id',
        'application/pdf',
        aadharIdFile!.name
      );

      await uploadFileToStorage(aadharUploadInfo.uploadUrl, aadharIdFile!);

      // Step 3: Record and mark verified in DB (no email dispatched)
      setSubmittingStep('Step 3/3: Updating database record to VERIFIED (no email sent)...');
      await submitManualUserDocuments(userId, {
        college_id_number: cleanCollegeNum,
        college_id_file_key: collegeUploadInfo.fileKey,
        aadhar_id_number: cleanAadharNum,
        aadhar_id_file_key: aadharUploadInfo.fileKey
      });

      toast.success('Documents uploaded and verified successfully in DB! (No email sent)', {
        id: toastId,
        duration: 5000
      });
      setSuccessVerified(true);
    } catch (err: any) {
      const msg = err.message || 'Failed to upload and verify documents';
      setFormError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
      setSubmittingStep('');
    }
  };

  const isDark = isDarkMode;
  const userName = userProfile?.full_name || userProfile?.name || 'User';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-8 pb-16">
      <Toaster position="top-right" />

      {/* Back button and page title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/users/${encodeURIComponent(userId)}`}
            className={`p-2.5 rounded-xl border transition-colors ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Direct Verification
              </span>
              <span className="text-xs text-slate-400 font-mono">No Email</span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Manual Document Upload
            </h1>
          </div>
        </div>

        <Link
          href={`/admin/users/${encodeURIComponent(userId)}`}
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
            isDark
              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Back to User Details
        </Link>
      </div>

      {/* User Info Bar */}
      <div className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
            isDark ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            <FiUser size={22} />
          </div>
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {loadingUser ? 'Loading attendee...' : userName}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>System ID: <strong className="font-mono text-slate-300">{userId}</strong></span>
              {userProfile?.anwesha_id && (
                <span>• Fest ID: <strong className="font-mono text-amber-400">{userProfile.anwesha_id}</strong></span>
              )}
            </div>
          </div>
        </div>

        {userProfile && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-slate-400">Current Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              userProfile.id_card_status === 'VERIFIED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : userProfile.id_card_status === 'UPLOADED'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {userProfile.id_card_status || 'NOT_UPLOADED'}
            </span>
          </div>
        )}
      </div>

      {/* Direct Verification Policy Banner */}
      <div className={`p-4 md:p-5 rounded-2xl border flex items-start gap-3.5 ${
        isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <FiShield size={22} className="shrink-0 mt-0.5 text-amber-500" />
        <div className="text-xs md:text-sm leading-relaxed space-y-1">
          <p className="font-bold">Direct Admin Upload Policy (No Verification Email)</p>
          <p className="opacity-90">
            Uploading files on this page stores the documents in S3 and instantly marks the attendee as{' '}
            <span className="font-bold underline">VERIFIED</span> in the database. No confirmation, verification request, or document-uploaded emails will be queued or sent.
          </p>
        </div>
      </div>

      {/* Success State */}
      {successVerified ? (
        <div className={`p-8 md:p-10 rounded-3xl border text-center space-y-6 ${
          isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <FiCheckCircle size={36} />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Documents Uploaded & Verified!
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Both College ID and Aadhar Card have been securely saved and {userName}&apos;s identity status is now{' '}
              <span className="font-bold text-emerald-400">VERIFIED</span> in the database.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href={`/admin/users/${encodeURIComponent(userId)}`}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 text-center"
            >
              Return to User Details
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessVerified(false);
                setCollegeIdFile(null);
                setAadharIdFile(null);
              }}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm border transition-colors ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Upload Different Documents
            </button>
            <Link
              href="/admin/users"
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm border transition-colors ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Users
            </Link>
          </div>
        </div>
      ) : (
        /* Upload Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs md:text-sm font-semibold ${
              isDark ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <FiAlertCircle size={18} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DOCUMENT 1: COLLEGE ID */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
              isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className={`p-2.5 rounded-xl ${
                    isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <FiBookOpen size={20} />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      1. College ID Card
                    </h3>
                    <p className="text-[11px] text-slate-400">Student Identity Verification</p>
                  </div>
                </div>

                {/* Roll / Student ID Number */}
                <div className="mt-4 space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    College Roll / ID Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={collegeIdNumber}
                    onChange={(e) => setCollegeIdNumber(e.target.value)}
                    placeholder="e.g. 2201CS01 or STU-9842"
                    disabled={submitting}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>

                {/* File Dropzone */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      College ID Image <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">PNG, JPG, JPEG (Max 5MB)</span>
                  </div>

                  <div
                    onDragEnter={(e) => { e.preventDefault(); setDragCollege(true); }}
                    onDragOver={(e) => { e.preventDefault(); setDragCollege(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragCollege(false); }}
                    onDrop={handleCollegeDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                      dragCollege
                        ? 'border-blue-500 bg-blue-500/10'
                        : collegeIdFile
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : isDark
                        ? 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleCollegeFileChange}
                      disabled={submitting}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />

                    {collegeIdFile ? (
                      <div className="space-y-3">
                        {collegeIdPreview && (
                          <div className="relative w-full h-36 mx-auto rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={collegeIdPreview}
                              alt="College ID Preview"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-2">
                          <FiCheck className="text-emerald-400" size={16} />
                          <span className={`text-xs font-bold truncate max-w-[200px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {collegeIdFile.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({Math.round(collegeIdFile.size / 1024)} KB)
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-400 hover:underline">Click or drop to replace</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${
                          isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <FiImage size={24} />
                        </div>
                        <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          Drag & drop image here, or <span className="text-blue-500 underline">browse</span>
                        </p>
                        <p className="text-[11px] text-slate-400">Supports PNG, JPG, or JPEG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DOCUMENT 2: AADHAR CARD */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between space-y-5 ${
              isDark ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className={`p-2.5 rounded-xl ${
                    isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <FiCreditCard size={20} />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      2. Aadhar Card
                    </h3>
                    <p className="text-[11px] text-slate-400">National UIDAI Verification</p>
                  </div>
                </div>

                {/* 12-digit Aadhar Number */}
                <div className="mt-4 space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    12-Digit Aadhar Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={aadharIdNumber}
                    onChange={(e) => setAadharIdNumber(e.target.value)}
                    placeholder="e.g. 1234 5678 9012"
                    disabled={submitting}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all font-mono ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-700 text-white focus:border-amber-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-600'
                    }`}
                  />
                </div>

                {/* PDF File Dropzone */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Aadhar Card PDF <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">PDF Only (Max 5MB)</span>
                  </div>

                  <div
                    onDragEnter={(e) => { e.preventDefault(); setDragAadhar(true); }}
                    onDragOver={(e) => { e.preventDefault(); setDragAadhar(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragAadhar(false); }}
                    onDrop={handleAadharDrop}
                    className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                      dragAadhar
                        ? 'border-amber-500 bg-amber-500/10'
                        : aadharIdFile
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : isDark
                        ? 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="application/pdf, .pdf"
                      onChange={handleAadharFileChange}
                      disabled={submitting}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />

                    {aadharIdFile ? (
                      <div className="py-6 space-y-3">
                        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                          isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <FiFileText size={28} />
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <FiCheck className="text-emerald-400" size={16} />
                          <span className={`text-xs font-bold truncate max-w-[200px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {aadharIdFile.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({Math.round(aadharIdFile.size / 1024)} KB)
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-400 hover:underline">Click or drop to replace</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-2">
                        <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center ${
                          isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <FiFileText size={24} />
                        </div>
                        <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          Drag & drop PDF here, or <span className="text-amber-500 underline">browse</span>
                        </p>
                        <p className="text-[11px] text-slate-400">Only PDF documents up to 5MB are accepted</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submitting step banner */}
          {submitting && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-xs md:text-sm font-semibold">{submittingStep}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Link
              href={`/admin/users/${encodeURIComponent(userId)}`}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm border transition-colors text-center ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || !collegeIdFile || !aadharIdFile || !collegeIdNumber.trim() || !aadharIdNumber.trim()}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading & Verifying...
                </>
              ) : (
                <>
                  <FiUploadCloud size={18} />
                  Upload & Verify in DB (No Email)
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
