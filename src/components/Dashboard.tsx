import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { HardDrive, FileText, Image as ImageIcon, Video, File, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    images: 0,
    videos: 0,
    docs: 0,
    size: '0 B'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Real-time synchronization: fetch every 30 seconds in background
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error } = await supabase.storage.from('documentation').list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'desc' },
      });

      if (error) throw error;

      if (data) {
        const images = data.filter(f => f.metadata?.mimetype?.startsWith('image/')).length;
        const videos = data.filter(f => f.metadata?.mimetype?.startsWith('video/')).length;
        const docs = data.length - images - videos;
        const totalSize = data.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);

        setStats({
          total: data.length,
          images,
          videos,
          docs,
          size: formatBytes(totalSize)
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Beranda Cloud TK</h1>
          <p className="text-slate-500">Selamat datang di pusat dokumentasi digital.</p>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-emerald-500 mt-1" />}
      </header>

      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100"
        >
          <HardDrive className="text-emerald-600 mb-2" size={24} />
          <div className="text-2xl font-bold text-emerald-900">{stats.size}</div>
          <div className="text-xs text-emerald-600 uppercase font-semibold tracking-wider">Total Storage</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 p-4 rounded-2xl border border-blue-100"
        >
          <FileText className="text-blue-600 mb-2" size={24} />
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-xs text-blue-600 uppercase font-semibold tracking-wider">Total File</div>
        </motion.div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Ringkasan Format</h2>
        <div className="space-y-3">
          <FormatRow icon={<ImageIcon className="text-pink-500" />} label="Foto" count={stats.images} color="bg-pink-500" />
          <FormatRow icon={<Video className="text-purple-500" />} label="Video" count={stats.videos} color="bg-purple-500" />
          <FormatRow icon={<File className="text-amber-500" />} label="Dokumen" count={stats.docs} color="bg-amber-500" />
        </div>
      </section>

      <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-1">Tips Keamanan</h3>
          <p className="text-slate-400 text-sm">Pastikan setiap dokumentasi anak sudah mendapatkan izin dari orang tua.</p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      </div>
    </div>
  );
}

function FormatRow({ icon, label, count, color }: { icon: React.ReactNode, label: string, count: number, color: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <span className="font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">{count}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      </div>
    </div>
  );
}
