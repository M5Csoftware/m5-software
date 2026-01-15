'use client'
import React, { createContext, useState } from 'react';

export const BranchContext = createContext(); // Create the context

export const BranchProvider = ({ children }) => {
    const [selectedBranch, setSelectedBranch] = useState(null);




    return (
        <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
            {children}
        </BranchContext.Provider>
    );
};
