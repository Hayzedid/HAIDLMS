import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { proctoringApi } from '../../api';
import toast from 'react-hot-toast';

interface Props {
  sessionId?: string; // NEW: Required for API integration
  userId?: string; // NEW: Required for API integration
  onCapture?: (imageData: string) => void;
  captureInterval?: number; // Interval in seconds
  width?: number;
  height?: number;
  showPreview?: boolean;
  onError?: (error: string) => void;
  autoUpload?: boolean; // NEW: Auto-upload to backend
}

export default function WebcamCapture({
  sessionId,
  userId,
  onCapture,
  captureInterval = 10,
  width = 640,
  height = 480,
  showPreview = true,
  onError,
  autoUpload = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: React Query mutation for uploading face captures
  // The enhanced backend automatically detects violations:
  // - 0 faces → "no_face" violation (high severity)
  // - >1 faces → "multiple_faces" violation (critical severity)
  // - face_match_score < 0.7 → "face_not_recognized" violation (high severity)
  const uploadFaceCaptureMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; facesDetected: number }) => {
      if (!sessionId || !userId) {
        throw new Error('Session ID and User ID are required');
      }
      return await proctoringApi.recordFaceCapture({
        session_id: sessionId,
        user_id: userId,
        image_url: data.imageUrl,
        faces_detected: data.facesDetected,
        face_match_score: 0.95, // Placeholder - in production, use actual face detection
      });
    },
    onSuccess: (response) => {
      // Violations are auto-detected on backend, no action needed here
      console.log('[WebcamCapture] Face capture uploaded successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to upload face capture';
      console.error('[WebcamCapture] Upload failed:', error);
      // Don't show toast for every capture failure to avoid spam
    },
  });

  useEffect(() => {
    startWebcam();

    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    if (isActive && onCapture) {
      // Start periodic capture
      intervalRef.current = setInterval(() => {
        captureFrame();
      }, captureInterval * 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isActive, captureInterval, onCapture]);

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setIsActive(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access webcam';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('[WebcamCapture] Error accessing webcam:', err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsActive(false);
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      return null;
    }

    // Draw video frame to canvas
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Call the original callback
    if (onCapture) {
      onCapture(imageData);
    }

    // NEW: Auto-upload to backend with enhanced API
    if (autoUpload && sessionId && userId) {
      // Detect faces (placeholder - in production, use actual face detection library)
      const facesDetected = 1; // TODO: Integrate actual face detection

      uploadFaceCaptureMutation.mutate({
        imageUrl: imageData,
        facesDetected,
      });
    }

    return imageData;
  };

  const manualCapture = () => {
    const imageData = captureFrame();
    return imageData;
  };

  return (
    <div style={{ position: 'relative' }}>
      {showPreview && (
        <div
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {error && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '1rem',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📷</div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Webcam Access Required
                </div>
                <div style={{ fontSize: '14px', color: '#ccc' }}>{error}</div>
              </div>
            </div>
          )}

          {isActive && !error && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(220, 38, 38, 0.9)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              RECORDING
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for capturing frames */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={width}
        height={height}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Export for external use
export { WebcamCapture };
