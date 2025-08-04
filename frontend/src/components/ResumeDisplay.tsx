@@ .. @@
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
-          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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