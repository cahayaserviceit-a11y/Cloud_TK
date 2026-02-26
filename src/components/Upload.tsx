import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload as UploadIcon, X, Check, Loader2, FileUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Limit 50MB for Supabase Free Plan
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File terlalu besar! Maksimal ukuran file adalah 50 MB untuk paket gratis Supabase.');
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('documentation')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        if (error.message.includes('row-level security')) {
          throw new Error('Izin ditolak oleh Supabase (RLS). Pastikan kebijakan Storage sudah diatur ke Publik.');
        }
        if (error.message.includes('exceeded the maximum allowed size')) {
          throw new Error('File terlalu besar! Batas maksimal di Supabase Anda adalah 50 MB.');
        }
        throw error;
      }

      setStatus('success');
      setFile(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err.message || 'Gagal mengunggah file');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center h-full space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Upload Dokumentasi</h1>
        <p className="text-slate-500 text-sm">Pilih file foto, video, atau dokumen untuk disimpan.</p>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-sm aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${
          file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div 
              key="selected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
                <FileUp className="text-white" size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-red-500 text-xs font-bold uppercase tracking-widest"
              >
                Ganti File
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                <UploadIcon className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-400 font-medium">Klik untuk memilih file</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm">
        <button
          disabled={!file || uploading}
          onClick={handleUpload}
          className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
            !file || uploading ? 'bg-slate-200 cursor-not-allowed' : 'bg-emerald-500 shadow-xl shadow-emerald-200 active:scale-95'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Mengunggah...
            </>
          ) : (
            <>
              <Check size={20} />
              Simpan ke Cloud
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 z-50"
          >
            <Check size={18} />
            Berhasil diunggah!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
