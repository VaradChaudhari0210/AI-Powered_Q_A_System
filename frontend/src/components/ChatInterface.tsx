import { useState } from "react";
import { Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatInterface({ messages, onQuerySubmit, onPlaySegment }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onQuerySubmit(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center mb-8"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index}>
                {message.type === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 px-4 py-3 rounded-lg max-w-lg">
                      {/* Main Answer */}
                      <div className="mb-3">
                        <div className="text-xs text-green-400 font-semibold mb-1">💡 Answer:</div>
                        <p className="text-white">{message.content}</p>
                      </div>
                      
                      {/* Language Info */}
                      {message.meta && (
                        <div className="mb-3 p-2 bg-gray-800 rounded text-xs text-gray-400">
                          <div className="flex gap-4">
                            <span><b>Question:</b> {message.meta.questionLanguage?.toUpperCase()}</span>
                            <span><b>Video:</b> {message.meta.videoLanguage?.toUpperCase()}</span>
                          </div>
                          {message.meta.answerOriginal && message.meta.questionLanguage !== message.meta.videoLanguage && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <b>Original ({message.meta.videoLanguage?.toUpperCase()}):</b>
                              <p className="mt-1 text-gray-300">{message.meta.answerOriginal}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Source Segments */}
                      {message.timestamps && message.timestamps.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-blue-400 font-semibold">📍 Source Segments:</div>
                          {message.timestamps.map((timestamp, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col gap-1 text-sm border border-gray-600 rounded-lg p-2 bg-gray-800"
                            >
                              <div className="flex justify-between items-center">
                                <span className="bg-blue-600 px-2 py-1 rounded text-xs font-mono">
                                  {timestamp.time}
                                </span>
                                <button
                                  onClick={() => onPlaySegment(timestamp.startTime)}
                                  className="text-xs bg-green-700 hover:bg-green-800 px-2 py-1 rounded"
                                >
                                  ▶️ Play
                                </button>
                              </div>
                              <div className="text-gray-300 text-xs mt-1">
                                <b>{timestamp.speaker}:</b> {timestamp.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about the video content..."
            className="flex-1 bg-gray-800 border-gray-600"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
        {/* <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <span>0 sources</span>
        </div> */}
      </div>
    </div>
  );
}
