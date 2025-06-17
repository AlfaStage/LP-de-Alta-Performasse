
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
import { trackEvent as fbTrackEvent, trackCustomEvent as fbTrackCustomEvent, getActivePixelIds } from '@/lib/fpixel';
import { event as gaEvent } from '@/lib/gtag';
import { logQuizAbandonment as serverLogQuizAbandonment, submitQuizData as serverSubmitQuizData } from '@/app/actions';
import { recordQuizStartedAction, recordQuestionAnswerAction } from '@/app/config/dashboard/quiz/actions';
import * as LucideIcons from 'lucide-react'; 
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import type { QuizQuestion, QuizOption } from '@/types/quiz'; // Added QuizOption

type FormData = Record<string, any>;

const contactSchema = z.object({
  nomeCompleto: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  whatsapp: z.string().min(10, { message: "WhatsApp inválido. Inclua o DDD." }).regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, { message: "Formato de WhatsApp inválido. Use (XX) XXXXX-XXXX ou XXXXXXXXXXX." }),
});

interface QuizFormProps {
  quizQuestions: QuizQuestion[];
  quizSlug: string;
  quizTitle?: string;
  logoUrl: string;
  facebookPixelId?: string; 
  facebookPixelIdSecondary?: string;
  googleAnalyticsId?: string; 
  clientAbandonmentWebhookUrl?: string; 
  footerCopyrightText?: string;
  onSubmitOverride?: (data: FormData) => Promise<void>;
  onAbandonmentOverride?: (data: FormData, quizSlug?: string) => Promise<void>;
  isPreview?: boolean;
}

const IconComponents = LucideIcons;

const PLACEHOLDER_FB_PIXEL_ID = "YOUR_PRIMARY_FACEBOOK_PIXEL_ID";
const PLACEHOLDER_SECONDARY_FB_PIXEL_ID = "YOUR_SECONDARY_FACEBOOK_PIXEL_ID";
const PLACEHOLDER_GA_ID = "YOUR_GA_ID";

export default function QuizForm({ 
  quizQuestions, 
  quizSlug, 
  quizTitle = "Quiz", 
  logoUrl,
  facebookPixelId,
  facebookPixelIdSecondary,
  googleAnalyticsId,
  clientAbandonmentWebhookUrl,
  footerCopyrightText = `© ${new Date().getFullYear()} Quiz. Todos os direitos reservados.`,
  onSubmitOverride,
  onAbandonmentOverride,
  isPreview = false
}: QuizFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [animationClass, setAnimationClass] = useState('animate-slide-in');
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const SuccessIcon = getSuccessIcon();

  const methods = useForm<FormData>({
    resolver: quizQuestions && quizQuestions.length > 0 && currentStep === quizQuestions.length -1 && quizQuestions[currentStep]?.type === 'textFields' ? zodResolver(contactSchema) : undefined,
    mode: 'onChange',
  });

  const { control, handleSubmit, setValue, getValues, trigger, formState: { errors, isValid: formIsValid }, setError: setFormError, clearErrors } = methods;

  const activeQuestions = useMemo(() => {
    if (!quizQuestions) return [];
    return quizQuestions.filter(q => !q.condition || q.condition(formData));
  }, [formData, quizQuestions]);
  
  const currentQuestion = activeQuestions[currentStep];

  const configuredFbPixelIds = useMemo(() => getActivePixelIds(facebookPixelId, facebookPixelIdSecondary), [facebookPixelId, facebookPixelIdSecondary]);
  const isFbPixelConfigured = configuredFbPixelIds.length > 0;
  const isGaConfigured = !!googleAnalyticsId && googleAnalyticsId.trim() !== "" && googleAnalyticsId !== PLACEHOLDER_GA_ID;


  useEffect(() => {
    if (!quizQuestions || quizQuestions.length === 0 || isPreview) return;
    const quizNameForTracking = `IceLazerLeadFilter_${quizSlug}`;
    
    recordQuizStartedAction(quizSlug).catch(err => console.error("Failed to record quiz started:", err));
    
    if (isFbPixelConfigured) {
      console.log("FB Pixel: QuizStart event triggered for", quizNameForTracking, "Pixels:", configuredFbPixelIds);
      fbTrackCustomEvent('QuizStart', { quiz_name: quizNameForTracking }, configuredFbPixelIds);
    }
    if(isGaConfigured) {
        console.log("GA: quiz_start event triggered for", quizNameForTracking);
        gaEvent({ action: 'quiz_start', category: 'Quiz', label: `${quizNameForTracking}_Start` });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizSlug, isFbPixelConfigured, isGaConfigured, isPreview]); 

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isPreview || !isQuizCompleted && Object.keys(formData).length > 0 && submissionStatus !== 'success' && quizQuestions && quizQuestions.length > 0) {
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
          quizType: `IceLazerLeadFilter_Abandonment_${quizSlug}`, 
          quizSlug,
          clientInfo,
          abandonedAt: new Date().toISOString()
        };
        
        if (onAbandonmentOverride) {
          onAbandonmentOverride(dataToLog, quizSlug);
        } else {
            const webhookUrl = clientAbandonmentWebhookUrl; 
            if (webhookUrl && webhookUrl !== "YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL") {
              if (navigator.sendBeacon) {
                try {
                  const blob = new Blob([JSON.stringify(dataToLog)], { type: 'application/json' });
                  navigator.sendBeacon(webhookUrl, blob);
                  console.log("Quiz abandonment data sent to client-side webhook via sendBeacon:", dataToLog);
                } catch (e) {
                   fetch(webhookUrl, { method: 'POST', body: JSON.stringify(dataToLog), headers: {'Content-Type': 'application/json'}, keepalive: true }).catch(()=>{});
                   console.log("Quiz abandonment data sent to client-side webhook via fetch (fallback):", dataToLog);
                }
              } else {
                fetch(webhookUrl, { method: 'POST', body: JSON.stringify(dataToLog), headers: {'Content-Type': 'application/json'}, keepalive: true }).catch(()=>{});
                console.log("Quiz abandonment data sent to client-side webhook via fetch:", dataToLog);
              }
            } else {
               console.log("Quiz abandonment: No client-side webhook, attempting server-side log.", dataToLog);
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
    const quizNameForTracking = `IceLazerLeadFilter_${quizSlug}`;

    let stepIsValid = true;
    if (currentQuestion.type === 'textFields' && currentQuestion.fields) {
        const fieldNamesToValidate = currentQuestion.fields.map(f => f.name);
        stepIsValid = await trigger(fieldNamesToValidate);
    } else if (currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') {
        const value = getValues(currentQuestion.name);
        stepIsValid = !!value && (Array.isArray(value) ? value.length > 0 : true);
        if (!stepIsValid) {
            setFormError(currentQuestion.name, { type: "manual", message: "Por favor, selecione uma opção."});
        } else {
            clearErrors(currentQuestion.name);
        }
    }

    const answerValue = getValues(currentQuestion.name);
    const answerString = Array.isArray(answerValue) ? answerValue.join(', ') : String(answerValue);

    const answerDataFb = {
      question_id: currentQuestion.id,
      answer: answerString,
      step: currentStep + 1,
      quiz_name: quizNameForTracking
    };
    const gaAnswerData = {
      category: 'Quiz',
      label: `Question: ${currentQuestion.id}`,
      question_id: currentQuestion.id,
      answer: answerString,
      step_number: currentStep + 1,
      quiz_name: quizNameForTracking
    };

    if (stepIsValid) {
        if (!isPreview) {
            recordQuestionAnswerAction(quizSlug, currentQuestion.id, currentQuestion.name, answerValue, currentQuestion.type)
              .catch(err => console.error("Failed to record question answer:", err));

            if (isFbPixelConfigured) {
              console.log("FB Pixel: QuestionAnswered event triggered.", answerDataFb, "Pixels:", configuredFbPixelIds);
              fbTrackEvent('QuestionAnswered', answerDataFb, configuredFbPixelIds);
            }
            if(isGaConfigured) {
              console.log("GA: question_answered event triggered.", gaAnswerData);
              gaEvent({ action: 'question_answered', ...gaAnswerData });
            }
        }

        if (currentStep < activeQuestions.length - 1) {
            setAnimationClass('animate-slide-out');
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setAnimationClass('animate-slide-in');
            }, 300);
        } else { // Last step, proceed to submit
            await handleSubmit(onSubmit)();
        }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0 && submissionStatus !== 'pending') {
      setAnimationClass('animate-slide-out');
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setAnimationClass('animate-slide-in');
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
    const quizNameForTracking = `IceLazerLeadFilter_${quizSlug}`;

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

    // Record answer for the last question (contact step) if not already recorded by handleNext
    if (!isPreview && currentQuestion && currentQuestion.id === activeQuestions[activeQuestions.length -1].id) {
        const lastAnswerValue = currentQuestion.fields ? getValues(currentQuestion.fields.map(f => f.name)) : getValues(currentQuestion.name);
        recordQuestionAnswerAction(quizSlug, currentQuestion.id, currentQuestion.name, lastAnswerValue, currentQuestion.type)
            .catch(err => console.error("Failed to record final question answer:", err));
    }

    if (isPreview && onSubmitOverride) {
        await onSubmitOverride(finalData);
        setSubmissionStatus('success'); 
        setIsQuizCompleted(true); 
        return;
    }
    
    if (isPreview && !onSubmitOverride) {
        console.log("Preview mode: onSubmit called but no override provided.", finalData);
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
            
            const leadDataFb = {
                content_name: `${quizNameForTracking}_Submission`,
                value: 50.00, 
                currency: 'BRL', 
                lead_name: finalData.nomeCompleto,
                lead_whatsapp: finalData.whatsapp
            };
            const quizCompleteDataFb = { quiz_name: quizNameForTracking, ...finalData };
            
            const leadDataGa = {
                category: 'Quiz',
                label: `${quizNameForTracking}_Lead`,
                value: 50, 
                lead_name: finalData.nomeCompleto,
            };
            const quizCompleteDataGa = {
                category: 'Quiz',
                label: `${quizNameForTracking}_Complete`,
                quiz_name: quizNameForTracking,
                 ...finalData 
            };

            if (isFbPixelConfigured) {
                console.log("FB Pixel: QuizComplete event triggered.", quizCompleteDataFb, "Pixels:", configuredFbPixelIds);
                fbTrackCustomEvent('QuizComplete', quizCompleteDataFb, configuredFbPixelIds);
                console.log("FB Pixel: Lead event triggered.", leadDataFb, "Pixels:", configuredFbPixelIds);
                fbTrackEvent('Lead', leadDataFb, configuredFbPixelIds);
            }
            if(isGaConfigured){
                console.log("GA: quiz_complete event triggered.", quizCompleteDataGa);
                gaEvent({action: 'quiz_complete', ...quizCompleteDataGa});
                console.log("GA: generate_lead event triggered.", leadDataGa);
                gaEvent({action: 'generate_lead', ...leadDataGa});
            }

        } else if (result.status === 'invalid_number') {
            setSubmissionStatus('idle'); 
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
        console.error("Client-side error during onSubmit:", error);
    }
  };
  
  const getIconComponent = useCallback((iconName?: keyof typeof IconComponents): React.ElementType | undefined => {
    if (!iconName || typeof iconName !== 'string' || !IconComponents[iconName]) return undefined;
    return IconComponents[iconName];
  }, []);
  
  const loadingJsx = ( 
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

  if ((!quizQuestions || quizQuestions.length === 0) && !isQuizCompleted) {
    return loadingJsx;
  }
  
  if (!currentQuestion && !isQuizCompleted && quizQuestions && quizQuestions.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
          <Alert variant="destructive" className="bg-card text-card-foreground">
            {IconComponents.AlertTriangle && <IconComponents.AlertTriangle className="h-4 w-4" />}
            <AlertTitle>Erro no Quiz</AlertTitle>
            <AlertDescription>
              Não foi possível carregar as perguntas do quiz. Tente recarregar a página.
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
                  className="h-auto w-28 md:w-36" 
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
                <Link href="https://espacoicelaser.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary hover:underline">
                  <GlobeIcon className="mr-2 h-5 w-5" />
                  Visite nosso site
                </Link>
                <Link href="https://www.instagram.com/icelaseroficial/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary hover:underline">
                  <InstagramIcon className="mr-2 h-5 w-5" />
                  Siga-nos no Instagram
                </Link>
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

  const QuestionIcon = currentQuestion?.icon ? getIconComponent(currentQuestion.icon) : null;

  return (
    <FormProvider {...methods}>
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 text-foreground ${isPreview ? 'h-full overflow-y-auto' : 'bg-background'}`}>
        <Card className={`w-full max-w-xl shadow-2xl rounded-xl overflow-hidden ${animationClass} mt-8 mb-8 bg-card text-card-foreground`}>
          <CardHeader className="p-6 bg-card">
             <div className="flex items-center space-x-3">
                <Image 
                  src={logoUrl}
                  alt="Logo da Empresa"
                  data-ai-hint="company logo" 
                  width={150} 
                  height={50}
                  className="h-auto w-28 md:w-36"
                  priority={true} 
                />
                <div>
                    <CardTitle className="text-3xl font-headline text-primary">{quizTitle}</CardTitle>
                    <CardDescription className="text-primary/80">Descubra o tratamento ideal para você!</CardDescription>
                </div>
            </div>
          </CardHeader>
          {currentQuestion && <QuizProgressBar currentStep={currentStep} totalSteps={activeQuestions.length} />}
          <CardContent className="p-6 md:p-8 space-y-6 bg-card">
            {currentQuestion && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    {QuestionIcon && React.createElement(QuestionIcon, { className: "h-8 w-8 text-primary mt-1 flex-shrink-0" })}
                    <div>
                      <Label htmlFor={currentQuestion.name} className="text-xl font-semibold text-card-foreground mb-1 block font-headline">
                        {currentQuestion.text}
                      </Label>
                      {currentQuestion.explanation && (
                        <p className="text-sm text-muted-foreground mb-3">{currentQuestion.explanation}</p>
                      )}
                    </div>
                  </div>

                  {currentQuestion.type === 'radio' && currentQuestion.options && (
                    <Controller
                      name={currentQuestion.name}
                      control={control}
                      rules={{ required: 'Por favor, selecione uma opção.' }}
                      render={({ field }) => (
                        <RadioGroup
                          onValueChange={(value) => handleValueChange(currentQuestion.name, value)}
                          value={field.value}
                          className="space-y-2"
                        >
                          {currentQuestion.options!.map(option => {
                            const OptionIconComponent = getIconComponent(option.icon);
                            return (
                            <div 
                              key={option.value} 
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-primary/10 transition-colors cursor-pointer has-[:checked]:bg-primary/20 has-[:checked]:border-primary has-[:checked]:text-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:checked]:[&_svg]:text-primary has-[:checked]:[&>label]:text-primary has-[:checked]:[&>label>p]:text-primary/80"
                            >
                              {OptionIconComponent && <OptionIconComponent className="h-5 w-5 text-muted-foreground group-has-[:checked]:text-primary" />}
                              <RadioGroupItem value={option.value} id={`${currentQuestion.name}-${option.value}`} className="border-muted-foreground text-primary focus:ring-primary"/>
                              <Label htmlFor={`${currentQuestion.name}-${option.value}`} className="font-normal flex-1 cursor-pointer text-card-foreground group-has-[:checked]:text-primary">
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

                 {currentQuestion.type === 'checkbox' && currentQuestion.options && (
                     <Controller
                        name={currentQuestion.name}
                        control={control}
                        defaultValue={[]}
                        rules={{ validate: value => (Array.isArray(value) && value.length > 0) || 'Selecione ao menos uma opção.' }}
                        render={({ field }) => (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {currentQuestion.options!.map(option => {
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
                                    handleValueChange(currentQuestion.name, newValue);
                                  }}
                                  className={`relative p-3 border rounded-lg cursor-pointer transition-all group hover:shadow-lg
                                    ${isSelected ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
                                >
                                  {option.imageUrl && (
                                    <div className="relative w-full h-24 mb-2 rounded-md overflow-hidden">
                                      <Image src={option.imageUrl} alt={option.label} data-ai-hint={option.dataAiHint || 'body area'} layout="fill" objectFit="cover" className="transition-transform group-hover:scale-105" />
                                    </div>
                                  )}
                                  <div className="text-center">
                                    <p className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>Depilação a laser</p>
                                    <Label htmlFor={`${currentQuestion.name}-${option.value}`} className={`font-semibold text-sm ${isSelected ? 'text-primary font-bold' : 'text-card-foreground'}`}>
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

                  {currentQuestion.type === 'textFields' && currentQuestion.fields && (
                    <div className="space-y-4">
                      {currentQuestion.fields.map(f => {
                        const FieldIconComponent = getIconComponent(f.icon);
                        return (
                        <div key={f.name} className="space-y-1">
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
                  {errors[currentQuestion.name] && !currentQuestion.fields && <p className="text-sm text-destructive mt-2">{errors[currentQuestion.name]?.message as string}</p>}
                </div>
              </form>
            )}
          </CardContent>
          {currentQuestion && (
             <CardFooter className="flex justify-between p-6 bg-muted/30">
                <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0 || submissionStatus === 'pending'} className="px-6 py-3 text-base">
                    {IconComponents.ChevronLeft && <IconComponents.ChevronLeft className="mr-2 h-5 w-5" />} Voltar
                </Button>
                <Button 
                    onClick={handleNext} 
                    className="px-6 py-3 text-base" 
                    disabled={
                        submissionStatus === 'pending' ||
                        (currentQuestion.type !== 'textFields' && (!getValues(currentQuestion.name) || (Array.isArray(getValues(currentQuestion.name)) && getValues(currentQuestion.name).length === 0))) ||
                        (currentQuestion.type === 'textFields' && !formIsValid && Object.keys(errors).length > 0) 
                    }
                >
                    {submissionStatus === 'pending' && IconComponents.Loader2 && <IconComponents.Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {submissionStatus === 'pending' ? 'Enviando...' : (currentStep === activeQuestions.length - 1 ? 'Finalizar e Contato' : 'Próximo')}
                    {submissionStatus !== 'pending' && (currentStep === activeQuestions.length - 1 ? (IconComponents.Send && <IconComponents.Send className="ml-2 h-5 w-5" />) : (IconComponents.ChevronRight && <IconComponents.ChevronRight className="ml-2 h-5 w-5" />))}
                </Button>
            </CardFooter>
          )}
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

