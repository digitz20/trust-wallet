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
  // The flow is now simple enough that we can directly call its logic.
  // For more complex scenarios, or if this flow involved other Genkit features (like tools, other prompts),
  // you would still call validatePhraseWordFlow(input).
  const { word } = input;
  const wordlist = bip39.wordlists.english;
  const trimmedWord = word.toLowerCase().trim();

  if (wordlist.includes(trimmedWord)) {
    return { isValid: true };
  } else {
    return { isValid: false, reason: `"${word}" is not a valid recovery phrase word.` };
  }
}

// We are keeping the flow definition in case it's used by other Genkit tools or for monitoring,
// but the core logic is now performed locally.
const validatePhraseWordFlow = ai.defineFlow(
  {
    name: 'validatePhraseWordFlow',
    inputSchema: ValidatePhraseWordInputSchema,
    outputSchema: ValidatePhraseWordOutputSchema,
  },
  async (input: ValidatePhraseWordInput): Promise<ValidatePhraseWordOutput> => {
    const { word } = input;
    const wordlist = bip39.wordlists.english;
    const trimmedWord = word.toLowerCase().trim(); // Ensure consistent casing and no extra spaces

    if (trimmedWord === '') {
      // Explicitly handle empty string if needed, though the component might already do this.
      return { isValid: false, reason: 'Word cannot be empty.' };
    }

    if (wordlist.includes(trimmedWord)) {
      return { isValid: true };
    } else {
      return { isValid: false, reason: `"${word}" is not a valid recovery phrase word.` };
    }
  }
);
