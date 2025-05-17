//validate-phrase-word.ts
'use server';

/**
 * @fileOverview This file contains the Genkit flow for validating a single word in a secret phrase against a dictionary of valid words.
 *
 * - validatePhraseWord -  A function that validates if a given word is valid.
 * - ValidatePhraseWordInput - The input type for the validatePhraseWord function.
 * - ValidatePhraseWordOutput - The return type for the validatePhraseWord function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as bip39 from 'bip39';

const ValidatePhraseWordInputSchema = z.object({
  word: z.string().describe('The word to validate.'),
});
export type ValidatePhraseWordInput = z.infer<typeof ValidatePhraseWordInputSchema>;

const ValidatePhraseWordOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the word is valid or not.'),
  reason: z.string().optional().describe('The reason why the word is invalid, if applicable.'),
});
export type ValidatePhraseWordOutput = z.infer<typeof ValidatePhraseWordOutputSchema>;

export async function validatePhraseWord(input: ValidatePhraseWordInput): Promise<ValidatePhraseWordOutput> {
  return validatePhraseWordFlow(input);
}

const validatePhraseWordPrompt = ai.definePrompt({
  name: 'validatePhraseWordPrompt',
  input: {schema: ValidatePhraseWordInputSchema},
  output: {schema: ValidatePhraseWordOutputSchema},
  prompt: `You are a validator of secret phrase words for a crypto wallet.

  A valid word must exist in the following dictionary of words:
  {{{validWords}}}

  Determine if the word '{{word}}' is a valid word in the above dictionary.

  Respond in JSON format, setting isValid to true if it is, and false otherwise. If isValid is false, provide a reason.`, // Ensure the prompt is a single string.
  config: {
    temperature: 0, // Keep responses consistent
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const validatePhraseWordFlow = ai.defineFlow(
  {
    name: 'validatePhraseWordFlow',
    inputSchema: ValidatePhraseWordInputSchema,
    outputSchema: ValidatePhraseWordOutputSchema,
  },
  async input => {
    const validWords = JSON.stringify(bip39.wordlists.english);
    const {
      word,
    } = input;
    const {output} = await validatePhraseWordPrompt({
      ...input,
      validWords
    });
    return output!;
  }
);

