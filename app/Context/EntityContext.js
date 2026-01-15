'use client'
import React, { createContext, useState } from 'react';

export const EntityContext = createContext(); // Create the context

export const EntityProvider = ({ children }) => {
    const [selectedEntity, setSelectedEntity] = useState(null);




    return (
        <EntityContext.Provider value={{ selectedEntity, setSelectedEntity }}>
            {children}
        </EntityContext.Provider>
    );
};
