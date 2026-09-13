import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import Input from '../components/Input';
import Button from '../components/Button';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    await authService.forgotPassword(data.email);
    setSent(true);
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-2xl font-bold">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink/60 dark:text-paper/60">
        Enter your email and we'll send you a reset link if an account exists.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-accent-dark">
          If that email exists, a password reset link has been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
          <Button type="submit" className="w-full" loading={isSubmitting}>Send reset link</Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
        <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
