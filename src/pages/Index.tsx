import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UploadResume from "@/components/UploadResume";
import ResumeDisplay from "@/components/ResumeDisplay";
import { useState } from "react";

const Index = () => {
  const [uploadedResume, setUploadedResume] = useState(null);
  const [activeTab, setActiveTab] = useState("");

  const handleTabChange = (value: string) => {
    // Toggle functionality - if same tab is clicked, hide sections
    if (activeTab === value) {
      setActiveTab("");
    } else {
      setActiveTab(value);
    }
  };

  const handleBackToTabs = () => {
    setActiveTab("");
    setUploadedResume(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Career Hub</h1>
          <p className="text-muted-foreground text-lg">Manage your professional profile and career opportunities</p>
        </div>
        
        <Card className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-1 h-14">
              <TabsTrigger value="profile-job" className="text-lg font-medium">Profile&Job</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile-job" className="p-6">
              <div className="text-center text-muted-foreground">
                Upload your resume or build a new one with AI assistance
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Upload Resume and Resume Builder Section - Shows when tab is clicked */}
        {activeTab && (
          <div className="max-w-6xl mx-auto mt-6 space-y-6">
            {!uploadedResume ? (
              <>
                <UploadResume 
                  onResumeUploaded={setUploadedResume} 
                  onBack={handleBackToTabs}
                />
                
                {/* Resume Builder Section */}
                <Card>
                  <CardContent className="p-8">
                    {/* Back Button for Resume Builder */}
                    <div className="mb-6">
                      <Button 
                        variant="outline" 
                        onClick={handleBackToTabs}
                        className="flex items-center space-x-2"
                      >
                        <svg 
                          className="h-4 w-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M15 19l-7-7 7-7" 
                          />
                        </svg>
                        <span>Back</span>
                      </Button>
                    </div>
                    
                    {/* Resume Builder Content */}
                    <div className="text-center">
                      <div className="space-y-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto">
                          <svg 
                            className="h-8 w-8 text-white" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M13 10V3L4 14h7v7l9-11h-7z" 
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-foreground mb-2">Resume Builder with Generative AI</h3>
                          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Create a professional resume from scratch using AI-powered assistance. Just answer a few questions and let AI craft your perfect resume.
                          </p>
                        </div>
                        <Button 
                          size="lg" 
                          className="min-w-[250px] bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <svg 
                            className="w-5 h-5 mr-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M13 10V3L4 14h7v7l9-11h-7z" 
                            />
                          </svg>
                          Build Resume with AI
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <ResumeDisplay 
                resumeData={uploadedResume} 
                onBack={handleBackToTabs}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;