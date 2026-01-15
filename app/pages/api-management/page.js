"use client"
import { useState } from "react";
import ApiUserForm from "./ApiUserForm";

const { default: ApiManagement } = require("./ApiManagement");

// In your parent component
function ApiManagementPage() {
    const [showApiUserForm, setShowApiUserForm] = useState(false);
    const [editingApiUser, setEditingApiUser] = useState(null);

    const handleEditApiUser = (user) => {
        setEditingApiUser(user);
        setShowApiUserForm(true);
    };

    return (
        <div>
            {showApiUserForm ? (
                <ApiUserForm
                    user={editingApiUser}
                    onClose={() => {
                        setShowApiUserForm(false);
                        setEditingApiUser(null);
                    }}
                />
            ) : (
                <ApiManagement
                    setShowApiUserForm={setShowApiUserForm}
                    onEditApiUser={handleEditApiUser}
                />
            )}
        </div>
    );
}

export default ApiManagementPage;