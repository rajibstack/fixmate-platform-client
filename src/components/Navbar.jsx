"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Wrench, User, LogOut } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  // টেম্পোরারি স্টেট - পরবর্তীতে জেসন ওয়েব টোকেন (JWT) বা সেশন দিয়ে প্রতিস্থাপন করা হবে
  const [user, setUser] = useState(null); 

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-sky-400">
              <Wrench className="w-6 h-6" />
              <span>FixMate</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-sky-400 transition">Home</Link>
            <Link href="/services" className="hover:text-sky-400 transition">Services</Link>
            <Link href="/about" className="hover:text-sky-400 transition">About Us</Link>
            <Link href="/contact" className="hover:text-sky-400 transition">Contact</Link>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-sky-400 transition">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={() => setUser(null)}
                  className="flex items-center gap-1 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-sky-400 transition">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition shadow-lg shadow-sky-500/20">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3">
          <Link href="/" className="block py-2 hover:text-sky-400 transition">Home</Link>
          <Link href="/services" className="block py-2 hover:text-sky-400 transition">Services</Link>
          <Link href="/about" className="block py-2 hover:text-sky-400 transition">About Us</Link>
          <Link href="/contact" className="block py-2 hover:text-sky-400 transition">Contact</Link>
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link href="/login" className="w-full text-center py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">Login</Link>
            <Link href="/register" className="w-full text-center py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition">Register</Link>
          </div>
        </div>
      )}
    </nav>
  );
}