import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera as CameraIcon, RotateCcw, Check, X, Loader2, SwitchCamera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CameraView() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Browser Anda tidak mendukung akses kamera atau sedang dalam mode tidak aman (HTTP).');
      return;
    }

    try {
      stopCamera();
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser atau aplikasi Anda.');
      } else {
        alert(`Gagal mengakses kamera: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleUpload = async () => {
    if (!capturedImage) return;

    try {
      setUploading(true);
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Limit 50MB
      const MAX_SIZE = 50 * 1024 * 1024;
      if (blob.size > MAX_SIZE) {
        throw new Error('Foto terlalu besar untuk diunggah (Maks 50 MB).');
      }

      const fileName = `camera-${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from('documentation')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
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

      alert('Foto berhasil disimpan!');
      setCapturedImage(null);
      startCamera();
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(err.message || 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="relative h-full bg-black overflow-hidden flex flex-col">
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!capturedImage ? (
            <motion.div 
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="h-full w-full object-cover"
              />
              
              <div className="absolute top-6 right-6 z-20">
                <button 
                  onClick={toggleCamera}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30"
                >
                  <SwitchCamera size={24} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full w-full"
            >
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="h-full w-full object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-slate-900 p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] flex items-center justify-around">
        {!capturedImage ? (
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-[6px] border-slate-700 active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 bg-white rounded-full border-2 border-slate-900" />
          </button>
        ) : (
          <div className="flex items-center gap-12">
            <button 
              onClick={retake}
              className="flex flex-col items-center gap-2 text-white/60 active:text-white"
            >
              <div className="p-4 bg-white/10 rounded-full border border-white/20">
                <RotateCcw size={24} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">Ulangi</span>
            </button>

            <button 
              disabled={uploading}
              onClick={handleUpload}
              className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-90 transition-transform disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin text-white" /> : <Check className="text-white" size={32} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
