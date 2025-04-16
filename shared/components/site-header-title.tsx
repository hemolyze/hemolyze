"use client";

import { usePathname } from 'next/navigation';

const Title = () => {
    const pathname = usePathname();

    let titleText = "New";

    if (pathname?.startsWith('/reports/')) {
        titleText = "Report";
    } else if (pathname === '/new') {
        titleText = "New";
    } else if (pathname === '/sample') {
        titleText = "Sample Report"
    }

    return (
        <div className="flex items-center gap-2">
            <h1 className="text-base font-medium">{titleText}</h1>
        </div>
    );
}

export default Title;