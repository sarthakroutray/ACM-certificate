import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  currentImage?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImage }) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onImageSelect('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
        Certificate Template Image
      </label>
      
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700"
          >
            <img src={preview} alt="Template preview" className="w-full h-64 object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
            >
              <X size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
              ${isDragging 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {isDragging ? (
                  <Upload className="w-8 h-8 text-primary animate-bounce" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                  JPG, PNG (max 5MB)
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
