import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { applicationAssistantService } from '../services/applicationAssistant.service';

const DOCUMENT_TYPES = [
  { key: 'cover_letter', label: 'Cover Letter' },
  { key: 'recruiter_message', label: 'Recruiter Message' },
  { key: 'linkedin_message', label: 'LinkedIn Message' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'thank_you', label: 'Thank-you Note' },
];

export default function ApplicationAssistantCard({ applicationId }) {
  const [generatingType, setGeneratingType] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (type, label) => {
    setGeneratingType(type);
    try {
      const res = await applicationAssistantService.generate(applicationId, type);
      setResult({ type, label, content: res.data.data.content });
      setCopied(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate document');
    } finally {
      setGeneratingType(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className="p-5">
        <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold">
          <Sparkles size={15} className="text-primary" /> AI Application Assistant
        </h3>
        <p className="mb-4 text-xs text-ink/50 dark:text-paper/50">
          Generated from your actual resume and this job's details - not generic templates.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DOCUMENT_TYPES.map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant="secondary"
              onClick={() => handleGenerate(key, label)}
              loading={generatingType === key}
              disabled={generatingType && generatingType !== key}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      <Modal open={Boolean(result)} onClose={() => setResult(null)} title={result?.label} size="lg">
        <div className="whitespace-pre-wrap rounded-xl bg-paper-line/40 p-4 text-sm dark:bg-ink-line/40">
          {result?.content}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setResult(null)}>Close</Button>
          <Button onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy to clipboard'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
