"use client";
import React from 'react';

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Signup failed");
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center p-4 pt-24" style={{ background: "radial-gradient(circle at top right, rgba(99,102,241,0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(236,72,153,0.1), transparent 40%)" }}>
        <div className="glass-panel w-full max-w-md p-8 hidden-animate show">
          <h2 className="text-3xl font-bold mb-2 text-center font-['Outfit']">Create Account</h2>
          <p className="text-[#94a3b8] text-center mb-8">Start managing your print infrastructure</p>
          
          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm border border-red-500/50">{error}</div>}

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Full Name</label>
              <input name="fullName" type="text" placeholder="Sarah Jenkins" className="p-3 rounded-lg border border-white/20 bg-black/30 text-white outline-none focus:border-[#6366f1] transition-all" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Email Address</label>
              <input name="email" type="email" placeholder="sarah@buildco.com" className="p-3 rounded-lg border border-white/20 bg-black/30 text-white outline-none focus:border-[#6366f1] transition-all" required />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Password</label>
              <input name="password" type="password" placeholder="••••••••" className="p-3 rounded-lg border border-white/20 bg-black/30 text-white outline-none focus:border-[#6366f1] transition-all" required minLength={6} />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary text-center mt-2 w-full">
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-[#94a3b8] mt-6">
            Already have an account? <Link href="/login" className="text-[#6366f1] hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
