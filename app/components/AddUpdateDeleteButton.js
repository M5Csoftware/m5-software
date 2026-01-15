// import React from 'react'
// import Image from 'next/image'

// function Button({ logo, name, disabled, onClick = () => { } }) {
//     return (
//         <button type='button' onClick={onClick} disabled={disabled} className={`w-[100px]   border rounded-md px-5 py-2.5 flex gap-2 text-sm items-center ${name == "Delete" ? "bg-red/30 text-red/50" : "bg-platinum-btn text-dim-gray"} ${disabled ? 'opacity-75 cursor-not-allowed' : ''}`}>
//             <Image src={logo} alt={name} width={12} height={12} />
//             <span>{name}</span>
//         </button>
//     )
// }

// export function AddButton({ disabled, onClick }) {
//     return (
//         <Button onClick={onClick} disabled={disabled} logo={`/add.svg`} name={`Add`} />
//     )
// }
// export function EditButton({ disabled, onClick , label = "Edit" }) {
//     return (
//         <Button onClick={onClick} disabled={disabled} logo={`/edit.svg`} name={label} />
//     )
// }
// export function DeleteButton({ disabled, onClick }) {
//     return (
//         <Button onClick={onClick} disabled={disabled} logo={`/delete-red.svg`} name={`Delete`} />
//     )
// }
// export function CreateButton({ disabled, onClick }) {
//     return (
//         <Button onClick={onClick} disabled={disabled} logo={`/create.svg`} name={`Create`} />
//     )
// }
// export function SaveButton({ disabled, onClick }) {
//     return (
//         <Button onClick={onClick} disabled={disabled} logo={`/save.svg`} name={`Save`} />
//     )
// }

import React, { useEffect, useState } from "react";
import Image from "next/image";

function Button({ logo, name, disabled, onClick = () => {}, perm, className }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("user");
      const l = localStorage.getItem("user");
      const u = s ? JSON.parse(s) : l ? JSON.parse(l) : null;
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const allowed = perm ? user?.permissions?.[perm] === true : true;

  const finalDisabled = disabled || !allowed;
  const tooltip = !allowed ? "Not authorized for this action" : "";

  return (
    <button
      type="button"
      onClick={allowed ? onClick : undefined}
      disabled={finalDisabled}
      title={tooltip}
      className={`w-[100px] border rounded-md px-3 justify-center py-1 flex gap-2 text-sm items-center
        ${
          name === "Delete"
            ? "bg-red/30 text-red/50"
            : "bg-platinum-btn text-dim-gray"
        }
        ${finalDisabled ? "opacity-75 cursor-not-allowed" : ""}
        ${className || ""}
      `}
    >
      <Image src={logo} alt={name} width={12} height={12} />
      <span className="mr-2">{name}</span>
    </button>
  );
}

export function AddButton({ disabled, onClick, perm }) {
  return (
    <Button
      perm={perm}
      onClick={onClick}
      disabled={disabled}
      logo="/add.svg"
      name="Add"
    />
  );
}

export function EditButton({ disabled, onClick, perm, label = "Edit" }) {
  return (
    <Button
      perm={perm}
      onClick={onClick}
      disabled={disabled}
      logo="/edit.svg"
      name={label}
    />
  );
}

export function DeleteButton({ disabled, onClick, perm }) {
  return (
    <Button
      perm={perm}
      onClick={onClick}
      disabled={disabled}
      logo="/delete-red.svg"
      name="Delete"
    />
  );
}

export function CreateButton({ disabled, onClick, perm }) {
  return (
    <Button
      perm={perm}
      onClick={onClick}
      disabled={disabled}
      logo="/create.svg"
      name="Create"
    />
  );
}

export function SaveButton({ disabled, onClick, perm }) {
  return (
    <Button
      perm={perm}
      onClick={onClick}
      disabled={disabled}
      logo="/save.svg"
      name="Save"
    />
  );
}
