'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button'; // Assuming Button component exists
import { Input } from '@/shared/components/ui/input'; // Assuming Input component exists
import { MessageSquare, X } from 'lucide-react'; // Using lucide-react for icons

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={toggleChat}
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-[450px] bg-card border border-border rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b bg-muted/40">
            <h3 className="font-semibold text-sm">Ask Hemolyze</h3>
            <Button variant="ghost" size="icon" onClick={toggleChat} className="h-7 w-7">
              <X className="h-4 w-4" />
              <span className="sr-only">Close chat</span>
            </Button>
          </div>

          {/* Message Area (Placeholder) */}
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-sm text-muted-foreground">Ask me anything about your report...</p>
            {/* Messages will go here */}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t">
            <Input
              type="text"
              placeholder="Type your question..."
              className="w-full"
              // Add state and handlers for input later
            />
          </div>
        </div>
      )}
    </>
  );
} 