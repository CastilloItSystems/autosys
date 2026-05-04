'use client';
import React, { useContext, useRef } from 'react';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { StyleClass } from 'primereact/styleclass';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import type { NodeRef, Page } from '@/types';

const LandingPage: Page = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const menuRef = useRef<HTMLButtonElement>(null);
    const featuresRef = useRef<HTMLAnchorElement>(null);
    const pricingRef = useRef<HTMLAnchorElement>(null);
    const features = useRef<HTMLDivElement>(null);
    const pricing = useRef<HTMLDivElement>(null);
    const path = '/layout/images/landing/';
    const image = layoutConfig.colorScheme === 'dark' ? 'line-effect-dark.svg' : 'line-effect.svg';

    const navigateToRegister = () => {
        router.push('/auth/register');
    };

    const scrollToElement = (el: React.RefObject<HTMLDivElement>) => {
        setTimeout(() => {
            el.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 200);
    };

    return (
        <>
            <div className="surface-ground min-h-screen w-screen">
                <div className="landing-wrapper">
                    <div style={{ backgroundImage: `url(${path}${image})` }} className="bg-no-repeat bg-cover bg-bottom">
                        <div className="flex align-items-center justify-content-between px-5 sm:px-8 py-6">
                            <div className="flex align-items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <i className="pi pi-car text-4xl text-primary mr-2"></i>
                                <span className="text-2xl font-bold text-color">AUTOSYS</span>
                            </div>
                            <div className="relative">
                                <StyleClass nodeRef={menuRef as NodeRef} selector="@next" enterClassName="hidden" enterActiveClassName="scalein" leaveClassName="hidden" leaveActiveClassName="fadeout" leaveToClassName="hidden" hideOnOutsideClick>
                                    <button ref={menuRef} className="cursor-pointer block lg:hidden select-none p-link w-3rem h-3rem inline-flex align-items-center justify-content-center border-circle">
                                        <i className="pi pi-bars text-4xl"></i>
                                    </button>
                                </StyleClass>
                                <div
                                    id="landing-menu"
                                    className="hidden lg:block absolute right-0 top-auto lg:static z-1 shadow-2 lg:shadow-none w-15rem lg:w-auto surface-overlay lg:surface-ground origin-top p-3 lg:p-0"
                                    style={{ borderRadius: '14px' }}
                                >
                                    <ul className="flex flex-column lg:flex-row m-0 p-0 list-none text-2xl lg:text-base">
                                        <li>
                                            <StyleClass nodeRef={featuresRef as NodeRef} selector="#landing-menu" leaveActiveClassName="fadeout" leaveToClassName="hidden">
                                                <a ref={featuresRef} className="block p-3 cursor-pointer font-bold text-color-secondary hover:text-color transition-colors transition-duration-300" onClick={() => scrollToElement(features)}>
                                                    FUNCIONALIDADES
                                                </a>
                                            </StyleClass>
                                        </li>
                                        <li>
                                            <StyleClass nodeRef={pricingRef as NodeRef} selector="#landing-menu" leaveActiveClassName="fadeout" leaveToClassName="hidden">
                                                <a ref={pricingRef} className="block p-3 cursor-pointer font-bold text-color-secondary hover:text-color transition-colors transition-duration-300" onClick={() => scrollToElement(pricing)}>
                                                    PLANES
                                                </a>
                                            </StyleClass>
                                        </li>
                                        <li>
                                            <a className="block p-3 cursor-pointer font-bold text-color-secondary hover:text-color transition-colors transition-duration-300" onClick={navigateToRegister}>
                                                REGISTRARSE
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-column lg:flex-row gap-5 align-items-center justify-content-between px-5 sm:px-8 py-8 overflow-hidden">
                            <div className="flex-1 fadein animation-duration-1000">
                                <h1 className="font-bold text-7xl mt-0 mb-5">Gestiona tu taller automotriz</h1>
                                <p className="text-3xl mb-5 line-height-3">La solución completa para la gestión de talleres, inventario, ventas y CRM en un solo lugar.</p>
                                <Button label="COMENZAR AHORA" onClick={navigateToRegister} />
                            </div>
                            <div className="flex-1">
                                <div className="fadeinright animation-ease-in-out animation-duration-1000 w-full border-round-2xl shadow-2 bg-primary flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                                    <i className="pi pi-car text-8xl text-white"></i>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex flex-column align-items-center mb-7">
                                <span className="font-bold text-color-secondary text-2xl mb-3">Todo en uno</span>
                                <h2 className="font-bold text-6xl my-0">Todo lo que necesitas para tu taller</h2>
                            </div>
                            <div className="flex flex-column xl:flex-row justify-content-center gap-5">
                                <div className="surface-card text-center py-7 px-5 shadow-2" style={{ borderRadius: '14px' }}>
                                    <div className="text-xl text-color-secondary mb-3">Taller</div>
                                    <h3 className="mt-0 mb-3 font-bold text-4xl">Gestión de Servicios</h3>
                                    <p className="line-height-3 mb-5 text-color-secondary">
                                        Administra órdenes de trabajo, asigna técnicos y da seguimiento al estado de cada reparación en tiempo real.
                                    </p>
                                    <Button icon="pi pi-arrow-right" label="Ver más" className="p-button-text" iconPos="right"></Button>
                                    <div className="mt-8 xl:pt-8">
                                        <i className="pi pi-wrench text-8xl text-primary"></i>
                                    </div>
                                </div>
                                <div className="flex flex-column md:flex-row xl:flex-column gap-5">
                                    <div className="flex-1 surface-card flex flex-column xl:flex-row xl:align-items-center justify-content-between py-7 px-5 shadow-2 gap-5" style={{ borderRadius: '14px' }}>
                                        <div className="flex-1 flex-order-1 xl:flex-order-0 text-center xl:text-left">
                                            <i className="pi pi-box text-8xl text-orange-500"></i>
                                        </div>
                                        <div className="text-center xl:text-right flex-1">
                                            <div className="text-xl text-color-secondary mb-3">Inventario</div>
                                            <h3 className="mt-0 mb-3 font-bold text-4xl">Control de Stock</h3>
                                            <p className="line-height-3 mb-5 text-color-secondary">
                                                Gestiona repuestos, productos y suministros con control automático de inventario y alertas de stock mínimo.
                                            </p>
                                            <Button icon="pi pi-arrow-right" label="Ver más" className="p-button-text" iconPos="right"></Button>
                                        </div>
                                    </div>
                                    <div className="flex-1 surface-card flex flex-column xl:flex-row xl:align-items-center justify-content-between py-7 px-5 shadow-2 gap-5" style={{ borderRadius: '14px' }}>
                                        <div className="text-center xl:text-left flex-1">
                                            <div className="text-xl text-color-secondary mb-3">Ventas</div>
                                            <h3 className="mt-0 mb-3 font-bold text-4xl">Punto de Venta</h3>
                                            <p className="line-height-3 mb-5 text-color-secondary">Sistema de ventas integrado con facturación, control de pagos y gestión de clientes.</p>
                                            <Button icon="pi pi-arrow-right" label="Ver más" className="p-button-text" iconPos="right"></Button>
                                        </div>
                                        <div className="flex-1 text-center xl:text-right">
                                            <i className="pi pi-shopping-cart text-8xl text-green-500"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="surface-card text-center py-7 px-5 shadow-2" style={{ borderRadius: '14px' }}>
                                    <div className="text-xl text-color-secondary mb-3">CRM</div>
                                    <h3 className="mt-0 mb-3 font-bold text-4xl">Relación con Clientes</h3>
                                    <p className="line-height-3 mb-5 text-color-secondary">Gestiona leads, seguimiento de clientes y historial completo de servicios realizados.</p>
                                    <Button icon="pi pi-arrow-right" label="Ver más" className="p-button-text" iconPos="right"></Button>
                                    <div className="mt-8 xl:pt-8">
                                        <i className="pi pi-users text-8xl text-blue-500"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div ref={features} className="px-5 sm:px-8 py-8 surface-card">
                        <div className="flex flex-column lg:flex-row justify-content-center gap-5">
                            <div>
                                <div className="bg-orange-50 p-6 flex align-items-center justify-content-center mb-5" style={{ borderRadius: '14px', borderTopLeftRadius: '5rem' }}>
                                    <i className="pi pi-cog text-8xl text-orange-500"></i>
                                </div>
                                <h3 className="mt-0 mb-5 font-bold text-4xl">Multi-empresa</h3>
                                <p className="line-height-3 text-color-secondary">Gestiona múltiples talleres desde una sola plataforma con separación completa de datos por empresa.</p>
                            </div>
                            <div>
                                <div className="bg-green-50 p-6 flex align-items-center justify-content-center mb-5" style={{ borderRadius: '14px' }}>
                                    <i className="pi pi-chart-line text-8xl text-green-500"></i>
                                </div>
                                <h3 className="mt-0 mb-5 font-bold text-4xl">Reportes en Tiempo Real</h3>
                                <p className="line-height-3 text-color-secondary">Dashboards interactivos con métricas de ventas, inventario, servicios y rentabilidad.</p>
                            </div>
                            <div>
                                <div className="bg-red-50 p-6 flex align-items-center justify-content-center mb-5" style={{ borderRadius: '14px', borderBottomRightRadius: '5rem' }}>
                                    <i className="pi pi-mobile text-8xl text-red-500"></i>
                                </div>
                                <h3 className="mt-0 mb-5 font-bold text-4xl">Acceso Móvil</h3>
                                <p className="line-height-3 text-color-secondary">Accede a tu taller desde cualquier dispositivo con diseño responsive y aplicación móvil.</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-5 sm:px-8 py-8 surface-ground flex flex-wrap gap-5 align-items-center justify-content-between">
                        <div className="text-4xl font-bold">Únete a Autosys hoy mismo</div>
                        <Button label="Registrarse" className="p-button-raised" onClick={navigateToRegister}></Button>
                    </div>
                    <div ref={pricing} className="px-5 sm:px-8 py-8 surface-card flex flex-column lg:flex-row justify-content-center gap-5">
                        <div className="shadow-2 surface-card p-5 text-center border-round-2xl">
                            <div className="text-2xl font-bold mb-3">Básico</div>
                            <div className="mb-5">
                                <span className="text-6xl font-bold">$29 </span>
                                <span className="text-xl text-color-secondary">/mes</span>
                            </div>
                            <Button label="COMENZAR" className="p-button-outlined w-full mb-5" onClick={navigateToRegister} />
                            <ul className="list-none p-0 m-0 text-left">
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>1 Taller</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Gestión de Inventario</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Punto de Venta</span>
                                </li>
                                <li className="flex align-items-center">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Soporte por Email</span>
                                </li>
                            </ul>
                        </div>
                        <div className="shadow-2 surface-card p-5 text-center border-round-2xl border-2 border-primary">
                            <div className="text-2xl font-bold mb-3 text-primary">Profesional</div>
                            <div className="mb-5">
                                <span className="text-6xl font-bold">$79 </span>
                                <span className="text-xl text-color-secondary">/mes</span>
                            </div>
                            <Button label="COMENZAR" className="w-full mb-5" onClick={navigateToRegister} />
                            <ul className="list-none p-0 m-0 text-left">
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Hasta 3 Talleres</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>CRM Completo</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Reportes Avanzados</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Soporte Prioritario</span>
                                </li>
                                <li className="flex align-items-center">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>API Access</span>
                                </li>
                            </ul>
                        </div>
                        <div className="shadow-2 surface-card p-5 text-center border-round-2xl">
                            <div className="text-2xl font-bold mb-3">Enterprise</div>
                            <div className="mb-5">
                                <span className="text-6xl font-bold">$149 </span>
                                <span className="text-xl text-color-secondary">/mes</span>
                            </div>
                            <Button label="CONTACTAR" className="p-button-outlined w-full mb-5" onClick={navigateToRegister} />
                            <ul className="list-none p-0 m-0 text-left">
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Talleres Ilimitados</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Módulo Finanzas</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Integración con Dealers</span>
                                </li>
                                <li className="flex align-items-center mb-3">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Soporte 24/7</span>
                                </li>
                                <li className="flex align-items-center">
                                    <i className="pi pi-check-circle text-green-500 text-xl mr-2"></i>
                                    <span>Personalización a medida</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="px-5 sm:px-8 py-8 bg-gray-900 flex flex-column md:flex-row md:align-items-start gap-5" style={{ borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
                        <div className="flex align-items-center flex-1">
                            <i className="pi pi-car text-4xl text-primary mr-2"></i>
                            <span className="text-white text-5xl font-bold ml-2">Autosys</span>
                        </div>
                        <div className="flex-1">
                            <div className="text-xl text-gray-600 mb-4">MÓDULOS</div>
                            <ul className="list-none p-0 m-0">
                                <li className="mb-3">
                                    <a className="cursor-pointer text-white text-xl">Taller</a>
                                </li>
                                <li className="mb-3">
                                    <a className="cursor-pointer text-white text-xl">Inventario</a>
                                </li>
                                <li className="mb-3">
                                    <a className="cursor-pointer text-white text-xl">Ventas</a>
                                </li>
                                <li className="mb-3">
                                    <a className="cursor-pointer text-white text-xl">CRM</a>
                                </li>
                                <li>
                                    <a className="cursor-pointer text-white text-xl">Finanzas</a>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1">
                            <div className="text-xl text-gray-600 mb-4">RECURSOS</div>
                            <ul className="list-none p-0 m-0">
                                <li className="mb-3">
                                    <a className="cursor-pointer text-white text-xl">Documentación</a>
                                </li>
                                <li className="mb-3">
                                    <a className="cursor-pointer text-white text-xl">Soporte</a>
                                </li>
                                <li>
                                    <a className="cursor-pointer text-white text-xl">Blog</a>
                                </li>
                            </ul>
                        </div>
                        <div className="flex flex-1 gap-4">
                            <a href="https://github.com">
                                <i className="pi pi-github text-white text-5xl"></i>
                            </a>
                            <a href="https://discord.com">
                                <i className="pi pi-discord text-white text-5xl"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LandingPage;
