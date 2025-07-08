
"use client";

import React, { useCallback } from 'react';
import type { QuizQuestion } from '@/types/quiz';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import * as LucideIcons from 'lucide-react';
import { CheckCircle } from 'lucide-react';

const IconComponents = LucideIcons as { [key: string]: React.FC<LucideIcons.LucideProps> };

interface QuestionPreviewProps {
  question: QuizQuestion;
}

export default function QuestionPreview({ question }: QuestionPreviewProps) {
  
  const getIconComponent = useCallback((iconName?: keyof typeof IconComponents): React.ElementType | null => {
    if (!iconName || typeof iconName !== 'string' || !IconComponents[iconName]) return null;
    return IconComponents[iconName];
  }, []);

  const QuestionIcon = getIconComponent(question.icon);
  
  return (
    <Card className="p-4 space-y-4 bg-muted/30 border-dashed">
      <div className="flex items-start space-x-3">
        {QuestionIcon && <QuestionIcon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />}
        <div>
          <Label className="text-lg font-semibold text-card-foreground mb-1 block">
            {question.text || "Texto da Pergunta..."}
          </Label>
          {question.explanation && <p className="text-sm text-muted-foreground">{question.explanation}</p>}
        </div>
      </div>
      
      {(question.type === 'radio' && question.options) && (
        <RadioGroup className="space-y-2">
          {(question.options).map((option, index) => {
            const OptionIcon = getIconComponent(option.icon);
            return (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg bg-background">
                {OptionIcon && <OptionIcon className="h-5 w-5 text-muted-foreground" />}
                <RadioGroupItem value={option.value} id={`preview-radio-${index}`} disabled />
                <Label htmlFor={`preview-radio-${index}`} className="font-normal flex-1">
                  {option.label || `Opção ${index+1}`}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      )}

      {(question.type === 'checkbox' && question.options) && (
        <div className="grid grid-cols-2 gap-2">
          {(question.options).map((option, index) => (
            <div key={index} className="relative p-2 border rounded-lg cursor-default bg-background">
              {option.imageUrl && (
                <div className="relative w-full aspect-video mb-2 rounded-md overflow-hidden">
                  <Image src={option.imageUrl} alt={option.label || 'Preview'} layout="fill" objectFit="cover" />
                </div>
              )}
              <div className="text-center">
                <Label className="font-semibold text-xs">{option.label || `Opção ${index+1}`}</Label>
              </div>
              {index === 1 && ( // Simulate one selected item for visual feedback
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5"><CheckCircle className="h-3 w-3" /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {(question.type === 'textFields' && question.fields) && (
        <div className="space-y-4">
          {(question.fields).map((field, index) => {
            const FieldIcon = getIconComponent(field.icon);
            return (
              <div key={index} className="space-y-1">
                <Label className="font-medium flex items-center text-sm">
                  {FieldIcon && <FieldIcon className="h-4 w-4 mr-2 text-primary"/>}
                  {field.label || `Campo ${index+1}`}
                </Label>
                <Input type={field.type} placeholder={field.placeholder} disabled />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

    