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
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, plan } = session.metadata ?? {}

    if (user_id && plan) {
      const { error } = await supabase.auth.admin.updateUserById(user_id, {
        user_metadata: { plan, onboarding_complete: true },
      })
      if (error) console.error('Failed to update user:', error.message)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    // Downgrade to starter when subscription is cancelled
    const sub = event.data.object as Stripe.Subscription
    // We need to look up the user by stripe customer id
    // Store customer_id in a subscriptions table for production use
    console.log('Subscription cancelled:', sub.id)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
