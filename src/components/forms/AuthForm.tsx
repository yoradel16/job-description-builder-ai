'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid'

type AuthMode = 'signin' | 'signup'

export interface AuthFormValues {
    firstname?: string
    lastname?: string
    email: string
    password: string
    confirmPassword?: string
}

export interface AuthFormProps {
    mode: AuthMode
    onSubmit: (values: AuthFormValues) => void | Promise<void>
    isSubmitting?: boolean
    errorMessage?: string
    submitLabel?: string
}

export default function AuthForm({
    mode,
    onSubmit,
    isSubmitting = false,
    errorMessage,
    submitLabel,
}: AuthFormProps) {
    const [values, setValues] = useState<AuthFormValues>({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
    })

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState<{
        valid: boolean
        message: string
    }>({ valid: false, message: '' })

    const isSignup = mode === 'signup'

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        setValues((prev) => ({ ...prev, [name]: value }))

        if (name === 'password' && isSignup) {
            checkPasswordStrength(value)
        }
    }

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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (isSignup && values.password !== values.confirmPassword) return
        if (isSignup && !passwordStrength.valid) return

        await onSubmit({
            firstname: values.firstname?.trim() || undefined,
            lastname: values.lastname?.trim() || undefined,
            email: values.email.trim(),
            password: values.password,
            confirmPassword: isSignup ? values.confirmPassword : undefined,
        })
    }

    const heading = isSignup ? 'Create your account' : 'Welcome back'
    const buttonLabel = submitLabel || (isSignup ? 'Sign up' : 'Sign in')

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-white text-black">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl px-8 pt-8 pb-10 border border-black/10 bg-white/90 shadow-lg"
            >
                <div className="mb-8">
                    <p className="text-sm text-black/50 mb-1">Please enter details</p>
                    <h2 className="text-2xl font-semibold text-black mb-2">{heading}</h2>
                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                            <p className="text-sm text-red-600">{errorMessage}</p>
                        </div>
                    )}
                </div>

                {isSignup && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label
                                htmlFor="firstname"
                                className="block text-sm font-medium text-black/70 mb-1"
                            >
                                First name
                            </label>
                            <input
                                id="firstname"
                                name="firstname"
                                type="text"
                                placeholder="John"
                                value={values.firstname || ''}
                                onChange={handleChange}
                                autoComplete="firstname"
                                className="w-full px-3 py-2 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="lastname"
                                className="block text-sm font-medium text-black/70 mb-1"
                            >
                                Last name
                            </label>
                            <input
                                id="lastname"
                                name="lastname"
                                type="text"
                                placeholder="Doe"
                                value={values.lastname || ''}
                                onChange={handleChange}
                                autoComplete="lastname"
                                className="w-full px-3 py-2 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition"
                            />
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-black/70 mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={values.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                        className="w-full px-3 py-2 border text-black border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition"
                    />
                </div>

                {/* Password Field with Strength Checker */}
                <div className="mb-4 relative">
                    <label htmlFor="password" className="block text-sm font-medium text-black/70 mb-1">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={values.password}
                        onChange={handleChange}
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        required
                        className="w-full px-3 py-2 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-[35px] text-black/50 hover:text-[var(--accent)] transition"
                    >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>

                    {isSignup && values.password.length > 0 && (
                        <p
                            className={`mt-2 text-sm ${passwordStrength.valid ? 'text-green-600' : 'text-red-600'
                                }`}
                        >
                            {passwordStrength.message}
                        </p>
                    )}
                </div>

                {isSignup && (
                    <div className="mb-6 relative">
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-black/70 mb-1"
                        >
                            Confirm password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={values.confirmPassword || ''}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                            className="w-full px-3 py-2 border border-black/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-[35px] text-black/50 hover:text-[var(--accent)] transition"
                        >
                            {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                )}

                <div className="mb-6">
                    <button
                        type="submit"
                        disabled={isSubmitting || (isSignup && !passwordStrength.valid)}
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
                                <span>Submitting...</span>
                            </div>
                        ) : (
                            buttonLabel
                        )}
                    </button>

                </div>

                <div className="text-center">
                    {isSignup ? (
                        <p className="text-sm text-black/70">
                            Already have an account?{' '}
                            <Link
                                href="/signin"
                                className="font-medium text-[var(--accent)] hover:brightness-110 transition"
                            >
                                Sign in
                            </Link>
                        </p>
                    ) : (
                        <p className="text-sm text-black/70">
                            Don't have an account yet?{' '}
                            <Link
                                href="/signup"
                                className="font-medium text-[var(--accent)] hover:brightness-110 transition"
                            >
                                Sign up
                            </Link>
                        </p>
                    )}
                </div>
            </form>
        </div>
    )
}
