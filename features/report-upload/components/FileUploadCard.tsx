'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection, DropzoneOptions, ErrorCode } from 'react-dropzone';
import axios, { AxiosProgressEvent, AxiosError } from 'axios'; // Removed CancelTokenSource, added AxiosError
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface UploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  source?: AbortController; // Using AbortController for cancellation
  // cancelTokenSource?: CancelTokenSource; // Alternative: Axios cancel token
  filePath?: string; // Store the S3 file path after getting signed URL
  errorMessage?: string; // Store specific error message for a file
}

interface FileUploadProgress extends File {
  uploadProgress: UploadProgress;
}

// Define size limits
const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Remove mockUploadFile function
// const mockUploadFile = async (...) => { ... };

export function FileUploadCard() {
  const [files, setFiles] = useState<FileUploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false); // Add state to track overall upload status

  const updateFileProgress = useCallback((fileName: string, progressData: Partial<UploadProgress>) => {
    setFiles(currentFiles =>
      currentFiles.map(f =>
        f.name === fileName
          ? { ...f, uploadProgress: { ...f.uploadProgress, ...progressData } }
          : f
      )
    );
  }, []);

  const handleUpload = useCallback(async () => {
    const filesToUpload = files.filter(f => f.uploadProgress.status === 'pending' || f.uploadProgress.status === 'error');
    if (filesToUpload.length === 0) return;

    setError(null);
    setIsUploading(true);

    const uploadPromises = filesToUpload.map(async (file) => {
      const abortController = new AbortController();
      updateFileProgress(file.name, {
        status: 'uploading',
        source: abortController,
        progress: 0,
        errorMessage: undefined, // Clear previous errors
      });

      try {
        // 1. Get Signed URL from our API
        const signedUrlResponse = await axios.post('/api/report-upload/signed-url', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        const { url, filePath, method } = signedUrlResponse.data;

        if (!url || !filePath || method !== 'PUT') {
          throw new Error("Invalid signed URL response from server.");
        }

        // Store the filePath
        updateFileProgress(file.name, { filePath: filePath });

        // 2. Upload file to S3 using the signed URL
        await axios.put(url, file, {
          signal: abortController.signal,
          headers: {
            'Content-Type': file.type,
            // S3 often doesn't require Content-Length for PUT with signed URLs, but axios might add it.
            // Ensure server generating the URL includes necessary headers if required by S3 policy.
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const percentCompleted = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0; // Use 0 if total size is unknown
            updateFileProgress(file.name, { progress: percentCompleted });
          },
        });

        // 3. Update status to success
        updateFileProgress(file.name, { status: 'success', progress: 100, source: undefined });
        return { success: true, fileName: file.name, filePath }; // Indicate success and return details

      } catch (err) {
        console.error('Upload failed for:', file.name, err);
        let errorMessage = "Upload failed.";

        if (axios.isCancel(err)) {
          errorMessage = "Upload cancelled.";
        } else if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ error?: string }>;
          if (axiosError.response) {
             // Error from server (e.g., signed URL API or S3 itself)
             errorMessage = axiosError.response.data?.error || `Server error (${axiosError.response.status})`;
          } else if (axiosError.request) {
             // Network error
             errorMessage = "Network error during upload.";
          }
        } else if (err instanceof Error) {
            errorMessage = err.message; // Error from client-side logic (e.g., invalid signed URL response)
        }

        updateFileProgress(file.name, {
           status: 'error',
           progress: 0,
           source: undefined,
           errorMessage: errorMessage
        });
        return { success: false, fileName: file.name, error: errorMessage }; // Indicate failure
      }
    });

    // Wait for all uploads to complete (or fail)
    const results = await Promise.all(uploadPromises);
    setIsUploading(false);

    // Optional: Handle results - e.g., show a summary message, trigger next step
    const successfulUploads = results.filter(r => r.success);
    const failedUploads = results.filter(r => !r.success);

    if (successfulUploads.length > 0) {
        console.log("Successfully uploaded:", successfulUploads.map(f => ({ name: f.fileName, path: f.filePath })));
        // TODO: Trigger next step, e.g., save report details to DB
    }

    if (failedUploads.length > 0) {
        setError(`${failedUploads.length} file(s) failed to upload. Check individual file status.`);
    }
    // If all successful and no failures, maybe clear the error message
    else if (successfulUploads.length > 0) {
        setError(null);
    }

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

  // Update derived state calculation to use the new isUploading state
  // const filesToUpload = files.filter(f => f.uploadProgress.status === 'pending' || f.uploadProgress.status === 'error');
  // const isUploading = files.some(f => f.uploadProgress.status === 'uploading'); // Remove this line, use state variable

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
                       {file.uploadProgress.status === 'error' && file.uploadProgress.errorMessage && (
                         <span className="text-xs text-red-600 font-medium ml-1 truncate" title={file.uploadProgress.errorMessage}>
                           ({file.uploadProgress.errorMessage})
                         </span>
                       )}
                       {(file.uploadProgress.status === 'pending' || file.uploadProgress.status === 'error' || file.uploadProgress.status === 'success') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => removeFile(file.name)}
                          aria-label={`Remove ${file.name}`}
                          disabled={isUploading} // Disable remove during active uploads for simplicity, or implement cancel+remove
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                       {/* Cancel button for 'uploading' state */}
                       {file.uploadProgress.status === 'uploading' && file.uploadProgress.source && (
                          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => file.uploadProgress.source?.abort()} aria-label={`Cancel upload for ${file.name}`}>
                              <X className="w-4 h-4 text-red-500" />
                          </Button>
                       )}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <div className="flex justify-end space-x-3">
              {/* Disable Clear All during upload */}
              <Button variant="outline" onClick={() => setFiles([])} disabled={isUploading}>Clear All</Button>
              {/* Update Upload button state/text */}
              <Button onClick={handleUpload} disabled={files.filter(f => f.uploadProgress.status === 'pending' || f.uploadProgress.status === 'error').length === 0 || isUploading}>
                {isUploading ? 'Uploading...' : `Upload ${files.filter(f => f.uploadProgress.status === 'pending' || f.uploadProgress.status === 'error').length} File(s)`}
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