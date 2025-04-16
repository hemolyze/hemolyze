'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone, FileRejection, DropzoneOptions, ErrorCode } from 'react-dropzone';
import axios, { AxiosProgressEvent, AxiosError } from 'axios';
import { toast, Toaster } from 'sonner'; // Use sonner
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Keep useRouter

// Interface for Upload Progress state (managed separately)
interface UploadProgress {
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    source?: AbortController;
    filePath?: string; // S3 key/path
    errorMessage?: string;
}

// Define size limits
const PDF_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB

// --- Helper Type for File Record Data ---
interface FileRecordData {
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
}
// --- Helper Type for Upload Result ---
type UploadResult =
    | { success: true } & FileRecordData
    | { success: false; fileName: string; error?: string };


export function FileUploadCard() {
    // State for the original File objects
    const [files, setFiles] = useState<File[]>([]);
    // State for upload progress/status, keyed by filename
    const [uploadStates, setUploadStates] = useState<Map<string, UploadProgress>>(new Map());

    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false); // Combined state for upload/save
    const router = useRouter();

    // Function to update the upload state map immutably
    const updateUploadState = useCallback((fileName: string, progressData: Partial<UploadProgress>) => {
        setUploadStates(currentStates => {
            const newStates = new Map(currentStates);
            const currentState = newStates.get(fileName) || { progress: 0, status: 'pending' };
            newStates.set(fileName, { ...currentState, ...progressData });
            // console.log(`[updateUploadState] ${fileName}:`, newStates.get(fileName)); // Debug log if needed
            return newStates;
        });
    }, []);

    // Function to create the DB record
    const createReportRecord = useCallback(async (uploadedFilesData: FileRecordData[]) => {
        setIsProcessing(true); // Use combined state
        setError(null);
        let reportId: string | null = null;
        try {
            const response = await axios.post('/api/report-upload/create-record', { uploadedFiles: uploadedFilesData });
            reportId = response.data?.reportId; // Get report ID from response
            toast.success('Report record created successfully!');
            setFiles([]); // Clear files
            setUploadStates(new Map()); // Clear states

            // Optional Redirect after successful save
            if (reportId) {
                router.prefetch(`/reports/${reportId}`);
                router.push(`/reports/${reportId}`); // Use the actual report ID
            }

        } catch (err) {
            console.error("Error creating report record:", err);
            let saveErrorMsg = "Failed to save report details.";
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<{ error?: string }>;
                saveErrorMsg = axiosError.response?.data?.error || saveErrorMsg;
            }
            setError(saveErrorMsg);
            toast.error(saveErrorMsg);
        } finally {
            // Only stop processing if we are not redirecting
            if (!reportId) {
                setIsProcessing(false);
            }
            // If redirecting, the page change handles the visual state change
        }
    }, [router]); // Added router dependency

    // Function to handle the actual upload process for multiple files
    const handleUpload = useCallback(async () => {
        setError(null); // Clear previous errors

        // 1. Identify files needing upload
        const filesToAttemptUpload = files.filter(f => {
            const status = uploadStates.get(f.name)?.status;
            return status === 'pending' || status === 'error';
        });

        // 2. Handle case where no files need uploading *right now*
        if (filesToAttemptUpload.length === 0) {
            if (files.length === 0) {
                return; // Nothing to do
            }

            // Check if *all* existing files are already successfully uploaded
            const allCurrentFilesAreSuccess = files.every(f => uploadStates.get(f.name)?.status === 'success');

            if (allCurrentFilesAreSuccess) {
                const successfulFilesData = files
                    .map(f => {
                        const state = uploadStates.get(f.name);
                        // Ensure file size is a number and filePath exists
                        return state?.status === 'success' && state.filePath && typeof f.size === 'number'
                            ? { fileName: f.name, filePath: state.filePath, fileType: f.type, fileSize: f.size }
                            : null;
                    })
                    .filter((f): f is FileRecordData => f !== null);

                if (successfulFilesData.length === files.length) {
                    console.log("All files already uploaded, proceeding to save record.");
                    await createReportRecord(successfulFilesData);
                } else {
                    // This case might indicate a state inconsistency (e.g., success status but missing filePath or size)
                    console.warn("All files marked success, but data retrieval failed for some. Cannot save.", { successfulFilesData, totalFiles: files.length });
                    setError("Could not retrieve necessary data for all successful files. Please try re-uploading.");
                    setIsProcessing(false); // Ensure processing stops
                }
            } else {
                // Potentially show a message if needed, but likely just do nothing if the button is disabled.
            }
            return; // Exit if no new uploads are needed
        }

        // 3. Proceed with uploading the identified files
        setIsProcessing(true);

        const uploadPromises = filesToAttemptUpload.map(async (file): Promise<UploadResult> => {
            // Ensure file size is valid before proceeding with this file
            if (typeof file.size !== 'number') {
                const sizeError = `File ${file.name} has an invalid size.`;
                console.error(sizeError);
                updateUploadState(file.name, { status: 'error', progress: 0, source: undefined, errorMessage: sizeError });
                return { success: false, fileName: file.name, error: sizeError };
            }

            const abortController = new AbortController();
            updateUploadState(file.name, {
                status: 'uploading',
                source: abortController,
                progress: 0,
                errorMessage: undefined,
            });

            try {
                // 1. Get Signed URL
                const signedUrlResponse = await axios.post('/api/report-upload/signed-url', {
                    fileName: file.name, fileType: file.type, fileSize: file.size,
                });
                const { url, filePath, method } = signedUrlResponse.data;
                if (!url || !filePath || method !== 'PUT') throw new Error("Invalid signed URL response.");

                updateUploadState(file.name, { filePath: filePath }); // Store S3 path

                // 2. Upload to S3
                await axios.put(url, file, {
                    signal: abortController.signal,
                    headers: { 'Content-Type': file.type },
                    onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                        const percentCompleted = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
                        updateUploadState(file.name, { progress: percentCompleted });
                    },
                });

                // 3. Mark as success IN STATE (the result is returned below)
                updateUploadState(file.name, { status: 'success', progress: 100, source: undefined });
                return { success: true, fileName: file.name, filePath, fileType: file.type, fileSize: file.size };

            } catch (err) {
                console.error('Upload failed for:', file.name, err);
                let errorMessage = "Upload failed.";
                if (axios.isCancel(err)) { errorMessage = "Upload cancelled."; }
                else if (axios.isAxiosError(err)) {
                    const axiosError = err as AxiosError<{ error?: string }>;
                    errorMessage = axiosError.response?.data?.error || `Server error (${axiosError.response?.status || 'unknown'})`;
                } else if (err instanceof Error) { errorMessage = err.message; }

                updateUploadState(file.name, { status: 'error', progress: 0, source: undefined, errorMessage: errorMessage });
                return { success: false, fileName: file.name, error: errorMessage };
            }
        });

        // 4. Wait for all uploads in this batch to settle
        const uploadResults = await Promise.all(uploadPromises);

        // 5. Analyze the results of *this batch*
        const batchFailedResults = uploadResults.filter(r => !r.success);

        if (batchFailedResults.length > 0) {
            // If any file in the current batch failed, report error and stop.
            const failedFileNames = batchFailedResults.map(r => r.fileName).join(', ');
            const errorMsg = `${batchFailedResults.length} file(s) failed to upload (${failedFileNames}). Check individual file status.`;
            console.error("Upload batch failed for:", failedFileNames);
            setError(errorMsg);
            toast.error(`Upload failed for: ${failedFileNames}`);
            setIsProcessing(false); // Stop processing
            return; // Exit
        }

        // 6. If the batch succeeded, gather data for all successful files (batch + previous)
        // Get successful results from the current batch directly
        const batchSuccessData = uploadResults
            .filter((r): r is { success: true } & FileRecordData => r.success)
            // Map to ensure we have the correct FileRecordData structure
            .map(r => ({
                fileName: r.fileName,
                filePath: r.filePath,
                fileType: r.fileType,
                fileSize: r.fileSize,
            }));

        // Get data for files that were already successful *before* this batch
        const previouslySuccessfulFilesData = files
            .filter(f => !filesToAttemptUpload.some(attempted => attempted.name === f.name)) // Filter out files attempted in this batch
            .map(f => {
                const state = uploadStates.get(f.name);
                // Check state: must be success, have filePath, and valid size
                return state?.status === 'success' && state.filePath && typeof f.size === 'number'
                    ? { fileName: f.name, filePath: state.filePath, fileType: f.type, fileSize: f.size }
                    : null;
            })
            .filter((f): f is FileRecordData => f !== null);

        // Combine the data
        const allSuccessfulFilesData = [...batchSuccessData, ...previouslySuccessfulFilesData];

        console.log('Batch successful data:', batchSuccessData);
        console.log('Previously successful data:', previouslySuccessfulFilesData);
        console.log('Combined successful files data:', allSuccessfulFilesData);
        console.log('Total files count:', files.length);


        if (allSuccessfulFilesData.length === files.length && files.length > 0) {
            // All files currently tracked are accounted for and have success data
            setError(null);
            console.log("All files confirmed successfully uploaded, attempting to save record:", allSuccessfulFilesData);
            await createReportRecord(allSuccessfulFilesData);
        } else {
            // This scenario means the batch upload succeeded, but the overall state is inconsistent
            // (e.g., a file was removed concurrently, or a previously successful file lost its data?)
            // Or potentially, a file that wasn't attempted failed validation somehow (shouldn't happen with current logic).
            console.warn("Upload batch successful, but final validation failed.", { allSuccessfulFilesData, totalFiles: files.length });
            setError("Upload process completed, but failed to verify all file details for saving. Please review files or try again.");
            toast.warning("Inconsistent state after upload. Cannot save report.");
            setIsProcessing(false); // Ensure processing stops as we can't save
        }

    }, [files, uploadStates, updateUploadState, createReportRecord, router]); // Added router dependency

    const removeFile = useCallback((fileName: string) => {
        const state = uploadStates.get(fileName);
        if (state?.status === 'uploading' && state.source) {
            state.source.abort();
        }
        setFiles(currentFiles => currentFiles.filter(f => f.name !== fileName));
        setUploadStates(currentStates => {
            const newStates = new Map(currentStates);
            newStates.delete(fileName);
            return newStates;
        });
    }, [uploadStates]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setError(null);
        // --- Validation Start ---
        const currentRejections: FileRejection[] = [...fileRejections];
        const validFiles: File[] = [];
        const sizeValidationErrors: string[] = [];
        acceptedFiles.forEach(file => {
            // Extra check: Ensure file size is a number on drop
            if (typeof file.size !== 'number') {
                console.error(`File "${file.name}" dropped with invalid size:`, file.size);
                currentRejections.push({ file, errors: [{ code: ErrorCode.FileInvalidType, message: "Invalid file size property." }] });
                return; // Skip this file
            }
            let maxSize: number | null = null; let errorMsg = "";
            if (file.type === 'application/pdf') { maxSize = PDF_MAX_SIZE; errorMsg = `PDF > ${PDF_MAX_SIZE / 1024 / 1024}MB`; }
            else if (file.type.startsWith('image/')) { maxSize = IMAGE_MAX_SIZE; errorMsg = `Image > ${IMAGE_MAX_SIZE / 1024 / 1024}MB`; }

            if (maxSize !== null && file.size > maxSize) {
                currentRejections.push({ file, errors: [{ code: ErrorCode.FileTooLarge, message: errorMsg }] });
                if (!sizeValidationErrors.includes(errorMsg)) { sizeValidationErrors.push(errorMsg); }
            } else { validFiles.push(file); }
        });
        // --- Validation End ---

        const newFilesToAdd: File[] = [];
        const newUploadStatesToAdd = new Map<string, UploadProgress>();
        validFiles.forEach(file => {
            if (!files.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)) {
                newFilesToAdd.push(file);
                newUploadStatesToAdd.set(file.name, { progress: 0, status: 'pending' });
            }
        });

        if (newFilesToAdd.length > 0) {
            setFiles(prevFiles => [...prevFiles, ...newFilesToAdd]);
            setUploadStates(prevStates => new Map([...prevStates, ...newUploadStatesToAdd]));
        }

        // Handle error display
        if (currentRejections.length > 0) {
            const typeError = currentRejections.find(r => r.errors.some(e => e.code === ErrorCode.FileInvalidType));
            let combinedErrorMessage = "";
            if (typeError) { combinedErrorMessage += "Invalid file type or size property detected. "; } // Updated message
            if (sizeValidationErrors.length > 0) { combinedErrorMessage += sizeValidationErrors.join(" ") + " "; }
            setError(combinedErrorMessage.trim() || "File validation errors occurred.");
        }
    }, [files]); // files dependency

    const dropzoneOptions: DropzoneOptions = { onDrop, accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], }, };
    const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

    // Calculate count based on uploadStates
    const pendingOrErrorFilesCount = files.filter(f => { const status = uploadStates.get(f.name)?.status; return status === 'pending' || status === 'error'; }).length;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <Toaster richColors position="bottom-center" /> {/* Add Toaster */}
            <CardHeader><CardTitle className="text-center">Upload Medical Reports</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                {error && (<Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                <div {...getRootProps()} className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400 bg-white dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
                    {isDragActive ? (<p className="text-lg font-semibold text-primary">Drop files here...</p>) :
                        (<> <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Drag & drop files, or click</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">PDF(Max 10MB), IMG(Max 5MB)</p> </>)}
                </div>

                {files.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Selected Files:</h3>
                        <ScrollArea className="h-48 w-full rounded-md border p-4">
                            <ul className="space-y-3">
                                {files.map((file, index) => {
                                    const state = uploadStates.get(file.name); // Get state from map
                                    return (
                                        <li key={`${file.name}-${index}`} className="flex items-center justify-between space-x-3"> {/* Simplified key */}
                                            {/* File Info Div */}
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate flex-1" title={file.name}>{file.name}</span>
                                                {/* Use check for size display */}
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    {typeof file.size === 'number' ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)` : '(Size unavailable)'}
                                                </span>
                                            </div>
                                            {/* Status/Actions Div */}
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                {state?.status === 'uploading' && (<Progress value={state.progress} className="w-24 h-2" />)}
                                                {state?.status === 'success' && (<span className="text-xs text-green-600 font-medium">Uploaded</span>)}
                                                {state?.status === 'error' && (
                                                    <span className="text-xs text-red-600 font-medium" title={state.errorMessage ?? 'Upload Error'}>Error</span> // Added fallback title
                                                )}
                                                {/* Removed redundant error message display span */}
                                                {/* Remove Button */}
                                                {(state?.status === 'pending' || state?.status === 'error' || state?.status === 'success') && (
                                                    <Button variant="ghost" size="icon" className="w-6 h-6"
                                                        onClick={() => removeFile(file.name)} aria-label={`Remove ${file.name}`} disabled={isProcessing}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {/* Cancel Button */}
                                                {state?.status === 'uploading' && state.source && (
                                                    <Button variant="ghost" size="icon" className="w-6 h-6"
                                                        onClick={() => state.source?.abort()}
                                                        aria-label={`Cancel upload for ${file.name}`}
                                                        disabled={!isProcessing}
                                                    >
                                                        <X className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </ScrollArea>
                        {/* Bottom Buttons */}
                        <div className="flex justify-end space-x-3">
                            <Button variant="outline" onClick={() => { setFiles([]); setUploadStates(new Map()); }} disabled={isProcessing}>Clear All</Button>
                            <Button onClick={handleUpload} disabled={pendingOrErrorFilesCount === 0 || isProcessing}>
                                {isProcessing ? 'Processing...' : `Upload ${pendingOrErrorFilesCount} File(s)`}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default FileUploadCard;