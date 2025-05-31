// src/components/QueryMinimalTest.tsx
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const QueryMinimalTest = () => {
  console.log("QueryMinimalTest: Component rendering...");

  const queryClient = useQueryClient();
  console.log("QueryMinimalTest: queryClient from useQueryClient():", queryClient);

  const testMutation = useMutation<string, Error, string>({
    mutationFn: async (variable: string) => {
      console.log("QueryMinimalTest: testMutation mutationFn CALLED with:", variable);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async work
      return `Success with ${variable}`;
    },
    onSuccess: (data) => {
      console.log("QueryMinimalTest: testMutation onSuccess:", data);
      alert(`Minimal Test Success: ${data}`);
    },
    onError: (error) => {
      console.error("QueryMinimalTest: testMutation onError:", error);
      alert(`Minimal Test Error: ${error.message}`);
    }
  });

  console.log("QueryMinimalTest: testMutation object:", testMutation);
  console.log("QueryMinimalTest: typeof testMutation.mutateAsync:", typeof testMutation?.mutateAsync);

  const handleClick = () => {
    console.log("QueryMinimalTest: Button clicked, typeof testMutation.mutateAsync:", typeof testMutation?.mutateAsync);
    if (testMutation && typeof testMutation.mutateAsync === 'function') {
      testMutation.mutateAsync("MinimalTestData")
        .then(res => console.log("QueryMinimalTest: mutateAsync resolved:", res))
        .catch(err => console.error("QueryMinimalTest: mutateAsync rejected:", err));
    } else {
      console.error("QueryMinimalTest: testMutation.mutateAsync is not a function or testMutation is undefined.");
      alert("Error: mutateAsync is not available.");
    }
  };

  return (
    <div>
      <h1>React Query Minimal Test Page</h1>
      <p>Check the console when this page loads and when you click the button.</p>
      <button 
        onClick={handleClick} 
        disabled={testMutation.isPending}
        style={{ padding: '10px', fontSize: '16px', margin: '10px' }}
      >
        {testMutation.isPending ? 'Mutating...' : 'Run Minimal Test Mutation'}
      </button>
      {testMutation.isError && (
        <p style={{ color: 'red' }}>Error: {testMutation.error.message}</p>
      )}
      {testMutation.isSuccess && (
        <p style={{ color: 'green' }}>Success: {JSON.stringify(testMutation.data)}</p>
      )}
    </div>
  );
};

export default QueryMinimalTest;