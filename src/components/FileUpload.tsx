import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  uploadedFile?: File | null;
  onRemoveFile?: () => void;
  isUploading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  uploadedFile, 
  onRemoveFile,
  isUploading = false 
}) => {


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isUploading
  });

  if (uploadedFile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isUploading ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
              {isUploading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                  <Loader className="w-6 h-6 text-blue-400" />
                </motion.div>
              ) : (
                <FileText className="w-6 h-6 text-green-400" />
              )}
            </div>
            <div>
              <div className="text-white font-medium">{uploadedFile.name}</div>
              <div className="text-gray-400 text-sm">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                {isUploading && ' • Processing...'}
              </div>
            </div>
          </div>
          {!isUploading && onRemoveFile && (
            <motion.button
              onClick={onRemoveFile}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  const rootProps = getRootProps();

  return (
    <div
      {...rootProps}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
        isUploading
          ? 'border-blue-500 bg-blue-500/10'
          : isDragActive
          ? 'border-cyan-400 bg-cyan-400/10'
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
        }`}
    >
      <motion.div
        whileHover={!isUploading ? { scale: 1.02 } : {}}
        whileTap={!isUploading ? { scale: 0.98 } : {}}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <motion.div
          animate={{
            y: isDragActive && !isUploading ? -5 : 0,
            scale: isDragActive && !isUploading ? 1.1 : 1
          }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className={`p-4 rounded-full ${
              isUploading
                ? 'bg-blue-500/20'
                : isDragActive
                ? 'bg-cyan-400/20'
                : 'bg-gray-700'
            }`}
          >
            {isUploading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <Loader className="w-8 h-8 text-blue-400" />
              </motion.div>
            ) : (
              <Upload
                className={`w-8 h-8 ${isDragActive ? 'text-cyan-400' : 'text-gray-400'}`}
              />
            )}
          </div>
          <div>
            <div className="text-white font-medium mb-2">
              {isUploading 
                ? 'Uploading your file...' 
                : isDragActive 
                ? 'Drop your file here' 
                : 'Upload your dataset'}
            </div>
            <div className="text-gray-400 text-sm">
              {isUploading 
                ? 'This may take a moment, please wait...' 
                : 'Supports CSV, XLSX files up to 100MB'}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
