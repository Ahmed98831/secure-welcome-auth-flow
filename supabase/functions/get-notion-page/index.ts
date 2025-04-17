
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Client } from "https://deno.land/x/notion_sdk/src/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Get the user's Notion page ID
    const { data: notionPage, error: pageError } = await supabaseClient
      .from('user_notion_pages')
      .select('notion_page_id')
      .eq('user_id', user.id)
      .single()

    if (pageError || !notionPage) {
      throw new Error('No Notion page found for user')
    }

    // Initialize Notion client
    const notion = new Client({
      auth: Deno.env.get('NOTION_API_KEY'),
    })

    // Fetch the page content
    const page = await notion.pages.retrieve({
      page_id: notionPage.notion_page_id,
    })

    // Fetch page blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: notionPage.notion_page_id,
    })

    // Convert Notion content to HTML (simplified version)
    const html = `
      <div class="notion-page">
        <h1>${page.properties.title?.title?.[0]?.plain_text || 'Untitled'}</h1>
        ${blocks.results.map(block => {
          if ('paragraph' in block) {
            return `<p>${block.paragraph.rich_text?.[0]?.plain_text || ''}</p>`
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
