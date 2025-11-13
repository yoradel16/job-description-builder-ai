'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'
import { ChevronLeft } from "lucide-react"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [passwordStrength, setPasswordStrength] = useState<{
        valid: boolean
        message: string
    }>({ valid: false, message: '' })

    useEffect(() => {
        if (!token) {
            setErrorMessage('Invalid or missing reset token')
        }
    }, [token])

    function checkPasswordStrength(password: string) {
        const specialCharRegex = /[_!@#$%^&*(),.?":{}|<>]/
        const minLength = 8

        if (password.length === 0) {
            setPasswordStrength({ valid: false, message: '' })
        } else if (password.length < minLength) {
            setPasswordStrength({
                valid: false,
                message: 'Password must be at least 8 characters.',
            })
        } else if (!specialCharRegex.test(password)) {
            setPasswordStrength({
                valid: false,
                message: 'Password must contain at least one special character.',
            })
        } else {
            setPasswordStrength({ valid: true, message: 'Strong password!' })
        }
    }

    function handlePasswordChange(value: string) {
        setPassword(value)
        checkPasswordStrength(value)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match')
            return
        }

        if (!passwordStrength.valid) {
            setErrorMessage('Please choose a stronger password')
            return
        }

        setIsSubmitting(true)
        setErrorMessage('')

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password')
            }

            setIsSuccess(true)
            setTimeout(() => {
                router.push('/signin')
            }, 3000)
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
                        <h2 className="text-2xl font-semibold text-black mb-2">Password reset successful!</h2>
                        <p className="text-sm text-black/60 mb-6">
                            Your password has been reset. Redirecting to sign in...
                        </p>
                        <Link
                            href="/signin"
                            className="inline-block text-sm text-[var(--accent)] hover:brightness-110 transition font-medium"
                        >
                            Go to sign in →
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
                    <h2 className="text-2xl font-semibold text-black mb-2">Set new password</h2>
                    <p className="text-sm text-black/60">
                        Please enter your new password below.
                    </p>
                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                            <p className="text-sm text-red-600">{errorMessage}</p>
                        </div>
                    )}
                </div>

                <div className="mb-4 relative">
                    <label htmlFor="password" className="block text-sm font-medium text-black/70 mb-1">
                        New Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        autoComplete="new-password"
                        required
                        disabled={!token}
                        className="w-full px-3 py-2 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-[35px] text-black/50 hover:text-[var(--accent)] transition"
                        disabled={!token}
                    >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>

                    {password.length > 0 && (
                        <p
                            className={`mt-2 text-sm ${passwordStrength.valid ? 'text-green-600' : 'text-red-600'
                                }`}
                        >
                            {passwordStrength.message}
                        </p>
                    )}
                </div>

                <div className="mb-6 relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-black/70 mb-1">
                        Confirm New Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        disabled={!token}
                        className="w-full px-3 py-2 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-[35px] text-black/50 hover:text-[var(--accent)] transition"
                        disabled={!token}
                    >
                        {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                </div>

                <div className="mb-6">
                    <button
                        type="submit"
                        disabled={isSubmitting || !passwordStrength.valid || !token}
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
                                <span>Resetting...</span>
                            </div>
                        ) : (
                            'Reset password'
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