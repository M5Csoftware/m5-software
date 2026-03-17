"use client";
import React, { useState } from 'react';
import CustomerAccount from './CustomerAccount';
import CustomerManagement from './CustomerManagement';
import UserManagement from './UserManagement';

const Customer = () => {
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [userManagementForm, setUserManagementForm] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [editingUser, setEditingUser] = useState(null); // For assign code flow

  const handleBack = () => {
    setShowCustomerForm(false);
    setUserManagementForm(false);
    setShowCreateAccount(false);
    setSelectedUserData(null);
    setEditingUser(null);
  };

  const handleBackFromCreateAccount = () => {
    setShowCreateAccount(false);
    setUserManagementForm(true);
    setSelectedUserData(null);
    setEditingUser(null);
  };

  // ✅ Handle opening customer form after code assignment
  const handleEditCustomer = (userData) => {
    // console.log("=== Opening Customer Form from Assign Code ===");
    // console.log("User data received:", userData);
    setEditingUser(userData);
    setShowCustomerForm(true);
    setUserManagementForm(false);
    setShowCreateAccount(false);
  };

  // ✅ Handle successful save from customer form - go back to CUSTOMER MANAGEMENT
  const handleSaveSuccess = () => {
    // console.log("=== Customer Form Save Success ===");
    setShowCustomerForm(false);
    setEditingUser(null);
    setUserManagementForm(false); // ✅ Changed: Don't go to user management
    setShowCreateAccount(false);
    setSelectedUserData(null);
    // All states reset - will show CustomerManagement by default
  };

  // ✅ Handle back from customer form
  const handleBackFromCustomerForm = () => {
    // console.log("=== Back from Customer Form ===");
    setShowCustomerForm(false);
    setEditingUser(null);
    // If we came from user management (editingUser was set), go back there
    if (editingUser) {
      setUserManagementForm(true);
    }
  };

  return (
    <div>
      {/* Show Create Account Page (from User Management - "Create Account" button) */}
      {showCreateAccount ? (
        <CustomerAccount 
          onBack={handleBackFromCreateAccount}
          prefilledUserData={selectedUserData}
        />
      ) : /* Show Customer Account Form (from Assign Code or Add Customer button) */
      showCustomerForm ? (
        <CustomerAccount 
          onBack={handleBackFromCustomerForm}
          prefilledUserData={editingUser} // ✅ Pass editingUser as prefilledUserData
          onSaveSuccess={handleSaveSuccess} // ✅ Called after save in GrrmSmse
        />
      ) : /* Show User Management */
      userManagementForm ? (
        <UserManagement 
          setShowCustomerForm={setShowCustomerForm} 
          setUserManagementForm={setUserManagementForm}
          onBack={handleBack}
          setShowCreateAccount={setShowCreateAccount}
          setSelectedUserData={setSelectedUserData}
          onEditCustomer={handleEditCustomer} // ✅ CRITICAL: Pass this handler
        />
      ) : /* Show Customer Management (Default) */
      (
        <CustomerManagement 
          setShowCustomerForm={setShowCustomerForm} 
          setUserManagementForm={setUserManagementForm}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default Customer;