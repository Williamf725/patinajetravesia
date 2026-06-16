'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToCloudinary, deleteFromCloudinary } from '@/app/auth/actions/cloudinary';
import { createClient } from '@/lib/supabase/client';
import { Upload, Trash2, FileVideo, FileImage, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Galeria } from '@/types/database';

export default function GaleriaTab() {
  const [items, setItems] = useState<Galeria[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const fetchMedia = useCallback(async () => {
    const { data } = await supabase.from('galeria').select('*').order('created_at', { ascending: false });
    setItems((data as Galeria[]) || []);
  }, [supabase]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await uploadToCloudinary(formData);
      } catch (err) {
        console.error('Error uploading:', err);
        alert('Error al subir: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
    setIsUploading(false);
    fetchMedia();
  }, [fetchMedia]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm']
    }
  });

  const handleDelete = async (id: string, publicId: string) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
      await deleteFromCloudinary(publicId, id);
      fetchMedia();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const fotos = items.filter(i => i.tipo === 'foto');
  const videos = items.filter(i => i.tipo === 'video');

  return (
    <div className="flex flex-col gap-10">

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-4 border-dashed p-12 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer
          ${isDragActive ? 'border-neon-green bg-neon-green/5' : 'border-white/20 hover:border-white/40'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <>
            <Loader2 size={48} className="animate-spin text-neon-green" />
            <p className="font-anton text-2xl uppercase">Subiendo archivos...</p>
          </>
        ) : (
          <>
            <Upload size={48} className="text-white/20" />
            <div className="text-center">
              <p className="font-anton text-2xl uppercase">Arrastra fotos o videos aquí</p>
              <p className="font-mono text-xs text-white/40 mt-2 uppercase tracking-widest">O haz clic para seleccionar (JPG, PNG, WEBP, MP4)</p>
            </div>
          </>
        )}
      </div>

      {/* Media Grid */}
      <div className="space-y-12">

        {/* Videos Section */}
        <section>
          <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
             <FileVideo className="text-neon-green" />
             <h2 className="font-anton text-3xl uppercase">Videos de la Pantalla</h2>
          </div>
          {videos.length === 0 ? (
            <p className="font-mono text-xs text-white/20 uppercase">No hay videos subidos</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((item) => (
                <div key={item.id} className="group relative aspect-video bg-black border-2 border-white/10 overflow-hidden">
                  <video src={item.url} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button
                      onClick={() => handleDelete(item.id, item.public_id)}
                      className="bg-hot-pink text-white p-3 hover:scale-110 transition-transform"
                     >
                        <Trash2 size={24} />
                     </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                     <p className="font-mono text-[10px] truncate text-white/60">{item.titulo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Photos Section */}
        <section>
          <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
             <FileImage className="text-neon-green" />
             <h2 className="font-anton text-3xl uppercase">Fotos de la Galería</h2>
          </div>
          {fotos.length === 0 ? (
            <p className="font-mono text-xs text-white/20 uppercase">No hay fotos subidas</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {fotos.map((item) => (
                <div key={item.id} className="group relative aspect-square bg-black border-2 border-white/10 overflow-hidden">
                  <Image src={item.url} alt={item.titulo} fill className="object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button
                      onClick={() => handleDelete(item.id, item.public_id)}
                      className="bg-hot-pink text-white p-2 hover:scale-110 transition-transform"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
