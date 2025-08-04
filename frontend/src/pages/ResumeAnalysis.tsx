@@ .. @@
                 <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
                   <Phone className="h-5 w-5 text-primary" />
                   <div>
                     <p className="text-sm text-muted-foreground">Phone</p>
                     <p className="font-medium">{resumeData.personal_info?.phone || 'Not found'}</p>
                   </div>
                 </div>
-                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
-                  <MapPin className="h-5 w-5 text-primary" />
-                  <div>
-                    <p className="text-sm text-muted-foreground">Location</p>
-                    <p className="font-medium">{resumeData.personal_info?.location || 'Not found'}</p>
-                  </div>
-                </div>
-                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
-                  <ExternalLink className="h-5 w-5 text-primary" />
-                  <div>
-                    <p className="text-sm text-muted-foreground">LinkedIn</p>
-                    <p className="font-medium">{resumeData.personal_info?.linkedin || 'Not found'}</p>
-                  </div>
-                </div>
-                <div className="flex items-center space-x-3 p-3 bg-accent/30 rounded-lg">
-                  <ExternalLink className="h-5 w-5 text-primary" />
-                  <div>
-                    <p className="text-sm text-muted-foreground">Website</p>
-                    <p className="font-medium">{resumeData.personal_info?.website || 'Not found'}</p>
-                  </div>
-                </div>
               </div>
             </CardContent>
           </Card>