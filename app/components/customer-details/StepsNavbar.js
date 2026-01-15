"use client";
import React from "react";
import { Stepper, Step, StepLabel, StepConnector } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const StepsNavbar = ({ steps, step, setStep }) => {

  const handleStepClick = (index) => {
    if (index !== step) {
      setStep(index);
    }
  };

  // Create a custom theme to override the default blue color for the stepper
  const theme = createTheme({
    components: {
      MuiStepper: {
        styleOverrides: {
          root: {
            '& .MuiStepIcon-root': {
              color: "#979797", // Default color for all icons (inactive steps)
            },
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            color: "#979797", // Set the default icon color to gray
            '&.Mui-active': {
              color: "#EA1B40", // Active step icon color (red)
            },
            '&.Mui-completed': {
              color: "#EA1B40", // Completed step icon color (red)
            },
            '&.Mui-disabled': {
              color: "#979797", // Disabled step icon color (gray)
            },
          },
        },
      },
      MuiStepConnector: {
        styleOverrides: {
          root: {
            // Default connector color (inactive steps)
            '&.Mui-active .MuiStepConnector-line': {
              backgroundColor: "#EA1B40", // Red color for active connectors
            },
            '&.Mui-completed .MuiStepConnector-line': {
              backgroundColor: "#EA1B40", // Red color for completed connectors
            },
            '&.Mui-disabled .MuiStepConnector-line': {
              backgroundColor: "#979797", // Gray color for disabled connectors
            },
            '& .MuiStepConnector-line': {
              height: 2, // Line thickness
              backgroundColor: "#979797", // Default connector color (inactive state)
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="bg-white px-4 py-6 relative">
        <Stepper activeStep={step} alternativeLabel connector={<StepConnector />}>
          {steps.map((stepObj, index) => (
            <Step key={index}>
              <StepLabel
                onClick={() => handleStepClick(index)}
                sx={{
                  cursor: "pointer",
                  color: step === index ? "#EA1B40" : "#979797", // Active step label in red, inactive in gray
                  fontWeight: step === index ? "bold" : "normal", // Bold font for active step label
                  '&.MuiStepLabel-active': {
                    color: '#EA1B40', // Ensure active step label is red
                  },
                  '&.MuiStepLabel-completed': {
                    color: '#EA1B40', // Completed step label is red
                  },
                  '&:hover': {
                    color: '#EA1B40', // Change label color on hover
                  },
                }}
              >
                {stepObj.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </div>
    </ThemeProvider>
  );
};

export default StepsNavbar;