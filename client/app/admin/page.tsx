"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Tag, 
  AlignLeft,
  Loader2 
} from "lucide-react";

const CATEGORIES = ["Strength", "Nutrition", "Mindset", "Recovery", "Technique", "General"];

export default function AdminPanel() {
  const [coachName, setCoachName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Strength");
  
  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate actions and validate inputs
    if (isSubmitting) return;
    if (!coachName.trim() || !content.trim()  || !category) {
      setError("Please fill out all fields before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/feed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coachName: coachName.trim(),
          content: content.trim(),
          category,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      // Success setup
      setSuccess(true);
      setContent(""); // Clear only the content description; keep the coach name for convenience if they make multiple posts.
      
      // Auto dismiss success notice after 4 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 4000);

    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err.message || "Failed to post update. Please ensure the backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed Board
        </Link>
      </div>

      {/* Main Admin Card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl shadow-black/40">
        <div className="border-b border-zinc-800/60 pb-5 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">
            Publish Live Update
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Broadcast a new coaching tip instantly to all clients.
          </p>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Post Broadcasted!</h4>
              <p className="text-xs text-emerald-500/80 mt-0.5">
                Your message has been saved to MongoDB, Redis cache has been refreshed, and the feed has been updated in real-time.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-4 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Submission Error</h4>
              <p className="text-xs text-rose-500/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Coach Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Coach Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              <User className="w-3.5 h-3.5" /> Coach Name
            </label>
            <input
              type="text"
              placeholder="e.g. Coach Sarah Jenkins"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner disabled:opacity-50"
              required
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              <Tag className="w-3.5 h-3.5" /> Category Topic
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={isSubmitting}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    category === cat
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-400 shadow-sm"
                      : "bg-zinc-950/40 border-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                  } disabled:opacity-50`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Content */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 tracking-wider uppercase">
              <AlignLeft className="w-3.5 h-3.5" /> Message Content
            </label>
            <textarea
              placeholder="Provide actionable training guidelines, nutrition insights, or tips..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={5}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner resize-y min-h-[120px] disabled:opacity-50"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-semibold py-3 px-4 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Broadcasting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish to Live Feed
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
