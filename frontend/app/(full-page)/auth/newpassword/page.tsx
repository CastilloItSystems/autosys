'use client';
import { Button } from 'primereact/button';
import React from 'react';
import type { Page } from '@/types';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { useContext } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NewPassword: Page = () => {
    const router = useRouter();
    const navigateToDashboard = () => {
        router.push('/');
    };
    const { layoutConfig } = useContext(LayoutContext);
    const filledInput = layoutConfig.inputStyle === 'filled';
    const [value, setValue] = useState<string>('');
    const [value2, setValue2] = useState<string>('');

    return (
        <>
            <div className={classNames('surface-ground h-screen w-screen flex align-items-center justify-content-center', { 'p-input-filled': filledInput })}>
                <div className="surface-card py-7 px-5 sm:px-7 shadow-2 flex flex-column w-11 sm:w-30rem" style={{ borderRadius: '14px' }}>
                    <h1 className="font-bold text-2xl mt-0 mb-2">New Password</h1>
                    <p className="text-color-secondary mb-4">Enter your new password.</p>

                    <span className="p-input-icon-left mb-4">
                        <i className="pi pi-key z-2"></i>
                        <Password
                            id="password"
                            placeholder="Password"
                            value={value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                            className="w-full"
                            inputStyle={{ paddingLeft: '2.5rem' }}
                            inputClassName="w-full "
                            toggleMask={true}
                        ></Password>
                    </span>

                    <span className="p-input-icon-left mb-4">
                        <i className="pi pi-key z-2"></i>
                        <Password
                            id="password"
                            placeholder="Confirm Password"
                            value={value2}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue2(e.target.value)}
                            className="w-full"
                            inputStyle={{ paddingLeft: '2.5rem' }}
                            inputClassName="w-full"
                            toggleMask={true}
                            feedback={false}
                        ></Password>
                    </span>

                    <Button label="Submit" onClick={navigateToDashboard}></Button>
                </div>
            </div>
        </>
    );
};

export default NewPassword;
