// src/hooks/useSimpleMutationTest.ts
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast'; // Assuming useToast is stable

// Define types for this simple mutation for clarity
type SimpleMutationResult = { success: boolean; data: { input: string } };
type SimpleMutationError = Error;
type SimpleMutationVariables = { testInput: string };

export const useSimpleMutationTest = () => {
  const { toast } = useToast();

  console.log("useSimpleMutationTest: Hook called, initializing useMutation...");

  const testMutation = useMutation<SimpleMutationResult, SimpleMutationError, SimpleMutationVariables>({
    mutationFn: async (variables: SimpleMutationVariables) => {
      console.log("useSimpleMutationTest: mutationFn CALLED with:", variables);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async work
      if (variables.testInput === "force-error") {
        throw new Error("Forced error in simple test mutation");
      }
      return { success: true, data: { input: variables.testInput } };
    },
    onSuccess: (data, variables) => {
      console.log("useSimpleMutationTest: onSuccess. Data:", data, "Variables:", variables);
      toast({ title: 'Simple Test Success', description: `Received: ${data.data.input}` });
    },
    onError: (error, variables) => {
      console.error("useSimpleMutationTest: onError. Error:", error, "Variables:", variables);
      toast({ title: 'Simple Test Error', description: error.message, variant: 'destructive' });
    }
    // mutationKey: ['simpleTest'], // Optional
  });

  console.log("useSimpleMutationTest: useMutation initialized. Mutation object:", testMutation);

  return {
    simpleTestMutation: testMutation,
  };
};