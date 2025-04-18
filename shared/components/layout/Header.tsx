'use client'; // Clerk components require client-side interaction
import Link from 'next/link';
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs';
import { Button } from "@/shared/components/ui/button";
import { PrefetchNewPage } from "@/shared/components/utils/PrefetchNewPage";
import ThemeToggle from "@/shared/components/ui/ThemeToggle";

// Reusing the Logo definition (consider moving to a shared location if used elsewhere)
const Logo = () => (
    <div className="flex items-center gap-2">
        {/* Placeholder for actual SVG logo */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-gray-100">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" />
            <path d="M12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12Z" fill="currentColor" />
        </svg>
        <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Hemolyze</span>
    </div>
);

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-gray-700/40 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
            <div className="w-full max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-0">
                <Link href="/"><Logo /></Link>
                <nav className="flex items-center space-x-2 md:space-x-4">
                    <ThemeToggle />
                    <SignedOut>
                        <SignInButton>
                            <Button variant="ghost" size="sm" className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800">Login</Button>
                        </SignInButton>
                        <SignUpButton>
                            <Button size="sm" className="text-sm">Sign Up</Button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <PrefetchNewPage />
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                </nav>
            </div>
        </header>
    );
} 