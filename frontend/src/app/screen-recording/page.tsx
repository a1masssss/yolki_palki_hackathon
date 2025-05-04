"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  StopCircle,
  MessageSquare,
  FileText,
  HelpCircle,
  Upload,
} from "lucide-react";
import Link from "next/link";
import ChatInterface from "@/components/chat-interface";
import AIGeneratedContent from "@/components/ai-generated-content";
import axios from "axios";

export default function ScreenRecordingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState("");

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "monitor",
        },
        audio: true,
      });

      console.log("Stream obtained:", stream);

      const options = { mimeType: "video/webm;codecs=vp9,opus" };
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        console.log("MediaRecorder created with VP9/Opus");
      } catch (e) {
        console.error("VP9/Opus not supported, trying alternative codec", e);
        try {
          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp8,opus",
          });
          console.log("MediaRecorder created with VP8/Opus");
        } catch (e) {
          console.error("No compatible codec found, using default", e);
          mediaRecorderRef.current = new MediaRecorder(stream);
        }
      }

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("Data available event:", event.data.size);
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log(
            "Recorded chunks length:",
            recordedChunksRef.current.length
          );
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log("MediaRecorder stopped");
        console.log(
          "Creating blob from",
          recordedChunksRef.current.length,
          "chunks"
        );

        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        console.log("Blob created:", blob.size, "bytes");

        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
        }
        urlRef.current = URL.createObjectURL(blob);
        console.log("Created blob URL:", urlRef.current);

        setRecordedBlob(blob);
        setRecordingComplete(true);
        setIsRecording(false);

        if (videoRef.current) {
          videoRef.current.src = urlRef.current;
          videoRef.current.load();
        }

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        stream.getTracks().forEach((track) => track.stop());

        const formData = new FormData();

        console.log("Appending blob to FormData:", {
          type: blob.type,
          size: blob.size,
          lastModified: new Date().toISOString(),
        });

        formData.append("video", blob, "screen-recording.webm");

        try {
          console.log("Starting upload to backend...");
          const response = await axios.post(
            "http://127.0.0.1:8000/media/upload",
            formData
          );
          console.log("Upload response:", response.data);

          if (response.data && response.data.video_id) {
            console.log("Video ID received:", response.data.video_id);
            try {
              const summaryResponse = await axios.get(
                `http://127.0.0.1:8000/media/summaries/${response.data.video_id}`
              );
              console.log("Summaries response:", summaryResponse.data);
              setSummaries(summaryResponse.data.summaries);
              console.log("Summaries set to:", summaries);
            } catch (error) {
              console.error("Summaries fetch failed:", error);
            }
          }
        } catch (error: any) {
          console.error("Upload failed with error:", error);
          if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error response status:", error.response.status);
          }
        }
      };

      mediaRecorderRef.current.start(500);
      console.log("Recording started");
      setIsRecording(true);
      setRecordingTime(0);
      recordedChunksRef.current = [];

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting screen recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log("Stopping recording...");
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is a webm file
    if (file.type !== "video/webm") {
      alert("Please upload a .webm file");
      return;
    }

    setIsUploading(true);

    try {
      // Use the file directly instead of creating a new Blob
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
      urlRef.current = URL.createObjectURL(file);

      setRecordedBlob(file);
      setRecordingComplete(true);

      if (videoRef.current) {
        videoRef.current.src = urlRef.current;
        videoRef.current.load();
      }

      const formData = new FormData();
      console.log("Uploading file:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString(),
      });

      // Just append the file directly
      formData.append("video", file);

      try {
        console.log("Starting upload to backend...");
        const response = await axios.post(
          "http://127.0.0.1:8000/media/upload",
          formData
        );
        console.log("Upload response:", response.data);

        if (response.data && response.data.video_id) {
          console.log("Video ID received:", response.data.video_id);
          try {
            const summaryResponse = await axios.get(
              `http://127.0.0.1:8000/media/summaries/${response.data.video_id}`
            );
            console.log("Summaries response:", summaryResponse.data);
            setSummaries(summaryResponse.data.summaries);
          } catch (error) {
            console.error("Summaries fetch failed:", error);
          }
        }
      } catch (error: any) {
        console.error("Upload failed with error:", error);
        if (error.response) {
          console.error("Error response data:", error.response.data);
          console.error("Error response status:", error.response.status);
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Screen Recording Module</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>

        {!recordingComplete ? (
          <div className="flex flex-col items-center justify-center space-y-8 py-12">
            <div className="w-full max-w-2xl aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              {isRecording ? (
                <div className="flex flex-col items-center">
                  <div className="animate-pulse flex items-center mb-4">
                    <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-red-500 font-medium">Recording</span>
                  </div>
                  <div className="text-2xl font-mono">
                    {formatTime(recordingTime)}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center px-4">
                  Click the Record button below to start capturing your screen
                </p>
              )}
            </div>

            {isRecording ? (
              <Button
                size="lg"
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-8 py-6 text-lg rounded-full"
              >
                <StopCircle className="h-6 w-6" />
                Stop Recording
              </Button>
            ) : (
              <div className="flex flex-row gap-4">
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2 px-8 py-6 text-lg rounded-full"
                >
                  <Camera className="h-6 w-6" />
                  Start Recording
                </Button>
                <Button
                  size="lg"
                  onClick={handleUpload}
                  className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2 px-8 py-6 text-lg rounded-full"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-6 w-6" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      Upload Recording
                    </>
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/webm"
                  className="hidden"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <div className="p-4">
                  {recordedBlob ? (
                    <div>
                      <video
                        key={urlRef.current || "no-video"}
                        src={urlRef.current || undefined}
                        ref={videoRef}
                        controls
                        className="w-full rounded-md"
                        autoPlay={false}
                        playsInline
                        muted={false}
                        onError={(e) => console.error("Video error:", e)}
                      />
                    </div>
                  ) : (
                    <p className="text-center py-8">No recording available</p>
                  )}
                </div>
              </Card>

              <Tabs defaultValue="chat">
                <TabsList className="grid grid-cols-2 mb-4 space-x-2">
                  {/* <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger> */}
                  <TabsTrigger
                    value="summary"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    AI Content
                  </TabsTrigger>
                  <TabsTrigger value="help" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Help
                  </TabsTrigger>
                </TabsList>

                {/* <TabsContent value="chat">
                  <ChatInterface summary={summary} />
                </TabsContent> */}

                <TabsContent value="summary">
                  <AIGeneratedContent
                    summaries={summaries}
                    setSummary={setSummary}
                  />
                </TabsContent>

                <TabsContent value="help">
                  <Card>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-4">
                        How to Use This Feature
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <div className="mt-1 bg-rose-100 dark:bg-rose-900 rounded-full p-1">
                            <Camera className="h-4 w-4 text-rose-500 dark:text-rose-300" />
                          </div>
                          <span>
                            Record your screen by clicking the Record button
                          </span>
                        </li>
                        {/* <li className="flex items-start gap-2">
                          <div className="mt-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
                            <MessageSquare className="h-4 w-4 text-slate-500" />
                          </div>
                          <span>Discuss the recording in the Chat tab</span>
                        </li> */}
                        <li className="flex items-start gap-2">
                          <div className="mt-1 bg-emerald-100 dark:bg-emerald-900 rounded-full p-1">
                            <FileText className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
                          </div>
                          <span>
                            View AI-generated summaries, quizzes, and
                            presentation slides
                          </span>
                        </li>
                      </ul>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Recording Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Duration
                      </p>
                      <p className="font-medium">{formatTime(recordingTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Size
                      </p>
                      <p className="font-medium">
                        {recordedBlob
                          ? `${(recordedBlob.size / (1024 * 1024)).toFixed(
                              2
                            )} MB`
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Format
                      </p>
                      <p className="font-medium">WebM</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (recordedBlob) {
                          const url = URL.createObjectURL(recordedBlob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `screen-recording-${new Date()
                            .toISOString()
                            .slice(0, 19)
                            .replace(/:/g, "-")}.webm`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }
                      }}
                    >
                      Download Recording
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setRecordingComplete(false);
                        setRecordedBlob(null);
                      }}
                    >
                      New Recording
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
