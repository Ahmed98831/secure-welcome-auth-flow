
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
      throw new Error('Unauthorized')
    }

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

    // Initialize Notion client
    const notion = new Client({
      auth: Deno.env.get('NOTION_API_KEY'),
    });

    console.log("Fetching page from Notion API:", pageId);

    // Fetch the page content
    const page = await notion.pages.retrieve({
      page_id: pageId,
    });
    
    console.log("Page retrieved successfully");

    // Fetch page blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    console.log("Retrieved", blocks.results.length, "blocks from the page");

    // Convert Notion content to HTML (simplified version)
    const html = `
      <div class="notion-page">
        <h1>${page.properties.title?.title?.[0]?.plain_text || 'Untitled'}</h1>
        ${blocks.results.map(block => {
          if ('paragraph' in block) {
            return `<p>${block.paragraph.rich_text?.[0]?.plain_text || ''}</p>`
          }
          if ('heading_1' in block) {
            return `<h1>${block.heading_1.rich_text?.[0]?.plain_text || ''}</h1>`
          }
          if ('heading_2' in block) {
            return `<h2>${block.heading_2.rich_text?.[0]?.plain_text || ''}</h2>`
          }
          if ('heading_3' in block) {
            return `<h3>${block.heading_3.rich_text?.[0]?.plain_text || ''}</h3>`
          }
          if ('bulleted_list_item' in block) {
            return `<li>${block.bulleted_list_item.rich_text?.[0]?.plain_text || ''}</li>`
          }
          return ''
        }).join('')}
      </div>
    `

    return new Response(
      JSON.stringify({ html }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
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
