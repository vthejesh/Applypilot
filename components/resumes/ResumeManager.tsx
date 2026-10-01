'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileText, Loader2, Star, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes, formatDate } from '@/lib/utils';

interface Resume {
  id: string;
  name: string;
  roleTag: string;
  fileName: string;
  fileSize: number;
  atsScore: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ResumeManager() {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [roleTag, setRoleTag] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/resumes');
      if (!res.ok) throw new Error('Failed to load resumes');
      return res.json() as Promise<{ resumes: Resume[] }>;
    },
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      if (!name) setName(accepted[0].name.replace(/\.[^.]+$/, ''));
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  async function handleUpload() {
    if (!file || !name.trim() || !roleTag.trim()) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('roleTag', roleTag);

      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success('Resume uploaded and parsed!');
      setFile(null);
      setName('');
      setRoleTag('');
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this resume?')) return;
    try {
      await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      toast.success('Resume deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">({formatBytes(file.size)})</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm">{isDragActive ? 'Drop it here' : 'Drag & drop PDF or DOCX'}</p>
                <p className="text-xs text-muted-foreground">Up to 10MB</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="resume-name">Resume Name</Label>
              <Input
                id="resume-name"
                placeholder="e.g. Frontend Resume v2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-tag">Role Tag</Label>
              <Input
                id="role-tag"
                placeholder="e.g. Frontend, Backend, Data"
                value={roleTag}
                onChange={(e) => setRoleTag(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full gap-2"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading & Parsing...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Resume</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resume list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.resumes?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2" />
          <p className="text-sm">No resumes yet. Upload one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.resumes?.map((resume) => (
            <Card key={resume.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{resume.name}</p>
                        {resume.isDefault && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Star className="h-2.5 w-2.5" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {resume.roleTag} • {formatBytes(resume.fileSize)} • {formatDate(resume.createdAt)}
                      </p>
                      {resume.atsScore !== null && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-muted-foreground">ATS Score</span>
                            <span className="text-xs font-medium">{resume.atsScore}%</span>
                          </div>
                          <Progress value={resume.atsScore} className="h-1.5 w-32" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(resume.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
