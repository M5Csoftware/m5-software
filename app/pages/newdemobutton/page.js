'use client'
import { RadioButtonLarge } from '@/app/components/RadioButton'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

function NewDemoButton() {
    const { register, setValue } = useForm();
    const [demoRadio, setDemoRadio] = useState("one")
    return (
        <form className='flex flex-col gap-9'>
            <div className="flex w-full gap-3">
                <RadioButtonLarge id={`one`} label={`One`} name={`demo`} register={register} setValue={setValue} selectedValue={demoRadio} setSelectedValue={setDemoRadio} />
                <RadioButtonLarge id={`two`} label={`Two`} name={`demo`} register={register} setValue={setValue} selectedValue={demoRadio} setSelectedValue={setDemoRadio} />
            </div>
            {/* <div className='font-bold text-3xl text-red  '>
                {demoRadio == "one" && "One"}
                {demoRadio == "two" && "Two"}
            </div> */}
            {demoRadio == "one" && <Component1 />}
            {demoRadio == "two" && <Component2 />}
        </form>


    )
}

function Component1() {
    return (
        <div>
            Hello this is one
        </div>
    )
}
function Component2() {
    return (
        <div>
            Hello this is two
        </div>
    )
}

export default NewDemoButton
