
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface NotionRendererProps {
  userId: string;
}

const NotionRenderer: React.FC<NotionRendererProps> = ({ userId }) => {
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['notion-page', userId],
    queryFn: async () => {
      const { data: notionPage, error } = await supabase
        .from('user_notion_pages')
        .select('pageID')
        .eq('email', userId)
        .single();

      if (error) throw error;
      if (!notionPage) throw new Error('No Notion page found for this user');

      const response = await fetch(`https://gjwuabvhfsqxodgwbjdp.supabase.co/functions/v1/get-notion-page`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Notion page');
      }

      return response.json();
    },
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
      <div className="p-4 text-red-500">
        Error loading Notion page. Please try again later.
      </div>
    );
  }

  return (
    <div className="notion-content prose max-w-none" 
         dangerouslySetInnerHTML={{ __html: pageData.html }} 
    />
  );
};

export default NotionRenderer;
