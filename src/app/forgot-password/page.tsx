'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email')
            }

            setIsSuccess(true)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-white text-black">
                <div className="w-full max-w-md rounded-2xl px-8 pt-8 pb-10 border border-black/10 bg-white/90 shadow-lg">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                            <svg
                                className="h-6 w-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-black mb-2">Check your email</h2>
                        <p className="text-sm text-black/60 mb-6">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="text-xs text-black/50 mb-6">
                            Didn't receive the email? Check your spam folder or{' '}
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="text-[var(--accent)] hover:brightness-110 transition"
                            >
                                try again
                            </button>
                        </p>
                        <Link
                            href="/signin"
                            className="inline-block text-sm text-[var(--accent)] hover:brightness-110 transition font-medium"
                        >
                            ← Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-white text-black">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl px-8 pt-8 pb-10 border border-black/10 bg-white/90 shadow-lg"
            >
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-black mb-2">Forgot password?</h2>
                    <p className="text-sm text-black/60">
                        No worries, we'll send you reset instructions.
                    </p>
                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                            <p className="text-sm text-red-600">{errorMessage}</p>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-black/70 mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className="w-full px-3 py-2 border text-black border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition"
                    />
                </div>

                <div className="mb-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[var(--accent)] hover:brightness-110 text-white font-semibold py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <span>Sending...</span>
                            </div>
                        ) : (
                            'Send reset link'
                        )}
                    </button>
                </div>

                <div className="flex justify-center">
                    <Link
                        href="/signin"
                        className=" w-full flex items-center justify-center gap-1 text-sm font-medium text-[var(--accent)] border border-[var(--accent)] rounded-xl py-2.5 px-4 "
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to sign in
                    </Link>
                </div>
            </form>
        </div>
    )
}