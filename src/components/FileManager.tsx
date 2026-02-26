import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  File, 
  Download, 
  Trash2,
  Loader2,
  ChevronRight,
  Edit2,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type FileItem = {
  name: string;
  id: string;
  updated_at: string;
  metadata: {
    mimetype: string;
    size: number;
  };
  publicUrl?: string;
};

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'doc'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(() => fetchFiles(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFiles = async (isBackground = false) => {
    try {
      if (!isBackground && files.length === 0) setLoading(true);
      const { data, error } = await supabase.storage.from('documentation').list('', {
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) throw error;
      
      if (data) {
        const filesWithUrls = data.map(file => {
          const { data: urlData } = supabase.storage.from('documentation').getPublicUrl(file.name);
          return { 
            ...file, 
            publicUrl: urlData.publicUrl,
            metadata: {
              mimetype: file.metadata?.mimetype || 'application/octet-stream',
              size: file.metadata?.size || 0
            }
          } as FileItem;
        });
        setFiles(filesWithUrls);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (!confirm('Hapus file ini?')) return;
    try {
      const { error } = await supabase.storage.from('documentation').remove([name]);
      if (error) throw error;
      setFiles(files.filter(f => f.name !== name));
      if (selectedFile?.name === name) setSelectedFile(null);
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const renameFile = async (e: React.MouseEvent, oldName: string) => {
    e.stopPropagation();
    const newName = window.prompt('Masukkan nama baru (sertakan ekstensi):', oldName);
    if (!newName || newName === oldName) return;

    try {
      setLoading(true);
      const { error: moveError } = await supabase.storage
        .from('documentation')
        .move(oldName, newName);

      if (moveError) throw moveError;
      
      await fetchFiles(true);
      alert('Nama file berhasil diubah');
    } catch (err: any) {
      console.error('Rename error:', err);
      alert(`Gagal mengubah nama: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: FileItem) => {
    const mime = file.metadata.mimetype;
    if (mime.startsWith('image/') && file.publicUrl) {
      return (
        <img 
          src={file.publicUrl} 
          alt={file.name} 
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    if (mime.startsWith('video/')) return <Video className="text-purple-500" />;
    if (mime.includes('pdf') || mime.includes('word')) return <FileText className="text-blue-500" />;
    return <File className="text-slate-400" />;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'image' && file.metadata.mimetype.startsWith('image/')) ||
      (filter === 'video' && file.metadata.mimetype.startsWith('video/')) ||
      (filter === 'doc' && !file.metadata.mimetype.startsWith('image/') && !file.metadata.mimetype.startsWith('video/'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-slate-900">File Manager</h1>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />}
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari file..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <FilterButton active={filter === 'all'} label="Semua" onClick={() => setFilter('all')} />
          <FilterButton active={filter === 'image'} label="Foto" onClick={() => setFilter('image')} />
          <FilterButton active={filter === 'video'} label="Video" onClick={() => setFilter('video')} />
          <FilterButton active={filter === 'doc'} label="Dokumen" onClick={() => setFilter('doc')} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {files.length === 0 && loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-emerald-500" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p>Tidak ada file ditemukan</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedFile(file)}
                className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer active:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {getFileIcon(file)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{file.name}</h3>
                    <p className="text-xs text-slate-400">
                      {new Date(file.updated_at).toLocaleDateString()} • {(file.metadata.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => renameFile(e, file.name)}
                    className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                    title="Ubah Nama"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => deleteFile(e, file.name)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedFile(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{selectedFile.name}</h3>
                  <p className="text-xs text-slate-500">{selectedFile.metadata.mimetype}</p>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 flex items-center justify-center bg-slate-50 min-h-[300px] max-h-[60vh] overflow-hidden">
                {selectedFile.metadata.mimetype.startsWith('image/') ? (
                  <img 
                    src={selectedFile.publicUrl} 
                    alt={selectedFile.name} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                ) : selectedFile.metadata.mimetype.startsWith('video/') ? (
                  <video 
                    src={selectedFile.publicUrl} 
                    controls 
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <FileText size={64} />
                    <p className="text-sm font-medium">Pratinjau tidak tersedia untuk format ini</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white flex gap-3">
                <a 
                  href={selectedFile.publicUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                >
                  <Download size={18} />
                  Unduh File
                </a>
                <button 
                  onClick={(e) => {
                    deleteFile(e, selectedFile.name);
                  }}
                  className="px-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
          : 'bg-white text-slate-500 border border-slate-200'
      }`}
    >
      {label}
    </button>
  );
}
