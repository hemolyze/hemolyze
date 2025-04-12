'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection, DropzoneOptions, ErrorCode } from 'react-dropzone';
// import axios, { AxiosProgressEvent } from 'axios'; // Keep commented until actual upload implemented
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface UploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  source?: AbortController; // To allow cancellation
}

interface FileUploadProgress extends File {
  uploadProgress: UploadProgress;
}

// Define size limits
const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Mock function to simulate getting a signed URL and uploading
// In a real app, this would fetch the URL and then perform the PUT request
const mockUploadFile = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    // Simulate network delay and progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        onProgress(progress);
      } else {
        clearInterval(interval);
        // Simulate success after a short delay
        setTimeout(() => resolve(), 300);
      }
    }, 200); // Adjust interval for realistic simulation
  });
};


export function FileUploadCard() {
  const [files, setFiles] = useState<FileUploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updateFileProgress = useCallback((fileName: string, progressData: Partial<UploadProgress>) => {
    setFiles(currentFiles =>
      currentFiles.map(f =>
        f.name === fileName ? { ...f, uploadProgress: { ...f.uploadProgress, ...progressData } } : f
      )
    );
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setError(null); // Clear previous errors

    files.forEach(async file => {
      if (file.uploadProgress.status === 'pending' || file.uploadProgress.status === 'error') {
        const abortController = new AbortController();
        updateFileProgress(file.name, { status: 'uploading', source: abortController });

        try {
          // Replace mockUploadFile with actual signed URL fetching and axios upload
          await mockUploadFile(file, (progress) => {
            updateFileProgress(file.name, { progress });
          });

          // Actual upload logic would look something like this:
          // const signedUrlResponse = await axios.post('/api/get-signed-url', { fileName: file.name, contentType: file.type });
          // const signedUrl = signedUrlResponse.data.url;
          // await axios.put(signedUrl, file, {
          //   signal: abortController.signal,
          //   headers: { 'Content-Type': file.type },
          //   onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          //     const percentCompleted = progressEvent.total
          //       ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          //       : 0;
          //     updateFileProgress(file.name, { progress: percentCompleted });
          //   },
          // });

          updateFileProgress(file.name, { status: 'success', progress: 100, source: undefined });
        } catch (err) {
          console.error('Upload failed for:', file.name, err);
          updateFileProgress(file.name, { status: 'error', progress: 0, source: undefined });
          // Optionally set a general error message
          // setError(`Upload failed for ${file.name}. Please try again.`);
        }
      }
    });
  }, [files, updateFileProgress]);

  const removeFile = useCallback((fileName: string) => {
    setFiles(currentFiles => {
      const fileToRemove = currentFiles.find(f => f.name === fileName);
      // Cancel ongoing upload if any
      if (fileToRemove?.uploadProgress.status === 'uploading' && fileToRemove.uploadProgress.source) {
        fileToRemove.uploadProgress.source.abort();
      }
      return currentFiles.filter(f => f.name !== fileName);
    });
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);
    const currentRejections: FileRejection[] = [...fileRejections];
    const validFiles: File[] = [];
    const sizeValidationErrors: string[] = [];

    acceptedFiles.forEach(file => {
      let maxSize: number | null = null;
      let errorMsg = "";

      if (file.type === 'application/pdf') {
        maxSize = PDF_MAX_SIZE;
        errorMsg = `PDF files cannot exceed ${PDF_MAX_SIZE / 1024 / 1024}MB.`;
      } else if (file.type.startsWith('image/')) {
        maxSize = IMAGE_MAX_SIZE;
        errorMsg = `Image files cannot exceed ${IMAGE_MAX_SIZE / 1024 / 1024}MB.`;
      }
      // Add checks for other specific types if needed

      if (maxSize !== null && file.size > maxSize) {
        currentRejections.push({
          file,
          errors: [{
            code: ErrorCode.FileTooLarge, // Use standard error code
            message: errorMsg
          }]
        });
        if (!sizeValidationErrors.includes(errorMsg)) {
            sizeValidationErrors.push(errorMsg);
        }
      } else {
        validFiles.push(file); // Only add files that pass size validation
      }
    });

    // Handle error display
    if (currentRejections.length > 0) {
      const typeError = currentRejections.find(r => r.errors.some(e => e.code === ErrorCode.FileInvalidType));
      const otherErrors = currentRejections.filter(r => !r.errors.some(e => e.code === ErrorCode.FileInvalidType || e.code === ErrorCode.FileTooLarge));
      
      let combinedErrorMessage = "";
      if (typeError) {
          combinedErrorMessage += "Invalid file type detected. Please upload only accepted types. ";
      }
      if (sizeValidationErrors.length > 0) {
          combinedErrorMessage += sizeValidationErrors.join(" ") + " ";
      }
      if (otherErrors.length > 0) {
          combinedErrorMessage += "Other upload errors occurred.";
      }

      setError(combinedErrorMessage.trim() || "An unknown error occurred during file validation.");
    }

    // Map only valid files to the state
    const newFiles: FileUploadProgress[] = validFiles.map(file => Object.assign(file, {
      uploadProgress: { progress: 0, status: 'pending' } as UploadProgress,
    }) as FileUploadProgress);

    setFiles(prevFiles => {
      const uniqueNewFiles = newFiles.filter(
        newFile => !prevFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
      );
      return [...prevFiles, ...uniqueNewFiles];
    });
  }, []);


  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    // Remove global maxSize, handled in onDrop
    // maxSize: 10 * 1024 * 1024,
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  const filesToUpload = files.filter(f => f.uploadProgress.status === 'pending' || f.uploadProgress.status === 'error');
  const isUploading = files.some(f => f.uploadProgress.status === 'uploading');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Upload Medical Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                     ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
          {isDragActive ? (
            <p className="text-lg font-semibold text-primary">Drop the files here ...</p>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Drag & drop files here, or click to select</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">PDF (Max 10MB), JPG/PNG/WEBP (Max 5MB) accepted</p>
            </>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Selected Files:</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <ul className="space-y-3">
                {files.map(file => (
                  <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between space-x-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="text-sm font-medium truncate flex-1" title={file.name}>{file.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                       {file.uploadProgress.status === 'uploading' && (
                         <Progress value={file.uploadProgress.progress} className="w-24 h-2" />
                       )}
                       {file.uploadProgress.status === 'success' && (
                         <span className="text-xs text-green-600 font-medium">Uploaded</span>
                       )}
                       {file.uploadProgress.status === 'error' && (
                         <span className="text-xs text-red-600 font-medium">Error</span>
                       )}
                      {(file.uploadProgress.status === 'pending' || file.uploadProgress.status === 'error' || file.uploadProgress.status === 'success') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => removeFile(file.name)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                       {/* Add cancel button for 'uploading' state if needed */}
                       {/* {file.uploadProgress.status === 'uploading' && file.uploadProgress.source && (
                          <Button variant="ghost" size="icon" onClick={() => file.uploadProgress.source?.abort()}>
                              <X className="w-4 h-4" />
                          </Button>
                       )} */}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setFiles([])} disabled={isUploading}>Clear All</Button>
              <Button onClick={handleUpload} disabled={filesToUpload.length === 0 || isUploading}>
                {isUploading ? 'Uploading...' : `Upload ${filesToUpload.length} File${filesToUpload.length === 1 ? '' : 's'}`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export the component for use in other parts of the application
export default FileUploadCard; 