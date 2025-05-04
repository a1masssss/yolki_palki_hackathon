"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Lightbulb } from "lucide-react"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"

type Message = {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

type Hint = {
  id: string
  title: string
  content: string
}

interface ChatAssistanceProps {
  code: string
  taskId?: string
  errorMessage?: string
}

export default function ChatAssistance({ code, taskId, errorMessage = "" }: ChatAssistanceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your Python coding assistant. How can I help you with your code today?",
      sender: "assistant",
      timestamp: new Date(),
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [hints, setHints] = useState<Hint[]>([])
  const [internalErrorMessage, setInternalErrorMessage] = useState<string>("")
  const [hasAddedFirstCodeMessage, setHasAddedFirstCodeMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (errorMessage) {
      setInternalErrorMessage(errorMessage);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (code && code.trim() !== "") {
      const errorPattern = /Error:|Exception:|Traceback \(most recent call last\):/i;
      const codeLines = code.split('\n');
      for (const line of codeLines) {
        if (errorPattern.test(line)) {
          const errorIndex = codeLines.indexOf(line);
          const errorContext = codeLines.slice(errorIndex, errorIndex + 5).join('\n');
          setInternalErrorMessage(errorContext);
          break;
        }
      }
      
      generateHints(code)
    }
  }, [code]);

  const generateHints = (codeString: string) => {
    const newHints: Hint[] = []
    
    if (codeString.includes('for ') || codeString.includes('while ')) {
      newHints.push({
        id: 'loop-optimization',
        title: 'Loop Optimization',
        content: 'Consider using list comprehensions for simple loops to make your code more concise and often faster.'
      })
    }
    
    if (codeString.includes('if ') || codeString.includes('else:')) {
      newHints.push({
        id: 'conditional-simplification',
        title: 'Simplify Conditionals',
        content: 'Multiple if/else statements can often be simplified using dictionaries or more elegant patterns.'
      })
    }
    
    if (!codeString.includes('try:') && !codeString.includes('except ')) {
      newHints.push({
        id: 'error-handling',
        title: 'Error Handling',
        content: 'Consider adding try/except blocks to handle potential errors gracefully.'
      })
    }
    
    if (codeString.includes('def ')) {
      newHints.push({
        id: 'docstrings',
        title: 'Documentation',
        content: 'Add docstrings to your functions to explain what they do, their parameters, and return values.'
      })
    }
    
    newHints.push({
      id: 'general-tip',
      title: 'Python Best Practice',
      content: 'Use meaningful variable names and follow PEP 8 style guidelines for clean, readable code.'
    })
    
    setHints(newHints)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    try {
      const typingMessage: Message = {
        id: "typing",
        content: "Typing...",
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, typingMessage])

      const currentTaskId = taskId || "174";
      
      const response = await fetch(`http://127.0.0.1:8000/python-edi/tasks/${currentTaskId}/assistance/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          message: userMessage.content,
          error_message: internalErrorMessage
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      setMessages((prev) => 
        prev.filter(msg => msg.id !== "typing").concat({
          id: Date.now().toString(),
          content: data.message,
          sender: "assistant",
          timestamp: new Date(),
        })
      )
    } catch (error) {
      console.error("Error getting chat assistance:", error)
      
      setMessages((prev) => 
        prev.filter(msg => msg.id !== "typing").concat({
          id: Date.now().toString(),
          content: "Sorry, I couldn't connect to the assistant at this time. Please try again later.",
          sender: "assistant",
          timestamp: new Date(),
        })
      )
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full border-l">
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              {message.sender === "assistant" && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">AI</AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "user" ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <p>{message.content}</p>
                <div className={`text-xs mt-1 ${message.sender === "user" ? "text-emerald-100" : "text-slate-500"}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {message.sender === "user" && (
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">ME</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your code..."
              className="flex-grow"
            />
            <Button type="submit" size="icon" className="bg-emerald-500 hover:bg-emerald-600">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
