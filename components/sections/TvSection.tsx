'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { Galeria } from '@/types/database';

export default function TvSection() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<'video' | 'photo'>('video');
  const [showVolume, setShowVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
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
        if (isPlaying) {
          videoRef.current.play().catch(e => console.error("Auto-play blocked:", e));
        }
        videoRef.current.muted = isMuted;
        videoRef.current.volume = 1.0;
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView, currentVideoIndex, isMuted, isPlaying]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error("Play blocked:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleChannelChange = (direction: 'next' | 'prev') => {
    setDisplayMode('video');
    if (videoUrls.length === 0) return;

    if (direction === 'next') {
      setCurrentVideoIndex(prev => (prev + 1) % videoUrls.length);
    } else {
      setCurrentVideoIndex(prev => (prev - 1 + videoUrls.length) % videoUrls.length);
    }
  };

  const handleGalleryScroll = (direction: 'next' | 'prev') => {
    setDisplayMode('photo');
    if (images.length === 0) return;

    if (direction === 'next') {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    } else {
      setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    }

    setShowVolume(true);
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolume(false), 2000);
  };

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

      <div className="w-[90%] md:w-[80%] h-[85vh] md:h-[80vh] flex flex-col lg:flex-row items-center gap-6 md:gap-8 relative z-10">

        {/* TV UNIT - Expanded on mobile (80% height) */}
        <div className="flex-[8] lg:flex-[7] w-full h-full relative">
          <div className="tv-container w-full h-full p-3 md:p-8 tv-texture flex items-center justify-center rounded-[20px] md:rounded-[40px]">
            {/* Decorative Stains */}
            <div className="tv-stain w-24 md:w-32 h-24 md:h-32 top-4 left-4" />
            <div className="tv-stain w-16 md:w-24 h-16 md:h-24 bottom-10 right-20" />

            {/* SCREEN AREA - 9:16 aspect on mobile via container sizing */}
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-black aspect-[9/16] md:aspect-auto">

              {/* CONTENT - FULL SCREEN */}
              <div className="absolute inset-0 z-10 bg-[#000] overflow-hidden">
                <AnimatePresence mode="wait">
                  {displayMode === 'video' ? (
                    <motion.div
                      key={`video-${currentVideoIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full cursor-pointer relative"
                      onClick={togglePlay}
                    >
                      {videoUrls.length > 0 ? (
                        <video
                          ref={videoRef}
                          src={videoUrls[currentVideoIndex]}
                          className="w-full h-full object-cover"
                          loop
                          playsInline
                          autoPlay
                          muted={isMuted}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="font-mono text-xs text-white/40 uppercase animate-pulse">Cargando Señal...</span>
                        </div>
                      )}

                      {/* Video Controls Overlays */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <AnimatePresence>
                          {!isPlaying && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="bg-black/40 p-4 rounded-full"
                            >
                              <Play size={40} className="text-white fill-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Channel Overlay */}
                      <div className="absolute top-4 left-4 z-20 bg-black/80 text-neon-green px-2 py-1 font-mono text-xs border border-neon-green flex items-center gap-2">
                        <span>CH {currentVideoIndex + 1}</span>
                        {!isPlaying && <span className="text-[8px] animate-pulse">PAUSED</span>}
                      </div>

                      {/* Mute Button */}
                      <button
                        onClick={toggleMute}
                        className="absolute bottom-4 right-4 z-20 p-2 bg-black/60 border border-white/20 hover:bg-neon-green hover:text-black transition-all rounded-sm pointer-events-auto"
                      >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`photo-${currentImageIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full relative"
                    >
                      {images.length > 0 ? (
                        <Image
                          src={images[currentImageIndex].url}
                          alt={images[currentImageIndex].titulo || 'Gallery'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 70vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="font-mono text-[10px] text-white/20 uppercase">Sin imágenes</span>
                        </div>
                      )}

                      {/* Volume Indicator Overlay */}
                      <AnimatePresence>
                        {showVolume && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute bottom-4 left-4 z-30 flex flex-col gap-1 pointer-events-none"
                          >
                            <span className="text-[10px] font-mono text-hot-pink mb-1">IMG_POS</span>
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS SIDEBAR - 20% height on mobile */}
        <div className="flex-[2] lg:flex-[3] w-full lg:max-w-[250px] flex flex-col gap-4">
          <div className="bg-[#1a1a1a] p-4 md:p-5 shadow-brutal border-4 border-white relative overflow-hidden h-full lg:h-auto">
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

              <div className="flex flex-row lg:flex-col gap-4 lg:gap-8 h-full items-center lg:items-stretch">
                {/* VIDEO CHANNEL BUTTONS (Analog Feel) */}
                <div className="relative flex-1">
                  <div className="absolute -top-3 left-2 bg-black px-1 z-10">
                    <span className="font-mono text-[8px] text-neon-green uppercase font-bold tracking-widest">CHANNELS</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 pt-2">
                    <button
                      onClick={() => handleChannelChange('prev')}
                      className="h-10 md:h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-neon-green transition-all"
                    >
                      <span className="font-anton text-xs md:text-sm">CH-</span>
                    </button>
                    <button
                      onClick={() => handleChannelChange('next')}
                      className="h-10 md:h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-neon-green transition-all"
                    >
                      <span className="font-anton text-xs md:text-sm">CH+</span>
                    </button>
                  </div>
                </div>

                {/* IMAGE NAVIGATION (Volume Style) */}
                <div className="relative flex-1">
                  <div className="absolute -top-3 left-2 bg-black px-1 z-10">
                    <span className="font-mono text-[8px] text-hot-pink uppercase font-bold tracking-widest">VOLUME</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 pt-2">
                    <button
                      onClick={() => handleGalleryScroll('prev')}
                      className="h-10 md:h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-hot-pink transition-all"
                    >
                      <span className="font-anton text-xs md:text-sm">VOL-</span>
                    </button>
                    <button
                      onClick={() => handleGalleryScroll('next')}
                      className="h-10 md:h-12 bg-[#222] border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:translate-x-1 flex items-center justify-center text-white hover:text-hot-pink transition-all"
                    >
                      <span className="font-anton text-xs md:text-sm">VOL+</span>
                    </button>
                  </div>
                </div>

                {/* MISC DIALS / DECOR - HIDDEN ON MOBILE TO SAVE SPACE */}
                <div className="hidden lg:flex justify-between items-end mt-4">
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 h-4 bg-[#333] border-t border-white/10" />
                    ))}
                  </div>
                </div>
              </div>
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
