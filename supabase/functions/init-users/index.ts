import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

    const users = [
      {
        email: "rubens@conexstudio.com.br",
        password: "Cinex@2026",
        role: "master",
      },
      {
        email: "admin",
        password: "admin@123",
        role: "admin",
      },
    ];

    const results = [];

    for (const userData of users) {
      try {
        const signUpResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
          }),
        });

        const signUpData = await signUpResponse.json();

        if (!signUpResponse.ok) {
          if (signUpData.message?.includes("already registered")) {
            const listResponse = await fetch(
              `${supabaseUrl}/auth/v1/admin/users`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                },
              }
            );

            const listData = await listResponse.json();
            const existingUser = listData.users?.find(
              (u: { email: string }) => u.email === userData.email
            );

            if (existingUser) {
              const profileCheckResponse = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${existingUser.id}`,
                {
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                }
              );

              const profileData = await profileCheckResponse.json();

              if (profileData.length === 0) {
                await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({
                    user_id: existingUser.id,
                    role: userData.role,
                    approved: true,
                  }),
                });
              }

              results.push({
                email: userData.email,
                status: "existing",
                message: "User already exists with profile",
              });
            } else {
              results.push({
                email: userData.email,
                status: "error",
                message: signUpData.message,
              });
            }
          } else {
            results.push({
              email: userData.email,
              status: "error",
              message: signUpData.message,
            });
          }
        } else {
          const userId = signUpData.user?.id;

          await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              user_id: userId,
              role: userData.role,
              approved: true,
            }),
          });

          results.push({
            email: userData.email,
            status: "created",
            message: "User created successfully",
          });
        }
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
        results.push({
          email: userData.email,
          status: "error",
          message: String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "User initialization completed",
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Initialization error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
