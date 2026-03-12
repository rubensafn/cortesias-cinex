import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface Cortesia {
  codigo: string;
  data_validade: string | null;
}

interface EmailPayload {
  to: string;
  solicitante: string;
  unidade: string;
  motivo: string;
  cortesias: Cortesia[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function generateTicketSVG(codigo: string, validade: string): string {
  return `
    <svg viewBox="0 0 414 784" xmlns="http://www.w3.org/2000/svg" style="max-width: 200px; height: auto;">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1040"/>
          <stop offset="50%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
        <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(139, 92, 246, 0.2)"/>
          <stop offset="100%" stop-color="rgba(88, 28, 135, 0.4)"/>
        </linearGradient>
      </defs>
      <rect width="414" height="784" fill="url(#bgGrad)" rx="12"/>
      <text x="207" y="70" text-anchor="middle" fill="white" font-size="48" font-weight="700" letter-spacing="6" font-family="Arial, sans-serif">CORTESIA</text>
      <text x="207" y="105" text-anchor="middle" fill="#d8b4fe" font-size="16" letter-spacing="14" font-family="Arial, sans-serif">I N D I V I D U A L</text>
      <text x="155" y="220" text-anchor="middle" fill="#d946ef" font-size="64" font-weight="900" font-style="italic" font-family="Arial Black, sans-serif">CINE</text>
      <text x="290" y="220" text-anchor="middle" fill="#a855f7" font-size="64" font-weight="900" font-style="italic" font-family="Arial Black, sans-serif">X</text>
      <ellipse cx="305" cy="195" rx="55" ry="50" fill="none" stroke="#c026d3" stroke-width="2.5" opacity="0.8"/>
      <ellipse cx="305" cy="195" rx="40" ry="36" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.6" transform="rotate(25 305 195)"/>
      <text x="207" y="300" text-anchor="middle" fill="white" font-size="18" font-weight="700" letter-spacing="3" font-family="Arial, sans-serif">CODIGO CORTESIA</text>
      <rect x="30" y="330" width="354" height="75" rx="38" fill="url(#boxGrad)" stroke="#c026d3" stroke-width="2"/>
      <text x="207" y="378" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="Arial, sans-serif" letter-spacing="1">${codigo}</text>
      <text x="207" y="475" text-anchor="middle" fill="#d8b4fe" font-size="16" letter-spacing="3" font-family="Arial, sans-serif">VALIDO ATE</text>
      <rect x="30" y="500" width="354" height="70" rx="35" fill="url(#boxGrad)" stroke="#c026d3" stroke-width="2"/>
      <text x="207" y="545" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="Arial, sans-serif">${validade}</text>
      <text x="160" y="710" text-anchor="middle" fill="#6b21a8" font-size="44" font-weight="900" font-style="italic" font-family="Arial Black, sans-serif">CINE</text>
      <text x="275" y="710" text-anchor="middle" fill="#581c87" font-size="44" font-weight="900" font-style="italic" font-family="Arial Black, sans-serif">X</text>
      <ellipse cx="288" cy="695" rx="32" ry="28" fill="none" stroke="#581c87" stroke-width="1.5" opacity="0.7"/>
    </svg>
  `;
}

function generateEmailHTML(payload: EmailPayload): string {
  const ticketsHTML = payload.cortesias
    .map((c) => {
      const validade = formatDate(c.data_validade);
      return `
        <div style="display: inline-block; margin: 10px; vertical-align: top;">
          ${generateTicketSVG(c.codigo, validade)}
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6b21a8 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px;">CINEX</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Suas cortesias chegaram!</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Ola! Seguem suas <strong>${payload.cortesias.length} cortesia${payload.cortesias.length > 1 ? "s" : ""}</strong> do <strong>${payload.unidade}</strong>.
          </p>

          <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              <strong>Solicitante:</strong> ${payload.solicitante}
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Motivo:</strong> ${payload.motivo}
            </p>
          </div>

          <div style="text-align: center; padding: 20px 0;">
            ${ticketsHTML}
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              Apresente o codigo na bilheteria para retirar seu ingresso.<br>
              Cada codigo e valido para 1 (um) ingresso.
            </p>
          </div>
        </div>

        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 20px;">
          Este e um email automatico. Por favor, nao responda.
        </p>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("RESEND_API_KEY not configured. Please add it to your Supabase Edge Function secrets.");
    }

    const payload: EmailPayload = await req.json();
    console.log("Received payload:", JSON.stringify({ to: payload.to, cortesiasCount: payload.cortesias?.length }));

    if (!payload.to || !payload.cortesias || payload.cortesias.length === 0) {
      throw new Error("Missing required fields: to, cortesias");
    }

    const htmlContent = generateEmailHTML(payload);

    console.log("Sending email to:", payload.to);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Cinex Cortesias <onboarding@resend.dev>",
        to: [payload.to],
        subject: `Suas ${payload.cortesias.length} cortesia${payload.cortesias.length > 1 ? "s" : ""} Cinex - ${payload.unidade}`,
        html: htmlContent,
      }),
    });

    const resData = await res.json();
    console.log("Resend response:", JSON.stringify(resData));

    if (!res.ok) {
      console.error("Resend error:", resData);
      const errorMsg = resData.message || resData.error?.message || "Failed to send email";
      throw new Error(errorMsg);
    }

    return new Response(
      JSON.stringify({ success: true, id: resData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
