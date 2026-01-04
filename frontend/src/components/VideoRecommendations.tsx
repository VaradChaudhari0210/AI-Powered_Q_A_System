import { useState } from "react";
import { useEffect } from "react";
import { Play } from "lucide-react";

export default function VideoRecommendations({ onVideoSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedVideos, setUploadedVideos] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/videos")
      .then((res) => res.json())
      .then((data) => setUploadedVideos(data));
  }, []);

  const filteredVideos = uploadedVideos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Sources</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => onVideoSelect(video)}
            >
              <div className="flex items-start gap-3">
                <video
                  src={video.file}
                  className="w-16 h-12 rounded flex-shrink-0 object-cover"
                  controls={false}
                  preload="metadata"
                  poster={video.thumbnail}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-1">{video.duration}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {video.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No videos found</div>
            <div className="text-sm text-gray-600">
              Try adjusting your search terms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}