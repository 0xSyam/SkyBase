"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/groundcrew/dashboard");
  };

  return (
    <div className="min-h-svh bg-[#fffeff] flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:hidden px-5 pt-6">
        <Image
          src="/plane-mobile.svg"
          alt="SkyBase Mobile Banner"
          width={800}
          height={600}
          priority
          className="w-full h-auto rounded-[28px] object-contain"
        />
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center">
        <div className="w-full max-w-md px-5 md:px-6 lg:px-0 mx-auto flex-1 flex items-start lg:items-center">
          <div className="w-full pt-8 lg:pt-0">
            <h2 className="text-[#01295F] text-[32px] leading-[1.2] font-bold text-center mb-8">
              Welcome back!
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-[#222] text-sm font-medium"
                >
                  Username
                </label>
                <div className="rounded-lg border border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-3.5 py-2">
                  <input
                    id="username"
                    type="text"
                    placeholder="Type your username"
                    className="w-full bg-transparent outline-none text-[#222] placeholder:text-[#d3d9e0]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-[#222] text-sm font-medium"
                >
                  Password
                </label>
                <div className="rounded-lg border border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.04)] px-3.5 py-2">
                  <input
                    id="password"
                    type="password"
                    placeholder="Type your password"
                    className="w-full bg-transparent outline-none text-[#222] placeholder:text-[#d3d9e0]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#0a53c1] hover:bg-[#094db4] active:scale-[0.99] transition py-3 text-white font-semibold"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block w-full lg:w-1/2">
        <Image
          src="/plane.svg"
          alt="SkyBase Desktop Illustration"
          fill
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
