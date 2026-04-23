"use client";
import React from 'react';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PrintJob = {
  id: string;
  filename: string;
  filesize: number;
  status: string;
  createdAt: string;
};

let toastCounter = 0;

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tab-overview");
  const [toasts, setToasts] = useState<{id: number, message: string, type?: string}[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFilename, setUploadFilename] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (message: string, type = "info") => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs');
      if (res.status === 401) {
        triggerToast("Session expired. Please log in again.", "error");
        return;
      }
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) {
      triggerToast("Could not load print jobs.", "error");
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    setTimeout(() => triggerToast("Welcome back! Your dashboard is up to date."), 800);
    fetchJobs();
  }, []);

  const handleDashboardUpload = async (file: File) => {
    setUploadFilename(file.name);
    setUploadStatus("processing");
    setUploadProgress(0);

    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 20 + 5;
      if (prog >= 90) prog = 90;
      setUploadProgress(Math.floor(prog));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!res.ok) throw new Error("Upload failed");

      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(async () => {
        setUploadStatus("idle");
        triggerToast(`✅ "${file.name}" added to your Print Queue!`, "success");
        await fetchJobs(); // Refresh jobs table
        setActiveTab("tab-overview");
      }, 600);

    } catch (err) {
      clearInterval(interval);
      setUploadStatus("idle");
      triggerToast("Upload failed. Please try again.", "error");
    }
  };

  const handleDeleteJob = async (jobId: string, filename: string) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        triggerToast(`🗑️ "${filename}" removed from queue.`);
      }
    } catch {
      triggerToast("Could not delete job.", "error");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#6366f1]/20 text-[#818cf8] border-[#6366f1]/50';
      case 'printing': return 'bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]/50';
      case 'completed': return 'bg-[#10b981]/20 text-[#34d399] border-[#10b981]/50';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="dashboard-body flex min-h-screen relative text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={{ background: "radial-gradient(circle at top right, rgba(99,102,241,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(236,72,153,0.1), transparent 40%)" }}></div>

      {/* Sidebar */}
      <aside className="w-[280px] hidden lg:flex flex-col border-r border-white/10 bg-black/40 p-6">
        <div className="mb-12 pl-2">
          <Link href="/" className="text-2xl font-bold font-['Outfit']">PrintFlow<span className="text-[#6366f1]">.</span></Link>
        </div>
        <ul className="flex-1 space-y-2">
          {[{ id: "tab-overview", icon: "📊", label: "Overview" },
            { id: "tab-queue", icon: "🖨️", label: "Print Queue" },
            { id: "tab-deliveries", icon: "📦", label: "Deliveries" },
            { id: "tab-billing", icon: "💳", label: "Billing & Invoices" },
            { id: "tab-settings", icon: "⚙️", label: "Settings" }].map(tab => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeTab === tab.id ? 'bg-[#6366f1]/20 text-white font-medium' : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="glass-panel p-5 mt-auto text-sm">
          <h4 className="font-semibold mb-1">Pro Print Plan</h4>
          <p className="text-[#94a3b8] mb-3">{jobs.length} jobs uploaded</p>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-[#6366f1] to-[#ec4899]" style={{ width: `${Math.min(jobs.length * 5, 100)}%` }}></div>
          </div>
          <button onClick={() => triggerToast("Redirecting to billing portal...")} className="w-full py-2 bg-gradient-to-r from-[#6366f1] to-[#ec4899] rounded-lg font-medium shadow-lg hover:opacity-90 transition-all">Upgrade Quota</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-full lg:max-w-[calc(100vw-280px)] overflow-y-auto">
        {/* Topbar */}
        <header className="glass-panel flex justify-between items-center px-6 py-4 mb-8">
          <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full w-72">
            <span>🔍</span>
            <input type="text" placeholder="Search jobs..." className="bg-transparent border-none outline-none w-full text-sm" />
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <button onClick={() => triggerToast("You have no new notifications")} className="relative">
              🔔<span className="absolute top-0 right-0 w-2 h-2 bg-[#ec4899] rounded-full"></span>
            </button>
            <button onClick={() => setActiveTab("tab-queue")} className="btn btn-primary text-sm px-4 py-2">+ New Upload</button>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === "tab-overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-panel p-6">
                <h3 className="text-[#94a3b8] font-medium mb-2">Total Print Jobs</h3>
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#ec4899]">{loadingJobs ? "..." : jobs.length}</div>
                <p className="text-sm mt-2 text-[#94a3b8]">In your account</p>
              </div>
              <div className="glass-panel p-6">
                <h3 className="text-[#94a3b8] font-medium mb-2">Pending Jobs</h3>
                <div className="text-4xl font-bold">{loadingJobs ? "..." : jobs.filter(j => j.status === 'pending').length}</div>
                <p className="text-sm mt-2 text-[#94a3b8]">Awaiting processing</p>
              </div>
              <div className="glass-panel p-6">
                <h3 className="text-[#94a3b8] font-medium mb-2">Total Data</h3>
                <div className="text-4xl font-bold">{loadingJobs ? "..." : jobs.reduce((acc, j) => acc + j.filesize, 0).toFixed(1)} MB</div>
                <p className="text-sm mt-2 text-[#94a3b8]">Stored securely</p>
              </div>
            </div>

            <div className="glass-panel p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-['Outfit']">Your Print Jobs</h2>
                <button onClick={() => setActiveTab("tab-queue")} className="btn btn-primary text-sm px-4 py-2">+ Upload New</button>
              </div>

              {loadingJobs ? (
                <div className="flex items-center justify-center py-16 text-[#94a3b8]">
                  <div className="spinner mr-4"></div> Loading your jobs...
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">📭</div>
                  <h3 className="text-lg font-semibold mb-2">No Print Jobs Yet</h3>
                  <p className="text-[#94a3b8] mb-6">Upload your first document to get started!</p>
                  <button onClick={() => setActiveTab("tab-queue")} className="btn btn-primary">Upload Document</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[#94a3b8] uppercase text-xs tracking-wider border-b border-white/10">
                        <th className="pb-4 pr-4">Filename</th>
                        <th className="pb-4 pr-4">Size</th>
                        <th className="pb-4 pr-4">Status</th>
                        <th className="pb-4 pr-4">Uploaded</th>
                        <th className="pb-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(job => (
                        <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 pr-4 font-semibold max-w-[240px] truncate">{job.filename}</td>
                          <td className="py-4 pr-4 text-[#94a3b8]">{job.filesize.toFixed(2)} MB</td>
                          <td className="py-4 pr-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor(job.status)}`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-[#94a3b8]">{formatDate(job.createdAt)}</td>
                          <td className="py-4">
                            <button
                              onClick={() => handleDeleteJob(job.id, job.filename)}
                              className="text-[#94a3b8] hover:text-red-400 transition-colors text-lg"
                              title="Delete job"
                            >🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* PRINT QUEUE / UPLOAD TAB */}
        {activeTab === "tab-queue" && (
          <div className="glass-panel p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold font-['Outfit'] mb-2">Upload Document</h2>
            <p className="text-[#94a3b8] mb-8">Drop a file below to add it to your print queue. It will be linked to your account.</p>

            {uploadStatus === "idle" && (
              <div
                className="border-2 border-dashed border-[#6366f1]/50 rounded-2xl p-16 text-center cursor-pointer hover:border-[#ec4899]/70 hover:bg-[#6366f1]/5 transition-all"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#ec4899'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleDashboardUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-5xl mb-4 animate-bounce">📂</div>
                <h3 className="text-xl font-semibold mb-2">Drag & Drop your file here</h3>
                <p className="text-[#94a3b8] text-sm mb-6">Supports PDF, DOCX, PNG, JPG, CAD files</p>
                <button className="btn btn-secondary">Browse Files</button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.cad"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDashboardUpload(file);
                  }}
                />
              </div>
            )}

            {uploadStatus === "processing" && (
              <div className="text-center py-12">
                <div className="spinner mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold mb-2">Uploading "{uploadFilename}"</h3>
                <p className="text-[#94a3b8] mb-6">{uploadProgress}% complete — saving to your account...</p>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%`, background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === "tab-deliveries" && (
          <div className="glass-panel min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">No Active Deliveries</h2>
            <p className="text-[#94a3b8] max-w-md">Track your shipped orders here. Tracking links are generated once a package leaves our facility.</p>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === "tab-billing" && (
          <div className="glass-panel min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">💳</div>
            <h2 className="text-2xl font-bold mb-2">Billing & Invoices</h2>
            <p className="text-[#94a3b8] max-w-md mb-6">View your monthly statements and manage payment methods.</p>
            <button onClick={() => triggerToast("Authenticating via SSO...")} className="btn btn-secondary">Verify Identity</button>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "tab-settings" && (
          <div className="glass-panel p-8 max-w-3xl">
            <h2 className="text-2xl font-bold font-['Outfit'] mb-6">Account Settings</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#94a3b8]">Company Name</label>
                    <input type="text" defaultValue="My Company" className="p-3 rounded-lg border border-white/20 bg-black/30 text-white outline-none focus:border-[#6366f1]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#94a3b8]">Contact Email</label>
                    <input type="email" defaultValue="user@example.com" className="p-3 rounded-lg border border-white/20 bg-black/30 text-white outline-none focus:border-[#6366f1]" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Printing Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#94a3b8]">Default Paper Size</label>
                    <select className="p-3 rounded-lg border border-white/20 bg-black/30 text-white outline-none focus:border-[#6366f1]">
                      <option>A4 Standard</option><option>US Letter</option><option>A3 Poster</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#94a3b8]">Default Quality</label>
                    <select className="p-3 rounded-lg border border-white/20 bg-black/30 text-white outline-none focus:border-[#6366f1]">
                      <option>High Definition Color</option><option>Draft B&W</option><option>Premium Glossy</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={() => triggerToast("✅ Settings saved successfully!")} className="btn btn-primary px-8">Save Changes</button>
                <button onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/login');
                }} className="btn btn-secondary px-8">Logout</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`shadow-2xl p-4 px-6 rounded-lg text-white font-medium text-sm border-l-4 ${
              toast.type === 'error' ? 'bg-red-900/90 border-red-500' :
              toast.type === 'success' ? 'bg-green-900/90 border-green-500' :
              'bg-[#14141e] border-[#6366f1]'
            } animate-in slide-in-from-right fade-in duration-300`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
