import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, Loader2, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createWorker } from "tesseract.js";

const DOMESTIC_CITIES = ["Bangalore", "Chennai", "Hyderabad", "Vellore", "Madurai"];

interface OCRCameraOverlayProps {
  open: boolean;
  onClose: () => void;
  onResult: (text: string, detectedCity?: string) => void;
}

export default function OCRCameraOverlay({ open, onClose, onResult }: OCRCameraOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError("");
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open, facingMode, startCamera]);

  const switchCamera = () => {
    setFacingMode((f) => (f === "environment" ? "user" : "environment"));
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    try {
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const text = data.text.trim();
      if (!text) {
        setError("No text detected. Try again with better lighting.");
        setProcessing(false);
        return;
      }

      // Detect city
      const lower = text.toLowerCase();
      const detectedCity = DOMESTIC_CITIES.find((city) => lower.includes(city.toLowerCase()));

      onResult(text, detectedCity);
      onClose();
    } catch {
      setError("OCR processing failed. Please try again.");
    }
    setProcessing(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: "hsl(220 100% 10% / 0.95)" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 glass-strong" style={{ borderBottom: "1px solid hsl(43 74% 52% / 0.2)" }}>
        <h3 className="font-display font-semibold text-foreground text-sm">📷 Scan Address</h3>
        <div className="flex items-center gap-2">
          <button onClick={switchCamera} className="p-2 rounded-full hover:bg-muted transition-colors">
            <SwitchCamera className="h-5 w-5 text-muted-foreground" />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* Scanning Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[80%] h-[35%] rounded-xl"
            style={{
              border: "2px solid hsl(43 74% 52% / 0.7)",
              boxShadow: "0 0 40px hsl(43 74% 52% / 0.15), inset 0 0 20px hsl(43 74% 52% / 0.05)",
            }}
          />
        </div>
        {/* Guide text */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-white/70">Align the address text within the gold frame</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-center text-xs text-destructive bg-destructive/10">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="p-4 glass-strong" style={{ borderTop: "1px solid hsl(43 74% 52% / 0.2)" }}>
        {processing ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(43 74% 52%)" }} />
            <p className="text-sm font-semibold text-foreground">Reading Address...</p>
          </div>
        ) : (
          <Button
            onClick={captureAndProcess}
            className="w-full h-12 gradient-gold border-0 font-semibold text-base gap-2"
            style={{ color: "hsl(220 100% 10%)" }}
          >
            <Camera className="h-5 w-5" />
            Capture & Process
          </Button>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
