import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { memberId } = body
    console.log('remove-member called, memberId:', memberId)

    if (!memberId) return new Response(JSON.stringify({ error: 'memberId requis' }), { status: 400, headers: corsHeaders })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Authorization header manquant' }), { status: 401, headers: corsHeaders })

    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    console.log('caller user.id:', user?.id, 'authErr:', authErr?.message)

    if (authErr || !user) return new Response(JSON.stringify({ error: 'Non autorise - token invalide' }), { status: 401, headers: corsHeaders })
    if (user.user_metadata?.org_id) {
      return new Response(JSON.stringify({ error: 'Seul le proprietaire peut retirer des membres.' }), { status: 403, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Fetch member by id only first, then verify ownership
    const { data: member, error: fetchErr } = await supabaseAdmin
      .from('org_members')
      .select('id, user_id, org_id, email')
      .eq('id', memberId)
      .maybeSingle()

    console.log('member found:', JSON.stringify(member), 'fetchErr:', fetchErr?.message)

    if (fetchErr) throw fetchErr
    if (!member) return new Response(JSON.stringify({ error: `Membre introuvable (id: ${memberId})` }), { status: 404, headers: corsHeaders })
    if (member.org_id !== user.id) return new Response(JSON.stringify({ error: `Acces refuse - org_id ne correspond pas` }), { status: 403, headers: corsHeaders })

    const { error: deleteErr } = await supabaseAdmin
      .from('org_members')
      .delete()
      .eq('id', memberId)
    if (deleteErr) throw deleteErr

    if (member.user_id) {
      try {
        const { data: memberData } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
        const memberUser = memberData?.user
        if (memberUser) {
          const cleaned = { ...memberUser.user_metadata }
          delete cleaned.org_id
          delete cleaned.role
          delete cleaned.org_owner_name
          delete cleaned.org_company
          delete cleaned.re_invited
          cleaned.onboarding_complete = false
          await supabaseAdmin.auth.admin.updateUserById(member.user_id, { user_metadata: cleaned })
        }
      } catch (metaErr: any) {
        console.error('metadata cleanup error (non-fatal):', metaErr.message)
      }
    }

    console.log('remove-member success for id:', memberId)
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('remove-member error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
