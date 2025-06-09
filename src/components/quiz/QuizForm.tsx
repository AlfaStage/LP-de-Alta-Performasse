
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
import { quizQuestions, successIcon as SuccessIcon } from '@/config/quizConfig';
import QuizProgressBar from './QuizProgressBar';
import { trackEvent, trackCustomEvent } from '@/lib/fpixel';
import { logQuizAbandonment, submitQuizData } from '@/app/actions';
import { ChevronLeft, ChevronRight, Send, Info, CheckCircle, Loader2, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

type FormData = Record<string, any>;

const contactSchema = z.object({
  nomeCompleto: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  whatsapp: z.string().min(10, { message: "WhatsApp inválido. Inclua o DDD." }).regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/, { message: "Formato de WhatsApp inválido. Use (XX) XXXXX-XXXX ou XXXXXXXXXXX." }),
});


export default function QuizForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [animationClass, setAnimationClass] = useState('animate-slide-in');
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const methods = useForm<FormData>({
    resolver: currentStep === quizQuestions.length -1 && quizQuestions[currentStep]?.type === 'textFields' ? zodResolver(contactSchema) : undefined,
    mode: 'onChange', // Validar onChange para feedback imediato
  });

  const { control, handleSubmit, setValue, getValues, trigger, formState: { errors } } = methods;

  const activeQuestions = useMemo(() => {
    return quizQuestions.filter(q => !q.condition || q.condition(formData));
  }, [formData]);
  
  const currentQuestion = activeQuestions[currentStep];

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID !== "YOUR_FACEBOOK_PIXEL_ID") {
      trackCustomEvent('QuizStart', { quiz_name: 'IceLazerLeadFilter_V2' });
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isQuizCompleted && Object.keys(formData).length > 0 && submissionStatus !== 'success') {
        const webhookUrl = process.env.NEXT_PUBLIC_QUIZ_ABANDONMENT_WEBHOOK_URL || "YOUR_WEBHOOK_URL_CLIENT";
        if (webhookUrl !== "YOUR_WEBHOOK_URL_CLIENT" && navigator.sendBeacon) {
            const dataToLog = { ...getValues(), abandonedAtStep: currentQuestion?.id || currentStep, quizType: "IceLazerLeadFilter_Abandonment_V2" };
            const blob = new Blob([JSON.stringify(dataToLog)], { type: 'application/json' });
            navigator.sendBeacon(webhookUrl, blob);
        } else if (webhookUrl === "YOUR_WEBHOOK_URL_CLIENT") { // fallback if sendBeacon not supported or URL is placeholder
            logQuizAbandonment({ ...getValues(), abandonedAtStep: currentQuestion?.id || currentStep, quizType: "IceLazerLeadFilter_Abandonment_V2" });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, currentStep, isQuizCompleted, currentQuestion, getValues, submissionStatus]);

  const handleNext = async () => {
    if (submissionStatus === 'pending') return;

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

    if (stepIsValid && currentStep < activeQuestions.length - 1) {
      setAnimationClass('animate-slide-out');
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setAnimationClass('animate-slide-in');
      }, 300);
      if (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID !== "YOUR_FACEBOOK_PIXEL_ID") {
        trackEvent('QuestionAnswered', { 
          question_id: currentQuestion.id, 
          answer: getValues(currentQuestion.name),
          step: currentStep + 1,
          quiz_name: 'IceLazerLeadFilter_V2' 
        });
      }
    } else if (stepIsValid && currentStep === activeQuestions.length - 1) {
      // This is the final step, so we submit the form.
      if (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID !== "YOUR_FACEBOOK_PIXEL_ID") {
        trackEvent('QuestionAnswered', { 
          question_id: currentQuestion.id, 
          answer: getValues(currentQuestion.fields?.map(f => f.name) || []), 
          step: currentStep + 1,
          quiz_name: 'IceLazerLeadFilter_V2' 
        });
      }
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
    setValue(name, value, { shouldValidate: true }); // Validate on change for immediate feedback
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) methods.clearErrors(name);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (submissionStatus === 'pending') return;

    setSubmissionStatus('pending');
    const finalData = { ...formData, ...data}; 

    try {
        const result = await submitQuizData(finalData);

        if (result.status === 'success') {
            setIsQuizCompleted(true);
            setSubmissionStatus('success');
            if (process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID !== "YOUR_FACEBOOK_PIXEL_ID") {
                trackCustomEvent('QuizComplete', { quiz_name: 'IceLazerLeadFilter_V2', ...finalData });
                trackEvent('Lead', { 
                    content_name: 'IceLazerLeadFilter_V2_Submission',
                    value: 50.00, 
                    currency: 'BRL', 
                    lead_name: finalData.nomeCompleto,
                    lead_whatsapp: finalData.whatsapp
                });
            }
        } else if (result.status === 'invalid_number') {
            setSubmissionStatus('idle'); // Allow user to correct and resubmit
            methods.setError('whatsapp', {
                type: 'manual',
                message: result.message || "O número de WhatsApp informado parece ser inválido. Por favor, corrija e tente novamente."
            });
            toast({
                title: "Número de WhatsApp Inválido",
                description: result.message || "Por favor, verifique o número de WhatsApp e tente enviar novamente.",
                variant: "destructive",
            });
        } else { // 'webhook_error' or 'network_error'
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

  if (isQuizCompleted && submissionStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-primary/30">
         <div className="w-full max-w-3xl mb-6">
            <Image
              src="https://espacoicelaser.com/wp-content/uploads/2025/04/BANNER-PRINCIPAL-aspect-ratio-1920-300-2.png"
              alt="Ice Lazer Banner Principal"
              data-ai-hint="clinic banner"
              width={1920}
              height={300}
              className="w-full h-auto rounded-lg shadow-lg"
              priority
            />
          </div>
        <Card className="w-full max-w-xl shadow-2xl rounded-xl overflow-hidden text-center">
          <CardHeader className="bg-primary/80 text-primary-foreground p-6">
            <div className="flex items-center justify-center space-x-3">
                <Image 
                  src="https://espacoicelaser.com/wp-content/themes/icelaser/images/logo-ice-laser.png" 
                  alt="Ice Lazer Logo" 
                  data-ai-hint="company logo" 
                  width={150} 
                  height={50} 
                  className="h-auto w-auto" 
                />
            </div>
            <CardTitle className="text-3xl mt-4">Obrigado!</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-4">
            <SuccessIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">Suas respostas foram enviadas com sucesso!</p>
            <p className="text-muted-foreground">Nossa equipe entrará em contato com você em breve.</p>
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
  
  if (!currentQuestion && !isQuizCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Carregando Quiz...</AlertTitle>
          <AlertDescription>
            Por favor, aguarde enquanto preparamos as perguntas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <FormProvider {...methods}>
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-primary/30">
        <div className="w-full max-w-3xl mb-6">
            <Image
              src="https://espacoicelaser.com/wp-content/uploads/2025/04/BANNER-PRINCIPAL-aspect-ratio-1920-300-2.png"
              alt="Ice Lazer Banner Principal"
              data-ai-hint="clinic banner"
              width={1920}
              height={300}
              className="w-full h-auto rounded-lg shadow-lg"
              priority
            />
        </div>
        <Card className={`w-full max-w-xl shadow-2xl rounded-xl overflow-hidden ${animationClass}`}>
          <CardHeader className="bg-primary/80 text-primary-foreground p-6">
             <div className="flex items-center space-x-3">
                <Image 
                  src="https://espacoicelaser.com/wp-content/themes/icelaser/images/logo-ice-laser.png" 
                  alt="Ice Lazer Logo" 
                  data-ai-hint="company logo" 
                  width={150} 
                  height={50}
                  className="h-auto w-auto"
                />
                <div>
                    <CardTitle className="text-3xl font-headline">Ice Lazer Quiz</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Descubra o tratamento ideal para você!</CardDescription>
                </div>
            </div>
          </CardHeader>
          {currentQuestion && <QuizProgressBar currentStep={currentStep} totalSteps={activeQuestions.length} />}
          <CardContent className="p-6 md:p-8 space-y-6">
            {currentQuestion && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    {currentQuestion.icon && <currentQuestion.icon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />}
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
                          {currentQuestion.options!.map(option => (
                            <div 
                              key={option.value} 
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer has-[:checked]:bg-accent has-[:checked]:border-accent-foreground/50 has-[:checked]:[&_svg]:text-accent-foreground has-[:checked]:[&>label]:text-accent-foreground has-[:checked]:[&>label>p]:text-accent-foreground/80"
                            >
                              {option.icon && <option.icon className="h-5 w-5 text-primary has-[:checked]:text-accent-foreground" />}
                              <RadioGroupItem value={option.value} id={`${currentQuestion.name}-${option.value}`} className="text-primary focus:ring-primary"/>
                              <Label htmlFor={`${currentQuestion.name}-${option.value}`} className="font-normal flex-1 cursor-pointer">
                                {option.label}
                                {option.explanation && <p className="text-xs text-muted-foreground mt-1">{option.explanation}</p>}
                              </Label>
                            </div>
                          ))}
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
                                      <Image src={option.imageUrl} alt={option.label} data-ai-hint={option.dataAiHint} layout="fill" objectFit="cover" className="transition-transform group-hover:scale-105" />
                                    </div>
                                  )}
                                  <div className="text-center">
                                    <p className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>Depilação a laser</p>
                                    <Label htmlFor={`${currentQuestion.name}-${option.value}`} className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                      {option.label}
                                    </Label>
                                  </div>
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                      <CheckCircle className="h-4 w-4" />
                                    </div>
                                  )}
                                  {option.icon && !option.imageUrl && <option.icon className={`h-5 w-5 mx-auto mt-1 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      />
                  )}


                  {currentQuestion.type === 'textFields' && currentQuestion.fields && (
                    <div className="space-y-4">
                      {currentQuestion.fields.map(f => (
                        <div key={f.name} className="space-y-1">
                           <Label htmlFor={f.name} className="font-medium flex items-center">
                             {f.icon && <f.icon className="h-4 w-4 mr-2 text-primary" />} 
                             {f.label}
                          </Label>
                          <Controller
                            name={f.name}
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                              <Input 
                                {...field} 
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
                      ))}
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
                    <ChevronLeft className="mr-2 h-5 w-5" /> Voltar
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : null}
                    {submissionStatus === 'pending' ? 'Enviando...' : (currentStep === activeQuestions.length - 1 ? 'Finalizar e Contato' : 'Próximo')}
                    {submissionStatus !== 'pending' && (currentStep === activeQuestions.length - 1 ? <Send className="ml-2 h-5 w-5" /> : <ChevronRight className="ml-2 h-5 w-5" />)}
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
