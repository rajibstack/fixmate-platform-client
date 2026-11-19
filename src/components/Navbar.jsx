"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Wrench, User, LogOut } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null); 

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-sky-400 group">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition shadow-inner">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-white">Fix<span className="text-sky-400">Mate</span></span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-sky-400 transition font-medium">Home</Link>
            <Link href="/services" className="hover:text-sky-400 transition font-medium">Services</Link>
            <Link href="/about" className="hover:text-sky-400 transition font-medium">About Us</Link>
            <Link href="/contact" className="hover:text-sky-400 transition font-medium">Contact</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 hover:border-sky-400 transition text-sm">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={() => setUser(null)}
                  className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3.5 py-2 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition text-sm font-medium"
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
                <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition shadow-lg shadow-sky-500/20">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

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

      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3">
          <Link href="/" className="block py-2 hover:text-sky-400 transition">Home</Link>
          <Link href="/services" className="block py-2 hover:text-sky-400 transition">Services</Link>
          <Link href="/about" className="block py-2 hover:text-sky-400 transition">About Us</Link>
          <Link href="/contact" className="block py-2 hover:text-sky-400 transition">Contact</Link>
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link href="/login" className="w-full text-center py-2.5 bg-slate-800 rounded-xl hover:bg-slate-700 transition">Login</Link>
            <Link href="/signup" className="w-full text-center py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
  );
}