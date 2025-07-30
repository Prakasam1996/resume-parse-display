import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadResumeProps {
  onResumeUploaded: (resumeData: any) => void;
}

const UploadResume = ({ onResumeUploaded }: UploadResumeProps) => {
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

  const simulateResumeExtraction = (fileName: string) => {
    // This simulates the extracted resume data - in real app this would come from backend
    return {
      personalInfo: {
        name: "John Smith",
        email: "john.smith@email.com",
        phone: "+1 (555) 123-4567",
        role: "Senior Software Engineer"
      },
      profileScore: {
        skills: 85,
        certifications: 78,
        experience: 92,
        total: 85
      },
      skillsDistribution: [
        { skill: "JavaScript", years: 5 },
        { skill: "React", years: 4 },
        { skill: "Node.js", years: 3 },
        { skill: "Python", years: 2 },
        { skill: "AWS", years: 3 }
      ],
      careerTimeline: [
        { role: "Senior Software Engineer", company: "TechCorp Inc.", year: "2022-Present" },
        { role: "Software Engineer", company: "StartupXYZ", year: "2020-2022" },
        { role: "Junior Developer", company: "WebSolutions", year: "2019-2020" }
      ],
      professionalSummary: "Experienced software engineer with 5+ years in full-stack development, specializing in modern web technologies including React, Node.js, and cloud platforms. Proven track record of delivering scalable solutions and leading development teams.",
      workExperience: [
        {
          company: "TechCorp Inc.",
          role: "Senior Software Engineer",
          duration: "2022 - Present",
          description: "Lead development of microservices architecture and mentored junior developers."
        },
        {
          company: "StartupXYZ",
          role: "Software Engineer",
          duration: "2020 - 2022",
          description: "Built responsive web applications using React and implemented RESTful APIs."
        }
      ],
      education: [
        {
          institution: "University of Technology",
          year: "2019",
          course: "Bachelor of Computer Science"
        }
      ],
      languages: ["English", "Telugu", "Hindi"],
      certifications: [
        "AWS Certified Solutions Architect",
        "React Developer Certification",
        "Agile Project Management"
      ]
    };
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    
    try {
      // Simulate upload and processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, this would upload to backend and extract resume data
      const extractedData = simulateResumeExtraction(file.name);
      
      toast({
        title: "Resume uploaded successfully!",
        description: "Your resume has been processed and analyzed.",
      });
      
      onResumeUploaded(extractedData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your resume. Please try again.",
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