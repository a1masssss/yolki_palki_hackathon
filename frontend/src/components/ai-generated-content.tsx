"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, HelpCircle, Layout } from "lucide-react"

export default function AIGeneratedContent() {
  const [activeTab, setActiveTab] = useState("summary")

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Generated Content</CardTitle>
        <CardDescription>Content generated based on your screen recording</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Quiz
            </TabsTrigger>
            <TabsTrigger value="slides" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Slides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recording Summary</h3>
              <p>
                This is a placeholder for the AI-generated summary of your screen recording. In a real implementation,
                this would contain a concise overview of the content captured in your recording, highlighting key points
                and important information.
              </p>
              <p>
                The summary would identify main topics, extract important data points, and provide context about what
                was shown in the recording. This helps users quickly understand the content without having to rewatch
                the entire recording.
              </p>
              <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                <h4 className="font-medium mb-2">Key Points:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>First important point from the recording</li>
                  <li>Second key concept or information</li>
                  <li>Third notable element from the screen capture</li>
                  <li>Fourth significant detail worth highlighting</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Knowledge Check Quiz</h3>
              <p className="mb-4">Test your understanding of the content from the recording with these questions:</p>

              <div className="space-y-6">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Question 1:</h4>
                  <p className="mb-3">What is the main topic covered in the recording?</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="radio" id="q1a" name="q1" className="mr-2" />
                      <label htmlFor="q1a">Topic A</label>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" id="q1b" name="q1" className="mr-2" />
                      <label htmlFor="q1b">Topic B</label>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" id="q1c" name="q1" className="mr-2" />
                      <label htmlFor="q1c">Topic C</label>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Question 2:</h4>
                  <p className="mb-3">Which of the following was demonstrated in the recording?</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="radio" id="q2a" name="q2" className="mr-2" />
                      <label htmlFor="q2a">Feature X</label>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" id="q2b" name="q2" className="mr-2" />
                      <label htmlFor="q2b">Feature Y</label>
                    </div>
                    <div className="flex items-center">
                      <input type="radio" id="q2c" name="q2" className="mr-2" />
                      <label htmlFor="q2c">Feature Z</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="slides">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Presentation Slides</h3>
              <p className="mb-4">Key points from your recording formatted as presentation slides:</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-2 text-center font-medium">
                    Slide 1: Introduction
                  </div>
                  <div className="p-4 h-40 flex flex-col justify-center">
                    <h4 className="text-center font-bold mb-2">Main Topic</h4>
                    <ul className="text-sm list-disc pl-5">
                      <li>Key point 1</li>
                      <li>Key point 2</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-2 text-center font-medium">Slide 2: Details</div>
                  <div className="p-4 h-40 flex flex-col justify-center">
                    <h4 className="text-center font-bold mb-2">Important Details</h4>
                    <ul className="text-sm list-disc pl-5">
                      <li>Detail 1</li>
                      <li>Detail 2</li>
                      <li>Detail 3</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-2 text-center font-medium">Slide 3: Analysis</div>
                  <div className="p-4 h-40 flex flex-col justify-center">
                    <h4 className="text-center font-bold mb-2">Key Insights</h4>
                    <ul className="text-sm list-disc pl-5">
                      <li>Insight 1</li>
                      <li>Insight 2</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-200 dark:bg-slate-700 p-2 text-center font-medium">Slide 4: Conclusion</div>
                  <div className="p-4 h-40 flex flex-col justify-center">
                    <h4 className="text-center font-bold mb-2">Summary</h4>
                    <p className="text-sm text-center">
                      Final thoughts and conclusions based on the recording content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
