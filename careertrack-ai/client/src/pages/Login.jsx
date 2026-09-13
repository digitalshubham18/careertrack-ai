import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import Input from '../components/Input';
import Button from '../components/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
});

export default function Login() {
  const { login, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const {
    register, handleSubmit, getValues, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const {
    register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors, isSubmitting: verifying },
  } = useForm({ resolver: zodResolver(otpSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    setNeedsVerification(false);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email);
        // A fresh code is sent automatically so there's always a valid one
        // waiting - the user shouldn't have to think about resending first.
        authService.resendVerification(data.email).catch(() => {});
      }
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const onVerify = async (data) => {
    setVerifyError('');
    try {
      await verifyEmail(unverifiedEmail, data.otp);
      toast.success('Email verified! Welcome to CareerTrack AI.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendVerification(unverifiedEmail || getValues('email'));
      toast.success('Verification code sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
          We sent a 6-digit code to <span className="font-medium text-ink dark:text-paper">{unverifiedEmail}</span>.
          Enter it below to activate your account.
        </p>

        <form onSubmit={handleOtpSubmit(onVerify)} className="mt-6 space-y-4">
          <Input
            label="Verification code"
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoFocus
            {...registerOtp('otp')}
            error={otpErrors.otp?.message}
          />
          {verifyError && <p className="text-sm text-danger">{verifyError}</p>}
          <Button type="submit" className="w-full" loading={verifying}>
            Verify and log in
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={handleResend} disabled={resending} className="font-medium text-primary hover:underline disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend code'}
          </button>
          <button onClick={() => setNeedsVerification(false)} className="text-ink/50 hover:underline dark:text-paper/50">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink/60 dark:text-paper/60">Log in to continue your job search.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">Sign up</Link>
      </p>

      <div className="mt-8 rounded-xl border border-paper-line bg-paper-soft p-4 text-xs text-ink/50 dark:border-ink-line dark:bg-ink-soft dark:text-paper/50">
        Demo account: <span className="font-data">demo@careertrack.ai</span> / <span className="font-data">Demo@12345</span>
        <br />(after running <span className="font-data">npm run seed</span> on the server)
      </div>
    </div>
  );
}
