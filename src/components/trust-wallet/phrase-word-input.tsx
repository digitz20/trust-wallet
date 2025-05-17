// src/components/trust-wallet/phrase-word-input.tsx
"use client";

import type { ChangeEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PhraseWordInputProps {
  index: number;
  word: string;
  validationStatus: { 
    isValid: boolean | null; 
    reason?: string; 
    isLoading: boolean; 
  };
  isVisible: boolean;
  onWordChange: (value: string) => void;
  onToggleVisibility: () => void;
  onValidateWord: () => Promise<void>;
}

export function PhraseWordInput({
  index,
  word,
  validationStatus,
  isVisible,
  onWordChange,
  onToggleVisibility,
  onValidateWord,
}: PhraseWordInputProps) {
  
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onWordChange(event.target.value.toLowerCase().trim());
  };

  const handleBlur = () => {
    if (word.trim()) {
      onValidateWord();
    } else {
      // If word is empty on blur, clear any previous validation state, unless it's already marked as invalid (e.g. by verify)
      if (validationStatus.isValid !== false) {
         onWordChange(''); // This will trigger reset in parent
      }
    }
  };

  const getBorderColor = () => {
    if (validationStatus.isLoading) return "border-primary/50"; // Use a variant of primary for loading
    if (validationStatus.isValid === true) return "border-green-500 dark:border-green-400";
    if (validationStatus.isValid === false) return "border-destructive"; // Covers empty and invalid words
    return "border-input"; // Default
  };

  const renderValidationIcon = () => {
    if (validationStatus.isLoading) {
      return <Loader2 size={18} className="animate-spin text-primary" />;
    }
    if (validationStatus.isValid === true) {
      return <CheckCircle2 size={18} className="text-green-500 dark:text-green-400" />;
    }
    if (validationStatus.isValid === false) { // This covers both invalid API responses and empty fields marked by "Verify"
      const icon = validationStatus.reason?.includes("empty") ? <AlertCircle size={18} className="text-destructive" /> : <XCircle size={18} className="text-destructive" />;
      if (validationStatus.reason) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>{icon}</TooltipTrigger>
            <TooltipContent id={`word-${index}-error`}>
              <p>{validationStatus.reason}</p>
            </TooltipContent>
          </Tooltip>
        );
      }
      return icon;
    }
    return <div className="w-[18px]" />; // Placeholder
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor={`word-${index}`} className="text-sm font-medium text-muted-foreground pl-1">
          Word {index + 1}
        </Label>
        <div className="relative flex items-center">
          <Input
            id={`word-${index}`}
            type={isVisible ? "text" : "password"}
            value={word}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              "pr-16 text-base h-12 focus:shadow-md transition-all duration-150 ease-in-out", 
              getBorderColor(),
              validationStatus.isValid === true ? "focus:ring-green-500/50" : "",
              validationStatus.isValid === false ? "focus:ring-destructive/50" : ""
            )}
            aria-invalid={validationStatus.isValid === false}
            aria-describedby={validationStatus.isValid === false && validationStatus.reason ? `word-${index}-error` : undefined}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <div className="absolute right-1.5 flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleVisibility}
              className="h-9 w-9 text-muted-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={isVisible ? "Hide word" : "Show word"}
            >
              {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </Button>
            <div className="h-9 w-9 flex items-center justify-center" aria-live="polite">
              {renderValidationIcon()}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
