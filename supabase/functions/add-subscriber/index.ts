/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const body = await req.json();

    if (!body.email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Save to database
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        whatsapp: body.whatsapp,
        linkedin: body.linkedin,
      });

    if (dbError) {
      throw dbError;
    }

    // Send to MailerLite
    const mlResponse = await fetch(
      "https://connect.mailerlite.com/api/subscribers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("MAILERLITE_API_KEY")}`,
        },
        body: JSON.stringify({
          email: body.email,
          fields: {
            name: body.firstName,
            last_name: body.lastName,
            whatsapp: body.whatsapp,
            linkedin: body.linkedin,
          },
          groups: [Deno.env.get("MAILERLITE_GROUP_ID")],
          status: "active",
        }),
      }
    );

    const mlData = await mlResponse.json();

    if (!mlResponse.ok) {
      return new Response(
        JSON.stringify({ error: "MailerLite failed", details: mlData }),
        {
          status: mlResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true, data: mlData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});