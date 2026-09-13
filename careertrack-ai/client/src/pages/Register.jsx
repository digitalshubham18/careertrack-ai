import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import Input from '../components/Input';
import Button from '../components/Button';

const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
});

export default function Register() {
  const { register: registerUser, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const {
    register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors, isSubmitting: verifying }, reset: resetOtpForm,
  } = useForm({ resolver: zodResolver(otpSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await registerUser(data.name, data.email, data.password);
      setRegisteredEmail(data.email);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const onVerify = async (data) => {
    setVerifyError('');
    try {
      await verifyEmail(registeredEmail, data.otp);
      toast.success('Email verified! Welcome to CareerTrack AI.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendVerification(registeredEmail);
      toast.success('Verification code sent again');
      resetOtpForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
          <ShieldCheck size={22} />
        </div>
        <h1 className="font-display text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
          We sent a 6-digit verification code to{' '}
          <span className="font-medium text-ink dark:text-paper">{registeredEmail}</span>. Enter it below to
          activate your account — you won't be able to log in until you do.
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
            Verify and continue
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={handleResend} disabled={resending} className="font-medium text-primary hover:underline disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend code'}
          </button>
          <button onClick={() => setRegisteredEmail('')} className="text-ink/50 hover:underline dark:text-paper/50">
            Wrong email? Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink/60 dark:text-paper/60">
        Start tracking applications and get AI-powered ATS scoring in minutes.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Full name" placeholder="Jane Doe" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          {...register('password')}
          error={errors.password?.message}
        />

        {serverError && <p className="text-sm text-danger">{serverError}</p>}

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-4 text-xs text-ink/50 dark:text-paper/50">
        We'll send a 6-digit code to confirm your email is real. Disposable/temporary email addresses aren't accepted.
      </p>

      <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
