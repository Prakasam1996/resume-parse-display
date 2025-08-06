import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award } from 'lucide-react';

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
}

interface ResumeDisplayProps {
  resumeData: ResumeData;
}

export const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ resumeData }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {resumeData.personalInfo.name}
          </CardTitle>
          <CardDescription className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {resumeData.personalInfo.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {resumeData.personalInfo.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {resumeData.personalInfo.location}
            </span>
          </CardDescription>
        </CardHeader>
        {resumeData.summary && (
          <CardContent>
            <p className="text-gray-700">{resumeData.summary}</p>
          </CardContent>
        )}
      </Card>

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeData.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{exp.title}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                  </div>
                  <Badge variant="secondary">{exp.duration}</Badge>
                </div>
                <p className="text-gray-700 text-sm">{exp.description}</p>
                {index < resumeData.experience.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeData.education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                  </div>
                  <Badge variant="secondary">{edu.year}</Badge>
                </div>
                {index < resumeData.education.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};