import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface Skill {
  name: string;
  level: string;
}

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState('personal');

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: '',
    email: '',
    phone: ''
  });

  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([
    { company: '', position: '', startDate: '', endDate: '', description: '' }
  ]);
  const [education, setEducation] = useState<Education[]>([
    { institution: '', degree: '', field: '', year: '' }
  ]);
  const [skills, setSkills] = useState<Skill[]>([
    { name: '', level: 'Beginner' }
  ]);

  const addExperience = () => {
    setExperiences([...experiences, { company: '', position: '', startDate: '', endDate: '', description: '' }]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experiences];
    updated[index][field] = value;
    setExperiences(updated);
  };

  const addEducation = () => {
    setEducation([...education, { institution: '', degree: '', field: '', year: '' }]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const addSkill = () => {
    setSkills([...skills, { name: '', level: 'Beginner' }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updated = [...skills];
    updated[index][field] = value;
    setSkills(updated);
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      const prompt = `Generate an improved professional summary and enhanced descriptions for the following resume data:
      
Personal Info: ${JSON.stringify(personalInfo)}
Current Summary: ${summary}
Experience: ${JSON.stringify(experiences)}
Education: ${JSON.stringify(education)}
Skills: ${JSON.stringify(skills)}

Please provide:
1. An enhanced professional summary
2. Improved descriptions for each work experience
3. Suggestions for skill improvements

Format the response as JSON with these keys: enhancedSummary, improvedExperiences, skillSuggestions`;

      const { data, error } = await supabase.functions.invoke('generate-resume-content', {
        body: { prompt }
      });

      if (error) throw error;

      if (data.enhancedSummary) {
        setSummary(data.enhancedSummary);
      }

      if (data.improvedExperiences && Array.isArray(data.improvedExperiences)) {
        const updatedExperiences = [...experiences];
        data.improvedExperiences.forEach((improved: any, index: number) => {
          if (updatedExperiences[index]) {
            updatedExperiences[index].description = improved.description || updatedExperiences[index].description;
          }
        });
        setExperiences(updatedExperiences);
      }

      toast({
        title: "AI Enhancement Complete",
        description: "Your resume content has been enhanced with AI suggestions.",
      });
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast({
        title: "AI Enhancement Failed",
        description: "Failed to enhance resume content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const steps = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'summary', label: 'Summary' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'preview', label: 'Preview' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">AI Resume Builder</h1>
          <p className="text-muted-foreground text-lg">Create a professional resume with AI assistance</p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === step.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${currentStep === step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-px bg-border mx-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="hidden" />

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      placeholder="john.doe@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentStep('summary')}>
                    Next: Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Summary */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Professional Summary
                  <Button
                    variant="outline"
                    onClick={generateWithAI}
                    disabled={isGenerating}
                    className="flex items-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isGenerating ? 'Generating...' : 'Enhance with AI'}</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Write a brief professional summary highlighting your key skills and experience..."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('personal')}>
                    Previous
                  </Button>
                  <Button onClick={() => setCurrentStep('experience')}>
                    Next: Experience
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Experience */}
          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Work Experience
                  <Button
                    variant="outline"
                    onClick={addExperience}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Experience</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {experiences.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Experience {index + 1}</h3>
                      {experiences.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeExperience(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <Label>Position</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          placeholder="Job Title"
                        />
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          placeholder="MM/YYYY"
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          value={exp.endDate}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          placeholder="MM/YYYY or Present"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder="Describe your role and achievements..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('summary')}>
                    Previous
                  </Button>
                  <Button onClick={() => setCurrentStep('education')}>
                    Next: Education
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Education
                  <Button
                    variant="outline"
                    onClick={addEducation}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Education</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {education.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Education {index + 1}</h3>
                      {education.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEducation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          placeholder="University Name"
                        />
                      </div>
                      <div>
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          placeholder="Bachelor's, Master's, etc."
                        />
                      </div>
                      <div>
                        <Label>Field of Study</Label>
                        <Input
                          value={edu.field}
                          onChange={(e) => updateEducation(index, 'field', e.target.value)}
                          placeholder="Computer Science, Business, etc."
                        />
                      </div>
                      <div>
                        <Label>Year</Label>
                        <Input
                          value={edu.year}
                          onChange={(e) => updateEducation(index, 'year', e.target.value)}
                          placeholder="2020"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('experience')}>
                    Previous
                  </Button>
                  <Button onClick={() => setCurrentStep('skills')}>
                    Next: Skills
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Skills
                  <Button
                    variant="outline"
                    onClick={addSkill}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Skill</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Input
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        placeholder="Skill name"
                        className="flex-1"
                      />
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(index, 'level', e.target.value)}
                        className="px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                      </select>
                      {skills.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSkill(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('education')}>
                    Previous
                  </Button>
                  <Button onClick={() => setCurrentStep('preview')}>
                    Preview Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Resume Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Info Preview */}
                <div className="text-center pb-4 border-b">
                  <h1 className="text-3xl font-bold">{personalInfo.name || 'Your Name'}</h1>
                  <div className="flex justify-center flex-wrap gap-4 mt-2 text-muted-foreground">
                    {personalInfo.email && <span>{personalInfo.email}</span>}
                    {personalInfo.phone && <span>{personalInfo.phone}</span>}
                  </div>
                </div>

                {/* Summary Preview */}
                {summary && (
                  <div>
                    <h2 className="text-xl font-bold mb-2">Professional Summary</h2>
                    <p className="text-muted-foreground">{summary}</p>
                  </div>
                )}

                {/* Experience Preview */}
                {experiences.some(exp => exp.company || exp.position) && (
                  <div>
                    <h2 className="text-xl font-bold mb-3">Work Experience</h2>
                    <div className="space-y-4">
                      {experiences.filter(exp => exp.company || exp.position).map((exp, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{exp.position || 'Position'}</h3>
                              <p className="text-primary">{exp.company || 'Company'}</p>
                            </div>
                            <Badge variant="outline">
                              {exp.startDate || 'Start'} - {exp.endDate || 'End'}
                            </Badge>
                          </div>
                          {exp.description && (
                            <p className="text-muted-foreground mt-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Preview */}
                {education.some(edu => edu.institution || edu.degree) && (
                  <div>
                    <h2 className="text-xl font-bold mb-3">Education</h2>
                    <div className="space-y-2">
                      {education.filter(edu => edu.institution || edu.degree).map((edu, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold">{edu.institution || 'Institution'}</h3>
                            <p className="text-muted-foreground">{edu.degree} in {edu.field}</p>
                          </div>
                          <Badge variant="outline">{edu.year || 'Year'}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Preview */}
                {skills.some(skill => skill.name) && (
                  <div>
                    <h2 className="text-xl font-bold mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {skills.filter(skill => skill.name).map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill.name} ({skill.level})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setCurrentStep('skills')}>
                    Previous
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline">
                      Download PDF
                    </Button>
                    <Button>
                      Save Resume
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResumeBuilder;