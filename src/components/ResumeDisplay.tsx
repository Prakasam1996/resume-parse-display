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
  Calendar,
  Building,
  Star,
  ArrowLeft
} from 'lucide-react';

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  profileScore: {
    skills: number;
    certifications: number;
    experience: number;
    total: number;
  };
  skillsDistribution: Array<{
    skill: string;
    years: number;
  }>;
  careerTimeline: Array<{
    role: string;
    company: string;
    year: string;
  }>;
  professionalSummary: string;
  workExperience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    year: string;
    course: string;
  }>;
  languages: string[];
  certifications: string[];
}

interface ResumeDisplayProps {
  resumeData: ResumeData;
  onBack?: () => void;
}

const ResumeDisplay = ({ resumeData, onBack }: ResumeDisplayProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
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
      {/* Header Section - Personal Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{resumeData.personalInfo.name}</h1>
              <p className="text-lg text-muted-foreground font-medium">{resumeData.personalInfo.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-foreground">{resumeData.personalInfo.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-foreground">{resumeData.personalInfo.phone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Strength Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-primary" />
            <span>Profile Strength Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(resumeData.profileScore.skills)}`}>
                {resumeData.profileScore.skills}
              </div>
              <p className="text-sm text-muted-foreground">Skills</p>
              <Progress 
                value={resumeData.profileScore.skills} 
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(resumeData.profileScore.certifications)}`}>
                {resumeData.profileScore.certifications}
              </div>
              <p className="text-sm text-muted-foreground">Certifications</p>
              <Progress 
                value={resumeData.profileScore.certifications} 
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(resumeData.profileScore.experience)}`}>
                {resumeData.profileScore.experience}
              </div>
              <p className="text-sm text-muted-foreground">Experience</p>
              <Progress 
                value={resumeData.profileScore.experience} 
                className="mt-2"
              />
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(resumeData.profileScore.total)}`}>
                {resumeData.profileScore.total}
              </div>
              <p className="text-sm text-muted-foreground">Total Score</p>
              <Progress 
                value={resumeData.profileScore.total} 
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Skills Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumeData.skillsDistribution.map((skill, index) => (
              <div key={index} className="bg-accent/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">{skill.skill}</span>
                  <Badge variant="secondary">{skill.years} years</Badge>
                </div>
                <Progress value={(skill.years / 10) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Career Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Career Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resumeData.careerTimeline.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-accent/30 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{item.role}</h3>
                  <p className="text-muted-foreground">{item.company}</p>
                </div>
                <Badge variant="outline">{item.year}</Badge>
              </div>
            ))}
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
          <p className="text-foreground leading-relaxed">{resumeData.professionalSummary}</p>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <span>Work Experience</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {resumeData.workExperience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{exp.role}</h3>
                    <p className="text-primary font-medium">{exp.company}</p>
                  </div>
                  <Badge variant="secondary">{exp.duration}</Badge>
                </div>
                <p className="text-muted-foreground">{exp.description}</p>
                {index < resumeData.workExperience.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span>Education</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resumeData.education.map((edu, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-accent/30 rounded-lg">
                <div>
                  <h3 className="font-semibold text-foreground">{edu.institution}</h3>
                  <p className="text-muted-foreground">{edu.course}</p>
                </div>
                <Badge variant="outline">{edu.year}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Languages className="h-5 w-5 text-primary" />
            <span>Languages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {resumeData.languages.map((language, index) => (
              <Badge key={index} variant="secondary" className="text-sm">
                {language}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Certifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resumeData.certifications.map((cert, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-accent/30 rounded-lg">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-foreground">{cert}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeDisplay;