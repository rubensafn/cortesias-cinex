import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const adminEmail = "admin@cinex.local";
    const adminPassword = "admin@123";
    const adminUsername = "admin";

    const { data: { user: existingUser } } = await supabase.auth.admin.getUserByEmail(adminEmail);

    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
    } else {
      const { data: { user: newUser }, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });

      if (authError || !newUser?.id) {
        return new Response(
          JSON.stringify({ error: "Failed to create auth user" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      authUserId = newUser.id;
    }

    const passwordHash = await hashPassword(adminPassword);

    const { data: accountData } = await supabase
      .from("user_accounts")
      .select("id")
      .eq("username", adminUsername)
      .maybeSingle();

    if (!accountData) {
      const { error: accountError } = await supabase
        .from("user_accounts")
        .insert({
          username: adminUsername,
          password_hash: passwordHash,
          auth_user_id: authUserId,
        });

      if (accountError) {
        console.error("Account creation error:", accountError);
      }
    } else {
      const { error: updateError } = await supabase
        .from("user_accounts")
        .update({
          password_hash: passwordHash,
          auth_user_id: authUserId,
        })
        .eq("username", adminUsername);

      if (updateError) {
        console.error("Account update error:", updateError);
      }
    }

    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", authUserId)
      .maybeSingle();

    if (!profileData) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: authUserId,
          role: "master",
          approved: true,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    } else {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          role: "master",
          approved: true,
        })
        .eq("user_id", authUserId);

      if (updateError) {
        console.error("Profile update error:", updateError);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Admin user initialized successfully",
        username: adminUsername,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
