'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { MessageSquare, X, Send, Trash2 } from 'lucide-react';
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { BloodTestsData } from '@/lib/models/Report'; // Import the type for testsData
import { Markdown } from './markdown';
import { cn } from '@/shared/lib/utils';

// Define the type for the richer report context passed from the parent
interface ReportChatContext {
  metadata: {
    patientName?: string | null;
    patientAge?: string | null;
    patientSex?: string | null;
    referringDoctor?: string | null;
    labName?: string | null;
    sampleDate?: string | null;
    reportDate?: string | null;
    labDirector?: string | null;
    labContact?: string | null;
  };
  testsData?: BloodTestsData | null; // Include the structured tests data
}

// Define props for the Chatbot component
interface ChatbotProps {
  reportContext: ReportChatContext | null | string;
}

export default function Chatbot({ reportContext: reportContextString }: ChatbotProps) { // Accept richer context prop
  const reportContext = JSON.parse(reportContextString as unknown as string);
  const [isOpen, setIsOpen] = useState(false);

  // Pass reportContext in the body to the useChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages
  } = useChat({
    body: { // Send the richer context
      reportContext,
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  // Function to clear chat messages
  const clearChat = () => {
    setMessages([]);
  };

  // Scroll to bottom of messages when new message appears or chat opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    } else if (isOpen && messages.length === 0) {
      // Optional: handle scrolling when chat is opened but empty
    }
  }, [messages, isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary/90 dark:text-primary-foreground dark:hover:bg-primary/90"
          onClick={toggleChat}
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        // Responsive classes: Full screen on mobile, floating on md+ screens
        <div className="fixed inset-x-0 bottom-0 h-[85vh] bg-card border-t border-border 
                        md:inset-auto md:bottom-6 md:right-6 md:h-[550px] md:w-96 
                        md:border md:rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b bg-muted/40">
            <h3 className="font-semibold text-sm">Ask Hemolyze</h3>
            <div className="flex items-center gap-1">
              {/* Clear Chat Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-7 w-7"
                disabled={messages.length === 0 || isLoading}
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {/* Close Chat Button */}
              <Button variant="ghost" size="icon" onClick={toggleChat} className="h-7 w-7">
                <X className="h-4 w-4" />
                <span className="sr-only">Close chat</span>
              </Button>
            </div>
          </div>

          {/* Message Area */}
          <ScrollArea className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">Ask me anything about your report...</p>
            )}
            {messages.map((m: Message) => (
              <div key={m.id} className={`mb-3 text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={cn(
                  m.role === 'user' ? 'ml-auto rounded-lg p-2 w-fit bg-accent rounded-br-none shadow' : 'bg-transparent',
                )}>
                  <Markdown content={m.content} />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Element to scroll to */}
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your question..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      )}
    </>
  );
} 