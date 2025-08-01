import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, ArrowLeft, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UploadResumeProps {
  onResumeUploaded: (resumeData: any) => void;
  onBack?: () => void;
}

const UploadResume = ({ onResumeUploaded, onBack }: UploadResumeProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "There was an error signing in. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file) || !user) return;

    setIsUploading(true);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Get the auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      // Upload resume using edge function
      const response = await fetch(`https://gppmripjhjhltrdtgsus.supabase.co/functions/v1/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast({
        title: "Resume uploaded successfully!",
        description: "Your resume is being processed. Please wait...",
      });

      // Poll for processing completion
      const resumeId = result.resumeId;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      const pollStatus = async () => {
        try {
          const { data: resumeData, error } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', resumeId)
            .single();

          if (error) throw error;

          if (resumeData.processing_status === 'completed') {
            // Transform the data to match ResumeDisplay component
            const transformedData = {
              personalInfo: resumeData.personal_info || {
                name: "",
                email: "",
                phone: "",
                role: ""
              },
              profileScore: {
                skills: resumeData.skills_score || 0,
                certifications: 0, // Will be calculated from certifications
                experience: resumeData.experience_score || 0,
                total: resumeData.overall_score || 0
              },
              skillsDistribution: Array.isArray(resumeData.skills) ? resumeData.skills.map((skill: any) => ({
                skill: skill.name || '',
                years: Math.floor(skill.level / 10) || 1
              })) : [],
              careerTimeline: Array.isArray(resumeData.experience) ? resumeData.experience.map((exp: any) => ({
                role: exp.position || '',
                company: exp.company || '',
                year: exp.startDate ? new Date(exp.startDate).getFullYear().toString() : ''
              })) : [],
              professionalSummary: resumeData.summary || "No summary available.",
              workExperience: Array.isArray(resumeData.experience) ? resumeData.experience.map((exp: any) => ({
                company: exp.company || '',
                role: exp.position || '',
                duration: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
                description: exp.description || ''
              })) : [],
              education: Array.isArray(resumeData.education) ? resumeData.education.map((edu: any) => ({
                institution: edu.institution || '',
                year: edu.year || '',
                course: `${edu.degree || ''} ${edu.field || ''}`.trim()
              })) : [],
              languages: Array.isArray(resumeData.languages) ? resumeData.languages.map((lang: any) => 
                typeof lang === 'string' ? lang : lang.name || ''
              ) : [],
              certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications.map((cert: any) => 
                typeof cert === 'string' ? cert : cert.name || ''
              ) : []
            };

            onResumeUploaded(transformedData);
            
            toast({
              title: "Resume processed successfully!",
              description: "Your resume has been analyzed and is ready to view.",
            });
          } else if (resumeData.processing_status === 'failed') {
            throw new Error(resumeData.processing_error || 'Processing failed');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollStatus, 1000); // Check again in 1 second
          } else {
            throw new Error('Processing timeout - please try again');
          }
        } catch (error) {
          console.error('Polling error:', error);
          throw error;
        }
      };

      // Start polling
      setTimeout(pollStatus, 2000); // Wait 2 seconds before first check

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your resume. Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        {onBack && (
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
        )}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to upload and analyze your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <LogIn className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mb-4">
                Sign in with your Google account to get started
              </p>
              <Button 
                onClick={signInWithGoogle}
                size="lg"
                className="min-w-[200px]"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>
      )}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Upload Your Resume</CardTitle>
          <CardDescription>
            Upload your resume in PDF, DOC, or DOCX format (max 10MB) to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Uploading and processing your resume...</p>
                <p className="text-sm text-muted-foreground">This may take up to 30 seconds</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports PDF, DOC, and DOCX files up to 10MB
                  </p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                  className="min-w-[200px]"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadResume;