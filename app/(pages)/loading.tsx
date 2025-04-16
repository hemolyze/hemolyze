import { Loader } from 'lucide-react'
import React from 'react'

const Loading = () => {
    return (
        <div className='flex justify-center items-center w-full h-full'>
            <Loader className='animate-spin' />
        </div>
    )
}

export default Loading