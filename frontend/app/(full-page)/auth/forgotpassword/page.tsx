'use client';
import React, { useState, useContext } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { Page } from '../../../../types/layout';
import { classNames } from 'primereact/utils';
import { LayoutContext } from '../../../../layout/context/layoutcontext';

const ForgotPassword: Page = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const [email, setEmail] = useState('');

    const navigateToDashboard = () => {
        router.push('/');
    };

    const filledInput = layoutConfig.inputStyle === 'filled';

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: integrar llamada API de recuperación
        navigateToDashboard();
    };

    return (
        <div className={classNames('surface-ground h-screen w-screen flex align-items-center justify-content-center px-3', { 'p-input-filled': filledInput })}>
            <form onSubmit={onSubmit} className="surface-card py-7 px-5 sm:px-7 shadow-2 flex flex-column w-11 sm:w-30rem" style={{ borderRadius: '14px' }}>
                <h1 className="font-bold text-2xl mt-0 mb-2">Recupera tu contraseña</h1>
                <p className="text-color-secondary mb-4">Introduce tu correo registrado para recibir el enlace de recuperación y vuelve a bordo de INCACORE.</p>
                <span className="p-input-icon-left mb-4">
                    <i className="pi pi-envelope"></i>
                    <InputText type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" required className="w-full" />
                </span>
                <Button type="submit" label="Enviar enlace de recuperación" disabled={!email}></Button>
            </form>
        </div>
    );
};

export default ForgotPassword;
