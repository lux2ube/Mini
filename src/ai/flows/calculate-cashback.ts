'use server';

/**
 * @fileOverview This file defines a Genkit flow to calculate cashback for a transaction.
 *
 * - calculateCashback - A function that triggers the cashback calculation flow.
 * - CalculateCashbackInput - The input type for the calculateCashback function.
 * - CalculateCashbackOutput - The return type for the calculateCashback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateCashbackInputSchema = z.object({
  amount: z.number().describe('The transaction amount.'),
});
export type CalculateCashbackInput = z.infer<typeof CalculateCashbackInputSchema>;

const CalculateCashbackOutputSchema = z.object({
  cashbackAmount: z.number().describe('The calculated cashback amount.'),
  explanation: z.string().describe('An explanation of how the cashback was calculated.'),
});
export type CalculateCashbackOutput = z.infer<typeof CalculateCashbackOutputSchema>;

export async function calculateCashback(
  input: CalculateCashbackInput
): Promise<CalculateCashbackOutput> {
  return calculateCashbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateCashbackPrompt',
  input: {schema: CalculateCashbackInputSchema},
  output: {schema: CalculateCashbackOutputSchema},
  prompt: `You are a cashback calculation engine.
  
  The current rule is: "10% cashback on all transactions".

  Calculate the cashback for a transaction with the amount of \${{{amount}}}.
  
  Provide the final cashback amount and a brief explanation of the calculation.`,
});

const calculateCashbackFlow = ai.defineFlow(
  {
    name: 'calculateCashbackFlow',
    inputSchema: CalculateCashbackInputSchema,
    outputSchema: CalculateCashbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
