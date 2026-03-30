import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { user_id, new_email } = await req.json();

  console.log("Updating user", user_id, "to email", new_email);

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    email: new_email,
    email_confirm: true,
  });

  console.log("Result:", JSON.stringify({ data, error }));

  if (error) {
    return new Response(JSON.stringify({ error: error.message, details: JSON.stringify(error) }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }

  return new Response(JSON.stringify({ success: true, email: data?.user?.email }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
});
