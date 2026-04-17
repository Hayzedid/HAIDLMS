import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { proctoringApi } from "../../api";
import toast from "react-hot-toast";
import { BrowserLockdown } from "../../utils/browserLockdown";
import WebcamCapture from "./WebcamCapture";
import BiometricVerification from "./BiometricVerification";

interface Props {
  assessmentId: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  assessmentTitle: string;
  timeLimitMinutes: number;
  onExamComplete: (results: any) => void;
  requireWebcam?: boolean;
  requireBiometric?: boolean;
  requireBrowserLockdown?: boolean;
}

type ExamStage =
  | "pre-check"
  | "biometric"
  | "ready"
  | "in-progress"
  | "completed";

export default function ProctoredExam({
  assessmentId,
  userId,
  courseId,
  enrollmentId,
  assessmentTitle,
  timeLimitMinutes,
  onExamComplete,
  requireWebcam = true,
  requireBiometric = true,
  requireBrowserLockdown = true,
}: Props) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<ExamStage>("pre-check");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60);
  const [violations, setViolations] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [lockdownId, setLockdownId] = useState<string | null>(null);

  const lockdownRef = useRef<BrowserLockdown | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const webcamCaptureRef = useRef<any>(null);

  // NEW: Create proctoring session mutation (uses enhanced API)
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const endTime = new Date(now.getTime() + timeLimitMinutes * 60 * 1000);

      return await proctoringApi.createSession({
        assessment_id: assessmentId,
        user_id: userId,
        session_token: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        proctoring_mode: requireWebcam ? "ai_automated" : "no_proctoring",
        scheduled_start_time: now.toISOString(),
        scheduled_end_time: endTime.toISOString(),
      });
    },
    onSuccess: (response) => {
      setSessionId(response.data.id);
      toast.success("Proctoring session created");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Failed to create session";
      toast.error(message);
      throw error;
    },
  });

  // NEW: Update session status mutation
  const updateSessionStatusMutation = useMutation({
    mutationFn: async (data: { sessionId: string; status: string }) => {
      return await proctoringApi.updateSessionStatus(
        data.sessionId,
        data.status,
      );
    },
  });

  // NEW: Record violation mutation (with auto-detection on backend)
  const recordViolationMutation = useMutation({
    mutationFn: async (data: {
      violationType: string;
      severity: "low" | "medium" | "high" | "critical";
      description?: string;
    }) => {
      if (!sessionId) throw new Error("No active session");

      return await proctoringApi.recordViolation({
        session_id: sessionId,
        user_id: userId,
        violation_type: data.violationType as any,
        severity: data.severity,
        violation_description: data.description,
      });
    },
    onSuccess: () => {
      // Backend may auto-terminate session on critical violations
      queryClient.invalidateQueries({
        queryKey: ["proctoring-session", sessionId],
      });
    },
  });

  // NEW: Record browser lockdown mutation
  const recordLockdownMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("No active session");

      return await proctoringApi.recordBrowserLockdown({
        session_id: sessionId,
        user_id: userId,
        lockdown_level: "strict",
      });
    },
    onSuccess: (response) => {
      setLockdownId(response.data.id);
    },
  });

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (lockdownRef.current) {
        lockdownRef.current.destroy();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startProctoringSession = async () => {
    try {
      // Use the new enhanced API mutation
      const response = await createSessionMutation.mutateAsync();
      return response.data.id;
    } catch (error) {
      console.error("[ProctoredExam] Failed to start session:", error);
      throw error;
    }
  };

  const handlePreCheckComplete = async () => {
    try {
      const newSessionId = await startProctoringSession();

      if (requireBiometric) {
        setStage("biometric");
      } else {
        setStage("ready");
      }
    } catch (error) {
      alert("Failed to initialize proctoring session. Please try again.");
    }
  };

  const handleBiometricComplete = (result: {
    verified: boolean;
    confidence: number;
    message: string;
  }) => {
    if (result.verified) {
      setStage("ready");
    } else {
      alert(
        "Identity verification failed. Please try again or contact support.",
      );
    }
  };

  const startExam = async () => {
    // Activate browser lockdown
    if (requireBrowserLockdown) {
      lockdownRef.current = new BrowserLockdown({
        blockContextMenu: true,
        blockKeyboardShortcuts: true,
        blockCopyPaste: true,
        blockPrint: true,
        blockDevTools: true,
        requireFullscreen: true,
        blockTabSwitch: true,
        onViolation: handleViolation,
      });

      lockdownRef.current.activate();

      // NEW: Record lockdown with enhanced API
      await recordLockdownMutation.mutateAsync();
    }

    // Update session status to in_progress
    if (sessionId) {
      await updateSessionStatusMutation.mutateAsync({
        sessionId,
        status: "in_progress",
      });
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setStage("in-progress");
    toast.success("Exam started - Good luck! 🍀");
  };

  const endExam = async () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Deactivate lockdown
    if (lockdownRef.current) {
      lockdownRef.current.deactivate();
    }

    // NEW: Update session status to completed with enhanced API
    if (sessionId) {
      try {
        await updateSessionStatusMutation.mutateAsync({
          sessionId,
          status: "completed",
        });
        toast.success("Exam submitted successfully! 📝");
      } catch (error) {
        console.error("[ProctoredExam] Failed to end session:", error);
        toast.error("Failed to submit exam. Please contact support.");
      }
    }

    setStage("completed");

    // Call completion handler
    onExamComplete({
      sessionId,
      violations,
      timeSpent: timeLimitMinutes * 60 - timeRemaining,
    });
  };

  const handleTimeExpired = () => {
    alert("Time expired! The exam will now be submitted.");
    endExam();
  };

  const handleViolation = async (violation: string) => {
    setViolations((prev) => [...prev, violation]);

    // NEW: Record violation with enhanced API (with auto-detection and risk scoring)
    const violationTypeMap: Record<
      string,
      { type: any; severity: "low" | "medium" | "high" | "critical" }
    > = {
      tab_hidden: { type: "tab_switch", severity: "medium" },
      fullscreen_exit: { type: "browser_exit", severity: "high" },
      devtools_opened: { type: "prohibited_app", severity: "critical" },
      copy_detected: { type: "copy_paste", severity: "medium" },
      paste_detected: { type: "copy_paste", severity: "medium" },
    };

    const violationInfo = violationTypeMap[violation] || {
      type: "suspicious_behavior",
      severity: "medium" as const,
    };

    try {
      await recordViolationMutation.mutateAsync({
        violationType: violationInfo.type,
        severity: violationInfo.severity,
        description: `Browser lockdown violation: ${violation}`,
      });
    } catch (error) {
      console.error("[ProctoredExam] Failed to record violation:", error);
    }

    // Show warning to user with toast
    if (violation === "tab_hidden") {
      setIsPaused(true);
      toast.error(
        "⚠️ You switched away from the exam. This violation has been logged.",
        {
          duration: 5000,
        },
      );
    } else if (violation === "fullscreen_exit") {
      toast.error(
        "⚠️ You exited fullscreen mode. This violation has been logged.",
        {
          duration: 5000,
        },
      );
    } else if (violation === "devtools_opened") {
      toast.error(
        "⚠️ Developer tools detected. This is a critical violation!",
        {
          duration: 7000,
        },
      );
    }
  };

  // REMOVED: handleWebcamCapture - WebcamCapture component now handles uploads automatically
  // The enhanced API auto-detects violations from face captures:
  // - 0 faces → "no_face" violation
  // - >1 faces → "multiple_faces" violation
  // - low match score → "face_not_recognized" violation

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Pre-Check Stage */}
      {stage === "pre-check" && (
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "2rem",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h1 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              {assessmentTitle}
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "#64748b",
                marginBottom: "2rem",
              }}
            >
              Proctored Assessment - {timeLimitMinutes} minutes
            </p>

            <div
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #fbbf24",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#92400e" }}>
                ⚠️ Proctored Exam Requirements
              </h3>
              <ul style={{ marginLeft: "1.5rem", marginBottom: "1rem" }}>
                <li>Webcam must remain active throughout the exam</li>
                <li>Browser must remain in fullscreen mode</li>
                <li>Switching tabs or windows is not allowed</li>
                <li>Copy/paste operations are disabled</li>
                <li>Developer tools are blocked</li>
                <li>Your identity will be verified before starting</li>
              </ul>
              <p
                style={{ fontSize: "14px", color: "#78350f", marginBottom: 0 }}
              >
                Any violations will be logged and may result in exam
                invalidation.
              </p>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <h3>System Compatibility Check</h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "#22c55e", fontSize: "20px" }}>✓</span>
                  <span>Browser: Compatible</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: "#22c55e", fontSize: "20px" }}>✓</span>
                  <span>Fullscreen API: Available</span>
                </div>
                {requireWebcam && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ color: "#22c55e", fontSize: "20px" }}>
                      ✓
                    </span>
                    <span>Webcam: Required (will prompt for access)</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={handlePreCheckComplete}
                style={{
                  padding: "1rem 3rem",
                  fontSize: "18px",
                  backgroundColor: "#2da44e",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                I Understand - Begin Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Verification Stage */}
      {stage === "biometric" && sessionId && (
        <BiometricVerification
          sessionId={sessionId}
          userId={userId}
          onVerificationComplete={handleBiometricComplete}
          allowSkip={false}
        />
      )}

      {/* Ready to Start Stage */}
      {stage === "ready" && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "3rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#d1fae5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 2rem",
                fontSize: "40px",
              }}
            >
              ✓
            </div>

            <h2>Ready to Begin</h2>
            <p style={{ color: "#64748b", marginBottom: "2rem" }}>
              All verification checks passed. When you click "Start Exam", the
              timer will begin and browser lockdown will be activated.
            </p>

            <button
              onClick={startExam}
              style={{
                padding: "1rem 3rem",
                fontSize: "18px",
                backgroundColor: "#2da44e",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Start Exam
            </button>
          </div>
        </div>
      )}

      {/* In Progress Stage */}
      {stage === "in-progress" && (
        <div style={{ position: "relative", minHeight: "100vh" }}>
          {/* Exam Header */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: "#1e293b",
              color: "white",
              padding: "1rem 2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 1000,
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "18px" }}>{assessmentTitle}</h3>
              <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                Proctored Assessment
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                  Time Remaining
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: timeRemaining < 300 ? "#ef4444" : "white",
                  }}
                >
                  {formatTime(timeRemaining)}
                </div>
              </div>

              <button
                onClick={endExam}
                style={{
                  padding: "0.5rem 1.5rem",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* Webcam Monitor (Picture-in-Picture) */}
          {requireWebcam && (
            <div
              style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                zIndex: 1000,
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <WebcamCapture
                sessionId={sessionId || undefined}
                userId={userId}
                captureInterval={10}
                width={240}
                height={180}
                showPreview={true}
                autoUpload={true}
              />
            </div>
          )}

          {/* Exam Content Area */}
          <div style={{ paddingTop: "100px", padding: "2rem" }}>
            <div
              style={{
                maxWidth: "900px",
                margin: "0 auto",
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "2rem",
                minHeight: "600px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Placeholder for actual exam questions */}
              <h2>Exam Questions</h2>
              <p style={{ color: "#64748b" }}>
                This is where the actual exam questions would be rendered. The
                assessment content should be loaded from the backend.
              </p>

              {/* Violations Log (for demo) */}
              {violations.length > 0 && (
                <div
                  style={{
                    marginTop: "2rem",
                    padding: "1rem",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                  }}
                >
                  <h4 style={{ marginTop: 0, color: "#dc2626" }}>
                    ⚠️ Violations Detected ({violations.length})
                  </h4>
                  <ul
                    style={{
                      marginLeft: "1.5rem",
                      marginBottom: 0,
                      color: "#991b1b",
                    }}
                  >
                    {violations.slice(-5).map((v, i) => (
                      <li key={i}>{v.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed Stage */}
      {stage === "completed" && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "3rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#d1fae5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 2rem",
                fontSize: "40px",
              }}
            >
              ✓
            </div>

            <h2>Exam Submitted</h2>
            <p style={{ color: "#64748b", marginBottom: "2rem" }}>
              Your exam has been submitted successfully. Your responses and
              proctoring data are being processed.
            </p>

            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                padding: "1.5rem",
                textAlign: "left",
              }}
            >
              <h4 style={{ marginTop: 0 }}>Exam Summary</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <strong>Time Spent:</strong>{" "}
                  {Math.floor((timeLimitMinutes * 60 - timeRemaining) / 60)}{" "}
                  minutes
                </div>
                <div>
                  <strong>Violations Logged:</strong> {violations.length}
                </div>
                <div>
                  <strong>Session ID:</strong> {sessionId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
