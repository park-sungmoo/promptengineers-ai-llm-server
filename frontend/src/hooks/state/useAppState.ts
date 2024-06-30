import { useState } from "react";


export const defaultAppState = {
    loading: false,
    isOpen: false,
    isDrawerOpen: false,
    isPopoverOpen: false,
    isWebLoaderOpen: false
};

export const useAppState = () => {
    const [loading, setLoading] = useState<boolean>(defaultAppState.loading);
    const [isOpen, setIsOpen] = useState<boolean>(defaultAppState.isOpen);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(defaultAppState.isDrawerOpen);
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(defaultAppState.isPopoverOpen);
    const [isWebLoaderOpen, setIsWebLoaderOpen] = useState<boolean>(defaultAppState.isWebLoaderOpen);

    const isMobile = () => {
        const isClient = typeof window === "object";

        // Function to check window size and return isOpen state
        const getSize = () => {
            return window.innerWidth < 768;
        };

        return isClient ? getSize() : false;
    };

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
    };

    return {
        // State
        loading,
        setLoading,
        isOpen,
        setIsOpen,
        isDrawerOpen,
        setIsDrawerOpen,
        isPopoverOpen,
        setIsPopoverOpen,
        isWebLoaderOpen,
        setIsWebLoaderOpen,
        // Functions
        isMobile,
        // Mutations
        toggleDrawer,
        closeDrawer
    };
};
