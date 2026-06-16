'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Volume1 } from 'lucide-react';

const TEST_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";
const TEST_IMAGES = [
  "https://picsum.photos/seed/skate1/300/200",
  "https://picsum.photos/seed/skate2/300/200",
  "https://picsum.photos/seed/skate3/300/200",
];

type Mode = 'video' | 'gallery';

export default function TvSection() {
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<Mode>('video');
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showVolumeUI, setShowVolumeUI] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intersection Observer for power on
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isOn) {
          setIsOn(true);
        }
      },
      { threshold: 0.5 }
    );

    const el = document.getElementById('tv-section');
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [isOn]);

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
    <section id="tv-section" className="min-height-screen py-24 flex items-center justify-center bg-black/40 relative overflow-hidden">
      {/* Background Decor (Brutalist) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 text-[15vw] font-anton text-white leading-none select-none">REPLAY</div>
        <div className="absolute bottom-10 right-10 text-[10vw] font-anton text-neon-green leading-none select-none">TRAVESIA</div>
      </div>

      <div className="container max-w-6xl px-4 flex flex-col lg:flex-row items-center gap-12 relative z-10">

        {/* TV UNIT */}
        <div className="flex-1 w-full relative">
          <div className="tv-container aspect-video w-full p-8 lg:p-12 tv-texture flex items-center justify-center">
            {/* Decorative Stains */}
            <div className="tv-stain w-32 h-32 top-4 left-4" />
            <div className="tv-stain w-24 h-24 bottom-10 right-20" />

            {/* SCREEN AREA */}
            <div className="relative w-full h-full crt-screen">

              {/* Startup Animation / Power State */}
              <AnimatePresence>
                {!isOn && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black z-50 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scaleX: 0, scaleY: 0.01, backgroundColor: "#fff" }}
                      exit={{
                        scaleX: [0, 1, 1],
                        scaleY: [0.01, 0.01, 1],
                        opacity: [1, 1, 0],
                        transition: { duration: 0.8, times: [0, 0.4, 1] }
                      }}
                      className="w-full h-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Static Noise Effect */}
              {(isChangingChannel || !isOn) && (
                <div className="absolute inset-0 z-40 tv-static" />
              )}

              {/* CONTENT */}
              <div className="absolute inset-0 z-10 flex flex-col p-4 crt-curvature bg-[#1a1a1a] overflow-hidden grayscale-[0.2] sepia-[0.2] contrast-[1.1]">

                {mode === 'video' ? (
                  <div className="flex-1 w-full h-full relative group">
                    <video
                      ref={videoRef}
                      src={TEST_VIDEO}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted={volume === 0}
                    />
                    {/* Placeholder for Supabase integration:
                        To fetch from Supabase, use useEffect to query the 'galeria' table
                        where type = 'video'.
                        Example:
                        const { data } = await supabase.from('galeria').select('url').eq('type', 'video').single();
                        setVideoUrl(data.url);
                    */}
                  </div>
                ) : (
                  <div className="flex-1 grid grid-cols-3 gap-4 p-4 items-center">
                    {TEST_IMAGES.map((img, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="aspect-[4/3] relative border-2 border-white/20 shadow-lg"
                      >
                        <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                      </motion.div>
                    ))}
                    {/* Placeholder for Supabase integration:
                        Query 'galeria' table where type = 'foto'.
                        Example:
                        const { data } = await supabase.from('galeria').select('url').eq('type', 'foto');
                        setImages(data.map(i => i.url));
                    */}
                  </div>
                )}

                {/* SMALL GALLERY FOOTER (Mode Video) */}
                {mode === 'video' && (
                  <div className="h-20 mt-4 flex justify-center gap-2">
                    {TEST_IMAGES.map((img, i) => (
                      <div key={i} className="h-full aspect-video relative border border-white/10 opacity-50 grayscale">
                        <Image src={img} alt={`Thumb ${i}`} fill className="object-cover" />
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

                {/* SCANLINES OVERLAY */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] z-30" />
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS SIDEBAR */}
        <div className="lg:w-48 flex flex-col gap-8">
          <div className="bg-[#2a2a2a] p-6 shadow-brutal border-4 border-[#1a1a1a] relative">
            {/* Branding on TV */}
            <div className="text-center mb-6 border-b border-white/10 pb-4">
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest block mb-1">Travesía 2000</span>
              <div className="w-2 h-2 rounded-full bg-red-600 mx-auto animate-pulse shadow-[0_0_5px_red]" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* CHANNEL BUTTONS */}
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[10px] text-white/60 uppercase text-center">Channels</span>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleChannelChange}
                    className="w-12 h-12 bg-[#333] border-t-2 border-l-2 border-white/20 border-b-4 border-r-4 border-black/60 rounded-md active:translate-y-1 active:border-b-2 flex items-center justify-center text-white/80 transition-all hover:bg-[#3a3a3a]"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleChannelChange}
                    className="w-12 h-12 bg-[#333] border-t-2 border-l-2 border-white/20 border-b-4 border-r-4 border-black/60 rounded-md active:translate-y-1 active:border-b-2 flex items-center justify-center text-white/80 transition-all hover:bg-[#3a3a3a]"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* VOLUME BUTTONS */}
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[10px] text-white/60 uppercase text-center">Volume</span>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => adjustVolume(-10)}
                    className="w-12 h-12 bg-[#333] border-t-2 border-l-2 border-white/20 border-b-4 border-r-4 border-black/60 rounded-md active:translate-y-1 active:border-b-2 flex items-center justify-center text-white/80 transition-all hover:bg-[#3a3a3a]"
                  >
                    -
                  </button>
                  <button
                    onClick={() => adjustVolume(10)}
                    className="w-12 h-12 bg-[#333] border-t-2 border-l-2 border-white/20 border-b-4 border-r-4 border-black/60 rounded-md active:translate-y-1 active:border-b-2 flex items-center justify-center text-white/80 transition-all hover:bg-[#3a3a3a]"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* POWER BUTTON */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center gap-2">
                <button
                  onClick={() => setIsOn(!isOn)}
                  className={`w-10 h-10 rounded-full border-2 border-black/40 shadow-inner flex items-center justify-center transition-all ${isOn ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-red-900'}`}
                >
                  <div className="w-3 h-3 border-2 border-white/40 rounded-full" />
                </button>
                <span className="font-mono text-[8px] text-white/40 uppercase">Power</span>
              </div>
            </div>
          </div>

          {/* Brutalist Detail */}
          <div className="h-32 border-l-4 border-neon-green pl-4 flex items-center">
            <p className="font-mono text-[10px] text-white/60 leading-tight uppercase">
              // ANALOG_FEED_01<br/>
              // RESOLUTION_CRT<br/>
              // TRAVESIA_CLUB
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
