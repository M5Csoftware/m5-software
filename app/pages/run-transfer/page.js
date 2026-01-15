'use client'
import React, { useState } from 'react'
import RunReport from './RunReport';
import RunTransferFrom from './RunTransferFrom';


function RunTransfer() {
    const [currentView, setCurrentView] = useState("Run Transfer");

    return (
        <>
            {currentView === "Run Transfer" ? (
                <RunTransferFrom setCurrentView={setCurrentView} />
            ) : (
                <RunReport setCurrentView={setCurrentView} />

            )}
        </>
    );
}

export default RunTransfer;
