import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  try {
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
            source: "signup",
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
