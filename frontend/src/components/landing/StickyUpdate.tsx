import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function StickyUpdate() {
    const [showStickyUpdate, setShowStickyUpdate] = useState(true);

    useEffect(() => {
        const storedValue = sessionStorage.getItem("stickyupdate");
        if (storedValue === "false") {
            setShowStickyUpdate(false);
        }
    }, []);

    const closeButton = () => {
        sessionStorage.setItem("stickyupdate", "false");
        setShowStickyUpdate(false);
    };

    if (!showStickyUpdate) return null;

    return (
        <div className="w-screen m-0 px-20 py-2 sticky top-0 flex justify-between bg-notification">
            <p className="text-white">
                This is some update that will be shown at the top.
            </p>
            <X onClick={closeButton} className="text-white cursor-pointer" />
        </div>
    );
}