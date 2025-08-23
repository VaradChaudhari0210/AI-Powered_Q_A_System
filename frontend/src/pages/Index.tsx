import { useState } from "react";
import VideoRecommendations from "@/components/VideoRecommendations";
import ChatInterface from "@/components/ChatInterface";
import VideoPlayer from "@/components/VideoPlayer";

export default function Index() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [videoRef, setVideoRef] = useState(null);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleQuerySubmit = async (query: string) => {
    setCurrentQuery(query);
    setChatMessages((prev) => [...prev, { type: "user", content: query }]);

    try {
      const response = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query,video_title: selectedVideo.title }),
      });

      const data = await response.json();

      const answerMessage = {
        type: "assistant",
        content: data.answer_translated, // Show translated answer
        meta: {
          questionLanguage: data.question_language,
          videoLanguage: data.video_language,
          answerOriginal: data.answer_original,
        },
        timestamps: data.segments.map((seg) => ({
          time: `${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s`,
          description: `${seg.text}`,
          speaker: seg.speaker,
          startTime: seg.start,
        })),
      };

      setChatMessages((prev) => [...prev, answerMessage]);
    } catch (error) {
      console.error("Error fetching answer:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "❌ Sorry, there was an error fetching the answer.",
        },
      ]);
    }
  };

  const handlePlaySegment = (startTime: number) => {
    if (videoRef?.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Left Panel - Video Recommendations */}
      <div className="w-80 border-r border-gray-700 flex flex-col">
        <VideoRecommendations onVideoSelect={handleVideoSelect} />
      </div>

      {/* Center Panel - Chat Interface */}
      <div className="flex-1 border-r border-gray-700 flex flex-col">
        <ChatInterface
          messages={chatMessages}
          onQuerySubmit={handleQuerySubmit}
          onPlaySegment={handlePlaySegment}
        />
      </div>

      {/* Right Panel - Video Player */}
      <div className="w-96 flex flex-col">
        <VideoPlayer
          selectedVideo={selectedVideo}
          currentQuery={currentQuery}
          setVideoRef={setVideoRef}
        />
      </div>
    </div>
  );
}
