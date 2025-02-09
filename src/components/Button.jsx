import { useCallback } from "react";

export default function Button({ children }) {
    const handleClick = useCallback(() => {
        console.log("click");
    }, [])

    return <button type="button" className="bg-blue-400 border-none min-w-[200px] px-4 py-2 rounded-md text-white font-bold" onClick={handleClick}>{children}
    </button>
}
