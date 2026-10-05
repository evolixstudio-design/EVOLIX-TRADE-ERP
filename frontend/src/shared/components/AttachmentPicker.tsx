import React, { useRef, useState, useEffect } from 'react';
import api from '../api';
import { Camera, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface AttachmentPickerProps {
  // If the entity already exists and has an attachment
  existingAttachmentUrl?: string;
  // Called when user selects or clears a local file
  onFileSelect?: (file: File | null) => void;
  // If we are uploading immediately (for already existing entities)
  uploadImmediately?: {
    entityType: string;
    entityId: string;
    category: string;
  };
  onUploadSuccess?: (attachment: { id: string; url: string }) => void;
  onRemove?: () => void;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  existingAttachmentUrl,
  onFileSelect,
  uploadImmediately,
  onUploadSuccess,
  onRemove
}) => {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (localFile) {
      const url = URL.createObjectURL(localFile);
      setLocalPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setLocalPreview(null);
      return undefined;
    }
  }, [localFile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setLocalFile(file);
    if (onFileSelect) onFileSelect(file);

    if (uploadImmediately) {
      await performUpload(file);
    }
  };

  const performUpload = async (file: File) => {
    if (!uploadImmediately) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', uploadImmediately.entityType);
    formData.append('entityId', uploadImmediately.entityId);
    formData.append('category', uploadImmediately.category);

    setUploading(true);
    try {
      const response = await api.post('/api/v1/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onUploadSuccess) onUploadSuccess(response.data);
      setLocalFile(null); // Clear local since it's now on server
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (localFile) {
      setLocalFile(null);
      if (onFileSelect) onFileSelect(null);
      return;
    }
    if (existingAttachmentUrl && onRemove) {
      try {
        await onRemove();
      } catch (err) {
        setError('Failed to remove photo');
      }
    }
  };

  const displayUrl = localPreview || (existingAttachmentUrl ? (api.defaults.baseURL + existingAttachmentUrl) : null);

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Photo Attachment</h3>
        {uploading && <span className="text-xs text-blue-600 animate-pulse flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Uploading...</span>}
      </div>

      {error && (
        <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
          {error}
        </div>
      )}

      {displayUrl ? (
        <div className="relative group rounded overflow-hidden border border-gray-200 bg-gray-50 flex justify-center">
          <img 
            src={displayUrl} 
            alt="Attachment" 
            className="max-h-48 object-contain"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-gray-800 rounded shadow text-sm font-medium hover:bg-gray-100"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-600 text-white rounded shadow text-sm font-medium hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 py-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
            disabled={uploading}
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm font-medium">Camera</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors"
            disabled={uploading}
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-sm font-medium">Gallery</span>
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        capture="environment"
      />
    </div>
  );
};
