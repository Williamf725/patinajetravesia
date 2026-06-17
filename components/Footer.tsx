'use client';

export default function Footer() {
  return (
    <footer className="bg-[#131313] border-t-4 border-white py-12 px-6 mt-20 relative overflow-hidden">
      {/* Decorative grain texture */}
      <div className="absolute inset-0 bg-grain pointer-events-none opacity-10" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div className="flex flex-col items-center md:items-start">
          <h3 className="font-anton text-3xl text-white tracking-tighter mb-2">
            TRAVESÍA<span className="text-neon-green">.</span>
          </h3>
          <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.4em]">
            EL ARTE DE RODAR © 2024
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4">
          <div className="flex flex-col items-center md:items-end">
            <span className="font-mono text-[10px] text-neon-green uppercase tracking-widest mb-1">Contacto</span>
            <a
              href="mailto:clubdepatinajetravesia@gmail.com"
              className="font-space text-white hover:text-neon-green transition-colors"
            >
              clubdepatinajetravesia@gmail.com
            </a>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <span className="font-mono text-[10px] text-hot-pink uppercase tracking-widest mb-1">Social</span>
            <a
              href="https://www.tiktok.com/@patinajetravesia"
              target="_blank"
              rel="noopener noreferrer"
              className="font-space text-white hover:text-hot-pink transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.36-.54.38-.89.98-1.02 1.63-.14.62-.07 1.3.2 1.86.3.62.84 1.13 1.49 1.38.65.26 1.4.25 2.02-.04.7-.35 1.18-1.05 1.3-1.82.01-4.47-.02-8.94.01-13.41z"/>
              </svg>
              @patinajetravesia
            </a>
          </div>
        </div>
      </div>

      {/* Brutal Detail Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-hot-pink to-neon-green opacity-30" />
    </footer>
  );
}
