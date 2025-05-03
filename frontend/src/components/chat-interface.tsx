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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Welcome to the chat! You can discuss the recorded content here.",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for your message. I'm analyzing the recording content to provide relevant insights.",
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
    <div className="flex flex-col h-[600px] border rounded-md bg-white dark:bg-slate-900">
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
                message.sender === "user" ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <p>{message.content}</p>
              <div className={`text-xs mt-1 ${message.sender === "user" ? "text-rose-100" : "text-slate-500"}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>

            {message.sender === "user" && (
              <Avatar className="h-8 w-8 ml-2">
                <AvatarFallback className="bg-rose-100 text-rose-700">ME</AvatarFallback>
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
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button type="submit" size="icon" className="bg-rose-500 hover:bg-rose-600">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
