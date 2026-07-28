"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError(err.message || "Failed to access camera. Please check permissions.");
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (open) {
      startStream();
    } else {
      stopStream();
    }
    return () => stopStream();
  }, [open, startStream, stopStream]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
            onCapture(file);
            onOpenChange(false);
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] p-0 overflow-hidden bg-black border-gray-800">
        <DialogHeader className="p-4 bg-gray-900/80 absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between">
          <DialogTitle className="text-white text-sm font-medium">Take Photo</DialogTitle>
          <DialogDescription className="sr-only">Capture a photo directly from your camera.</DialogDescription>
          <div className="flex gap-2 absolute right-4 top-2">
            <Button type="button" variant="ghost" size="icon" onClick={toggleCamera} className="text-white hover:bg-white/20 h-8 w-8 rounded-full">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20 h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative w-full aspect-[3/4] bg-black flex items-center justify-center min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-xs">Accessing camera...</p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="bg-red-500/10 p-3 rounded-full mb-3">
                <Camera className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-400 text-sm font-medium mb-1">Camera Error</p>
              <p className="text-gray-400 text-xs mb-4">{error}</p>
              <Button type="button" onClick={startStream} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Retry
              </Button>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${error ? 'hidden' : ''}`}
          />
        </div>

        {!error && (
          <div className="p-4 bg-gray-900/90 absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-8 pt-4">
            <button
              type="button"
              onClick={handleCapture}
              disabled={isLoading}
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
