'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Code, User } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold text-center mb-12">
          Screen Recording & Python EDI
        </h1>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-6 w-6 text-rose-500" />
                Screen Recording Module
              </CardTitle>
              <CardDescription>
                Record your screen and get AI-generated summaries, quizzes, and
                presentation slides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400">
                  Record, analyze, and discuss your screen captures
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/screen-recording" className="w-full">
                <Button className="w-full bg-rose-500 hover:bg-rose-600">
                  Go to Screen Recording
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-6 w-6 text-green-500" />
                Python EDI
              </CardTitle>
              <CardDescription>
                Create, debug, and improve your Python code with AI-powered 
                assistance and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400">
                  Code, analyze, and improve your Python skills
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/python-code" className="w-full">
                <Button className="w-full bg-green-500 hover:bg-green-600">
                  Go to Python EDI
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-6 w-6 text-green-500" />
                Task History
              </CardTitle>
              <CardDescription>
                View your completed tasks and track your learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-md flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400">
                  Track your progress and see your submissions
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/task-history" className="w-full">
                <Button className="w-full bg-green-500 hover:bg-green-600">
                  View Task History
                </Button>
              </Link>
            </CardFooter>
          </Card> */}
        </div>
      </div>
    </main>
  );
}
