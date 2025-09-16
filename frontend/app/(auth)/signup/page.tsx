"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import RegisterStep from "@/components/auth/RegisterStep";
import SelectAccount from "@/components/auth/SelectAccount";
import RegisterForm from "@/components/auth/RegisterForm";
import VerifyAccount from "@/components/auth/VerifyAccount";

const SignUpPage = () => {
  const [registrationStep, setRegistrationStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<"student" | "tutor" | null>(
    null
  );
  const [userRegisteredEmail, setUserRegisteredEmail] = useState<string | null>(
    null
  );

  const searchParams = useSearchParams();

  useEffect(() => {
    // Kiểm tra xem URL có tham số `social=1` không
    const isSocialReturn = searchParams?.get("social") === "1";

    // Nếu đây là một lượt quay về từ trang social login...
    if (isSocialReturn) {
      // ...thì ép cho trang hiển thị Step 2 (RegisterForm)
      // RegisterForm sẽ tự xử lý phần còn lại bằng cookie
      setRegistrationStep(2);
    }
  }, [searchParams]); // Chạy lại khi URL thay đổi

  const renderCurrentStep = () => {
    switch (registrationStep) {
      case 1:
        return (
          <SelectAccount
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            setRegistrationStep={setRegistrationStep}
          />
        );
      case 2:
        return (
          <RegisterForm
            selectedRole={selectedRole}
            setRegistrationStep={setRegistrationStep}
            setUserRegisteredEmail={setUserRegisteredEmail}
          />
        );
      case 3:
        return (
          <VerifyAccount
            email={userRegisteredEmail}
            setRegistrationStep={setRegistrationStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="theme-mode flex flex-col justify-center items-center w-full p-[20px] md:py-[60px] gap-8">
      <RegisterStep registrationStep={registrationStep} />
      <div className="w-full flex justify-center">{renderCurrentStep()}</div>
    </div>
  );
};

export default SignUpPage;
