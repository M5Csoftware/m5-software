import React from "react";
import { DummyInputBoxDarkGray, DummyInputBoxLightGray } from "./DummyInputBox";
import { useForm } from "react-hook-form";
import InputBox from "./InputBox";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";

const ManifestO = () => {
  const { register, setValue } = useForm();
  return (
    <form>
      <div className="flex flex-col  gap-5 mt-6">
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
                <DummyInputBoxLightGray
                  register={register}
                  placeholder={`Sector `}
                  setValue={setValue}
                  value={`sector`}
                />
                <DummyInputBoxLightGray
                  register={register}
                  placeholder={`A/L MAWB`}
                  setValue={setValue}
                  value={`a/lMawb`}
                />
                <DummyInputBoxLightGray
                  register={register}
                  placeholder={`OBC`}
                  setValue={setValue}
                  value={`obc`}
                />
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <DummyInputBoxLightGray
                register={register}
                placeholder={`Date`}
                setValue={setValue}
                value={`date`}
              />
              <DummyInputBoxLightGray
                register={register}
                placeholder={`Counter Part`}
                setValue={setValue}
                value={`counterPart`}
              />
              <DummyInputBoxLightGray
                register={register}
                placeholder={`Flight`}
                setValue={setValue}
                value={`flight`}
              />
              <div className="flex justify-end">
                <div>
                  {/* <OutlinedButtonRed label={"Close"} /> */}
                </div>
                <div>
                  <SimpleButton name={"Download"} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ManifestO;
