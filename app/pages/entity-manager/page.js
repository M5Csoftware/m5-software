'use client'
import React, { useState } from 'react'
import EntityManager from './EntityManager'
import EntityManagerWrapper from './EntityManageWrapper'
import ServiceMaster from './ServiceMaster'


function EntityManagerPage() {
    const [currentView, setCurrentView] = useState("entity");
    return (
        <EntityManagerWrapper>
            {currentView === "entity" ? (
                <EntityManager setCurrentView={setCurrentView} />
            ) : (
                <ServiceMaster setCurrentView={setCurrentView} />
            )}
        </EntityManagerWrapper>
    )
}

export default EntityManagerPage
