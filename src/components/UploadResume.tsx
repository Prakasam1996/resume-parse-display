import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, ArrowLeft, LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authTab, setAuthTab] = useState('signin');
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully."
        });
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "There was an error signing in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account."
        });
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuthenticating(false);
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
            <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
            <CardDescription>
              Please sign in or create an account to upload and analyze your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <div className="text-center mb-4">
                  <LogIn className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Welcome back! Enter your credentials to continue.
                  </p>
                </div>
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Password</span>
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <div className="text-center mb-4">
                  <UserIcon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Create a new account to get started with resume analysis.
                  </p>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Password</span>
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <span>Confirm Password</span>
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isAuthenticating}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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