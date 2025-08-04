import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Phone, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  MapPin,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ResumeAnalysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resumeData = location.state?.resumeData;

  if (!resumeData) {
    navigate('/');
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Resume Analysis</h1>
          <p className="text-muted-foreground text-lg">Detailed breakdown of your parsed resume data</p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{resumeData.personal_info?.location || 'Not found'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <p className="font-medium">{resumeData.personal_info?.linkedin || 'Not found'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium">{resumeData.personal_info?.website || 'Not found'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Professional Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {resumeData.summary || 'No professional summary found in the resume.'}
              </p>
            </CardContent>
          </Card>

          {/* Overall Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Analysis Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(resumeData.overall_score || 0)}`}>
                    {resumeData.overall_score || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                  <Progress value={resumeData.overall_score || 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(resumeData.skills_score || 0)}`}>
                    {resumeData.skills_score || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Skills Score</p>
                  <Progress value={resumeData.skills_score || 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(resumeData.experience_score || 0)}`}>
                    {resumeData.experience_score || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Experience Score</p>
                  <Progress value={resumeData.experience_score || 0} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(resumeData.education_score || 0)}`}>
                    {resumeData.education_score || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Education Score</p>
                  <Progress value={resumeData.education_score || 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Skills ({resumeData.skills?.length || 0} found)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumeData.skills?.map((skill: any, index: number) => (
                  <div key={index} className="bg-accent/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">{skill.name || 'Unnamed Skill'}</span>
                      <Badge variant="secondary">{skill.level || 0}%</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Category: {skill.category || 'Uncategorized'}
                    </div>
                    <Progress value={skill.level || 0} className="h-2" />
                  </div>
                )) || <p className="text-muted-foreground">No skills found in the resume.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span>Work Experience ({resumeData.experience?.length || 0} positions)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {resumeData.experience?.map((exp: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{exp.position || 'Position not specified'}</h3>
                        <p className="text-primary font-medium">{exp.company || 'Company not specified'}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{exp.startDate || ''} - {exp.endDate || 'Present'}</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{exp.description || 'No description available'}</p>
                    {exp.achievements && exp.achievements.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Key Achievements:</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                          {exp.achievements.map((achievement: string, idx: number) => (
                            <li key={idx}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {index < (resumeData.experience?.length || 0) - 1 && <Separator className="mt-4" />}
                  </div>
                )) || <p className="text-muted-foreground">No work experience found in the resume.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>Education ({resumeData.education?.length || 0} entries)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resumeData.education?.map((edu: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-accent/30 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-foreground">{edu.institution || 'Institution not specified'}</h3>
                      <p className="text-muted-foreground">{edu.degree || 'Degree not specified'} in {edu.field || 'Field not specified'}</p>
                      {edu.gpa && <p className="text-sm text-muted-foreground">GPA: {edu.gpa}</p>}
                    </div>
                    <Badge variant="outline">{edu.year || 'Year not specified'}</Badge>
                  </div>
                )) || <p className="text-muted-foreground">No education information found in the resume.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Languages className="h-5 w-5 text-primary" />
                <span>Languages ({resumeData.languages?.length || 0} languages)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resumeData.languages?.map((lang: any, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {lang.name || lang} - {lang.proficiency || 'Proficiency not specified'}
                  </Badge>
                )) || <p className="text-muted-foreground">No languages found in the resume.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Certifications ({resumeData.certifications?.length || 0} certifications)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resumeData.certifications?.map((cert: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-accent/30 rounded-lg">
                    <Award className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-foreground font-medium">{cert.name || cert}</span>
                      {cert.issuer && <p className="text-sm text-muted-foreground">Issued by: {cert.issuer}</p>}
                      {cert.date && <p className="text-sm text-muted-foreground">Date: {cert.date}</p>}
                    </div>
                  </div>
                )) || <p className="text-muted-foreground">No certifications found in the resume.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;