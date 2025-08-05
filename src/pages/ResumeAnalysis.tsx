import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, ExternalLink, Briefcase, GraduationCap, Award } from "lucide-react";

interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

interface Experience {
  company?: string;
  position?: string;
  duration?: string;
  description?: string;
}

interface Education {
  institution?: string;
  degree?: string;
  year?: string;
}

interface ResumeData {
  personal_info?: PersonalInfo;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
}

const ResumeAnalysis = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading resume data
    setTimeout(() => {
      setResumeData({
        personal_info: {
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "+1 (555) 123-4567"
        },
        experience: [
          {
            company: "Tech Corp",
            position: "Software Engineer",
            duration: "2020-2023",
            description: "Developed web applications using React and Node.js"
          }
        ],
        education: [
          {
            institution: "University of Technology",
            degree: "Bachelor of Computer Science",
            year: "2020"
          }
        ],
        skills: ["JavaScript", "React", "Node.js", "Python", "SQL"]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">No resume data found. Please upload a resume first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis</h1>
          <p className="text-gray-600">Detailed breakdown of your resume content</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{resumeData.personal_info?.name || 'Not found'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{resumeData.personal_info?.email || 'Not found'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{resumeData.personal_info?.phone || 'Not found'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resumeData.experience?.map((exp, index) => (
                  <div key={index} className="p-3 bg-accent/30 rounded-lg">
                    <h4 className="font-semibold">{exp.position}</h4>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    <p className="text-sm text-muted-foreground">{exp.duration}</p>
                    {exp.description && (
                      <p className="text-sm mt-2">{exp.description}</p>
                    )}
                  </div>
                )) || <p className="text-muted-foreground">No experience found</p>}
              </div>
            </CardContent>
          </Card>

          {/* Education & Skills */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resumeData.education?.map((edu, index) => (
                    <div key={index} className="p-3 bg-accent/30 rounded-lg">
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-sm text-muted-foreground">{edu.year}</p>
                    </div>
                  )) || <p className="text-muted-foreground">No education found</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  )) || <p className="text-muted-foreground">No skills found</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;