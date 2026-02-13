import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, RotateCcw, Move, Type, Plus, Loader, Check, Save, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEventImages, uploadEventImage, getEventTemplates, saveEventTemplate, TemplateRecord } from '../../services/api';

interface PlaceholderPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // px
  fontFamily: string;
  alignment: string;
  color: string;
}

export interface TemplateData {
  image: string;
  namePlaceholder: PlaceholderPosition;
  codePlaceholder: PlaceholderPosition;
}

interface CertificateTemplateEditorProps {
  onTemplateChange: (data: TemplateData) => void;
  currentImage?: string;
  eventId?: string;  // workshop/event ID — when set, fetch images from storage
  token?: string | null;
}

const DEFAULT_NAME_POS: PlaceholderPosition = { x: 50, y: 45, fontSize: 24, fontFamily: 'Arial', alignment: 'center', color: '#1a1a2e' };
const DEFAULT_CODE_POS: PlaceholderPosition = { x: 50, y: 70, fontSize: 16, fontFamily: 'Courier New', alignment: 'center', color: '#333333' };

const CertificateTemplateEditor: React.FC<CertificateTemplateEditorProps> = ({
  onTemplateChange,
  currentImage,
  eventId,
  token,
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const [namePlaceholder, setNamePlaceholder] = useState<PlaceholderPosition>({ ...DEFAULT_NAME_POS });
  const [codePlaceholder, setCodePlaceholder] = useState<PlaceholderPosition>({ ...DEFAULT_CODE_POS });
  const [activeDrag, setActiveDrag] = useState<'name' | 'code' | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Image gallery state
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [templateRecords, setTemplateRecords] = useState<TemplateRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Fetch gallery images when eventId changes
  useEffect(() => {
    if (!eventId) {
      setGalleryImages([]);
      return;
    }

    const loadImages = async () => {
      setIsLoadingGallery(true);
      try {
        const [images, templates] = await Promise.all([
          getEventImages(eventId),
          getEventTemplates(eventId),
        ]);
        setGalleryImages(images);
        setTemplateRecords(templates);
      } catch (error) {
        console.error('Failed to load event images:', error);
      } finally {
        setIsLoadingGallery(false);
      }
    };
    loadImages();
  }, [eventId]);

  // Reset when eventId changes
  useEffect(() => {
    setPreview(null);
    setSelectedImageUrl(null);
    setNamePlaceholder({ ...DEFAULT_NAME_POS });
    setCodePlaceholder({ ...DEFAULT_CODE_POS });
    onTemplateChange({ image: '', namePlaceholder: DEFAULT_NAME_POS, codePlaceholder: DEFAULT_CODE_POS });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Emit changes whenever positions or image change
  useEffect(() => {
    if (preview) {
      onTemplateChange({
        image: preview,
        namePlaceholder,
        codePlaceholder,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, namePlaceholder, codePlaceholder]);

  // Handle global mouse move/up when dragging
  useEffect(() => {
    if (!activeDrag) return;

    const handleWindowMove = (e: MouseEvent | TouchEvent) => {
      if (!imageContainerRef.current) return;

      const container = imageContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      // Calculate percentage position
      let x = ((clientX - container.left) / container.width) * 100;
      let y = ((clientY - container.top) / container.height) * 100;

      // Clamp to 0-100
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      const updateFn = activeDrag === 'name' ? setNamePlaceholder : setCodePlaceholder;
      updateFn((prev) => ({ ...prev, x, y }));
    };

    const handleWindowUp = () => {
      setActiveDrag(null);
    };

    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowUp);
    window.addEventListener('touchmove', handleWindowMove, { passive: false });
    window.addEventListener('touchend', handleWindowUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
      window.removeEventListener('touchmove', handleWindowMove);
      window.removeEventListener('touchend', handleWindowUp);
    };
  }, [activeDrag]);

  const handleMouseDown = useCallback(
    (type: 'name' | 'code') => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); // Prevent scrolling on touch
      e.stopPropagation();
      setActiveDrag(type);
    },
    []
  );

  // Autosave when template changes
  useEffect(() => {
    if (!preview || !selectedImageUrl || !eventId || !token) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const saved = await saveEventTemplate(token, eventId, {
          image_url: selectedImageUrl,
          name_placeholder: {
            x: namePlaceholder.x, y: namePlaceholder.y, fontSize: namePlaceholder.fontSize,
            fontFamily: namePlaceholder.fontFamily, alignment: namePlaceholder.alignment, color: namePlaceholder.color,
          },
          code_placeholder: {
            x: codePlaceholder.x, y: codePlaceholder.y, fontSize: codePlaceholder.fontSize,
            fontFamily: codePlaceholder.fontFamily, alignment: codePlaceholder.alignment, color: codePlaceholder.color,
          },
        });
        // Update local cache
        setTemplateRecords((prev) => {
          const idx = prev.findIndex((t) => t.image_url === selectedImageUrl);
          if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy; }
          return [...prev, saved];
        });
      } catch (err) {
        console.error('Failed to auto-save template:', err);
      } finally {
        setIsSaving(false);
      }
    }, 500); // Reduced debounce to 500ms
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namePlaceholder, codePlaceholder, selectedImageUrl, eventId, token]);

  // ---- Gallery: select existing image ----
  const selectGalleryImage = (url: string) => {
    setSelectedImageUrl(url);
    setPreview(url);
    // Restore saved positions if they exist for this image
    const saved = templateRecords.find((t) => t.image_url === url);
    if (saved) {
      setNamePlaceholder({
        x: saved.name_x, y: saved.name_y, fontSize: saved.name_font_size,
        fontFamily: saved.name_font_family || 'Arial',
        alignment: saved.name_alignment || 'center',
        color: saved.name_color || '#1a1a2e',
      });
      setCodePlaceholder({
        x: saved.code_x, y: saved.code_y, fontSize: saved.code_font_size,
        fontFamily: saved.code_font_family || 'Courier New',
        alignment: saved.code_alignment || 'center',
        color: saved.code_color || '#333333',
      });
    } else {
      setNamePlaceholder({ ...DEFAULT_NAME_POS });
      setCodePlaceholder({ ...DEFAULT_CODE_POS });
    }
  };

  // ---- Gallery: upload new image to Supabase Storage ----
  const handleGalleryUpload = async (file: File) => {
    if (!eventId || !token) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadEventImage(token, eventId, file);
      setGalleryImages(prev => [...prev, result.url]);
      // Auto-select the newly uploaded image
      selectGalleryImage(result.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // ---- Fallback: direct file upload (no Supabase, no eventId) ----
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setNamePlaceholder({ ...DEFAULT_NAME_POS });
      setCodePlaceholder({ ...DEFAULT_CODE_POS });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (eventId && token) {
        handleGalleryUpload(file);
      } else {
        handleFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setPreview(null);
    setSelectedImageUrl(null);
    onTemplateChange({ image: '', namePlaceholder: DEFAULT_NAME_POS, codePlaceholder: DEFAULT_CODE_POS });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetPositions = () => {
    setNamePlaceholder({ ...DEFAULT_NAME_POS });
    setCodePlaceholder({ ...DEFAULT_CODE_POS });
  };

  // ---- Placeholder Pill component ----
  const PlaceholderPill: React.FC<{
    type: 'name' | 'code';
    position: PlaceholderPosition;
    color: string;
    borderColor: string;
    bgColor: string;
    label: string;
  }> = ({ type, position, color, borderColor, bgColor, label }) => (
    <div
      onMouseDown={handleMouseDown(type)}
      onTouchStart={handleMouseDown(type)} // Use same handler
      className="absolute select-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: activeDrag === type ? 30 : 20,
        cursor: activeDrag === type ? 'grabbing' : 'grab',
      }}
    >
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 shadow-lg transition-shadow ${activeDrag === type ? 'shadow-xl ring-2 ring-offset-1 ring-offset-transparent' : ''
          }`}
        style={{
          borderColor: borderColor,
          backgroundColor: bgColor,
          fontSize: `${Math.max(10, position.fontSize * 0.55)}px`,
          boxShadow: activeDrag === type ? `0 0 20px ${borderColor}40` : undefined,
          ringColor: borderColor,
        }}
      >
        <Move size={12} style={{ color }} className="flex-shrink-0 opacity-70" />
        <span style={{ color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </span>
      </div>
      {/* Coordinate tooltip */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap rounded px-1 py-0.5"
        style={{ backgroundColor: bgColor, color, opacity: 0.8, border: `1px solid ${borderColor}30` }}
      >
        {position.x.toFixed(0)}%, {position.y.toFixed(0)}%
      </div>
    </div>
  );

  // Helper to render controls for a placeholder
  const renderControls = (
    type: 'name' | 'code',
    data: PlaceholderPosition,
    setData: React.Dispatch<React.SetStateAction<PlaceholderPosition>>,
    colorClass: string,
    label: string
  ) => (
    <div className="space-y-3 pb-4 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full bg-${colorClass}-500`} />
        <span className={`text-xs font-bold text-${colorClass}-300 uppercase tracking-wider`}>
          {label} Placeholder
        </span>
        <span className="text-[10px] text-slate-500 font-mono ml-auto">
          {data.x.toFixed(1)}%, {data.y.toFixed(1)}%
        </span>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 w-16 flex-shrink-0">Size</label>
        <input
          type="range"
          min={type === 'name' ? 10 : 8}
          max={type === 'name' ? 100 : 60}
          value={data.fontSize}
          onChange={(e) => setData((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))}
          className={`flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-${colorClass}-500`}
        />
        <span className={`text-xs font-mono text-${colorClass}-300 w-8 text-right`}>
          {data.fontSize}px
        </span>
      </div>

      {/* Font Family & Color */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-[10px] text-slate-400 mb-1">Font</label>
          <select
            value={data.fontFamily || 'Arial'}
            onChange={(e) => setData((prev) => ({ ...prev, fontFamily: e.target.value }))}
            className="w-full bg-slate-700 text-xs text-slate-200 rounded px-2 py-1.5 border border-slate-600 focus:border-emerald-500 outline-none"
          >
            {['Arial', 'Courier New', 'Times New Roman', 'Roboto', 'Inter'].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Color</label>
          <div className="flex items-center gap-2 bg-slate-700 rounded px-2 py-1 border border-slate-600">
            <input
              type="color"
              value={data.color || '#000000'}
              onChange={(e) => setData((prev) => ({ ...prev, color: e.target.value }))}
              className="w-6 h-6 bg-transparent border-0 p-0 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-300">{data.color}</span>
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-[10px] text-slate-400 mb-1">Alignment</label>
        <div className="flex bg-slate-700 rounded p-1 gap-1 w-fit">
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => setData(prev => ({ ...prev, alignment: align }))}
              className={`p-1.5 rounded ${(data.alignment || 'center') === align
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
              title={`Align ${align}`}
            >
              {align === 'left' && <AlignLeft size={14} />}
              {align === 'center' && <AlignCenter size={14} />}
              {align === 'right' && <AlignRight size={14} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ---- No event selected ----
  if (eventId !== undefined && !eventId) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Type size={16} />
          Certificate Template & Placeholder Positions
        </label>
        <div className="border-2 border-dashed border-slate-700 rounded-lg p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm font-mono">Select an event first to manage certificate images</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
        <Type size={16} />
        Certificate Template &amp; Placeholder Positions
      </label>

      {/* === Image Gallery === */}
      {eventId && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-mono">
            {galleryImages.length > 0
              ? 'Choose an existing template or upload a new one:'
              : 'No templates yet — upload one:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {isLoadingGallery ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                <Loader size={14} className="animate-spin" />
                Loading images...
              </div>
            ) : (
              <>
                {galleryImages.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectGalleryImage(url)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 group ${selectedImageUrl === url
                      ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10'
                      : 'border-slate-700 hover:border-slate-500'
                      }`}
                  >
                    <img
                      src={url}
                      alt={`Template ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedImageUrl === url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check size={16} className="text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}

                {/* Upload "+" button */}
                <label
                  className={`w-20 h-14 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${isUploading
                    ? 'border-slate-600 bg-slate-800/50'
                    : 'border-slate-600 hover:border-primary hover:bg-slate-800/50'
                    }`}
                >
                  {isUploading ? (
                    <Loader size={16} className="text-slate-400 animate-spin" />
                  ) : (
                    <Plus size={20} className="text-slate-500" />
                  )}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleGalleryUpload(file);
                    }}
                  />
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* === Template preview with placeholders === */}
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            {/* Instructions banner */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
              <Move size={14} className="flex-shrink-0" />
              <span>Drag the <strong>{'{{NAME}}'}</strong> and <strong>{'{{CODE}}'}</strong> placeholders to position them on your certificate template.</span>
            </div>

            {/* Image container with placeholders */}
            <div
              ref={imageContainerRef}
              className="relative rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-900 select-none"
              style={{ cursor: activeDrag ? 'grabbing' : 'default' }}
            >
              <img
                src={preview}
                alt="Certificate template"
                className="w-full h-auto block pointer-events-none"
                draggable={false}
              />

              <PlaceholderPill
                type="name"
                position={namePlaceholder}
                color="#c4b5fd"
                borderColor="#8b5cf6"
                bgColor="rgba(91, 33, 182, 0.85)"
                label="{{NAME}}"
              />
              <PlaceholderPill
                type="code"
                position={codePlaceholder}
                color="#fcd34d"
                borderColor="#f59e0b"
                bgColor="rgba(120, 53, 15, 0.85)"
                label="{{CODE}}"
              />

              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg z-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Controls panel */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowControls(!showControls)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-colors"
                title="Toggle Controls"
              >
                <span className="flex items-center gap-2">
                  <Type size={14} />
                  Placeholder Settings
                  {isSaving && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <Loader size={10} className="animate-spin" />
                      Saving...
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500">{showControls ? '▲ Hide' : '▼ Show'}</span>
              </button>

              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-700 pt-3">
                      {/* Using the new renderControls helper */}
                      {renderControls('name', namePlaceholder, setNamePlaceholder, 'violet', '{{NAME}}')}
                      {renderControls('code', codePlaceholder, setCodePlaceholder, 'amber', '{{CODE}}')}

                      {/* Reset button */}
                      <button
                        type="button"
                        onClick={resetPositions}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <RotateCcw size={12} />
                        Reset Positions to Default
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : !eventId ? (
          /* Fallback drop zone when no eventId (direct file upload) */
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
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-slate-600 hover:border-primary hover:bg-slate-800/50'
              }
              `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                {isDragging ? (
                  <Upload className="w-8 h-8 text-primary animate-bounce" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-slate-300 font-semibold mb-1">
                  {isDragging ? 'Drop certificate image here' : 'Upload Certificate Template Image'}
                </p>
                <p className="text-sm text-slate-500 font-mono">
                  JPG, PNG (max 10MB) — you'll position Name & Code placeholders next
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
    </div>
  );
};

export default CertificateTemplateEditor;
