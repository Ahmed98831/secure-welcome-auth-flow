
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface NotionRendererProps {
  userId: string;
}

const NotionRenderer: React.FC<NotionRendererProps> = ({ userId }) => {
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['notion-page', userId],
    queryFn: async () => {
      console.log("Fetching Notion page for user:", userId);
      
      // First check if a page exists for this user
      const { data: notionPages, error: fetchError } = await supabase
        .from('user_notion_pages')
        .select('pageID')
        .eq('email', userId);

      if (fetchError) {
        console.error("Error fetching from Supabase:", fetchError);
        throw fetchError;
      }

      if (!notionPages || notionPages.length === 0) {
        console.log("No Notion page found for user:", userId);
        throw new Error(`No Notion page found for ${userId}`);
      }

      console.log("Found Notion page:", notionPages[0]);
      
      // Fetch the actual page content
      try {
        console.log("Fetching page content from edge function");
        const response = await fetch(`https://gjwuabvhfsqxodgwbjdp.supabase.co/functions/v1/get-notion-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ pageId: notionPages[0].pageID }),
        });

        if (!response.ok) {
          console.error("Error response from edge function:", response.status, response.statusText);
          throw new Error('Failed to fetch Notion page');
        }

        const data = await response.json();
        console.log("Received data from edge function:", data);
        return data;
      } catch (err) {
        console.error("Error in fetch operation:", err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : "An error occurred while loading your Notion page. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!pageData || !pageData.html) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No content available</AlertTitle>
        <AlertDescription>
          We couldn't find a Notion page linked to your account. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="notion-content prose max-w-none" 
         dangerouslySetInnerHTML={{ __html: pageData.html }} 
    />
  );
};

export default NotionRenderer;
