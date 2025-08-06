import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadResumeProps {
  onUpload: (file: File) => void;
  onParseComplete?: (resumeData: any) => void;
}

export const UploadResume: React.FC<UploadResumeProps> = ({ onUpload, onParseComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    onUpload(file);

    try {
      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-resume', {
        body: { 
          file: file,
          filename: file.name,
          contentType: file.type
        }
      });

      if (uploadError) throw uploadError;

      setUploadStatus('processing');
      
      toast({
        title: "Upload Successful",
        description: "Your resume is being processed with Gemini 2.0 Flash AI...",
      });

      // Poll for processing completion
      if (uploadData.resumeId) {
        await pollForProcessingCompletion(uploadData.resumeId);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const pollForProcessingCompletion = async (resumeId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-resume', {
          body: { resumeId }
        });

        if (error) throw error;

        if (data.processing_status === 'completed') {
          setUploadStatus('completed');
          toast({
            title: "Processing Complete",
            description: "Your resume has been analyzed with 90%+ accuracy using Gemini 2.0 Flash!",
          });
          
          if (onParseComplete) {
            onParseComplete(data);
          }
          return;
        } else if (data.processing_status === 'failed') {
          setUploadStatus('error');
          toast({
            title: "Processing Failed",
            description: data.processing_error || "Failed to process resume.",
            variant: "destructive",
          });
          return;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000);
        } else {
          setUploadStatus('error');
          toast({
            title: "Processing Timeout",
            description: "Resume processing is taking longer than expected.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Status check error:', error);
        setUploadStatus('error');
      }
    };

    setTimeout(checkStatus, 1000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Resume - Powered by Gemini 2.0 Flash
        </CardTitle>
        <CardDescription>
          Upload your resume for AI-powered parsing with 90%+ accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : uploadStatus === 'completed'
              ? 'border-green-500 bg-green-50'
              : uploadStatus === 'error'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadStatus === 'uploading' && (
            <>
              <Loader2 className="h-8 w-8 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-sm text-gray-600 mb-4">
                Uploading your resume...
              </p>
            </>
          )}
          
          {uploadStatus === 'processing' && (
            <>
              <Loader2 className="h-8 w-8 mx-auto mb-4 text-blue-500 animate-spin" />
              <p className="text-sm text-gray-600 mb-4">
                Processing with Gemini 2.0 Flash AI...
              </p>
            </>
          )}
          
          {uploadStatus === 'completed' && (
            <>
              <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
              <p className="text-sm text-green-600 mb-4">
                Resume parsed successfully with 90%+ accuracy!
              </p>
            </>
          )}
          
          {uploadStatus === 'error' && (
            <>
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-sm text-red-600 mb-4">
                Upload failed. Please try again.
              </p>
            </>
          )}
          
          {uploadStatus === 'idle' && (
            <>
              <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop your resume here, or click to select
              </p>
            </>
          )}
          
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="resume-upload"
            disabled={isUploading || uploadStatus === 'processing'}
          />
          
          {(uploadStatus === 'idle' || uploadStatus === 'error') && (
            <Button asChild variant="outline" disabled={isUploading}>
              <label htmlFor="resume-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};