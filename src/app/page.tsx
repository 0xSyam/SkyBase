"use client";

import React from "react";
import Image from "next/image";
import { ButtonBlue } from "../component/ButtonBlue";
import { useRouter } from "next/navigation";

export const Login = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/groundcrew/dashboard");
  };

  return (
    <div className="bg-[#fffeff] flex w-full h-screen overflow-hidden">
      <div className="w-1/2 flex items-center justify-center">
        <div className="flex mt-[-108px] h-[332px] w-[398px] relative flex-col items-center gap-[47px]">
          <div className="relative self-stretch mt-[-1.00px] font-global-tokens-headings-h-5 text-[#01295F] text-[32px] text-center tracking-[var(--global-tokens-headings-h-5-letter-spacing)] leading-[48px] font-[700] [font-style:normal] [font-family:'Plus Jakarta Sans']">
            Welcome back!
          </div>

          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg">
              <div className="relative w-fit mt-[-1.00px] font-global-tokens-body-b-3 text-[#222] text-[length:var(--global-tokens-body-b-3-font-size)] tracking-[var(--global-tokens-body-b-3-letter-spacing)] leading-[var(--global-tokens-body-b-3-line-height)] whitespace-nowrap [font-style:var(--global-tokens-body-b-3-font-style)]">
                Username
              </div>

              <div className="w-[398px] gap-2 px-3.5 py-2 flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-neutral-300 shadow-shadow-xs flex items-center relative">
                <input
                  type="text"
                  placeholder="Type your username"
                  className="w-full bg-transparent outline-none font-global-tokens-body-b-3 font-[number:var(--global-tokens-body-b-3-font-weight)] text-[#222] text-[length:var(--global-tokens-body-b-3-font-size)] tracking-[var(--global-tokens-body-b-3-letter-spacing)] leading-[var(--global-tokens-body-b-3-line-height)] placeholder:text-[#d3d9e0] [font-style:var(--global-tokens-body-b-3-font-style)]"
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg">
              <div className="relative w-fit mt-[-1.00px] font-global-tokens-body-b-3 text-[#222] text-[length:var(--global-tokens-body-b-3-font-size)] tracking-[var(--global-tokens-body-b-3-letter-spacing)] leading-[var(--global-tokens-body-b-3-line-height)] whitespace-nowrap [font-style:var(--global-tokens-body-b-3-font-style)]">
                Password
              </div>

              <div className="w-[398px] gap-2 px-3.5 py-2 flex-[0_0_auto] rounded-lg overflow-hidden border border-solid border-neutral-300 shadow-shadow-xs flex items-center relative">
                <input
                  type="password"
                  placeholder="Type your password"
                  className="w-full bg-transparent outline-none font-global-tokens-body-b-3 font-[number:var(--global-tokens-body-b-3-font-weight)] text-[#222] text-[length:var(--global-tokens-body-b-3-font-size)] tracking-[var(--global-tokens-body-b-3-letter-spacing)] leading-[var(--global-tokens-body-b-3-line-height)] placeholder:text-[#d3d9e0] [font-style:var(--global-tokens-body-b-3-font-style)]"
                />
              </div>
            </div>
          </div>

          <ButtonBlue
            className="!left-[unset] !flex-[0_0_auto] !flex !w-[398px] !top-[unset]"
            divClassName="!mt-[-1.00px]"
            showLeftIcon={false}
            showRightIcon={false}
            size="s"
            state="default"
            text="Login"
            theme="primary"
            type="solid"
            onClick={handleLogin}
          />
        </div>
      </div>

      <div className="relative w-1/2 h-full">
        <Image
          className="object-contain"
          alt="Frame"
          src="/plane.svg"
          fill
          priority
        />
      </div>
    </div>
  );
};

export default Login;
