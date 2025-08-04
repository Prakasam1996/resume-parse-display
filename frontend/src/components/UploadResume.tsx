@@ .. @@
 interface UploadResumeProps {
   onResumeUploaded: (resumeData: any) => void;
   onBack?: () => void;
 }
 
 const UploadResume = ({ onResumeUploaded, onBack }: UploadResumeProps) => {
   const navigate = useNavigate();
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
         personalInfo: {
-          name: result.personal_info?.name || "",
-          email: result.personal_info?.email || "",
-          phone: result.personal_info?.phone || "",
-          role: ""
+          name: result.personal_info?.name || "Name not found",
+          email: result.personal_info?.email || "Email not found", 
+          phone: result.personal_info?.phone || "Phone not found",
+          role: result.personal_info?.role || "Role not specified"
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
-        professionalSummary: result.summary || "No summary available.",
+        professionalSummary: result.summary || "Professional summary not found in resume.",
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
 
       // Navigate to analysis page with the raw parsed data
       navigate('/resume-analysis', { state: { resumeData: result } });
 
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