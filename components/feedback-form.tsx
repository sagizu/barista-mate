
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/firestore";
import { Loader2 } from "lucide-react";

export function FeedbackForm() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    setIsSuccess(false);
    try {
      await submitFeedback(message);
      setIsSuccess(true);
      setMessage("");
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800" dir="rtl">
      <h3 className="text-lg font-semibold text-right text-white">שלח לנו פידבק</h3>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="יש לך הצעה, רעיון לשיפור או שנתקלת בתקלה? ספר לנו..."
        className="bg-zinc-800 border-zinc-700 text-white"
      />
      <div className="flex justify-between items-center">
        {isSuccess && <p className="text-green-500 text-sm">תודה! הפידבק נשלח בהצלחה.</p>}
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || isSending}
          className="bg-[#C67C4E] text-white hover:bg-[#C67C4E]/90"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              שולח...
            </>
          ) : (
            "שלח פידבק"
          )}
        </Button>
      </div>
    </div>
  );
}
