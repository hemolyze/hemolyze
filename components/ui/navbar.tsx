import Link from "next/link";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
    return (
        <>
            <nav>
                <div className="max-w-7xl mx-auto px-2">
                    <div className="flex justify-between">
                        <div className="flex space-x-4">
                            <div className="flex items-center py-4 px-2">
                                <Link href="/" className="font-bold text-gray-800 text-2xl">
                                    <span className="text-gray-800 text-xl">
                                        Hemolyze
                                    </span>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="py-4 px-2 text-md text-gray-600 hover:text-gray-900">
                                Features
                            </Link>
                            <Link href="/" className="py-4 px-2 text-md text-gray-600 hover:text-gray-900">
                                About
                            </Link>
                            <Button 
                                variant="outline" 
                                
                                className="py-4 px-4 text-md border-blue-500 text-gray-600 hover:text-gray-900">
                                Login
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}
