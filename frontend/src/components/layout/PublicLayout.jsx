import React from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#334155] selection:bg-[#2563EB] selection:text-white">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
