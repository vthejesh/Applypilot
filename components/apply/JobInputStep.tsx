'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Loader2, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { ExtractedJob, ScamResult, EmailVerification } from './ApplyWizard';

interface JobInputStepProps {
  onExtracted: (
    job: ExtractedJob,
    scam: ScamResult,
    verifications: EmailVerification[]
  ) => void;
}

export default function JobInputStep({ onExtracted }: JobInputStepProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  async function handleExtract(tab: 'text' | 'file') {
    if (tab === 'text' && !text.trim()) {
      setError('Please paste a job post.');
      return;
    }
    if (tab === 'file' && !file) {
      setError('Please upload a file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let body: FormData | string;
      let contentType: string | undefined;

      if (tab === 'file' && file) {
        const formData = new FormData();
        formData.append('file', file);
        body = formData;
      } else {
        body = JSON.stringify({ text });
        contentType = 'application/json';
      }

      const res = await fetch('/api/extract', {
        method: 'POST',
        body,
        headers: contentType ? { 'Content-Type': contentType } : undefined,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Extraction failed');
      }

      const { data, scam, emailVerifications } = json;

      if (!data.jobTitle && !data.company) {
        toast.warning('Could not identify a job post. Please check your input.');
      } else {
        toast.success('Job extracted successfully!');
      }

      onExtracted(data, scam, emailVerifications ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Tabs defaultValue="text">
          <TabsList className="mb-4">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="file">Upload File / Image</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              placeholder="Paste the full job post here — LinkedIn post, job description, email, or any text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="font-mono text-sm resize-none"
            />
            {text.length > 0 && (
              <p className="text-xs text-muted-foreground">{text.length} characters</p>
            )}
            <Button
              onClick={() => handleExtract('text')}
              disabled={loading || !text.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Job Details'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="h-8 w-8 text-primary" />
                  ) : (
                    <FileText className="h-8 w-8 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop it here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, JPG, PNG, WebP — up to 10MB
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Badge variant="outline" className="text-xs">Job Poster</Badge>
                    <Badge variant="outline" className="text-xs">Screenshot</Badge>
                    <Badge variant="outline" className="text-xs">PDF JD</Badge>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={() => handleExtract('file')}
              disabled={loading || !file}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {file?.type.startsWith('image/')
                    ? 'Reading image with AI...'
                    : 'Parsing document...'}
                </>
              ) : (
                'Extract from File'
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
