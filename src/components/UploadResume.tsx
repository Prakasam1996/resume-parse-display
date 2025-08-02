import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadResumeProps {
  onResumeUploaded: (resumeData: any) => void;
  onBack?: () => void;
}

const UploadResume = ({ onResumeUploaded, onBack }: UploadResumeProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload resume using edge function without authentication
      const response = await fetch(`https://gppmripjhjhltrdtgsus.supabase.co/functions/v1/parse-resume`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast({
        title: "Resume processed successfully!",
        description: "Your resume has been analyzed and is ready to view.",
      });

      // Transform the parsed data to match ResumeDisplay component
      const transformedData = {
        personalInfo: result.personal_info || {
          name: "",
          email: "",
          phone: "",
          role: ""
        },
        profileScore: {
          skills: result.skills_score || 0,
          certifications: 0,
          experience: result.experience_score || 0,
          total: result.overall_score || 0
        },
        skillsDistribution: Array.isArray(result.skills) ? result.skills.map((skill: any) => ({
          skill: skill.name || '',
          years: Math.floor(skill.level / 10) || 1
        })) : [],
        careerTimeline: Array.isArray(result.experience) ? result.experience.map((exp: any) => ({
          role: exp.position || '',
          company: exp.company || '',
          year: exp.startDate ? new Date(exp.startDate).getFullYear().toString() : ''
        })) : [],
        professionalSummary: result.summary || "No summary available.",
        workExperience: Array.isArray(result.experience) ? result.experience.map((exp: any) => ({
          company: exp.company || '',
          role: exp.position || '',
          duration: `${exp.startDate || ''} - ${exp.endDate || 'Present'}`,
          description: exp.description || ''
        })) : [],
        education: Array.isArray(result.education) ? result.education.map((edu: any) => ({
          institution: edu.institution || '',
          year: edu.year || '',
          course: `${edu.degree || ''} ${edu.field || ''}`.trim()
        })) : [],
        languages: Array.isArray(result.languages) ? result.languages.map((lang: any) => 
          typeof lang === 'string' ? lang : lang.name || ''
        ) : [],
        certifications: Array.isArray(result.certifications) ? result.certifications.map((cert: any) => 
          typeof cert === 'string' ? cert : cert.name || ''
        ) : []
      };

      onResumeUploaded(transformedData);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your resume. Please try again.",
        variant: "destructive"
      });
    } finally {
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
                <p className="text-muted-foreground">Processing your resume...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
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