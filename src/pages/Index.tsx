import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import UploadResume from "@/components/UploadResume";
import ResumeDisplay from "@/components/ResumeDisplay";
import { useState } from "react";

const Index = () => {
  const [uploadedResume, setUploadedResume] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Career Hub</h1>
          <p className="text-muted-foreground text-lg">Manage your professional profile and career opportunities</p>
        </div>
        
        <Card className="max-w-6xl mx-auto">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14">
              <TabsTrigger value="profile" className="text-lg font-medium">Profile</TabsTrigger>
              <TabsTrigger value="job" className="text-lg font-medium">Job</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="p-6">
              {!uploadedResume ? (
                <UploadResume onResumeUploaded={setUploadedResume} />
              ) : (
                <ResumeDisplay resumeData={uploadedResume} />
              )}
            </TabsContent>
            
            <TabsContent value="job" className="p-6">
              {!uploadedResume ? (
                <UploadResume onResumeUploaded={setUploadedResume} />
              ) : (
                <ResumeDisplay resumeData={uploadedResume} />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;