'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Dropdown, LabeledDropdown } from './Dropdown';
import axios from 'axios';

function Test() {
    const { handleSubmit, register, setValue } = useForm();
    const callApi = async () => {
        try {
            const response = await axios.get('/api/sample');
            // console.log(response.data.message); // Logs: "Hello from the App Router!"
        } catch (error) {
            console.error('Error calling the API:', error);
        }
    };

    const onSubmit = (data) => {
        // console.log(data); // Form values will include dropdown selections
        callApi()
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <form onSubmit={handleSubmit(onSubmit)} className="w-[450px] flex flex-col gap-4">
                <Dropdown
                    title="Select an Option"
                    options={['Option 1', 'Option 2', 'Option 3']}
                    name="simpleDropdown"
                    register={register}
                    setValue={setValue}
                />
                <LabeledDropdown
                    title="Select Another Option"
                    options={['Option A', 'Option B', 'Option C']}
                    name="labeledDropdown"
                    register={register}
                    setValue={setValue}
                />
                <button type="submit" className="px-4 py-2 bg-blue-500  rounded">
                    Submit
                </button>
            </form>
        </div>
    );
}

export default Test;
