import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Paper,
  Stack,
} from "@mui/material";
import {
  Mic,
  MicOff,
  Stop,
  PlayArrow,
  Pause,
  Delete,
} from "@mui/icons-material";

const VoiceRecorder = ({ onTranscription, onAudioFile, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError("");
      setPermissionDenied(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        setAudioBlob(blob);

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Call parent callback with audio file
        if (onAudioFile) {
          onAudioFile(blob);
        }

        // Auto-transcribe if available
        transcribeAudio(blob);
      };

      mediaRecorder.start(100); // Record in 100ms chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      if (err.name === "NotAllowedError") {
        setPermissionDenied(true);
        setError(
          "Microphone permission denied. Please allow microphone access to record audio.",
        );
      } else if (err.name === "NotFoundError") {
        setError(
          "No microphone found. Please connect a microphone and try again.",
        );
      } else {
        setError("Failed to start recording. Please check your microphone.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setTranscription("");
    setRecordingTime(0);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);
  };

  const transcribeAudio = async (blob) => {
    try {
      setIsTranscribing(true);
      setError("");

      // For demo purposes, we'll use a mock transcription
      // In production, you would integrate with services like:
      // - Google Speech-to-Text API
      // - Azure Speech Services
      // - AWS Transcribe
      // - OpenAI Whisper API

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      // Mock API call - replace with actual transcription service
      setTimeout(() => {
        const mockTranscription =
          "This is a mock transcription. In production, this would be the actual transcribed text from your audio recording.";
        setTranscription(mockTranscription);
        setIsTranscribing(false);

        if (onTranscription) {
          onTranscription(mockTranscription);
        }
      }, 2000);

      // Actual API call would look like this:
      /*
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setTranscription(data.text);

      if (onTranscription) {
        onTranscription(data.text);
      }
      */
    } catch (err) {
      console.error("Transcription error:", err);
      setError(
        "Failed to transcribe audio. You can still submit the recording.",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        border: "2px dashed",
        borderColor: isRecording ? "error.main" : "grey.300",
        backgroundColor: isRecording ? "error.50" : "background.paper",
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6" gutterBottom>
          Voice Recording
        </Typography>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ width: "100%" }}
          >
            {error}
            {permissionDenied && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  To enable microphone access:
                </Typography>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  • Click the microphone icon in your browser's address bar
                </Typography>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  • Select "Allow" and refresh the page
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* Recording Controls */}
        <Stack direction="row" spacing={2} alignItems="center">
          {!isRecording && !audioBlob && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Mic />}
              onClick={startRecording}
              disabled={disabled}
              size="large"
            >
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <IconButton
                color="error"
                onClick={stopRecording}
                size="large"
                sx={{
                  animation: "pulse 1.5s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%": {
                      transform: "scale(1)",
                    },
                    "50%": {
                      transform: "scale(1.1)",
                    },
                    "100%": {
                      transform: "scale(1)",
                    },
                  },
                }}
              >
                <Stop />
              </IconButton>
              <Chip
                icon={<MicOff />}
                label={`Recording: ${formatTime(recordingTime)}`}
                color="error"
                variant="outlined"
              />
            </>
          )}

          {audioBlob && !isRecording && (
            <>
              <IconButton
                color="primary"
                onClick={isPlaying ? pauseAudio : playAudio}
                disabled={!audioUrl}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>

              <Chip
                label={`Duration: ${formatTime(recordingTime)}`}
                color="primary"
                variant="outlined"
              />

              <IconButton
                color="error"
                onClick={deleteRecording}
                title="Delete Recording"
              >
                <Delete />
              </IconButton>
            </>
          )}
        </Stack>

        {/* Audio Player */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            style={{ width: "100%", maxWidth: 300 }}
            controls
          />
        )}

        {/* Transcription Section */}
        {isTranscribing && (
          <Box sx={{ width: "100%" }}>
            <Typography variant="body2" gutterBottom>
              Transcribing audio...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {transcription && (
          <Box sx={{ width: "100%" }}>
            <Typography variant="subtitle2" gutterBottom>
              Transcription:
            </Typography>
            <Paper
              sx={{
                p: 2,
                backgroundColor: "grey.50",
                border: "1px solid",
                borderColor: "grey.200",
              }}
            >
              <Typography variant="body2">{transcription}</Typography>
            </Paper>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              * Transcription is provided for reference. The original audio will
              be submitted with your report.
            </Typography>
          </Box>
        )}

        {/* Browser Compatibility Warning */}
        {!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia ? (
          <Alert severity="warning" sx={{ width: "100%" }}>
            Voice recording is not supported in your browser. Please use a
            modern browser like Chrome, Firefox, or Safari.
          </Alert>
        ) : null}

        {/* Usage Instructions */}
        {!audioBlob && !isRecording && !error && (
          <Box sx={{ width: "100%" }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Click "Start Recording" to record your voice description of the
              issue. The audio will be automatically transcribed to text.
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default VoiceRecorder;
