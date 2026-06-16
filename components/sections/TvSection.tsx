'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Galeria } from '@/types/database';

export default function TvSection() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVolume, setShowVolume] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [images, setImages] = useState<Galeria[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const supabase = createClient();

  // Fetch real content from Supabase
  useEffect(() => {
    const fetchContent = async () => {
      const { data: videoData } = await supabase
        .from('galeria')
        .select('url')
        .eq('tipo', 'video')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: imageData } = await supabase
        .from('galeria')
        .select('*')
        .eq('tipo', 'foto')
        .order('created_at', { ascending: false })
        .limit(30);

      if (videoData) setVideoUrls(videoData.map(v => v.url));
      if (imageData) setImages(imageData as Galeria[]);
    };

    fetchContent();
  }, [supabase]);

  // Handle video playback based on visibility
  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play().catch(e => console.error("Auto-play blocked:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView, currentVideoIndex]);

  const handleChannelChange = (direction: 'next' | 'prev') => {
    if (videoUrls.length === 0) return;

    if (direction === 'next') {
      setCurrentVideoIndex(prev => (prev + 1) % videoUrls.length);
    } else {
      setCurrentVideoIndex(prev => (prev - 1 + videoUrls.length) % videoUrls.length);
    }
  };

  const handleGalleryScroll = (direction: 'next' | 'prev') => {
    if (images.length <= 3) return;

    if (direction === 'next') {
      setCurrentImageIndex(prev => (prev + 1) % (images.length - 2));
    } else {
      setCurrentImageIndex(prev => (prev - 1 + (images.length - 2)) % (images.length - 2));
    }

    setShowVolume(true);
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolume(false), 2000);
  };

  const visibleImages = images.slice(currentImageIndex, currentImageIndex + 3);

  return (
    <section
      id="galeria"
      ref={sectionRef}
      className="min-h-screen py-10 md:py-20 flex items-center justify-center bg-black/40 relative overflow-hidden"
    >
      {/* Background Decor (Brutalist) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 text-[15vw] font-anton text-white leading-none select-none uppercase">REPLAY</div>
        <div className="absolute bottom-10 right-10 text-[10vw] font-anton text-neon-green leading-none select-none uppercase">TRAVESIA</div>
      </div>

      <div className="w-[80%] h-[80vh] flex flex-col lg:flex-row items-center gap-8 relative z-10">

        {/* TV UNIT - Expanded to occupy 70% of the container */}
        <div className="flex-[7] w-full h-full relative">
          <div className="tv-container w-full h-full p-4 md:p-8 tv-texture flex items-center justify-center rounded-[20px] md:rounded-[40px]">
            {/* Decorative Stains */}
            <div className="tv-stain w-32 h-32 top-4 left-4" />
            <div className="tv-stain w-24 h-24 bottom-10 right-20" />

            {/* SCREEN AREA - Quality Improved */}
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-black">

              {/* CONTENT - FULL COLOR & BEST QUALITY */}
              <div className="absolute inset-0 z-10 flex flex-col p-0 bg-[#000] overflow-hidden">

                {/* TOP 60% - VIDEO */}
                <div className="h-[60%] w-full relative group bg-black border-b border-white/20">
                  {videoUrls.length > 0 ? (
                    <motion.video
                      key={currentVideoIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      ref={videoRef}
                      src={videoUrls[currentVideoIndex]}
                      className="w-full h-full object-cover"
                      loop
                      playsInline
                      autoPlay
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="font-mono text-xs text-white/40 uppercase animate-pulse">Cargando Señal...</span>
                    </div>
                  )}

                  {/* Channel Overlay */}
                  <div className="absolute top-4 left-4 z-20 bg-black/80 text-neon-green px-2 py-1 font-mono text-xs border border-neon-green">
                    CH {currentVideoIndex + 1}
                  </div>
                </div>

                {/* BOTTOM 40% - IMAGE COLLAGE (3 horizontally) */}
                <div className="h-[40%] w-full grid grid-cols-3 gap-1 p-1 bg-[#1a1a1a] relative">
                  {/* Volume Indicator Overlay */}
                  <AnimatePresence>
                    {showVolume && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="absolute bottom-4 left-4 z-30 flex flex-col gap-1 pointer-events-none"
                      >
                        <span className="text-[10px] font-mono text-hot-pink mb-1">GALLERY_POS</span>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(images.length, 10) }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-4 border ${
                                i <= (currentImageIndex % 10)
                                  ? 'bg-hot-pink border-hot-pink'
                                  : 'bg-transparent border-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {visibleImages.length > 0 ? (
                    visibleImages.map((img, i) => (
                      <motion.div
                        key={`${img.id}-${currentImageIndex}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative h-full w-full group overflow-hidden"
                      >
                        <Image
                          src={img.url}
                          alt={img.titulo || 'Gallery'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="33vw"
                        />
                        <div className="absolute inset-0 bg-neon-green/0 group-hover:bg-neon-green/10 transition-colors" />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full h-full flex items-center justify-center">
                        <span className="font-mono text-[10px] text-white/20 uppercase">Esperando contenido...</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS SIDEBAR - Analog Brutalist Style */}
        <div className="flex-[3] w-full lg:max-w-[250px] flex flex-col gap-4">
          <div className="bg-[#1a1a1a] p-5 shadow-brutal border-4 border-white relative overflow-hidden">
            {/* Speaker Grill Texture */}
            <div className="absolute top-0 right-0 w-12 h-full opacity-10 pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '4px 4px' }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6 border-b border-white/20 pb-4">
                <div className="bg-black px-2 py-1 border border-white/40 -rotate-2 shadow-sm">
                  <span className="font-mono text-[10px] text-white uppercase tracking-widest">TRAVESÍA_TV</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-neon-green shadow-[0_0_10px_#b8d300] animate-pulse" />
                  <span className="font-mono text-[8px] text-white/40 tracking-tighter">SIGNAL</span>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                {/* VIDEO CHANNEL BUTTONS (Analog Feel) */}
                <div className="relative">
                  <div className="absolute -top-3 left-2 bg-black px-1 z-10">
                    <span className="font-mono text-[8px] text-neon-green uppercase font-bold tracking-widest">CHANNEL_SEL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleChannelChange('prev')}
                      className="h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-neon-green transition-all"
                    >
                      <span className="font-anton text-sm">CH-</span>
                    </button>
                    <button
                      onClick={() => handleChannelChange('next')}
                      className="h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-neon-green transition-all"
                    >
                      <span className="font-anton text-sm">CH+</span>
                    </button>
                  </div>
                </div>

                {/* IMAGE NAVIGATION (Volume Style) */}
                <div className="relative">
                  <div className="absolute -top-3 left-2 bg-black px-1 z-10">
                    <span className="font-mono text-[8px] text-hot-pink uppercase font-bold tracking-widest">GALLERY_VOL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleGalleryScroll('prev')}
                      className="h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-hot-pink transition-all"
                    >
                      <span className="font-anton text-sm">VOL-</span>
                    </button>
                    <button
                      onClick={() => handleGalleryScroll('next')}
                      className="h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-hot-pink transition-all"
                    >
                      <span className="font-anton text-sm">VOL+</span>
                    </button>
                  </div>
                </div>

                {/* MISC DIALS / DECOR */}
                <div className="flex justify-between items-end mt-4">
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 h-4 bg-[#333] border-t border-white/10" />
                    ))}
                  </div>
                  <div className="bg-neon-green text-black px-1.5 py-0.5 font-mono text-[8px] font-bold">
                    8K_ULTRA
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Branding Label */}
            <div className="mt-8 pt-4 border-t border-white/10 text-center">
               <p className="font-mono text-[7px] text-white/20 uppercase tracking-[0.4em]">
                 Propiedad de Club Travesía © 2024
               </p>
            </div>
          </div>

          {/* Secondary Control Unit (Small) */}
          <div className="bg-[#1a1a1a] p-3 border-2 border-white/20 flex justify-around">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 flex items-center justify-center group cursor-pointer hover:border-hot-pink transition-colors">
               <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-hot-pink animate-pulse" />
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-white/10 flex items-center justify-center group cursor-pointer hover:border-neon-green transition-colors">
               <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-neon-green" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
