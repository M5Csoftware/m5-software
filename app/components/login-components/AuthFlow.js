import Image from "next/image";
import { useContext, useEffect, useRef, useState } from "react";
import InputBox from "../InputBox";
import { SimpleButton } from "../Buttons";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";

// Step 1: Forgot Password
function ForgotPassword({ next, goBackToLogin, setUserEmail }) {
  const {
    register,
    formState: { errors },
    setValue,
    trigger,
    handleSubmit,
  } = useForm();
  const { server } = useContext(GlobalContext);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false); // NEW: Loading state for send button

  useEffect(() => {
    if (!email || email.length === 0) {
      setIsVerified(false);
      setIsVerifying(false);
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setIsVerified(false);
      setIsVerifying(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsVerifying(true);
      setErrorMessage("");

      try {
        const res = await axios.post(`${server}/auth/verify-email`, {
          email: email.trim(),
        });

        if (res.data.success) {
          setIsVerified(true);
          setErrorMessage("");
        } else {
          setIsVerified(false);
        }
      } catch (err) {
        console.error("Email verification error:", err);
        setIsVerified(false);
      } finally {
        setIsVerifying(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [email, server]);

  const onSubmit = async (data) => {
    if (!isVerified) {
      setErrorMessage("Please enter a valid registered email");
      return;
    }

    setErrorMessage("");
    setIsSending(true); // NEW: Start loading

    try {
      const res = await axios.post(`${server}/auth/send-otp`, {
        email: data.email,
      });

      if (res.data.success) {
        setUserEmail(data.email);
        next();
      } else {
        setErrorMessage(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsSending(false); // NEW: Stop loading
    }
  };

  return (
    <form
      className="bg-white rounded-md flex flex-col items-start justify-start w-full"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex items-start gap-4 mb-10">
        <Image
          src={`m5c-logo-title.svg`}
          alt="login-logo"
          width={550}
          height={200}
        />
      </div>

      <h2 className="text-[#313131] font-semibold font-sans text-3xl my-3">
        Forget Password
      </h2>
      <span className="text-[#313131] font-medium font-sans mb-10 ml-0.5">
        Enter your email address associated with your account
      </span>

      <div className="mb-4 w-full relative">
        <div className="relative">
          <input
            type="email"
            placeholder="Email"
            {...register("email", { required: "Email is required" })}
            onChange={(e) => {
              setValue("email", e.target.value);
              setEmail(e.target.value);
              trigger("email");
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-[#EA1B40] pr-10"
            disabled={isSending} // NEW: Disable during sending
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isVerifying && <Loader2 className="animate-spin text-gray-400" size={20} />}
            {!isVerifying && isVerified && (
              <Check className="text-green-500" size={20} />
            )}
          </div>
        </div>
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
      )}

      <span
        className="text-sm font-medium text-[#EA1B40] hover:underline cursor-pointer mb-8 mt-4"
        onClick={() => next("contactAdmin")}
      >
        I don't remember my Email ID
      </span>

      <div className="w-full">
        {/* NEW: Updated button with loading state and disabled state */}
        <button
          type="submit"
          disabled={isSending || !isVerified}
          className="w-full bg-[#EA1B40] text-white text-sm font-semibold py-2 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSending && <Loader2 className="animate-spin" size={18} />}
          {isSending ? "Sending..." : "Send Code"}
        </button>

        <button
          type="button"
          className="w-full bg-[#EBEBEB] text-[#EA1B40] text-sm font-semibold py-2 rounded-md mt-3 shadow-sm"
          onClick={goBackToLogin}
          disabled={isSending}
        >
          Return to Login
        </button>
      </div>
    </form>
  );
}

// Step 2: Check Your Email
function CheckYourEmail({ next, back, goBackToLogin, userEmail }) {
  const {
    register,
    formState: { errors },
    setValue,
    trigger,
    handleSubmit,
  } = useForm();
  const { server } = useContext(GlobalContext);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30); // NEW: Cooldown timer
  const [canResend, setCanResend] = useState(false); // NEW: Can resend flag
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // NEW: Cooldown timer effect - starts on component mount
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  useEffect(() => {
    register("otp", {
      required: "OTP is required",
      validate: (val) =>
        val && val.length === 6 ? true : "OTP must be 6 digits",
    });
  }, [register]);

  const handleResendCode = async () => {
    if (!canResend) return; // Prevent resend during cooldown

    setResendLoading(true);
    setErrorMessage("");

    try {
      const res = await axios.post(`${server}/auth/send-otp`, {
        email: userEmail,
      });

      if (res.data.success) {
        setNotification({
          type: "success",
          message: "OTP resent successfully!",
          visible: true,
        });
        // NEW: Reset cooldown after successful resend
        setResendCooldown(30);
        setCanResend(false);
      } else {
        setErrorMessage(res.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setErrorMessage("");

    try {
      const res = await axios.post(`${server}/auth/verify-otp`, {
        email: userEmail,
        otp: data.otp,
      });

      if (res.data.success) {
        next();
      } else {
        setErrorMessage(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form
        className="bg-white rounded-md flex flex-col items-start justify-start w-full font-sans"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex items-start gap-4 mb-10">
          <Image
            src={`m5c-logo-title.svg`}
            alt="login-logo"
            width={550}
            height={200}
          />
        </div>

        <h2 className="text-[#313131] font-semibold font-sans text-3xl my-3">
          Check Your Email
        </h2>
        <span className="text-[#313131] font-medium font-sans mb-10 ml-0.5">
          6-digit code has been sent to {userEmail}
        </span>

        <div className="mb-4 w-full">
          <OTPInput
            length={6}
            setValue={setValue}
            trigger={trigger}
            error={errors.otp}
          />
        </div>

        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}

        {/* NEW: Updated resend section with cooldown timer */}
        <div className="flex text-sm font-medium mb-6">
          <h2>Didn't get the code? &nbsp; </h2>
          <button
            type="button"
            className="text-sm font-medium text-[#EA1B40] cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleResendCode}
            disabled={resendLoading || !canResend}
          >
            {resendLoading 
              ? "Sending..." 
              : !canResend 
                ? `Resend Code (${resendCooldown}s)` 
                : "Resend Code"
            }
          </button>
        </div>

        <div className="w-full">
          <SimpleButton name="Verify Code" type="submit" />

          <button
            type="button"
            className="w-full bg-[#EBEBEB] text-[#EA1B40] text-sm font-semibold py-2 rounded-md mt-3 shadow-sm"
            onClick={goBackToLogin}
          >
            Return to Login
          </button>
        </div>
        <button
          type="button"
          className="text-eerie-black font-light text-sm flex items-center gap-1 mt-4"
          onClick={back}
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </form>
    </>
  );
}
// Step 3: Create New Password
function CreateANewPassword({ goBack, goBackToLogin, next, userEmail }) {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm();
  const { server } = useContext(GlobalContext);
  const [errorMessage, setErrorMessage] = useState("");

  const password = watch("password");

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setErrorMessage("");

    try {
      const res = await axios.post(`${server}/auth/reset-password`, {
        email: userEmail,
        password: data.password,
      });

      if (res.data.success) {
        next();
      } else {
        setErrorMessage(res.data.message || "Failed to reset password");
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-md flex flex-col items-start justify-start w-full font-sans"
    >
      <div className="flex items-start gap-4 mb-10">
        <Image
          src={`m5c-logo-title.svg`}
          alt="login-logo"
          width={550}
          height={200}
        />
      </div>
      <h2 className="text-[#313131] font-semibold text-3xl my-3">
        Create New Password
      </h2>
      <span className="text-[#313131] font-medium font-sans mb-8 ml-0.5">
        Enter and confirm your new password below
      </span>
      <div className="w-full mb-2">
        <InputBox
          placeholder={`Password`}
          value={"password"}
          register={register}
          setValue={setValue}
          error={errors.password}
          trigger={trigger}
          validation={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          }}
          type="password"
        />
      </div>
      <div className="w-full mb-6">
        <InputBox
          placeholder={`Confirm Password`}
          value={"confirmPassword"}
          register={register}
          setValue={setValue}
          error={errors.confirmPassword}
          trigger={trigger}
          validation={{
            required: "Confirm Password is required",
            validate: (value) =>
              value === password || "Passwords do not match",
          }}
          type="password"
        />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
      )}

      <SimpleButton name="Reset Password" type="submit" />
      <button
        type="button"
        className="w-full bg-[#EBEBEB] text-[#EA1B40] text-sm font-semibold py-2 rounded-md mt-2 shadow-sm"
        onClick={goBackToLogin}
      >
        Return to Login
      </button>
      <button
        type="button"
        className="text-eerie-black font-light text-sm flex items-center gap-1 mt-4"
        onClick={goBack}
      >
        <ArrowLeft size={18} /> Back
      </button>
    </form>
  );
}

// Step 4: Password Changed Success
function PasswordChanged({ goBackToLogin }) {
  const [notification, setNotification] = useState({
    type: "success",
    message: "Password updated successfully! You can now login with your new password.",
    visible: true,
  });

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="bg-white rounded-md flex flex-col items-start justify-start w-full font-sans">
        <div className="flex items-start gap-4 mb-10">
          <Image
            src={`m5c-logo-title.svg`}
            alt="login-logo"
            width={550}
            height={200}
          />
        </div>
        <div className="flex flex-col w-full items-center justify-center">
          <img src="success-shield.png" alt="success" className="w-36 h-36" />
          <h2 className="text-[#EA1B40] font-bold text-4xl my-5 text-center tracking-normal leading-normal">
            Password changed <br />
            successfully!
          </h2>
          <p className="text-[#18181B] text-center font-medium mb-8">
            You can now use your new password to log in.
          </p>
        </div>
        <button
          className="w-full bg-[#EBEBEB] text-[#EA1B40] text-sm font-semibold py-2 rounded-md shadow-sm"
          onClick={goBackToLogin}
        >
          Return to Login
        </button>
      </div>
    </>
  );
}

// OTP Input Component
function OTPInput({ length = 6, setValue, trigger, error }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputs = useRef([]);

  const handleChange = (el, index) => {
    const val = el.target.value.replace(/\D/, "");
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < length - 1) inputs.current[index + 1].focus();

    const otpStr = newOtp.join("");
    setValue("otp", otpStr);
    trigger("otp");
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, length).split("");
    const newOtp = [...otp];
    pasted.forEach((char, i) => {
      if (i < length) newOtp[i] = char;
    });
    setOtp(newOtp);
    setValue("otp", newOtp.join(""));
    trigger("otp");
  };

  return (
    <div className="flex flex-col">
      <div className="flex gap-3 justify-start mb-2" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(ref) => (inputs.current[i] = ref)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !otp[i] && i > 0) {
                inputs.current[i - 1].focus();
              }
            }}
            className="w-12 h-12 text-center border border-gray-400 rounded-md text-lg focus:outline-none focus:border-[#EA1B40] transition-all"
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
}

// Contact Admin Screen
function ContactYourAdmin({ goBack, goBackToLogin }) {
  return (
    <div className="bg-white rounded-md flex flex-col items-start justify-start w-full font-sans">
      <div className="flex items-start gap-4 mb-10">
        <Image
          src={`m5c-logo-title.svg`}
          alt="login-logo"
          width={550}
          height={200}
        />
      </div>

      <div className="flex flex-col items-center justify-center text-center w-full">
        <img
          src="contact-admin.png"
          alt="Contact-your-admin"
          className="h-[35vh]"
        />

        <h2 className="text-[#EA1B40] font-semibold font-sans mb-8 mt-2 text-2xl text-center tracking-normal leading-normal">
          Please Contact Your Admin
        </h2>
      </div>
      <button
        className="w-full bg-[#EBEBEB] text-[#EA1B40] text-sm font-semibold py-2 rounded-md shadow-sm mb-3"
        onClick={goBackToLogin}
      >
        Return to Login
      </button>
    </div>
  );
}

// Main Multi-Step Component
export default function AuthFlow({ goBackToLogin }) {
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState("");

  const nextStep = (stepName) => {
    if (stepName === "contactAdmin") setStep(5);
    else setStep(step + 1);
  };

  return (
    <div className="pt-6 h-[60vh] rounded-md flex flex-col items-start justify-start w-[28vw]">
      {step === 1 && (
        <ForgotPassword
          next={nextStep}
          goBackToLogin={goBackToLogin}
          setUserEmail={setUserEmail}
        />
      )}
      {step === 2 && (
        <CheckYourEmail
          next={() => setStep(3)}
          back={() => setStep(1)}
          goBackToLogin={goBackToLogin}
          userEmail={userEmail}
        />
      )}
      {step === 3 && (
        <CreateANewPassword
          goBack={() => setStep(1)}
          goBackToLogin={goBackToLogin}
          next={() => setStep(4)}
          userEmail={userEmail}
        />
      )}
      {step === 4 && <PasswordChanged goBackToLogin={goBackToLogin} />}
      {step === 5 && (
        <ContactYourAdmin
          goBack={() => setStep(1)}
          goBackToLogin={goBackToLogin}
        />
      )}
    </div>
  );
}