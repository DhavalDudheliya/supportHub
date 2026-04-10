"use client";

import React, { useCallback, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, Loader2 } from "lucide-react";
import { cn } from "@supporthub/ui/lib/utils";
import { Button } from "@supporthub/ui/components/button";

interface AssetUploadProps {
  label: string;
  description: string;
  value: string | null;
  accept: string;
  maxSizeLabel: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

/**
 * AssetUpload — A file drop zone with preview, upload action, and delete button.
 * Used for both logo and favicon uploads.
 */
export function AssetUpload({
  label,
  description,
  value,
  accept,
  maxSizeLabel,
  onUpload,
  onRemove,
}: AssetUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  }, [onRemove]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>

      {value ? (
        /* Preview with remove option */
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-lg border border-border bg-muted/20 p-2 flex items-center justify-center overflow-hidden">
            <img
              src={value}
              alt={label}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-1.5"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              {isRemoving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Remove
            </Button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/40 hover:bg-muted/20",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm text-foreground">
              {isUploading
                ? "Uploading..."
                : "Drop file here or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Max {maxSizeLabel}
            </p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // Reset so the same file can be re-selected
          e.target.value = "";
        }}
        className="hidden"
        aria-label={`Upload ${label}`}
      />
    </div>
  );
}
