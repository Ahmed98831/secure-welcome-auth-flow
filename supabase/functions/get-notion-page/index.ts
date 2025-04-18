import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Client } from "https://deno.land/x/notion_sdk/src/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the user from the JWT token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error("Authentication error:", userError?.message || "No user found");
      throw new Error('Unauthorized')
    }

    console.log("Authenticated user:", user.email);

    // Get the page ID from the request body
    let pageId;
    try {
      const body = await req.json();
      pageId = body.pageId;
      console.log("Received page ID:", pageId);
      
      if (!pageId) {
        throw new Error('No page ID provided');
      }
    } catch (error) {
      console.error("Error parsing request body:", error);
      throw new Error('Invalid request body');
    }

    // Check if Notion API key is set
    const notionApiKey = Deno.env.get('NOTION_API_KEY');
    if (!notionApiKey) {
      console.error("NOTION_API_KEY environment variable is not set");
      throw new Error('Notion API key is not configured');
    }

    // Initialize Notion client
    const notion = new Client({
      auth: notionApiKey,
    });

    console.log("Fetching page from Notion API:", pageId);

    try {
      // Fetch the page content
      const page = await notion.pages.retrieve({
        page_id: pageId,
      });
      
      console.log("Page retrieved successfully:", page.id);
      console.log("Page object:", JSON.stringify(page).substring(0, 500) + "...");

      // Fetch page blocks (content)
      const blocksResponse = await notion.blocks.children.list({
        block_id: pageId,
      });
      
      const blocks = blocksResponse.results;
      console.log("Retrieved", blocks.length, "blocks from the page");
      console.log("First few blocks:", JSON.stringify(blocks.slice(0, 2)).substring(0, 500) + "...");

      // Get page title
      let pageTitle = 'Untitled';
      if ('properties' in page && page.properties) {
        const titleProperty = Object.values(page.properties).find(
          (prop: any) => prop.type === 'title'
        ) as any;
        
        if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
          pageTitle = titleProperty.title[0].plain_text || 'Untitled';
        }
      }

      console.log("Page title:", pageTitle);

      // Convert Notion content to HTML (simplified version)
      const html = `
        <div class="notion-page">
          <h1>${pageTitle}</h1>
          ${blocks.map(block => {
            if ('paragraph' in block) {
              const text = block.paragraph.rich_text?.[0]?.plain_text || '';
              return `<p>${text}</p>`;
            }
            if ('heading_1' in block) {
              const text = block.heading_1.rich_text?.[0]?.plain_text || '';
              return `<h1>${text}</h1>`;
            }
            if ('heading_2' in block) {
              const text = block.heading_2.rich_text?.[0]?.plain_text || '';
              return `<h2>${text}</h2>`;
            }
            if ('heading_3' in block) {
              const text = block.heading_3.rich_text?.[0]?.plain_text || '';
              return `<h3>${text}</h3>`;
            }
            if ('bulleted_list_item' in block) {
              const text = block.bulleted_list_item.rich_text?.[0]?.plain_text || '';
              return `<li>${text}</li>`;
            }
            return '';
          }).join('')}
        </div>
      `;

      console.log("Generated HTML (excerpt):", html.substring(0, 500) + "...");
      
      return new Response(
        JSON.stringify({ html }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    } catch (notionError: any) {
      console.error("Notion API error:", notionError);
      console.error("Error details:", notionError.status, notionError.code, notionError.message);
      throw new Error(`Failed to fetch Notion page: ${notionError.message}`);
    }
  } catch (error: any) {
    console.error("Error in edge function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
