import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Login } from './components/Login'
import { QuoteForm } from './components/QuoteForm'
import { QuoteList, type Quote } from './components/QuoteList'
import { supabase, supabaseIsConfigured } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [feedError, setFeedError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      setQuotesLoading(false)
      return
    }

    const client = supabase
    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        setFeedError(error.message)
      }
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase) {
      return
    }

    const client = supabase
    async function loadQuotes() {
      setQuotesLoading(true)
      setFeedError('')
      const { data, error } = await client
        .from('quotes')
        .select('id, content, author_name, created_at')
        .order('created_at', { ascending: true })

      if (error) {
        setFeedError(error.message)
      } else {
        setQuotes(data ?? [])
      }
      setQuotesLoading(false)
    }

    void loadQuotes()
  }, [])

  async function handleLogin(email: string, password: string) {
    if (!supabase) {
      throw new Error('Add your Supabase settings to the .env file first.')
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
  }

  async function handleRegister(
    email: string,
    password: string,
    displayName: string,
  ) {
    if (!supabase) {
      throw new Error('Add your Supabase settings to the .env file first.')
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) {
      throw error
    }
    return !data.session
  }

  async function handleLogout() {
    if (!supabase) {
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) {
      setFeedError(error.message)
    }
  }

  async function handlePost(content: string) {
    if (!supabase || !user) {
      throw new Error('Log in before posting a quote.')
    }

    const authorName =
      user.user_metadata.display_name?.trim() ||
      user.email?.split('@')[0] ||
      'QuoteWall member'
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        content,
        user_id: user.id,
        author_name: authorName,
      })
      .select('id, content, author_name, created_at')
      .single()

    if (error) {
      throw error
    }
    setQuotes((currentQuotes) => [data, ...currentQuotes])
  }

  if (!supabaseIsConfigured) {
    return (
      <main className="page">
        <header className="site-header">
          <p className="site-name">QuoteWall</p>
        </header>
        <section className="intro">
          <p className="eyebrow">A COMMONPLACE FOR GOOD WORDS</p>
          <h1>Words worth keeping.</h1>
          <p className="intro-copy">
            A quiet place to collect the lines that stay with you.
          </p>
        </section>
        <p className="notice error" role="alert">
          Supabase is not configured. Copy <code>.env.example</code> to{' '}
          <code>.env</code>, add your project URL and anon key, and restart Vite.
        </p>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="site-header">
        <p className="site-name">QuoteWall</p>
        {!authLoading && user && (
          <div className="user-actions">
            <span className="user-name">
              {user.user_metadata.display_name || user.email}
            </span>
            <Button
              className="logout-button"
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              type="button"
            >
              Log out
            </Button>
          </div>
        )}
      </header>

      <section className="intro">
        <p className="eyebrow">A COMMONPLACE FOR GOOD WORDS</p>
        <h1>Words worth keeping.</h1>
        <p className="intro-copy">
          A quiet place to collect the lines that stay with you.
        </p>
      </section>

      {authLoading ? (
        <p className="muted">Checking your account...</p>
      ) : user ? (
        <QuoteForm onPost={handlePost} />
      ) : (
        <Login onLogin={handleLogin} onRegister={handleRegister} />
      )}

      <section className="feed" aria-labelledby="feed-title">
        <h2 id="feed-title">Latest quotes</h2>
        {feedError && (
          <p className="notice error" role="alert">
            {feedError}
          </p>
        )}
        {quotesLoading ? (
          <p className="muted">Loading quotes...</p>
        ) : (
          <QuoteList quotes={quotes} />
        )}
      </section>
      <footer className="page-footer">A wall for words worth keeping.</footer>
    </main>
  )
}
