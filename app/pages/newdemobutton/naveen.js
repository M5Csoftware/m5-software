"use client";
import { RadioButtonDemo } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const NewDemoButton = () => {
  const { register, setValue } = useForm();
  const [accountTypeDemo, setAccountTypeDemo] = useState("ONE");
  // console.log(accountTypeDemo);
  return (
    <div className="flex gap-4">
      <RadioButtonDemo
        id="ONE"
        name="accountTypeDemo"
        register={register}
        setValue={setValue}
        value="new"
        selectedValue={accountTypeDemo}
        setSelectedValue={setAccountTypeDemo}
        label={`ONE`}
      />
      <RadioButtonDemo
        id="TWO"
        name="accountTypeDemo"
        register={register}
        setValue={setValue}
        value="add"
        selectedValue={accountTypeDemo}
        setSelectedValue={setAccountTypeDemo}
        label={`TWO`}
      />
    </div>
  );
};

export default NewDemoButton;
