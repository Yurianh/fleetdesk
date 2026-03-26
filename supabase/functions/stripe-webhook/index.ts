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

  // ── checkout.session.completed ─────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, plan } = session.metadata ?? {}
    console.log('[webhook] checkout.session.completed — user_id:', user_id, 'plan:', plan)

    if (user_id && plan) {
      const { data: { user }, error: fetchErr } = await supabase.auth.admin.getUserById(user_id)
      if (fetchErr) {
        console.error('[webhook] failed to fetch user:', fetchErr.message)
      } else {
        const { error } = await supabase.auth.admin.updateUserById(user_id, {
          user_metadata: {
            ...user?.user_metadata,
            plan,
            onboarding_complete: true,
            stripe_customer_id: session.customer as string,
          },
        })
        if (error) console.error('[webhook] failed to update user:', error.message)
        else console.log('[webhook] user activated:', user_id, 'plan:', plan)
      }
    }
  }

  // ── customer.subscription.updated (plan change) ────────────────
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    const priceId = sub.items.data[0]?.price?.id

    const PLAN_BY_PRICE: Record<string, string> = {
      'price_1TEiw8B6Ej53MTDrp4sDJxQS': 'starter',
      'price_1TEiw7B6Ej53MTDrTW3RbjfW': 'pro',
      'price_1TEiw1B6Ej53MTDrzE2nmyDR': 'enterprise',
    }
    const newPlan = PLAN_BY_PRICE[priceId] ?? null
    if (!newPlan) return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })

    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const user = users.find((u: any) => u.user_metadata?.stripe_customer_id === customerId)
    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, plan: newPlan },
      })
      console.log('[webhook] plan updated:', user.id, '->', newPlan)
    }
  }

  // ── customer.subscription.deleted (cancellation) ───────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    console.log('[webhook] subscription cancelled, customer:', customerId)

    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const user = users.find((u: any) => u.user_metadata?.stripe_customer_id === customerId)
    if (user) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, plan: 'starter', stripe_customer_id: null },
      })
      console.log('[webhook] user downgraded to starter:', user.id)
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
