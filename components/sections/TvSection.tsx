'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Galeria } from '@/types/database';

type Mode = 'video' | 'gallery';

export default function TvSection() {
  const [mode, setMode] = useState<Mode>('video');
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showVolumeUI, setShowVolumeUI] = useState(false);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [images, setImages] = useState<Galeria[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Fetch real content from Supabase
  useEffect(() => {
    const fetchContent = async () => {
      const { data: videoData } = await supabase
        .from('galeria')
        .select('url')
        .eq('tipo', 'video')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: imageData } = await supabase
        .from('galeria')
        .select('*')
        .eq('tipo', 'foto')
        .order('created_at', { ascending: false })
        .limit(6);

      if (videoData && videoData.length > 0) setVideoUrl(videoData[0].url);
      if (imageData) setImages(imageData as Galeria[]);
    };

    fetchContent();
  }, [supabase]);

  // Handle video playback based on visibility
  useEffect(() => {
    if (videoRef.current) {
      if (isInView && mode === 'video') {
        videoRef.current.play().catch(e => console.error("Auto-play blocked:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView, mode]);

  const handleChannelChange = () => {
    setIsChangingChannel(true);
    setTimeout(() => {
      setMode(prev => prev === 'video' ? 'gallery' : 'video');
      setIsChangingChannel(false);
    }, 1000);
  };

  const adjustVolume = (delta: number) => {
    setVolume(prev => {
      const newVol = Math.max(0, Math.min(100, prev + delta));
      if (videoRef.current) {
        videoRef.current.volume = newVol / 100;
      }
      return newVol;
    });

    setShowVolumeUI(true);
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolumeUI(false), 2000);
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

      <div className="w-[80%] h-[80vh] flex flex-col lg:flex-row items-center gap-8 relative z-10">

        {/* TV UNIT - Expanded to occupy 70% of the container */}
        <div className="flex-[7] w-full h-full relative">
          <div className="tv-container w-full h-full p-4 md:p-8 tv-texture flex items-center justify-center rounded-[20px] md:rounded-[40px]">
            {/* Decorative Stains */}
            <div className="tv-stain w-32 h-32 top-4 left-4" />
            <div className="tv-stain w-24 h-24 bottom-10 right-20" />

            {/* SCREEN AREA - Quality Improved */}
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-black">

              {/* Startup Animation */}
              <AnimatePresence mode="wait">
                {isChangingChannel && (
                  <motion.div
                    key="static"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 tv-static"
                  />
                )}
              </AnimatePresence>

              {/* CONTENT - FULL COLOR & BEST QUALITY */}
              <div className="absolute inset-0 z-10 flex flex-col p-0 bg-[#000] overflow-hidden">

                {mode === 'video' ? (
                  <div className="flex-1 w-full h-full relative group">
                    {videoUrl ? (
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        loop
                        playsInline
                        muted={volume === 0}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black">
                         <span className="font-mono text-xs text-white/40 uppercase animate-pulse">Cargando Señal...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-1 p-1 items-center bg-black overflow-y-auto">
                    {images.length > 0 ? (
                      images.map((img, i) => (
                        <motion.div
                          key={img.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="aspect-square relative group"
                        >
                          <Image
                            src={img.url}
                            alt={img.titulo || 'Gallery'}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-3 h-full flex items-center justify-center">
                         <span className="font-mono text-xs text-white/20 uppercase">Sin Fotos</span>
                      </div>
                    )}
                  </div>
                )}

                {/* SMALL GALLERY FOOTER (Mode Video) */}
                {mode === 'video' && images.length > 0 && (
                  <div className="h-20 mt-4 flex justify-center gap-2">
                    {images.slice(0, 4).map((img, i) => (
                      <div key={i} className="h-full aspect-video relative border border-white/10 opacity-50 grayscale">
                        <Image src={img.url} alt={`Thumb ${i}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* VOLUME UI */}
                <AnimatePresence>
                  {showVolumeUI && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-neon-green text-black px-4 py-2 font-mono text-sm font-bold flex items-center gap-2 z-50"
                    >
                      {volume === 0 ? <VolumeX size={16} /> : volume < 50 ? <Volume1 size={16} /> : <Volume2 size={16} />}
                      <div className="w-32 h-2 bg-black/20 relative">
                        <div className="absolute top-0 left-0 h-full bg-black" style={{ width: `${volume}%` }} />
                      </div>
                      <span>{volume}%</span>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS SIDEBAR - More compact for larger TV */}
        <div className="flex-[3] w-full lg:max-w-[250px] flex flex-col gap-4">
          <div className="bg-[#2a2a2a] p-4 shadow-brutal border-4 border-[#1a1a1a] relative">
            <div className="text-center mb-4 border-b border-white/10 pb-2">
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest block mb-1">TRAVESÍA TV</span>
              <div className="w-2 h-2 rounded-full bg-neon-green mx-auto shadow-[0_0_8px_#b8d300]" />
            </div>

            <div className="flex flex-col gap-6">
              {/* MODE BUTTON */}
              <button
                onClick={handleChannelChange}
                className="btn-tape py-3 text-xs w-full"
              >
                {mode === 'video' ? 'VER FOTOS' : 'VER VIDEO'}
              </button>

              {/* VOLUME BUTTONS */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[8px] text-white/60 uppercase text-center">Volumen</span>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => adjustVolume(-10)}
                    className="flex-1 h-10 bg-[#333] border-2 border-black rounded flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() => adjustVolume(10)}
                    className="flex-1 h-10 bg-[#333] border-2 border-black rounded flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* EXTRA INFO */}
              <div className="mt-2 text-[8px] font-mono text-white/20 uppercase space-y-1">
                <p>SIGNAL: FULL_COLOR</p>
                <p>REFRESH: 60HZ</p>
                <p>SOURCE: SUPABASE_DB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
