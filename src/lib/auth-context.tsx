"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from './supabase'

export type Role = "Admin" | "Agent";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: AuthUser | null; error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      setUser({
        id: authUser.id,
        name: profile.name,
        email: authUser.email!,
        role: profile.role as Role,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUser()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { user: null, error: error.message }

    const { data: profile } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', data.user.id)
      .single()

    if (!profile) {
      await supabase.auth.signOut()
      return { user: null, error: 'User profile not found. Contact your administrator.' }
    }

    const authUser: AuthUser = {
      id: data.user.id,
      name: profile.name,
      email: data.user.email!,
      role: profile.role as Role,
    }
    setUser(authUser)
    return { user: authUser, error: null }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
