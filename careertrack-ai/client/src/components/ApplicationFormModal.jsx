import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import Button from './Button';
import { STATUSES } from '../utils/constants';

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  jobUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  employmentType: z.string().optional(),
  salaryRange: z.string().optional().or(z.literal('')),
  jobDescription: z.string().optional().or(z.literal('')),
  deadline: z.string().optional().or(z.literal('')),
  status: z.string().optional(),
  priority: z.string().optional(),
  contactPerson: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  interviewDate: z.string().optional().or(z.literal('')),
  followUpDate: z.string().optional().or(z.literal('')),
});

export default function ApplicationFormModal({ open, onClose, onSubmit, defaultValues, submitting }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || { status: 'Saved', priority: 'Medium', employmentType: 'Full-time' },
  });

  React.useEffect(() => {
    if (open) reset(defaultValues || { status: 'Saved', priority: 'Medium', employmentType: 'Full-time' });
  }, [open, defaultValues, reset]);

  const submit = async (data) => {
    await onSubmit(data);
  };

  return (
    <Modal open={open} onClose={onClose} title={defaultValues ? 'Edit Application' : 'New Application'} size="lg">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Company name" {...register('companyName')} error={errors.companyName?.message} />
          <Input label="Job title" {...register('jobTitle')} error={errors.jobTitle?.message} />
          <Input label="Job URL" placeholder="https://..." {...register('jobUrl')} error={errors.jobUrl?.message} />
          <Input label="Location" {...register('location')} />
          <Select label="Employment type" {...register('employmentType')}>
            {['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Salary range" placeholder="e.g. $90k - $110k" {...register('salaryRange')} />
          <Select label="Status" {...register('status')}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Priority" {...register('priority')}>
            {['Low', 'Medium', 'High'].map((p) => <option key={p}>{p}</option>)}
          </Select>
          <Input label="Contact person" {...register('contactPerson')} />
          <Input label="Contact email" type="email" {...register('contactEmail')} error={errors.contactEmail?.message} />
          <Input label="Deadline" type="date" {...register('deadline')} />
          <Input label="Interview date" type="datetime-local" {...register('interviewDate')} />
          <Input label="Follow-up date" type="date" {...register('followUpDate')} />
        </div>
        <Input label="Job description" textarea rows={5} placeholder="Paste the job description here..." {...register('jobDescription')} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{defaultValues ? 'Save changes' : 'Create application'}</Button>
        </div>
      </form>
    </Modal>
  );
}
