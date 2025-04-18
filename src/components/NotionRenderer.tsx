
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
  const { data: pageData, isLoading, error, isError } = useQuery({
    queryKey: ['notion-page', userId],
    queryFn: async () => {
      console.log("Fetching Notion page for user:", userId);
      
      // First check if a page exists for this user - now using case-insensitive matching
      const { data: notionPages, error: fetchError } = await supabase
        .from('user_notion_pages')
        .select('*')
        .ilike('email', userId);

      console.log("Supabase query result:", notionPages, fetchError);

      if (fetchError) {
        console.error("Error fetching from Supabase:", fetchError);
        throw fetchError;
      }

      if (!notionPages || notionPages.length === 0) {
        console.log(`No Notion page found for user: ${userId}. Available data:`, notionPages);
        throw new Error(`No Notion page found for ${userId}`);
      }

      console.log("Found Notion page:", notionPages[0]);
      
      // Fetch the actual page content
      try {
        console.log("Fetching page content from edge function with pageId:", notionPages[0].pageID);
        const response = await fetch(`https://gjwuabvhfsqxodgwbjdp.supabase.co/functions/v1/get-notion-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ pageId: notionPages[0].pageID }),
        });

        const responseText = await response.text();
        console.log("Raw response from edge function:", responseText);
        
        if (!response.ok) {
          console.error("Error response from edge function:", response.status, response.statusText, responseText);
          throw new Error(`Failed to fetch Notion page: ${response.statusText}. ${responseText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Parsed data from edge function:", data);
        } catch (parseError) {
          console.error("Error parsing response as JSON:", parseError);
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
        if (!data || !data.html) {
          console.error("Invalid response format, missing html:", data);
          throw new Error("Invalid response format from edge function");
        }
        
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

  if (isError || error) {
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
          We couldn't find a Notion page linked to your account or the page returned invalid data.
          Please check your Notion integration permissions and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div 
      className="notion-content prose max-w-none" 
      dangerouslySetInnerHTML={{ __html: pageData.html }} 
    />
  );
};

export default NotionRenderer;
