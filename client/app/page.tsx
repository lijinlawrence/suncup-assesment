"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Clock, 
  Activity, 
  Search, 
  User, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Zap
} from "lucide-react";

interface FeedItem {
  _id: string;
  coachName: string;
  content: string;
  category: string;
  createdAt: string;
}

const CATEGORIES = ["All", "Strength", "Nutrition", "Mindset", "Recovery", "Technique", "General"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Strength: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/5" },
  Nutrition: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/5" },
  Mindset: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", glow: "shadow-indigo-500/5" },
  Recovery: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/5" },
  Technique: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20", glow: "shadow-sky-500/5" },
  General: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20", glow: "shadow-zinc-500/5" },
};

export default function FeedBoard() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"cache" | "database" | null>(null);
  
  // Socket connection states
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting" | "reconnecting">("connecting");
  const socketRef = useRef<Socket | null>(null);

  // Filter/Search states
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch feed items via HTTP
  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/feed`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      
      const result = await res.json();
      setFeedItems(result.data || []);
      setSource(result.source || null);
    } catch (err: any) {
      console.error("Error fetching feed:", err);
      setError(err.message || "Could not retrieve coaching feed. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebSockets and HTTP load
  useEffect(() => {
    fetchFeed();

    // Setup Socket.IO Client connection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    console.log(`Connecting to Socket.io server at ${socketUrl}...`);
    
    const socket = io(socketUrl, {
      reconnectionAttempts: 15,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket.IO connected. ID:", socket.id);
      setConnectionStatus("connected");
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket.IO disconnected. Reason:", reason);
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO Connection Error:", err.message);
      setConnectionStatus("reconnecting");
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log(`Socket.IO Reconnect Attempt #${attempt}...`);
      setConnectionStatus("reconnecting");
    });

    // Listen to real-time feed updates
    socket.on("new_feed_item", (newItem: FeedItem) => {
      console.log("Real-time feed item received:", newItem);
      
      setFeedItems((prev) => {
        // Prevent duplicate socket events by matching ID
        if (prev.some((item) => item._id === newItem._id)) {
          console.log("Duplicate feed item ignored:", newItem._id);
          return prev;
        }
        return [newItem, ...prev];
      });
    });

    return () => {
      console.log("Cleaning up Socket.IO connection...");
      socket.disconnect();
    };
  }, []);

  // Handle manual reconnect trigger (Bonus feature)
  const handleReconnect = () => {
    if (socketRef.current) {
      setConnectionStatus("connecting");
      socketRef.current.connect();
    }
  };

  // Filter & Search Logic
  const filteredFeed = feedItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = 
      item.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Initials generator for avatars
  const getInitials = (name: string) => {
    if (!name) return "CO";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Banner Status Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Socket.IO status */}
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3 h-3 inline-block" /> Live Connected
              </span>
            )}
            
            {connectionStatus === "reconnecting" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <RefreshCw className="w-3 h-3 animate-spin inline-block" /> Reconnecting
              </span>
            )}

            {(connectionStatus === "disconnected" || connectionStatus === "connecting") && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full border border-rose-500/20">
                  <WifiOff className="w-3 h-3 inline-block" /> Offline Mode
                </span>
                <button 
                  onClick={handleReconnect}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-2.5 py-1 rounded-lg border border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Reconnect
                </button>
              </div>
            )}
          </div>

          {/* Database cache source status */}
          {source && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
              {source === "cache" ? (
                <>
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                  Source: Redis Cache
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-indigo-400" />
                  Source: MongoDB (Live)
                </>
              )}
            </span>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchFeed}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Force Reload
        </button>
      </div>

      {/* Main Grid: Search and Feed */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Coaching Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Real-time strategies, workout tips, and mindset advice.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search content, coach or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                  : "bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading / Error states */}
        {loading && feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-zinc-900 rounded-2xl">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-zinc-500 text-sm mt-4 animate-pulse">Loading live coaching feed...</p>
          </div>
        ) : error && feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
            <h3 className="font-semibold text-rose-400">Connection Failed</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-md">{error}</p>
            <button
              onClick={fetchFeed}
              className="mt-6 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-all flex items-center gap-2 cursor-pointer font-medium text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/10 border border-dashed border-zinc-800/60 rounded-2xl">
            <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="font-semibold text-zinc-400">No feed items found</h3>
            <p className="text-zinc-600 text-sm mt-1">
              Try adjusting your category filter or search query.
            </p>
          </div>
        ) : (
          /* Feed Cards Grid */
          <div className="grid grid-cols-1 gap-4">
            {filteredFeed.map((item) => {
              const theme = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General;
              return (
                <div
                  key={item._id}
                  className={`relative group bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 md:p-6 transition-all duration-300 shadow-md ${theme.glow} flex flex-col md:flex-row gap-4 items-start animate-fade-in`}
                >
                  {/* Coach initial avatar */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner">
                    <User className="w-5 h-5 text-indigo-400/80" />
                  </div>

                  {/* Feed contents */}
                  <div className="flex-grow space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200 text-base">
                          {item.coachName}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      
                      {/* Tag Badge */}
                      <span className={`px-2.5 py-0.5 rounded-full text-2xs font-extrabold tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}>
                        {item.category.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
