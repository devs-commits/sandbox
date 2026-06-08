import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SignupData {
  email: string;
  fullName: string;
  role: "student" | "recruiter";
  country?: string;
  track?: string;
  experienceLevel?: string;
  subscriptionPlan?: string;
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const data = (await req.json()) as SignupData;

    if (!data.email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mlApiKey = Deno.env.get("MAILERLITE_API_KEY");
    const mlGroupId = Deno.env.get("MAILERLITE_SIGNUP_GROUP_ID");

    if (!mlApiKey || !mlGroupId) {
      console.error(
        "Missing MailerLite config:",
        !mlApiKey ? "API_KEY" : "GROUP_ID"
      );
      return new Response(
        JSON.stringify({ error: "MailerLite configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add to MailerLite
    const mlResponse = await fetch(
      "https://connect.mailerlite.com/api/subscribers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mlApiKey}`,
        },
        body: JSON.stringify({
          email: data.email,
          fields: {
            name: data.fullName,
            role: data.role,
            country: data.country || "",
            track: data.track || "",
            experience_level: data.experienceLevel || "",
            subscription_plan: data.subscriptionPlan || "monthly",
          },
          groups: [mlGroupId],
          status: "active",
        }),
      }
    );

    const mlResponseData = await mlResponse.json();

    if (!mlResponse.ok) {
      console.error("MailerLite error:", mlResponseData);
      // Don't fail signup if MailerLite fails - log and continue
      return new Response(
        JSON.stringify({
          success: false,
          warning: "Failed to add to MailerLite",
          details: mlResponseData,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: mlResponseData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
