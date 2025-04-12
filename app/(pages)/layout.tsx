import React from 'react'

const PagesLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='w-full h-full fixed top-0 left-0 right-0 bottom-0 overflow-hidden'>
            {children}
        </div>
    )
}

export default PagesLayout