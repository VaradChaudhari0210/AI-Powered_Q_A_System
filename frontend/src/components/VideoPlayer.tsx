import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function VideoPlayer({ selectedVideo, currentQuery, setVideoRef }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const videoElementRef = useRef(null);

  useEffect(() => {
    if (setVideoRef && videoElementRef.current) {
      setVideoRef({ current: videoElementRef.current });
    }
  }, [setVideoRef, selectedVideo]);

  const sampleTimestamps = [
    {
      time: "0:30",
      title: "Introduction",
      description: "Overview of the main topic",
    },
    {
      time: "2:15",
      title: "Getting Started",
      description: "Setting up the environment",
    },
    {
      time: "5:42",
      title: "Core Concepts",
      description: "Understanding the fundamentals",
    },
    {
      time: "8:20",
      title: "Practical Example",
      description: "Hands-on demonstration",
    },
    {
      time: "12:10",
      title: "Advanced Topics",
      description: "Deep dive into complex features",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Studio</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedVideo ? (
          <div className="p-4 space-y-4">
            {/* Video Player */}
            <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative">
              <video
              key={selectedVideo?.file}
                ref={videoElementRef}
                controls
                className="w-full h-full rounded-lg"
              >
                <source src={selectedVideo?.file} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Tabs */}
            {/* <div className="border-b border-gray-700">
              <div className="flex gap-6">
                <button
                  className={`pb-2 px-1 text-sm font-medium ${
                    activeTab === "overview"
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("overview")}
                >
                  Audio Overview
                </button>
                <button
                  className={`pb-2 px-1 text-sm font-medium ${
                    activeTab === "timestamps"
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("timestamps")}
                >
                  Timestamps
                </button>
                <button
                  className={`pb-2 px-1 text-sm font-medium ${
                    activeTab === "notes"
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("notes")}
                >
                  Notes
                </button>
              </div>
            </div> */}

            {/* Tab Content */}
            {/* <div className="space-y-4">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-400">
                        Create an Audio Overview in more languages!
                      </span>
                      <span className="text-xs text-blue-500 underline cursor-pointer">
                        Learn more
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">Deep Dive conversation</h3>
                        <p className="text-sm text-gray-400">Two hosts</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Customize
                      </Button>
                      <Button size="sm">Generate</Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timestamps" && (
                <div className="space-y-3">
                  {sampleTimestamps.map((timestamp, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono flex-shrink-0">
                          {timestamp.time}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">
                            {timestamp.title}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {timestamp.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-4">
                  <Button className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add note
                  </Button>

                  <Textarea
                    placeholder="Add your notes here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[200px] bg-gray-800 border-gray-600"
                  />

                  <div className="flex gap-2 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-white">
                      <Clock className="w-4 h-4" />
                      Study guide
                    </button>
                    <button className="flex items-center gap-1 hover:text-white">
                      Briefing doc
                    </button>
                  </div>
                </div>
              )}
            </div> */}
          </div>
        ) : (
          <div className="p-4 h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a video from the recommendations to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
