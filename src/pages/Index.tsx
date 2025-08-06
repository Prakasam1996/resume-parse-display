import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Sparkles } from "lucide-react";
import { UploadResume } from "@/components/UploadResume";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleParseComplete = (resumeData: any) => {
    console.log('Resume parsed:', resumeData);
    // You can store this data in state or navigate to analysis page
    navigate('/analysis', { state: { resumeData } });
  };

  const handleAnalyze = () => {
    if (uploadedFile) {
      navigate('/analysis');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Resume Parser & Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your resume and get instant analysis with AI-powered insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume in PDF, DOC, or DOCX format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadResume onUpload={handleUpload} onParseComplete={handleParseComplete} />
              {uploadedFile && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ {uploadedFile.name} uploaded successfully
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Analysis
              </CardTitle>
              <CardDescription>
                Get detailed insights about your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  Extract personal information
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  Analyze work experience
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  Identify skills and education
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={handleAnalyze}
                disabled={!uploadedFile}
              >
                Analyze Resume
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;