"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send } from "lucide-react"

type Message = {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

interface ChatAssistanceProps {
  code: string
}

export default function ChatAssistance({ code }: ChatAssistanceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your Python coding assistant. How can I help you with your code today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (code && code.trim() !== "" && messages.length === 1) {
      setTimeout(() => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: "I see you're working on some Python code. Do you have any questions about it?",
          sender: "assistant",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      }, 1000)
    }
  }, [code])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    setTimeout(() => {
      let response = "I'll help you with that. What specific part of the code are you having trouble with?"

      const lowerCaseInput = inputValue.toLowerCase()

      if (lowerCaseInput.includes("error")) {
        response = "Can you share the exact error message you're seeing? That will help me diagnose the issue."
      } else if (lowerCaseInput.includes("function") || lowerCaseInput.includes("def ")) {
        response =
          "Functions in Python are defined using the 'def' keyword followed by the function name and parameters. Make sure your indentation is correct and you're returning values as needed."
      } else if (
        lowerCaseInput.includes("loop") ||
        lowerCaseInput.includes("for ") ||
        lowerCaseInput.includes("while ")
      ) {
        response =
          "Python loops are powerful tools. 'for' loops iterate over sequences, while 'while' loops continue until a condition is false. Remember to properly indent the code inside your loops."
      } else if (lowerCaseInput.includes("list") || lowerCaseInput.includes("array")) {
        response =
          "Lists in Python are versatile data structures. You can create them with square brackets, e.g., `my_list = [1, 2, 3]`. Common operations include append(), insert(), remove(), and accessing elements with indexing."
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full border-l">
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
  )
}
