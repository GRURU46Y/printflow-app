"use client";
import React from 'react';

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ThreeBackground from "@/components/ThreeBackground";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  // Upload State
  const [uploadStatus, setUploadStatus] = useState<"idle" | "processing" | "success">("idle");
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("");
  const [filesize, setFilesize] = useState("");

  // Animations observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.hidden-animate');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Upload Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setFilename(file.name);
    setFilesize((file.size / (1024 * 1024)).toFixed(2));
    setUploadStatus("processing");
    setProgress(0);

    // Simulate progress bar visually
    let currentProgress = 0;
    const interval = setInterval(() => {
        currentProgress += Math.random() * 15 + 5;
        if (currentProgress >= 90) currentProgress = 90; // Wait at 90% for server response
        setProgress(Math.floor(currentProgress));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      setProgress(100);
      clearInterval(interval);
      setTimeout(() => setUploadStatus("success"), 500);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      alert("Error uploading file. Please try again.");
      setUploadStatus("idle");
    }
  };

  return (
    <>
      <ThreeBackground />
      <Navbar />

      <header className="hero">
        <div className="container hero-content">
          <div className="badge">🖨️ Industry 4.0 Printing</div>
          <h1 className="hero-title">
            Automate your workflow with <br />
            <span className="text-gradient">Next-Gen Print Management</span>
          </h1>
          <p className="hero-subtitle">
            The ultimate platform for modern teams to upload, format, securely manage, and print documents instantly from the cloud. Precision engineering meets breathtaking speed.
          </p>
          <div className="hero-cta">
            <a href="#upload" className="btn btn-primary">Start Printing Now</a>
            <a href="#demo" className="btn btn-outline">How it Works</a>
          </div>
        </div>
      </header>

      {/* Upload Section */}
      <section id="upload" className="upload-section section">
        <div className="container">
          <div className="section-header hidden-animate">
            <h2 className="section-title">Drag, Drop, <span className="text-gradient">Print.</span></h2>
            <p className="section-desc">Instantly upload your PDFs or CAD files to our secure cloud.</p>
          </div>
          
          <div className="upload-container glass-panel hidden-animate">
            {uploadStatus === "idle" && (
              <div 
                className="upload-dropzone" 
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="upload-icon">📄</div>
                <h3>Drag & Drop your files here</h3>
                <p className="upload-subtext">or click to browse from your computer (PDF, DOCX, PNG)</p>
                <input type="file" id="file-input" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg" onChange={handleFileChange} />
                <button className="btn btn-secondary mt-4">Browse Files</button>
              </div>
            )}
            
            {uploadStatus === "processing" && (
              <div className="upload-processing">
                <div className="spinner"></div>
                <h3>Analyzing Document...</h3>
                <p>Checking formatting and dimensions ({progress}%)</p>
                <div className="upload-progress-bar mt-4">
                  <div className="upload-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
            
            {uploadStatus === "success" && (
              <div className="upload-success">
                <div className="success-icon">✅</div>
                <h3>Ready for Printing</h3>
                <p>{filename} ({filesize} MB)</p>
                <button className="btn btn-primary mt-4" onClick={() => router.push('/dashboard')}>Proceed to Checkout</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features section">
        <div className="container">
          <div className="section-header hidden-animate">
            <h2 className="section-title">Professional Quality. <br /> Absolute Control.</h2>
            <p className="section-desc">Everything you need to manage your bulk prints and professional documents.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card glass-panel hidden-animate"><div className="feature-icon">☁️</div><h3>Cloud Uploads</h3><p>Instantly upload PDFs, CAD files, and documents remotely from any device.</p></div>
            <div className="feature-card glass-panel hidden-animate" style={{ transitionDelay: "0.1s" }}><div className="feature-icon">📏</div><h3>Smart Formatting</h3><p>AI-driven dimension checks and bleed formatting before you even hit print.</p></div>
            <div className="feature-card glass-panel hidden-animate" style={{ transitionDelay: "0.2s" }}><div className="feature-icon">🚀</div><h3>High-Speed Output</h3><p>Industrial-grade printing speeds combined with rapid overnight delivery routes.</p></div>
          </div>
        </div>
      </section>

      {/* Rates Section */}
      <section id="rates" className="rates-section section">
        <div className="container">
          <div className="section-header hidden-animate">
            <h2 className="section-title">Transparent <span className="text-gradient">Pricing.</span></h2>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card glass-panel hidden-animate">
              <div className="pricing-header"><h3>Standard Print</h3><div className="price">$0.10<span>/page</span></div></div>
              <a href="#upload" className="btn btn-outline full-width">Select Standard</a>
            </div>
            <div className="pricing-card glass-panel popular hidden-animate" style={{ transitionDelay: "0.1s" }}>
              <div className="popular-badge">Most Popular</div>
              <div className="pricing-header"><h3>Priority Color</h3><div className="price">$0.45<span>/page</span></div></div>
              <a href="#upload" className="btn btn-primary full-width">Select Priority</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
