'use client';
import React, { useState } from 'react';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import type { Page } from '@/types';
import { useRouter } from 'next/navigation';
import { classNames } from 'primereact/utils';
import { useContext } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';

const Verification: Page = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const filledInput = layoutConfig.inputStyle === 'filled';
    const [value1, setValue1] = useState<number | null>();
    const [value2, setValue2] = useState<number | null>();
    const [value3, setValue3] = useState<number | null>();
    const [value4, setValue4] = useState<number | null>();
    const router = useRouter();
    const navigateToDashboard = () => {
        router.push('/');
    };

    const onDigitInput = (event: React.KeyboardEvent<HTMLSpanElement>, currentInputId: number) => {
        const isDigit = event.code.includes('Numpad') || event.code.includes('Digit');
        const isBackspace = event.code === 'Backspace';
        let nextInputId: number | null = null;

        if (isDigit) {
            nextInputId = currentInputId + 1;
        } else if (isBackspace) {
            nextInputId = currentInputId - 1;
        }

        const element = nextInputId !== null ? document.getElementById('val' + nextInputId) : null;

        if (element) {
            element.focus();
        }
    };

    return (
        <>
            <div className={classNames('surface-ground h-screen w-screen flex align-items-center justify-content-center', { 'p-input-filled': filledInput })}>
                <div className="surface-card py-7 px-5 sm:px-7 shadow-2 flex flex-column w-11 sm:w-30rem" style={{ borderRadius: '14px' }}>
                    <h1 className="font-bold text-2xl mt-0 mb-2">Verification Code</h1>
                    <p className="text-color-secondary mb-4">Enter code we sent in your mail!</p>

                    <div className="flex align-items-center mb-4 gap-2">
                        <InputNumber id="input1" inputId="val1" value={value1} onValueChange={(e) => setValue1(e.value)} inputClassName="w-5rem text-center" maxLength={1} onKeyUp={(e) => onDigitInput(e, 1)}></InputNumber>
                        <InputNumber id="input2" inputId="val2" value={value2} onValueChange={(e) => setValue2(e.value)} inputClassName="w-5rem text-center" maxLength={1} onKeyUp={(e) => onDigitInput(e, 2)}></InputNumber>
                        <InputNumber id="input3" inputId="val3" value={value3} onValueChange={(e) => setValue3(e.value)} inputClassName="w-5rem text-center" maxLength={1} onKeyUp={(e) => onDigitInput(e, 3)}></InputNumber>
                        <InputNumber id="input4" inputId="val4" value={value4} onValueChange={(e) => setValue4(e.value)} inputClassName="w-5rem text-center" maxLength={1} onKeyUp={(e) => onDigitInput(e, 4)}></InputNumber>
                    </div>

                    <Button label="Verify" className="mb-4" onClick={navigateToDashboard}></Button>
                    <span className="text-color-secondary text-center">
                        If you didn`&lsquo;`t get the mail? <span className="font-bold text-primary-500">Send code again</span>
                    </span>
                </div>
            </div>
        </>
    );
};

export default Verification;
