import React from "react";
import { DummyInputBoxDarkGray } from "./DummyInputBox";
import { useForm } from "react-hook-form";
import InputBox from "./InputBox";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";

const ManifestR = () => {
  const { register, setValue } = useForm();
  return (
    <form>
      <div className="flex flex-col gap-5 mt-6">
        <div className="flex flex-col gap-3">
          <div className="">
            <h2 className="text-[16px] text-red font-semibold">Run Details</h2>
          </div>

          <div className="w-full flex gap-6 ">
            <div className=" flex flex-col w-full items-center gap-3">
              <InputBox
                placeholder="Run Number"
                register={register}
                setValue={setValue}
                value="runNumber"
              />
              <div className="w-full flex flex-col gap-3">
                <DummyInputBoxDarkGray
                  register={register}
                  placeholder={`Sector `}
                  setValue={setValue}
                  value={`sector`}
                />
                <DummyInputBoxDarkGray
                  register={register}
                  placeholder={`A/L MAWB`}
                  setValue={setValue}
                  value={`a/lMawb`}
                />
                <DummyInputBoxDarkGray
                  register={register}
                  placeholder={`OBC`}
                  setValue={setValue}
                  value={`obc`}
                />
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <DummyInputBoxDarkGray
                register={register}
                placeholder={`Date`}
                setValue={setValue}
                value={`date`}
              />
              <DummyInputBoxDarkGray
                register={register}
                placeholder={`Counter Part`}
                setValue={setValue}
                value={`counterPart`}
              />
              <DummyInputBoxDarkGray
                register={register}
                placeholder={`Flight`}
                setValue={setValue}
                value={`flight`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-row-reverse gap-3">
          <div>
          <OutlinedButtonRed label={"Close"} />
          </div>
          <div>

          <SimpleButton name={"Download"} />
          </div>
        </div>
      </div>
    </form>
  );
};

export default ManifestR;
