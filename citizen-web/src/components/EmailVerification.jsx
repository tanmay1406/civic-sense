import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  LinearProgress,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Email,
  CheckCircle,
  Refresh,
  ArrowBack,
  Timer,
} from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const EmailVerification = () => {
  const { apiRequest, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from location state or prompt user to enter it
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Refs for OTP input fields
  const otpRefs = useRef([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Restrict to single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace in OTP inputs
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste in OTP inputs
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(['', '', '', '', '', '']).slice(0, 6);
    setOtp(newOtp);

    // Focus last filled input or next empty one
    const lastFilledIndex = newOtp.findIndex(digit => !digit);
    const focusIndex = lastFilledIndex === -1 ? 5 : Math.max(0, lastFilledIndex - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    if (!email) {
      setError('Email address is required');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await apiRequest('/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          otp: otpString
        })
      });

      if (response.success) {
        setSuccess('Email verified successfully! Redirecting...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        setError(response.message || 'OTP verification failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || !email) return;

    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const response = await apiRequest('/auth/resend-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (response.success) {
        setSuccess('New OTP sent successfully!');
        setCountdown(60); // Start 60 second countdown
        setCanResend(false);
        setOtp(['', '', '', '', '', '']); // Clear current OTP
        otpRefs.current[0]?.focus(); // Focus first input
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      setError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Handle email change (if not provided in location state)
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Email sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Verify Your Email
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We've sent a 6-digit verification code to your email address
            </Typography>
          </Box>

          {/* Email Field (if not provided) */}
          {!location.state?.email && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                disabled={isVerifying || isResending}
                required
              />
            </Box>
          )}

          {/* Show email if provided */}
          {email && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Verification code sent to:
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                {email}
              </Typography>
            </Box>
          )}

          <form onSubmit={handleVerifyOtp}>
            {/* OTP Input Fields */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Enter the 6-digit verification code
              </Typography>

              <Grid container spacing={1} justifyContent="center">
                {otp.map((digit, index) => (
                  <Grid item key={index}>
                    <TextField
                      ref={el => otpRefs.current[index] = el}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      inputProps={{
                        maxLength: 1,
                        style: {
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          width: '3rem',
                          height: '3rem',
                          padding: 0,
                        }
                      }}
                      sx={{
                        width: '3.5rem',
                        '& .MuiOutlinedInput-root': {
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          }
                        }
                      }}
                      disabled={isVerifying || isResending}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Error/Success Messages */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* Loading Progress */}
            {(isVerifying || isResending) && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
              </Box>
            )}

            {/* Verify Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isVerifying || isResending || otp.some(digit => !digit)}
              sx={{ mb: 2, py: 1.5 }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Resend OTP */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Didn't receive the code?
              </Typography>

              {canResend ? (
                <Button
                  variant="text"
                  startIcon={<Refresh />}
                  onClick={handleResendOtp}
                  disabled={isResending || !email}
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Button>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Resend available in {formatTime(countdown)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Back to Login */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                variant="text"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/login')}
                disabled={isVerifying || isResending}
              >
                Back to Login
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailVerification;
