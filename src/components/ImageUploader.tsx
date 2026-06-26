import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Check, Loader2, AlertCircle } from "lucide-react";
import { uploadFile } from "../firebaseUtils";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  initialImageUrl?: string;
  className?: string;
  label?: string;
}

export default function ImageUploader({
  onUploadComplete,
  folder = "uploads",
  initialImageUrl = "",
  className = "",
  label = "Cambiar imagen"
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(initialImageUrl);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }
    
    // Set tentative local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setError(null);
    setUploading(true);

    try {
      const storageUrl = await uploadFile(file, folder);
      setPreviewUrl(storageUrl);
      onUploadComplete(storageUrl);
    } catch (err: any) {
      console.error("Error al subir archivo:", err);
      setError("Fallo al subir la imagen. Inténtalo de nuevo.");
      // Revert preview on failure
      setPreviewUrl(initialImageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive
            ? "border-red-500 bg-red-500/5"
            : "border-slate-800 bg-[#0a0d14] hover:border-slate-700"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={uploading}
        />

        {previewUrl ? (
          <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2 group">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
              <Upload className="h-5 w-5 text-white" />
              <span className="text-[10px] font-bold text-white ml-1.5 uppercase tracking-wider">{label}</span>
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mb-2">
            <ImageIcon className="h-5 w-5 text-slate-500" />
          </div>
        )}

        {uploading ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
            Subiendo...
          </div>
        ) : (
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest text-center">
            {previewUrl ? "Haz clic para cambiar" : "Arrastra o selecciona imagen"}
          </span>
        )}

        {error && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-red-500 font-bold">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
