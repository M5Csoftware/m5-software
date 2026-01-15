import React, { useState } from 'react';
import EmployeeMaster from './EmployeeMaster';
import EmployeeManagement from './EmployeeManagement';

const Employee = () => {
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editEmployeeData, setEditEmployeeData] = useState(null);

  const handleEditEmployee = (employeeData) => {
    setEditEmployeeData(employeeData);
    setShowEmployeeForm(true);
  };

  const handleCloseForm = () => {
    setShowEmployeeForm(false);
    setEditEmployeeData(null);
  };

  return (
    <div>
      {showEmployeeForm ? (
        <EmployeeMaster 
          setShowEmployeeForm={handleCloseForm} 
          editEmployeeData={editEmployeeData}
        />
      ) : (
        <EmployeeManagement 
          setShowEmployeeForm={setShowEmployeeForm} 
          onEditEmployee={handleEditEmployee}
        />
      )}
    </div>
  );
};

export default Employee;