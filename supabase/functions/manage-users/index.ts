import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      throw new Error('User is not an admin')
    }

    const { action, ...body } = await req.json()

    switch (action) {
      case 'list': {
        // Get all users from auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (authError) throw authError

        // Get profiles
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, created_at')

        if (profilesError) throw profilesError

        // Get roles
        const { data: roles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role')

        if (rolesError) throw rolesError

        // Combine data
        const users = (profiles || []).map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.id)
          const authUser = authData.users.find(u => u.id === profile.id)
          
          return {
            id: profile.id,
            email: authUser?.email || 'Email não disponível',
            full_name: profile.full_name,
            role: userRole?.role === 'admin' ? 'admin' : 'user',
            created_at: profile.created_at,
          }
        })

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'create': {
        const { email, password, fullName, role } = body

        // Create user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
          },
        })

        if (authError) throw authError

        // Update role if admin
        if (role === 'admin' && authData.user) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .update({ role: 'admin' })
            .eq('user_id', authData.user.id)

          if (roleError) throw roleError
        }

        return new Response(JSON.stringify({ success: true, user: authData.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'delete': {
        const { userId } = body

        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'update-role': {
        const { userId, role } = body

        const { error } = await supabaseAdmin
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId)

        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
