import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { KeyRound, XCircle } from 'lucide-react';
import { authService } from '../services/auth.service';
import Input from '../components/Input';
import Button from '../components/Button';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await authService.resetPassword({ token, password: data.password });
      setDone(true);
      toast.success('Password reset successfully');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'This reset link is invalid or has expired');
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
          <XCircle size={22} />
        </div>
        <h1 className="font-display text-2xl font-bold">Invalid reset link</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">
          This link is missing its reset token. Request a new one below.
        </p>
        <Link to="/forgot-password" className="mt-6 inline-block">
          <Button>Request a new link</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light">
          <KeyRound size={22} />
        </div>
        <h1 className="font-display text-2xl font-bold">Password reset!</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold">Set a new password</h1>
      <p className="mt-1.5 text-sm text-ink/60 dark:text-paper/60">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          {...register('password')}
          error={errors.password?.message}
        />
        <Input
          label="Confirm new password"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
        <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
