
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSuccessIcon } from '@/config/quizConfig';
import QuizProgressBar from './QuizProgressBar';
import { getActivePixelIds, trackFbCustomEvent, trackFbEvent } from '@/lib/fpixel';
import { trackGaEvent } from '@/lib/gtag';
import { logQuizAbandonment as serverLogQuizAbandonment, submitQuizData as serverSubmitQuizData } from '@/app/actions';
import { recordQuizStartedAction, recordQuestionAnswerAction, recordFirstQuestionAnsweredAction } from '@/app/config/dashboard/quiz/actions';
import * as LucideIcons from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import type { QuizConfig, QuizQuestion } from '@/types/quiz';
import { hexToHslString } from '@/lib/whitelabel';

type FormData = Record<string, any>;

interface QuizFormProps {
  quizQuestions: QuizQuestion[];
  quizSlug: string;
  quizTitle?: string;
  quizDescription?: string;
  logoUrl: string;
  facebookPixelId?: string;
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string;
  clientAbandonmentWebhookUrl?: string;
  footerCopyrightText?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  onSubmitOverride?: (data: FormData) => Promise<void>;
  onAbandonmentOverride?: (data: FormData, quizSlug?: string) => Promise<void>;
  isPreview?: boolean;
  useCustomTheme?: boolean;
  customTheme?: QuizConfig['customTheme'];
  displayMode?: 'step-by-step' | 'single-page';
}

const IconComponents = LucideIcons;

const DEFAULT_GENERIC_QUIZ_DESCRIPTION = "Responda algumas perguntas rápidas para nos ajudar a entender suas preferências.";

const generateFormSchema = (questions: QuizQuestion[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    questions.forEach(q => {
        if (q.type === 'textFields' && q.fields) {
            q.fields.forEach(field => {
                let fieldSchema: z.ZodString = z.string().min(1, `${field.label} é obrigatório.`);
                 if (field.type === 'email') {
                    fieldSchema = fieldSchema.email('Formato de email inválido.');
                } else if (field.type === 'tel') {
                    fieldSchema = fieldSchema.min(10, "Telefone inválido. Inclua o DDD.").regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, "Formato de telefone inválido. Use (XX) XXXXX-XXXX ou apenas números.");
                } else { // 'text'
                    fieldSchema = fieldSchema.min(3, `${field.label} deve ter pelo menos 3 caracteres.`);
                }
                schemaFields[field.name] = fieldSchema;
            });
        } else if (q.type === 'radio') {
            schemaFields[q.name] = z.string({ required_error: "Por favor, selecione uma opção." }).min(1, "Por favor, selecione uma opção.");
        } else if (q.type === 'checkbox') {
            schemaFields[q.name] = z.array(z.string()).nonempty({ message: "Selecione ao menos uma opção."});
        }
    });
    return z.object(schemaFields);
};


export default function QuizForm({
  quizQuestions,
  quizSlug,
  quizTitle = "Quiz",
  quizDescription = DEFAULT_GENERIC_QUIZ_DESCRIPTION,
  logoUrl,
  facebookPixelId,
  facebookPixelIdSecondary,
  googleAnalyticsId,
  clientAbandonmentWebhookUrl,
  footerCopyrightText = `© ${new Date().getFullYear()} Seu Projeto. Todos os direitos reservados.`,
  websiteUrl,
  instagramUrl,
  onSubmitOverride,
  onAbandonmentOverride,
  isPreview = false,
  useCustomTheme = false,
  customTheme,
  displayMode = 'step-by-step',
}: QuizFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [animationClass, setAnimationClass] = useState('animate-question-slide-in');
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [themeStyles, setThemeStyles] = useState<React.CSSProperties>({});
  const { toast } = useToast();

  const SuccessIcon = getSuccessIcon();
  
  const formSchema = useMemo(() => generateFormSchema(quizQuestions), [quizQuestions]);
  
  const methods = useForm<FormData>({
    resolver: displayMode === 'single-page' ? zodResolver(formSchema) : undefined,
    mode: 'onChange',
  });

  const { control, handleSubmit, setValue, getValues, trigger, formState: { errors }, setError: setFormError, clearErrors } = methods;

  const activeQuestions = useMemo(() => {
    if (!quizQuestions) return [];
    if (displayMode === 'single-page') return quizQuestions;
    // Step-by-step mode might have conditional logic in the future
    return quizQuestions.filter(q => !q.condition || q.condition(formData));
  }, [formData, quizQuestions, displayMode]);

  const currentQuestion = activeQuestions[currentStep];

  const configuredFbPixelIds = useMemo(
    () => getActivePixelIds(facebookPixelId, facebookPixelIdSecondary),
    [facebookPixelId, facebookPixelIdSecondary]
  );
  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId.trim() !== "" && googleAnalyticsId !== "YOUR_GA_ID";

  useEffect(() => {
    if (useCustomTheme && customTheme) {
      const styles: React.CSSProperties = {};
      const primaryColor = customTheme.primaryColorHex;
      const secondaryColor = customTheme.secondaryColorHex;
      const quizBgColor = customTheme.quizBackgroundColorHex;
      const buttonBgColor = customTheme.buttonPrimaryBgColorHex;

      if (primaryColor) styles['--primary'] = hexToHslString(primaryColor) || '';
      if (secondaryColor) styles['--secondary'] = hexToHslString(secondaryColor) || '';
      if (quizBgColor) styles['--card'] = hexToHslString(quizBgColor) || '';
      
      const finalButtonColor = buttonBgColor || primaryColor;
      if (finalButtonColor) {
         styles['--primary'] = hexToHslString(finalButtonColor) || '';
      }
      setThemeStyles(styles);
    } else {
      setThemeStyles({});
    }
  }, [useCustomTheme, customTheme]);


  useEffect(() => {
    if (!quizQuestions || quizQuestions.length === 0 || isPreview) return;
    
    recordQuizStartedAction(quizSlug).catch(err => console.error("Failed to record quiz started:", err));

    if (configuredFbPixelIds.length > 0) {
      trackFbCustomEvent('QuizStart', { quiz_slug: quizSlug, quiz_title: quizTitle }, configuredFbPixelIds);
    }
    if(isGaConfigured && googleAnalyticsId) {
        trackGaEvent({ action: 'quiz_start', category: 'Quiz', label: `${quizSlug}_Start`, quiz_title: quizTitle }, googleAnalyticsId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizSlug, isPreview, quizTitle]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isPreview) { 
        return;
      }
      if (!isQuizCompleted && Object.keys(formData).length > 0 && submissionStatus !== 'success' && quizQuestions && quizQuestions.length > 0) {
        const clientInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        };
        const dataToLog = {
          ...getValues(),
          abandonedAtStep: currentQuestion?.id || currentStep,
          quizType: `QuizSystemLeadFilter_Abandonment_${quizSlug}`, // Generalizado
          quizSlug,
          clientInfo,
          abandonedAt: new Date().toISOString()
        };

        if (onAbandonmentOverride) {
          onAbandonmentOverride(dataToLog, quizSlug);
        } else {
            const webhookUrl = clientAbandonmentWebhookUrl;
            if (webhookUrl && webhookUrl !== "YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL_PLACEHOLDER") { // Usar placeholder correto
              if (navigator.sendBeacon) {
                try {
                  const blob = new Blob([JSON.stringify(dataToLog)], { type: 'application/json' });
                  navigator.sendBeacon(webhookUrl, blob);
                } catch (e) {
                   fetch(webhookUrl, { method: 'POST', body: JSON.stringify(dataToLog), headers: {'Content-Type': 'application/json'}, keepalive: true }).catch(()=>{});
                }
              } else {
                fetch(webhookUrl, { method: 'POST', body: JSON.stringify(dataToLog), headers: {'Content-Type': 'application/json'}, keepalive: true }).catch(()=>{});
              }
            } else {
               serverLogQuizAbandonment(dataToLog, quizSlug);
            }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, currentStep, isQuizCompleted, submissionStatus, quizSlug, clientAbandonmentWebhookUrl, onAbandonmentOverride, isPreview, getValues, currentQuestion]);

  const handleNext = async () => {
    if (submissionStatus === 'pending' || !currentQuestion) return;

    let stepIsValid = true;
    
    // Clear previous errors for all fields in the current step to avoid stale errors
    if (currentQuestion.type === 'textFields' && currentQuestion.fields) {
        currentQuestion.fields.forEach(field => clearErrors(field.name));
    } else if (currentQuestion.name) {
        clearErrors(currentQuestion.name);
    }
    
    if (currentQuestion.type === 'textFields' && currentQuestion.fields) {
        const schemaFields: Record<string, z.ZodString> = {};
        currentQuestion.fields.forEach(field => {
            let fieldSchema = z.string().min(1, `${field.label} é obrigatório.`);
            if (field.type === 'email') {
                fieldSchema = fieldSchema.email('Formato de email inválido.');
            } else if (field.type === 'tel') {
                fieldSchema = fieldSchema.min(10, "Telefone inválido. Inclua o DDD.").regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, "Formato de telefone inválido. Use (XX) XXXXX-XXXX ou apenas números.");
            } else { // 'text'
                fieldSchema = fieldSchema.min(3, `${field.label} deve ter pelo menos 3 caracteres.`);
            }
            schemaFields[field.name] = fieldSchema;
        });

        const stepSchema = z.object(schemaFields);
        const result = stepSchema.safeParse(getValues());

        if (!result.success) {
            stepIsValid = false;
            result.error.errors.forEach(err => {
                const fieldName = err.path[0];
                if (typeof fieldName === 'string') {
                    setFormError(fieldName, { type: 'manual', message: err.message });
                }
            });
        }

    } else if (currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') {
        const value = getValues(currentQuestion.name);
        stepIsValid = !!value && (Array.isArray(value) ? value.length > 0 : true);
        if (!stepIsValid) {
            setFormError(currentQuestion.name, { type: "manual", message: "Por favor, selecione uma opção."});
        }
    }

    if (!stepIsValid) return;

    const answerValue = getValues(currentQuestion.name) || (currentQuestion.type === 'textFields' && currentQuestion.fields ? currentQuestion.fields.reduce((acc, field) => ({...acc, [field.name]: getValues(field.name)}), {}) : {});
    const answerString = typeof answerValue === 'object' && answerValue !== null && !Array.isArray(answerValue) ? JSON.stringify(answerValue) : Array.isArray(answerValue) ? answerValue.join(', ') : String(answerValue);


    if (!isPreview) {
        recordQuestionAnswerAction(quizSlug, currentQuestion.id, currentQuestion.type, answerValue)
          .catch(err => console.error("Failed to record question answer:", err));
        
        if (currentStep === 0) {
            recordFirstQuestionAnsweredAction(quizSlug).catch(err => console.error("Failed to record first question answered:", err));
        }

        const eventDataFb = {
          quiz_slug: quizSlug,
          question_id: currentQuestion.id,
          question_name: currentQuestion.name,
          answer: answerString,
          step_number: currentStep + 1,
        };
         const eventDataGa = { 
            action: 'question_answered', 
            category: 'Quiz', 
            label: `Q: ${currentQuestion.id} - A: ${answerString.substring(0, 100)}`, 
            quiz_slug: quizSlug,
            question_id: currentQuestion.id,
            question_name: currentQuestion.name,
            answer: answerString,
            step_number: currentStep + 1,
        };

        if (configuredFbPixelIds.length > 0) {
          trackFbCustomEvent('QuestionAnswered', eventDataFb, configuredFbPixelIds);
        }
        if(isGaConfigured && googleAnalyticsId){
          trackGaEvent(eventDataGa, googleAnalyticsId);
        }
    }

    if (currentStep < activeQuestions.length - 1) {
        setAnimationClass('animate-question-slide-out');
        setTimeout(() => {
            setCurrentStep(prev => prev + 1);
            setAnimationClass('animate-question-slide-in');
        }, 300);
    } else { 
        await handleSubmit(onSubmit)();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0 && submissionStatus !== 'pending') {
      setAnimationClass('animate-question-slide-out');
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimationClass('animate-question-slide-in');
      }, 300);
    }
  };

  const handleValueChange = (name: string, value: any) => {
    setValue(name, value, { shouldValidate: true });
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (submissionStatus === 'pending') return;
    setSubmissionStatus('pending');

    const clientInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };

    const finalData = {
      ...formData,
      ...data, 
      quizSlug,
      quizTitle,
      clientInfo,
      submittedAt: new Date().toISOString()
    };
    
    if (displayMode === 'single-page' && !isPreview) {
      activeQuestions.forEach(q => {
        const answer = finalData[q.name];
        if (answer !== undefined) {
           recordQuestionAnswerAction(quizSlug, q.id, q.type, answer);
        }
      });
      recordFirstQuestionAnsweredAction(quizSlug);
    }

    if (isPreview && onSubmitOverride) {
        await onSubmitOverride(finalData);
        setSubmissionStatus('success');
        setIsQuizCompleted(true);
        return;
    }

    if (isPreview && !onSubmitOverride) {
        toast({title: "Pré-visualização", description: "Submissão simulada. Nenhum dado enviado."})
        setSubmissionStatus('success');
        setIsQuizCompleted(true);
        return;
    }

    try {
        const result = await serverSubmitQuizData(finalData);

        if (result.status === 'success') {
            setIsQuizCompleted(true);
            setSubmissionStatus('success');

            const quizCompleteDataFb = { quiz_slug: quizSlug, quiz_title: quizTitle };
            const leadDataFb = { 
                value: 1, 
                currency: 'BRL', 
                content_name: quizTitle,
                content_category: 'Quiz',
            };
             const quizCompleteDataGa = { 
                action: 'quiz_complete', 
                category: 'Quiz', 
                label: `${quizSlug}_Complete`, 
                quiz_slug: quizSlug, 
                quiz_title: quizTitle 
            };
             const leadDataGa = { 
                action: 'generate_lead', 
                category: 'Quiz', 
                label: `${quizSlug}_Lead`, 
                quiz_slug: quizSlug, 
                value: 1, 
                currency: 'BRL',
            };


            if (configuredFbPixelIds.length > 0) {
                trackFbCustomEvent('QuizComplete', quizCompleteDataFb, configuredFbPixelIds);
                trackFbEvent('Lead', leadDataFb, configuredFbPixelIds); 
            }
            if(isGaConfigured && googleAnalyticsId){
                trackGaEvent(quizCompleteDataGa, googleAnalyticsId);
                trackGaEvent(leadDataGa, googleAnalyticsId);
            }

        } else if (result.status === 'invalid_number') {
            setSubmissionStatus('idle');
            // Assuming the field name for whatsapp is 'whatsapp'
            setFormError('whatsapp', {
                type: 'manual',
                message: result.message || "O número de WhatsApp informado parece ser inválido. Por favor, corrija e tente novamente."
            });
            toast({
                title: "Número de WhatsApp Inválido",
                description: result.message || "Por favor, verifique o número de WhatsApp e tente enviar novamente.",
                variant: "destructive",
            });
        } else {
            setSubmissionStatus('error');
            toast({
                title: "Erro ao Enviar Respostas",
                description: result.message || "Não foi possível enviar suas respostas. Por favor, tente novamente mais tarde.",
                variant: "destructive",
            });
        }
    } catch (error) {
        setSubmissionStatus('error');
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        toast({
            title: "Erro Inesperado",
            description: `Ocorreu um erro inesperado ao processar sua solicitação: ${errorMessage}. Tente novamente mais tarde.`,
            variant: "destructive",
        });
    }
  };

  const getIconComponent = useCallback((iconName?: keyof typeof IconComponents): React.ElementType | undefined => {
    if (!iconName || typeof iconName !== 'string' || !IconComponents[iconName]) return undefined;
    return IconComponents[iconName];
  }, []);

  const QuestionRenderer = ({ question }: { question: QuizQuestion }) => {
    const QuestionIcon = question?.icon ? getIconComponent(question.icon) : null;
  
    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-start space-x-3">
          {QuestionIcon && React.createElement(QuestionIcon, { className: "h-8 w-8 text-primary mt-1 flex-shrink-0" })}
          <div>
            <Label htmlFor={question.name} className="text-xl font-semibold text-card-foreground mb-1 block font-headline">
              {question.text}
            </Label>
            {question.explanation && (
              <p className="text-sm text-muted-foreground mb-3">{question.explanation}</p>
            )}
          </div>
        </div>
  
        {question.type === 'radio' && question.options && (
          <Controller
            name={question.name}
            control={control}
            rules={{ required: 'Por favor, selecione uma opção.' }}
            render={({ field }) => (
              <RadioGroup
                onValueChange={(value) => handleValueChange(question.name, value)}
                value={field.value}
                className="space-y-2"
              >
                {question.options!.map((option, index) => {
                  const OptionIconComponent = getIconComponent(option.icon);
                  return (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-primary/10 transition-colors cursor-pointer has-[:checked]:bg-primary/20 has-[:checked]:border-primary has-[:checked]:text-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:[&_svg]:text-primary has-[:checked]:[&>label]:text-primary has-[:checked]:[&>label>p]:text-primary/80 animate-staggered-fade-in-up"
                    style={{ animationFillMode: 'backwards', animationDelay: `${400 + index * 150}ms` }}
                  >
                    {OptionIconComponent && <OptionIconComponent className="h-5 w-5 text-muted-foreground group-has-[:checked]:text-primary" />}
                    <RadioGroupItem value={option.value} id={`${question.name}-${option.value}`} className="border-muted-foreground text-primary focus:ring-primary"/>
                    <Label htmlFor={`${question.name}-${option.value}`} className="font-normal flex-1 cursor-pointer text-card-foreground group-has-[:checked]:text-primary">
                      {option.label}
                      {option.explanation && <p className="text-xs text-muted-foreground mt-1 group-has-[:checked]:text-primary/80">{option.explanation}</p>}
                    </Label>
                  </div>
                );
              })}
              </RadioGroup>
            )}
          />
        )}
  
        {question.type === 'checkbox' && question.options && (
          <Controller
            name={question.name}
            control={control}
            defaultValue={[]}
            rules={{ validate: value => (Array.isArray(value) && value.length > 0) || 'Selecione ao menos uma opção.' }}
            render={({ field }) => (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {question.options!.map((option, index) => {
                  const isSelected = field.value?.includes(option.value);
                  const OptionIconComponent = getIconComponent(option.icon);
                  const CheckCircleIcon = IconComponents.CheckCircle || 'span';
                  return (
                    <div
                      key={option.value}
                      onClick={() => {
                        const newValue = isSelected
                          ? (field.value || []).filter((v: string) => v !== option.value)
                          : [...(field.value || []), option.value];
                        handleValueChange(question.name, newValue);
                      }}
                      className={`relative p-3 border rounded-lg cursor-pointer transition-all group hover:shadow-lg animate-staggered-fade-in-up
                        ${isSelected ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
                        style={{ animationFillMode: 'backwards', animationDelay: `${400 + index * 150}ms` }}
                    >
                      {option.imageUrl && (
                        <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden">
                          <Image src={option.imageUrl} alt={option.label} data-ai-hint={option.dataAiHint || 'quiz option'} layout="fill" objectFit="cover" className="transition-transform group-hover:scale-105" />
                        </div>
                      )}
                      <div className="text-center">
                        <Label htmlFor={`${question.name}-${option.value}`} className={`font-semibold text-sm ${isSelected ? 'text-primary font-bold' : 'text-card-foreground'}`}>
                          {option.label}
                        </Label>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <CheckCircleIcon className="h-4 w-4" />
                        </div>
                      )}
                      {OptionIconComponent && !option.imageUrl && <OptionIconComponent className={`h-5 w-5 mx-auto mt-1 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
                    </div>
                  );
                })}
              </div>
            )}
          />
        )}
  
        {question.type === 'textFields' && question.fields && (
          <div className="space-y-4">
            {question.fields.map((f, index) => {
              const FieldIconComponent = getIconComponent(f.icon);
              return (
              <div
                key={f.name}
                className="space-y-1 animate-staggered-fade-in-up"
                style={{ animationFillMode: 'backwards', animationDelay: `${400 + index * 150}ms` }}
              >
                 <Label htmlFor={f.name} className="font-medium flex items-center text-card-foreground">
                   {FieldIconComponent && <FieldIconComponent className="h-4 w-4 mr-2 text-primary" />}
                   {f.label}
                </Label>
                <Controller
                  name={f.name}
                  control={control}
                  defaultValue=""
                  render={({ field: controllerField }) => (
                    <Input
                      {...controllerField}
                      id={f.name}
                      type={f.type}
                      placeholder={f.placeholder}
                      onChange={(e) => handleValueChange(f.name, e.target.value)}
                      className="bg-muted/30 border-input focus:border-primary focus:ring-primary text-card-foreground placeholder:text-muted-foreground"
                    />
                  )}
                />
                {errors[f.name] && <p className="text-sm text-destructive">{errors[f.name]?.message as string}</p>}
              </div>
            );
            })}
          </div>
        )}
        {errors[question.name] && !question.fields && <p className="text-sm text-destructive mt-2">{errors[question.name]?.message as string}</p>}
      </div>
    );
  };
  
  if ((!quizQuestions || quizQuestions.length === 0) && !isQuizCompleted) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
          <Alert className="bg-card text-card-foreground">
            {IconComponents.Info && <IconComponents.Info className="h-4 w-4" />}
            <AlertTitle>Carregando Quiz...</AlertTitle>
            <AlertDescription>
              Por favor, aguarde enquanto preparamos as perguntas.
            </AlertDescription>
          </Alert>
        </div>
      );
  }

  if (isQuizCompleted && submissionStatus === 'success') {
    const FinalSuccessIcon = SuccessIcon || IconComponents.CheckCircle;
    const GlobeIcon = IconComponents.Globe || 'span';
    const InstagramIcon = IconComponents.Instagram || 'span';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <Card className="w-full max-w-xl shadow-2xl rounded-xl overflow-hidden text-center bg-card text-card-foreground">
          <CardHeader className="p-6 bg-card">
            <div className="flex items-center justify-center space-x-3">
                <Image
                  src={logoUrl}
                  alt="Logo da Empresa"
                  data-ai-hint="company logo"
                  width={150}
                  height={50}
                  className="object-contain" 
                  priority={true}
                />
            </div>
            <CardTitle className="text-3xl mt-4 text-primary">{quizTitle}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-4 bg-card">
            <FinalSuccessIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-card-foreground">Suas respostas foram enviadas com sucesso!</p>
            <p className="text-muted-foreground">Nossa equipe entrará em contato com você em breve.</p>
            {!isPreview && (
              <div className="pt-4 space-y-3">
                <p className="text-sm text-card-foreground">Enquanto isso, que tal conhecer mais sobre nós?</p>
                {websiteUrl && websiteUrl.trim() !== "" && (
                    <Link href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary hover:underline">
                    <GlobeIcon className="mr-2 h-5 w-5" />
                    Visite nosso site
                    </Link>
                )}
                {instagramUrl && instagramUrl.trim() !== "" && (
                    <Link href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary hover:underline">
                    <InstagramIcon className="mr-2 h-5 w-5" />
                    Siga-nos no Instagram
                    </Link>
                )}
              </div>
            )}
          </CardContent>
           <CardFooter className="p-6 bg-muted/30 flex justify-center">
             <p className="text-xs text-muted-foreground">
                {footerCopyrightText}
            </p>
           </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div style={themeStyles} className={`flex flex-col items-center justify-center min-h-screen p-4 text-foreground ${isPreview ? 'h-full overflow-y-auto' : 'bg-background'}`}>
        <Card className="w-full max-w-xl shadow-2xl rounded-xl overflow-hidden mt-8 mb-8 bg-card text-card-foreground">
          <CardHeader className="p-6 bg-card">
             <div className="flex items-center space-x-3">
                <Image
                  src={logoUrl}
                  alt="Logo da Empresa"
                  data-ai-hint="company logo"
                  width={150}
                  height={50}
                  className="object-contain"
                  priority={true}
                />
                <div>
                    <CardTitle className="text-3xl font-headline text-primary">{quizTitle}</CardTitle>
                    {quizDescription && quizDescription.trim() !== "" && (
                        <CardDescription className="text-primary/80">{quizDescription}</CardDescription>
                    )}
                </div>
            </div>
          </CardHeader>
          {displayMode === 'step-by-step' && (
            <QuizProgressBar currentStep={currentStep} totalSteps={activeQuestions.length} />
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-6 md:p-8 space-y-6 bg-card relative min-h-[300px] overflow-hidden">
              <div key={currentStep} className={`w-full ${animationClass}`}>
                {displayMode === 'step-by-step' && currentQuestion && (
                  <QuestionRenderer question={currentQuestion} />
                )}
              </div>
              {displayMode === 'single-page' && activeQuestions.map((q, index) => (
                 <div
                    key={q.id}
                    className="animate-staggered-fade-in-up"
                    style={{ animationFillMode: 'backwards', animationDelay: `${index * 200}ms` }}
                  >
                    <QuestionRenderer question={q} />
                 </div>
              ))}
            </CardContent>
            
            <CardFooter className="flex justify-between p-6 bg-muted/30">
              {displayMode === 'step-by-step' ? (
                <>
                  <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 0 || submissionStatus === 'pending'} className="px-6 py-3 text-base">
                      {IconComponents.ChevronLeft && <IconComponents.ChevronLeft className="mr-2 h-5 w-5" />} Voltar
                  </Button>
                  <Button
                      key={`next-btn-${currentStep === activeQuestions.length - 1}`}
                      type="button"
                      onClick={handleNext}
                      className={`px-6 py-3 text-base ${currentStep === activeQuestions.length - 1 ? 'animate-staggered-fade-in-up' : ''}`}
                      style={{ animationDelay: '300ms' }}
                      disabled={submissionStatus === 'pending'}
                  >
                      {submissionStatus === 'pending' && IconComponents.Loader2 && <IconComponents.Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      {submissionStatus === 'pending' ? 'Enviando...' : (currentStep === activeQuestions.length - 1 ? 'Finalizar e Enviar' : 'Próximo')}
                      {submissionStatus !== 'pending' && (currentStep === activeQuestions.length - 1 ? (IconComponents.Send && <IconComponents.Send className="ml-2 h-5 w-5" />) : (IconComponents.ChevronRight && <IconComponents.ChevronRight className="ml-2 h-5 w-5" />))}
                  </Button>
                </>
              ) : (
                  <Button
                      type="submit"
                      className="w-full px-6 py-3 text-base"
                      disabled={submissionStatus === 'pending'}
                  >
                      {submissionStatus === 'pending' && IconComponents.Loader2 && <IconComponents.Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      {submissionStatus === 'pending' ? 'Enviando...' : 'Finalizar e Enviar'}
                      {submissionStatus !== 'pending' && IconComponents.Send && <IconComponents.Send className="ml-2 h-5 w-5" />}
                  </Button>
              )}
            </CardFooter>
          </form>
        </Card>
        {!isPreview && (
            <p className="text-xs text-center mt-4 text-foreground/60">
                {footerCopyrightText}
            </p>
        )}
      </div>
    </FormProvider>
  );
}
