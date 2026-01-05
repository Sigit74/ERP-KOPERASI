
import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle, FileUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FileUploadProps {
  bucketName: string;
  onUploadComplete: (path: string, url: string) => void;
  currentImage?: string;
  label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ bucketName, onUploadComplete, currentImage, label = "Upload Foto" }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);

  // Reusable upload logic
  const processFile = async (file: File) => {
    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      setPreview(data.publicUrl);
      onUploadComplete(filePath, data.publicUrl);

    } catch (error: any) {
      // Enhanced error messages for common issues
      let errorMessage = 'Gagal upload foto:\\n\\n';

      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        errorMessage += '🔒 Izin akses storage belum dikonfigurasi.\\n\\nSolusi:\\n1. Buka Supabase Dashboard\\n2. Pergi ke Storage → ' + bucketName + '\\n3. Buat RLS policies untuk INSERT/SELECT\\n\\nAtau hubungi administrator sistem.';
      } else if (error.message.includes('Bucket not found')) {
        errorMessage += '📁 Bucket \"' + bucketName + '\" tidak ditemukan.\\n\\nPastikan bucket sudah dibuat di Supabase Storage.';
      } else if (error.message.includes('size')) {
        errorMessage += '📦 Ukuran file terlalu besar.\\n\\nMaksimal 5MB per file.';
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processFile(event.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Basic validation for images
      if (!file.type.startsWith('image/')) {
        alert("Mohon upload file gambar saja.");
        return;
      }
      processFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('', '');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-all cursor-pointer relative ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          ) : (
            isDragging ? (
              <FileUp className="h-8 w-8 text-blue-500 mb-2 animate-bounce" />
            ) : (
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
            )
          )}

          <p className={`text-sm font-medium ${isDragging ? 'text-blue-600' : 'text-slate-500'}`}>
            {uploading ? 'Mengunggah...' : isDragging ? 'Lepaskan file disini' : 'Klik atau Geser file kesini'}
          </p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
        </div>
      ) : (
        <div className="relative w-full">
          <img src={preview} alt="Preview" className="rounded-lg border border-slate-200 shadow-sm w-full h-48 object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <CheckCircle size={12} /> Uploaded
          </div>
        </div>
      )}
    </div>
  );
};
