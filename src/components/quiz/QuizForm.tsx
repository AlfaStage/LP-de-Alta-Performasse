
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSuccessIcon } from '@/config/quizConfig'; // Keep for success icon
import QuizProgressBar from './QuizProgressBar';
import { trackEvent as fbTrackEvent, trackCustomEvent as fbTrackCustomEvent } from '@/lib/fpixel';
import { event as gaEvent } from '@/lib/gtag';
import { logQuizAbandonment, submitQuizData } from '@/app/actions';
import * as LucideIcons from 'lucide-react'; // Import all for dynamic icons
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { areAnyPixelsConfigured } from '@/config/pixelConfig';
import type { QuizQuestion, QuizOption, FormFieldConfig } from '@/types/quiz';
import { CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL } from '@/config/appConfig';

type FormData = Record<string, any>;

const contactSchema = z.object({
  nomeCompleto: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  whatsapp: z.string().min(10, { message: "WhatsApp inválido. Inclua o DDD." }).regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, { message: "Formato de WhatsApp inválido. Use (XX) XXXXX-XXXX ou XXXXXXXXXXX." }),
});

interface QuizFormProps {
  quizQuestions: QuizQuestion[];
  quizSlug: string;
  quizTitle?: string;
}

export default function QuizForm({ quizQuestions, quizSlug, quizTitle = "Quiz" }: QuizFormProps) {
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

  const { control, handleSubmit, setValue, getValues, trigger, formState: { errors } } = methods;

  const activeQuestions = useMemo(() => {
    if (!quizQuestions) return [];
    // Simplified condition handling for now. Complex conditions from JSON are hard.
    return quizQuestions.filter(q => !q.condition || q.condition(formData));
  }, [formData, quizQuestions]);
  
  const currentQuestion = activeQuestions[currentStep];

  useEffect(() => {
    if (!quizQuestions || quizQuestions.length === 0) return;
    const quizNameForTracking = `IceLazerLeadFilter_${quizSlug}`;
    if (areAnyPixelsConfigured()) {
      console.log("FB Pixel: QuizStart event triggered for", quizNameForTracking);
      fbTrackCustomEvent('QuizStart', { quiz_name: quizNameForTracking });
    }
    console.log("GA: quiz_start event triggered for", quizNameForTracking);
    gaEvent({ action: 'quiz_start', category: 'Quiz', label: `${quizNameForTracking}_Start` });
  }, [quizSlug, quizQuestions]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isQuizCompleted && Object.keys(formData).length > 0 && submissionStatus !== 'success' && quizQuestions && quizQuestions.length > 0) {
        const webhookUrl = CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL;
        if (webhookUrl && webhookUrl !== "YOUR_CLIENT_SIDE_ABANDONMENT_WEBHOOK_URL") {
          const dataToLog = { ...getValues(), abandonedAtStep: currentQuestion?.id || currentStep, quizType: `IceLazerLeadFilter_Abandonment_${quizSlug}`, quizSlug };
          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(dataToLog)], { type: 'application/json' });
            navigator.sendBeacon(webhookUrl, blob);
          } else {
            // Fallback for browsers that don't support sendBeacon - less reliable
            fetch(webhookUrl, { method: 'POST', body: JSON.stringify(dataToLog), headers: {'Content-Type': 'application/json'}, keepalive: true }).catch(()=>{});
          }
        } else {
          // If client-side URL isn't set, try server-side action (might not always execute on page close)
           logQuizAbandonment({ ...getValues(), abandonedAtStep: currentQuestion?.id || currentStep, quizType: `IceLazerLeadFilter_Abandonment_${quizSlug}` }, quizSlug);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, currentStep, isQuizCompleted, currentQuestion, getValues, submissionStatus, quizSlug, quizQuestions]);

  const handleNext = async () => {
    if (submissionStatus === 'pending' || !currentQuestion) return;
    const quizNameForTracking = `IceLazerLeadFilter_${quizSlug}`;

    let stepIsValid = true;
    if (currentQuestion.type === 'textFields' && currentQuestion.fields) {
        stepIsValid = await trigger(currentQuestion.fields.map(f => f.name));
    } else if (currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') {
        const value = getValues(currentQuestion.name);
        stepIsValid = !!value && (Array.isArray(value) ? value.length > 0 : true);
        if (!stepIsValid) {
            methods.setError(currentQuestion.name, { type: "manual", message: "Por favor, selecione uma opção."});
        } else {
            methods.clearErrors(currentQuestion.name);
        }
    }

    const answerData = {
      question_id: currentQuestion.id,
      answer: getValues(currentQuestion.name),
      step: currentStep + 1,
      quiz_name: quizNameForTracking
    };
    const gaAnswerData = {
      category: 'Quiz',
      label: `Question: ${currentQuestion.id}`,
      question_id: currentQuestion.id,
      answer: getValues(currentQuestion.name)?.toString(),
      step_number: currentStep + 1,
      quiz_name: quizNameForTracking
    };

    if (stepIsValid && currentStep < activeQuestions.length - 1) {
      setAnimationClass('animate-slide-out');
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimationClass('animate-slide-in');
      }, 300);
      if (areAnyPixelsConfigured()) {
        console.log("FB Pixel: QuestionAnswered event triggered.", answerData);
        fbTrackEvent('QuestionAnswered', answerData);
      }
      console.log("GA: question_answered event triggered.", gaAnswerData);
      gaEvent({ action: 'question_answered', ...gaAnswerData });
    } else if (stepIsValid && currentStep === activeQuestions.length - 1) {
      if (areAnyPixelsConfigured()) {
        console.log("FB Pixel: QuestionAnswered event triggered (last question).", answerData);
        fbTrackEvent('QuestionAnswered', {
          question_id: currentQuestion.id,
          answer: getValues(currentQuestion.fields?.map(f => f.name) || []),
          step: currentStep + 1,
          quiz_name: quizNameForTracking
        });
      }
      const lastGaAnswerData = {
        category: 'Quiz',
        label: `Question: ${currentQuestion.id}`,
        question_id: currentQuestion.id,
        answer: getValues(currentQuestion.fields?.map(f => f.name) || [])?.toString(),
        step_number: currentStep + 1,
        quiz_name: quizNameForTracking
      };
      console.log("GA: question_answered event triggered (last question).", lastGaAnswerData);
      gaEvent({ action: 'question_answered', ...lastGaAnswerData });
      await handleSubmit(onSubmit)();
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
    if (errors[name]) methods.clearErrors(name);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (submissionStatus === 'pending') return;
    const quizNameForTracking = `IceLazerLeadFilter_${quizSlug}`;

    setSubmissionStatus('pending');
    const finalData = { ...formData, ...data, quizSlug, quizTitle }; 

    try {
        const result = await submitQuizData(finalData);

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

            if (areAnyPixelsConfigured()) {
                console.log("FB Pixel: QuizComplete event triggered.", quizCompleteDataFb);
                fbTrackCustomEvent('QuizComplete', quizCompleteDataFb);
                console.log("FB Pixel: Lead event triggered.", leadDataFb);
                fbTrackEvent('Lead', leadDataFb);
            }
            console.log("GA: quiz_complete event triggered.", quizCompleteDataGa);
            gaEvent({action: 'quiz_complete', ...quizCompleteDataGa});
            console.log("GA: generate_lead event triggered.", leadDataGa);
            gaEvent({action: 'generate_lead', ...leadDataGa});

        } else if (result.status === 'invalid_number') {
            setSubmissionStatus('idle'); 
            methods.setError('whatsapp', {
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
  
  const getIconComponent = (iconName?: keyof typeof LucideIcons): React.ElementType | undefined => {
    if (!iconName) return undefined;
    return LucideIcons[iconName];
  };
  
  const loadingJsx = (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Alert>
        <LucideIcons.Info className="h-4 w-4" />
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
      // This might happen if activeQuestions becomes empty after filtering,
      // or if quizQuestions is initially set but then becomes empty.
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Alert variant="destructive">
            <LucideIcons.AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro no Quiz</AlertTitle>
            <AlertDescription>
              Não foi possível carregar as perguntas do quiz. Tente recarregar a página.
            </AlertDescription>
          </Alert>
        </div>
      );
  }


  if (isQuizCompleted && submissionStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-xl shadow-2xl rounded-xl overflow-hidden text-center">
          <CardHeader className="bg-card p-6">
            <div className="flex items-center justify-center space-x-3">
                <Image 
                  src="https://espacoicelaser.com/wp-content/themes/icelaser/images/logo-ice-laser.png" 
                  alt="Ice Lazer Logo" 
                  data-ai-hint="company logo" 
                  width={150} 
                  height={50} 
                  className="h-auto w-28 md:w-36" 
                />
            </div>
            <CardTitle className="text-3xl mt-4 text-primary">Obrigado!</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-4">
            <SuccessIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">Suas respostas foram enviadas com sucesso!</p>
            <p className="text-muted-foreground">Nossa equipe entrará em contato com você em breve.</p>
            <div className="pt-4 space-y-3">
              <p className="text-sm text-foreground">Enquanto isso, que tal conhecer mais sobre nós?</p>
              <Link href="https://espacoicelaser.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary hover:underline">
                <LucideIcons.Globe className="mr-2 h-5 w-5" />
                Visite nosso site
              </Link>
              <Link href="https://www.instagram.com/icelaseroficial/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-primary hover:underline">
                <LucideIcons.Instagram className="mr-2 h-5 w-5" />
                Siga-nos no Instagram
              </Link>
            </div>
          </CardContent>
           <CardFooter className="p-6 bg-muted/30 flex justify-center">
             <p className="text-xs text-foreground/60">
                Ice Lazer &copy; {new Date().getFullYear()}. Todos os direitos reservados.
            </p>
           </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className={`w-full max-w-xl shadow-2xl rounded-xl overflow-hidden ${animationClass} mt-8 mb-8`}>
          <CardHeader className="bg-card p-6">
             <div className="flex items-center space-x-3">
                <Image 
                  src="https://espacoicelaser.com/wp-content/themes/icelaser/images/logo-ice-laser.png" 
                  alt="Ice Lazer Logo" 
                  data-ai-hint="company logo" 
                  width={150} 
                  height={50}
                  className="h-auto w-28 md:w-36"
                />
                <div>
                    <CardTitle className="text-3xl font-headline text-primary">{quizTitle}</CardTitle>
                    <CardDescription className="text-primary/80">Descubra o tratamento ideal para você!</CardDescription>
                </div>
            </div>
          </CardHeader>
          {currentQuestion && <QuizProgressBar currentStep={currentStep} totalSteps={activeQuestions.length} />}
          <CardContent className="p-6 md:p-8 space-y-6">
            {currentQuestion && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    {currentQuestion.icon && React.createElement(getIconComponent(currentQuestion.icon)!, { className: "h-8 w-8 text-primary mt-1 flex-shrink-0" })}
                    <div>
                      <Label htmlFor={currentQuestion.name} className="text-xl font-semibold text-foreground mb-1 block font-headline">
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
                            const OptionIcon = getIconComponent(option.icon);
                            return (
                            <div 
                              key={option.value} 
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-accent-foreground/50 has-[:checked]:text-accent-foreground has-[:checked]:[&_svg]:text-accent-foreground has-[:checked]:[&>label]:text-accent-foreground has-[:checked]:[&>label>p]:text-accent-foreground/80"
                            >
                              {OptionIcon && <OptionIcon className="h-5 w-5 text-primary group-has-[:checked]:text-accent-foreground" />}
                              <RadioGroupItem value={option.value} id={`${currentQuestion.name}-${option.value}`} className="text-primary focus:ring-primary"/>
                              <Label htmlFor={`${currentQuestion.name}-${option.value}`} className="font-normal flex-1 cursor-pointer group-has-[:checked]:text-accent-foreground">
                                {option.label}
                                {option.explanation && <p className="text-xs text-muted-foreground mt-1 group-has-[:checked]:text-accent-foreground/80">{option.explanation}</p>}
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
                              const OptionIcon = getIconComponent(option.icon);
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
                                    <p className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-primary/80'}`}>Depilação a laser</p>
                                    <Label htmlFor={`${currentQuestion.name}-${option.value}`} className={`font-semibold text-sm ${isSelected ? 'text-primary font-bold' : 'text-foreground'}`}>
                                      {option.label}
                                    </Label>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                      <LucideIcons.CheckCircle className="h-4 w-4" />
                                    </div>
                                  )}
                                  {OptionIcon && !option.imageUrl && <OptionIcon className={`h-5 w-5 mx-auto mt-1 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
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
                        const FieldIcon = getIconComponent(f.icon);
                        return (
                        <div key={f.name} className="space-y-1">
                           <Label htmlFor={f.name} className="font-medium flex items-center">
                             {FieldIcon && <FieldIcon className="h-4 w-4 mr-2 text-primary" />} 
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
                                className="bg-background border-input focus:border-primary focus:ring-primary"
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
                <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0 || submissionStatus === 'pending'} className="hover:bg-accent/30 px-6 py-3 text-base">
                    <LucideIcons.ChevronLeft className="mr-2 h-5 w-5" /> Voltar
                </Button>
                <Button 
                    onClick={handleNext} 
                    className="bg-accent text-accent-foreground hover:bg-accent/80 px-6 py-3 text-base"
                    disabled={
                    submissionStatus === 'pending' ||
                    (currentQuestion.type !== 'textFields' && (!getValues(currentQuestion.name) || (Array.isArray(getValues(currentQuestion.name)) && getValues(currentQuestion.name).length === 0)))
                    }
                >
                    {submissionStatus === 'pending' ? (
                    <LucideIcons.Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : null}
                    {submissionStatus === 'pending' ? 'Enviando...' : (currentStep === activeQuestions.length - 1 ? 'Finalizar e Contato' : 'Próximo')}
                    {submissionStatus !== 'pending' && (currentStep === activeQuestions.length - 1 ? <LucideIcons.Send className="ml-2 h-5 w-5" /> : <LucideIcons.ChevronRight className="ml-2 h-5 w-5" />)}
                </Button>
            </CardFooter>
          )}
        </Card>
        <p className="text-xs text-center mt-4 text-foreground/60">
            Ice Lazer &copy; {new Date().getFullYear()}. Todos os direitos reservados.
        </p>
      </div>
    </FormProvider>
  );
}
