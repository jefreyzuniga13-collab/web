
import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import '@/Styles/UI/FileInput.css'

interface FileInputProps {
  id?: string;
  name?: string;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  error?: string;
  className?: string;
  currentImage?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ 
    id, 
    name, 
    onFileSelect, 
    accept = "image/*", 
    maxSize = 5 * 1024 * 1024,
    error,
    className,
    currentImage
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (file: File | null) => {
      if (!file) {
        setPreview(null);
        onFileSelect(null);
        return;
      }

      if (file.size > maxSize) {
        onFileSelect(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileChange(file);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0] || null;
      handleFileChange(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    };

    const handleDragLeave = () => {
      setDragActive(false);
    };

    const clearFile = () => {
      setPreview(null);
      onFileSelect(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const openFileDialog = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className={`file-input ${className || ''}`}>
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          name={name}
          accept={accept}
          onChange={handleInputChange}
          className="file-input__hidden"
          style={{ display: 'none' }}
        />
        
        <div 
          className={`file-input__dropzone ${dragActive ? 'file-input__dropzone--active' : ''} ${error ? 'file-input__dropzone--error' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          {preview ? (
            <div className="file-input__preview">
              <img src={preview} alt="Preview" className="file-input__preview-image" />
              <button 
                type="button"
                className="file-input__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="file-input__placeholder">
              <div className="file-input__icon">
                <Upload size={24} />
              </div>
              <div className="file-input__text">
                <span className="file-input__main-text">Arrastra una imagen aquí o haz clic para seleccionar</span>
                <span className="file-input__sub-text">Máximo {maxSize / 1024 / 1024}MB</span>
              </div>
            </div>
          )}
        </div>
        
        {error && <span className="file-input__error">{error}</span>}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export default FileInput;