"use client";
import React from 'react';

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="container nav-container">
          <Link href="/" className="logo">
            PrintFlow<span className="dot">.</span>
          </Link>

          {/* Desktop Nav */}
          <ul className="nav-links hidden md:flex">
            <li><Link href="/#features">Features</Link></li>
            <li><Link href="/#rates">Pricing</Link></li>
            <li><Link href="/#upload">Upload</Link></li>
            <li><Link href="/login" style={{ color: "var(--primary)", fontWeight: "bold" }}>Login</Link></li>
          </ul>

          <div className="hidden md:block">
            <Link href="/#upload" className="btn btn-secondary">Upload Document</Link>
          </div>

          {/* Mobile Hamburger */}
          <button 
            className="md:hidden text-white text-3xl focus:outline-none z-50 relative"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#0a0a0f] z-40 flex flex-col items-center justify-center transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}>
        <ul className="flex flex-col gap-8 text-2xl text-center">
          <li><Link href="/#features" onClick={() => setMobileMenuOpen(false)}>Features</Link></li>
          <li><Link href="/#rates" onClick={() => setMobileMenuOpen(false)}>Rates</Link></li>
          <li><Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--primary)" }}>Login</Link></li>
          <li><Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link></li>
          <li><Link href="/#upload" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary mt-4">Upload Now</Link></li>
        </ul>
      </div>
    </>
  );
}
