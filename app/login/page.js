"use client";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useContext, useState } from "react";
import { useAuth } from "../Context/AuthContext";
import InputBox from "../components/InputBox";
import Image from "next/image";
import RedCheckbox from "../components/RedCheckBox";
import { SimpleButton } from "../components/Buttons";
import { GlobalContext } from "../lib/GlobalContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import AuthFlow from "../components/login-components/AuthFlow";
import Lottie from "lottie-react";
import loginAnim from "@/app/lottie/login-page.json";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm();
  const [rememberMe, setRememberMe] = useState(false);
  const { server } = useContext(GlobalContext);
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false); // <-- this was missing
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setErrorMessage("");
    setIsLoading(true);
    try {
      const res = await axios.post(`${server}/auth/login`, {
        userId: data.userId,
        password: data.password,
      });

      if (res.data.success) {
        login(res.data.user, res.data.token, rememberMe);
      } else {
        setErrorMessage(res.data.message || "Invalid credentials");
        setIsLoading(false);
      }
    } catch (err) {
      const remaining = err.response?.headers?.['x-ratelimit-remaining'];
      const retryAfter = err.response?.headers?.['retry-after'];
      
      let msg = err.response?.data?.message;

      if (err.response?.status === 401) {
        msg = "Wrong password or User ID";
      } else if (!msg) {
        if (err.response?.status === 429) {
          msg = `Too many attempts. Please try again in ${Math.ceil(
            retryAfter / 60
          )} minutes.`;
        } else {
          msg = "Server error";
        }
      }

      if (remaining !== undefined && err.response?.status !== 429) {
        msg += `. ${remaining} attempts left.`;
      }

      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gap-20">
      {showForgotPassword ? (
        <AuthFlow goBackToLogin={() => setShowForgotPassword(false)} />
      ) : (
        <div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-md pt-6 h-[60vh] flex flex-col items-start justify-center w-[28vw]"
          >
            <div className="flex items-start gap-4 mb-10">
              <Image
                className=""
                src={`m5c-logo-title.svg`}
                alt="login-logo"
                width={550}
                height={200}
              />
            </div>
            <h2 className="text-[#313131] font-semibold font-sans text-3xl text-left cursor-default my-3">
              Login
            </h2>
            <span className="text-[#313131] font-medium font-sans mb-10 ml-0.5 cursor-default">
              Login to access your M5C Employee account
            </span>
            <div className="mb-3 w-full">
              <InputBox
                placeholder={`USER ID`}
                value={"userId"}
                register={register}
                setValue={setValue}
                error={errors.userId}
                trigger={trigger}
                validation={{ required: "Employee ID is required" }}
              />
            </div>

            <div className="mb-3 w-full">
              <InputBox
                placeholder={`PASSWORD`}
                value={"password"}
                register={register}
                setValue={setValue}
                error={errors.password}
                trigger={trigger}
                validation={{ required: "Password is required" }}
                type="password"
              />
            </div>
            <div className="w-full mb-14 mt-4">
              <RedCheckbox
                id={`rememberMe`}
                label={"Remember me"}
                register={register}
                setValue={setValue}
                isChecked={rememberMe}
                setChecked={setRememberMe}
              />
            </div>

            {/* Server Error */}
            {errorMessage && (
              <p className="text-red text-sm text-center w-full">
                {errorMessage}
              </p>
            )}

            <div className="w-full pt-2">
              <SimpleButton
                name={isLoading ? `Logging in...` : `Login`}
                type="submit"
                disabled={isLoading}
                className={
                  isLoading
                    ? "bg-green-2 hover:bg-green-3"
                    : "bg-red hover:bg-dark-red"
                }
              />
            </div>
            <div className="text-[#313131] text-sm tracking-wide font-sans py-2 flex flex-row items-center justify-center text-center w-full mt-3">
              <h2 className="text-[#313131] font-medium cursor-default">
                Forgot Password?&nbsp;
              </h2>
              <span
                className="text-[#EA1B40] font-medium cursor-pointer"
                onClick={() => setShowForgotPassword(true)}
              >
                Request Password Change
              </span>
            </div>
          </form>
        </div>
      )}

      {/* <div className="h-[70vh]">
        <div className="h-full w-[30vw] rounded-2xl border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#EA1B40] opacity-30 z-10" />

          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{
              clickable: true,
              renderBullet: (index, className) =>
                `<span class="${className}" style="
        width:8px;
        height:8px;
        border-radius:50%;
        margin:0 5px;
        display:inline-block;
        background:white;
        transition:all 0.5s ease-in;
      "></span>`,
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop
            className="h-full w-full relative z-[60]" // ensures swiper sits above overlay
          >
            <SwiperSlide>
              <img
                src="login-img1.png"
                alt="slide 1"
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
            <SwiperSlide>
              <div className="w-full h-full object-cover flex items-center justify-center">
                {" "}
                <img src="login-img2.png" alt="slide 2" className="" />{" "}
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="w-full h-full object-cover flex items-center justify-center">
                <img src="login-img3.png" alt="slide 3" className="" />
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="w-full h-full object-cover flex items-center justify-center">
                <img src="login-img4.png" alt="slide 4" className="ml-20" />
              </div>
            </SwiperSlide>
          </Swiper>

         
        </div>
      </div> */}

      <div className="w-[48vw] rounded-2xl pt-[7vh] flex flex-col justify-center items-center h-[70vh]">
        <Lottie animationData={loginAnim} loop={true}  />
      </div>

      <style jsx global>{`
        .swiper {
          position: relative !important;
          z-index: 60 !important;
        }

        .swiper-pagination {
          bottom: 12px !important;
          position: absolute !important;
          z-index: 70 !important; /* ensures above overlay */
          text-align: center !important;
        }

        .swiper-pagination-bullet {
          background: white !important;
          opacity: 1 !important; /* keeps full opacity */
          transform: scale(1);
          transition: width 0.05s ease-out, transform 0.05s ease-out !important; /* only animate width & scale */
        }

        .swiper-pagination-bullet-active {
          background: #ea1b40 !important;
          width: 22px !important;
          transform: scale(1.2);
          border-radius: 999px !important;
          opacity: 1 !important; /* prevent fading */
          transition: width 1s cubic-bezier(0.05, 0.9, 0.25, 1),
            transform 1s cubic-bezier(0.05, 0.9, 0.25, 1) !important;
        }

        .swiper-pagination-bullet:not(.swiper-pagination-bullet-active) {
          width: 8px !important;
          transition: all 0.1s ease-in;
        }
      `}</style>
    </div>
  );
}
