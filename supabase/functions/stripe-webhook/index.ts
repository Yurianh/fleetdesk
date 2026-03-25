import Stripe from 'https://esm.sh/stripe@14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

Deno.serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return new Response('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    console.error('[webhook] signature error:', err.message)
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, plan } = session.metadata ?? {}

    console.log('[webhook] checkout.session.completed — user_id:', user_id, 'plan:', plan)

    if (user_id && plan) {
      // Fetch existing metadata so we don't overwrite full_name, company, etc.
      const { data: { user }, error: fetchErr } = await supabase.auth.admin.getUserById(user_id)
      if (fetchErr) {
        console.error('[webhook] failed to fetch user:', fetchErr.message)
      } else {
        const { error } = await supabase.auth.admin.updateUserById(user_id, {
          user_metadata: { ...user?.user_metadata, plan, onboarding_complete: true },
        })
        if (error) console.error('[webhook] failed to update user:', error.message)
        else console.log('[webhook] user updated successfully')
      }
    } else {
      console.error('[webhook] missing user_id or plan in metadata:', session.metadata)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    console.log('[webhook] subscription cancelled:', sub.id)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
